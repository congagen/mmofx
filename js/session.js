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
        currentChannelName = url_vars["channel"].replaceAll(" ", "_").replaceAll("%", "_");
        channelNameInputBox.value = currentChannelName.replaceAll(" ", "_").replaceAll("%", "_");
    }

    if ("mode" in url_vars) {
        console.log(url_vars["mode"]);

        if (url_vars["mode"] === "client") {
            document.getElementById("receiveCommandsCheckbox").checked = false;
            document.getElementById("enableTransmissionCheckbox").checked = true;
            document.getElementById("enableMidiOutCheckbox").checked = false;

            let topLogo = document.getElementById("topLogo");
            topLogo.style = "display: none !important";

            let nav_a = document.getElementById("topNav");
            nav_a.style = "display: none !important";    

            let guestInstruct = document.getElementById("guestInstruct");
            guestInstruct.style = "display: block !important";

            let guestInstructText = document.getElementById("guestInstructText");      
            guestInstructText.innerHTML = currentChannelName;            
            guestInstructText.classList.add("d-flex", "justify-content-center", "ps-4", "pe-4");

            let nav_b = document.getElementById("subNav");
            nav_b.style = "display: none !important";
        }

        if (url_vars["mode"] === "host") {
            document.getElementById("receiveCommandsCheckbox").checked = true;
            document.getElementById("enableTransmissionCheckbox").checked = false;
        }
    }
}