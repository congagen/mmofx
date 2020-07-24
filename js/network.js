var networkHostChannelNameBox = document.getElementById("networkHostChannelNameBox");
var networkHostChannelStartButton = document.getElementById("networkHostChannelStartButton");

var networkClientChannelNameBox = document.getElementById("networkClientChannelNameBox");
var networkClientChannelConnectButton = document.getElementById("networkClientChannelConnectButton");

var networkServerBox = document.getElementById("networkServerBox");
var networkServerConnectButton = document.getElementById("networkServerConnectButton");

var currentChannelName = "";

const sendBtn = document.querySelector('#send');
const messages = document.querySelector('#messages');
const messageBox = document.querySelector('#messageBox');

let ws;

function showMessage(message) {
  messages.textContent += `\n\n${message}`;
  messages.scrollTop = messages.scrollHeight;
  messageBox.value = '';
}

function init() {
  if (ws) {
    ws.onerror = ws.onopen = ws.onclose = null;
    ws.close();
  }

  ws = new WebSocket('ws://localhost:6969');
  ws.onopen = () => {
    console.log('Connection opened!');
  }
  ws.onmessage = ({ data }) => showMessage(data);
  ws.onclose = function() {
    ws = null;
  }
}

sendBtn.onclick = function() {
  if (!ws) {
    showMessage("No WebSocket connection :(");
    return ;
  }

  ws.send(messageBox.value);
  showMessage(messageBox.value);
}


function getUrlParam(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);
    if (results == null)
        return null;
    else
        return results[1];
};


function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


networkHostChannelStartButton.onclick = function () {
    WebSocketTest();
};


//init();
