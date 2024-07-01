var isInitUI = false;
var isInitAudio = false;
var audioCtx;

var currentChannelName = "Lobby";
var currentUserId = "";
var currentSessionId = "";
var currentFbToken = "";

var originalSeq = "";

var playSeq = false;
var seqChars = [];
var seqIndexMaster = 0;
var seqIndex = 0;

var fibonaIndex = 0;
var fiboSeq = [];
let fibonacci = [0,1];

let charlist = ["0","1","2","3","4","5","6","7","8","9","q","w","e","r","t","y","u","i","o","p","a","s","d","f","g","h","j","k","l","z","x",
    "c","v","b","n","m",",",".","-","!","#","€","%","/","(",")","0","`","^","*","'","¨",">","<","°","§","©","@","£","$",
    "∞","§","|","[","]","≈","±","~","™","•","Ω","é","®","†","µ","ü","ı","œ","π","˙","","ß","∂","ƒ","¸","˛","√","ª","ø",
    "÷","≈","ç","‹","›","‘","◊","…","–","1","2","3","4","5","6","7","8","9","q","w","e","r","t","y","u","i","o","p","a","s","d","f","g","h","j","k","l","z","x",
    "c","v","b","n","m",",",".","-","!","#","€","%","/","(",")","0","`","^","*","'","¨",">","<","°","§","©","@","£","$",
    "∞","§","|","[","]","≈","±","~","™","•","Ω","é","®","†","µ","ü","ı","œ","π","˙","","ß","∂","ƒ","¸","˛","√","ª","ø",
    "÷","≈","ç","‹","›","‘","◊","…","-"]

function listFibonacci(num) {
    for (let i = 1; i < num; i++) {
        fibonacci.push(fibonacci[i] + fibonacci[i - 1]);
    }
}

listFibonacci(300);

fiboSeq = fibonacci.join('').replace(/[^\d]/g, '').split('');
console.log(fiboSeq);

function getUrlVars() {
    var vars = {};

    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });

    return vars;
}

let url_vars = getUrlVars();

if (Object.keys(url_vars).length > 0) {
    console.log(url_vars);
    console.log(Object.keys(url_vars));
    console.log(url_vars["channel"]);

    if ("channel" in url_vars) {
        console.log(url_vars["channel"]);
        currentChannelName = url_vars["channel"];
        channelNameInputBox.value = currentChannelName;
    }

    if ("mode" in url_vars) {
        console.log(url_vars["mode"]);

        if (url_vars["mode"] == "client") {
            document.getElementById("receiveCommandsCheckbox").checked = false;
            document.getElementById("enableTransmissionCheckbox").checked = true;
        }

        if (url_vars["mode"] == "host") {
            document.getElementById("receiveCommandsCheckbox").checked = true;
            document.getElementById("enableTransmissionCheckbox").checked = false;
        }
    }

}