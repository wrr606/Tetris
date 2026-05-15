let tetris = {
  "i": [
    [10, 11, 12, 13],
    [2, 12, 22, 32],
    [20, 21, 22, 23],
    [1, 11, 21, 31],
  ],
  "o": [
    [0, 1, 10, 11],
    [0, 1, 10, 11],
    [0, 1, 10, 11],
    [0, 1, 10, 11],
  ],
  "j": [
    [0, 10, 11, 12],
    [2, 1, 11, 21],
    [10, 11, 12, 22],
    [1, 11, 21, 20],
  ],
  "l": [
    [2, 10, 11, 12],
    [1, 11, 21, 22],
    [10, 11, 12, 20],
    [0, 1, 11, 21],
  ],
  "s": [
    [1, 2, 10, 11],
    [1, 11, 12, 22],
    [11, 12, 20, 21],
    [0, 10, 11, 21],
  ],
  "t": [
    [1, 10, 11, 12],
    [1, 11, 12, 21],
    [10, 11, 12, 21],
    [1, 10, 11, 21],
  ],
  "z": [
    [0, 1, 11, 12],
    [2, 11, 12, 21],
    [10, 11, 21, 22],
    [1, 10, 11, 20],
  ],
};

let tetris_5x5 = {
  "i": [
    [0, 1, 2, 3],
  ],
  "o": [
    [0, 1, 5, 6],
  ],
  "j": [
    [0, 5, 6, 7],
  ],
  "l": [
    [2, 5, 6, 7],
  ],
  "s": [
    [1, 2, 5, 6],
  ],
  "t": [
    [1, 5, 6, 7],
  ],
  "z": [
    [0, 1, 6, 7],
  ],
};
  
//每個方塊的起始位置offset設定
let begin_station = {
  "i": 3,
  "o": 4,
  "j": 3,
  "l": 3,
  "s": 3,
  "t": 3,
  "z": 3,
};

let current = null,
  next = null,
  hold_temp = null,
  sequence = "",
  offset = 3,
  rotate = 0,
  can_hold = true,
  down = true,
  setTimeout_time = 1000,
  speed = 500,
  garbage = false,
  scores = 0;
let grids = Array.from(document.querySelectorAll(".grid div"));
let hold_grids = Array.from(document.querySelectorAll(".hold div"));
let next_grids = Array.from(document.querySelectorAll(".next div"));

//輸出格子
function begin() {
  let temp_grids = "";
  for (let i = 0; i < 200; i++) {
    temp_grids += `<div></div>`;
  }
  document.querySelector(".grid").innerHTML = temp_grids;
  temp_grids = "";
  for (let i = 0; i < 25; i++) {
    temp_grids += `<div></div>`;
  }
  document.querySelector(".hold").innerHTML = temp_grids;
  temp_grids = "";
  for (let i = 0; i < 100; i++) {
    temp_grids += `<div></div>`;
  }
  document.querySelector(".next").innerHTML = temp_grids;
  grids = Array.from(document.querySelectorAll(".grid div"));
  hold_grids = Array.from(document.querySelectorAll(".hold div"));
  next_grids = Array.from(document.querySelectorAll(".next div"));
}

begin();
startTimer();

current = tetris[sequence[0]];

//每個方塊的起始位置創建
function creat_tetris() {
  setTimeout_time = 1000;
  for (let i of hold_grids) {
    for (let j of "loszijt") {
      i.classList.remove(j);
      i.classList.remove("gray");
    }
  }
  if (hold_temp) {
    for (let i of tetris_5x5[hold_temp][0]) {
      hold_grids[i + 6].classList.add(`${hold_temp}`);
    }
  }
  rotate = 0;
  if (sequence.length <= 7) {
    let s = "loszijt";
    s = s.split("");
    s.sort(function () {
      return 0.5 - Math.random();
    });
    sequence += s.join("");
  }
  if (!current) {
    current = tetris[sequence[0]];
    offset = begin_station[sequence[0]];
  } else {
    sequence = sequence.substring(1);
    current = tetris[sequence[0]];
    offset = begin_station[sequence[0]];
  }
  next_tetris();
  draw_grids();
}

//輸出下一個方塊的畫布
function draw_grids() {
  preview();
  current[rotate].forEach((index) => {
    grids[index + offset].classList.add(sequence[0]);
  });
}

