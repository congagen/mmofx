// WebAudio
var source;
var songLength;

var noteTimer;
var keysdown = {};

let selectedOutputs = new Map(); // id -> MIDIOutput
let selectedInputs  = new Map(); // id -> MIDIInput

let currentChannel = 1; // Default channel

const MIDI_OUTPUTS_STORAGE_KEY = 'mmofx_selected_midi_outputs';
const MIDI_INPUTS_STORAGE_KEY  = 'mmofx_selected_midi_inputs';

var currentSamples = {};
let testSampleBtn = document.getElementById("debugSample");

var currentBufferSources = {};

// Decoded AudioBuffers cached by URL so repeated (and pitched/melodic) triggers
// don't re-fetch and re-decode the same file on every note.
var decodedBufferCache = {};
var voiceCounter = 0;

// Held pitched voices, when "Hold Pitched Notes" is on: note number -> [sources]
// that loop until the matching note-off. heldPitchedNotes guards the decode race
// (a note-off can arrive before a voice finishes decoding).
var activePitchedVoices = {};
var heldPitchedNotes = new Set();

// One-shot (non-held) pitched voices, tracked only so Monophonic mode can cut
// the previous note. Kept separate from activePitchedVoices so key-up release
// never stops them — one-shots always play through.
var oneShotPitchedVoices = [];

// Middle C: a pitched sample plays at its original speed when it receives this
// note, and is varispeed-pitched relative to it for other notes.
const PITCH_ROOT_NOTE = 60;

scanButton.addEventListener('click', rescanMidiInputs);

// Safety nets for held pitched notes: never leave a looping voice stuck on.
// Disabling MIDI In, turning Hold off, or losing focus/visibility releases all.
if (enableMidiInCheckbox) {
    enableMidiInCheckbox.addEventListener('change', function () {
        if (!enableMidiInCheckbox.checked) stopAllPitchedNotes();
    });
}
if (holdPitchedCheckbox) {
    holdPitchedCheckbox.addEventListener('change', function () {
        if (!holdPitchedCheckbox.checked) stopAllPitchedNotes();
    });
}
window.addEventListener('blur', stopAllPitchedNotes);
document.addEventListener('visibilitychange', function () {
    if (document.hidden) stopAllPitchedNotes();
});

////////////////////////////////////////////////////////////////////////////////
// SAMPLER /////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function stopAllSamples(){
    //console.log("stopAllSamples");

    for (const [key, value] of Object.entries(currentBufferSources)) {
        try { currentBufferSources[key].stop(0); } catch (e) {}
    }
    // Clear held-pitched tracking so released voices aren't referenced again.
    activePitchedVoices = {};
    heldPitchedNotes.clear();
    oneShotPitchedVoices = [];
}

// Stops any playing voices belonging to the given sample URL(s) and drops their
// decoded buffers from the cache. Voice keys are either the bare URL or
// "URL#voiceId" (poly), so we match on the part before any '#'.
function stopSampleVoices(...urls) {
    for (const key of Object.keys(currentBufferSources)) {
        const baseUrl = key.split("#")[0];
        if (urls.includes(baseUrl)) {
            try { currentBufferSources[key].stop(0); } catch (e) {}
            delete currentBufferSources[key];
        }
    }
    for (const url of urls) {
        delete decodedBufferCache[url];
    }
}

// Fetches and decodes a sample once, then serves it from cache on later calls.
function getDecodedBuffer(sampleFilePath) {
    if (decodedBufferCache[sampleFilePath]) {
        return Promise.resolve(decodedBufferCache[sampleFilePath]);
    }
    return fetch(sampleFilePath)
        .then(function (resp) { return resp.arrayBuffer(); })
        .then(function (arrayBuffer) {
            return new Promise(function (resolve, reject) {
                window.audioContext.decodeAudioData(arrayBuffer, function (buffer) {
                    decodedBufferCache[sampleFilePath] = buffer;
                    resolve(buffer);
                }, reject);
            });
        });
}

