import { Application, Router, send } from "https://deno.land/x/oak/mod.ts";
import { Session } from "https://deno.land/x/oak_sessions/mod.ts";
import { viewEngine, ejsEngine, oakAdapter } from "https://deno.land/x/view_engine@v10.5.1/mod.ts"
import { Bson,MongoClient } from "https://deno.land/x/mongo@v0.32.0/mod.ts";

const app = new Application()
const client = new MongoClient();
 
const TETRIS_KEY = Deno.env.get("TETRIS_KEY");

interface user {
  _id: Bson.ObjectId;
  act: string;
  psw: string;
  email: string;
  scores: number;
}

await client.connect(TETRIS_KEY);

const db = client.database();
const players = db.collection<user>("players");

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

async function login(ctx) {
  try{
    var player=await ctx.state.session.get('player')
  }
  catch{
    var player=null
  }
  if(player==null){
    let wrong=true,act=""
    ctx.render("Tetris/template/login.ejs",{wrong,act});
  }
  else
    ctx.response.redirect('/game');
}

async function login_post(ctx){
  const body=ctx.request.body
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
      ctx.render("Tetris/template/login.ejs",{wrong,act});
    }
    else{
      const player = await players.findOne({ act: act });
      console.log("player:",player)
      if(player.psw==psw){
        await ctx.state.session.set('player', player);
        ctx.response.redirect('/game');
      }
      else{
        let wrong=false
        ctx.render("Tetris/template/login.ejs",{wrong,act});
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
  ctx.render("Tetris/template/signup.ejs",{s,email,act,psw,psw2});
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
      ctx.render("Tetris/template/signup.ejs",{s,email,act,psw,psw2});
    }
    else if(psw!=psw2){
      s="密碼與確認密碼不一致"
      psw="",psw2=""
      ctx.render("Tetris/template/signup.ejs",{s,email,act,psw,psw2});
    }
    else{
      const act_exist = await players.findOne({ act: act });
      const email_exist = await players.findOne({ email: email });
      if(act_exist){
        s="帳號 ID 已被使用"
        ctx.render("Tetris/template/signup.ejs",{s,email,act,psw,psw2});
      }
      else if(email_exist){
        s="此 E-mail 已被使用"
        ctx.render("Tetris/template/signup.ejs",{s,email,act,psw,psw2});
      }
      else{
        const insertId = await players.insertOne({
          act: act,
          psw: psw,
          email: email,
          scores: 0,
        });
        ctx.response.redirect('/');
      }
    }
  }
}

async function find(ctx) {
  let s="",email="",psw="",psw2=""
  ctx.render("Tetris/template/find.ejs",{s,email,psw,psw2});
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
    const player = await players.findOne({ email: params["email"] });
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
      ctx.render("Tetris/template/find.ejs",{s,email,psw,psw2});
    }
    else if(!player){
      s="此 E-mail 不存在"
      ctx.render("Tetris/template/find.ejs",{s,email,psw,psw2});
    }
    else if(params["psw"]==params["psw2"]){
      const { matchedCount, modifiedCount, upsertedId } = await players.updateOne(
        { email: params["email"] },
        { $set: { psw: params["psw"] } },
      );
      ctx.response.redirect('/');
    }
    else{
      s="密碼與確認密碼不一致",psw="",psw2=""
      ctx.render("Tetris/template/find.ejs",{s,email,psw,psw2});
    }
  }
}

async function information(ctx) {
  let cur=await ctx.state.session.get('player')
  const player = await players.findOne({ act: cur.act });
  console.log("state",player)
  ctx.render("Tetris/template/information.ejs",{player});
}

async function scores_update(ctx){
  const body=ctx.request.body()
  const value = await body.value
  console.log('scores=', value)
  try{
    var player=await ctx.state.session.get('player')
    if(player.scores<value.score){
      const { matchedCount, modifiedCount, upsertedId } = await players.updateOne(
        { act: player.act },
        { $set: { scores: value.score } },
      );
    }
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
  ctx.render("Tetris/template/tetris.ejs",{player});
}

async function rank(ctx) {
  let list = await players.find({}).sort({ scores: -1 }).toArray();
  for(let i=0;i<list.length;i++)
    list[i]._id=i+1
  console.log("rank",list);
  ctx.render("Tetris/template/rank.ejs",{list});
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