//清除上一個方塊的畫布
function undraw_grids() {
  current[rotate].forEach((index) => {
    grids[index + offset].classList.remove(sequence[0]);
  });
}

creat_tetris();

//隨時間下降(重力)
function tetrdown() {
  undraw_grids();
  if (down) {
    offset += 10;
  }
  draw_grids();
  freeze();
}

//初步方塊固定條件判斷
function freeze() {
  let bool = true;
  for (let element of current[rotate]) {
    if (element + offset + 10 >= 200) {
      bool = false;
      delay();
      break;
    } else if (
      grids[element + offset + 10].classList.contains(`ed`) ||
      grids[element + offset + 10].classList.contains(`garbage`)
    ) {
      bool = false;
      delay();
      break;
    }
  }
  preview();
  return bool;
}

//設定1秒後符合固定條件就結凍方塊
function delay() {
  down = false;
  setTimeout(function () {
    for (let element of current[rotate]) {
      if (element + offset + 10 >= 200) {
        current[rotate].forEach((index) => {
          grids[index + offset].classList.add(`ed`);
        });
        eliminate_line(), can_hold = true;
        creat_tetris();
        break;
      } else if (
        grids[element + offset + 10].classList.contains(`ed`) ||
        grids[element + offset + 10].classList.contains(`garbage`)
      ) {
        current[rotate].forEach((index) => {
          grids[index + offset].classList.add(`ed`);
        });
        eliminate_line(), can_hold = true;
        creat_tetris();
        break;
      }
    }
    preview(), gameover(), down = true;
  }, setTimeout_time);
}

//Hold功能
function hold() {
  for (let i of hold_grids) {
    for (let j of "loszijt") {
      i.classList.remove(j);
      i.classList.remove("gray");
    }
  }
  if (hold_temp) {
    let temp = sequence[0];
    //JS的string不可變，無法直接改值... =_=
    sequence = hold_temp + sequence.substring(1);
    hold_temp = temp;
    sequence = sequence[0] + sequence;
  } else {
    hold_temp = sequence[0];
  }
  can_hold = false;
  creat_tetris();
  for (let i of tetris_5x5[hold_temp][0]) {
    hold_grids[i + 6].classList.add(`gray`);
  }
}

//顯示接下來四個方塊
function next_tetris() {
  for (let i of next_grids) {
    for (let j of "loszijt") {
      i.classList.remove(j);
    }
  }
  for (let i = 0; i < 4; i++) {
    for (let j of tetris_5x5[sequence[i + 1]][0]) {
      next_grids[j + 6 + 25 * i].classList.add(`${sequence[i + 1]}`);
    }
  }
}

//顯示預覽方塊
function preview() {
  let width = 0, bool = true;
  for (let i of grids) {
    i.classList.remove(`preview`);
  }
  while (bool) {
    width += 10;
    for (let i of current[rotate]) {
      if (i + offset + width >= 200) {
        width -= 10;
        bool = false;
        break;
      }
      if (
        grids[i + offset + width].classList.contains(`ed`) ||
        grids[i + offset + width].classList.contains(`garbage`)
      ) {
        width -= 10;
        bool = false;
        break;
      }
    }
  }
  let s = ["i", "o", "s", "z", "j", "l", "t"];
  for (let i of current[rotate]) {
    if (
      !(s.some((className) =>
        grids[i + offset + width].classList.contains(className)
      ))
    ) {
      grids[i + offset + width].classList.add(`preview`);
    }
  }
}

let cnt = 0;
//消行條件判斷
function eliminate_line() {
  let line_number = 0;
  for (let i of current[rotate]) {
    let line_eliminate = true, rang = Math.floor((i + offset) / 10) * 10;
    for (let j = rang; j <= rang + 9; j++) {
      if (
        !(grids[j].classList.contains(`ed`)) &&
        !(grids[j].classList.contains(`garbage`))
      ) {
        line_eliminate = false;
        break;
      }
      if (!line_eliminate) {
        break;
      }
    }
    if (line_eliminate) {
      line_number++;
      for (let k = rang; k <= rang + 9; k++) {
        grids[k].remove();
      }
      let grid = document.querySelector(".grid");
      for (let j = 0; j < 10; j++) {
        let temp = document.createElement("div");
        grid.insertBefore(temp, grid.firstChild);
      }
      grids = Array.from(document.querySelectorAll(".grid div"));
    }
  }
  scores += line_number;
  document.querySelector(".state").innerHTML = scores;
  level(line_number);
  /*
  if (garbage) {
    if (line_number % 4 != 0)
      line_number--;
    generate_garbage_line(line_number);
  }*/
}

