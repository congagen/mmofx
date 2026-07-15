const sendBtn = document.querySelector('#send');
const messages = document.querySelector('#messages');
const messageBox = document.querySelector('#messageBox');

var prevChannelName = "";

const maxRetryCount = 50;
var showNetworkAlerts = true;
var retryCount = 0;
const backoffFactor = 2;
const initialDelay = 10000;
var retryDelay = 1000;

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

currentUserId = uuidv4();
currentSessionToken = uuidv4();
currentSessionId = uuidv4();

// A shared link can carry the host's custom backend (the `fb` param, set by the
// share buttons) so guests reach the same Firebase — localStorage doesn't travel
// with the link. We unpack the three fields MMOFX needs and derive authDomain
// from projectId. Used for this session only (not persisted), so a guest's device
// isn't left pointed at someone else's backend after they leave.
function backendFromShareUrl() {
    try {
        const fb = new URLSearchParams(location.search).get('fb');
        if (!fb) return null;
        let b64 = fb.replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4) b64 += '=';                 // restore padding for atob
        const parts = atob(b64).split("|");
        if (parts.length < 3 || !parts[0] || !parts[2]) return null;
        return {
            apiKey: parts[0],
            projectId: parts[1],
            databaseURL: parts[2],
            authDomain: parts[1] + ".firebaseapp.com"
        };
    } catch (e) {
        return null;
    }
}

// Backend config resolution, highest priority first:
//   1. A shared link's `fb` param (guests joining a custom-backend host).
//   2. A backend saved in-app (Connection → Server), stored in localStorage.
//   3. firebase-config.js (window.MMOFX_FIREBASE_CONFIG), the deployment default.
//   4. The bundled fallback below, in case that file is missing.
// Firebase can only initializeApp once per load, so the in-app form saves here
// and reloads rather than swapping live.
let firebaseConfig = backendFromShareUrl();
try {
    if (!firebaseConfig) {
        const savedFirebaseConfig = localStorage.getItem('mmofx_firebase_config');
        if (savedFirebaseConfig) firebaseConfig = JSON.parse(savedFirebaseConfig);
    }
} catch (e) {
    console.warn('Ignoring invalid saved Firebase config:', e);
    firebaseConfig = null;
}
if (!firebaseConfig) {
    firebaseConfig = window.MMOFX_FIREBASE_CONFIG || {
        apiKey: "AIzaSyDx3-4RSc8fpkQcL2O_DsDSZ29qJ_JoRx8",
        authDomain: "xtation-2.firebaseapp.com",
        databaseURL: "https://xtation-2.firebaseio.com",
        projectId: "xtation-2",
        storageBucket: "xtation-2.appspot.com",
        messagingSenderId: "450882156281",
        appId: "1:450882156281:web:fbf4488538e97fb7181428",
        measurementId: "G-2Y4RXY6X3N"
    };
}

firebase.initializeApp(firebaseConfig);
var database = firebase.database();
var connectedRef = firebase.database().ref(".info/connected");

function setConnectionStatus(status) {
    document.querySelectorAll('.connection-dot').forEach(function (dot) {
        dot.classList.remove('connected', 'disconnected');
        dot.classList.add(status);
    });
}

// Top status bar: shown only when there's a problem, visible to everyone.
function showConnectionBar(message, isError) {
    const bar = document.getElementById('connectionBar');
    if (!bar) return;
    bar.textContent = message;
    bar.classList.toggle('connection-bar--error', !!isError);
    bar.classList.add('show');
}

function hideConnectionBar() {
    const bar = document.getElementById('connectionBar');
    if (bar) bar.classList.remove('show');
}

// Grace period before the bar surfaces a dropout. iOS Safari throttles/suspends
// background connections, so `.info/connected` flips false/true constantly and
// Firebase auto-reconnects within a second or two. Only show the bar if the
// connection stays down past this window, so those transient blips never flash.
var CONNECTION_BAR_GRACE_MS = 2500;
var connectionBarTimer = null;

// `.info/connected` always fires false first on boot — the socket isn't up yet
// — which is NOT a dropout. Until the first successful connect we treat that as
// an ongoing handshake: a longer, calmer "Connecting..." grace and no reconnect
// loop, so a slow mobile/auth handshake never masquerades as "Connection lost".
var hasConnectedOnce = false;
var INITIAL_CONNECT_GRACE_MS = 6000;

connectedRef.on("value", function(snap) {
    if (snap.val() === false) {
        setConnectionStatus('disconnected');

        if (!hasConnectedOnce) {
            // Initial handshake still in progress — don't alarm, don't retry.
            console.log('Connecting...');
            if (connectionBarTimer === null) {
                connectionBarTimer = setTimeout(function () {
                    connectionBarTimer = null;
                    showConnectionBar('Connecting...', false);
                }, INITIAL_CONNECT_GRACE_MS);
            }
            return;
        }

        console.log('Connection lost!');
        if (connectionBarTimer === null) {
            connectionBarTimer = setTimeout(function () {
                connectionBarTimer = null;
                showConnectionBar('Connection lost. Reconnecting...', false);
            }, CONNECTION_BAR_GRACE_MS);
        }
        attemptReconnect(retryCount);
    } else {
        hasConnectedOnce = true;
        setConnectionStatus('connected');
        if (connectionBarTimer !== null) {
            clearTimeout(connectionBarTimer);
            connectionBarTimer = null;
        }
        hideConnectionBar();
    }
});

