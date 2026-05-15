# Tetris
具有帳號及排名系統的線上俄羅斯方塊。

本專案經歷了框架重構，從原本的 Deno 框架重構為基於 Rust 的 Axum 架構，當前版本為 Tetris_v3。

## Tetris_v3
後端採用 Rust 語言與 Axum 框架開發，並編譯為 WebAssembly (Wasm) 部署於 Cloudflare Workers。

前端使用 Askama 進行模板渲染。

分數及帳號資料使用 Cloudflare D1 作為資料庫儲存，使用者 Session 狀態使用 Cloudflare Workers KV 進行儲存。

### 具備功能：
- 俄羅斯方塊前端部分
- 帳號系統（註冊、登入、修改密碼）
- 排名系統（將最高分數與其他玩家排名）
- 支持訪客登入 (不輸入賬密按下登入即為訪客)
#### 遊戲功能
- hold 功能（能夠先暫存一個方塊）
- next 功能（預覽未來四個方塊）
- garbage line 功能（會長出垃圾行增加難度）
- hard drop（硬降，立刻放下方塊）
- preview（能夠預覽 hard drop 後的方塊）
- 順逆時鐘旋轉、180 度旋轉

### 展示：
https://tetris.111110517.xyz

![image](https://github.com/wrr606/Tetris/blob/main/README_image/sever1.png)
![image](https://github.com/wrr606/Tetris/blob/main/README_image/sever2.png)
![image](https://github.com/wrr606/Tetris/blob/main/README_image/sever3.png)
![image](https://github.com/wrr606/Tetris/blob/main/README_image/sever4.png)

### 使用他人專案部分：
背景直接使用了 https://github.com/VincentGarreau/particles.js 粒子特效來美化畫面

## 如何部屬
### 部屬前置作業
本專案的後端與資料庫皆託管於 Cloudflare，因此在開始之前，請確保您已註冊並擁有一個 [Cloudflare 帳號](https://dash.cloudflare.com/sign-up)。

### Step 1: 創建 D1 資料庫
在 Cloudflare 找到 D1 資料庫頁面。

![image](https://github.com/wrr606/Tetris/blob/main/README_image/step1.png)

點擊右上角「建立資料庫」，名稱輸入 tetris-db 並按下「建立」。

建立好後在 tetris-db 中的主控台頁面輸入
```sql
CREATE TABLE IF NOT EXISTS players (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    act    TEXT    NOT NULL UNIQUE,
    psw    TEXT    NOT NULL,
    email  TEXT    NOT NULL UNIQUE,
    scores INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_players_act   ON players(act);
CREATE INDEX IF NOT EXISTS idx_players_email ON players(email);
CREATE INDEX IF NOT EXISTS idx_players_scores ON players(scores DESC);
```
並按下「執行按鈕」。

![image](https://github.com/wrr606/Tetris/blob/main/README_image/step1-2.png)

接著將 tetris-db 的 UUID 貼到 wrangler.toml 的 database_id 上。

### Step 2: 創建 Workers KV
在 Cloudflare 找到 Workers KV 頁面

![image](https://github.com/wrr606/Tetris/blob/main/README_image/step2.png)

點擊右上角「Create Instance」，名稱輸入 SESSIONS 並按下「建立」。

接著將 SESSIONS 的 ID 貼到 wrangler.toml 的 id 上。

### Step 3: 設定 GitHub Actions
GitHub Actions 需要權限才能代表你部屬。
前往 [Cloudflare Dash - API Tokens](https://dash.cloudflare.com/profile/api-tokens)。

![image](https://github.com/wrr606/Tetris/blob/main/README_image/step3.png)

點擊右上角「建立 Token」，使用「編輯 Cloudflare Workers」範本。

![image](https://github.com/wrr606/Tetris/blob/main/README_image/step3-2.png)

填上「帳戶資源」和「區域資源」。

進入 GitHub 專案頁面，點擊「Settings」->「Secrets and variables」->「Actions」。

點擊「New repository secret」，名稱輸入 CLOUDFLARE_API_TOKEN，下面貼上剛剛的 Token。

### Step 4: 創建 Workers
在 Cloudflare 找到 Workers 和 Pages 頁面

![image](https://github.com/wrr606/Tetris/blob/main/README_image/step4.png)

點擊右上角「建立應用程式」，方法選擇「Continue with GitHub」，接著一路下一步即可。
 
## 歷史版本
### Tetris_v2
Deno 做為後端，EJS 模板引擎生成前端畫面，使用 MongoDB Atlas 託管資料庫，並部屬在 Deno Deploy 上。

但因為 Deno Deploy 大改，原本的東西全都不見了，索性直接重構。

畫面與當前版本 Tetris_v3 並無任何差別。

### Tetris_v1
只有俄羅斯方塊的前端部分，使用 HTML、CSS、JavaScript 製作

#### 展示：
網站：https://wrr606.github.io/Tetris/Tetris_v1/tetris.html

![image](https://github.com/wrr606/Tetris/blob/main/README_image/front.png)