// playbackRate pitches the sample (1 = original). gainMul scales the level
// (e.g. MIDI velocity). forcePoly allocates a fresh voice that won't be evicted
// by same-URL triggers, so pitched chords ring out together.
function playBuffer(sampleFilePath, playbackRate = 1, gainMul = 1, forcePoly = false, loop = false, onVoice = null, releaseSec = 0) {
    var bufContext = window.audioContext;

    if (enablePolyphonyCheckbox && !enablePolyphonyCheckbox.checked && !forcePoly) {
        if (sampleFilePath in currentBufferSources) {
            try { currentBufferSources[sampleFilePath].stop(0); } catch (e) {}
        }
    }

    getDecodedBuffer(sampleFilePath).then(function (buffer) {
        var source = bufContext.createBufferSource();
        var gainNode = bufContext.createGain();
        source.buffer = buffer;
        source.playbackRate.value = playbackRate;
        source.loop = loop;
        source.connect(gainNode);
        gainNode.connect(bufContext.destination);
        gainNode.gain.value = parseFloat(masterAmp_slider.value / 100) * gainMul;
        // Stash the gain node so an immediate stop (re-trigger/Reset) can also
        // mute, in case a scheduled-stop fade is in progress.
        source.releaseGain = gainNode;

        // Track the voice so Reset (stopAllSamples) can stop it. Poly voices use
        // a unique key so simultaneous notes don't evict one another.
        const voiceKey = forcePoly
            ? sampleFilePath + "#" + (voiceCounter++)
            : sampleFilePath;
        currentBufferSources[voiceKey] = source;
        source.onended = function () { delete currentBufferSources[voiceKey]; };

        source.start(0);
        bufContext.resume();

        // Auto-release: ramp to silence over releaseSec and stop. The voice keeps
        // looping during the fade. Used by the piano's latch mode so a latched
        // note fades out instead of ringing forever. Scheduled atomically here so
        // there's no race with the async decode.
        if (releaseSec > 0) {
            const t = bufContext.currentTime;
            gainNode.gain.setValueAtTime(gainNode.gain.value, t);
            gainNode.gain.linearRampToValueAtTime(0, t + releaseSec);
            try { source.stop(t + releaseSec); } catch (e) {}
        }

        if (typeof onVoice === "function") onVoice(source);
    }).catch(function (e) {
        console.error("playBuffer error:", e);
    });
}

// Plays every pitch-enabled sample at the pitch for the given MIDI note,
// scaled by velocity. Driven by the Keys piano, network notes, and local MIDI.
// When hold is true, voices loop and are tracked for note-off (stopPitchedNote).
// On-screen pad/key input always sounds locally, independently of whether it's
// also transmitted. Clients rarely have samples or MIDI configured, so local
// playback is usually silent anyway; always allowing it keeps behaviour simple
// and predictable for new users rather than hiding sound behind a toggle. (Kept
// as a function so the policy lives in one place and is easy to revisit.)
function shouldPlayLocalInput() {
    return true;
}

