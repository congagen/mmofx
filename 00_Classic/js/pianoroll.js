const numberOfKeys = 127;
const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const pianoViewport = document.getElementById('pianoViewport');
const pianoContainer = document.getElementById('pianoContainer');
const keyHeightSlider = document.getElementById('keyHeight');

// const scrollUpButton = document.getElementById('scrollUpButton');
// const scrollDownButton = document.getElementById('scrollDownButton');

let keyHeight = parseInt(keyHeightSlider.value);
let isMouseDown = false;
let isSwiping = false;
let activeTouches = new Map();
let lastSwipedNoteIndex = null;
var fullscreenMode = false;

function toggleFullscreen() {
    const performUI = document.getElementById('perform');
    const performTabs = document.getElementById('myTab');
    pianoScaleSlider = document.getElementById('pianoScaleSliderElement'); 
    
    if (fullscreenMode) {
        fullscreenMode = false;
        performUI.style.display = 'block';
        // performTabs.style.display = 'block';
        pianoScaleSlider.display = 'block';
        pianoScaleSlider.style = 'display: block !important;'
    } else {
        fullscreenMode = true;
        performUI.style.display = 'none';
        // performTabs.style.display = 'none';
        pianoScaleSlider.display = 'none';
        pianoScaleSlider.style = 'display: none !important;'
    }
}

function getKeyName(index) {
    const octave = Math.floor(index / 12);
    const noteIndex = index % 12;
    return notes[noteIndex] + (octave - 1);
}

function isBlackKey(noteName) {
    return noteName.includes('#');
}

function generatePianoKeys() {
    pianoContainer.innerHTML = '';
    for (let i = 0; i < numberOfKeys; i++) {
        const noteName = getKeyName(i);
        const key = document.createElement('div');
        key.classList.add('key');
        key.dataset.note = noteName;
        // Zero-pad so every note index is at least 2 chars. playKey() routes
        // single-char values to pad playback, so unpadded notes 0–9 would
        // wrongly trigger pads instead of pitched/MIDI playback.
        key.dataset.index = String(i).padStart(2, '0');
        key.style.height = `${keyHeight}px`; // Set initial height
        if (isBlackKey(noteName)) {
            key.classList.add('black-key');
        } else {
            key.classList.add('white-key');
            // Octave marker on each C so players can orient. The label is
            // pointer-events:none / unselectable (see CSS) so it never interferes
            // with key hit-testing, swipes, or text selection.
            if (noteName.charAt(0) === 'C') {
                const label = document.createElement('span');
                label.className = 'key-label';
                label.textContent = noteName;
                key.appendChild(label);
            }
        }
        pianoContainer.appendChild(key);
    }
    updateKeyStyles();
}

function getRandomRgbKeyB() {
    const r = Math.floor(150 + Math.random() * 105);
    const g = Math.floor(150 + Math.random() * 105);
    const b = Math.floor(150 + Math.random() * 105);
    return `rgb(${r},${g},${b})`;
}

function getRandomRgbKeyA() {
    const r = Math.floor(150 + Math.random() * 105);
    const g = Math.floor(150 + Math.random() * 105);
    const b = Math.floor(150 + Math.random() * 105);
    return `rgb(${r},${g},${b})`;
}

function getRandomRgbKeyB() {
    const r = Math.floor(150 + Math.random() * 105);
    const g = Math.floor(150 + Math.random() * 105);
    const b = Math.floor(150 + Math.random() * 105);
    return `rgb(${r},${g},${b})`;
}

