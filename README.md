# Tetris
具有帳號及排名系統的俄羅斯方塊

## 後端部分
Deno 做為後端，EJS 模板引擎生成前端畫面，使用 MongoDB Atlas 託管資料庫，並部屬在 Deno Deploy 上
### 具備功能：
- 俄羅斯方塊前端部分
- 帳號系統（註冊、登入、修改密碼）
- 排名系統（將最高分數與其他玩家排名）
- 支持訪客登入

### 展示：
https://tetris.deno.dev/game
**目前 MongoDB 版本過舊導致停用託管，故無法使用登入系統，只能以訪客直接進入遊戲主畫面，此問題後續會進行修復**

![image](https://github.com/wrr606/Tetris/blob/main/exhibit_image/sever1.png)
![image](https://github.com/wrr606/Tetris/blob/main/exhibit_image/sever2.png)
![image](https://github.com/wrr606/Tetris/blob/main/exhibit_image/sever3.png)
![image](https://github.com/wrr606/Tetris/blob/main/exhibit_image/sever4.png)

### 使用：
背景直接使用了 https://github.com/VincentGarreau/particles.js 粒子特效來美化畫面
 
## 前端部分
使用 HTML、CSS、JavaScript 製作
### 具備功能：
- hold 功能（能夠先暫存一個方塊）
- next 功能（預覽未來四個方塊）
- garbage line 功能（會長出垃圾行增加難度）
- hard drop（硬降，立刻放下方塊）
- preview（能夠預覽 hard drop 後的方塊）
- 順逆時鐘旋轉、180 度旋轉

### 前端展示：
網站：https://wrr606.github.io/Tetris/Tetris_only_front_end/tetris.html

![image](https://github.com/wrr606/Tetris/blob/main/exhibit_image/front.png)

### 製作思路參考：

- https://reurl.cc/OV24AX
- https://reurl.cc/Zy331p

### 程式碼參考：

- https://youtu.be/rAUn1Lom6dw - youtube影片
- https://github.com/kubowania/Tetris-Basic - github

參考她的俄羅斯方塊程式是**如何刷新畫面以及方塊下落作法**
參考程度**15%**

使用 ChatGPT **查詢 CSS 參數、JavaScript 內建函式功能及使用**，只用來查詢。
