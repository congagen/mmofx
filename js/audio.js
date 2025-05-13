// WebAudio
var source;
var songLength;

var noteTimer;
var keysdown = {};

let output = null; 

let selectedInput;
let selectedOutput;
let currentChannel = 1; // Default channel

var currentSamples = {};
let testSampleBtn = document.getElementById("debugSample");

var currentBufferSources = {};

scanButton.addEventListener('click', rescanMidiInputs);

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
    if (!enablePolyphonyCheckbox.checked) {
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
    console.log("playKey: " + sampleKey);
    
    if (sampleKey.length > 1) {
        // MIDI
        console.log("MIDI KEY: " + sampleKey);

        if (enableMidiInCheckbox.checked === false) {            
            if (enableMidiOutCheckbox.checked === true && receiveCommandsCheckbox.checked === true) {
                let noteInt = parseInt(sampleKey);
                let midiChannel = document.getElementById("midiOutChannel").value;
                sendNoteOn(midiChannel, noteInt, 127);
                sendNoteOff(midiChannel, noteInt);
            }
        }
    } else {
        // BASIC INPUT
        let sampleUrls = getSamplesFromTxt(sampleKey);
        if (randomizePlaybackCheckbox.checked === true) {
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
        
        if (sampleKey != " ") {
            if (enableMidiOutCheckbox.checked === true && receiveCommandsCheckbox.checked === true) {
                let noteInt = characterToNote(sampleKey);
                let midiChannel = document.getElementById("midiOutChannel").value;
                sendNoteOn(midiChannel, noteInt, 127);
                sendNoteOff(midiChannel, noteInt);
            }
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

////////////////////////////////////////////////////////////////////////////////
// MIDI ////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

navigator.requestMIDIAccess().then(function(midiAccess) {
    var outputs = midiAccess.outputs.values();
    for (var outputItem = outputs.next(); outputItem && !outputItem.done; outputItem = outputs.next()) {
        output = outputItem.value; // Assign the first available output
        break; // Exit loop after getting the first output
    }
}).catch(error => {
    console.error("Error accessing MIDI devices:", error);
});

navigator.requestMIDIAccess().then(function(midiAccess) {

    // *** MIDI Output Setup *** (Keep this!)
    var outputs = midiAccess.outputs.values();
    for (var outputItem = outputs.next(); outputItem && !outputItem.done; outputItem = outputs.next()) {
        output = outputItem.value;
        break;
    }
    if (!output) {
        console.error("No MIDI output found.");
    }
    // ... (Any other MIDI output initialization code you have) ...
    populateMidiOutputs(midiAccess); // Populate output dropdown

    // *** MIDI Input Setup *** (This adds input handling)
    populateMidiInputs(midiAccess); // Initial population

}).catch(error => {
    console.error("Error accessing MIDI devices:", error);
});

function sendNoteOn(channel, note, velocity) {
    let operation = 0x90 | channel;
    if (output !== null) {
        output.send([operation, note, velocity]);
    } else {
        console.warn("No MIDI output device available.");
    }
}

function sendNoteOff(channel, note, velocity = 64) {        
    midiNotDurationSlider = document.getElementById("midiNotDuration");
    let operation = 0x80 | channel;

    if (output !== null) {
        setTimeout(() => {
            output.send([operation, note, velocity]);
        }, midiNotDurationSlider.value); 
    } else {
        console.warn("No MIDI output device available.");
    }
}

function populateMidiOutputs(midiAccess) {
    midiOutputSelect.innerHTML = ''; // Clear existing options

    const outputs = midiAccess.outputs.values();
    for (const out of outputs) {
        const option = document.createElement('option');
        option.value = out.id;
        option.text = out.name;
        midiOutputSelect.appendChild(option);
    }

    if (midiAccess.outputs.size === 0) {
        console.error("No MIDI output devices found.");
        return;
    }

    // Select the first output by default
    if (midiOutputSelect.options.length > 0) {
        selectedOutput = midiAccess.outputs.get(midiOutputSelect.value);
        if (selectedOutput) {
            output = selectedOutput; // Update the global output variable
            console.log("Selected MIDI Output:", selectedOutput.name);
        }
    }

    midiOutputSelect.addEventListener('change', function() {
         selectedOutput = midiAccess.outputs.get(this.value);
         if (selectedOutput) {
            output = selectedOutput; // Update the global output variable
            console.log("Selected MIDI Output:", selectedOutput.name);
         }
    });
}

function populateMidiInputs(midiAccess) {
    midiInputSelect.innerHTML = ''; // Clear existing options

    const inputs = midiAccess.inputs.values();
    for (const input of inputs) {
        const option = document.createElement('option');
        option.value = input.id;
        option.text = input.name;
        midiInputSelect.appendChild(option);
    }

    if (midiAccess.inputs.size === 0) {
        console.error("No MIDI input devices found.");
        return;
    }

    // Select the first input by default
    if (midiInputSelect.options.length > 0) {
        selectedInput = midiAccess.inputs.get(midiInputSelect.value);
        if (selectedInput) {
            selectedInput.onmidimessage = onMIDIMessage;
            console.log("Selected MIDI Input:", selectedInput.name);
        }
    }

    midiInputSelect.addEventListener('change', function() {
        if (selectedInput) {
            selectedInput.onmidimessage = null;
        }
        selectedInput = midiAccess.inputs.get(this.value);
        if (selectedInput) {
            selectedInput.onmidimessage = onMIDIMessage;
            console.log("Selected MIDI Input:", selectedInput.name);
        }
    });
}

function rescanMidiInputs() {
    navigator.requestMIDIAccess().then(midiAccess => {  // Get the MIDIAccess object
        populateMidiInputs(midiAccess); // Repopulate inputs
        populateMidiOutputs(midiAccess); // Repopulate outputs
    }).catch(error => {
        console.error("Error accessing MIDI devices:", error);
    });
}

function onMIDIMessage(event) {

    const message = event.data;
    const command = message[0] >> 4;
    let channel = message[0] & 0xF;
    channel = currentChannel - 1; // Adjust to 0-15 range

    const note = message[1];
    const velocity = message[2];

    let messageText = "";

    switch (command) {
        case 8: // Note Off
            messageText = `Note Off: ${note} (Velocity: ${velocity}) Channel: ${channel + 1}`;
            break;
        case 9: // Note On
            messageText = `Note On: ${note} (Velocity: ${velocity}) Channel: ${channel + 1}`;
            const selectedOption1 = midiInputSelect.options[midiInputSelect.selectedIndex];
            const selectedOption2 = midiOutputSelect.options[midiOutputSelect.selectedIndex];

            // if (enableMidiInCheckbox.checked && enableMidiOutCheckbox.checked) {
            //     console.log("enableMidiInCheckbox.checked && enableMidiOutCheckbox.checked");
            // } else {
            //     if (enableTransmissionCheckbox.checked == true) {
            //         playNetworkCmd(note);
            //     }                
            // }

            if (selectedOption1 && selectedOption2 && selectedOption1.textContent.trim().toLowerCase() === selectedOption2.textContent.trim().toLowerCase()) {
                console.log("! MIDI INPUT == MIDI OUTPUT !");
            } else {                
                if (enableTransmissionCheckbox.checked === true) {
                    console.log("Sending MIDI note");
                    playNetworkCmd(note);
                }
            }

            break;
        case 10: // Aftertouch
            messageText = `Aftertouch: ${note} (Value: ${velocity}) Channel: ${channel+1}`;
            break;
        case 11: // Control Change
            messageText = `Control Change: ${note} (Value: ${velocity}) Channel: ${channel+1}`;
            break;
        case 12: // Program Change
            messageText = `Program Change: ${note} Channel: ${channel+1}`;
            break;
        case 13: // Channel Pressure
            messageText = `Channel Pressure: ${note} Channel: ${channel+1}`;
            break;
        case 14: // Pitch Bend
            messageText = `Pitch Bend: ${((note << 7) | velocity) - 8192} Channel: ${channel+1}`;
            break;
        default:
            messageText = `Unknown MIDI Message: ${message.join(' ')}`;
    }

    console.log("MIDI Message:", messageText);

    let newItem = document.createElement('li');
    newItem.textContent = messageText;
    // midiMessagesList.appendChild(newItem);

    // Example: Send the MIDI message out (if needed)

    // if (output) {
    //     output.send(message);
    // }
}