function getRainbowColorForNote(note) {
    // const rainbowColors = [
    //     "rgb(255, 50, 50)",
    //     "rgb(255, 86, 40)",

    //     "rgb(255, 179, 0)",
    //     "rgb(255, 238, 0)",

    //     "rgb(170, 255, 44)",

    //     "rgb(87, 255, 84)",
    //     "rgb(40, 255, 75)",

    //     "rgb(42, 255, 202)",
    //     "rgb(58, 186, 255)",

    //     "rgb(94, 105, 255)",
    //     "rgb(72, 78, 255)",

    //     "rgb(122, 40, 255)"
    //   ];

    //   const noteToColorMap = {
    //     "C":  0,
    //     "C#": 1,

    //     "D":  2,
    //     "D#": 3,

    //     "E":  4,

    //     "F":  5,
    //     "F#": 6,

    //     "G":  7,
    //     "G#": 8,

    //     "A":  9,
    //     "A#": 10,

    //     "B":  11,
    //   };

      const noteLetter = note.slice(0, note.length > 1 && note[1] === '#' ? 2 : 1);
    
      const rainbowColors = [
        "rgb(255, 255, 255)",
        "rgb(26, 26, 26)"
      ];

      const noteToColorMap = {
        "C":  0,
        "C#": 1,

        "D":  0,
        "D#": 1,

        "E":  0,

        "F":  0,
        "F#": 1,

        "G":  0,
        "G#": 1,

        "A":  0,
        "A#": 1,

        "B":  0,
      };
  
    // Get the color index from the mapping.
    const colorIndex = noteToColorMap[noteLetter];

    // Get the color.
    const color = rainbowColors[colorIndex];

    // If the note is not in our mapping, return a default color (black).
    return color || "rgb(0,0,0)";
}

function updateKeyStyles() {
    const keys = document.querySelectorAll('.key');
    const whiteKeys = document.querySelectorAll('.white-key');
    const blackKeys = document.querySelectorAll('.black-key');

    keys.forEach(key => {
        key.style.width = `75%`;
        key.style.display = 'flex';
        key.style.alignItems = 'center';
        key.style.justifyContent = 'flex-end';
        key.style.paddingRight = '10px';
        key.style.position = 'relative';
        key.style.userSelect = 'none';
        key.style.webkitUserSelect = 'none';
        key.style.height = `${keyHeight}px`;
        key.style.boxSizing = 'border-box';
    });

    whiteKeys.forEach(key => {
        const dataNote = key.getAttribute('data-note');
        key.style.backgroundColor = getRainbowColorForNote(dataNote);
        key.style.zIndex = 1;
        key.style.justifyContent = 'flex-end';
        key.style.marginRight = `50%`;
        key.style.alignSelf = 'flex-start';
    });

    blackKeys.forEach(key => {
        const dataNote = key.getAttribute('data-note');
        key.style.backgroundColor = getRainbowColorForNote(dataNote);
        key.style.zIndex = 2;
        key.style.color = 'white';
        key.style.justifyContent = 'flex-start';
        key.style.paddingLeft = '10px';
        key.style.marginLeft = `25%`;
        key.style.alignSelf = 'flex-start';
    });
}

function scrollPianoRoll(direction) {
    let amount = keyHeight * 6;

    if (direction === 'up') {
        pianoViewport.scrollTop -= amount;
    } else if (direction === 'down') {
        pianoViewport.scrollTop += amount;
    }
}

// Notes sounded by each pointer during a drag gesture (local mode). Dragging
// across keys accumulates notes; they all sustain until the gesture ends and
// are released together on pointer up, rather than cancelling as you move.
let pianoGestureNotes = new Map(); // pointerId -> Set(noteIndex)

// Live readout for the Release slider.
function updateReleaseLabel() {
    if (pianoReleaseSlider) {
        document.getElementById("pianoReleaseValue").textContent =
            parseFloat(pianoReleaseSlider.value).toFixed(1);
    }
}

function pianoLocalNoteOn(pointerId, noteIndex, keyEl, forceRetrigger) {
    let set = pianoGestureNotes.get(pointerId);
    if (!set) { set = new Set(); pianoGestureNotes.set(pointerId, set); }
    // Already sounding this note in this gesture: skip — unless we're forcing a
    // re-articulation. Dragging with Hold off re-triggers on every key crossing,
    // so re-entering a key you've already visited fires it again.
    if (set.has(noteIndex) && !forceRetrigger) return;
    // Restart, never stack: if the note is already sounding (held by another
    // finger, or still releasing), stop the existing voice before re-triggering
    // so a re-press re-articulates instead of layering. No-op for one-shots.
    stopPitchedNote(noteIndex);
    set.add(noteIndex);
    if (keyEl) keyEl.classList.add('active');
    // Notes sustain at full while held/dragged; the release is applied on
    // pointer-up (pianoLocalRelease), not here.
    playKey(noteIndex, false, false, holdPitchedCheckbox.checked);
}

