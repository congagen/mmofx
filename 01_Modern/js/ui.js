var noteTimer;

// True for stripped guest panels (share links) and ?layout=classic. Reads the
// URL directly, NOT just body.guest-panel — session.js sets that class but
// loads AFTER ui.js, so the DOM-flatten and dashboard init (which run here)
// would otherwise fire before the class exists, moving the pad panes and
// leaving guest links with no pads. Order-independent by design.
function isGuestLayout() {
    if (document.body && document.body.classList.contains("guest-panel")) return true;
    var s = location.search || "";
    return /[?&]mode=(padClient|pianoClient)\b/.test(s) || /[?&]layout=classic\b/.test(s);
}

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

    // Remove lives in the header bar (name + ✕); the body row keeps the
    // playing controls: preview, keys, pitch.
    header.append(removeBtn);
    body.append(previewBtn);
    body.append(keysGroup);
    body.append(pitchGroup);

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
  var hostBtn = document.getElementById('hostModeLabel');
  var clientBtn = document.getElementById('clientModeLabel');
  hostBtn.classList.toggle('active', !isClient);
  clientBtn.classList.toggle('active', isClient);
  hostBtn.setAttribute('aria-pressed', String(!isClient));
  clientBtn.setAttribute('aria-pressed', String(isClient));
}

hostClientSwitch.addEventListener('change', (event) => {
  setHostClientMode(event.currentTarget.checked);
  updateChannel();
});

// Segmented Host | Client control (Connection card) drives the same state.
['hostModeLabel', 'clientModeLabel'].forEach(function (id) {
  var btn = document.getElementById(id);
  if (!btn) return;
  btn.addEventListener('click', function () {
    setHostClientMode(id === 'clientModeLabel');
    updateChannel();
  });
});

