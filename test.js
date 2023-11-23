import { Application, Router, send } from "https://deno.land/x/oak/mod.ts";
import { Session } from "https://deno.land/x/oak_sessions/mod.ts";
import { viewEngine, ejsEngine, oakAdapter } from "https://deno.land/x/view_engine@v10.5.1/mod.ts"
import { Bson,MongoClient } from "https://deno.land/x/mongo@v0.32.0/mod.ts";

const client = new MongoClient();

const TETRIS_KEY = "ongodb+srv://wrr606:7777kkkk@tw.qvruupb.mongodb.net/tw?authMechanism=SCRAM-SHA-1";

await client.connect(TETRIS_KEY);

const db = client.database();
const players = db.collection("players");

const user1 = await players.findOne({ psw:"123" });