// Called when a drag leaves a key. With Hold off and "Note Off on Release" on,
// the note we just left is stopped so only the key under the pointer sounds
// (monophonic glissando). With Hold on (sustain) or Note Off off (ring/latch),
// the note is left alone — it's released later on pointer-up.
function pianoDragLeave(pointerId, noteIndex) {
    if (noteIndex === undefined || noteIndex === 64) return; // no prev key / gap
    if (holdPitchedCheckbox.checked) return;
    if (!(pianoNoteOffCheckbox && pianoNoteOffCheckbox.checked)) return;
    stopPitchedNote(noteIndex);
    const k = document.querySelector(`.key[data-index="${noteIndex}"]`);
    if (k) k.classList.remove('active');
    const set = pianoGestureNotes.get(pointerId);
    if (set) set.delete(noteIndex);
}

function pianoLocalRelease(pointerId) {
    const set = pianoGestureNotes.get(pointerId);
    if (!set) return;
    // Notes sustain at full while dragging; the release happens here on pointer
    // up. With "Note Off on Release" on, stop immediately; with it off, fade out
    // over the Release time (0 = ring until Reset/re-trigger).
    const latch = pianoNoteOffCheckbox && !pianoNoteOffCheckbox.checked;
    const releaseSec = pianoReleaseSlider ? parseFloat(pianoReleaseSlider.value) : 0;
    set.forEach(function (noteIndex) {
        if (latch) {
            releasePitchedNote(noteIndex, releaseSec);
        } else {
            stopPitchedNote(noteIndex);
        }
        const k = document.querySelector(`.key[data-index="${noteIndex}"]`);
        if (k) k.classList.remove('active');
    });
    pianoGestureNotes.delete(pointerId);
}

function onKeyDown(event) {
    // Seed the drag's Y origin so the first move can scan from the press point.
    pianoPointerY.set(event.pointerId, event.clientY);
    const key = event.target.closest('.key');
    if (key) {
        const noteIndex = key.dataset.index;
        const pointerId = event.pointerId;
        if (!activeTouches.has(pointerId)) {
            activeTouches.set(pointerId, noteIndex);
            lastSwipedNoteIndex = noteIndex;

            // Transmit and sound locally independently (see shouldPlayLocalInput).
            // When sounding locally, pianoLocalNoteOn owns the highlight + the
            // per-pointer release; otherwise the network path just lights the key.
            if (enableTransmissionCheckbox.checked === true) {
                playNetworkCmd(noteIndex);
            }
            if (shouldPlayLocalInput()) {
                pianoLocalNoteOn(pointerId, noteIndex, key);
            } else if (enableTransmissionCheckbox.checked === true) {
                key.classList.add('active');
            }

        }
        isSwiping = true;
    } else {
        const noteIndex = 64;
        const pointerId = event.pointerId;
        if (!activeTouches.has(pointerId)) {
            activeTouches.set(pointerId, noteIndex);
            lastSwipedNoteIndex = noteIndex;
        }
        
        isSwiping = true;
    }
}


function onMouseUp(event) {
    const pointerId = event.pointerId;

    if (shouldPlayLocalInput()) {
        // Local sound active: now that the gesture has ended, release every note
        // it sounded (per pointer, so lifting one finger doesn't cut others).
        pianoLocalRelease(pointerId);
    } else if (enableTransmissionCheckbox.checked === true) {
        // Network-only: clear the single follow-highlight for this pointer.
        const noteIndex = activeTouches.get(pointerId);
        if (noteIndex !== undefined) {
            const key = document.querySelector(`.key[data-index="${noteIndex}"]`);
            if (key) key.classList.remove('active');
        }
    }

    activeTouches.delete(pointerId);
    pianoPointerY.delete(pointerId);

    // Stop swiping only once no pointers remain down.
    if (activeTouches.size === 0) {
        isSwiping = false;
        lastSwipedNoteIndex = null;
        // Safety net: the pressed highlight is always cleared on release.
        document.querySelectorAll('.key.active').forEach(function (k) {
            k.classList.remove('active');
        });
    }
}

// Last clientY per pointer, so each drag move can scan every key row it crossed
// since the previous move — not just the row under the finger at this instant.
let pianoPointerY = new Map();

