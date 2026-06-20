var noteTimer;

var cueString = "<span class=\"cueMsg\">Cue: </span>";
var currentKeyboard = {"a": ["a1","b1","c1"]};
var isTouchDevice = "ontouchstart" in document.documentElement;
var padCount = 0;

var apiDir = {};

function addSampleListRow(sampleId, sampleUrl) {
    let sItem = currentSamples[sampleId];

    var sampleTableContainer = $("#sampleTableContainer");

    var sampleCard = $("<div class='sample-card' id='sam_row_" + sampleId + "'></div>");

    var header = $("<div class='sample-card-header'><span class='sample-name' title=\"" + sItem[0] + "\">" + sItem[0] + "</span></div>");

    var body = $("<div class='sample-card-body'></div>");

    var keysGroup = $(
        "<div class='input-group sample-keys-group'>" +
            "<span class='input-group-text'>Keys</span>" +
            "<input aria-label='Play keys' class='form-control' id='" + sampleId.toString() + "' type='text' value=" + sItem[2].toLowerCase() + ">" +
        "</div>"
    );

    var trigInp = keysGroup.find("input");
    trigInp.change(function () {
        var inputId = $(this).attr('id').toString();
        let trgKeyInputField = document.getElementById(inputId.toString());
        currentSamples[inputId][2] = trgKeyInputField.value.toString();
    });

    var previewBtn = $("<button type='button' class='sample-btn sample-preview-btn' aria-label='Preview'>&#9658;</button>");
    previewBtn.click(function () {
        previewSample(sampleId);
    });

    // Pitch: when on, this sample responds to MIDI notes (Keys piano, network,
    // local MIDI In) with simple varispeed pitching. Stored in currentSamples[3].
    var pitchGroup = $(
        "<div class='form-check sample-pitch-check'>" +
            "<input type='checkbox' class='form-check-input' id='pitch_" + sampleId + "'>" +
            "<label class='form-check-label' for='pitch_" + sampleId + "'>Pitch</label>" +
        "</div>"
    );
    var pitchInp = pitchGroup.find("input");
    pitchInp.prop("checked", !!sItem[3]);
    pitchInp.change(function () {
        currentSamples[sampleId][3] = this.checked;
    });

    var removeBtn = $("<button type='button' class='sample-btn sample-remove-btn' aria-label='Remove'>&#10005;</button>");
    removeBtn.click(function () {
        const id = sampleId.toString();
        const s = currentSamples[id];
        // Stop any voices still playing this sample (preview uses the row id as
        // its URL; pad/pitched playback uses s[1]) before removing it.
        if (s) {
            stopSampleVoices(id, s[1]);
        }
        delete currentSamples[id];
        sampleCard.remove();
    });

    body.append(previewBtn);
    body.append(keysGroup);
    body.append(pitchGroup);
    body.append(removeBtn);

    sampleCard.append(header);
    sampleCard.append(body);

    sampleTableContainer.append(sampleCard);
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    let fr = new FileReader();
    fr.onload = x=> resolve(fr.result);
    fr.readAsText(file);
})}

function setHostClientMode(isClient) {
  receiveCommandsCheckbox.checked = !isClient;
  enableTransmissionCheckbox.checked = isClient;
  hostClientSwitch.checked = isClient;
  document.getElementById('hostModeLabel').classList.toggle('active', !isClient);
  document.getElementById('clientModeLabel').classList.toggle('active', isClient);
}

hostClientSwitch.addEventListener('change', (event) => {
  setHostClientMode(event.currentTarget.checked);
  updateChannel();
})

async function addSamplesLsDisk(){
//    let files = await selectFile("audio/*", true);
    let files = await selectFile("", true);
    ////console.log(files);
    ////console.log(URL.createObjectURL(files[0]));

    for (var i=0; i < files.length; i++) {
        ////console.log(files[i]);
        var fileName = files[i].name.toString();
        var ext = fileName.substr(fileName.lastIndexOf('.') + 1);

        if (ext === "wav" || ext === "mp3") {
            let fName = files[i].name.toString();
            var sKey = URL.createObjectURL(files[i]).toString();
            let sUrl = URL.createObjectURL(files[i]);
            let trgKeys = fName[0].toLowerCase();

            // TODO: TrgKey from
            currentSamples[sKey] = [fName, sUrl, fName[0].toLowerCase()];
            addSampleListRow(sKey, sUrl);
        }
    }
}

