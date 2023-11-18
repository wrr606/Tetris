import { Application, Router, send } from "https://deno.land/x/oak/mod.ts";
import { DB } from "https://deno.land/x/sqlite/mod.ts";
import { Session } from "https://deno.land/x/oak_sessions/mod.ts";
import { viewEngine, ejsEngine, oakAdapter } from "https://deno.land/x/view_engine@v10.5.1/mod.ts"

const app = new Application()

const db = new DB("players.db");
db.query("CREATE TABLE IF NOT EXISTS players (id INTEGER PRIMARY KEY AUTOINCREMENT, act TEXT UNIQUE, psw TEXT, email TEXT UNIQUE, scores INTEGER)");

const router = new Router()

router.get('/', login)
  .post('/',login_post)
  .get('/logout', logout)
  .get('/game', game)
  .get('/signup',signup)
  .post('/signup',signup_post)
  .get('/find',find)
  .post('/find',find_post)
  .get('/information',information)
  .post('/scores',scores_update)
  .get('/rank',rank)
  .get('/(.*)', pb)

app.use(Session.initMiddleware())
app.use(viewEngine(oakAdapter, ejsEngine));
app.use(router.routes())
app.use(router.allowedMethods())

function sqlcmd(sql, arg1) {
  console.log('sql:', sql)
  try {
    var results = db.query(sql, [arg1])
    console.log('sqlcmd: results=', results)
    return results
  } catch (error) {
    console.log('sqlcmd error: ', error)
    throw error
  }
}

function userQuery(sql,arg1) {
  let list = []
  for (const [id, act, psw, email, scores] of sqlcmd(sql,arg1)) {
    list.push({id, act, psw, email, scores})
  }
  console.log('userQuery: list=', list)
  return list
}

async function login(ctx) {
  try{
    var player=await ctx.state.session.get('player')
  }
  catch{
    var player=null
  }
  if(player==null){
    let wrong=true,act=""
    ctx.render("template/login.ejs",{wrong,act});
  }
  else
    ctx.response.redirect('/game');
}

async function login_post(ctx){
  const body=ctx.request.body()
  if(body.type === "form"){
    const pairs = await body.value
    console.log('pairs=', pairs)
    const params = {}
    for (const [key, value] of pairs) {
      params[key] = value
    }
    console.log('params=', params)
    let act = params['act']
    let psw = params['psw']
    console.log(`act=${act} psw=${psw}`)
    if(act==""&&psw==""){
      ctx.response.redirect('/game');
    }
    else if(act==""||psw==""){
      let wrong=false
      ctx.render("template/login.ejs",{wrong,act});
    }
    else{
      let player=userQuery(`SELECT * FROM players WHERE act=?`,act)[0]
      console.log("player:",player)
      if(player.psw==psw){
        await ctx.state.session.set('player', player);
        ctx.response.redirect('/game');
      }
      else{
        let wrong=false
        ctx.render("template/login.ejs",{wrong,act});
      }
    }
  }
}

async function logout(ctx) {
  await ctx.state.session.set('player', null)
  ctx.response.redirect('/')
}

async function signup(ctx) {
  let s="",email="",act="",psw="",psw2=""
  ctx.render("template/signup.ejs",{s,email,act,psw,psw2});
}

async function signup_post(ctx){
  const body=ctx.request.body()
  if(body.type === "form"){
    const pairs = await body.value
    console.log('pairs=', pairs)
    const params = {}
    for (const [key, value] of pairs) {
      params[key] = value
    }
    console.log('params=', params)
    let s="",email=params["email"],act=params["act"],psw=params["psw"],psw2=params["psw2"]
    if(params["email"]=="")
      s+="E-mail "
    if(params["act"]=="")
      s+="帳號 "
    if(params["psw"]=="")
      s+="密碼 "
    if(params["psw2"]=="")
      s+="確認密碼 "
    if(s!=""){
      s+="不得為空"
      ctx.render("template/signup.ejs",{s,email,act,psw,psw2});
    }
    else if(psw!=psw2){
      s="密碼與確認密碼不一致"
      psw="",psw2=""
      ctx.render("template/signup.ejs",{s,email,act,psw,psw2});
    }
    else{
      const act_exist=userQuery(`SELECT * FROM players WHERE act=?`,act)[0]
      const email_exist=userQuery(`SELECT * FROM players WHERE email=?`,email)[0]
      if(act_exist){
        s="帳號 ID 已被使用"
        ctx.render("template/signup.ejs",{s,email,act,psw,psw2});
      }
      else if(email_exist){
        s="此 E-mail 已被使用"
        ctx.render("template/signup.ejs",{s,email,act,psw,psw2});
      }
      else{
        db.query("INSERT INTO players (act,psw,email,scores) VALUES (?,?,?,?)",
        [act,psw,email,0]);
        ctx.response.redirect('/');
      }
    }
  }
}

async function find(ctx) {
  let s="",email="",psw="",psw2=""
  ctx.render("template/find.ejs",{s,email,psw,psw2});
}

async function find_post(ctx){
  const body=ctx.request.body()
  if(body.type === "form"){
    const pairs = await body.value
    console.log('pairs=', pairs)
    const params = {}
    for (const [key, value] of pairs) {
      params[key] = value
    }
    let player = userQuery(`SELECT * FROM players WHERE email=?`,params["email"])[0]
    console.log("params:",params)
    let s="",email=params["email"],psw=params["psw"],psw2=params["psw2"]
    if(params["email"]=="")
      s+="E-mail "
    if(params["psw"]=="")
      s+="密碼 "
    if(params["psw2"]=="")
      s+="確認密碼 "
    if(s!=""){
      s+="不得為空"
      ctx.render("template/find.ejs",{s,email,psw,psw2});
    }
    else if(!player){
      s="此 E-mail 不存在"
      ctx.render("template/find.ejs",{s,email,psw,psw2});
    }
    else if(params["psw"]==params["psw2"]){
      db.query("UPDATE players SET psw = ? WHERE email = ?", [params["psw"], params["email"]]);
      ctx.response.redirect('/');
    }
    else{
      s="密碼與確認密碼不一致",psw="",psw2=""
      ctx.render("template/find.ejs",{s,email,psw,psw2});
    }
  }
}

async function information(ctx) {
  let cur=await ctx.state.session.get('player')
  let player = userQuery(`SELECT * FROM players WHERE act=?`,cur.act)[0]
  console.log("state",player)
  ctx.render("template/information.ejs",{player});
}

async function scores_update(ctx){
  const body=ctx.request.body()
  const value = await body.value
  console.log('scores=', value)
  try{
    var player=await ctx.state.session.get('player')
    if(player.scores<value.score)
      db.query("UPDATE players SET scores = ? WHERE act = ?", [value.score, player.act]);
  }
  catch{
    var player=null
  }
  ctx.response.redirect('/game');
}

async function game(ctx) {
  try{
    var player=await ctx.state.session.get('player')
  }
  catch{
    var player=null
  }
  ctx.render("template/tetris.ejs",{player});
}

async function rank(ctx) {
  const list = db.query("SELECT * FROM players ORDER BY scores DESC");
  ctx.render("template/rank.ejs",{list});
}

async function pb(ctx) {
  console.log('path=', ctx.request.url.pathname)
  let path = ctx.params[0]
  await send(ctx, path, {
    root: Deno.cwd()+'/template',
    index: "index.html",
  });
}

console.log('Server run at http://127.0.0.1:8000')
await app.listen({ port: 8000 })