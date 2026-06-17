var naiveReverse = function(string) {
    return string.split('').reverse().join('');
}

function shuffleString(str) {
    const arr = str.split(''); // Convert string to array
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1)); // Pick random index
        [arr[i], arr[j]] = [arr[j], arr[i]]; // Swap elements
    }
    return arr.join(''); // Convert back to string
}

function randomizeSequencer() {
    var curSeqChars = document.getElementById("maxlerZone").value;
    curSeqChars = shuffleString(curSeqChars);
    document.getElementById("maxlerZone").value = curSeqChars;
}

function reverseSeq() {
    var curSeqChars = document.getElementById("maxlerZone").value;
    curSeqChars = naiveReverse(curSeqChars);
    document.getElementById("maxlerZone").value = curSeqChars;
}

function nthFib(n) {
    if(n <= 2) return n -1;
    return nthFib(n - 2) + nthFib(n - 1);
}

//originalSeq

function resetOrigSeq() {
    document.getElementById("maxlerZone").value = originalSeq;
}

function setOrigSeq() {
    //console.log("Orig");
    originalSeq = document.getElementById("maxlerZone").value;
}

function sampleTrigsToSeq() {
    var curKeys = Object.keys(currentSamples);
    document.getElementById("maxlerZone").value = "";

    var newZone = "";

    for (var i=0, max=Object.keys(currentSamples).length; i < max; i++) {
        let sKey = Object.keys(currentSamples)[i];
        let sObj = currentSamples[sKey];

        document.getElementById("maxlerZone").value += sObj[2];
        newZone += sObj[2];
    }
}


function setSeqRateSlider() {
    document.getElementById("seqRateTextField").value = parseFloat(document.getElementById("seqRateSlider").value);
    applySeqRate();
}


function setSeqRateText() {
    document.getElementById("seqRateSlider").value = parseFloat(document.getElementById("seqRateTextField").value);
    applySeqRate();
}

// Updates the live readout next to the Alternate (maxlerMulti) slider.
function updateMultiLabel() {
    var v = parseFloat(document.getElementById("maxlerMulti").value);
    document.getElementById("maxlerMultiValue").textContent = v.toFixed(1);
}

// +/- steppers for the Alternate slider: nudge by delta, clamp to the slider's
// range, and keep 0.1 precision (avoids floating-point drift).
function stepMulti(delta) {
    var el = document.getElementById("maxlerMulti");
    var min = parseFloat(el.min);
    var max = parseFloat(el.max);
    var v = parseFloat(el.value) + delta;
    v = Math.min(max, Math.max(min, v));
    el.value = Math.round(v * 10) / 10;
    updateMultiLabel();
}

// Step interval in ms for the current BPM. Each step is an 8th note, so
// 120 BPM => 250 ms/step. Guards against zero/blank input.
function seqStepInterval() {
    var bpm = parseFloat(document.getElementById("seqRateSlider").value);
    if (!bpm || bpm < 1) bpm = 1;
    return 30000 / bpm;
}

// Schedules the next step at the current BPM and records when this step began,
// so a mid-step BPM change can be re-applied immediately.
function scheduleNextStep() {
    seqStepStart = performance.now();
    clearTimeout(seqTimeout);
    seqTimeout = setTimeout(iterateSeq, seqStepInterval());
}

// Re-applies the BPM mid-playback: reschedules the pending step for the new
// interval minus the time already elapsed in the current step, so tempo
// changes take effect right away instead of on the next step.
function applySeqRate() {
    if (!playSeq) return;
    var remaining = seqStepInterval() - (performance.now() - seqStepStart);
    if (remaining < 0) remaining = 0;
    clearTimeout(seqTimeout);
    seqTimeout = setTimeout(iterateSeq, remaining);
}


function iterateSeq() {
    var curSeqChars = document.getElementById("maxlerZone").value;

    // The sequence can be edited mid-play. Clamp the index if it was shortened,
    // and if there's no character to play (e.g. the field was cleared) skip this
    // step but keep the clock running, so playback resumes when keys return.
    if (seqIndex >= curSeqChars.length) {
        seqIndex = 0;
    }

    let seqChar = curSeqChars.split('')[seqIndex];

    if (seqChar === undefined) {
        document.getElementById("curSeqCharH").innerHTML = "?";
        if (playSeq) {
            scheduleNextStep();
        }
        seqIndexMaster += 1;
        return;
    }

    // Display current char
    document.getElementById("curSeqCharH").innerHTML = seqChar;

    if (enableTransmissionCheckbox.checked == true) {
        ////console.log("Sending: " + seqChar.toString());
        playNetworkCmd(seqChar);
    } else {
        ////console.log("Playing: " + seqChar.toString());
        playKey(seqChar, false, false);
    }

    ////console.log(parseInt(document.getElementById("maxlerZone").value));

    if (!document.getElementById("stallSeq").checked) {

        if (seqIndex > curSeqChars.length-2) {
            seqIndex = 0;
        } else {
            seqIndex += 1;
        }

        if (document.getElementById("fibonaSequ").checked) {
            // seqIndexMaster
            ////console.log(seqIndexMaster);
            ////console.log(nthFib(seqIndexMaster));

            if (fibonaIndex > parseInt(document.getElementById("fiboPatterLength").value)) {                
                fibonaIndex = 0;
                console.log("Reset FIBO INDEX!");
                console.log(parseInt(document.getElementById("fiboPatterLength").value));
                console.log(fibonaIndex);
            }
            
            fibonaIndex += 1;

            if (fibonaIndex > fiboSeq.length - 1) {
                fibonaIndex = 0;
            }

            var maxlerMulti = document.getElementById("maxlerMulti").value; //maxlerMulti
            //console.log(maxlerMulti);

            var findex = parseInt(Math.abs(Math.sin((fiboSeq[fibonaIndex] * 0.314) * maxlerMulti) * (curSeqChars.length)));
            //console.log("fibonaSequ");
            //console.log(findex);
            seqIndex = findex;
        }

        if (document.getElementById("randomizeTrgs").checked){
            seqIndex = Math.floor(Math.random() * curSeqChars.length);
            //console.log(seqIndex);
            //console.log("randomizeTrgs");
        }
    } else {

    }

    if (playSeq) {
        scheduleNextStep();
    }

    seqIndexMaster += 1;
}


function togglePlaySeq(){
    playSeq = !playSeq;

    if (playSeq) {
        seqStepStart = performance.now();
        clearTimeout(seqTimeout);
        seqTimeout = setTimeout(iterateSeq, 500);
        document.getElementById("playSeq").innerHTML = "Stop";
    } else {
        clearTimeout(seqTimeout);
        seqIndex = 0;
        document.getElementById("playSeq").innerHTML = "Start";
        fibonaIndex = 0;
    }
}