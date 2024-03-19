const maxHeight = window.innerHeight;
const maxWidth = window.innerWidth;

document.addEventListener("DOMContentLoaded", function(event) {
  document.getElementById("hi").style.width = maxWidth/4 + "px";
  document.getElementById("submitButton").style.width = maxWidth/4 + "px";
  centerElm(document.getElementById("hi"), 0, true, true);
  centerElm(document.getElementById("submitButton"));
})

document.getElementById("submitButton").addEventListener("click", function(event) {
  switchScreen();
})

function switchScreen() {
  window.location.href = "game.html";
}

function centerElm(elm, otherHeight = 0, next = true, topDoc = false) {
  elm.style.position = "absolute";
  elm.style.top = maxHeight / 2 - (elm.offsetHeight + otherHeight) / 2 + "px";
  elm.style.left = maxWidth / 2 - elm.offsetWidth / 2 + "px";
  if (topDoc) {
    elm.style.top = "0px";
  }
  lastElm = elm;
}