var currentSamples = {};
let contentElement = document.getElementById("content");
let testSampleBtn = document.getElementById("debugSample");
let tbl = document.getElementById("tblContainer");


function AddSampleListRow(sampleId) {
    let sItem = currentSamples[sampleId];

    //Build an array containing Customer records.

    //Reference the container Table.
    var tblContainer = $("#tblContainer");

    //Add the Table row.
    var row = tblContainer[0].insertRow(-1);

    //Add the DropDownList to Table Row.
    var cell = row.insertCell(-1);

    var nameField = $("<input id=sNameField" + sampleId + " size='4' type = 'text' value = "+sItem[0]+" readonly>");
    $(cell).append(nameField);

    var trgKeysInput = $("<input id=" + sampleId.toString() + " size='4' type = 'text' value = "+sItem[2].toLowerCase()+"></input>");
    trgKeysInput.change(function () {
        //Determine the reference of the Row using the Button.
        var sId = trgKeysInput.attr('id');
        console.log(currentSamples[sId]);

        let a = document.getElementById(sId.toString());
        currentSamples[sId][2] = a.value;
    });

    var btnPreview = $("<input id=" + sampleId + " type = 'button' value = 'Preview'/>");
    btnPreview.click(function () {
        //Determine the reference of the Row using the Button.
        var row = btnPreview.closest("TR");
        var sId = btnPreview.attr('id');
        playSample(sId);
    });

    var btnRemove = $("<input id=" + sampleId + " type = 'button' value = 'Remove'/>");
    btnRemove.click(function () {
        //Determine the reference of the Row using the Button.
        var row = btnRemove.closest("TR");
        // TODO: Delete ->
        var sId = btnPreview.attr('id');

        delete currentSamples[sId];
        row.remove();
    });

    // row.insertCell(-1);
    $(cell).append(" ");
    $(cell).append("Trg Keys: ");
    $(cell).append(trgKeysInput);
    $(cell).append(" ");

    // cell = row.insertCell(-1);
    $(cell).append(btnPreview);
    // cell = row.insertCell(-1);
    $(cell).append(btnRemove);

};


function playSample(sampleId) {
    let sUrl = currentSamples[sampleId][1];
    console.log("Playing: " + currentSamples[sampleId][0]);
    console.log("TrgKeys: " + currentSamples[sampleId][2]);

    var sample = new Pizzicato.Sound(sUrl, function() {
        sample.play();
    });
}

function getSamplesFromTxt(samKey) {
    var sToPlay = [];
    var curKeys = Object.keys(currentSamples);

    if (curKeys.length > 0) {

        for(var i = 0; i < curKeys.length; i++) {
            let k = curKeys[i];
            let sam = currentSamples[k];
            let sKeys = sam[2].toString();

            if (sKeys.includes(samKey)) {
                let sUrl = sam[1];
                sToPlay.push(sUrl);
            }
        }
    }

    return sToPlay;
}

function initDefSamples(){
    console.log("initDefSamples");

    var f = new File([""], "xus.wav");
    var files = [f];

    for(var i=0; i < files.length; i++) {
        let fName = files[i].name.toString();
        var sKey = URL.createObjectURL(files[i]).toString();
        let sUrl = URL.createObjectURL(files[i]);
        let trgKeys = fName[0].toLowerCase();

        currentSamples[sKey] = [fName, sUrl, fName[0].toLowerCase()];
        AddSampleListRow(sKey);
    }

}


function clearSamplesList() {
    $("#tblContainer tr").remove();
}


async function onButtonClicked(){
    let files = await selectFile("audio/*", true);
    console.log(files);
    console.log(URL.createObjectURL(files[0]));

    for(var i=0; i < files.length; i++) {
        let fName = files[i].name.toString();
        var sKey = URL.createObjectURL(files[i]).toString();
        let sUrl = URL.createObjectURL(files[i]);
        let trgKeys = fName[0].toLowerCase();

        currentSamples[sKey] = [fName, sUrl, fName[0].toLowerCase()];
        AddSampleListRow(sKey);
    }

}

// ---- function definition ----
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

// initDefSamples();
