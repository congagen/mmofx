const numberOfKeys = 127;
const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const pianoViewport = document.getElementById('pianoViewport');
const pianoContainer = document.getElementById('pianoContainer');
const keyHeightSlider = document.getElementById('keyHeight'); // Reference to the height slider

// const fullscreenButton = document.getElementById('fullscreenButton');
// const scrollUpButton = document.getElementById('scrollUpButton');
// const scrollDownButton = document.getElementById('scrollDownButton');


let keyHeight = parseInt(keyHeightSlider.value);
let isMouseDown = false;
let isSwiping = false;
let activeTouches = new Map();
let lastSwipedNoteIndex = null;

var fullscreenMode = false;

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
        key.dataset.index = i;
        key.style.height = `${keyHeight}px`; // Set initial height
        if (isBlackKey(noteName)) {
            key.classList.add('black-key');
        } else {
            key.classList.add('white-key');
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
    //     "rgb(255, 38, 38)",
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

    //     "rgb(166, 0, 255)"
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
        "rgb(231, 230, 255)",
        "rgb(14, 0, 56)"
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
        key.style.alignSelf = 'flex-start'; /* Explicitly align to start */
    });

    blackKeys.forEach(key => {
        const dataNote = key.getAttribute('data-note');
        key.style.backgroundColor = getRainbowColorForNote(dataNote);
        key.style.zIndex = 2;
        key.style.color = 'white';
        key.style.justifyContent = 'flex-start';
        key.style.paddingLeft = '10px';
        key.style.marginLeft = `25%`; /* Adjust overlap as needed */
        key.style.alignSelf = 'flex-start'; /* Explicitly align to start */
    });
}

function onKeyDown(event) {
    const key = event.target.closest('.key');
    if (key) {
        const noteIndex = key.dataset.index;
        const pointerId = event.pointerId;
        if (!activeTouches.has(pointerId)) {
            activeTouches.set(pointerId, noteIndex);
            key.classList.add('active');
            console.log(`Note On (Down): ${key.dataset.note}, Pointer ID: ${pointerId}`);
            lastSwipedNoteIndex = noteIndex;
            
            if (enableTransmissionCheckbox.checked === true) {
                //console.log("Sending: " + keyId.toString());
                playNetworkCmd(noteIndex);
            } else {
                playKey(noteIndex, false, false);
            }

        }
        isSwiping = true;
    }
    // TODO: Send MIDI note (Network if client and local if host)


    // console.log("onKeyDown - isMouseDown:", isMouseDown, "isSwiping:", isSwiping);
}

function onMouseUp(event) {
    isSwiping = false;
    const activeKeys = document.querySelectorAll('.key.active');
    activeKeys.forEach(key => {
        key.classList.remove('active');
        // console.log(`Note Off (Up - Document - Reset All): ${key.dataset.note}, Pointer ID: ${event.pointerId}`);
    });
    activeTouches.clear();
    lastSwipedNoteIndex = null;
    // console.log("onMouseUp - isMouseDown:", isMouseDown, "isSwiping:", isSwiping);
}

document.addEventListener('pointermove', (event) => {
    if ((event.pointerType === 'mouse' && event.buttons > 0) || (event.pointerType !== 'mouse' && isSwiping)) {
        const elementAtPoint = document.elementFromPoint(event.clientX, event.clientY);
        const targetKey = elementAtPoint ? elementAtPoint.closest('.key') : null;

        if (targetKey) {
            const noteIndex = targetKey.dataset.index;
            const pointerId = event.pointerId;
            // console.log(`onSwipeMove - Pointer ${pointerId} over key ${targetKey.dataset.note} (index ${noteIndex}), buttons: ${event.buttons}, pointerType: ${event.pointerType}, isSwiping: ${isSwiping}`);

            if (!activeTouches.has(pointerId) || activeTouches.get(pointerId) !== noteIndex) {
                const lastKeyIndex = activeTouches.get(pointerId);
                if (lastKeyIndex !== undefined) {
                    const lastKey = document.querySelector(`.key[data-index="${lastKeyIndex}"]`);
                    if (lastKey) {
                        lastKey.classList.remove('active');
                        // console.log(`Note Off (Swipe Move Exit): ${lastKey.dataset.note}, Pointer ID: ${pointerId}`);
                    }
                }
                targetKey.classList.add('active');
                activeTouches.set(pointerId, noteIndex);
                lastSwipedNoteIndex = noteIndex;
                // console.log(`Note On (Swipe Move Enter): ${targetKey.dataset.note}, Pointer ID: ${pointerId}`);

                if (enableTransmissionCheckbox.checked === true) {
                    //console.log("Sending: " + keyId.toString());
                    playNetworkCmd(noteIndex);
                } else {
                    playKey(noteIndex, false, false);
                }

                // TODO: Send MIDI note (Network if client and local if host)
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
    if (targetKey) {
        event.preventDefault();
        onKeyDown(event);
        isMouseDown = true;
        pianoContainer.setPointerCapture(event.pointerId);
    }
    // console.log("pointerdown - isMouseDown:", isMouseDown, "isSwiping:", isSwiping);
});

document.addEventListener('pointerup', onMouseUp);

function toggleFullscreen() {
    menu_a = document.getElementById('topMenuSection');                        
    menu_b = document.getElementById('subNav');    
    pianoScaleSlider = document.getElementById('pianoScaleSliderElement'); 
    
    if (fullscreenMode) {
        fullscreenMode = false;
        menu_a.style.display = 'block';
        menu_b.style.display = 'block';
        pianoScaleSlider.display = 'block';
        pianoScaleSlider.style = 'display: block !important;'
    } else {
        fullscreenMode = true;
        menu_a.style.display = 'none';
        menu_b.style.display = 'none';
        pianoScaleSlider.display = 'none';
        pianoScaleSlider.style = 'display: none !important;'
    }
}

// fullscreenButton.addEventListener('click', () => {
//     toggleFullscreen();
// });

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
// setTimeout(() => scrollToNote('C6'), 200);



// TODO: Standard fullscreen:
// if (!document.fullscreenElement) {
//     pianoViewport.requestFullscreen().catch(err => {
//         console.error(`Error attempting to enable full-screen mode: ${err.message}`);
//     });
// } else {
//     document.exitFullscreen();
// }