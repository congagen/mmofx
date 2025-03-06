var masterAmp_slider = document.getElementById("masterAmp");

var enablePreviewCheckbox = document.getElementById("enablePreviewCheckbox");
var connectionHeader = document.getElementById("connectionHeader");

var enablePolyphonyCheckbox = document.getElementById("enablePolyphonyCheckbox");
var channelNameInputBox = document.getElementById("channelNameInputBox");
var setChannelNameButton = document.getElementById("setChannelNameButton");

var enableTransmissionCheckbox = document.getElementById("enableTransmissionCheckbox");
var receiveCommandsCheckbox = document.getElementById("receiveCommandsCheckbox");
var randomizePlaybackCheckbox = document.getElementById("randomizePlaybackCheckbox");

var currentChannelDisplay = document.getElementById("currentChannelDisplay");
var synthMasterAmp   = document.getElementById("synthMasterAmp");
var samplerMasterAmp = document.getElementById("samplerMasterAmp");

var shareChannelUrlButton = document.getElementById("shareChannelUrlButton");

var duration_knob = document.getElementById("duration_knob");
var attack_knob = document.getElementById("attack_knob");
var release_knob = document.getElementById("release_knob");

var osc_a_vol_knob = document.getElementById("osc_a_vol_knob");
var osc_b_vol_knob = document.getElementById("osc_b_vol_knob");
var osc_c_vol_knob = document.getElementById("osc_c_vol_knob");

var delay_speed_knob = document.getElementById("delay_speed_knob");
var delay_feedback_knob = document.getElementById("delay_feedback_knob");
var delay_cutoff_knob = document.getElementById("delay_cutoff_knob");
var delay_drywet_knob = document.getElementById("delay_drywet_knob");

var delayB_speed_knob = document.getElementById("delayB_speed_knob");
var delayB_feedback_knob = document.getElementById("delayB_feedback_knob");
var delayB_cutoff_knob = document.getElementById("delayB_cutoff_knob");
var delayB_drywet_knob = document.getElementById("delayB_drywet_knob");

var reverb_speed_knob = document.getElementById("reverb_speed_knob");
var reverb_feedback_knob = document.getElementById("reverb_feedback_knob");
var reverb_drywet_knob = document.getElementById("reverb_drywet_knob");

var username_input_box = document.getElementById("username_input_box");

// MIDI:

var enableMidiInCheckbox = document.getElementById("enableMidiInCheckbox");
let midiInputSelect = document.getElementById('midiInputSelect');
var midiInChannelSlider = document.getElementById("midiInChannel");
const midiInChannelLabel = document.getElementById("midiInChannelLabel");

var enableMidiOutCheckbox = document.getElementById("enableMidiOutCheckbox");
let midiOutputSelect = document.getElementById('midiOutputSelect');
var midiOutChannelSlider = document.getElementById("midiOutChannel");
const midiOutChannelLabel = document.getElementById("midiOutChannelLabel");

var midiNotDurationSlider = document.getElementById("midiNotDuration");
const midiNotDurationLabel = document.getElementById("midiNotDurationLabel");

let scanButton = document.getElementById('scanButton');
