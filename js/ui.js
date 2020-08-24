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

var apiDir = {};
let charlist = ["0","1","2","3","4","5","6","7","8","9","q","w","e","r","t","y","u","i","o","p","a","s","d","f","g","h","j","k","l","z","x",
"c","v","b","n","m",",",".","-","!","#","€","%","/","(",")","0","`","^","*","'","¨",">","<","°","§","©","@","£","$",
"∞","§","|","[","]","≈","±","~","™","•","Ω","é","®","†","µ","ü","ı","œ","π","˙","","ß","∂","ƒ","¸","˛","√","ª","ø",
"÷","≈","ç","‹","›","‘","◊","…","–","1","2","3","4","5","6","7","8","9","q","w","e","r","t","y","u","i","o","p","a","s","d","f","g","h","j","k","l","z","x",
"c","v","b","n","m",",",".","-","!","#","€","%","/","(",")","0","`","^","*","'","¨",">","<","°","§","©","@","£","$",
"∞","§","|","[","]","≈","±","~","™","•","Ω","é","®","†","µ","ü","ı","œ","π","˙","","ß","∂","ƒ","¸","˛","√","ª","ø",
"÷","≈","ç","‹","›","‘","◊","…","–"]

function addApiListRow() {
    var apiListContainer = $("#apiConfContainer");
    let rowID = uuidv4();

    apiDir[rowID] = {};
    apiDir[rowID]["url"] = "";
    apiDir[rowID]["data"] = "";
    apiDir[rowID]["keys"] = [];

    // -----------------------------------------------------------------------------------------------------------------
    var content = "<div class='col'> <input class='form-control' id='url" + rowID + "' type='text' placeholder='API Url' value='" + "" + "'> </div>"
    var urlNameRow  = $("<div class='row py-2 top-sample-row'> " + content + " </div>");
    var urlNameField = urlNameRow.find( "input" );

    urlNameField.change(function () {
        var sId = $(urlNameField).attr('id');
        let apiKey = document.getElementById(sId.toString());
        let urlNameValue = apiKey.value.toString();
        apiDir[rowID]["url"] = urlNameValue;
        console.log(apiDir);
    });

    // -----------------------------------------------------------------------------------------------------------------
    content = "<div class='col'> <input class='form-control' id='msg" + rowID + "' type='text' placeholder='Data' value='" + "" + "'> </div>"
    var messageRow  = $("<div class='row py-2 mid-sample-row'> " + content + " </div>");
    var msgInputKeysField = messageRow.find( "input" );

    msgInputKeysField.change(function () {
        var sId = $(msgInputKeysField).attr('id');
        let msgInputField = document.getElementById(sId.toString());

        let msg = msgInputField.value.toString();
        apiDir[rowID]["data"] = msg;
        console.log(apiDir);
    });

    // -----------------------------------------------------------------------------------------------------------------
    content = "<div class='col'> <input class='form-control' id='" + rowID + "' type='text' placeholder='Trig Keys' value='" + "" + "'> </div>"
    var trgKeyRow   = $("<div class='row py-2 mid-sample-row'> " + content + "</div>");

    var trgInputKeysField = trgKeyRow.find( "input" );

    trgInputKeysField.change(function () {
        var sId = $(trgInputKeysField).attr('id');
        let trgKeyInputField = document.getElementById(sId.toString());
        let trgK = trgKeyInputField.value.toString();
        apiDir[rowID]["keys"] = trgK;
        console.log(apiDir);
    });

    // -----------------------------------------------------------------------------------------------------------------

    let itmC = "<div class='col'> <input class='btn btn-light' type='button' value = 'Test'> </div>";

    var btnPreview = $(itmC);
    var prevBtn = btnPreview.find( "input" );
    prevBtn.click(function () {
        //TODO: Call Api
        console.log(apiDir);
        console.log("PrvBtn: " + apiDir[rowID]["url"] + ":" + apiDir[rowID]["data"]);
        //callRestApi(apiDir[rowID]["url"], apiDir[rowID]["data"]);
        const myValue = callRestApi(apiDir[rowID]["url"], apiDir[rowID]["data"]);
        //console.log(myValue);
    });

    // -----------------------------------------------------------------------------------------------------------------

    let itmD  = "<div class='col'> <input class='btn btn-light' type='button' value='Delete'> </div>";

    var btnRemove = $(itmD);
    var remoBtn = btnRemove.find( "input" );
    remoBtn.click(function () {
        delete apiDir[rowID];
        urlNameRow.remove();
        messageRow.remove();
        trgKeyRow.remove();
        bottomRow.remove();
    });

    // -----------------------------------------------------------------------------------------------------------------

    var bottomRow   = $("<div class='row py-2 btm-sample-row'> </div>");

    // -----------------------------------------------------------------------------------------------------------------

    // $(bottomRow).append(trgKeysInput);
    $(bottomRow).append(btnPreview);
    $(bottomRow).append(btnRemove);

    $(apiListContainer).append(urlNameRow);
    $(apiListContainer).append(messageRow);
    $(apiListContainer).append(trgKeyRow);
    $(apiListContainer).append(bottomRow);
}



