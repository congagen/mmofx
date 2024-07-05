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
}


function setSeqRateText() {
    document.getElementById("seqRateSlider").value = parseFloat(document.getElementById("seqRateTextField").value);
}


function iterateSeq() {
    var curSeqChars = document.getElementById("maxlerZone").value;

    let seqChar = curSeqChars.split('')[seqIndex];

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
        setTimeout(iterateSeq, 1000 - parseFloat(document.getElementById("seqRateSlider").value));
    }

    seqIndexMaster += 1;
}


function togglePlaySeq(){
    playSeq = !playSeq;

    if (playSeq) {
        setTimeout(iterateSeq, 500);
        document.getElementById("playSeq").innerHTML = "Stop";
    } else {
        // Cancel timer
        seqIndex = 0;
        document.getElementById("playSeq").innerHTML = "Start";
        fibonaIndex = 0;
    }
}