function level(line_number){
  if (line_number == 0) {
    if (scores < 20) {
      cnt++;
      if (cnt == 3) {
        generate_garbage_line(1);
      }
      cnt %= 3;
    } else if (scores < 40) {
      cnt++;
      if (cnt == 2) {
        generate_garbage_line(1);
      }
      cnt %= 2;
    } else {
      generate_garbage_line(1);
    }
  }
}

//生成垃圾行
function generate_garbage_line(line_number) {
  let location = Math.floor(Math.random() * 10);
  for (let i = 0; i < line_number; i++) {
    for (let k = 0; k <= 9; k++) {
      grids[k].remove();
    }
    let grid = document.querySelector(".grid");
    for (let j = 0; j < 10; j++) {
      let temp = document.createElement("div");
      if (j == location) {
        grid.appendChild(temp);
      } else {
        temp.classList.add(`garbage`);
        grid.appendChild(temp);
      }
    }
    grids = Array.from(document.querySelectorAll(".grid div"));
  }
}

//立刻放下方塊(Hard drop)
function click_space() {
  let width = 0, bool = true;
  while (bool) {
    width += 10;
    for (let i of current[rotate]) {
      if (i + offset + width >= 200) {
        width -= 10;
        bool = false;
        break;
      }
      if (
        grids[i + offset + width].classList.contains(`ed`) ||
        grids[i + offset + width].classList.contains(`garbage`)
      ) {
        width -= 10;
        bool = false;
        break;
      }
    }
  }
  offset += width;
  gameover(), setTimeout_time = 0;
}

//是否可以右移條件判斷
function R_freeze() {
  for (let element of current[rotate]) {
    if ((element + offset) % 10 == 9) {
      return false;
    } else {
      if (
        grids[element + offset + 1].classList.contains(`ed`) ||
        grids[element + offset + 1].classList.contains(`garbage`)
      ) {
        return false;
      }
    }
  }
  return true;
}

//是否可以左移條件判斷
function L_freeze() {
  for (let element of current[rotate]) {
    if ((element + offset) % 10 == 0) {
      return false;
    } else {
      if (
        grids[element + offset - 1].classList.contains(`ed`) ||
        grids[element + offset - 1].classList.contains(`garbage`)
      ) {
        return false;
      }
    }
  }
  return true;
}

//遊戲結束條件判斷
function gameover() {
  let s = "loszijt";
  for (let i of current[rotate]) {
    if (
      grids[i + offset].classList.contains(`ed`) ||
      grids[i + offset].classList.contains(`garbage`)
    ) {
      sendData()
      document.querySelector(".state").innerHTML = scores = 0;
      reset();
      return;
    }
  }
}

//重製遊戲
function reset() {
  hold_temp = null;
  begin();
  current = null, sequence = "", can_hold = true;
  creat_tetris();
}

//方塊下落的秒數控制
function startTimer() {
  timer = setInterval(function () {
    // 要執行的程式碼
    tetrdown();
    preview();
    gameover();
  }, speed);
}

//判斷旋轉時是否合理
function canrotate(rotate_temp) {
  for (let element of current[rotate]) {
    let tempp = (element + offset) % 10;
    if (tempp >= 6) {
      for (let j of current[rotate_temp]) {
        if ((j + offset) % 10 == 0) {
          return false;
        }
      }
    } else if (tempp <= 3) {
      for (let j of current[rotate_temp]) {
        if ((j + offset) % 10 == 9) {
          return false;
        }
      }
    }
  }
  for (let element of current[rotate_temp]) {
    if (
      grids[element + offset].classList.contains(`ed`) ||
      grids[element + offset].classList.contains(`garbage`)
    ) {
      return false;
    }
  }
  return true;
}

