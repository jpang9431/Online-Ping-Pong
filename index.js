import { WebSocketServer } from "ws";
const uniqueId = () => {
  const dateString = Date.now().toString(36);
  const randomness = Math.random().toString(36).substring(2);
  return dateString + randomness;
};
const wss = new WebSocketServer({ port: 8080 });
const webSockets = new Map();
const webToId = new Map();
const wsIndex = 0;
const matchWebSockets = new Map();
const serverId = "Server";
const senderId = 0;
const messageType = 1;
const messageData = 2;
const waiting = [];
const circleWidthPercent = 0.016;
const circleHeightPercent = 0.043;
const circleCalcInterval = setInterval(doCalc, 34);
const circleMap = new Map();
const multiplier = [-1, 1];
const circleCloneNum = 588;
var discconectedUsers = [];
const multi = 2;
const maxSpeed = 0.01;
function clientDisconnect(userId, doSendMessage = true) {
  if (waiting.indexOf(userId) != -1) {
    waiting.splice(waiting.indexOf(userId));
  } else {
    discconectedUsers.push(userId);
    discconectedUsers.push(matchWebSockets.get(userId));
    if (doSendMessage) {
      sendMessage(
        webSockets.get(matchWebSockets.get(userId)),
        serverId,
        "error",
        "Opponent as disconnected",
      );
    }
    webSockets.get(userId).close();
    webSockets.get(matchWebSockets.get(userId)).close();
    try {
    } catch {
      console.log(
        "Just ignore this message this is just here for anti race conditions or something",
      );
    }
  }
}

function circleCreator(user1, user2) {
  let id = uniqueId();
  let ball = {
    id: id,
    left: 0.49,
    top: 0.48,
    lVel:
      0.002 *
      multi *
      getRandomArbitrary(1, 1.1) *
      multiplier[Math.floor(Math.random() * 2)],
    tVel:
      0.005 *
      multi *
      getRandomArbitrary(1, 1.1) *
      multiplier[Math.floor(Math.random() * 2)],
    user1: user1,
    user2: user2,
    lAccel: getRandomArbitrary(1, 1.5),
    tAccel: getRandomArbitrary(1, 1.5),
    nextHit: "",
    counter: 0,
    lastUpdate: Date.now(),
  };
  if (ball.lVel < 0) {
    ball.nextHit = "L";
  } else {
    ball.nextHit = "R";
  }
  circleMap.set(id, ball);
  sendMessage(
    webSockets.get(user1),
    ball.id,
    "newBall",
    ball.left +
      "|" +
      ball.top +
      "|" +
      ball.lAccel +
      "|" +
      ball.tAccel +
      "|" +
      ball.lVel +
      "|" +
      ball.tVel +
      "|" +
      ball.nextHit,
  );
  sendMessage(
    webSockets.get(user2),
    ball.id,
    "newBall",
    ball.left +
      "|" +
      ball.top +
      "|" +
      ball.lAccel +
      "|" +
      ball.tAccel +
      "|" +
      ball.lVel +
      "|" +
      ball.tVel +
      "|" +
      ball.nextHit,
  );
}

function doCalc() {
  circleMap.forEach(circleCalc);
  discconectedUsers = [];
}

function resetCircle(value) {
  value.left = 0.49;
  value.top = 0.48;
  value.lVel =
    0.002 *
    multi *
    getRandomArbitrary(1, 1.1) *
    multiplier[Math.floor(Math.random() * 2)];
  value.tVel =
    0.005 *
    multi *
    getRandomArbitrary(1, 1.1) *
    multiplier[Math.floor(Math.random() * 2)];
  value.lAccel = getRandomArbitrary(1, 1.5);
  value.tAccel = getRandomArbitrary(1, 1.5);
  if (value.lVel < 0) {
    value.nextHit = "L";
  } else {
    value.nextHit = "R";
  }
  sendMessage(
    webSockets.get(value.user1),
    value.id,
    "resetBall",
    value.lVel +
      "|" +
      value.tVel +
      "|" +
      value.lAccel +
      "|" +
      value.tAccel +
      "|" +
      value.nextHit,
  );
}