// Copies a human-readable sample map to the clipboard, one line per sample:
//   Sample Name: a, s, d
// File extensions are stripped and assigned keys are de-duplicated.
function copySampleMapToKeyboard() {
    const lines = [];

    for (const k of Object.keys(currentSamples)) {
        const sample = currentSamples[k];
        const name = sample[0].replace(/\.[^/.]+$/, "");          // strip extension
        const keys = [...new Set((sample[2] || "").toString().split(""))].join(", ");
        lines.push(name + ": " + (keys || "(unassigned)"));
    }

    const copyText = lines.join("\n");

    navigator.clipboard.writeText(copyText).then(function () {
        showCustomAlert("Sample map copied to clipboard");
    });
}

// Saves the current key map as a downloadable JSON file.
// Shape: { keys: { key: [fileName, ...] }, pitch: [fileName, ...] }.
// loadSampleMap() reads it back; older bare key-map files still load (keys only).
function saveSampleMap() {
    const keyMap = {};
    const pitch = [];

    for (const k of Object.keys(currentSamples)) {
        const sampleName = currentSamples[k][0];
        const sampleKeys = currentSamples[k][2].toString();

        for (let j = 0; j < sampleKeys.length; j++) {
            const tChar = sampleKeys[j];
            if (keyMap[tChar]) {
                keyMap[tChar].push(sampleName);
            } else {
                keyMap[tChar] = [sampleName];
            }
        }

        if (currentSamples[k][3] && !pitch.includes(sampleName)) {
            pitch.push(sampleName);
        }
    }

    const json = JSON.stringify({ keys: keyMap, pitch: pitch }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mmofx-keymap.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Applies a saved sample map (JSON text) to the currently-loaded samples by
// exact file-name match. New maps are { keys: { key: [fileName, ...] },
// pitch: [fileName, ...] }; older bare key-map files still load (keys only, no
// pitch). For duplicate file names, the first loaded sample wins. Samples not
// described by the map are left untouched.
function applySampleKeymap(text) {
    let parsed;
    try {
        parsed = JSON.parse(text);
    } catch (e) {
        showCustomAlert("Could not read keymap (invalid JSON).");
        return;
    }
    if (!parsed || typeof parsed !== "object") {
        showCustomAlert("Could not read keymap.");
        return;
    }

    // New (wrapped) format nests the key map under "keys" and adds a "pitch"
    // list. A bare key map (old format) is used as-is, with no pitch info.
    const isWrapped = parsed.keys && typeof parsed.keys === "object" && !Array.isArray(parsed.keys);
    const keyMap = isWrapped ? parsed.keys : parsed;
    const pitchSet = new Set(isWrapped && Array.isArray(parsed.pitch) ? parsed.pitch : []);

    // Invert into { fileName: "keys" }, aggregating every character mapped to a
    // given file name (order preserved, duplicates removed).
    const nameToKeys = {};
    for (const [char, names] of Object.entries(keyMap)) {
        if (!Array.isArray(names)) continue;
        for (const name of names) {
            if (nameToKeys[name] == null) nameToKeys[name] = "";
            if (!nameToKeys[name].includes(char)) nameToKeys[name] += char;
        }
    }

    const assignedNames = new Set();
    let matched = 0;
    for (const id of Object.keys(currentSamples)) {
        const fName = currentSamples[id][0];
        if (assignedNames.has(fName)) continue; // first loaded copy wins

        const hasKeys = nameToKeys[fName] != null;
        if (!hasKeys && !pitchSet.has(fName)) continue; // not in this map

        if (hasKeys) {
            currentSamples[id][2] = nameToKeys[fName];
            const field = document.getElementById(id);
            if (field) field.value = nameToKeys[fName];
        }
        // Pitch only travels with the wrapped format.
        if (isWrapped) {
            const pitched = pitchSet.has(fName);
            currentSamples[id][3] = pitched;
            const pitchEl = document.getElementById("pitch_" + id);
            if (pitchEl) pitchEl.checked = pitched;
        }

        assignedNames.add(fName);
        matched += 1;
    }

    showCustomAlert(matched > 0
        ? "Loaded settings for " + matched + " sample" + (matched === 1 ? "" : "s") + "."
        : "No matching sample file names found.");
}

// Opportunistic counterpart to saveSampleMap(): loads a saved .json keymap
// file from disk and applies it to the currently-loaded samples.
function loadSampleMap() {
    selectFile("application/json,.json", false).then((file) => {
        if (!file) return;
        file.text()
            .then(applySampleKeymap)
            .catch(() => showCustomAlert("Could not read the selected file."));
    });
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
    stopAllSamples();
    decodedBufferCache = {};
    for (const [key, value] of Object.entries(currentSamples)) {
        delete currentSamples[key];
        document.getElementById("sam_row_"+key).remove();
    }
}

function playNetworkCmd(cmdText) {
    console.log("playNetworkCmd: " + cmdText.toString());

    // Carry an incrementing nonce so the playedKey value changes on every press
    // (even repeats of the same key). That makes the host's child_changed fire
    // reliably once per press, so no clear-write is needed and nothing gets
    // coalesced away.
    netCmdNonce += 1;

    let dbData = {
        "session_id": currentSessionId,
        "playedKey": { "k": cmdText.toString(), "n": netCmdNonce }
    };

    return writeToDB(currentChannelName, dbData);
}

async function sharePadsUrl() {
    let channelUrl = "https://mmofx.xusione.com/index.html?channel=" + currentChannelName + "&mode=padClient";
    if (showChannelNameCheckbox.checked === true) {
        channelUrl += "&showChannel=1";
    }
    updateChannel();

    try {
        await navigator.share({ title: currentChannelName, url: channelUrl });
    } catch (err) {
        showCustomAlert(channelUrl);
    }
}

async function sharePianoUrl() {
    let channelUrl = "https://mmofx.xusione.com/index.html?channel=" + currentChannelName + "&mode=pianoClient";
    if (showChannelNameCheckbox.checked === true) {
        channelUrl += "&showChannel=1";
    }
    updateChannel();

    try {
        await navigator.share({ title: currentChannelName, url: channelUrl });
    } catch (err) {
        showCustomAlert(channelUrl);
    }
}

function addKeyPad(keyId) {
    let keyItem = currentKeyboard[keyId];
    padCount += 1;

    // <div class="col-xs-2">
    var padCol = $('<div class="keyPad-col px-2 py-2"></div>');
    let card_a = '<div class="card" style="width:100%; height:100%; touch-action: manipulation;" id="' + "playBtn" + keyId + '">';
    let card_b = '<div class="card-block"> <div id="' + 'pInput_' + keyId.toString() + '" class="card-title"></div>';
    let card_c = '<div class="keyPad" style="width:100%; height:100%; overflow: hidden;">';
    //let card_d = '<input type="text" class="form-control text-center keyPadInput" placeholder="' + keyId + '"></input>'
    let card_d = '<p class="text-center keyPadInput noselect">' + keyId + '</p>'
    let card_e = '</div></div>';

    var keyPanel = $(card_a + card_b + card_c + card_d + card_e);
    keyPanel.appendTo(padCol);
    padCol.appendTo('#keyPadPanel');

    // Pointer events (not mousedown) so rapid taps on touch devices fire
    // reliably — the browser's tap heuristics swallow synthesized mousedowns on
    // fast repeat taps. preventDefault suppresses the compatibility mouse events
    // and double-tap zoom. Matches the piano, which never drops presses.
    keyPanel.on('pointerdown', function (e) {
        e.preventDefault();

        // Brief visual flash so every tap is visibly registered, even rapid ones.
        var card = this;
        card.classList.add('pad-active');
        setTimeout(function () { card.classList.remove('pad-active'); }, 110);

        // Transmit and sound locally independently: a client (transmitting)
        // can also monitor its own pads when preview is on. See
        // shouldPlayLocalInput().
        if (enableTransmissionCheckbox.checked === true) {
            playNetworkCmd(keyId);
        }
        if (shouldPlayLocalInput()) {
            playKey(keyId, false, false);
        }

    });

    // <input checked type="checkbox" class="form-check-input" id="enablePreviewCheckbox">
    let synCheckboxId = keyId + "_" + "synActiveForKey";
    var synthCheckbox = $("<input checked type=\"checkbox\" id=\"" + synCheckboxId + "\" type = 'button' />");
    synthCheckbox.click(function () {
        //console.log(synCheckboxId);
    });

    let samplerCheckboxId = keyId + "_" + "synActiveForKey";
    var samplerCheckbox = $("<input checked type=\"checkbox\" id=\"" + samplerCheckboxId + "\" type = 'button' />");
    samplerCheckbox.click(function () {
        //console.log(samplerCheckboxId);
    });

}

function highlightPad(keyId) {
    let pad = document.getElementById("playBtn" + keyId);
    if (!pad) return;

    // Random hue, skipping the yellow band (~40-70deg)
    let hue = Math.floor(Math.random() * (360 - 30));
    if (hue >= 40) hue += 30;

    pad.style.setProperty("--pad-flash-color", "hsl(" + hue + ", 90%, 60%)");
    pad.classList.add("pad-received");

    clearTimeout(pad.dataset.highlightTimeout);
    pad.dataset.highlightTimeout = setTimeout(function () {
        pad.classList.remove("pad-received");
    }, 200);
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
    //console.log("Initializing Host");

    window.onbeforeunload = function () {
      window.scrollTo(0, 0);
    }

    if (!isInitUI) {
        initAudio();
    }

    initKeyMap();

    enablePreviewCheckbox.checked = false;

    midiOutChannelSlider.value = 0
    midiNotDurationSlider.value = 500;
    masterAmp_slider.value = 50;
    attack_knob.value = 5;
    duration_knob.value = 30;
    release_knob.value = 15;

    osc_a_vol_knob.value = 20;
    osc_b_vol_knob.value = 10;
    osc_c_vol_knob.value = 10;

    // Restore saved host settings last, so they override the defaults above.
    loadHostSettings();
}

// --- Host settings persistence -------------------------------------------

// Shared-link guests must never restore or save host settings; their state is
// dictated by the URL and the forced-off rules in session.js / initUI.
function isGuestSession() {
    return typeof url_vars !== 'undefined' &&
        (url_vars["mode"] === "padClient" || url_vars["mode"] === "pianoClient");
}

function saveHostSettings() {
    if (isGuestSession()) return;
    try {
        const settings = {
            channelName: currentChannelName,
            isClient: hostClientSwitch.checked,
            volume: masterAmp_slider.value,
            randomize: randomizePlaybackCheckbox.checked,
            keyboardInput: enablePreviewCheckbox.checked,
            holdPitched: holdPitchedCheckbox.checked,
            pitchPolyphony: pitchPolyphonyCheckbox.checked,
            pitchRelease: pianoReleaseSlider.value,
            noteOffOnRelease: pianoNoteOffCheckbox.checked,
            midiInEnabled: enableMidiInCheckbox.checked,
            midiOutEnabled: enableMidiOutCheckbox.checked,
            midiInChannel: midiInChannelSlider.value,
            midiOutChannel: midiOutChannelSlider.value,
            noteDuration: midiNotDurationSlider.value
        };
        localStorage.setItem(HOST_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
        console.warn('Could not save host settings:', e);
    }
}

function loadHostSettings() {
    if (isGuestSession()) return;
    let settings;
    try {
        settings = JSON.parse(localStorage.getItem(HOST_SETTINGS_KEY) || '{}');
    } catch (e) {
        return;
    }
    if (!settings || typeof settings !== 'object') return;

    // channelName is restored earlier in params.js, before the boot subscribe.
    // Host/Client mode: restore only when the URL doesn't pin a mode (URL wins).
    if (settings.isClient != null &&
        !(typeof url_vars !== 'undefined' && "mode" in url_vars)) {
        setHostClientMode(settings.isClient);
    }
    if (settings.volume != null) masterAmp_slider.value = settings.volume;
    if (settings.randomize != null) randomizePlaybackCheckbox.checked = settings.randomize;
    // Overrides the deliberate force-off in initUI; safe because we set an
    // explicit stored value rather than relying on browser form restoration.
    if (settings.keyboardInput != null) enablePreviewCheckbox.checked = settings.keyboardInput;
    if (settings.holdPitched != null) holdPitchedCheckbox.checked = settings.holdPitched;
    if (settings.pitchPolyphony != null) pitchPolyphonyCheckbox.checked = settings.pitchPolyphony;
    if (settings.noteOffOnRelease != null) pianoNoteOffCheckbox.checked = settings.noteOffOnRelease;
    if (settings.pitchRelease != null) {
        pianoReleaseSlider.value = settings.pitchRelease;
        pianoReleaseSlider.dispatchEvent(new Event('input')); // refresh the readout
    }
    if (settings.midiInEnabled != null) enableMidiInCheckbox.checked = settings.midiInEnabled;
    if (settings.midiOutEnabled != null) enableMidiOutCheckbox.checked = settings.midiOutEnabled;
    // Dispatch 'input' so the existing handlers update labels / currentChannel.
    if (settings.midiInChannel != null) {
        midiInChannelSlider.value = settings.midiInChannel;
        midiInChannelSlider.dispatchEvent(new Event('input'));
    }
    if (settings.midiOutChannel != null) {
        midiOutChannelSlider.value = settings.midiOutChannel;
        midiOutChannelSlider.dispatchEvent(new Event('input'));
    }
    if (settings.noteDuration != null) {
        midiNotDurationSlider.value = settings.noteDuration;
        midiNotDurationSlider.dispatchEvent(new Event('input'));
    }
}

duration_knob.oninput = function () {
    //console.log(duration_knob.value);
};

// TODO:
function updateChannel(){
    //console.log("TODO: Update DB Channel Name");
    //console.log("New Channel: " + currentChannelName);

    if (channelNameInputBox.value != "") {
        currentChannelName = channelNameInputBox.value.replaceAll(" ", "_").replaceAll("%", "_");
        channelNameInputBox.value = currentChannelName;
        console.log(currentChannelName);
        subscribeToDb(currentChannelName);
        saveHostSettings();
        //console.log("Switching to channel: " + currentChannelName);
    }
}

setChannelNameButton.addEventListener("click", updateChannel);

sharePadsChannelUrlButton.addEventListener("click", sharePadsUrl);
sharePianoChannelUrlButton.addEventListener("click", sharePianoUrl);

midiInChannelSlider.addEventListener("input", (event) => {
    currentChannel = parseInt(midiInChannelSlider.value);
    midiInChannelLabel.textContent = "Channel: " + event.target.value;
});

midiOutChannelSlider.addEventListener("input", (event) => {
    midiOutChannelLabel.textContent = "Channel: " + event.target.value;
});

midiNotDurationSlider.addEventListener("input", (event) => {
    midiNotDurationLabel.textContent = "Duration: " + event.target.value;
});

// --- Sequencer Hold: momentary (active only while pressed) ---
// Drives the hidden #stallSeq checkbox that iterateSeq() reads, so the
// sequencer tick logic is unchanged. Hold is released on every possible exit
// path, so it can never latch on if a pointerup is missed (finger slides off,
// pointercancel, lost capture, tab switch, app backgrounded).
(function initSeqHold() {
    const btn = document.getElementById("stallSeqBtn");
    const state = document.getElementById("stallSeq");
    if (!btn || !state) return;

    function setHold(on) {
        state.checked = on;
        btn.classList.toggle("active", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
    }
    const release = () => setHold(false);

    btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        // Keep receiving the pointerup even if the finger slides off the button.
        try { btn.setPointerCapture(e.pointerId); } catch (err) {}
        setHold(true);
    });

    btn.addEventListener("pointerup", release);
    btn.addEventListener("pointercancel", release);
    btn.addEventListener("lostpointercapture", release);
    btn.addEventListener("contextmenu", (e) => e.preventDefault());

    // Safety nets: never leave Hold stuck on if focus or visibility is lost.
    window.addEventListener("blur", release);
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) release();
    });
})();

