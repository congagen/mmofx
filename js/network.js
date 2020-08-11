

const sendBtn = document.querySelector('#send');
const messages = document.querySelector('#messages');
const messageBox = document.querySelector('#messageBox');

let firebaseConfig = {

};

firebase.initializeApp(firebaseConfig);

firebase.analytics();
var database = firebase.database();
const messaging = firebase.messaging();


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

// messaging.usePublicVapidKey("BPpoyqjt8hWh34uokRVtRkZIqIP0r6sOrMZiwD35jiIWqNre09k2XHdIxLReZZVM2m9H4DVH8EwM5sWvX0eb9hM");

function writeToDB(db_name, data_dct) {
    console.log("Writing");
    return firebase.database().ref(db_name).set(data_dct);
}

function itemInDb(db_name, item_name, item_value) {
    firebase.database().ref(db_name).orderByChild(item_name).equalTo(item_value).once("value", snapshot => {
        if (snapshot.exists()){
//            const userData = snapshot.val();
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

var db_refChannelNoteData = firebase.database().ref(currentChannelName);

db_refChannelNoteData.on('child_changed', function (data) {
    console.log("Data change");
    console.log(data.val());

    if (receiveCommandsCheckbox.checked == true)  {
        playKey(data.val(), true);
    }

});

