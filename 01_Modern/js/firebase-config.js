// ─────────────────────────────────────────────────────────────────────────────
// Firebase backend configuration
//
// MMOFX uses Firebase Realtime Database (with Anonymous Authentication) to relay
// commands between hosts and clients on a channel.
//
// SELF-HOSTING? Replace the values below with your own Firebase project's web
// config (Firebase console → Project settings → Your apps → SDK setup & config →
// "Config"). Your project also needs:
//   • Realtime Database enabled
//   • Anonymous Authentication turned on
//   • Security rules covering the channel paths
// See the setup guide:
//   https://xusione.com/pages/resources/articles/mmofx-guide.html#config-firebase
//
// These web config values are not secrets — they ship to every browser and are
// gated by your Security Rules — so it's fine to commit your own here.
//
// The default below points at the public demo backend (xtation-2). It's shared
// and offered with no uptime or performance guarantees — bring your own Firebase
// project for a reliable, dedicated backend you control.
// ─────────────────────────────────────────────────────────────────────────────
window.MMOFX_FIREBASE_CONFIG = {
    apiKey: "AIzaSyDx3-4RSc8fpkQcL2O_DsDSZ29qJ_JoRx8",
    authDomain: "xtation-2.firebaseapp.com",
    databaseURL: "https://xtation-2.firebaseio.com",
    projectId: "xtation-2",
    storageBucket: "xtation-2.appspot.com",
    messagingSenderId: "450882156281",
    appId: "1:450882156281:web:fbf4488538e97fb7181428",
    measurementId: "G-2Y4RXY6X3N"
};
