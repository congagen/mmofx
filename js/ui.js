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
var isTouchDevice = 'ontouchstart' in document.documentElement;
var padCount = 0;


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

function updateKeyMap_(keyId) {
    let keyItem = currentKeyboard[keyId];
    padCount += 1;
    let cId = keyId.toString();
    let inputId = keyId + "_input";

    // <div class="col-xs-2">
    var padCol = $('<div class="col-2 col-xs-1 py-2 px-2"></div>');
    let card_a = '<div type="button" class="card" id="' + "playBtn" + '">';
    let card_b = '<div class="card-block"><div class="card-title"></div>';
    let card_c = '<div class="col-xs-2 keyPad">';
    let card_d = '<input id="pInput_'+ padCount.toString() +'" class="form-control text-center keyPadInput" placeholder="'
    let card_e = keyId + '"> </input></div>';
    let card_f = '';
    let card_g = '</div></div>';

    var keyPanel = $(card_a + card_b + card_c + card_d + card_e + card_f + card_g);
    keyPanel.appendTo(padCol);
    padCol.appendTo('#contentPanel');

    var nameField = $("<input id=keyNameField" + keyId + " size='4' type = 'text' value = " + keyItem[0] + " readonly>");

    var trgKeysInput = $("<input id=" + keyId.toString() + " size='4' type = 'text' value = " + keyItem[2].toLowerCase() + "></input>");
    trgKeysInput.change(function () {
        var sId = trgKeysInput.attr('id');
        console.log(currentKeyboard[sId]);

        let a = document.getElementById(sId.toString());
        currentKeyboard[sId][2] = a.value;
    });

    var btnPreview = $("<input id=" + keyId + " type = 'button' value = 'Play'/>");
    keyPanel.mousedown(function () {
        console.log("Mouse Down");

        console.log(keyId);
        playKey(keyId, false);
    });

    keyPanel.mouseup(function () {
        console.log("Mouse Up");
        oscillators.stop();
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


function toggleEditMode(isEnabled) {
    var all = document.getElementsByClassName("keyPadInput");
    for (var i=0, max=all.length; i < max; i++) {
        console.log(i);
        all[i].readOnly = !isEnabled;
    }
}


function initKeyMap(){
    padCount = 0;

    for (var i = 33; i < 96; i++) {
        var l = String.fromCharCode(i).toLowerCase();

        currentKeyboard[l] = [l, l, "a", "b"]
        updateKeyMap_(l);
    }

    toggleEditMode(false);

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


function initUI() {
    console.log("Initializing Host");

    window.onbeforeunload = function () {
      window.scrollTo(0, 0);
    }

    if (!isInitUI) {
        initAudio();
    }

    initKeyMap();

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


document.body.addEventListener('click', function() {
    if (!isInitAudio) {
        initAudio();
    }
});


document.addEventListener("DOMContentLoaded", initUI, false);