async function addSamplesLsDisk(){
//    let files = await selectFile("audio/*", true);
    let files = await selectFile("", true);
    ////console.log(files);
    ////console.log(URL.createObjectURL(files[0]));

    // Import in alphabetical (natural) order so the sample list is predictable
    // regardless of how the OS picker returns the selection. Case-insensitive,
    // and numeric-aware so e.g. kick2 sorts before kick10.
    files.sort(function (a, b) {
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });

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

// Bulk-toggles the per-sample Pitch flag: if any sample is non-pitched, turn
// them all on; if every one is already on, turn them all off. Drives the same
// currentSamples[id][3] + per-row checkbox the manual toggles use. Heads up —
// with Sample Polyphony on, a pitched note layers every pitch-enabled sample, so
// "all on" is best paired with Randomize Samples (one random pitched sample per
// note).
function toggleAllPitch() {
    const ids = Object.keys(currentSamples);
    if (ids.length === 0) return;
    const enable = ids.some(function (id) { return !currentSamples[id][3]; });
    for (const id of ids) {
        currentSamples[id][3] = enable;
        const cb = document.getElementById('pitch_' + id);
        if (cb) cb.checked = enable;
    }

    // Heads-up only when it actually gets loud: we just pitched several samples,
    // Sample Polyphony is on, and Randomize is off, so every note layers them
    // all. Skips the warning when randomize is on or polyphony is off.
    const polyOn = pitchPolyphonyCheckbox && pitchPolyphonyCheckbox.checked;
    const randomOff = randomizePlaybackCheckbox && !randomizePlaybackCheckbox.checked;
    if (enable && ids.length > 2 && polyOn && randomOff) {
        showCustomAlert("All samples are now pitched. With Sample Polyphony on and Randomize off, every note plays them all at once, so playing as-is can get loud. Turn on Randomize Samples (Config → Audio) for one random sample per note.");
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

    // Carry the sender's Randomize/Hold intent (r/h) alongside the key so the
    // host can honour it even if its own toggles differ. The receiver ORs these
    // with its own settings, so randomize/hold works if either side enables it.
    let dbData = {
        "session_id": currentSessionId,
        "playedKey": {
            "k": cmdText.toString(),
            "n": netCmdNonce,
            "r": !!(randomizePlaybackCheckbox && randomizePlaybackCheckbox.checked),
            "h": !!(holdPitchedCheckbox && holdPitchedCheckbox.checked)
        }
    };

    return writeToDB(currentChannelName, dbData);
}

// Base URL for share links: this deployment's own page, so a guest who opens the
// link loads the same app — and therefore the same firebase-config.js / backend —
// as the host. Using the current origin (instead of a hardcoded domain) means
// self-hosted instances generate correct links automatically.
function shareBaseUrl() {
    return window.location.origin + window.location.pathname;
}

// URL-safe base64 (no padding) for packing the backend pointer into share links.
function b64urlEncode(s) {
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// When a custom backend is set via the Server box, shared links must carry it so
// guests reach the same Firebase (localStorage doesn't travel with the link). We
// pack only the fields MMOFX needs — apiKey, projectId, databaseURL — pipe-
// delimited and base64url'd to keep the URL short enough to QR-encode; authDomain
// is derived from projectId on the receiving end. Returns "" on the default
// backend, so default-backend links stay clean.
function backendShareParam() {
    let cfg;
    try { cfg = JSON.parse(localStorage.getItem('mmofx_firebase_config')); } catch (e) { return ""; }
    if (!cfg || !cfg.apiKey || !cfg.projectId || !cfg.databaseURL) return "";
    return "&fb=" + b64urlEncode([cfg.apiKey, cfg.projectId, cfg.databaseURL].join("|"));
}

// Build a client share URL for the given mode (padClient / pianoClient).
function buildShareUrl(mode) {
    var url = shareBaseUrl() + "?channel=" + encodeURIComponent(currentChannelName) + "&mode=" + mode;
    if (showChannelNameCheckbox && showChannelNameCheckbox.checked) url += "&showChannel=1";
    url += backendShareParam();
    return url;
}

// Copy-to-clipboard is the ONE consistent behaviour across browsers. The old
// navigator.share path gave a native sheet on Safari but threw straight to a
// bare alert on Chrome desktop — that was the inconsistency. Copy, then show
// the link so it can still be grabbed by hand if the copy was blocked.
function copyShareLink(url) {
    updateChannel();
    // Success: short confirmation, no URL (it would overflow the card).
    // Failure: show it in a selectable field so it can be copied by hand.
    function fallback() { showCustomAlert("Copy this share link:", url); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(
            function () { showCustomAlert("Share link copied to clipboard."); },
            fallback
        );
    } else {
        fallback();
    }
}

function sharePadsUrl() { copyShareLink(buildShareUrl("padClient")); }

function sharePianoUrl() { copyShareLink(buildShareUrl("pianoClient")); }

// Open the Client Designer (GUI alternative to the raw template download),
// prefilled with this host's channel and backend. The designer produces either
// a #cfg= link (read by custom-client-template.html) or a baked-in download.
function openClientDesigner() {
    updateChannel();
    var dir = shareBaseUrl().replace(/[^/]*$/, ""); // strip index.html → directory
    var url = dir + "client-designer.html?channel=" + encodeURIComponent(currentChannelName);
    url += backendShareParam(); // "&fb=..." only when a custom backend is set
    window.open(url, "_blank", "noopener");
}

// Generate a standalone custom-client HTML file pre-wired to this host's
// channel + backend. Fetches custom-client-template.html and replaces only the
// delimited backend/channel markers, so all other template defaults (panels,
// pads, etc.) are preserved for the user to edit. Pure client-side Blob
// download — no server involved.
async function downloadClientTemplate() {
    let html;
    try {
        const resp = await fetch("custom-client-template.html");
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        html = await resp.text();
    } catch (e) {
        showCustomAlert("Couldn't load the client template. Make sure custom-client-template.html is deployed alongside the app.");
        return;
    }

    // The host's resolved backend (apiKey/projectId/databaseURL/authDomain),
    // falling back to whatever the template already ships with if unavailable.
    var backend = (typeof firebaseConfig !== "undefined" && firebaseConfig) ? {
        apiKey: firebaseConfig.apiKey,
        projectId: firebaseConfig.projectId,
        databaseURL: firebaseConfig.databaseURL,
        authDomain: firebaseConfig.authDomain || (firebaseConfig.projectId + ".firebaseapp.com")
    } : null;

    if (backend) {
        html = html.replace(
            /\/\*__BACKEND__\*\/[\s\S]*?\/\*__END_BACKEND__\*\//,
            "/*__BACKEND__*/" + JSON.stringify(backend, null, 4) + "/*__END_BACKEND__*/"
        );
    }
    html = html.replace(
        /\/\*__CHANNEL__\*\/[\s\S]*?\/\*__END_CHANNEL__\*\//,
        "/*__CHANNEL__*/" + JSON.stringify(currentChannelName) + "/*__END_CHANNEL__*/"
    );

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mmofx-client-" + (currentChannelName || "panel") + ".html";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
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
        // Sanitize to a Firebase-key- and URL-safe allowlist: letters, digits,
        // hyphen, underscore. Firebase forbids . $ # [ ] / and control chars,
        // so anything outside the allowlist (including spaces) collapses to an
        // underscore, and leading/trailing underscores are trimmed. Capped at
        // 40 chars so share links (which carry the channel, plus the backend
        // pointer when custom) stay short enough to QR-encode reliably.
        currentChannelName = channelNameInputBox.value
            .replace(/[^A-Za-z0-9_-]+/g, "_")
            .replace(/^_+|_+$/g, "")
            .slice(0, 40);
        if (currentChannelName === "") currentChannelName = "Lobby";
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

(function () {
    var btn = document.getElementById("downloadClientButton");
    if (btn) btn.addEventListener("click", downloadClientTemplate);
})();

// UNIFIED LAYOUT — flatten the DOM once, for every screen size. This runs
// unconditionally (skipped only for stripped guest panels), so mobile and
// desktop share ONE structure: the old Bootstrap Config/Studio tabs are
// retired and everything becomes cards in #settings_tab .settings-container.
// Because the structure never differs by viewport, switching desktop<->mobile
// is a pure CSS flip (no node-moving, no reload). Node moves preserve state,
// handlers, and ids.
(function () {
    if (isGuestLayout()) return;
    var sampler = document.getElementById("sampler_tab");
    var settings = document.getElementById("settings_tab");
    if (!sampler || !settings) return;
    var container = settings.querySelector(".settings-container");
    if (!container) return;

    sampler.classList.remove("tab-pane", "fade", "show", "active");

    // Overview KPIs pinned to the top of the main area.
    var overview = document.getElementById("dashOverview");
    if (overview) settings.insertBefore(overview, settings.firstChild);

    // Controls (surface switcher + Pads/Seq/Keys panes) becomes a card too.
    var studio = document.getElementById("studio_tab");
    var ctrlTabsEl = document.getElementById("ctrlTabs");
    var studioContent = studio ? studio.querySelector(".tab-content") : null;
    if (studio && ctrlTabsEl && studioContent) {
        var controlsCard = document.createElement("div");
        controlsCard.className = "settings-card";
        controlsCard.id = "controlsCard";
        var chead = document.createElement("div");
        chead.className = "settings-card-header";
        chead.appendChild(document.createTextNode("Controls"));
        var cbody = document.createElement("div");
        cbody.className = "settings-card-body";
        cbody.appendChild(ctrlTabsEl);
        cbody.appendChild(studioContent);
        controlsCard.appendChild(chead);
        controlsCard.appendChild(cbody);
        container.appendChild(controlsCard);
    }

    // Samples last.
    container.appendChild(sampler);
})();

// Dashboard board: Gridstack (vendored, MIT) packs the settings cards +
// Samples into a 12-column widget grid — no holes at any width, drag by the
// card header to rearrange, resize from the corner, layout persisted per
// browser. Desktop full-app only: skipped for guest panels and below the
// dashboard breakpoint (mobile keeps the plain stacked cards). Runs on
// DOMContentLoaded so session.js has already tagged guest panels.
function initDashGrid() {
    if (isGuestLayout()) return;
    if (typeof GridStack === "undefined") return;
    var container = document.querySelector("#settings_tab .settings-container");
    if (!container) return;
    var isMobile = function () { return !window.matchMedia("(min-width: 1100px)").matches; };

    // v2: key bumped when the default board design changed (merged MIDI card,
    // 12-row fill design) so stale saved layouts don't fight the new defaults.
    var LAYOUT_KEY = "mmofx_dash_layout_v7"; // v7: equal column widths
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(LAYOUT_KEY)) || {}; } catch (e) {}

    // Default geometry on a 12-col x 12-row budget. Every column sums to 12
    // rows and cellHeight is fitted to the container (see fitCellHeight), so
    // the default board fills the available space exactly — no dangling
    // bottoms. Anything unlisted gets auto-placed as a 4x4 tile.
    var TOTAL_ROWS = 12;
    var defaults = {
        "connection":   { x: 0, y: 0, w: 3, h: 6 },
        "activityCard": { x: 0, y: 6, w: 3, h: 6 },
        "controlsCard": { x: 3, y: 0, w: 3, h: 12 },
        "audio":        { x: 6, y: 0, w: 3, h: 6 },
        "midi":         { x: 6, y: 6, w: 3, h: 6 },
        "sampler_tab":  { x: 9, y: 0, w: 3, h: 12 }
    };

    // Section groups for the mobile bottom-nav: each card's data-section key
    // maps to one of four thumb-reachable sections.
    var SECTION_OF = {
        controlsCard: "play",
        sampler_tab: "samples",
        connection: "monitor",
        activityCard: "monitor",
        audio: "setup",
        midi: "setup"
    };

    var gridEl = document.createElement("div");
    gridEl.className = "grid-stack";

    Array.prototype.slice.call(container.children).forEach(function (card) {
        if (!card.classList.contains("settings-card")) return;
        if (card.id === "sharingCard") return; // lives in the navbar Share menu
        var headEl = card.querySelector(".settings-card-header");
        // Slug the header for the layout key; strip edge hyphens so headers
        // like "MIDI In (Client)" give "midi-in-client", not "midi-in-client-".
        var key = card.id || (headEl ? headEl.textContent.trim().toLowerCase()
            .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") : "card");
        var geo = saved[key] || defaults[key] || { w: 4, h: 4 };
        card.dataset.section = key; // hook for per-section accent colors

        var item = document.createElement("div");
        item.className = "grid-stack-item";
        item.setAttribute("gs-id", key);
        item.setAttribute("data-mgroup", SECTION_OF[key] || "setup"); // mobile section
        if (geo.x != null && geo.y != null) {
            item.setAttribute("gs-x", geo.x);
            item.setAttribute("gs-y", geo.y);
        } else {
            // Unknown card (new/renamed header): let the engine find a free
            // slot rather than defaulting to 0,0 on top of another widget.
            item.setAttribute("gs-auto-position", "true");
        }
        item.setAttribute("gs-w", geo.w || 4);
        item.setAttribute("gs-h", geo.h || 4);

        var content = document.createElement("div");
        content.className = "grid-stack-item-content";
        content.appendChild(card);
        item.appendChild(content);
        gridEl.appendChild(item);
    });

    container.appendChild(gridEl);

    // If init throws, unwrap the cards back into the container and drop the
    // board — a failed grid must degrade to the plain stacked cards, never a
    // blank panel (gridstack.css absolutely-positions .grid-stack-item, so
    // un-laid-out items collapse to zero height and everything "disappears").
    var grid;
    try {
        grid = GridStack.init({
            cellHeight: 72,
            margin: 6,
            // float: widgets stay exactly where placed (no auto-compaction
            // jumps when something folds/moves) — predictable manual layout.
            float: true,
            handle: ".settings-card-header",
            // Edges stay live (n/s = vertical resize) but only the lower-right
            // corner shows a grip. scroll:false kills the library's
            // auto-scroll-under-pointer during drags (the "slippery" feel);
            // trade-off: you can't drag to an off-screen target, which the
            // viewport-fitted default layout never needs.
            resizable: { handles: "n, e, s, w, se" },
            // handle repeated here so a partial draggable object can never
            // clobber it back to the library default (whole-card dragging).
            draggable: { scroll: false, handle: ".settings-card-header" },
            // Keep the engine's dynamic row-height stylesheet in <head> rather
            // than injected into .settings-container, so no container-scoped
            // quirk can keep it from applying.
            styleInHead: true
        }, gridEl);
    } catch (e) {
        console.error("Dashboard grid init failed, falling back to stacked cards:", e);
        unwrap();
        return;
    }

    function unwrap() {
        Array.prototype.slice.call(gridEl.querySelectorAll(".settings-card")).forEach(function (card) {
            container.appendChild(card);
        });
        gridEl.remove();
    }

    // Fit the 12-row design to the viewport: cellHeight = available container
    // height / TOTAL_ROWS, so the default board fills the space exactly, with
    // no empty band below. Re-fits on window resize; a user layout taller than
    // 12 rows simply scrolls.
    function fitCellHeight() {
        var cs = getComputedStyle(container);
        var avail = container.clientHeight
            - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
        if (avail > 240) grid.cellHeight(Math.floor(avail / TOTAL_ROWS), true);
    }
    fitCellHeight();
    window.addEventListener("resize", fitCellHeight);

    // Per-card fold via a DOCK: the "–" button removes the widget from the
    // grid entirely (no phantom strip for the engine to shuffle around) and
    // parks a labelled pill in a strip above the board; clicking the pill
    // restores the card to its remembered spot. Far more predictable than
    // in-grid collapsing, and the pill is a readable, obvious control.
    var foldDock = document.createElement("div");
    foldDock.id = "foldDock";
    // Pills live in the navbar (always-present chrome), between the status
    // cluster and the right-side actions.
    var dashNav = document.getElementById("dashNav");
    if (dashNav) {
        dashNav.insertBefore(foldDock, dashNav.querySelector(".dash-actions"));
    } else {
        container.parentNode.insertBefore(foldDock, container);
    }
    var foldGeo = {};

    function cardTitle(headEl) {
        // First text node = the title (the fold button is appended after it).
        return (headEl.childNodes[0] && headEl.childNodes[0].textContent || "Panel").trim();
    }
    function foldCard(item, headEl) {
        var key = item.getAttribute("gs-id");
        var n = item.gridstackNode || {};
        foldGeo[key] = { x: n.x, y: n.y, w: n.w, h: n.h };
        grid.removeWidget(item, false);
        item.style.display = "none";

        var pill = document.createElement("button");
        pill.type = "button";
        pill.className = "dock-pill";
        pill.textContent = "➕ " + cardTitle(headEl); // ➕ Name
        pill.title = "Restore " + cardTitle(headEl);
        pill.addEventListener("click", function () {
            pill.remove();
            var g = foldGeo[key] || {};
            ["x", "y", "w", "h"].forEach(function (k) {
                if (g[k] != null) item.setAttribute("gs-" + k, g[k]);
            });
            item.style.display = "";
            grid.makeWidget(item);
        });
        foldDock.appendChild(pill);
    }
    Array.prototype.slice.call(gridEl.querySelectorAll(".grid-stack-item")).forEach(function (item) {
        var card = item.querySelector(".settings-card");
        var headEl = card && card.querySelector(".settings-card-header");
        if (!card || !headEl || headEl.querySelector(".card-fold-btn")) return;
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "card-fold-btn";
        btn.textContent = "–";
        btn.title = "Minimize to dock";
        headEl.appendChild(btn);
        btn.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
        btn.addEventListener("click", function (e) {
            e.stopPropagation();
            foldCard(item, headEl);
        });
    });

    // Sanity check: if init "succeeded" but the widgets ended up zero-height
    // (dynamic row stylesheet not applying, CSS collision, etc.), the board is
    // invisible — unwrap to plain stacked cards rather than a blank panel, and
    // log what happened for diagnosis.
    setTimeout(function () {
        // Mobile stacked mode: items are content-sized and section-FILTERED
        // (hidden cards measure 0x0), so this board-collapse check would
        // false-positive and unwrap the grid — killing the tab filtering.
        // It only guards the desktop board.
        if (document.body.classList.contains("dash-mobile")) return;
        var first = gridEl.querySelector(".grid-stack-item");
        // "Collapsed" includes the shrunk-to-dots case, not just zero-height.
        if (!first || (first.offsetHeight >= 40 && first.offsetWidth >= 40)) return;
        console.error("Dashboard grid rendered collapsed; reverting to stacked cards.",
            "grid:", gridEl.offsetWidth, "x", gridEl.offsetHeight,
            "item:", first.offsetWidth, "x", first.offsetHeight,
            "item computed width:", getComputedStyle(first).width,
            "gs-w:", first.getAttribute("gs-w"),
            "dynamic style tag:", !!document.querySelector("style[gs-style-id]"),
            "container width:", container.offsetWidth);
        try { grid.destroy(false); } catch (e) {}
        unwrap();
    }, 0);

    function saveLayout() {
        var out = {};
        grid.save(false).forEach(function (n) {
            if (n.id) out[n.id] = { x: n.x, y: n.y, w: n.w, h: n.h };
        });
        // Docked (folded) cards aren't in the grid, so a save made while one
        // is docked would silently drop its geometry — the "layout forgotten"
        // bug. Merge their remembered spots back in.
        Object.keys(foldGeo).forEach(function (k) {
            if (!out[k] && foldGeo[k] && foldGeo[k].x != null) out[k] = foldGeo[k];
        });
        try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(out)); } catch (e) {}
    }
    grid.on("change", saveLayout);
    grid.on("resizestop dragstop added removed", saveLayout);

    // ---- Responsive mode ----------------------------------------------------
    // Desktop: draggable board, cellHeight fitted to the viewport. Mobile:
    // Gridstack goes static (no touch-dragging) and the CSS media query stacks
    // the cards full-width; the bottom section nav shows one group at a time.
    // Switching is a pure CSS/flag flip — the DOM never changes, so resizing
    // across the breakpoint is seamless (no reload).
    function applyMode() {
        var mobile = isMobile();
        document.body.classList.toggle("dash-mobile", mobile);
        grid.setStatic(mobile);
        if (!mobile) fitCellHeight();
    }

    // Bottom section nav (mobile only; hidden by CSS on desktop).
    // Section ids stay stable (they key the data-mgroup filtering); labels
    // and order are the user-facing part.
    function svgIcon(inner) {
        return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
    }
    var SECTIONS = [
        // Connection — wifi/signal
        { id: "monitor", label: "Connection", icon: '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>' },
        // Controls — sliders
        { id: "play", label: "Controls", icon: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>' },
        // Samples — music note
        { id: "samples", label: "Samples", icon: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>' },
        // Settings — gear
        { id: "setup", label: "Settings", icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>' }
    ];
    var nav = document.createElement("nav");
    nav.id = "mobileSectionNav";
    function selectSection(id) {
        document.body.dataset.msection = id;
        Array.prototype.forEach.call(nav.children, function (b) {
            b.classList.toggle("active", b.dataset.section === id);
        });
    }
    SECTIONS.forEach(function (s) {
        var b = document.createElement("button");
        b.type = "button";
        b.dataset.section = s.id;
        b.setAttribute("aria-label", s.label);
        b.innerHTML = '<span class="msnav-ico">' + svgIcon(s.icon) + '</span><span class="msnav-lbl">' + s.label + '</span>';
        b.addEventListener("click", function () { selectSection(s.id); });
        nav.appendChild(b);
    });
    document.body.appendChild(nav);
    selectSection(SECTIONS[0].id); // first tab (Connection) is the landing section

    applyMode();
    var modeTimer;
    window.addEventListener("resize", function () {
        clearTimeout(modeTimer);
        modeTimer = setTimeout(applyMode, 150);
    });
}
document.addEventListener("DOMContentLoaded", initDashGrid);

// (The layout-switch reload prompt is gone: the unified design means crossing
// the breakpoint is a pure CSS flip — nothing to reload.)

// Navbar "Reset Layout": always bound (not inside initDashGrid, whose early
// returns previously left the button dead in some load conditions). Clears
// every saved dashboard-layout key by prefix, then reloads to rebuild from
// the defaults (also brings back docked cards).
document.addEventListener("DOMContentLoaded", function () {
    var btn = document.getElementById("resetLayoutBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
        if (!confirm("Reset the dashboard layout to the default arrangement?")) return;
        try {
            for (var i = localStorage.length - 1; i >= 0; i--) {
                var k = localStorage.key(i);
                if (k && k.indexOf("mmofx_dash_layout") === 0) localStorage.removeItem(k);
            }
            localStorage.removeItem("mmofx_controls_w");
            localStorage.removeItem("mmofx_rail_folded");
        } catch (e) {}
        location.reload();
    });
});

// Width handlebar on the Controls rail | Main boundary: dragging writes the
// --controls-w CSS var the outer grid reads, so the whole layout (including
// the Gridstack board, whose widget widths are percentages) reflows live.
// Width persists per browser. Dashboard-only, like the board itself.
function initRailResize() {
    // Retired when Controls became a board widget (initDashGrid runs first
    // and creates #controlsCard); kept for a fallback where the board fails.
    if (document.getElementById("controlsCard")) return;
    if (isGuestLayout()) return;
    if (!window.matchMedia("(min-width: 1100px)").matches) return;
    var rail = document.getElementById("studio_tab");
    if (!rail) return;

    var KEY = "mmofx_controls_w";
    var current = null;

    function clamp(v) {
        return Math.max(300, Math.min(Math.floor(window.innerWidth * 0.6), v));
    }
    function apply(px) {
        current = clamp(px);
        document.body.style.setProperty("--controls-w", current + "px");
    }

    var saved = NaN;
    try { saved = parseInt(localStorage.getItem(KEY), 10); } catch (e) {}
    if (!isNaN(saved)) apply(saved);

    var bar = document.createElement("div");
    bar.id = "railResizeHandle";
    bar.setAttribute("role", "separator");
    bar.setAttribute("aria-label", "Drag to resize the controls column");
    rail.appendChild(bar);

    var dragging = false;
    bar.addEventListener("pointerdown", function (e) {
        dragging = true;
        document.body.classList.add("rail-resizing");
        try { bar.setPointerCapture(e.pointerId); } catch (err) {}
        e.preventDefault();
    });
    bar.addEventListener("pointermove", function (e) {
        // The rail starts at x=0, so the pointer's clientX IS the rail width.
        if (dragging) apply(e.clientX);
    });
    function endDrag() {
        if (!dragging) return;
        dragging = false;
        document.body.classList.remove("rail-resizing");
        if (current != null) {
            try { localStorage.setItem(KEY, String(current)); } catch (e) {}
        }
    }
    bar.addEventListener("pointerup", endDrag);
    bar.addEventListener("pointercancel", endDrag);
    bar.addEventListener("lostpointercapture", endDrag);

    // Fold/unfold the rail: chevron on the boundary or double-click the
    // handlebar. Persisted; defaults to folded on smaller displays (<1280px)
    // where the rail eats too much of the board.
    var FOLD_KEY = "mmofx_rail_folded";
    var foldBtn = document.createElement("button");
    foldBtn.id = "railFoldBtn";
    foldBtn.type = "button";
    foldBtn.setAttribute("aria-label", "Fold or unfold the controls column");
    rail.appendChild(foldBtn);

    function setFolded(folded, persist) {
        document.body.classList.toggle("fold-rail", folded);
        foldBtn.textContent = folded ? "›" : "‹"; // › / ‹
        foldBtn.title = folded ? "Show controls" : "Hide controls";
        if (persist) {
            try { localStorage.setItem(FOLD_KEY, folded ? "1" : "0"); } catch (e) {}
        }
    }
    var savedFold = null;
    try { savedFold = localStorage.getItem(FOLD_KEY); } catch (e) {}
    setFolded(savedFold === null ? window.innerWidth < 1280 : savedFold === "1", false);

    foldBtn.addEventListener("click", function () {
        setFolded(!document.body.classList.contains("fold-rail"), true);
    });
    bar.addEventListener("dblclick", function () {
        setFolded(true, true);
    });
}
document.addEventListener("DOMContentLoaded", initRailResize);

// Dashboard navbar: master volume + mute. The navbar slider mirrors the Config
// Audio slider (#masterAmp) that playBuffer reads at trigger time; mute stashes
// the last level and restores it. Kept in sync both ways. No-op on mobile.
(function () {
    var master = document.getElementById("masterAmp");
    var slider = document.getElementById("navVolSlider");
    var muteBtn = document.getElementById("navMuteBtn");
    if (!master || !slider) return;

    var SVG_HEAD = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
    var ICON_ON = SVG_HEAD + '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 6a9 9 0 0 1 0 12"/></svg>';   // speaker
    var ICON_OFF = SVG_HEAD + '<path d="M11 5 6 9H2v6h4l5 4V5z"/><line x1="16" y1="9" x2="22" y2="15"/><line x1="22" y1="9" x2="16" y2="15"/></svg>';  // muted speaker
    var lastLevel = parseFloat(master.value) || 80;

    function icon(v) {
        if (!muteBtn) return;
        var muted = v <= 0;
        muteBtn.innerHTML = muted ? ICON_OFF : ICON_ON;
        muteBtn.setAttribute("aria-label", muted ? "Unmute" : "Mute");
        muteBtn.setAttribute("title", muted ? "Unmute" : "Mute");
    }

    function setLevel(v) {
        v = Math.max(0, Math.min(100, v));
        master.value = v;
        slider.value = v;
        icon(v);
        master.dispatchEvent(new Event("change")); // persist host settings
    }

    slider.value = master.value;
    icon(parseFloat(master.value));

    slider.addEventListener("input", function () {
        var v = parseFloat(slider.value);
        if (v > 0) lastLevel = v;
        setLevel(v);
    });
    // Reflect changes made from the Config slider.
    master.addEventListener("input", function () {
        slider.value = master.value;
        icon(parseFloat(master.value));
    });
    if (muteBtn) muteBtn.addEventListener("click", function () {
        var cur = parseFloat(master.value) || 0;
        setLevel(cur > 0 ? 0 : (lastLevel > 0 ? lastLevel : 80));
    });
})();

// Dashboard navbar Share dropdown → reuse the existing share actions.
(function () {
    [["navSharePads", sharePadsUrl],
     ["navSharePiano", sharePianoUrl],
     ["navDesignClient", openClientDesigner],
     ["navDownloadClient", downloadClientTemplate]].forEach(function (pair) {
        var el = document.getElementById(pair[0]);
        if (el) el.addEventListener("click", function () { pair[1](); });
    });

    // "Show channel name" now lives in this dropdown; mirror it into the
    // canonical #showChannelNameCheckbox the share URLs read (that control's
    // old Sharing card is otherwise homeless in the dashboard).
    var navShow = document.getElementById("navShowChannel");
    if (navShow && typeof showChannelNameCheckbox !== "undefined" && showChannelNameCheckbox) {
        navShow.checked = showChannelNameCheckbox.checked;
        navShow.addEventListener("change", function () {
            showChannelNameCheckbox.checked = navShow.checked;
        });
    }
})();

// Dashboard overview KPIs: refreshed on a light tick so the center opens
// populated and stays live. Activity counts networked commands in the last
// minute (network.js pushes timestamps into window.dashActivityTimes).
window.dashActivityTimes = window.dashActivityTimes || [];
function updateOverview() {
    var el;
    el = document.getElementById("statChannel");
    if (el) el.textContent = currentChannelName || "—";
    el = document.getElementById("statVoices");
    if (el) el.textContent = (typeof currentBufferSources === "object" && currentBufferSources) ? Object.keys(currentBufferSources).length : 0;
    el = document.getElementById("statSamples");
    if (el) el.textContent = (typeof currentSamples === "object" && currentSamples) ? Object.keys(currentSamples).length : 0;
    el = document.getElementById("statMidi");
    if (el) {
        var inOn = typeof enableMidiInCheckbox !== "undefined" && enableMidiInCheckbox && enableMidiInCheckbox.checked;
        var outOn = typeof enableMidiOutCheckbox !== "undefined" && enableMidiOutCheckbox && enableMidiOutCheckbox.checked;
        el.textContent = (inOn && outOn) ? "In · Out" : inOn ? "In" : outOn ? "Out" : "Off";
    }
    el = document.getElementById("statActivity");
    if (el) {
        var now = Date.now();
        window.dashActivityTimes = window.dashActivityTimes.filter(function (t) { return now - t < 60000; });
        el.textContent = window.dashActivityTimes.length;
    }

    // Mirror the same values into the status popover (skip while hidden).
    var pop = document.getElementById("statusPopover");
    if (pop && !pop.hidden) {
        var t = function (id) { return document.getElementById(id); };
        var dot = document.querySelector("#dashStatusBtn .connection-dot");
        t("spConnState").textContent =
            dot && dot.classList.contains("connected") ? "Connected" :
            dot && dot.classList.contains("disconnected") ? "Reconnecting…" : "Connecting…";
        var server = "Default";
        try {
            var cfg = JSON.parse(localStorage.getItem("mmofx_firebase_config"));
            if (cfg && cfg.projectId) server = cfg.projectId;
        } catch (e) {}
        t("spServer").textContent = server;
        t("spChannel").textContent = currentChannelName || "—";
        t("spActivity").textContent = (t("statActivity") ? t("statActivity").textContent : "0") + " /min";
        t("spVoices").textContent = t("statVoices") ? t("statVoices").textContent : "0";
        t("spSamples").textContent = t("statSamples") ? t("statSamples").textContent : "0";
        t("spMidi").textContent = t("statMidi") ? t("statMidi").textContent : "—";
        var isClient = typeof hostClientSwitch !== "undefined" && hostClientSwitch && hostClientSwitch.checked;
        var hostBtn = t("spModeHost"), clientBtn = t("spModeClient");
        if (hostBtn) hostBtn.classList.toggle("active", !isClient);
        if (clientBtn) clientBtn.classList.toggle("active", isClient);
    }
}
setInterval(updateOverview, 1000);
updateOverview();

// Status popover: open/close on the navbar status chip; outside click and
// Escape dismiss. The Host/Client buttons mirror the Connection card's switch
// through the single mutation point (setHostClientMode + updateChannel, same
// as the card's own change handler).
(function () {
    var btn = document.getElementById("dashStatusBtn");
    var pop = document.getElementById("statusPopover");
    if (!btn || !pop) return;

    function setOpen(open) {
        pop.hidden = !open;
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        if (open) updateOverview(); // fill immediately, don't wait for the tick
    }
    btn.addEventListener("click", function (e) {
        e.stopPropagation();
        setOpen(pop.hidden);
    });
    document.addEventListener("click", function (e) {
        if (!pop.hidden && !pop.contains(e.target)) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && !pop.hidden) setOpen(false);
    });

    function setMode(isClient) {
        setHostClientMode(isClient);
        updateChannel();
        updateOverview();
    }
    var hostBtn = document.getElementById("spModeHost");
    var clientBtn = document.getElementById("spModeClient");
    if (hostBtn) hostBtn.addEventListener("click", function () { setMode(false); });
    if (clientBtn) clientBtn.addEventListener("click", function () { setMode(true); });
})();

// Dashboard Controls tab bar: show one surface at a time (Pads / Seq / Keys)
// via body[data-ctrl], which the dashboard CSS reads. No-op on mobile (buttons
// hidden; #subNav handles navigation there).
(function () {
    var tabs = [
        { id: "ctrlPadsBtn", ctrl: "pads" },
        { id: "ctrlSeqBtn",  ctrl: "seq"  },
        { id: "ctrlKeysBtn", ctrl: "keys" }
    ];
    var btns = tabs.map(function (t) { return document.getElementById(t.id); });
    if (btns.some(function (b) { return !b; })) return;
    var labels = { pads: "Pads", seq: "Seq", keys: "Keys" };
    var menuBtn = document.getElementById("ctrlMenuBtn");
    function select(ctrl) {
        document.body.dataset.ctrl = ctrl;
        tabs.forEach(function (t, i) { btns[i].classList.toggle("active", t.ctrl === ctrl); });
        // Keep the compact hamburger fallback (shown when the rail is narrow)
        // labelled with the current surface.
        if (menuBtn) menuBtn.innerHTML = "&#9776; " + (labels[ctrl] || ctrl);
    }
    tabs.forEach(function (t, i) {
        btns[i].addEventListener("click", function () { select(t.ctrl); });
    });
    Array.prototype.slice.call(document.querySelectorAll("#ctrlMenu .dropdown-item[data-ctrl]"))
        .forEach(function (item) {
            item.addEventListener("click", function () { select(item.dataset.ctrl); });
        });
    select("pads"); // default surface
})();

// Mirror the current channel into the dashboard navbar. Safe no-op if the
// element isn't present (mobile / guest panels).
function updateDashChannel(name) {
    var el = document.getElementById("dashChannel");
    if (el) el.textContent = name || currentChannelName || "";
}
// Populate once on load (network.js's initial subscribe ran before this file).
updateDashChannel();

// ── Server: point MMOFX at your own Firebase backend (Connection → Server) ──────
const FIREBASE_CONFIG_KEY = 'mmofx_firebase_config';

// Accepts either valid JSON or the JS object literal the Firebase console hands
// you (unquoted keys, a `const firebaseConfig =` prefix, trailing semicolon/comma).
// Returns the parsed config object, or null if it can't be understood. No eval.
function parseFirebaseConfig(text) {
    if (!text) return null;
    let t = text.trim()
        .replace(/^\s*(?:const|let|var)\s+[\w$]+\s*=\s*/, "")  // drop `const x =`
        .replace(/;\s*$/, "");                                  // drop trailing ;
    try {
        return JSON.parse(t);
    } catch (e) {
        try {
            const jsonish = t
                .replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":') // quote keys
                .replace(/,(\s*[}\]])/g, '$1');                          // drop trailing commas
            return JSON.parse(jsonish);
        } catch (e2) {
            return null;
        }
    }
}

