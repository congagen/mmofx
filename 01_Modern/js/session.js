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

    // Classic layout: ?layout=classic keeps the original mobile-first UI at
    // any screen size. Reuses the guest-panel class purely for its "no
    // dashboard" gating (all dashboard CSS/JS is keyed off body:not(.guest-panel));
    // the full app chrome (tabs, config, studio) still works normally.
    if (url_vars["layout"] === "classic") {
        document.body.classList.add("guest-panel");
    }

    if ("mode" in url_vars) {
        console.log(url_vars["mode"]);

        if (url_vars["mode"] === "padClient" || url_vars["mode"] === "pianoClient") {

            // Stripped guest panel: opt this document out of the wide-screen
            // dashboard so it stays a single-surface client even on desktop.
            document.body.classList.add("guest-panel");

            setHostClientMode(true);
            document.getElementById("enableMidiOutCheckbox").checked = false;

            let topLogo = document.getElementById("topLogo");
            topLogo.style = "margin-bottom: 0px !important; margin-top: 25px";            

            let nav_a = document.getElementById("topNav");
            nav_a.style = "display: none !important";

            let pianoNoteOffCheckbox_Client = document.getElementById("pianoNoteOffCheckbox");
            pianoNoteOffCheckbox_Client.style = "display: none !important";    

            let pianoNoteOffCheckboxLabel_Client = document.getElementById("pianoNoteOffCheckboxClentLabel");
            pianoNoteOffCheckboxLabel_Client.style = "display: none !important";    

            if (url_vars["showChannel"] === "1") {
                topLogo.style = "display: none !important; margin-bottom: 0px";

                let guestInstruct = document.getElementById("guestInstruct");
                guestInstruct.style = "display: block !important; margin-bottom: -15px !important; margin-top: 15px !important;";

                let guestInfoText = document.getElementById("guestInfoText");
                guestInfoText.innerHTML = currentChannelName;
                guestInfoText.classList.add("d-flex", "justify-content-center", "ps-4", "pe-4");
            }

            let nav_b = document.getElementById("subNav");
            nav_b.style = "display: none !important";

            if (url_vars["mode"] === "pianoClient") {
                const pianoTabLink = document.getElementById('pianoTabLink');
                const pianoTab = new bootstrap.Tab(pianoTabLink);
                                
                pianoTab.show();
            }

            if (url_vars["mode"] === "padClient") {
                const pianoTabLink = document.getElementById('padTabLink');
                const pianoTab = new bootstrap.Tab(pianoTabLink);
                                
                pianoTab.show();
            }
        }

        if (url_vars["mode"] === "host") {
            setHostClientMode(false);
        }
    }
}