function playPitchedSamples(midiNote, velocity, hold, releaseSec) {
    const note = parseInt(midiNote);
    if (isNaN(note)) return;
    const vel = (velocity == null) ? 127 : velocity;
    const gainMul = Math.max(0, Math.min(1, vel / 127));
    const rate = Math.pow(2, (note - PITCH_ROOT_NOTE) / 12);
    const rel = releaseSec || 0;

    // Monophonic mode (Sample Polyphony off): stop everything currently sounding
    // (pads and pitched) so only this note rings (last-note priority, global).
    // This note's own voices are created below, so they survive. Sample Polyphony
    // is the master poly/mono switch and applies regardless of Hold: with it on,
    // held drags accumulate into chords; with it off, even held drags are mono
    // and only the most recent note sounds.
    if (pitchPolyphonyCheckbox && !pitchPolyphonyCheckbox.checked) {
        stopAllSamples();
    }

    if (hold) heldPitchedNotes.add(note);

    // Pitch-enabled samples for this note. Normally they all layer; with
    // Randomize Samples on, pick a single random one each trigger so repeated
    // notes vary instead of always sounding the same stack.
    let pitchedIds = Object.keys(currentSamples).filter(function (id) {
        return currentSamples[id][3];
    });
    if (randomizePlaybackCheckbox && randomizePlaybackCheckbox.checked && pitchedIds.length > 0) {
        pitchedIds = [pitchedIds[Math.floor(Math.random() * pitchedIds.length)]];
    }

    for (const id of pitchedIds) {
        if (hold) {
            playBuffer(currentSamples[id][1], rate, gainMul, true, true, function (source) {
                // If the note-off already arrived (decode race), don't leave it looping.
                if (!heldPitchedNotes.has(note)) {
                    try { source.stop(0); } catch (e) {}
                    return;
                }
                if (!activePitchedVoices[note]) activePitchedVoices[note] = [];
                activePitchedVoices[note].push(source);
                // Drop the voice from tracking when it ends (incl. after a
                // release fade finishes), chaining the existing onended.
                const prevOnEnded = source.onended;
                source.onended = function () {
                    if (prevOnEnded) { try { prevOnEnded(); } catch (e) {} }
                    const arr = activePitchedVoices[note];
                    if (arr) {
                        const i = arr.indexOf(source);
                        if (i >= 0) arr.splice(i, 1);
                        if (arr.length === 0) delete activePitchedVoices[note];
                    }
                };
            }, rel);
        } else {
            playBuffer(currentSamples[id][1], rate, gainMul, true, false, function (source) {
                // Track so Monophonic mode can cut it, and tag with the note so
                // "Note Off on Release" can silence it on key-up even though
                // Hold is off (one-shots aren't in activePitchedVoices). Drop it
                // once it ends.
                source._pitchNote = note;
                oneShotPitchedVoices.push(source);
                const prevOnEnded = source.onended;
                source.onended = function () {
                    if (prevOnEnded) { try { prevOnEnded(); } catch (e) {} }
                    const i = oneShotPitchedVoices.indexOf(source);
                    if (i >= 0) oneShotPitchedVoices.splice(i, 1);
                };
            }, rel);
        }
    }
}

// Stops all one-shot pitched voices (Monophonic mode cut, Reset, panic).
function stopOneShotPitchedVoices() {
    const voices = oneShotPitchedVoices;
    oneShotPitchedVoices = [];
    for (const source of voices) {
        try { source.stop(0); } catch (e) {}
    }
}

// Stops the held looping voices for a single MIDI note (on note-off).
function stopPitchedNote(midiNote) {
    const note = parseInt(midiNote);
    if (isNaN(note)) return;
    heldPitchedNotes.delete(note);
    const voices = activePitchedVoices[note];
    if (voices) {
        for (const source of voices) {
            // Mute first so a re-trigger/Reset is silent even if a release fade
            // had already scheduled a later stop.
            if (source.releaseGain) {
                try {
                    source.releaseGain.gain.cancelScheduledValues(0);
                    source.releaseGain.gain.value = 0;
                } catch (e) {}
            }
            try { source.stop(0); } catch (e) {}
        }
        delete activePitchedVoices[note];
    }
    // Also cut any one-shot voices for this note (Hold off). Without this,
    // "Note Off on Release" had no effect unless Hold was enabled, since
    // one-shots live outside activePitchedVoices. onended splices them out.
    for (let i = oneShotPitchedVoices.length - 1; i >= 0; i--) {
        const source = oneShotPitchedVoices[i];
        if (source._pitchNote !== note) continue;
        if (source.releaseGain) {
            try {
                source.releaseGain.gain.cancelScheduledValues(0);
                source.releaseGain.gain.value = 0;
            } catch (e) {}
        }
        try { source.stop(0); } catch (e) {}
    }
}

