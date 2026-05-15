use axum::{
    extract::{Form, State},
    http::{header, StatusCode},
    response::{Html, IntoResponse, Redirect, Response},
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tera::{Context, Tera};
use tower_service::Service;
use uuid::Uuid;
use worker::*;

// ─── Models ──────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Player {
    id: Option<i64>,
    act: String,
    psw: String,
    email: String,
    scores: i64,
}

// ─── App State ────────────────────────────────────────────────────────────────

/// EnvWrap makes worker::Env usable in Axum State.
/// SAFETY: Cloudflare Workers are single-threaded WASM — no actual concurrency.
struct EnvWrap(Env);
unsafe impl Send for EnvWrap {}
unsafe impl Sync for EnvWrap {}

#[derive(Clone)]
struct AppState {
    env: Arc<EnvWrap>,
    tera: &'static Tera,
}

fn get_tera() -> &'static Tera {
    static TERA: std::sync::OnceLock<Tera> = std::sync::OnceLock::new();
    TERA.get_or_init(|| {
        let mut tera = Tera::default();
        tera.add_raw_templates(vec![
            ("login.html",       include_str!("../templates/login.html")),
            ("signup.html",      include_str!("../templates/signup.html")),
            ("find.html",        include_str!("../templates/find.html")),
            ("game.html",        include_str!("../templates/game.html")),
            ("rank.html",        include_str!("../templates/rank.html")),
            ("information.html", include_str!("../templates/information.html")),
        ])
        .expect("Failed to load templates");
        tera
    })
}

// ─── Session helpers ─────────────────────────────────────────────────────────

async fn get_session_player(env: &Env, sid: Option<&str>) -> Option<Player> {
    let sid = sid?;
    let kv = env.kv("SESSIONS").ok()?;
    let json = kv.get(sid).text().await.ok()??;
    serde_json::from_str(&json).ok()
}

async fn set_session(env: &Env, player: &Player) -> Result<String> {
    let sid = Uuid::new_v4().to_string();
    let kv = env.kv("SESSIONS")?;
    kv.put(&sid, serde_json::to_string(player).unwrap())?
        .expiration_ttl(86400)
        .execute()
        .await?;
    Ok(sid)
}

async fn delete_session(env: &Env, sid: &str) -> Result<()> {
    env.kv("SESSIONS")?.delete(sid).await
        .map_err(|e| worker::Error::RustError(format!("{e:?}")))
}

fn extract_sid(headers: &axum::http::HeaderMap) -> Option<String> {
    let cookie_hdr = headers.get(header::COOKIE)?.to_str().ok()?;
    cookie_hdr.split(';').find_map(|part| {
        part.trim().strip_prefix("sid=").map(|v| v.to_string())
    })
}

fn make_cookie(value: &str, max_age: i64) -> String {
    format!("sid={}; Path=/; HttpOnly; SameSite=Lax; Max-Age={}", value, max_age)
}

// ─── Form structs ────────────────────────────────────────────────────────────

#[derive(Deserialize)]
struct LoginForm  { act: String, psw: String }

#[derive(Deserialize)]
struct SignupForm  { email: String, act: String, psw: String, psw2: String }

#[derive(Deserialize)]
struct FindForm   { email: String, psw: String, psw2: String }

#[derive(Deserialize)]
struct ScoresForm { score: i64 }

// ─── Handlers ────────────────────────────────────────────────────────────────

#[worker::send]
async fn login_get(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
) -> Response {
    let env = &state.env.0;
    let sid = extract_sid(&headers);
    if get_session_player(env, sid.as_deref()).await.is_some() {
        return Redirect::to("/game").into_response();
    }
    let mut ctx = Context::new();
    ctx.insert("wrong", &true);
    ctx.insert("act", &"");
    Html(state.tera.render("login.html", &ctx).unwrap()).into_response()
}

