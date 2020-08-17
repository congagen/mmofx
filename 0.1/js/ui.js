var masterAmp_slider = document.getElementById("masterAmp");

var enablePreviewCheckbox = document.getElementById("enablePreviewCheckbox");
var enableTransmissionCheckbox = document.getElementById("enableTransmissionCheckbox");
var receiveCommandsCheckbox = document.getElementById("receiveCommandsCheckbox");
var randomizePlaybackCheckbox = document.getElementById("randomizePlaybackCheckbox");

var currentChannelDisplay = document.getElementById("currentChannelDisplay");
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

// var setChannelButton = document.getElementById("setChannelNameButton");
var noteTimer;

var username_input_box = document.getElementById("username_input_box");

var channelNameInputBox = document.getElementById("channelNameInputBox");
var setChannelNameButton = document.getElementById("setChannelNameButton");

var cueString = "<span class=\"cueMsg\">Cue: </span>";
var currentKeyboard = {"a": ["a1","b1","c1"]};
var isTouchDevice = "ontouchstart" in document.documentElement;
var padCount = 0;


function AddSampleListRow(sampleId) {
    let sItem = currentSamples[sampleId];

    var sampleTableContainer = $("#sampleTableContainer");
    var row = sampleTableContainer[0].insertRow(-1);
    var cell = row.insertCell(-1);

    var nameField = $("<input id=sNameField" + sampleId + " size='4' type = 'text' value = " + sItem[0] + " readonly>");
    $(cell).append(nameField);

    var trgKeysInput = $("<input id=" + sampleId.toString() + " size='4' type = 'text' value = " + sItem[2].toLowerCase() + "></input>");
    trgKeysInput.change(function () {
        var sId = trgKeysInput.attr('id');
        let a = document.getElementById(sId.toString());
        currentSamples[sId][2] = a.value;
    });

    var btnPreview = $("<input id=" + sampleId + " type = 'button' value = '>'/>");
    btnPreview.click(function () {
        var row = btnPreview.closest("TR");
        var sId = btnPreview.attr('id');
        console.log("Umm: " + sId);
        previewSample(sId);
    });

    var btnRemove = $("<input id=" + sampleId + " type = 'button' value = 'X'/>");
    btnRemove.click(function () {
        var row = btnRemove.closest("TR");
        var sId = btnPreview.attr('id');

        delete currentSamples[sId];
        row.remove();
    });

    $(cell).append(" ");
    $(cell).append("Keys: ");
    $(cell).append(trgKeysInput);
    $(cell).append(" ");

    $(cell).append(btnPreview);
    $(cell).append(btnRemove);
}


function playNetworkCmd(cmdText) {
    let dbData = {
        "session_id": currentSessionId,
        "playedKey": cmdText.toString()
    };

    let clearData = {
        "session_id": currentSessionId,
        "playedKey": ""
    };

    let rsp = writeToDB(currentChannelName, dbData);
    console.log(rsp);
}


function updateKeyPad(keyId) {
    let keyItem = currentKeyboard[keyId];
    padCount += 1;

    // <div class="col-xs-2">
    var padCol = $('<div class="col-sm-1 px-1 py-1"></div>');
    let card_a = '<div class="card" style="width:100%; height:100%;" id="' + "playBtn" + keyId + '">';
    let card_b = '<div class="card-block"> <div id="' + 'pInput_' + keyId.toString() + '" class="card-title"></div>';
    let card_c = '<div class="keyPad" style="width:100%; height:100%;">';

    let card_d = '<input type="text" class="form-control text-center keyPadInput" placeholder="' + keyId + '"> </input>'
    let card_e = '</div>';
    let card_f = '</div>';
    let card_g = '';

    // console.log("playBtn" + keyId);

    var keyPanel = $(card_a + card_b + card_c + card_d + card_e + card_f + card_g);
    keyPanel.appendTo(padCol);
    padCol.appendTo('#contentPanel');

    var nameField = $("<input id=keyNameField" + keyId + " size='4' type = 'text' value = " + keyItem[0] + " readonly>");

    var trgKeysInput = $("<input id=" + keyId.toString() + " size='4' type = 'text' value = " + keyItem[2].toLowerCase() + "></input>");
    trgKeysInput.change(function () {
        var sId = trgKeysInput.attr('id');

        let a = document.getElementById(sId.toString());
        currentKeyboard[sId][2] = a.value;
    });

    var btnPreview = $("<input id=" + keyId + " type = 'button' value = 'Play'/>");

    keyPanel.mousedown(function () {
        console.log("Mouse Down");
        console.log(keyId);

        if (enableTransmissionCheckbox.checked == true) {
            console.log("Sending: " + keyId.toString());
            playNetworkCmd(keyId);
        } else {
            playKey(keyId, false, false);
        }

    });

    keyPanel.mouseup(function () {
        //console.log("Mouse Up");
        //oscillators.stop();
    });

    if (isTouchDevice){
        // keyPanel.touchstart(function () {
        //     console.log("Touch Start");
        //
        //     console.log(keyId);
        //     if (enablePreviewCheckbox.checked == true){
        //         playKey(keyId, false);
        //     }
        // });
        //
        // keyPanel.touchend(function () {
        //     console.log("Touch Stop");
        //     oscillators.stop();
        // });
    }

    // <input checked type="checkbox" class="form-check-input" id="enablePreviewCheckbox">
    let synCheckboxId = keyId + "_" + "synActiveForKey";
    var synthCheckbox = $("<input checked type=\"checkbox\" id=\"" + synCheckboxId + "\" type = 'button' />");
    synthCheckbox.click(function () {
        console.log(synCheckboxId);
    });

    let samplerCheckboxId = keyId + "_" + "synActiveForKey";
    var samplerCheckbox = $("<input checked type=\"checkbox\" id=\"" + samplerCheckboxId + "\" type = 'button' />");
    samplerCheckbox.click(function () {
        console.log(samplerCheckboxId);
    });

}


