// audio.js — synthesized sound effects and music with WebAudio.
// Single responsibility: every sound the game makes, no audio files.
// The AudioContext is created only after the first user gesture.

(function () {
  'use strict';

  var ctx = null;      // AudioContext, created lazily
  var master = null;   // master gain
  var muted = false;
  var musicTimer = null;
  var musicStep = 0;

  // Pentatonic (pelog-ish) scale for the gamelan-style loop, in Hz.
  var SCALE = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
  // A short looping melody (scale degrees), 0 = rest.
  var MELODY = [1, 0, 3, 5, 0, 4, 3, 0, 1, 0, 3, 5, 6, 5, 3, 0,
                1, 0, 3, 5, 0, 4, 3, 2, 1, 0, 2, 0, 1, 0, 0, 0];

  function ensure() {
    if (ctx) return true;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ctx.destination);
      return true;
    } catch (e) { return false; }
  }

  // Call from the first click/keypress to unlock audio.
  function unlock() {
    if (ensure() && ctx.state === 'suspended') ctx.resume();
  }

  function setMuted(m) {
    muted = !!m;
    if (master) master.gain.value = muted ? 0 : 0.5;
  }
  function isMuted() { return muted; }

  function tone(freq, dur, type, vol, when, slideTo) {
    if (!ctx || muted) return;
    var t0 = ctx.currentTime + (when || 0);
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol || 0.2, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  function noise(dur, vol, freq, when) {
    if (!ctx || muted) return;
    var t0 = ctx.currentTime + (when || 0);
    var len = Math.floor(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = freq || 4000; f.Q.value = 0.8;
    var g = ctx.createGain();
    g.gain.setValueAtTime(vol || 0.2, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0);
  }

  // Named effects.
  function sizzle() { noise(0.35, 0.25, 5000); tone(180, 0.15, 'sawtooth', 0.05, 0, 90); }
  function chop() { noise(0.08, 0.3, 2500); tone(220, 0.07, 'square', 0.12, 0, 110); }
  function bell() { tone(880, 0.5, 'sine', 0.25); tone(1318, 0.4, 'sine', 0.12, 0.02); }
  function chime() { tone(1046, 0.25, 'sine', 0.2); tone(1568, 0.35, 'sine', 0.15, 0.08); }
  function pop() { tone(520, 0.09, 'sine', 0.2, 0, 780); }
  function buzz() { tone(140, 0.22, 'square', 0.15, 0, 90); }
  function coin() { tone(988, 0.12, 'sine', 0.2); tone(1319, 0.25, 'sine', 0.2, 0.09); }
  function burn() { noise(0.5, 0.3, 300); tone(110, 0.4, 'sawtooth', 0.12, 0, 55); }

  // Gamelan-style loop: a soft metallophone melody over a low gong pulse.
  function startMusic() {
    if (!ctx || musicTimer) return;
    musicStep = 0;
    musicTimer = setInterval(function () {
      if (muted || !ctx) return;
      var deg = MELODY[musicStep % MELODY.length];
      if (deg) {
        var f = SCALE[(deg - 1) % SCALE.length] * (deg > SCALE.length ? 2 : 1);
        tone(f, 0.5, 'triangle', 0.10);
        tone(f * 2, 0.3, 'sine', 0.04);
      }
      if (musicStep % 16 === 0) tone(65.41, 1.2, 'sine', 0.12); // gong
      if (musicStep % 4 === 2) tone(196, 0.2, 'triangle', 0.05); // kenong tick
      musicStep++;
    }, 240);
  }
  function stopMusic() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  }

  window.WK = window.WK || {};
  window.WK.audio = {
    unlock: unlock, setMuted: setMuted, isMuted: isMuted,
    sizzle: sizzle, chop: chop, bell: bell, chime: chime, pop: pop,
    buzz: buzz, coin: coin, burn: burn,
    startMusic: startMusic, stopMusic: stopMusic
  };
})();
