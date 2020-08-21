// WebAudio
var source;
var songLength;

var noteTimer;
var keysdown = {};

var currentSamples = {};
let testSampleBtn = document.getElementById("debugSample");

let midiOutput = null;


function connectMidi(){
    navigator.requestMIDIAccess()
    .then(function(midiAccess) {
      const outputs = Array.from(midiAccess.outputs.values());
      console.log(outputs);
    });
}

////////////////////////////////////////////////////////////////////////////////
// SAMPLER  ////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


function playBuffer(path) {
    var context = window.audioContext;
    var request = new XMLHttpRequest();

    request.open('GET', path, true);
    request.responseType = 'arraybuffer';
    request.addEventListener('load', function (e) {
        context.decodeAudioData(this.response, function (buffer) {
            var source = context.createBufferSource();
            source.buffer = buffer;
            source.connect(context.destination);
            source.start(0);
        });
    }, false);

    context.resume();
    request.send();
}



function playBuffer_(sample_path) {
    console.log("playBuffer");
    var curSource = audioCtx.createBufferSource();
    var curRequest = new XMLHttpRequest();

    curRequest.open('GET', sample_path, true);
    curRequest.responseType = 'arraybuffer';

    curRequest.onload = function() {
        let audioData = curRequest.response;

        audioCtx.decodeAudioData(audioData, function(buffer) {
            myBuffer = buffer;
            songLength = buffer.duration;
            curSource.buffer = myBuffer;
            curSource.playbackRate.value = 1;
            curSource.connect(audioCtx.destination);
            curSource.loop = false;
        },
            function(e){"Error with decoding audio data" + e.error
        });
    }

    curRequest.send();
    curSource.start();
}


function playKey(sampleKey, isRemote, randomize) {
    console.log(sampleKey);
    let sampleUrls = getSamplesFromTxt(sampleKey);

    if (randomizePlaybackCheckbox.checked == true) {
        var curKeys = Object.keys(currentSamples);

        let sKey = curKeys[parseInt(Math.random() * (curKeys.length - 1) + 0)];
        let sam = currentSamples[sKey];
        let sUrl = sam[1];
        playBuffer(sUrl);

    } else {
        for (var i=0; i < sampleUrls.length; i++) {
            playBuffer(sampleUrls[i]);
        }
    }

}


function previewSample(sampleUrl) {
    playBuffer(sampleUrl);
}


function getSamplesFromTxt(samKey) {
    var sToPlay = [];
    var curKeys = Object.keys(currentSamples);

    for (var i = 0; i < curKeys.length; i++) {
        let k = curKeys[i];
        let sam = currentSamples[k];
        let sKeys = sam[2].toString();

        if (sKeys.includes(samKey)) {
            let sUrl = sam[1];
            console.log(sUrl);
            sToPlay.push(sUrl);
        }
    }

    return sToPlay;
}