// Keys whose row midline lies between prevY and y AND whose horizontal box
// contains x, in drag-travel order. The x-in-box test preserves the layout's
// white-only (left) / black-only (right) / both (centre) zones — white keys span
// x 0–75%, black keys 25–100% (see updateKeyStyles). Scanning the whole Y span
// (rather than only the point under the finger) stops a fast drag from skipping
// rows: in the side zones every other row is an empty margin, so single-point
// hit-testing missed half the keys unless you dragged through the centre.
function keysCrossed(prevY, y, x) {
    const lo = Math.min(prevY, y), hi = Math.max(prevY, y);
    const out = [];
    const keys = pianoContainer.querySelectorAll('.key');
    for (let i = 0; i < keys.length; i++) {
        const r = keys[i].getBoundingClientRect();
        const mid = (r.top + r.bottom) / 2;
        if (mid < lo || mid > hi) continue;     // this row's midline wasn't crossed
        if (x < r.left || x > r.right) continue; // finger is outside this key's bar
        out.push(keys[i]);
    }
    if (y < prevY) out.reverse();               // order along the drag direction
    return out;
}

document.addEventListener('pointermove', (event) => {
    if (!((event.pointerType === 'mouse' && event.buttons > 0) || (event.pointerType !== 'mouse' && isSwiping))) return;

    const pointerId = event.pointerId;
    const x = event.clientX, y = event.clientY;
    const prevY = pianoPointerY.has(pointerId) ? pianoPointerY.get(pointerId) : y;
    pianoPointerY.set(pointerId, y);

    const crossed = keysCrossed(prevY, y, x);

    if (crossed.length === 0) {
        // No key crossed at this x: either gliding through a margin between keys
        // (keep the current note sounding) or off the keyboard entirely. Only the
        // latter ends the note, and only in mono-glissando (pianoDragLeave is a
        // no-op when Hold is on or Note Off is off).
        const cr = pianoContainer.getBoundingClientRect();
        const offKeys = x < cr.left || x > cr.right || y < cr.top || y > cr.bottom;
        if (offKeys && shouldPlayLocalInput()) {
            pianoDragLeave(pointerId, activeTouches.get(pointerId));
            activeTouches.set(pointerId, 64);
            lastSwipedNoteIndex = 64;
        }
        return;
    }

    for (const key of crossed) {
        const noteIndex = key.dataset.index;
        if (enableTransmissionCheckbox.checked === true) {
            playNetworkCmd(noteIndex);
        }
        if (shouldPlayLocalInput()) {
            // Stop the key we just left (Hold off + Note Off on), then trigger the
            // newly-crossed one. Hold off re-articulates on every crossing; Hold
            // on accumulates and sustains until pointer-up.
            pianoDragLeave(pointerId, activeTouches.get(pointerId));
            pianoLocalNoteOn(pointerId, noteIndex, key, !holdPitchedCheckbox.checked);
        } else if (enableTransmissionCheckbox.checked === true) {
            key.classList.add('active');
        }
        activeTouches.set(pointerId, noteIndex);
        lastSwipedNoteIndex = noteIndex;
    }
});

keyHeightSlider.addEventListener('input', () => {
    keyHeight = parseInt(keyHeightSlider.value);
    const keys = document.querySelectorAll('.key');
    keys.forEach(key => {
        key.style.height = `${keyHeight}px`;
    });
});

pianoContainer.addEventListener('pointerdown', (event) => {
    const targetKey = event.target.closest('.key');
    event.preventDefault();
    onKeyDown(event);
    isMouseDown = true;
    pianoContainer.setPointerCapture(event.pointerId);

    // if (targetKey) {
    //     event.preventDefault();
    //     onKeyDown(event);
    //     isMouseDown = true;
    //     pianoContainer.setPointerCapture(event.pointerId);
    // }
});

document.addEventListener('pointerup', onMouseUp);
document.addEventListener('pointercancel', onMouseUp);

// Suppress the long-press context menu / callout on the piano so a held key
// doesn't pop a dropdown on touch devices.
pianoContainer.addEventListener('contextmenu', function (event) {
    event.preventDefault();
});

function scrollToNote(noteName) {
    const allKeys = pianoContainer.querySelectorAll('.key');
    for (let i = 0; i < allKeys.length; i++) {
        if (allKeys[i].dataset.note.startsWith(noteName) && allKeys[i].classList.contains('white-key')) {
            pianoViewport.scrollTop = allKeys[i].offsetTop - (pianoViewport.offsetHeight / 2) + (allKeys[i].offsetHeight / 2);
            return;
        }
    }
    console.warn(`Note ${noteName} not found.`);
}

// Initial key generation
generatePianoKeys();
window.addEventListener('resize', () => {});