function attemptReconnect(retryCount = 0) {
    if (retryCount >= maxRetryCount) {
      console.error('Max retry count exceeded. Unable to reconnect.');
      currentChannelDisplay.innerHTML = `Connection refused. If you're using a VPN, try disabling it. Otherwise, please check your internet connection`;
      showConnectionBar('Offline. Check your connection or disable any VPN.', true);
      return;
    } else {
        retryCount += 1;
    }

    if (retryDelay < 60000){
        retryDelay = parseInt(initialDelay * retryCount);        
    }

    console.log(`Attempting to reconnect in ${retryDelay}...`);
    currentChannelDisplay.innerHTML = `Connection refused, attempting to reconnect in ${retryDelay / 1000} s...`;

    setTimeout(() => {
      firebase.database().ref(".info/connected").once("value", function(snap) {
        if (snap.val() === true) {
            console.log('Connected!');
            setConnectionStatus('connected');
            if (connectionBarTimer !== null) {
                clearTimeout(connectionBarTimer);
                connectionBarTimer = null;
            }
            hideConnectionBar();
            currentChannelDisplay.innerHTML = "Current Channel: " + currentChannelName;
            showNetworkAlerts = true;
            retryCount = 0;
        } else {
            if ((showNetworkAlerts === true) && (retryCount > 1)) {
                showCustomAlert("Connection Error: The connection to the server was interrupted. If you are using a VPN, try turning it off temporarily. Otherwise, please check your internet connection and go to the 'Connection' section in the 'Config' tab to see the status and try reconnecting.");        
                showNetworkAlerts = false;
            }
            attemptReconnect(retryCount);
        }
      });
    }, retryDelay);
}

function setTokenSentToServer(sent) {
    window.localStorage.setItem('sentToServer', sent ? '1' : '0');
}

function isTokenSentToServer() {
    return window.localStorage.getItem('sentToServer') === '1';
}

firebase.auth().signInAnonymously().catch(function(error) {
    var errorCode = error.code;
    var errorMessage = error.message;

    if (errorCode === 'auth/operation-not-allowed') {
        console.log('You must enable Anonymous auth in the Firebase //console.');
    } else {
        //console.error(error);
    }
});

async function callRestApi(url, data) {
   try {
        const userAction = async() => {
            const response = await fetch(url, {
                method: 'POST',
                body: {data},
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const responseJson = await response.json();
            //console.log(responseJson);
            return responseJson;
        }
    } catch (e) {
        console.error(e);
    } finally {
        //console.log("");
    }
}

function writeToDB(db_name, data_dct) {
    //console.log("Writing");
    return firebase.database().ref(db_name).set(data_dct);
}

// TODO:
function itemInDb(db_name, item_name, item_value) {
    firebase.database().ref(db_name).orderByChild(item_name).equalTo(item_value).once("value", snapshot => {
        if (snapshot.exists()){
            return true;
        } else {
            return false;
        }
    });
}

function sendTokenToServer(currentToken) {
    currentFbToken = currentToken;

    if (!isTokenSentToServer()) {
        setTokenSentToServer(true);
    } else {
        console.log('Token already sent to server');
    }
}

function subscribeToDb(dbChannelName) {
    if (prevChannelName != "") {
        var prevDb = firebase.database().ref(prevChannelName);
        prevDb.off();
    }

    var newDbChannel = firebase.database().ref(dbChannelName);
    currentChannelDisplay.innerHTML = "Current Channel: " + dbChannelName;
    // Mirror into the dashboard navbar. Guarded: this runs once at load before
    // ui.js defines the helper, and is re-called on every channel change after.
    if (typeof updateDashChannel === "function") updateDashChannel(dbChannelName);

    newDbChannel.on('child_changed', function (data) {
        if (data.key !== "playedKey") return;
        if (receiveCommandsCheckbox.checked === true) {
            var val = data.val();
            // New form is { k, n, r, h }; tolerate the old plain-string form.
            var isObj = (val && typeof val === "object");
            var key = isObj ? val.k : val;
            var rmtRandom = isObj ? !!val.r : false;
            var rmtHold = isObj ? !!val.h : false;

            // Randomize if either the host or the sender wants it.
            var doRandom = rmtRandom || (randomizePlaybackCheckbox && randomizePlaybackCheckbox.checked);

            // Hold for networked piano: there's no note-off over the network, so
            // we never loop indefinitely. Instead, when Hold is on we let the
            // note ring out over the host's Fade Duration (loop + auto-fade).
            // With Fade at 0 it falls back to a plain one-shot that plays to its
            // natural end. Pads ignore these args. Sample Polyphony stays global.
            var doHold = false, releaseSec = 0;
            if (rmtHold || (holdPitchedCheckbox && holdPitchedCheckbox.checked)) {
                releaseSec = parseFloat(pianoReleaseSlider && pianoReleaseSlider.value) || 0;
                doHold = releaseSec > 0;
            }

            // Feed the dashboard overview's activity KPI (commands last minute).
            (window.dashActivityTimes = window.dashActivityTimes || []).push(Date.now());

            // And the Activity panel's live feed (newest first, capped).
            var feed = document.getElementById("activityFeed");
            if (feed) {
                var li = document.createElement("li");
                li.textContent = new Date().toTimeString().slice(0, 8) + " · " + key;
                feed.insertBefore(li, feed.firstChild);
                while (feed.children.length > 30) feed.removeChild(feed.lastChild);
            }

            playKey(key, true, doRandom, doHold, releaseSec);
        }
    });

    prevChannelName = dbChannelName;    
}


subscribeToDb(currentChannelName);
prevChannelName = currentChannelName;