function initDefSamples(){
    console.log("initDefSamples");

    var f = new File([""], "xus.wav");
    var files = [f];

    for (var i=0; i < files.length; i++) {
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


function highlightCard(cardID) {
    console.log("HL: " + cardID);
    var sCard = document.getElementById(cardID);
    console.log(sCard);
    sCard.classList.add("active");
    sCard.style.color = "blue";
    sCard.parentNode.style.color = "red";
    sCard.parentNode.parentNode.style.color = "red";
}



function initAudio() {
    if (!isInitAudio) {

        try {
            if (!isInitAudio) {
                var AudioContext = window.AudioContext // Default
                    || window.webkitAudioContext // Safari and old versions of Chrome
                    || false;

                if (AudioContext) {
                    audioCtx = new AudioContext;

                    if(window.webkitAudioContext) {
                        audioCtx = new window.webkitAudioContext();
                    } else {
                        audioCtx = new window.AudioContext();
                    }

                    console.log("AudioContext OK");
                    isInitAudio = true;

                } else {
                    console.log("AudioContext ERR");
                    alert("Sorry, but the Web Audio API is not supported by your browser. Please, consider upgrading to the latest version or downloading Google Chrome or Mozilla Firefox");
                }

            }

            console.log("Audio initialized... ");
        }
            catch(e) {
            alert('Web Audio API is not supported in this browser');
        }
    }
}









//var oscA = new Pizzicato.Sound({
//    source: 'wave',
//    options: {
//        type: 'sine'
//    }
//});
//
//var oscB = new Pizzicato.Sound({
//    source: 'wave',
//    options: {
//        type: 'square'
//    }
//});
//
//var oscC = new Pizzicato.Sound({
//    source: 'wave',
//    options: {
//        type: 'sawtooth'
//    }
//});

//var pingPongDelay = new Pizzicato.Effects.PingPongDelay({
//    feedback: 0.6,
//    time: 0.4,
//    mix: 0.5
//});
//
//var dubDelayA = new Pizzicato.Effects.DubDelay({
//    feedback: 0.6,
//    time: 0.25,
//    mix: 0.5,
//    cutoff: 3000
//});
//
//var dubDelayB = new Pizzicato.Effects.DubDelay({
//    feedback: 0.6,
//    time: 0.25,
//    mix: 0.5,
//    cutoff: 1500
//});
//
//var reverb = new Pizzicato.Effects.Reverb({
//    time: 1,
//    decay: 0.8,
//    reverse: false,
//    mix: 0.5
//});
//
//
//// var sample = new Pizzicato.Sound();
//var oscillators = new Pizzicato.Group([oscA, oscB, oscC]);
//
//oscillators.addEffect(dubDelayA);
//oscillators.addEffect(dubDelayB);
//oscillators.addEffect(reverb);

//let oscList = [oscA, oscB, oscC];


//function playKey(client_seed, isRemote) {
//
//    Pizzicato.volume = (masterAmp_slider.value / 110);
//    var dur = (duration_knob.value + 1);
//    //clearTimeout(noteTimer);
//
//    oscA.volume = ((osc_a_vol_knob.value + 1.0) / 1001.0);
//    oscA.frequency = parseInt(1000 * Math.abs(Math.sin(strToNum(client_seed))));
//
//    oscB.volume = ((osc_b_vol_knob.value + 1.0) / 1001.0);
//    oscB.frequency = parseInt(1000 * Math.abs(Math.sin(strToNum(client_seed))));
//
//    oscC.volume = ((osc_c_vol_knob.value + 1.0) / 1001.0);
//    oscC.frequency = parseInt(1000 * Math.abs(Math.sin(strToNum(client_seed))));
//
//    reverb.time = (reverb_speed_knob.value / 100);
//    reverb.decay = (reverb_feedback_knob.value / 100);
//    reverb.mix = (reverb_drywet_knob.value / 100);
//
//    dubDelayA.time = (delay_speed_knob.value / 100);
//    dubDelayA.feedback = (delay_feedback_knob.value / 110);
//    dubDelayA.cutoff = parseInt(5000 * (delay_cutoff_knob.value / 100));
//    dubDelayA.mix = (delay_drywet_knob.value / 100.0);
//
//    dubDelayB.time = (delayB_speed_knob.value / 100);
//    dubDelayB.feedback = (delayB_feedback_knob.value / 110);
//    dubDelayB.cutoff = parseInt(5000 * (delayB_cutoff_knob.value / 100));
//    dubDelayB.mix = (delayB_drywet_knob.value / 100.0);
//
//    oscillators.volume = ((synthMasterAmp.value + 0.01) / 1000.0);
//
//    var now = parseFloat(context.currentTime);
//    let releaseKnobVal = parseFloat(release_knob.value * 0.1);
//    let stopTime = (now + 0.5);
//
////    for(var i=0; i < oscList.length; i++) {
////        if (client_seed == lastPlayedKey) {
////            console.log("client_seed == lastPlayedKey");
////            oscList[i].stop();
////        }
////
////        oscList[i].attack  = parseFloat(attack_knob.value / 100);
////        oscList[i].release = parseFloat(release_knob.value / 1000);
////    }
//
//    // oscillators.attack  = parseFloat(attack_knob.value / 100);
//    // oscillators.release = parseFloat(release_knob.value / 1000);
//
//    //oscillators.play();
//    //oscillators.stop();
//
//    let sUrls = getSamplesFromTxt(client_seed);
//    for(var i=0; i < sUrls.length; i++) {
//        sU = sUrls[i];
//
////        var dubDelayAA = new Pizzicato.Effects.DubDelay({
////            feedback: 0.6,
////            time: 0.25,
////            mix: 0.5,
////            cutoff: 3000
////        });
////
////        var dubDelayBB = new Pizzicato.Effects.DubDelay({
////            feedback: 0.6,
////            time: 0.25,
////            mix: 0.5,
////            cutoff: 1500
////        });
////
////
////        var reverbS = new Pizzicato.Effects.Reverb({
////            time: 1,
////            decay: 0.8,
////            reverse: false,
////            mix: 0.5
////        });
//
//        var sampler = new Pizzicato.Sound(sU, () => {
//            //oscillators.addSound(sampler); samplerMasterAmp
//            //sampler.play();
//            sampler.volume = ((samplerMasterAmp.value + 0.01) / 1000);
////            sampler.addEffect(dubDelayAA);
////            sampler.addEffect(dubDelayBB);
////            sampler.addEffect(reverbS);
//            sampler.play();
//        });
//
//
//    }
//
//    lastPlayedKey = client_seed.toString();
//}