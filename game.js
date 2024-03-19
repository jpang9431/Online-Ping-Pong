const webSocket = new WebSocket("wss://23efae50-5b69-4bf2-b80e-d0439c381ff5-00-16w1i5rz2r3i2.picard.repl.co/");
var userId = "";
const senderId = 0;
const messageType = 1;
const messageData = 2;
var side = "";
var userPaddle = null;
var opponentPaddle = null;
var moveInterval = null;
const paddle1 = document.getElementById("paddle1");
const paddle2 = document.getElementById("paddle2");
var moveKey = "";
var heightPercentChange = 0;
var hieghtPercent = 0;
const maxHeight = window.innerHeight;
const maxWidth = window.innerWidth;
const vh = Math.round(window.innerHeight / 100);
const circles = [];
var leftCheck = 0;
var rightCheck = 0;
var score = 0;
var winScore = 50;
var pastPaddlePoint = 0;
const colors = ["red", "orange", "yellow", "lime", "fuchsia"];
const admin = false;

function circleCreator(id, left, top, lAccel, tAccel, lVel, tVel, nextHit) {
  let element = document.createElement("div");
  element.style.left = maxWidth * left + "px";
  element.style.top = maxHeight * top + "px";
  element.setAttribute("id", id);
  element.id = id;
  element.classList.add('circle');
  circles.push(element);
  document.body.appendChild(element);
  element.style.background = colors[0];
  element.index = 0;
  element.lAccel = lAccel;
  element.tAccel = tAccel;
  element.lVel = lVel;
  element.tVel = tVel;
  element.nextHit = nextHit;
  element.updated = false;
  //console.log(element.index);
  //console.log(document.getElementById(id));
}

function move() {
  hieghtPercent = hieghtPercent + heightPercentChange;
  userPaddle.style.top = hieghtPercent + "%";
  sendMessage(userId, "move", hieghtPercent + "%");
}

document.addEventListener("keydown", function(event) {
  let key = event.key;
  if (key == "w") {
    heightPercentChange = -1;
  } else if (key == "s") {
    heightPercentChange = 1;
  } else if (key == " ") {
    sendMessage(userId, "spawn", "");
  } /*else if (key=="o"){
    for(let i=0; i<circles.length; i++){
      circles[i].lVel = circles[i].lVel * -1;
      sendMessage(circles[i].id, "flipL", "");
    }
  } else if (key=="p"){
    for(let i=0; i<circles.length; i++){
      circles[i].tVel = circles[i].tVel * -1;
      sendMessage(circles[i].id, "flipT", "");
    }
  }*/
})

document.addEventListener("keyup", function(event) {
  let key = event.key;
  if (key == "w" || key == "s") {
    heightPercentChange = 0;
  }
})

webSocket.onopen = (event) => {
  sendMessage("", "id", "Connected");
}

webSocket.onmessage = (event) => {
  let data = event.data.split(":");
  let sender = data[senderId];
  let type = data[messageType];
  let text = data[messageData];
  if (type == "ball") {
    text = text.split("|");
    let elm = document.getElementById(sender);
    if (!elm.updated) {
      elm.style.left = text[0] * maxWidth + "px";
      elm.style.top = text[1] * maxHeight + "px";
    } else {
      elm.updated = false;
    }

    // elm.style.visibility = "visible";
    elm.index = elm.index + 1;
    if (elm.index == colors.length) {
      elm.index = 0;
    }
    elm.style.background = colors[elm.index];
    //console.log(parseInt(elm.style.left) + elm.offsetWidth);
    if (parseInt(elm.style.left) <= leftCheck) {
      if (side == "L") {
        isCollide(elm, userPaddle, sender);
      } else {
        isCollide(elm, opponentPaddle, "");
      }
    }
    if (parseInt(elm.style.left) + elm.offsetWidth >= rightCheck) {
      if (side == "R") {
        isCollide(elm, userPaddle, sender);
      } else {
        isCollide(elm, opponentPaddle, "");
      }
    }
  } else if (type == "resetBall") {
    let elm = document.getElementById(sender);
    text = text.split("|");
    setBallProperites(elm, text[0], text[1], text[2], text[3], text[4]);
  } else if (type == "id") {
    userId = text;
    console.log(userId);
  } else if (type == "opponent") {
    side = text;
    if (side == "L") {
      userPaddle = paddle1;
      opponentPaddle = paddle2;
    } else {
      opponentPaddle = paddle1;
      userPaddle = paddle2;
    }
    document.getElementById("thing").innerHTML = ":";
    document.getElementById("score1").style.visibility = "visible";
    document.getElementById("score2").style.visibility = "visible";
    leftCheck = userPaddle.offsetWidth * 2 + maxWidth * .05;
    rightCheck = maxWidth - (userPaddle.offsetWidth * 2 + maxWidth * .05 + maxWidth * .016);
    //rightCheck = 0;
    moveInterval = setInterval(move, 17);
    //console.log(text);
  } else if (type == "error") {
    alert(text);
  } else if (type == "paddle") {
    opponentPaddle.style.top = text;
  } else if (type == "newBall") {
    console.log("new");
    text = text.split("|");
    console.log(text);
    circleCreator(sender, text[0], text[1], text[2], text[3], text[4], text[5], text[6]);
  } else if (type == "score") {
    if (text == side) {
      score = score + 1;
      if (score == 50) {
        sendMessage(userId, "win", "");
      }
    }
    if (text == "L") {
      document.getElementById("score1").innerHTML = parseInt(document.getElementById("score1").innerHTML) + 1;
    } else {
      document.getElementById("score2").innerHTML = parseInt(document.getElementById("score2").innerHTML) + 1;
    }
  }
}

function isCollide(a, b, id) {
  var aRect = a.getBoundingClientRect();
  var bRect = b.getBoundingClientRect();
  if (!(
    ((aRect.top + aRect.height) < (bRect.top)) ||
    (aRect.top > (bRect.top + bRect.height)) ||
    ((aRect.left + aRect.width) < bRect.left) ||
    (aRect.left > (bRect.left + bRect.width))
  )) {
    //a.style.left = leftCheck+"px";
    //console.log("A"+aRect.left);
    //console.log("B"+bRect.left);
    //a.style.visibility = "hidden"
    if (id != "") {
      sendMessage(id, "hit", side);
    }

    if ((id != "" && a.nextHit == side) || (id == "" && a.nextHit != side)) {
      if (a.nextHit == "L") {
        a.nextHit = "R";
      } else if (a.nextHit == "R") {
        a.nextHit = "L";
      }
      a.lVel = a.lVel * a.lAccel * -1;
      a.tVel = a.tVel * a.tAccel;
      a.style.left = parseInt(a.style.left) + a.lVel * maxWidth + "px";
      a.style.top = parseInt(a.style.top) + a.tVel * maxHeight + "px";
      //a.updated = true;
      ///a.style.visibility = "visible"
    }


    //console.log("hit");
  }
}

function setBallProperites(elm, lVel, tVel, lAccel, tAccel, nextHit) {
  elm.lVel = lVel;
  elm.tVel = tVel;
  elm.lAccel = lAccel;
  elm.tAccel = tAccel;
  elm.nextHit = nextHit;
}

function sendMessage(id, type, message) {
  webSocket.send(id + ":" + type + ":" + message);
}

window.addEventListener('beforeunload', function(event) {
  sendMessage(userId, "bye", "");
}, false);