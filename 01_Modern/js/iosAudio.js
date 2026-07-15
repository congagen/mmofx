(function() {
	window.AudioContext = window.AudioContext || window.webkitAudioContext;

	if (window.AudioContext) {
		window.audioContext = new window.AudioContext();
	}

	// iOS audio-session policy. Without this, WebKit treats our audio as
	// interrupting ("solo"), which PAUSES other apps' audio (Bandcamp, Music,
	// podcasts). MMOFX is an interactive instrument, not a media player, so we
	// ask for the "ambient" session: it MIXES with other apps instead of
	// stopping them. The trade-offs are an iOS/WebKit platform limit, not ours:
	// ambient audio is silenced by the hardware mute switch and does not keep
	// playing when the app is backgrounded. There is no web API to get
	// background playback AND mixing at the same time on iOS — that needs the
	// native AVAudioSession (.playback + .mixWithOthers). To prioritise
	// background / playing-while-muted over gentleness, change this to
	// 'playback' (which will interrupt other apps again).
	try {
		if (navigator.audioSession) {
			navigator.audioSession.type = 'ambient';
		}
	} catch (e) {}

	var fixAudioContext = function (e) {
		if (window.audioContext) {

			// Create empty buffer
			var buffer = window.audioContext.createBuffer(1, 1, 22050);
			var source = window.audioContext.createBufferSource();
			source.buffer = buffer;

			// Connect to output
			source.connect(window.audioContext.destination);

			// Play sound
			if (source.start) {
				source.start(0);
			} else if (source.play) {
				source.play(0);
			} else if (source.noteOn) {
				source.noteOn(0);
			}
		}
		// Remove events
		document.removeEventListener('touchstart', fixAudioContext);
		document.removeEventListener('touchend', fixAudioContext);
	};
	// iOS 6-8
	document.addEventListener('touchstart', fixAudioContext);
	// iOS 9
	document.addEventListener('touchend', fixAudioContext);
})();