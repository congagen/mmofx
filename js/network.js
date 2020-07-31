var networkHostChannelNameBox = document.getElementById("networkHostChannelNameBox");
var networkHostChannelStartButton = document.getElementById("networkHostChannelStartButton");

var networkClientChannelNameBox = document.getElementById("networkClientChannelNameBox");
var networkClientChannelConnectButton = document.getElementById("networkClientChannelConnectButton");

var networkServerBox = document.getElementById("networkServerBox");
var networkServerConnectButton = document.getElementById("networkServerConnectButton");

var currentChannelName = "";

const sendBtn = document.querySelector('#send');
const messages = document.querySelector('#messages');
const messageBox = document.querySelector('#messageBox');

let firebaseConfig = {

};

function initFb() {
    firebase.initializeApp(firebaseConfig);
    firebase.analytics();

    firebase.auth().signInAnonymously().catch(function(error) {
        var errorCode = error.code;
        var errorMessage = error.message;

        if (errorCode === 'auth/operation-not-allowed') {
            alert('You must enable Anonymous auth in the Firebase Console.');
        } else {
            console.error(error);
        }
    });

    const messaging = firebase.messaging();

    messaging.onMessage((payload) => {
      console.log('Message received. ', payload);
    });

    // messaging.setBackgroundMessageHandler(function(payload) {
    //   console.log('[firebase-messaging-sw.js] Received background message ', payload);
    //   // Customize notification here
    //   const notificationTitle = 'Background Message Title';
    //   const notificationOptions = {
    //     body: 'Background Message body.',
    //     icon: '/firebase-logo.png'
    //   };
    //
    //   return self.registration.showNotification(notificationTitle,
    //     notificationOptions);
    // });
}


initFb();
