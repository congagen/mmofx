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

// var setChannelButton = document.getElementById("setChannelNameButton");
var noteTimer;

var setServerBox = document.getElementById("setServerBox");
var previewBox = document.getElementById("previewBoxHost");
var previewBtn = document.getElementById("previewBtnHost");

var cueString = "<span class=\"cueMsg\">Cue: </span>";
var currentKeyboard = {"a": ["a1","b1","c1"]};


function AddSampleListRow(sampleId) {
    let sItem = currentSamples[sampleId];

    var sampleTableContainer = $("#sampleTableContainer");
    var row = sampleTableContainer[0].insertRow(-1);
    var cell = row.insertCell(-1);

    var nameField = $("<input id=sNameField" + sampleId + " size='4' type = 'text' value = "+sItem[0]+" readonly>");
    $(cell).append(nameField);

    var trgKeysInput = $("<input id=" + sampleId.toString() + " size='4' type = 'text' value = "+sItem[2].toLowerCase()+"></input>");
    trgKeysInput.change(function () {
        var sId = trgKeysInput.attr('id');
        console.log(currentSamples[sId]);

        let a = document.getElementById(sId.toString());
        currentSamples[sId][2] = a.value;
    });

    var btnPreview = $("<input id=" + sampleId + " type = 'button' value = 'Preview'/>");
    btnPreview.click(function () {
        var row = btnPreview.closest("TR");
        var sId = btnPreview.attr('id');
        playSample(sId);
    });

    var btnRemove = $("<input id=" + sampleId + " type = 'button' value = 'Remove'/>");
    btnRemove.click(function () {
        var row = btnRemove.closest("TR");
        var sId = btnPreview.attr('id');

        delete currentSamples[sId];
        row.remove();
    });

    $(cell).append(" ");
    $(cell).append("Trg Keys: ");
    $(cell).append(trgKeysInput);
    $(cell).append(" ");

    $(cell).append(btnPreview);
    $(cell).append(btnRemove);

}


function updateKeyMap(keyId) {
    console.log(keyId);
    let keyItem = currentKeyboard[keyId];

    var keyConfTableContainer = $("#keyTable");
    var row = keyConfTableContainer[0].insertRow(-1);
    var cell = row.insertCell(-1);

    var nameField = $("<input id=keyNameField" + keyId + " size='4' type = 'text' value = " + keyItem[0] + " readonly>");

    var trgKeysInput = $("<input id=" + keyId.toString() + " size='4' type = 'text' value = " + keyItem[2].toLowerCase() + "></input>");
    trgKeysInput.change(function () {
        var sId = trgKeysInput.attr('id');
        console.log(currentKeyboard[sId]);

        let a = document.getElementById(sId.toString());
        currentKeyboard[sId][2] = a.value;
    });

    var btnPreview = $("<input id=" + keyId + " type = 'button' value = 'Preview'/>");
    btnPreview.click(function () {
        var row = btnPreview.closest("TR");
        var sId = btnPreview.attr('id');
        //playSample(sId);
    });

    var btnRemove = $("<input id=" + keyId + " type = 'button' value = 'Remove'/>");
    btnRemove.click(function () {
        var row = btnRemove.closest("TR");
        var sId = btnPreview.attr('id');

        delete currentKeyboard[sId];
        row.remove();
    });

    $(cell).append(" ");
    $(cell).append("Key: ");
    $(cell).append(trgKeysInput);
    $(cell).append(" ");
    $(cell).append(nameField);
    $(cell).append(btnPreview);
    $(cell).append(btnRemove);

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


function handleFileSelect(e) {
    if(!e.target.files) return;

    var files = e.target.files;
    for(var i=0; i < files.length; i++) {
        var f = files[i];
    }

}

function initKeyMap(){
    let kbKeys = [
        "1","2","3","4","5","6","7","8","9","0",
        "1","2","3","4","5","6","7","8","9","0",
        "1","2","3","4","5","6","7","8","9","0",
        "1","2","3","4","5","6","7","8","9","0"
    ]

    for (var i = 60; i < 96; i++) {
        var l = String.fromCharCode(i).toLowerCase();
        console.log(l);
        // currentKeyboard[l] = [l,"a"]
        // updateKeyMap(l);
    }
}


function initUI() {
    console.log("Initializing Host");

    window.onbeforeunload = function () {
      window.scrollTo(0, 0);
    }

    initKeyMap();

    if (!isInitUI) {
        initAudio();
    }

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

previewBtn.onclick = function () {
    console.log("previewBtn");
    playKey(previewBox.value, true);
};

window.addEventListener('keydown', function(evt) {
  if(!(evt.key in keysdown)) {
    keysdown[evt.key] = true;

    if (enablePreviewCheckbox.checked == true){
        playKey(evt.key.toString(), false);
    }

    if (enableTransmissionCheckbox.checked == true){
        console.log("Send");
    }

  }
});

window.addEventListener('keyup', function(evt) {
  delete keysdown[evt.key];
  oscillators.stop();
});

document.body.addEventListener('click', function() {
    if (!isInitAudio) {
        initAudio();
    }
});

document.addEventListener("DOMContentLoaded", initUI, false);
