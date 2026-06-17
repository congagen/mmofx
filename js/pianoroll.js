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

function pianoLocalNoteOn(pointerId, noteIndex, keyEl) {
    let set = pianoGestureNotes.get(pointerId);
    if (!set) { set = new Set(); pianoGestureNotes.set(pointerId, set); }
    if (set.has(noteIndex)) return; // this pointer is already on this note
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
    const key = event.target.closest('.key');
    if (key) {
        const noteIndex = key.dataset.index;
        const pointerId = event.pointerId;
        if (!activeTouches.has(pointerId)) {
            activeTouches.set(pointerId, noteIndex);
            lastSwipedNoteIndex = noteIndex;

            if (enableTransmissionCheckbox.checked === true) {
                key.classList.add('active');
                playNetworkCmd(noteIndex);
            } else {
                pianoLocalNoteOn(pointerId, noteIndex, key);
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

    if (enableTransmissionCheckbox.checked === true) {
        // Network mode: clear the single follow-highlight for this pointer.
        const noteIndex = activeTouches.get(pointerId);
        if (noteIndex !== undefined) {
            const key = document.querySelector(`.key[data-index="${noteIndex}"]`);
            if (key) key.classList.remove('active');
        }
    } else {
        // Local mode: now that the gesture has ended, release every note it
        // sounded (per pointer, so lifting one finger doesn't cut others).
        pianoLocalRelease(pointerId);
    }

    activeTouches.delete(pointerId);

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

document.addEventListener('pointermove', (event) => {
    if ((event.pointerType === 'mouse' && event.buttons > 0) || (event.pointerType !== 'mouse' && isSwiping)) {
        const elementAtPoint = document.elementFromPoint(event.clientX, event.clientY);
        const targetKey = elementAtPoint ? elementAtPoint.closest('.key') : null;

        if (targetKey) {
            const noteIndex = targetKey.dataset.index;
            const pointerId = event.pointerId;

            if (!activeTouches.has(pointerId) || activeTouches.get(pointerId) !== noteIndex) {
                const lastKeyIndex = activeTouches.get(pointerId);
                activeTouches.set(pointerId, noteIndex);
                lastSwipedNoteIndex = noteIndex;

                if (enableTransmissionCheckbox.checked === true) {
                    // Network mode: a single highlight follows the pointer.
                    if (lastKeyIndex !== undefined) {
                        const lastKey = document.querySelector(`.key[data-index="${lastKeyIndex}"]`);
                        if (lastKey) lastKey.classList.remove('active');
                    }
                    targetKey.classList.add('active');
                    playNetworkCmd(noteIndex);
                } else {
                    // Local mode: accumulate — dragging over a key adds it and
                    // sustains it until the gesture ends (no release here).
                    pianoLocalNoteOn(pointerId, noteIndex, targetKey);
                }
            }
        } else {
            const noteIndex = 64;
            const pointerId = event.pointerId;

            if (!activeTouches.has(pointerId) || activeTouches.get(pointerId) !== noteIndex) {
                const lastKeyIndex = activeTouches.get(pointerId);
                // Network mode follows the pointer, so clear its highlight when
                // it leaves the keys. Local mode keeps held notes sounding.
                if (enableTransmissionCheckbox.checked === true && lastKeyIndex !== undefined) {
                    const lastKey = document.querySelector(`.key[data-index="${lastKeyIndex}"]`);
                    if (lastKey) lastKey.classList.remove('active');
                }
                activeTouches.set(pointerId, noteIndex);
                lastSwipedNoteIndex = noteIndex;
            }
        }
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