async function addSamplesBtnClicked(){
//    let files = await selectFile("audio/*", true);
    let files = await selectFile("", true);
    //console.log(files);
    //console.log(URL.createObjectURL(files[0]));

    for (var i=0; i < files.length; i++) {
        //console.log(files[i]);
        var fileName = files[i].name.toString();
        var ext = fileName.substr(fileName.lastIndexOf('.') + 1);

        if (ext == "wav" || ext == "mp3") {
            let fName = files[i].name.toString();
            var sKey = URL.createObjectURL(files[i]).toString();
            let sUrl = URL.createObjectURL(files[i]);
            let trgKeys = fName[0].toLowerCase();

            // TODO: TrgKey from
            currentSamples[sKey] = [fName, sUrl, fName[0].toLowerCase()];
            AddSampleListRow(sKey);
        }
    }
}


function toggleEditMode(isEnabled) {
    var all = document.getElementsByClassName("keyPadInput");
    for (var i=0, max=all.length; i < max; i++) {
        all[i].readOnly = !isEnabled;
    }
}


function initKeyMap(){
    padCount = 0;

    for (var i = 33; i < 256; i++) {
        var l = String.fromCharCode(i).toLowerCase();

        currentKeyboard[l] = [l, l, "a", "b"]
        updateKeyPad(l);
    }

    toggleEditMode(false);

}


function strToNum(inputString) {
    var composite = "1";

    for (var i = 0; i < inputString.length; i++) {
        composite += inputString.charCodeAt(i).toString();
    }
    return parseInt(composite);
}


function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}


function handleFileSelect(e) {
    if(!e.target.files) return;

    var files = e.target.files;
    for(var i=0; i < files.length; i++) {
        var f = files[i];
    }

}


function initUI() {
    console.log("Initializing Host");

    window.onbeforeunload = function () {
      window.scrollTo(0, 0);
    }

    if (!isInitUI) {
        initAudio();
    }

    initKeyMap();

    masterAmp_slider.value= 90;
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


// TODO:
function updateChannel(){
    console.log("TODO: Update DB Channel Name");
    console.log("New Channel: " + currentChannelName);

    if (channelNameInputBox.value != "") {
        currentChannelName = channelNameInputBox.value;
        subscribeToDb(currentChannelName);
        console.log("Switching to channel: " + currentChannelName);
    }

}

setChannelNameButton.addEventListener("click", updateChannel);

document.addEventListener("DOMContentLoaded", initUI, false);

window.addEventListener('keydown', function(evt) {

    if (enablePreviewCheckbox.checked == true) {
        playKey(evt.key.toString(), false, false);
        console.log("playKbd");
    }

    if (enableTransmissionCheckbox.checked == true) {
        console.log("Send");
        let data = {};

        let dbData = {
            "session_id": currentSessionId,
            "playedKey": evt.key.toString()
        };

        let rsp = writeToDB(currentChannelName, dbData);
        console.log(rsp);
    }

});


window.addEventListener('keyup', function(evt) {});


document.body.addEventListener('click', function() {
    if (!isInitAudio) {
        initAudio();
    }
});

document.body.addEventListener('touchend', function() {
    if (!isInitAudio) {
        initAudio();
    }
});