//監測鍵盤輸入
window.addEventListener("keydown", function (input_key) {
  undraw_grids();
  if (input_key.code == "ArrowUp") {
    if (canrotate((rotate + 1) % 4)) {
      rotate++;
      rotate %= 4;
    }
  }
  if (input_key.code == "KeyW") {
    let temp = rotate - 1;
    if (temp < 0) {
      temp = tetris[sequence[0]].length - 1;
    }
    if (canrotate(temp % 4)) {
      rotate--;
      if (rotate < 0) {
        rotate = tetris[sequence[0]].length - 1;
      }
      rotate %= 4;
    }
  }
  if (input_key.code == "KeyA") {
    if (canrotate((rotate + 2) % 4)) {
      rotate += 2;
      rotate %= 4;
    }
  }
  if (input_key.code == "ArrowLeft") {
    if (L_freeze()) {
      offset -= 1;
    }
  }
  if (input_key.code == "ArrowRight") {
    if (R_freeze()) {
      offset += 1;
    }
  }
  if (input_key.code == "ArrowDown") {
    if (down) {
      offset += 10;
    }
  }
  if (input_key.code == "Space") {
    click_space();
  }
  if (input_key.code === "ShiftLeft" || input_key.code === "ShiftRight") {
    if (can_hold) {
      hold();
    }
  }
  if (input_key.code == "Space") {
    click_space();
  }
  draw_grids();
  freeze();
});

//按鍵介紹按鈕
document.querySelector(".instruct").addEventListener("click", function () {
  alert(
    `按鍵介紹\n\n方向鍵↑ 順時針轉動\n\n方向鍵↓ soft drop(軟降)\n\n方向鍵← 向左移動\n\n方向鍵→ 向右移動\n\nW鍵 逆時針轉動\n\nShift鍵 Hold功能\n\n空白鍵 Hard drop(硬降)`,
  );
  this.blur();
});
/*
//速度調整按鈕*3
document.querySelector("#speed1").addEventListener("click", function () {
  for (let i = 1; i < 4; i++) {
    if (
      document.querySelector(`#speed${i}`).classList.contains(`in_this_speed`)
    ) {
      document.querySelector(`#speed${i}`).classList.remove(`in_this_speed`);
      document.querySelector(`#speed${i}`).classList.add(`otherspeed`);
    }
  }
  document.querySelector(`#speed1`).classList.remove(`otherspeed`);
  document.querySelector(`#speed1`).classList.add(`in_this_speed`);
  speed = 700;
  reset_Timer();
  this.blur();
});

document.querySelector("#speed2").addEventListener("click", function () {
  for (let i = 1; i < 4; i++) {
    if (
      document.querySelector(`#speed${i}`).classList.contains(`in_this_speed`)
    ) {
      document.querySelector(`#speed${i}`).classList.remove(`in_this_speed`);
      document.querySelector(`#speed${i}`).classList.add(`otherspeed`);
    }
  }
  document.querySelector(`#speed2`).classList.remove(`otherspeed`);
  document.querySelector(`#speed2`).classList.add(`in_this_speed`);
  speed = 250;
  reset_Timer();
  this.blur();
});

document.querySelector("#speed3").addEventListener("click", function () {
  for (let i = 1; i < 4; i++) {
    if (
      document.querySelector(`#speed${i}`).classList.contains(`in_this_speed`)
    ) {
      document.querySelector(`#speed${i}`).classList.remove(`in_this_speed`);
      document.querySelector(`#speed${i}`).classList.add(`otherspeed`);
    }
  }
  document.querySelector(`#speed3`).classList.remove(`otherspeed`);
  document.querySelector(`#speed3`).classList.add(`in_this_speed`);
  speed = 100;
  reset_Timer();
  this.blur();
});
*/
//重置下落速度
function reset_Timer() {
  clearInterval(timer);
  startTimer();
}
/*
//垃圾行按鈕
document.querySelector("#garbage").addEventListener("click", function () {
  document.querySelector(`#garbage`).classList.remove(`nonchosen`);
  document.querySelector(`#garbage`).classList.remove(`chosen`);
  garbage = !garbage;
  if (garbage) {
    document.querySelector(`#garbage`).classList.add(`chosen`);
  } else {
    document.querySelector(`#garbage`).classList.add(`nonchosen`);
  }
  this.blur();
});
*/

function sendData() {
  const data = {
    score: scores
  };

  fetch('/scores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  .then(response => response.json())
  .then(data => {
    console.log('Success:', data);
  })
  .catch((error) => {
    console.error('Error:', error);
  });
}

//排行榜按鈕
function rank() {
  window.location.href = '/rank';
}