(function initServerConfigUI() {
    const input = document.getElementById('firebaseConfigInput');
    const saveBtn = document.getElementById('firebaseConfigSave');
    const resetBtn = document.getElementById('firebaseConfigReset');
    const statusEl = document.getElementById('firebaseBackendStatus');
    if (!input || !saveBtn || !resetBtn) return;

    // Read defensively: some browsers (e.g. Brave with shields up) throw on
    // localStorage access. This IIFE runs before initUI is registered, so an
    // unguarded throw here would halt ui.js and the pads would never get built.
    let saved = null;
    try { saved = localStorage.getItem(FIREBASE_CONFIG_KEY); } catch (e) {}
    if (saved) input.value = saved;

    if (statusEl) {
        // Only surface the backend when it's a custom one (confirmation you're on
        // your own server). On the default shared backend this stays blank, so
        // casual users aren't shown backend jargon above Current Channel.
        let project = '';
        try {
            if (saved) project = (JSON.parse(saved).projectId || '?');
        } catch (e) {}
        statusEl.textContent = project ? ('Server: ' + project) : '';
    }

    saveBtn.addEventListener('click', function () {
        const cfg = parseFirebaseConfig(input.value);
        if (!cfg || !cfg.apiKey || !cfg.databaseURL || !cfg.projectId) {
            showCustomAlert("That doesn't look like a valid Firebase config. Paste the config object from your Firebase project settings — it needs at least apiKey, databaseURL, and projectId.");
            return;
        }
        if (!confirm("Switch to backend \"" + cfg.projectId + "\"? This reloads the app and clears any loaded samples.")) return;
        try {
            localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(cfg));
        } catch (e) {
            showCustomAlert("Couldn't save the backend — this browser is blocking local storage (check privacy/shield settings).");
            return;
        }
        showCustomAlert("Backend saved. Reloading to connect to \"" + cfg.projectId + "\"…");
        setTimeout(function () { location.reload(); }, 700);
    });

    resetBtn.addEventListener('click', function () {
        if (!confirm("Revert to the default backend? This reloads the app and clears any loaded samples.")) return;
        try { localStorage.removeItem(FIREBASE_CONFIG_KEY); } catch (e) {}
        input.value = "";
        showCustomAlert("Reverted to the default backend. Reloading…");
        setTimeout(function () { location.reload(); }, 700);
    });
})();

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
