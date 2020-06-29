var lastpeerClientIdClient = null;
var peerClient = null; // own peerClient object
var connClient = null;
var statusClient = document.getElementById("statusClient");
var messageClient = document.getElementById("messageClient");

// var goButton = document.getElementById("goButton");
// var resetButton = document.getElementById("resetButton");
// var fadeButton = document.getElementById("fadeButton");
// var offButton = document.getElementById("offButton");

var currentChannelNameClient = "";
var setServerBoxClient = document.getElementById("setServerBox");
var setChannelBoxClient = document.getElementById("setChannelNameBoxClient");

var sendMessageBoxClient = document.getElementById("previewBoxHost");
var sendButtonClient = document.getElementById("sendButtonClient");
var enableTransmissionCheckbox = document.getElementById("enableTransmissionCheckbox");

var currentPort = 8000;

// var clearMsgsButtonClient = document.getElementById("clearMsgsButtonClient");
var connectButtonClient = document.getElementById("connect-buttonClient");
var cueStringClient = "<span class=\"cueMsg\">Cue: </span>";

/**
 * Create the peerClient object for our end of the connection.
 *
 * Sets up callbacks that handle any events related to our
 * peerClient object.
 */

function initializeClient() {
    // Create own peerClient object with connection to shared peerClientJS server

    if (setChannelBoxClient.value == "") {
        // TODO:
        //currentChannelNameClient = makeid(10);
        currentChannelNameClient = "AHOHA";
        console.log("!Empty Client Channel Name Box!");
        console.log(setChannelBoxClient.value);
    } else {
        currentChannelNameClient = setChannelBoxClient.value;
    }

    peerClient = new Peer(null, {
        debug: 2
    });

    peerClient.on('open', function (id) {
        // Workaround for peerClient.reconnClientect deleting previous id
        if (peerClient.id === null) {
            console.log('Received null id from peerClient open');
            peerClient.id = Client;
        } else {
            Client = peerClient.id;
        }

        console.log('Channel Name: ' + peerClient.id);
    });

    peerClient.on('disconnClientected', function () {
        statusClient.innerHTML = "Connection lost. Please reconnClientect";
        console.log('Connection lost. Please reconnClientect');

        // Workaround for peerClient.reconnClientect deleting previous id
        peerClient.id = Client;
        peerClient._lastServerId = Client;
        peerClient.reconnClientect();
    });

    peerClient.on('close', function() {
        connClient = null;
        statusClient.innerHTML = "Connection destroyed. Please refresh";
        console.log('Connection destroyed');
    });

    peerClient.on('error', function (err) {
        console.log(err);
        initializeClient();
        //alert('' + err);
    });
};

/**
 * Create the Connection between the two peerClients.
 *
 * Sets up callbacks that handle any events related to the
 * Connection and data received on it.
 */

function joinClient() {
    // Close old Connection
    if (connClient) {
        connClient.close();
    }

    // initializeClient();

    if (setServerBoxClient.value != "") {
        console.log("Custom Server...");
        current_server = setServerBoxClient.value;

        peerClient = new Peer(currentChannelNameClient, {
            host: current_server,
            port: currentPort,
            path: '/peer'
        });
    }

    if (setChannelBoxClient.value == "") {
        // TODO:
        //currentChannelNameClient = makeid(10);
        currentChannelNameClient = "BOXXWINE";
        console.log("!Empty Client Channel Name Box!");
        console.log(setChannelBoxClient.value);
    } else {
        currentChannelNameClient = setChannelBoxClient.value;
    }

    // Create connection to destination peerClient specified in the input field
    connClient = peerClient.connect(currentChannelNameClient, {
        reliable: true
    });

    connClient.on('open', function () {
        statusClient.innerHTML = "Connected to " + connClient.peer;
        console.log("Connected to: " + connClient.peer);

        // Check URL params for comamnds that should be sent immediately
        var command = getUrlParamClient("command");
        if (command)
            connClient.send(command);
    });
    // Handle incoming data (messages only since this is the signal sender)
    connClient.on('data', function (data) {
        addMessageClient("<span class=\"peerClientMsg\">peerClient:</span> " + data);
    });
    connClient.on('close', function () {
        statusClient.innerHTML = "Connection closed";
    });
};


window.addEventListener('keydown', function(evt) {
    if (enableTransmissionCheckbox.checked == true){
        console.log("Send");
        if (connClient && connClient.open) {
            connClient.send(evt.key);
            console.log("Sent: " + evt.key);
            addMessageClient("<span class=\"selfMsg\">Self: </span> " + msg);
        } else {
            console.log('Connection is closed');
        }
    }
});

/**
 * Get first "GET style" parameter from href.
 * This enables delivering an initial command upon page load.
 *
 * Would have been easier to use location.hash.
 */
function getUrlParamClient(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);
    if (results == null)
        return null;
    else
        return results[1];
};

function addMessageClient(msg) {
    var now = new Date();
    var h = now.getHours();
    var m = addZero(now.getMinutes());
    var s = addZero(now.getSeconds());

    if (h > 12)
        h -= 12;
    else if (h === 0)
        h = 12;

    function addZero(t) {
        if (t < 10)
            t = "0" + t;
        return t;
    };

    // statusClient.innerHTML = "<br><span class=\"msg-time\">" + h + ":" + m + ":" + s + "</span>  -  " + msg + message.innerHTML;
    messageClient.innerHTML = "<br><span class=\"msg-time\">" + h + ":" + m + ":" + s + "</span>  -  " + msg + messageClient.innerHTML;

};

function clearMessages() {
    messageClient.innerHTML = "";
    addMessageClient("Msgs cleared");
};

sendMessageBoxClient.onkeypress = function (e) {
    var event = e || window.event;
    var char = event.which || event.keyCode;
    if (char == '13')
        sendButtonClient.click();
};

sendButtonClient.onclick = function () {
    if (connClient && connClient.open) {
        var msg = sendMessageBoxClient.value;
        // sendMessageBoxClient.value = "";
        connClient.send(msg);
        console.log("Sent: " + msg);
        addMessageClient("<span class=\"selfMsg\">Self: </span> " + msg);
    } else {
        console.log('Connection is closed');
    }
};

connectButtonClient.addEventListener('click', joinClient);

function init() {
    console.log("Client: OK");
}

initializeClient();