function circleCalc(value, key, map) {
  for (let i = 0; i < discconectedUsers.length; i++) {
    if (
      value.user1 == discconectedUsers[i] ||
      value.user2 == discconectedUsers[i]
    ) {
      map.delete(key);
      return;
    }
  }
  let now = Date.now();
  let dt = now-value.lastUpdate;
  let amountUpdate = dt/34;
  value.left = value.left + value.lVel*amountUpdate;
  value.top = value.top + value.tVel*amountUpdate;
  value.counter = value.counter + 1;
  if (value.counter == circleCloneNum) {
    value.counter = 0;
    circleCreator(value.user1, value.user2);
  }
  if (value.left < 0 && value.nextHit == "L") {
    sendMessage(webSockets.get(value.user1), value.id, "score", "R");
    sendMessage(webSockets.get(value.user2), value.id, "score", "R");
    resetCircle(value);
  } else if (value.left + circleWidthPercent > 1 && value.nextHit == "R") {
    sendMessage(webSockets.get(value.user2), value.id, "score", "L");
    sendMessage(webSockets.get(value.user1), value.id, "score", "L");
    resetCircle(value);
  }
  if (value.top <= 0 || value.top + circleHeightPercent >= 1) {
    value.tVel = value.tVel * -1;
  }
  sendMessage(
    webSockets.get(value.user1),
    value.id,
    "ball",
    value.left + "|" + value.top,
  );
  sendMessage(
    webSockets.get(value.user2),
    value.id,
    "ball",
    value.left + "|" + value.top,
  );
  value.lastUpdate = Date.now();
}

function hit(id, data) {
  try {
    let circle = circleMap.get(id);
    if (circle.nextHit == data) {
      if (circle.nextHit == "R") {
        circle.nextHit = "L";
      } else {
        circle.nextHit = "R";
      }
      //circle.lVel = circle.lVel * -1;
      circle.lVel = circle.lVel * circle.lAccel*-1;
      circle.tVel = circle.tVel * circle.tAccel;
      //console.log(circle.lVel);
      //circleCalc(circle, id, circleMap);
    }
  } catch {
    console.log("Random race condition prevntion sucessful");
  }
}

wss.on("connection", function connection(ws) {
   let id = uniqueId();
  ws.on("message", function message(data) {
    data = data.toString("utf8").split(":");
    let sender = data[senderId];
    let type = data[messageType];
    let text = data[messageData];
    if (type == "id") {
      idMessage(id, ws);
    } else if (type == "hit") {
      hit(sender, text);
    } else if (type == "disconnect") {
      deleteUser(sender);
    } else if (type == "move") {
      sendMessage(
        webSockets.get(matchWebSockets.get(sender)),
        serverId,
        "paddle",
        text,
      );
    } else if (type == "spawn") {
      circleCreator(sender, matchWebSockets.get(sender));
    } else if (type == "win") {
      sendMessage(
        webSockets.get(sender),
        serverId,
        "error",
        "You have won, refresh the page to start a new game",
      );
      sendMessage(
        webSockets.get(matchWebSockets.get(sender)),
        serverId,
        "error",
        "You have lost, refresh the page to start a new game",
      );
      clientDisconnect(sender, false);
    } else if (type=="flipL"){
      //console.log(circleMap.get(sender).l);
      circleMap.get(sender).lVel=circleMap.get(sender).lVel*-1;
      //console.log(circleMap.get(sender).lAccel);
    } else if (type=="flipT"){
      circleMap.get(sender).tVel = circleMap.get(sender).tVel*-1;
    }
  });
  ws.on("close", function closingFunction(){
    console.log(id);
    clientDisconnect(id);
  });
});

function deleteUser(key) {
  if (waiting.indexOf(key) != -1) {
    waiting.splice(waiting.indexOf(key), 1);
  } else if (matchWebSockets.get(key) != undefined) {
    let oppUser = matchWebSockets.get(key);
    sendMessage(
      webSockets.get(oppUser)[wsIndex],
      serverId,
      "error",
      "Opponent disconencted, refresh page to get a new opponent",
    );
    webSockets.delete(key);
    webSockets.delete(oppUser);
    matchWebSockets.delete(key);
    matchWebSockets.delete(oppUser);
  }
}

function idMessage(messageData, ws) {
  webSockets.set(messageData, ws);
  sendMessage(ws, serverId, "id", messageData);
  if (waiting.length >= 1) {
    let userId1 = messageData;
    let userId2 = waiting.pop();
    matchWebSockets.set(userId1, userId2);
    matchWebSockets.set(userId2, userId1);
    sendMessage(webSockets.get(userId1), serverId, "opponent", "L");
    sendMessage(webSockets.get(userId2), serverId, "opponent", "R");
    circleCreator(userId1, userId2);
  } else {
    waiting.push(messageData);
  }
}

function sendMessage(ws, id, type, message) {
  ws.send(id + ":" + type + ":" + message);
}

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}
