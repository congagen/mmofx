const sendBtn = document.querySelector('#send');
const messages = document.querySelector('#messages');
const messageBox = document.querySelector('#messageBox');

var prevChannelName = "";

const maxRetryCount = 50; // Adjust as needed
const initialDelay = 1000; // Initial delay in milliseconds
const backoffFactor = 2;   // Factor to increase delay by
var showNetworkAlerts = true;
var retryCount = 0;

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

currentUserId = uuidv4();
currentSessionToken = uuidv4();
currentSessionId = uuidv4();

let firebaseConfig = {
    apiKey: "AIzaSyDx3-4RSc8fpkQcL2O_DsDSZ29qJ_JoRx8",
    authDomain: "xtation-2.firebaseapp.com",
    databaseURL: "https://xtation-2.firebaseio.com",
    projectId: "xtation-2",
    storageBucket: "xtation-2.appspot.com",
    messagingSenderId: "450882156281",
    appId: "1:450882156281:web:fbf4488538e97fb7181428",
    measurementId: "G-2Y4RXY6X3N"
};

firebase.initializeApp(firebaseConfig);
var database = firebase.database();
var connectedRef = firebase.database().ref(".info/connected");

connectedRef.on("value", function(snap) {
    if (snap.val() === false) {
        console.log('Connection lost!');
        attemptReconnect(retryCount);
    }
});

function attemptReconnect(retryCount = 0) {
    if (retryCount >= maxRetryCount) {
      console.error('Max retry count exceeded. Unable to reconnect.');
      currentChannelDisplay.innerHTML = `Connection refused. If you're using a VPN, try disabling it. Otherwise, please check your internet connection`;
      return;
    } else {
        retryCount += 1;
    }
  
    const delay = initialDelay * Math.pow(backoffFactor, retryCount);
    console.log(`Attempting to reconnect in ${delay}...`);
    currentChannelDisplay.innerHTML = `Connection refused, attempting to reconnect in ${delay / 1000} s...`;
  
    setTimeout(() => {
      firebase.database().ref(".info/connected").once("value", function(snap) {
        if (snap.val() === true) {
            console.log('Connected!');
            currentChannelDisplay.innerHTML = "Current Channel: " + currentChannelName;
            showNetworkAlerts = true;
        } else {
            if ((showNetworkAlerts === true) && (retryCount > 2)) {
                alert("Network Error: Connection to the server has been interrupted.  If you're using a VPN, try disabling it temporarily.  Otherwise, please check your internet connection and visit the Connection section in the Config tab to check status and reconnect.");        
                showNetworkAlerts = false;
            }
            attemptReconnect(retryCount);
        }
      });
    }, delay);
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
        alert('You must enable Anonymous auth in the Firebase //console.');
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
    retryCount = 0;

    if (prevChannelName != "") {
        var prevDb = firebase.database().ref(prevChannelName);
        prevDb.off();
    }

    var newDbChannel = firebase.database().ref(dbChannelName);
    currentChannelDisplay.innerHTML = "Current Channel: " + dbChannelName;

    newDbChannel.on('child_changed', function (data) {
        if (receiveCommandsCheckbox.checked === true) {
            playKey(data.val(), true, false);
        }
    });

    prevChannelName = dbChannelName;    
}


subscribeToDb(currentChannelName);
prevChannelName = currentChannelName;


