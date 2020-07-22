// WebAudio
var currentSamples = [];
let ctx;
var out;
var oscA_gain;
var oscA;
var oscB;
var isInit = false;

// PEERJS
var lastPeerId = null;
var peer = null;
var peerId = null;
var conn = null;

var current_server = "35.177.136.131";
var currentPort = 9000;

var keysdown = {};


var oscA = new Pizzicato.Sound({
    source: 'wave',
    options: {
        type: 'sine'
    }
});

var oscB = new Pizzicato.Sound({
    source: 'wave',
    options: {
        type: 'square'
    }
});

var oscC = new Pizzicato.Sound({
    source: 'wave',
    options: {
        type: 'sawtooth'
    }
});

var pingPongDelay = new Pizzicato.Effects.PingPongDelay({
    feedback: 0.6,
    time: 0.4,
    mix: 0.5
});

var dubDelayA = new Pizzicato.Effects.DubDelay({
    feedback: 0.6,
    time: 0.25,
    mix: 0.5,
    cutoff: 3000
});

var dubDelayB = new Pizzicato.Effects.DubDelay({
    feedback: 0.6,
    time: 0.25,
    mix: 0.5,
    cutoff: 1500
});

var reverb = new Pizzicato.Effects.Reverb({
    time: 1,
    decay: 0.8,
    reverse: false,
    mix: 0.5
});

var oscillators = new Pizzicato.Group([oscA, oscB, oscC]);
let audioSources = [oscA, oscB, oscC];

oscillators.addEffect(dubDelayA);
oscillators.addEffect(dubDelayB);
oscillators.addEffect(reverb);
// oscillators.volume = 0.1;

var recvId = document.getElementById("receiver-id");
var status = document.getElementById("status");

var masterAmp_slider = document.getElementById("masterAmp");

var enablePreviewCheckbox = document.getElementById("enablePreviewCheckbox");
var enableTransmissionCheckbox = document.getElementById("enableTransmissionCheckbox");

var synthMasterAmp   = document.getElementById("synthMasterAmp");
var samplerMasterAmp = document.getElementById("samplerMasterAmp");

var duration_knob = document.getElementById("duration_knob");
var attack_knob = document.getElementById("attack_knob");
var release_knob = document.getElementById("release_knob");

var osc_a_vol_knob = document.getElementById("osc_a_vol_knob");
var osc_b_vol_knob = document.getElementById("osc_b_vol_knob");
var osc_c_vol_knob = document.getElementById("osc_c_vol_knob");

var delay_speed_knob = document.getElementById("delay_speed_knob");
var delay_feedback_knob = document.getElementById("delay_feedback_knob");
var delay_cutoff_knob = document.getElementById("delay_cutoff_knob");
var delay_drywet_knob = document.getElementById("delay_drywet_knob");

var delayB_speed_knob = document.getElementById("delayB_speed_knob");
var delayB_feedback_knob = document.getElementById("delayB_feedback_knob");
var delayB_cutoff_knob = document.getElementById("delayB_cutoff_knob");
var delayB_drywet_knob = document.getElementById("delayB_drywet_knob");

var reverb_speed_knob = document.getElementById("reverb_speed_knob");
var reverb_feedback_knob = document.getElementById("reverb_feedback_knob");
var reverb_drywet_knob = document.getElementById("reverb_drywet_knob");

var currentChannelName = "";
var setChannelBox = document.getElementById("setChannelNameBox");

// var setChannelButton = document.getElementById("setChannelNameButton");
var noteTimer;

var setServerBox = document.getElementById("setServerBox");
var startHostButton = document.getElementById("startHostButton");

var previewBox = document.getElementById("previewBoxHost");
var previewBtn = document.getElementById("previewBtnHost");

// var setServerButton = document.getElementById("setServerButton");

// var sendMessageBox = document.getElementById("sendMessageBox");
// var sendButton = document.getElementById("sendButton");
// var clearMsgsButton = document.getElementById("clearMsgsButton");
// var connectButton = document.getElementById("connect-button");
var cueString = "<span class=\"cueMsg\">Cue: </span>";


function addUsersForm(x) {
    var y = "presUser_" + x;
    var z = "addUserButton_" + (x - 1);
    var t = "removeUserButton_" + (x - 1);

    document.getElementById(y).style.display = "table-row";
    document.getElementById(z).style.display = "none";
    document.getElementById(t).style.display = "inline-block";
}


function removeUsersForm(x) {
    var y = "presUser_" + x;

    document.getElementById(y).style.display = "none";
}

function strToNum(inputString) {
    var composite = "1";

    for (var i = 0; i < inputString.length; i++) {
        composite += inputString.charCodeAt(i).toString();
    }
    console.log(composite);
    return parseInt(composite);
}


function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

// -------------------------------------------------------------
// -------------------------------------------------------------
// WEBAUDIO: ---------------------------------------------------

// const playButton = document.querySelector('.tape-controls-play');

function initAudio() {

    try {
        if (!isInit){
            var context = Pizzicato.context;
            isInit = true;
        }

        console.log("Audio initialized... ");
    }
        catch(e) {
        alert('Web Audio API is not supported in this browser');
    }
}