#[worker::send]
async fn login_post(
    State(state): State<AppState>,
    _headers: axum::http::HeaderMap,
    Form(form): Form<LoginForm>,
) -> Response {
    let env = &state.env.0;
    if form.act.is_empty() && form.psw.is_empty() {
        return Redirect::to("/game").into_response();
    }
    if form.act.is_empty() || form.psw.is_empty() {
        let mut ctx = Context::new();
        ctx.insert("wrong", &false);
        ctx.insert("act", &form.act);
        return Html(state.tera.render("login.html", &ctx).unwrap()).into_response();
    }

    let db = env.d1("DB").unwrap();
    let result = db
        .prepare("SELECT id, act, psw, email, scores FROM players WHERE act = ?1")
        .bind(&[form.act.clone().into()]).unwrap()
        .first::<Player>(None).await;

    match result {
        Ok(Some(player)) if player.psw == form.psw => {
            let sid = set_session(env, &player).await.unwrap_or_default();
            (
                StatusCode::SEE_OTHER,
                [
                    (header::LOCATION, "/game".to_string()),
                    (header::SET_COOKIE, make_cookie(&sid, 86400)),
                ],
            ).into_response()
        }
        _ => {
            let mut ctx = Context::new();
            ctx.insert("wrong", &false);
            ctx.insert("act", &form.act);
            Html(state.tera.render("login.html", &ctx).unwrap()).into_response()
        }
    }
}

#[worker::send]
async fn logout(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
) -> Response {
    let env = &state.env.0;
    if let Some(sid) = extract_sid(&headers) {
        let _ = delete_session(env, &sid).await;
    }
    (
        StatusCode::SEE_OTHER,
        [
            (header::LOCATION, "/".to_string()),
            (header::SET_COOKIE, make_cookie("", 0)),
        ],
    ).into_response()
}

#[worker::send]
async fn signup_get(State(state): State<AppState>) -> Html<String> {
    let mut ctx = Context::new();
    ctx.insert("s", &"");
    ctx.insert("email", &"");
    ctx.insert("act", &"");
    ctx.insert("psw", &"");
    ctx.insert("psw2", &"");
    Html(state.tera.render("signup.html", &ctx).unwrap())
}

#[worker::send]
async fn signup_post(
    State(state): State<AppState>,
    Form(form): Form<SignupForm>,
) -> Response {
    let env = &state.env.0;
    let db = env.d1("DB").unwrap();

    let mut s = String::new();
    if form.email.is_empty() { s.push_str("E-mail "); }
    if form.act.is_empty()   { s.push_str("帳號 ");  }
    if form.psw.is_empty()   { s.push_str("密碼 ");  }
    if form.psw2.is_empty()  { s.push_str("確認密碼 "); }

    macro_rules! signup_err {
        ($msg:expr) => {{
            let mut ctx = Context::new();
            ctx.insert("s", $msg);
            ctx.insert("email", &form.email);
            ctx.insert("act", &form.act);
            ctx.insert("psw", &"");
            ctx.insert("psw2", &"");
            return Html(state.tera.render("signup.html", &ctx).unwrap()).into_response();
        }};
    }

    if !s.is_empty() { s.push_str("不得為空"); signup_err!(&s); }
    if form.psw != form.psw2 { signup_err!("密碼與確認密碼不一致"); }

    let act_exists = db.prepare("SELECT id FROM players WHERE act = ?1")
        .bind(&[form.act.clone().into()]).unwrap()
        .first::<serde_json::Value>(None).await.unwrap_or(None);
    if act_exists.is_some() { signup_err!("帳號 ID 已被使用"); }

    let email_exists = db.prepare("SELECT id FROM players WHERE email = ?1")
        .bind(&[form.email.clone().into()]).unwrap()
        .first::<serde_json::Value>(None).await.unwrap_or(None);
    if email_exists.is_some() { signup_err!("此 E-mail 已被使用"); }

    match db.prepare("INSERT INTO players (act, psw, email, scores) VALUES (?1, ?2, ?3, 0)")
        .bind(&[form.act.into(), form.psw.into(), form.email.into()]).unwrap()
        .run().await {
            Ok(_) => (),
            Err(_) => signup_err!("資料庫錯誤 (可能尚未初始化)"),
        };

    Redirect::to("/").into_response()
}

#[worker::send]
async fn find_get(State(state): State<AppState>) -> Html<String> {
    let mut ctx = Context::new();
    ctx.insert("s", &"");
    ctx.insert("email", &"");
    ctx.insert("psw", &"");
    ctx.insert("psw2", &"");
    Html(state.tera.render("find.html", &ctx).unwrap())
}