// Releases a held note with a fade-out (on key-up, piano latch mode). The voice
// keeps looping while its gain ramps to 0 over releaseSec, then stops. Voices
// stay tracked during the fade so a re-trigger/Reset can still cut them; the
// onended cleanup removes them once they actually stop. releaseSec <= 0 leaves
// the note ringing (cleared only by Reset/re-trigger).
function releasePitchedNote(midiNote, releaseSec) {
    const note = parseInt(midiNote);
    if (isNaN(note)) return;
    // releaseSec <= 0 means "ring until Reset/re-trigger". Leave the note in
    // heldPitchedNotes so any still-decoding voices register and ring too,
    // instead of being killed by the decode-race guard — otherwise, on a fast
    // drag, notes whose buffer hadn't finished decoding when you lifted would
    // silently drop (only "some notes stick"). The note is cleared later by
    // stopPitchedNote (re-trigger/note-off) or stopAllPitchedNotes (Reset/panic).
    if (!releaseSec || releaseSec <= 0) return;
    // Fading to a stop: now drop it from the guard so in-flight decodes don't
    // re-arm a note we're deliberately ending.
    heldPitchedNotes.delete(note);
    const t = window.audioContext.currentTime;
    const fade = function (source) {
        if (source.releaseGain) {
            try {
                source.releaseGain.gain.cancelScheduledValues(t);
                source.releaseGain.gain.setValueAtTime(source.releaseGain.gain.value, t);
                source.releaseGain.gain.linearRampToValueAtTime(0, t + releaseSec);
            } catch (e) {}
        }
        try { source.stop(t + releaseSec); } catch (e) {}
    };
    const voices = activePitchedVoices[note];
    if (voices) {
        for (const source of voices) fade(source);
    }
    // Fade matching one-shots too (Hold off), so key-up honours the Release
    // time instead of being a no-op. releaseSec <= 0 already returned above,
    // leaving one-shots to ring out naturally.
    for (const source of oneShotPitchedVoices) {
        if (source._pitchNote === note) fade(source);
    }
}

// Release a note honouring the Fade Duration: fade out over the set time, or
// stop immediately when it's 0. Used for MIDI note-offs so the release envelope
// applies to MIDI input the same as the Keys tab's latch release. (Unlike the
// Keys "ring forever" latch, a MIDI note-off with Fade 0 must cut cleanly, so we
// route 0 to stopPitchedNote rather than releasePitchedNote's ring path.)
function releasePitchedNoteWithFade(midiNote) {
    const fade = pianoReleaseSlider ? parseFloat(pianoReleaseSlider.value) : 0;
    if (fade > 0) releasePitchedNote(midiNote, fade);
    else stopPitchedNote(midiNote);
}

// Panic: stops all held pitched voices and clears tracking. Used when MIDI In is
// disabled, the Hold toggle is turned off, or focus/visibility is lost.
function stopAllPitchedNotes() {
    for (const note of Object.keys(activePitchedVoices)) {
        for (const source of activePitchedVoices[note]) {
            try { source.stop(0); } catch (e) {}
        }
    }
    activePitchedVoices = {};
    heldPitchedNotes.clear();
    stopOneShotPitchedVoices();
}

function characterToNote(character) {
    const index = charlist.indexOf(character);
    if (index === -1) {
        return null; 
    }
    return 12 + index;
}

