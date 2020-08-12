const sendBtn = document.querySelector('#send');
const messages = document.querySelector('#messages');
const messageBox = document.querySelector('#messageBox');

var prevChannelName = "";

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

//firebase.analytics();
//const messaging = firebase.messaging();

var database = firebase.database();


function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

currentUserId = uuidv4();
currentSessionToken = uuidv4();
currentSessionId = uuidv4();

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
        alert('You must enable Anonymous auth in the Firebase Console.');
    } else {
        console.error(error);
    }
});


function writeToDB(db_name, data_dct) {
    console.log("Writing");
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
        console.log('Sending token to server...');
        // TODO(developer): Send the current token to your server.
        setTokenSentToServer(true);
    } else {
        console.log('Token already sent to server so won\'t send it again ' + 'unless it changes');
    }
}


function subscribeToDb(dbChannelName) {
    if (prevChannelName != "") {
        console.log("Unsubscribing: " + prevChannelName);
        var prevDb = firebase.database().ref(prevChannelName);
        prevDb.off();
    }

    console.log("Connecting to DB: " + dbChannelName);
    var newDbChannel = firebase.database().ref(dbChannelName);

    newDbChannel.on('child_changed', function (data) {
        console.log("Data change");
        console.log(data.val());

        if (receiveCommandsCheckbox.checked == true) {
            playKey(data.val(), true);
        }
    });

    prevChannelName = dbChannelName;
}


subscribeToDb(currentChannelName);
prevChannelName = currentChannelName;