// Persist host settings whenever one of these controls is changed.
[masterAmp_slider, randomizePlaybackCheckbox, enablePreviewCheckbox,
 holdPitchedCheckbox, pitchPolyphonyCheckbox, pianoReleaseSlider, pianoNoteOffCheckbox,
 enableMidiInCheckbox, enableMidiOutCheckbox,
 midiInChannelSlider, midiOutChannelSlider, midiNotDurationSlider].forEach((el) => {
    el.addEventListener("change", saveHostSettings);
});

document.addEventListener("DOMContentLoaded", initUI, false);

window.addEventListener('keydown', function(evt) {

    if (enablePreviewCheckbox.checked === true) {
        playKey(evt.key.toString(), false, false);
        //console.log("playKbd");
    }

    if (enableTransmissionCheckbox.checked === true) {
        playNetworkCmd(evt.key.toString());
    }

});

window.addEventListener('keyup', function(evt) {});

document.body.addEventListener('click', function() {
    if (!isInitAudio) { initAudio(); }
});

document.body.addEventListener('touchend', function() {
    if (!isInitAudio) { initAudio(); }
});


















//function addApiListRow() {
//    var apiListContainer = $("#apiConfContainer");
//    let rowID = uuidv4();
//
//    apiDir[rowID] = {};
//    apiDir[rowID]["url"] = "";
//    apiDir[rowID]["data"] = "";
//    apiDir[rowID]["keys"] = [];
//
//    // -----------------------------------------------------------------------------------------------------------------
//    var content = "<div class='col'> <input class='form-control' id='url" + rowID + "' type='text' placeholder='API Url' value='" + "" + "'> </div>"
//    var urlNameRow  = $("<div class='row py-2 top-sample-row'> " + content + " </div>");
//    var urlNameField = urlNameRow.find( "input" );
//
//    urlNameField.change(function () {
//        var sId = $(urlNameField).attr('id');
//        let apiKey = document.getElementById(sId.toString());
//        let urlNameValue = apiKey.value.toString();
//        apiDir[rowID]["url"] = urlNameValue;
//        //console.log(apiDir);
//    });
//
//    // -----------------------------------------------------------------------------------------------------------------
//    content = "<div class='col'> <input class='form-control' id='msg" + rowID + "' type='text' placeholder='Data' value='" + "" + "'> </div>"
//    var messageRow  = $("<div class='row py-2 mid-sample-row'> " + content + " </div>");
//    var msgInputKeysField = messageRow.find( "input" );
//
//    msgInputKeysField.change(function () {
//        var sId = $(msgInputKeysField).attr('id');
//        let msgInputField = document.getElementById(sId.toString());
//
//        let msg = msgInputField.value.toString();
//        apiDir[rowID]["data"] = msg;
//        //console.log(apiDir);
//    });
//
//    // -----------------------------------------------------------------------------------------------------------------
//    content = "<div class='col'> <input class='form-control' id='" + rowID + "' type='text' placeholder='Trig Keys' value='" + "" + "'> </div>"
//    var trgKeyRow   = $("<div class='row py-2 mid-sample-row'> " + content + "</div>");
//
//    var trgInputKeysField = trgKeyRow.find( "input" );
//
//    trgInputKeysField.change(function () {
//        var sId = $(trgInputKeysField).attr('id');
//        let trgKeyInputField = document.getElementById(sId.toString());
//        let trgK = trgKeyInputField.value.toString();
//        apiDir[rowID]["keys"] = trgK;
//        //console.log(apiDir);
//    });
//
//    // -----------------------------------------------------------------------------------------------------------------
//
//    let itmC = "<div class='col'> <input class='btn btn-light' type='button' value = 'Test'> </div>";
//
//    var btnPreview = $(itmC);
//    var prevBtn = btnPreview.find( "input" );
//    prevBtn.click(function () {
//        //TODO: Call Api
//        //console.log(apiDir);
//        //console.log("PrvBtn: " + apiDir[rowID]["url"] + ":" + apiDir[rowID]["data"]);
//        //callRestApi(apiDir[rowID]["url"], apiDir[rowID]["data"]);
//        const myValue = callRestApi(apiDir[rowID]["url"], apiDir[rowID]["data"]);
//        ////console.log(myValue);
//    });
//
//    // -----------------------------------------------------------------------------------------------------------------
//
//    let itmD  = "<div class='col'> <input class='btn btn-light' type='button' value='Delete'> </div>";
//
//    var btnRemove = $(itmD);
//    var remoBtn = btnRemove.find( "input" );
//    remoBtn.click(function () {
//        delete apiDir[rowID];
//        urlNameRow.remove();
//        messageRow.remove();
//        trgKeyRow.remove();
//        bottomRow.remove();
//    });
//
//    // -----------------------------------------------------------------------------------------------------------------
//
//    var bottomRow   = $("<div class='row py-2 btm-sample-row'> </div>");
//
//    // -----------------------------------------------------------------------------------------------------------------
//
//    // $(bottomRow).append(trgKeysInput);
//    $(bottomRow).append(btnPreview);
//    $(bottomRow).append(btnRemove);
//
//    $(apiListContainer).append(urlNameRow);
//    $(apiListContainer).append(messageRow);
//    $(apiListContainer).append(trgKeyRow);
//    $(apiListContainer).append(bottomRow);
//}