function playPreview_(client_seed, isRemote) {
    // tjsFMSynth.triggerAttackRelease('C4', '8n');
    Pizzicato.volume = 0.2;
    let sUrls = getSamplesFromTxt(client_seed);

    for(var i=0; i < sUrls.length; i++) {
        sU = sUrls[i];

        const sampler = new Pizzicato.Sound(sU, () => {
            sampler.volume = 0.1;
            sampler.play();
        });
    }
}


function playPreview(client_seed, isRemote) {

    Pizzicato.volume = (masterAmp_slider.value / 110);
    var dur = 100 * ((duration_knob.value + 1) / 100);

    clearTimeout(noteTimer);
    console.log(oscA.volume);
    console.log(oscB.volume);
    console.log(oscC.volume);

    oscillators.stop();

    oscA.volume = ((osc_a_vol_knob.value + 1.0) / 1001.0);
    oscA.frequency = parseInt(1000 * Math.abs(Math.sin(strToNum(client_seed))));

    oscB.volume = ((osc_b_vol_knob.value + 1.0) / 1001.0);
    oscB.frequency = parseInt(1000 * Math.abs(Math.sin(strToNum(client_seed))));

    oscC.volume = ((osc_c_vol_knob.value + 1.0) / 1001.0);
    oscC.frequency = parseInt(1000 * Math.abs(Math.sin(strToNum(client_seed))));

    for(var i=0; i < audioSources.length; i++) {
        // audioSources[i].stop();
        audioSources[i].attack  = (attack_knob.value / 100);
        audioSources[i].release = (release_knob.value / 100);
    }

    console.log("Vol_A: " + osc_a_vol_knob.value.toString());
    console.log(oscA.volume);
    console.log((osc_a_vol_knob.value + 1.0) / 1000.0);

    console.log("Vol_B: " + osc_b_vol_knob.value.toString());
    console.log(oscB.volume);
    console.log("Vol_C: " + osc_c_vol_knob.value.toString());
    console.log(oscC.volume);

    reverb.time = (reverb_speed_knob.value / 100);
    reverb.decay = (reverb_feedback_knob.value / 100);
    reverb.mix = (reverb_drywet_knob.value / 100);

    dubDelayA.time = (delay_speed_knob.value / 100);
    dubDelayA.feedback = (delay_feedback_knob.value / 110);
    dubDelayA.cutoff = parseInt(5000 * (delay_cutoff_knob.value / 100));
    dubDelayA.mix = (delay_drywet_knob.value / 100.0);

    dubDelayB.time = (delayB_speed_knob.value / 100);
    dubDelayB.feedback = (delayB_feedback_knob.value / 110);
    dubDelayB.cutoff = parseInt(5000 * (delayB_cutoff_knob.value / 100));
    dubDelayB.mix = (delayB_drywet_knob.value / 100.0);

    // pingPongDelay.time = (delayB_speed_knob.value / 100);
    // pingPongDelay.feedback = (delayB_feedback_knob.value / 120);
    // pingPongDelay.mix = (delayB_drywet_knob.value / 100);

    let sUrls = getSamplesFromTxt(client_seed);

    for(var i=0; i < sUrls.length; i++) {
        sU = sUrls[i];

        const sampler = new Pizzicato.Sound(sU, () => {
            //oscillators.addSound(sampler); samplerMasterAmp
            //sampler.play();
            sampler.volume = ((samplerMasterAmp.value + 0.01) / 1000);
            sampler.play();
        });
    }

    oscillators.volume = ((synthMasterAmp.value + 0.01) / 1000.0);
    oscillators.play();

    if (isRemote) {
        noteTimer = setTimeout(function () {
          oscillators.stop();
        }, dur);
    }
}


// playButton.addEventListener('click', function() {
//     if (!isInit) {
//         initAudio();
//     }
//     playClientMessage(getRandomArbitrary(20, 100).toString());
// });

// launchCliButton.addEventListener('click', function() {
//     if (!isInit) {
//         initAudio();
//     }
//     //window.open("client.html");
// });

document.body.addEventListener('click', function() {
    if (!isInit) {
        initAudio();
    }
});


window.addEventListener('keydown', function(evt) {
  if(!(evt.key in keysdown)) {
    keysdown[evt.key] = true;

    if (enablePreviewCheckbox.checked == true){
        playPreview(evt.key.toString(), false);
    }

    if (enableTransmissionCheckbox.checked == true){
        console.log("Send");
        //playPreview(evt.key.toString(), false);
    }

  }
});

window.addEventListener('keyup', function(evt) {
  delete keysdown[evt.key];
  oscillators.stop();
});


// -------------------------------------------------------------
// -------------------------------------------------------------
// FILEMGMT: ---------------------------------------------------

document.addEventListener("DOMContentLoaded", init, false);

function handleFileSelect(e) {

    if(!e.target.files) return;

    var files = e.target.files;
    for(var i=0; i < files.length; i++) {
        var f = files[i];
    }

}


