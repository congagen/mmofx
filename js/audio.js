// WebAudio
var source;
var songLength;

var noteTimer;
var keysdown = {};

let output = null; 

var currentSamples = {};
let testSampleBtn = document.getElementById("debugSample");

var currentBufferSources = {};

// function connectMidi(){
//     navigator.requestMIDIAccess()
//     .then(function(midiAccess) {
//       const outputs = Array.from(midiAccess.outputs.values());
//       //console.log(outputs);
//     });
// }

////////////////////////////////////////////////////////////////////////////////
// SAMPLER /////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function stopAllSamples(){
    //console.log("stopAllSamples");

    for (const [key, value] of Object.entries(currentBufferSources)) {
        currentBufferSources[key].stop(0);
    }
}

function playBuffer(sampleFilePath) {
    console.log("playBuffer");    

    var bufContext = window.audioContext;
    var request = new XMLHttpRequest();

    // TODO: If polyphony
    if (enablePolyphonyCheckbox.checked == false) {
        if (sampleFilePath in currentBufferSources) {
            currentBufferSources[sampleFilePath].stop(0);
        }
    }

    request.open('GET', sampleFilePath, true);
    request.responseType = 'arraybuffer';
    request.addEventListener('load', function (e) {
        bufContext.decodeAudioData(this.response, function (buffer) {
            var source = bufContext.createBufferSource();
            var gainNode = bufContext.createGain();
            source.connect(gainNode);
            source.buffer = buffer;
            gainNode.connect(bufContext.destination);
            gainNode.gain.value = parseFloat((masterAmp_slider.value / 100));
            //source.connect(bufContext.destination);
            currentBufferSources[sampleFilePath] = source;
            source.start(0);
        });
    }, false);

    bufContext.resume();
    request.send();
}

function characterToNote(character) {
    const index = charlist.indexOf(character);
    if (index === -1) {
        return null; 
    }
    return 12 + index;
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

    if (enableMidiOutCheckbox.checked == true) {
        let noteInt = characterToNote(sampleKey);                
        sendNoteOn(noteInt, 127);
        sendNoteOff(noteInt);
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
            //console.log(sUrl);
            sToPlay.push(sUrl);
        }
    }

    return sToPlay;
}

function initDefSamples(){
    //console.log("initDefSamples");

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
    //console.log(composite);
    return parseInt(composite);
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function highlightCard(cardID) {
    //console.log("HL: " + cardID);
    var sCard = document.getElementById(cardID);
    //console.log(sCard);
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

                    //console.log("AudioContext OK");
                    isInitAudio = true;

                } else {
                    //console.log("AudioContext ERR");
                    alert("Sorry, but the Web Audio API is not supported by your browser. Please, consider upgrading to the latest version or downloading Google Chrome or Mozilla Firefox");
                }
            }
            //console.log("Audio initialized... ");
        }
            catch(e) {
            alert('Web Audio API is not supported in this browser');
        }
    }
}

navigator.requestMIDIAccess().then(function(midiAccess) {
    var outputs = midiAccess.outputs.values();
    for (var outputItem = outputs.next(); outputItem && !outputItem.done; outputItem = outputs.next()) {
        output = outputItem.value; // Assign the first available output
        break; // Exit loop after getting the first output
    }
}).catch(error => {
    console.error("Error accessing MIDI devices:", error);
});

function sendNoteOn(note, velocity) {
    console.log("sendNoteOn");
    console.log(note);

    if (output !== null) {
        output.send([0x90, note, velocity]); // Note on message
    } else {
        console.warn("No MIDI output device available.");
    }
}

function sendNoteOff(note, velocity = 64) {
    console.log("sendNoteOff");
    if (output !== null) {
        setTimeout(() => {
            output.send([0x80, note, velocity]); // Note off message (delayed)
        }, 100); // Adjust delay (in milliseconds) as needed
    } else {
        console.warn("No MIDI output device available.");
    }
}