function addSampleListRow(sampleId, sampleUrl) {
    let sItem = currentSamples[sampleId];

    var sampleTableContainer = $("#sampleTableContainer");
    var titleRow     = $("<div class='row py-2 top-sample-row' id='sam_row_a" + sampleId + "'> <div class='col'> <input class='form-control' id='sNameField" + sampleId + "' type='text' value='" + sItem[0] + "' readonly> </div> </div>");
    var trigKeysRow = $("<div class='row py-2 mid-sample-row'> <div class='col'> <input class='form-control' id='" + sampleId.toString() + "' type='text' value=" + sItem[2].toLowerCase() + "> </div> </div>");
    var samActionRow    = $("<div class='row py-2 btm-sample-row' id='sam_row_b" + sampleId + "'> </div>");

    // -----------------------------------------------------------------------------------------------------------------

    let nameField = $("<div class='col'> <input class='form-control' id='sNameField" + sampleId + "' type='text' value='" + sItem[0] + "' readonly> </div>");

    // -----------------------------------------------------------------------------------------------------------------

    let itmB = "<div class='col'> <input class='form-control' id='" + sampleId.toString() + "' type='text' value=" + sItem[2].toLowerCase() + "> </div>"

    var trgKeysInput = $(itmB);
    var trigInp = trgKeysInput.find( "input" );

    trigInp.change(function () {
        var inputId = $(trigInp).attr('id').toString();
        console.log(inputId);
        let trgKeyInputField = document.getElementById(inputId.toString());
        currentSamples[inputId][2] = trgKeyInputField.value.toString();
    });

    // -----------------------------------------------------------------------------------------------------------------

    let itmC = "<div class='col-xs-1 col-auto'> <input class='btn btn-light' type='button' value = 'Play'> </div>";

    var btnPreview = $(itmC);
    var prevBtn = btnPreview.find( "input" );
    prevBtn.click(function () {
        previewSample(sampleId);
    });

    // -----------------------------------------------------------------------------------------------------------------

    let itmD  = "<div class='col-xs-1 col-auto'> <input class='btn btn-light' type='button' value='X'> </div>";

    var btnRemove = $(itmD);
    var remoBtn = btnRemove.find( "input" );
    remoBtn.click(function () {
        delete currentSamples[sampleId.toString()];
        titleRow.remove();
        samActionRow.remove();
    });

    // -----------------------------------------------------------------------------------------------------------------

    //$(sampleRow).append(nameField);
    $(samActionRow).append(trgKeysInput);
    $(samActionRow).append(btnPreview);
    $(samActionRow).append(btnRemove);

    $(sampleTableContainer).append(titleRow);
    //$(sampleTableContainer).append(trigKeysRow);
    $(sampleTableContainer).append(samActionRow);
}



async function addSamplesLsDisk(){
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
            addSampleListRow(sKey, sUrl);
        }
    }

    console.log(currentSamples);
}


function initTrgKeys() {
    var c = 0;
    for (const [key, value] of Object.entries(currentSamples)) {
        let s = currentSamples[key];
        let currentKeys = s[2];

        c += 1;
        if (c > (charlist.length - 1)) {
            c = 0;
        }

        currentSamples[key][2] = charlist[c];
        document.getElementById(key).value = charlist[c];
    }
}


function clearSamples() {
    for (const [key, value] of Object.entries(currentSamples)) {
        delete currentSamples[key];
        document.getElementById("sam_row_a"+key).remove();
        document.getElementById("sam_row_b"+key).remove();
    }
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

function addKeyPad(keyId) {
    let keyItem = currentKeyboard[keyId];
    padCount += 1;

    // <div class="col-xs-2">
    var padCol = $('<div class="col-sm-1 px-1 py-1" style="width:20%;"></div>');
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
    padCol.appendTo('#keyPadPanel');

    //var nameField = $("<input id=keyNameField" + keyId + " size='4' type = 'text' value = " + keyItem[0] + " readonly>");

//    var trgKeysInput = $("<input id=" + keyId.toString() + " size='4' type = 'text' value = " + keyItem[2].toLowerCase() + "></input>");
//    trgKeysInput.change(function () {
//        var sId = trgKeysInput.attr('id');
//
//        let a = document.getElementById(sId.toString());
//        currentKeyboard[sId][2] = a.value;
//    });

    //var btnPreview = $("<input id=" + keyId + " type = 'button' value = 'Play'/>");
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
        all[i].readOnly = !isEnabled;
    }
}


function initKeyMap(){
    padCount = 0;

    for (var i = 0; i < charlist.length; i++) {
        var l = charlist[i].toLowerCase();

        currentKeyboard[l] = [l, l, "a", "b"]
        addKeyPad(l);
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