// var element = document.createElement('div');
// element.innerHTML = '<input type="file">';
// var fileInput = element.firstChild;
//
// fileInput.addEventListener('change', function() {
//     var file = fileInput.files[0];
//
//     if (file.name.match(/\.(mp3|wav)$/)) {
//         var reader = new FileReader();
//
//         reader.onload = function() {
//             console.log(reader.result);
//             context.loadSound(result.result, 'beep');
//
//             //currentSamples.append(reader.);
//         };
//
//         reader.readAsText(file);
//     } else {
//         alert("File not supported, mp3 or wav files only");
//     }
// });

// -------------------------------------------------------------
// -------------------------------------------------------------
// PEER: -------------------------------------------------------

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function initialize() {
    console.log("Initializing Host");
    // Create own peer object with connection to shared PeerJS server

    if (setChannelBox.value == "") {
        // TODO:
        //currentChannelName = makeid(10);
        currentChannelName = makeid(10);
    } else {
        currentChannelName = setChannelBox.value;
    }

    if (setServerBox.value != "") {
        current_server = setServerBox.value;

        peer = new Peer(currentChannelName, {
            host: current_server,
            port: currentPort,
            path: '/peer'
        });
    } else {
        peer = new Peer(currentChannelName, {
            debug: 2
        });
    }

    peer.on('open', function (id) {
        // Workaround for peer.reconnect deleting previous id
        if (peer.id === null) {
            console.log('Received null id from peer open');
            peer.id = lastPeerId;
        } else {
            lastPeerId = peer.id;
        }

        console.log('ID: ' + peer.id);
        recvId.innerHTML = "Status: Connected to: " + peer.id;
        status.innerHTML = "Status: Awaiting connections...";
    });

    peer.on('connection', function (c) {

        // Allow only a single connection
        // if (conn) {
        //     c.on('open', function() {
        //         c.send("Already connected to another client");
        //         setTimeout(function() { c.close(); }, 500);
        //     });
        //     return;
        // }

        conn = c;
        console.log("Connected to: " + conn.peer);
        status.innerHTML = "Status: Connected"
        ready();
    });

    peer.on('disconnected', function () {
        status.innerHTML = "Connection lost. Please reconnect";
        console.log('Connection lost. Please reconnect');

        // Workaround for peer.reconnect deleting previous id
        peer.id = lastPeerId;
        peer._lastServerId = lastPeerId;
        peer.reconnect();
    });

    peer.on('close', function() {
        conn = null;
        status.innerHTML = "Status: Connection destroyed. Please refresh";
        console.log('Connection destroyed');
    });

    peer.on('error', function (err) {
        console.log(err);
        //alert('' + err);
    });

    if (!isInit) {
        initAudio();
    }
};

/**
 * Triggered once a connection has been achieved.
 * Defines callbacks to handle incoming data and connection events.
 */
function ready() {
    conn.on('data', function (data) {
        console.log("Data recieved");
        playPreview(data.toString(), true);

        // var cueString = "<span class=\"cueMsg\">Cue: </span>";
    });
    conn.on('close', function () {
        status.innerHTML = "Status: Connection reset<br>Awaiting connection...";
        conn = null;
        //start(true);
    });
}

function join() {
    // Close old connection
    if (conn) {
        conn.close();
    }

    // Create connection to destination peer specified in the input field
    conn = peer.connect(recvIdInput.value, {
        reliable: true
    });

    conn.on('open', function () {
        status.innerHTML = "Connected to: " + conn.peer;
        console.log("Connected to: " + conn.peer);

        // Check URL params for comamnds that should be sent immediately
        var command = getUrlParam("command");
        if (command)
            conn.send(command);
    });
    // Handle incoming data (messages only since this is the signal sender)
    conn.on('data', function (data) {
        addMessage("<span class=\"peerMsg\">Peer:</span> " + data);
    });
    conn.on('close', function () {
        status.innerHTML = "Connection closed";
    });
};

/**
 * Get first "GET style" parameter from href.
 * This enables delivering an initial command upon page load.
 *
 * Would have been easier to use location.hash.
 */
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


function addMessage(msg) {
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

    message.innerHTML = "<br><span class=\"msg-time\">" + h + ":" + m + ":" + s + "</span>  -  " + msg + message.innerHTML;
};

function clearMessages() {
    message.innerHTML = "";
    addMessage("Msgs cleared");
};

// Clear messages box
startHostButton.onclick = function () {
    console.log("startHostButton");
    initialize();
};

// previewBtn.addEventListener('click', playClientMessage(previewBox.value));

previewBtn.onclick = function () {
    console.log("previewBtn");
    playPreview(previewBox.value, true);
};

function initUI(){
    masterAmp_slider.value= 30;
    attack_knob.value = 5;
    duration_knob.value = 30;
    release_knob.value = 15;

    osc_a_vol_knob.value = 20;
    osc_b_vol_knob.value = 10;
    osc_c_vol_knob.value = 10;
}

duration_knob.oninput = function () {
    console.log(duration_knob.value);
};

function init() {
    console.log("OK?");
    window.onbeforeunload = function () {
      window.scrollTo(0, 0);
    }
    initUI();
}
