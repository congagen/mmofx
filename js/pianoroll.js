const numberOfKeys = 127;
const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const pianoViewport = document.getElementById('pianoViewport');
const pianoContainer = document.getElementById('pianoContainer');
const keyHeightSlider = document.getElementById('keyHeight'); // Reference to the height slider

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
                playNetworkCmd(noteIndex);
            } else {             
                playKey(noteIndex);
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
    isSwiping = false;
    const activeKeys = document.querySelectorAll('.key.active');
    activeKeys.forEach(key => {
        key.classList.remove('active');
    });
    activeTouches.clear();
    lastSwipedNoteIndex = null;
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
                if (lastKeyIndex !== undefined) {
                    const lastKey = document.querySelector(`.key[data-index="${lastKeyIndex}"]`);
                    if (lastKey) {
                        lastKey.classList.remove('active');
                    }
                }
                targetKey.classList.add('active');
                activeTouches.set(pointerId, noteIndex);
                lastSwipedNoteIndex = noteIndex;

                console.log("pointermove");
                
                if (enableTransmissionCheckbox.checked === true) {
                    playNetworkCmd(noteIndex);
                } else {             
                    playKey(noteIndex);
                }

            }
        } else {
            const noteIndex = 64;
            const pointerId = event.pointerId;
    
            if (!activeTouches.has(pointerId) || activeTouches.get(pointerId) !== noteIndex) {
                const lastKeyIndex = activeTouches.get(pointerId);
                if (lastKeyIndex !== undefined) {
                    const lastKey = document.querySelector(`.key[data-index="${lastKeyIndex}"]`);
                    if (lastKey) {
                        lastKey.classList.remove('active');
                    }
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