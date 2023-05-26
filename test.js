var c = document.getElementById("playfield"), ctx = c.getContext("2d");

//宣告一個21*10的遊戲場地
var playfield = Array(21).fill(0).map(() => Array(10).fill(0));

var type, face = 0, x = 0, y = 3, score = 0;

//初始化所有方塊
var block =
[
    [
        [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0]
        ],
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0]
        ],
        [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0]
        ]
    ],
    [
        [
            [1, 0, 0, 0],
            [1, 1, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 1, 1, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 0, 0, 0],
            [1, 1, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [1, 1, 0, 0],
            [0, 0, 0, 0]
        ]
    ],
    [
        [
            [0, 0, 1, 0],
            [1, 1, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 0, 0, 0],
            [1, 1, 1, 0],
            [1, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        [
            [1, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 0]
        ]
    ],
    [
        [
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ]
    ],
    [
        [
            [0, 1, 1, 0],
            [1, 1, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [1, 1, 0, 0],
            [0, 0, 0, 0]
        ],
        [
            [1, 0, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 0]
        ]
    ],
    [
        [
            [0, 1, 0, 0],
            [1, 1, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 0, 0, 0],
            [1, 1, 1, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 1, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 0]
        ]
    ],
    [
        [
            [1, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 0, 1, 0],
            [0, 1, 1, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 0, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 1, 0, 0],
            [1, 1, 0, 0],
            [1, 0, 0, 0],
            [0, 0, 0, 0]
        ]
    ]
];

//用key這個變數來偵測有沒有按下WASD
var key = 0;

window.addEventListener("keydown", (event) =>
{
    if (event.key == "w" || event.key == "a" || event.key == "s" || event.key == "d")
    {
        key = event.key;
    }
}, false);

window.addEventListener("keyup", () => key = 0, false);

//用draw1這個函式來設定紀錄遊戲場地的陣列
function draw1(color)
{
    for (let i = 0; i < 4; i++)
    {
        for (let j = 0; j < 4; j++)
        {
            if (block[type][face][i][j] == 1)
            {
                playfield[x + i][y + j] = color;
            }
        }
    }
}

//用draw2這個函式來把陣列畫在螢幕上
function draw2(color)
{
    for (let i = 0; i < 21; i++)
    {
        for (let j = 0; j < 10; j++)
        {
            if (color == 1 && playfield[i][j] == 1)
            {
                ctx.fillRect(j * 30, i * 30, 30, 30);
            }
            else if (color == 0 && playfield[i][j] == 0)
            {
                ctx.clearRect(j * 30, i * 30, 30, 30);
            }
        }
    }
}

//檢查正在掉落的方塊是否有碰到其他方塊或是邊緣
function check(a, b, c)
{
    if (face + a == 4)
    {
        a = -3;
    }

    for (let i = 0; i < 4; i++)
    {
        for (let j = 0; j < 4; j++)
        {
            if (block[type][face + a][i][j] == 1)
            {
                if (x + i + b >= 21 || y + j + c >= 10 || y + j + c < 0 || playfield[x + i + b][y + j + c] == 1)
                {
                    return 0;
                }
            }
        }
    }

    return 1;
}

//開始遊戲
function start()
{
    //更改畫面上的HTML跟CSS
    document.getElementById("start").hidden = true;
    document.getElementById("score").style.marginTop = "700px";
    document.getElementById("score").innerHTML = 0;

    type = Math.floor(Math.random() * 7);

    let move1 = 1, move2 = 1, count = 0;

    //主程式的迴圈
    loop1();

    function loop1()
    {
        //把正在掉落的方塊畫在陣列裡
        draw1(1);
        //比較陣列跟畫面的差異, 並把出現在畫面上的多餘方塊抹除
        draw2(0);

        //當方塊碰到底部且要放置時將觸發該條件
        if (move2 == 0)
        {
            //重置遊戲內的變數
            type = Math.floor(Math.random() * 7);
            face = 0;
            x = 0;
            y = 3;

            move1 = 1;
            move2 = 1;
            count = 0;

            let line = 0;

            //檢查遊戲場地中的每一行
            for (let i = 0; i < 21; i++)
            {
                //檢查該行是否有連成一直線
                for (let j = 0; j < 10; j++)
                {
                    if (playfield[i][j] == 1)
                    {
                        count++;
                    }
                }

                //判斷方塊是否觸頂, 是則結束遊戲
                if (i == 0 && count > 0)
                {
                    alert("遊戲結束");
                    location.reload();
                }

                //如果有湊齊一直線, 就將其消掉並紀錄下來, 消掉時也要更新陣列
                if (count == 10)
                {
                    for (let j = 0; j < 10; j++)
                    {
                        playfield[i][j] = 0;
                    }

                    for (let j = i; j > 0; j--)
                    {
                        for (let k = 0; k < 10; k++)
                        {
                            playfield[j][k] = playfield[j - 1][k];
                        }
                    }

                    for (let j = 0; j < 10; j++)
                    {
                        playfield[0][j] = 0;
                    }

                    line++;
                }

                count = 0;
            }

            //根據消掉的行數來給予分數
            if (line > 0)
            {
                if (line == 1)
                {
                    score += 10;
                }
                else if (line == 2)
                {
                    score += 30;
                }
                else if (line == 3)
                {
                    score += 60;
                }
                else
                {
                    score += 100;
                }

                document.getElementById("score").innerHTML = score;
            }

            //回到主程式開始的位置, 有點類似continue
            setTimeout(loop1, 1);
            return;
        }

        //把陣列畫在螢幕上以便更新螢幕
        draw2(1);
        //把正在掉落的方塊所走過的路徑痕跡從陣列中清除
        draw1(0);

        //檢查方塊是否還能繼續掉落, 如果能但是其底部已經碰到其它方塊或邊緣, 就用變數把該狀態紀錄下來
        if (move2 == 1)
        {
            if (check(0, 1, 0) == 1)
            {
                //讓方塊往下掉一格
                x++;
            }
            else
            {
                move1 = 0;
            }
        }

        //計時器的迴圈
        loop2();

        function loop2()
        {
            //不斷更新計時器, 並在使用者按下WASD時暫停
            if (count < 200 && key == 0)
            {
                count++;
                setTimeout(loop2, 1);
            }
            else
            {
                //在計時器完成一週期時重置
                if (count == 200)
                {
                    count = 0;

                    //如果方塊底部有碰到其他方塊或邊緣, 且計時器已經完成一週期, 則確認該方塊已經放置
                    if (move1 == 0)
                    {
                        move2 = 0;
                    }
                }

                //在WASD被按下的時候觸發
                if (key != 0)
                {
                    //避免按一次移動兩次的情況
                    if (move1 == 1)
                    {
                        x--;
                    }

                    //若能繼續掉落, 則判斷按下的鍵, 並據此決定移動方向
                    if (move2 == 1)
                    {
                        if (key == "w" && check(1, 0, 0) == 1)
                        {
                            face++;

                            if (face == 4)
                            {
                                face = 0;
                            }
                        }
                        else if (key == "a" && check(0, 0, -1) == 1)
                        {
                            y--;
                        }
                        else if (key == "s" && check(0, 1, 0) == 1)
                        {
                            x++;
                            count = 0;
                        }
                        else if (key == "d" && check(0, 0, 1) == 1)
                        {
                            y++;
                        }
                    }

                    //重置按鍵觸發的狀態
                    key = 0;
                }

                //如果移動之後方塊底部沒有碰到其他東西, 就更改負責紀錄該狀態的變數
                if (move1 == 0 && check(0, 1, 0) == 1)
                {
                    move1 = 1;
                }

                setTimeout(loop1, 1);
            }
        }
    }
}
