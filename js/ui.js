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

    let cId = keyId.toString() + "_panel";

    var myCol = $('<div class="col-sm-2 col-md-2 pb-2"></div>');
    let card_a = '<div type="button" class="card card-outline-info" id="' + "playBtn" + '">';
    let card_b = '<div class="card-block"><div class="card-title"><span>Card #' + cId + '</span></div>';
    let card_c = '<p>' + keyId + '</p>';
    let card_d = ''; //'<input id="freq_' + cId + '" placeholder="100"/>';
    let card_e = ''; //'<button type="button" name="button">Play</button>';
    let card_f = '';
    let card_g = '</div></div>';

    var keyPanel = $(card_a + card_b + card_c + card_d + card_e + card_f + card_g);
    keyPanel.appendTo(myCol);
    myCol.appendTo('#contentPanel');

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


function updateKeyMap(keyId) {
    let keyItem = currentKeyboard[keyId];
    var keyConfTableContainer = $("#sampleTableContainer");
}


function initKeyMap(){

    for (var i = 33; i < 96; i++) {
        var l = String.fromCharCode(i).toLowerCase();

        currentKeyboard[l] = [l, l, "a", "b"]
        updateKeyMap_(l);
    }

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