#[worker::send]
async fn find_post(
    State(state): State<AppState>,
    Form(form): Form<FindForm>,
) -> Response {
    let env = &state.env.0;
    let db = env.d1("DB").unwrap();

    macro_rules! find_err {
        ($msg:expr, $p:expr, $p2:expr) => {{
            let mut ctx = Context::new();
            ctx.insert("s", $msg);
            ctx.insert("email", &form.email);
            ctx.insert("psw", $p);
            ctx.insert("psw2", $p2);
            return Html(state.tera.render("find.html", &ctx).unwrap()).into_response();
        }};
    }

    let mut s = String::new();
    if form.email.is_empty() { s.push_str("E-mail "); }
    if form.psw.is_empty()   { s.push_str("密碼 ");  }
    if form.psw2.is_empty()  { s.push_str("確認密碼 "); }
    if !s.is_empty() {
        s.push_str("不得為空");
        find_err!(&s, &form.psw, &form.psw2);
    }

    let player = db.prepare("SELECT id FROM players WHERE email = ?1")
        .bind(&[form.email.clone().into()]).unwrap()
        .first::<serde_json::Value>(None).await.unwrap_or(None);

    if player.is_none() { find_err!("此 E-mail 不存在", &form.psw, &form.psw2); }
    if form.psw != form.psw2 { find_err!("密碼與確認密碼不一致", &"", &""); }

    match db.prepare("UPDATE players SET psw = ?1 WHERE email = ?2")
        .bind(&[form.psw.into(), form.email.into()]).unwrap()
        .run().await {
            Ok(_) => (),
            Err(_) => find_err!("資料庫錯誤 (更新失敗)", &form.psw, &form.psw2),
        };

    Redirect::to("/").into_response()
}

#[worker::send]
async fn information_get(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
) -> Response {
    let env = &state.env.0;
    let sid = extract_sid(&headers);
    match get_session_player(env, sid.as_deref()).await {
        None => Redirect::to("/").into_response(),
        Some(p) => {
            let db = env.d1("DB").unwrap();
            let fresh = db
                .prepare("SELECT id, act, psw, email, scores FROM players WHERE act = ?1")
                .bind(&[p.act.clone().into()]).unwrap()
                .first::<Player>(None).await.unwrap_or(None)
                .unwrap_or(p);
            let mut ctx = Context::new();
            ctx.insert("player", &fresh);
            Html(state.tera.render("information.html", &ctx).unwrap()).into_response()
        }
    }
}

#[worker::send]
async fn game_get(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
) -> Html<String> {
    let env = &state.env.0;
    let sid = extract_sid(&headers);
    let player = get_session_player(env, sid.as_deref()).await;
    let mut ctx = Context::new();
    ctx.insert("player", &player);
    Html(state.tera.render("game.html", &ctx).unwrap())
}

#[worker::send]
async fn scores_post(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
    Form(form): Form<ScoresForm>,
) -> Response {
    let env = &state.env.0;
    let sid = extract_sid(&headers);
    if let Some(player) = get_session_player(env, sid.as_deref()).await {
        if form.score > player.scores {
            let db = env.d1("DB").unwrap();
            let _ = db
                .prepare("UPDATE players SET scores = ?1 WHERE act = ?2")
                .bind(&[form.score.into(), player.act.into()]).unwrap()
                .run().await;
        }
    }
    Redirect::to("/game").into_response()
}

#[worker::send]
async fn rank_get(State(state): State<AppState>) -> Response {
    let env = &state.env.0;
    let db = env.d1("DB").unwrap();
    let results = match db
        .prepare("SELECT id, act, psw, email, scores FROM players ORDER BY scores DESC")
        .all().await {
            Ok(r) => r,
            Err(e) => return Html(format!("Database error: {:?}", e)).into_response(),
        };
    
    let list = match results.results::<Player>() {
        Ok(l) => l,
        Err(e) => return Html(format!("Deserialization error: {:?}", e)).into_response(),
    };

    let mut ctx = Context::new();
    ctx.insert("list", &list);
    
    match state.tera.render("rank.html", &ctx) {
        Ok(html) => Html(html).into_response(),
        Err(e) => Html(format!("Template error: {:?}", e)).into_response(),
    }
}

// ─── Entry Point ─────────────────────────────────────────────────────────────

#[event(fetch)]
pub async fn main(
    req: HttpRequest,
    env: Env,
    _ctx: worker::Context,
) -> Result<http::Response<axum::body::Body>> {
    console_error_panic_hook::set_once();

    let state = AppState {
        env: Arc::new(EnvWrap(env)),
        tera: get_tera(),
    };

    let mut router = Router::new()
        .route("/",            get(login_get).post(login_post))
        .route("/logout",      get(logout))
        .route("/signup",      get(signup_get).post(signup_post))
        .route("/find",        get(find_get).post(find_post))
        .route("/information", get(information_get))
        .route("/game",        get(game_get))
        .route("/scores",      post(scores_post))
        .route("/rank",        get(rank_get))
        .with_state(state);

    Ok(router.call(req).await?)
}