function playKey(sampleKey, isRemote, randomize, hold, releaseSec) {
    console.log("playKey: " + sampleKey);

    if (sampleKey.length > 1) {
        // MIDI
        console.log("MIDI KEY: " + sampleKey);

        // Pitch-enabled samples play locally at the note's pitch (velocity isn't
        // carried by this path, so full level). hold (from the on-screen piano)
        // sustains/loops the voice; releaseSec auto-fades it (piano latch mode).
        playPitchedSamples(sampleKey, 127, hold, releaseSec);

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
        if (isRemote === true && sampleKey != " ") {
            highlightPad(sampleKey);
        }

        // Monophonic: stop everything currently sounding so this pad replaces it.
        // The pad's own samples are played below, so they survive.
        if (pitchPolyphonyCheckbox && !pitchPolyphonyCheckbox.checked) {
            stopAllSamples();
        }

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

        input.style.position = 'fixed';
        input.style.left = '-9999px';
        document.body.appendChild(input);

        input.addEventListener('change', () => {
            let files = Array.from(input.files);
            input.remove();
            resolve(multiple ? files : files[0]);
        }, { once: true });

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
                    showCustomAlert("Sorry, but the Web Audio API is not supported by your browser. Please, consider upgrading to the latest version or downloading Google Chrome or Mozilla Firefox");
                }
            }
            //console.log("Audio initialized... ");
        }
            catch(e) {
            showCustomAlert('Web Audio API is not supported in this browser');
        }
    }
}

////////////////////////////////////////////////////////////////////////////////
// MIDI ////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

navigator.requestMIDIAccess().then(function(midiAccess) {
    populateMidiOutputs(midiAccess);
    populateMidiInputs(midiAccess);
}).catch(error => {
    console.error("Error accessing MIDI devices:", error);
});

function sendNoteOn(channel, note, velocity) {
    const operation = 0x90 | channel;
    if (selectedOutputs.size === 0) {
        console.warn("No MIDI output devices selected.");
        return;
    }
    for (const out of selectedOutputs.values()) {
        out.send([operation, note, velocity]);
    }
}

function sendNoteOff(channel, note, velocity = 64) {
    const operation = 0x80 | channel;
    const duration = parseInt(document.getElementById("midiNotDuration").value);
    if (selectedOutputs.size === 0) {
        console.warn("No MIDI output devices selected.");
        return;
    }
    for (const out of selectedOutputs.values()) {
        setTimeout(() => {
            out.send([operation, note, velocity]);
        }, duration);
    }
}

// Faithfully forwards an incoming MIDI message to every selected output,
// remapping the channel nibble to the configured MIDI Out channel while
// preserving the message type, note/controller, and velocity/value bytes.
function fanToOutputs(message) {
    if (selectedOutputs.size === 0) {
        return;
    }
    const command = message[0] >> 4;
    const outChannel = parseInt(document.getElementById("midiOutChannel").value) & 0xF;
    const outMsg = Array.from(message);
    outMsg[0] = (command << 4) | outChannel;
    for (const out of selectedOutputs.values()) {
        out.send(outMsg);
    }
}

