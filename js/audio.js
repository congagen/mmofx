// WebAudio
let ctx;
var out;
var oscA_gain;
var oscA;
var oscB;
var context;

var noteTimer;
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


// var sample = new Pizzicato.Sound();
var oscillators = new Pizzicato.Group([oscA, oscB, oscC]);

oscillators.addEffect(dubDelayA);
oscillators.addEffect(dubDelayB);
oscillators.addEffect(reverb);

let oscList = [oscA, oscB, oscC];

var currentSamples = {};
let testSampleBtn = document.getElementById("debugSample");

var lastPlayedKey = "";


////////////////////////////////////////////////////////////////////////////////
// SAMPLER  ////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


function playSample(sampleId) {
    let sUrl = currentSamples[sampleId][1];
    console.log("Playing: " + currentSamples[sampleId][0]);
    console.log("TrgKeys: " + currentSamples[sampleId][2]);

    var sample = new Pizzicato.Sound(sUrl, function() {
        sample.play();
    });
    // sample.path = sUrl;
    // sample.addEffect(samplerDubDelayA);

}

function getSamplesFromTxt(samKey) {
    var sToPlay = [];
    var curKeys = Object.keys(currentSamples);

    if (curKeys.length > 0) {

        for(var i = 0; i < curKeys.length; i++) {
            let k = curKeys[i];
            let sam = currentSamples[k];
            let sKeys = sam[2].toString();

            if (sKeys.includes(samKey)) {
                let sUrl = sam[1];
                sToPlay.push(sUrl);
            }
        }
    }

    return sToPlay;
}


function initDefSamples(){
    console.log("initDefSamples");

    var f = new File([""], "xus.wav");
    var files = [f];

    for(var i=0; i < files.length; i++) {
        let fName = files[i].name.toString();
        var sKey = URL.createObjectURL(files[i]).toString();
        let sUrl = URL.createObjectURL(files[i]);
        let trgKeys = fName[0].toLowerCase();

        currentSamples[sKey] = [fName, sUrl, fName[0].toLowerCase()];
        AddSampleListRow(sKey);
    }
}


function clearSamplesList() {
    $("#sampleTableContainer tr").remove();
}


async function addSamplesBtnClicked(){
    let files = await selectFile("audio/*", true);
    console.log(files);
    console.log(URL.createObjectURL(files[0]));

    for(var i=0; i < files.length; i++) {
        let fName = files[i].name.toString();
        var sKey = URL.createObjectURL(files[i]).toString();
        let sUrl = URL.createObjectURL(files[i]);
        let trgKeys = fName[0].toLowerCase();

        currentSamples[sKey] = [fName, sUrl, fName[0].toLowerCase()];
        AddSampleListRow(sKey);
    }
}


function selectFile (contentType, multiple){
    return new Promise(resolve => {
        let input = document.createElement('input');
        input.type = 'file';
        input.multiple = multiple;
        input.accept = contentType;

        input.onchange = _ => {
            let files = Array.from(input.files);
            if (multiple)
                resolve(files);
            else
                resolve(files[0]);
        };

        input.click();
    });
}


// -------------------------------------------------------------
// -------------------------------------------------------------
// MAIN: -------------------------------------------------------
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


function playKey(client_seed, isRemote) {

    Pizzicato.volume = (masterAmp_slider.value / 110);
    var dur = (duration_knob.value + 1);
    //clearTimeout(noteTimer);

    oscA.volume = ((osc_a_vol_knob.value + 1.0) / 1001.0);
    oscA.frequency = parseInt(1000 * Math.abs(Math.sin(strToNum(client_seed))));

    oscB.volume = ((osc_b_vol_knob.value + 1.0) / 1001.0);
    oscB.frequency = parseInt(1000 * Math.abs(Math.sin(strToNum(client_seed))));

    oscC.volume = ((osc_c_vol_knob.value + 1.0) / 1001.0);
    oscC.frequency = parseInt(1000 * Math.abs(Math.sin(strToNum(client_seed))));

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

    oscillators.volume = ((synthMasterAmp.value + 0.01) / 1000.0);

    var now = parseFloat(context.currentTime);
    let releaseKnobVal = parseFloat(release_knob.value * 0.1);
    let stopTime = (now + 0.5);

//    for(var i=0; i < oscList.length; i++) {
//        if (client_seed == lastPlayedKey) {
//            console.log("client_seed == lastPlayedKey");
//            oscList[i].stop();
//        }
//
//        oscList[i].attack  = parseFloat(attack_knob.value / 100);
//        oscList[i].release = parseFloat(release_knob.value / 1000);
//    }

    // oscillators.attack  = parseFloat(attack_knob.value / 100);
    // oscillators.release = parseFloat(release_knob.value / 1000);

    //oscillators.play();
    //oscillators.stop();

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

    lastPlayedKey = client_seed.toString();
}

document.body.addEventListener('click', function() {
    if (!isInitAudio) {
        initAudio();
    }
});


window.addEventListener('keydown', function(evt) {

    if (!(evt.key in keysdown)) {
        keysdown[evt.key] = true;

        if (enablePreviewCheckbox.checked == true) {
            playKey(evt.key.toString(), false);
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
    }

});


window.addEventListener('keyup', function(evt) {
    //delete keysdown[evt.key];
    //oscillators.stop();
});


function initAudio() {
    if (!isInitAudio) {

        try {
            if (!isInitAudio){
                context = Pizzicato.context;
                isInitAudio = true;
            }

            console.log("Audio initialized... ");
        }
            catch(e) {
            alert('Web Audio API is not supported in this browser');
        }
    }
}
