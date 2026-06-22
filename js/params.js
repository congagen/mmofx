var isInitUI = false;
var isInitAudio = false;
var audioCtx;

var currentChannelName = "Lobby";
var currentUserId = "";
var currentSessionId = "";
var currentFbToken = "";

// Per-press nonce. Each transmitted command carries an incrementing nonce so the
// playedKey value changes on every press (even repeats of the same key). That
// makes the host's child_changed fire once per press and removes the need for
// the old key-then-clear double write, which Firebase could coalesce and drop.
var netCmdNonce = 0;

// --- Host settings persistence (localStorage) ---
const HOST_SETTINGS_KEY = 'mmofx_host_settings';

// Restore a host's last-used channel BEFORE the initial DB subscribe in
// network.js, so the saved channel is the one actually connected on boot.
// Skipped for shared-link guests and when the URL pins a channel, so those
// always take precedence.
(function restoreHostChannel() {
    var href = window.location.href;
    var isGuest = /[?&]mode=(padClient|pianoClient)\b/.test(href);
    var hasUrlChannel = /[?&]channel=/.test(href);
    if (isGuest || hasUrlChannel) return;
    try {
        var saved = JSON.parse(localStorage.getItem(HOST_SETTINGS_KEY) || '{}');
        if (saved && saved.channelName) {
            currentChannelName = saved.channelName;
            if (typeof channelNameInputBox !== 'undefined' && channelNameInputBox) {
                channelNameInputBox.value = currentChannelName;
            }
        }
    } catch (e) {
        console.warn('Could not restore host channel:', e);
    }
})();

var originalSeq = "";

var playSeq = false;
var seqChars = [];
var seqIndexMaster = 0;
var seqIndex = 0;
var seqTimeout = null;   // handle for the pending step, so it can be rescheduled
var seqStepStart = 0;    // performance.now() when the current step began

var fibonaIndex = 0;
var fiboSeq = [];
let fibonacci = [0,1];

let charlist = ["0","1","2","3","4","5","6","7","8","9","q","w","e","r","t","y","u","i","o","p","a","s","d","f","g","h","j","k","l","z","x",
    "c","v","b","n","m",",",".","-","!","#","€","%","/","(",")","0","`","^","*","'","¨",">","<","°","§","©","@","£","$",
    "∞","§","|","[","]","≈","±","~","™","•","Ω","é","®","†","µ","ü","ı","œ","π","˙","","ß","∂","ƒ","¸","˛","√","ª","ø",
    "÷","≈","ç","‹","›","‘","◊","…","–","1","2","3","4","5","6","7","8","9","q","w","e","r","t","y","u","i","o","p","a","s","d","f","g","h","j","k","l","z","x",
    "c","v","b","n","m",",",".","-","!","#","€","%","/","(",")","0","`","^","*","'","¨",">","<","°","§","©","@","£","$",
    "∞","§","|","[","]","≈","±","~","™","•","Ω","é","®","†","µ","ü","ı","œ","π","˙","","ß","∂","ƒ","¸","˛","√","ª","ø",
    "÷","≈","ç","‹","›","‘","◊","…","-",
    ";",":","=","+","_","{","}","&",
    // Arrows
    "←","↑","→","↓","↔","↕","↖","↗","↘","↙","↺","↻","⇐","⇒","⇑","⇓",
    // Math
    "∑","∏","∫","∇","∆","≠","≤","≥","∝","∈","∉","∩","∪","⊂","⊃","∀","∃","∅","∧","∨","¬","≡",
    // Greek (lowercase)
    "α","β","γ","δ","ε","ζ","η","θ","κ","λ","ν","ξ","ρ","σ","τ","υ","φ","χ","ψ","ω",
    // Geometric shapes
    "■","□","▲","△","▼","▽","◆","◇","◈","○","●","◐","◑","◒","◓","★","☆","◢","◣","◤","◥","▮","▯","◍",
    // Misc symbols
    "☀","☁","☂","☃","☉","☮","☯","♠","♣","♥","♦","♤","♧","♡","♢","♪","♫","♬","♭","♮","♯","☢","☣","☠","✓","✗","✚","❄",
    // Stars & flowers
    "✦","✧","✩","✪","✫","✬","✭","✮","✯","✰","❀","❁","❂","❉","❊","❋",
    // Circled numbers
    "①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩","⑪","⑫",
    // Currency
    "¥","¢","₩","₪","₫","₭","₮","₹","₽","฿","₴","₦",
    // Box drawing
    "─","│","┌","┐","└","┘","├","┤","┬","┴","┼","═","║","╔","╝","╬",
    // More arrows
    "↜","↝","↞","↟","↠","↡","↢","↣","↤","↥","↦","↧","↨","⇄","⇅","⇆","⇇","⇈","⇉","⇊","⇋","⇌","⇎",
    // More math
    "⊕","⊖","⊗","⊘","⊙","⊚","⊛","∴","∵","≅","≜","≝","⊢","⊣","⊤","⊥","∠","∡","∢","∟",
    // Block elements
    "▀","▁","▂","▃","▄","▅","▆","▇","█","▉","▊","▋","▌","▍","▎","▏","▐","░","▒","▓","▔","▕","▖","▗","▘","▙","▚","▛","▜","▝","▞","▟",
    // More geometric shapes
    "◰","◱","◲","◳","◴","◵","◶","◷","◸","◹","◺","◻","◼","◽","⬒","⬓",
    // More dingbats
    "✁","✂","✃","✄","✆","✈","✉","✌","✍","✎","✏","✒","✜","✛","✤","✥","❤","❥","❦","❧","➔","➜","➤","➟",
    // Braille patterns (caseless, render reliably across platforms)
    "⠁","⠂","⠃","⠄","⠅","⠆","⠇","⠈","⠉","⠊","⠋","⠌","⠍","⠎","⠏","⠐","⠑","⠒","⠓","⠔","⠕","⠖","⠗","⠘"];
    