function populateMidiOutputs(midiAccess) {
    const container = document.getElementById("midiOutputSelect");
    container.innerHTML = '';
    selectedOutputs.clear();

    if (midiAccess.outputs.size === 0) {
        console.error("No MIDI output devices found.");
        container.innerHTML = '<p class="device-list-empty">No devices found</p>';
        return;
    }

    const savedIds = JSON.parse(localStorage.getItem(MIDI_OUTPUTS_STORAGE_KEY) || '[]');

    for (const out of midiAccess.outputs.values()) {
        const isChecked = savedIds.includes(out.id);
        if (isChecked) {
            selectedOutputs.set(out.id, out);
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'device-row';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'form-check-input';
        checkbox.id = `midiOut_${out.id}`;
        checkbox.checked = isChecked;

        checkbox.addEventListener('change', function () {
            if (this.checked) {
                selectedOutputs.set(out.id, out);
                console.log("MIDI Output added:", out.name);
            } else {
                selectedOutputs.delete(out.id);
                console.log("MIDI Output removed:", out.name);
            }
            localStorage.setItem(
                MIDI_OUTPUTS_STORAGE_KEY,
                JSON.stringify([...selectedOutputs.keys()])
            );
        });

        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.htmlFor = `midiOut_${out.id}`;
        label.textContent = out.name;

        wrapper.appendChild(label);
        wrapper.appendChild(checkbox);
        container.appendChild(wrapper);
    }

    console.log("MIDI Outputs populated. Selected:", [...selectedOutputs.keys()]);
}

function populateMidiInputs(midiAccess) {
    const container = document.getElementById("midiInputSelect");
    container.innerHTML = '';

    // Detach handlers from all currently tracked inputs before rebuilding
    for (const input of selectedInputs.values()) {
        input.onmidimessage = null;
    }
    selectedInputs.clear();

    if (midiAccess.inputs.size === 0) {
        console.error("No MIDI input devices found.");
        container.innerHTML = '<p class="device-list-empty">No devices found</p>';
        return;
    }

    const savedIds = JSON.parse(localStorage.getItem(MIDI_INPUTS_STORAGE_KEY) || '[]');

    for (const input of midiAccess.inputs.values()) {
        const isChecked = savedIds.includes(input.id);
        if (isChecked) {
            selectedInputs.set(input.id, input);
            input.onmidimessage = onMIDIMessage;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'device-row';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'form-check-input';
        checkbox.id = `midiIn_${input.id}`;
        checkbox.checked = isChecked;

        checkbox.addEventListener('change', function () {
            if (this.checked) {
                selectedInputs.set(input.id, input);
                input.onmidimessage = onMIDIMessage;
                console.log("MIDI Input added:", input.name);
            } else {
                input.onmidimessage = null;
                selectedInputs.delete(input.id);
                console.log("MIDI Input removed:", input.name);
            }
            localStorage.setItem(
                MIDI_INPUTS_STORAGE_KEY,
                JSON.stringify([...selectedInputs.keys()])
            );
        });

        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.htmlFor = `midiIn_${input.id}`;
        label.textContent = input.name;

        wrapper.appendChild(label);
        wrapper.appendChild(checkbox);
        container.appendChild(wrapper);
    }

    console.log("MIDI Inputs populated. Selected:", [...selectedInputs.keys()]);
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

    // Loopback guard: ignore input from a device that is also a selected output
    // (matched by name to catch virtual ports that appear in both lists).
    const sourceName = event.target ? event.target.name.trim().toLowerCase() : '';
    const isLoopback = [...selectedOutputs.values()].some(
        out => out.name.trim().toLowerCase() === sourceName
    );

    // Local fan-out: when both MIDI In and MIDI Out are enabled, forward every
    // checked input device to every checked output device, independent of the
    // network connection or Host/Client mode.
    if (!isLoopback &&
        enableMidiInCheckbox.checked === true &&
        enableMidiOutCheckbox.checked === true) {
        fanToOutputs(message);
    }

    let messageText = "";

    switch (command) {
        case 8: // Note Off
            messageText = `Note Off: ${note} (Velocity: ${velocity}) Channel: ${channel + 1}`;
            // Always release held pitched voices, even if MIDI In was just
            // disabled, so a note can never get stuck on. Honours Fade Duration.
            releasePitchedNoteWithFade(note);
            break;
        case 9: // Note On
            messageText = `Note On: ${note} (Velocity: ${velocity}) Channel: ${channel + 1}`;

            if (isLoopback) {
                console.log("! MIDI INPUT == MIDI OUTPUT - skipping !");
            } else if (enableTransmissionCheckbox.checked === true) {
                console.log("Sending MIDI note");
                playNetworkCmd(note);
            }

            // Local MIDI In plays pitch-enabled samples directly. Velocity 0 is a
            // note-off in disguise, so release instead of triggering.
            if (!isLoopback && enableMidiInCheckbox.checked === true) {
                if (velocity > 0) {
                    playPitchedSamples(note, velocity, holdPitchedCheckbox.checked);
                } else {
                    releasePitchedNoteWithFade(note); // velocity-0 note-on = note-off
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