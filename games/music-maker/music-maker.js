'use strict';

/* ═══════════════════════════════════════════════════════════
   MUSIC MAKER — music-maker.js
   8 instruments, auto-recording, playback, celebrations.
   ═══════════════════════════════════════════════════════════ */

// ── Audio Context (lazy) ──────────────────────────────────
let AC = null;
function getAC() {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  return AC;
}
function unlockAudio() {
  const c = getAC();
  if (c.state === 'suspended') c.resume();
}

// ── Master gain (keeps everything at a sane volume) ───────
let masterGain = null;
function getMaster() {
  if (!masterGain) {
    masterGain = getAC().createGain();
    masterGain.gain.value = 0.72;
    masterGain.connect(getAC().destination);
  }
  return masterGain;
}

// ── Synthesis helpers ─────────────────────────────────────
function osc(type, freq, t, dur, vol, dest) {
  const ctx = getAC();
  const o   = ctx.createOscillator();
  const g   = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(dest || getMaster());
  o.start(t); o.stop(t + dur + 0.05);
  return { osc: o, gain: g };
}

function noise(dur, vol, filterFreq, dest) {
  const ctx  = getAC();
  const len  = Math.ceil(ctx.sampleRate * dur);
  const buf  = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src  = ctx.createBufferSource();
  const flt  = ctx.createBiquadFilter();
  const g    = ctx.createGain();
  src.buffer = buf;
  flt.type   = 'lowpass'; flt.frequency.value = filterFreq;
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  src.connect(flt); flt.connect(g); g.connect(dest || getMaster());
  src.start(); src.stop(ctx.currentTime + dur);
}

// ── Instrument sound definitions ──────────────────────────
// Each returns a function that plays the sound when called.

const INSTRUMENTS = [
  {
    id:    'drum',
    label: 'Drum',
    emoji: '🥁',
    color: '#FF1744',
    notes: ['♩','♪','♫','🥁'],
    play() {
      const ctx = getAC(); const t = ctx.currentTime;
      // Kick: sine sweep
      const kick = ctx.createOscillator();
      const kgain = ctx.createGain();
      kick.type = 'sine';
      kick.frequency.setValueAtTime(150, t);
      kick.frequency.exponentialRampToValueAtTime(40, t + 0.15);
      kgain.gain.setValueAtTime(0.9, t);
      kgain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      kick.connect(kgain); kgain.connect(getMaster());
      kick.start(t); kick.stop(t + 0.28);
      // Snare noise burst
      noise(0.12, 0.5, 8000);
    }
  },
  {
    id:    'piano',
    label: 'Piano',
    emoji: '🎹',
    color: '#2979FF',
    notes: ['♩','♬','🎵','🎶'],
    play() {
      const ctx = getAC(); const t = ctx.currentTime;
      // Three-note chord: C4, E4, G4
      [261.6, 329.6, 392.0].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = freq;
        g.gain.setValueAtTime(0.32 - i*0.04, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
        o.connect(g); g.connect(getMaster());
        o.start(t); o.stop(t + 1.5);
      });
    }
  },
  {
    id:    'guitar',
    label: 'Guitar',
    emoji: '🎸',
    color: '#00C853',
    notes: ['♪','🎸','♩','♫'],
    play() {
      // Karplus-Strong plucked string approximation
      const ctx = getAC(); const t = ctx.currentTime;
      const freq = 196; // G3
      const bufLen = Math.round(ctx.sampleRate / freq);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d   = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;

      const src  = ctx.createBufferSource();
      src.buffer = buf; src.loop = true;

      // Low-pass filter simulates string damping
      const flt = ctx.createBiquadFilter();
      flt.type = 'lowpass'; flt.frequency.value = 1800;

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.55, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.0);

      src.connect(flt); flt.connect(g); g.connect(getMaster());
      src.start(t); src.stop(t + 1.05);
    }
  },
  {
    id:    'bell',
    label: 'Bell',
    emoji: '🔔',
    color: '#FFD600',
    notes: ['✨','🔔','💫','⭐'],
    play() {
      // FM bell: modulator + carrier
      const ctx = getAC(); const t = ctx.currentTime;
      const carrierFreq = 440;
      const modFreq     = carrierFreq * 5.2;
      const modDepth    = carrierFreq * 3;

      const mod  = ctx.createOscillator();
      const modG = ctx.createGain();
      mod.type = 'sine'; mod.frequency.value = modFreq;
      modG.gain.setValueAtTime(modDepth, t);
      modG.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
      mod.connect(modG);

      const carrier = ctx.createOscillator();
      const carG    = ctx.createGain();
      carrier.type = 'sine'; carrier.frequency.value = carrierFreq;
      modG.connect(carrier.frequency); // FM connection
      carG.gain.setValueAtTime(0.4, t);
      carG.gain.exponentialRampToValueAtTime(0.001, t + 2.5);

      mod.connect(modG); carrier.connect(carG); carG.connect(getMaster());
      mod.start(t);     mod.stop(t + 2.1);
      carrier.start(t); carrier.stop(t + 2.6);
    }
  },
  {
    id:    'frog',
    label: 'Frog',
    emoji: '🐸',
    color: '#00BCD4',
    notes: ['🐸','💧','🌿','✨'],
    play() {
      const ctx = getAC(); const t = ctx.currentTime;
      // Pitch-bent wobbly ribbit
      [0, 0.08, 0.16].forEach((delay) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(280 + Math.random() * 80, t + delay);
        o.frequency.linearRampToValueAtTime(120, t + delay + 0.12);
        o.frequency.linearRampToValueAtTime(200, t + delay + 0.20);
        g.gain.setValueAtTime(0.4, t + delay);
        g.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.25);
        o.connect(g); g.connect(getMaster());
        o.start(t + delay); o.stop(t + delay + 0.28);
      });
    }
  },
  {
    id:    'laser',
    label: 'Laser',
    emoji: '🚀',
    color: '#AA00FF',
    notes: ['⚡','🚀','💥','🌟'],
    play() {
      const ctx = getAC(); const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(1400, t);
      o.frequency.exponentialRampToValueAtTime(80, t + 0.35);
      g.gain.setValueAtTime(0.35, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      o.connect(g); g.connect(getMaster());
      o.start(t); o.stop(t + 0.40);
    }
  },
  {
    id:    'xylophone',
    label: 'Xylophone',
    emoji: '🎵',
    color: '#FF6D00',
    notes: ['🎵','🎶','♬','🌈'],
    play() {
      const ctx = getAC(); const t = ctx.currentTime;
      // Bright high sine with quick attack
      const freq = [880, 1108, 1318][Math.floor(Math.random() * 3)];
      osc('sine', freq, t, 0.5, 0.45);
      // Slight harmonics for body
      osc('sine', freq * 2, t, 0.25, 0.18);
    }
  },
  {
    id:    'trumpet',
    label: 'Trumpet',
    emoji: '🎺',
    color: '#FF4081',
    notes: ['🎺','♩','💨','🌟'],
    play() {
      const ctx = getAC(); const t = ctx.currentTime;
      // Buzzy sawtooth → low-pass → envelope
      const o   = ctx.createOscillator();
      const flt = ctx.createBiquadFilter();
      const g   = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = 349.2; // F4
      flt.type = 'lowpass'; flt.frequency.value = 1800; flt.Q.value = 2;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.50, t + 0.04); // fast attack
      g.gain.setValueAtTime(0.50, t + 0.18);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      o.connect(flt); flt.connect(g); g.connect(getMaster());
      o.start(t); o.stop(t + 0.58);
    }
  },
];

// ── Celebration fanfare ───────────────────────────────────
function playCelebration() {
  unlockAudio();
  const ctx = getAC();
  [523, 659, 784, 1047, 1318].forEach((freq, i) => {
    const t = ctx.currentTime + i * 0.08;
    osc('sine', freq, t, 0.30, 0.22);
  });
}

function playPlaybackComplete() {
  unlockAudio();
  const ctx = getAC();
  [784, 988, 1175].forEach((freq, i) => {
    const t = ctx.currentTime + i * 0.10;
    osc('sine', freq, t, 0.25, 0.20);
  });
}

// ── Helpers ───────────────────────────────────────────────
const rand    = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b));
const pick    = arr   => arr[Math.floor(Math.random() * arr.length)];

const CONFETTI_COLORS = ['#FF1744','#FFD600','#00C853','#2979FF','#AA00FF','#FF4081','#FF6D00','#00BCD4'];

// ── Boot ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

  const grid          = document.getElementById('instrument-grid');
  const srAnnounce    = document.getElementById('sr-announce');
  const tapCountEl    = document.getElementById('tapCount');
  const statusDot     = document.getElementById('statusDot');
  const statusLabel   = document.getElementById('statusLabel');
  const playBtn       = document.getElementById('playBtn');
  const clearBtn      = document.getElementById('clearBtn');
  const playbackBar   = document.getElementById('playbackBar');
  const playbackFill  = document.getElementById('playbackFill');
  const celebOverlay  = document.getElementById('celebOverlay');
  const celebInner    = document.getElementById('celebInner');
  const confettiLayer = document.getElementById('confettiLayer');
  const particleLayer = document.getElementById('particleLayer');

  // ── State
  let tapCount       = 0;
  let recording      = [];   // [{ instrId, timestamp }]
  let isPlaying      = false;
  let playTimers     = [];
  let idleTimer      = null;
  let recordingStart = null;

  // map instrId → button element
  const btnMap = new Map();

  // ── Build instrument buttons ──────────────────────────
  INSTRUMENTS.forEach((inst, idx) => {
    const btn = document.createElement('button');
    btn.className = 'inst-btn';
    btn.style.setProperty('--btn-color', inst.color);
    btn.dataset.instrId = inst.id;
    btn.setAttribute('aria-label', inst.label + ' — tap to play');
    btn.setAttribute('tabindex', '0');

    // Emoji
    const emojiEl = document.createElement('span');
    emojiEl.className   = 'inst-emoji';
    emojiEl.textContent = inst.emoji;
    emojiEl.setAttribute('aria-hidden', 'true');

    // Wave bars (5 bars)
    const waveEl = document.createElement('div');
    waveEl.className = 'wave-bars';
    waveEl.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 5; i++) {
      const bar = document.createElement('div');
      bar.className = 'wave-bar';
      bar.style.height = (4 + Math.random() * 12) + 'px';
      waveEl.appendChild(bar);
    }

    btn.appendChild(emojiEl);
    btn.appendChild(waveEl);
    grid.appendChild(btn);
    btnMap.set(inst.id, btn);
  });

  // ── Particle helpers ──────────────────────────────────
  function spawnNoteParticle(btnEl, inst) {
    const r    = btnEl.getBoundingClientRect();
    const cx   = r.left + r.width  / 2 + rand(-r.width * 0.3, r.width * 0.3);
    const cy   = r.top  + r.height * 0.3;
    const el   = document.createElement('div');
    el.className   = 'note-particle';
    el.textContent = pick(inst.notes);
    el.style.left  = cx + 'px';
    el.style.top   = cy + 'px';
    el.style.setProperty('--nr',     rand(-20, 20) + 'deg');
    el.style.setProperty('--nf-dur', rand(1.1, 1.6) + 's');
    el.style.color = inst.color;
    particleLayer.appendChild(el);
    setTimeout(() => el.remove(), 1700);
  }

  function spawnConfetti(count) {
    confettiLayer.innerHTML = '';
    const shapes = ['square','circle','diamond'];
    for (let i = 0; i < count; i++) {
      const el    = document.createElement('div');
      const shape = pick(shapes);
      el.className = 'confetti-piece ' + shape;
      const size   = randInt(12, 24);
      el.style.left    = rand(0, 100) + '%';
      el.style.width   = size + 'px';
      el.style.height  = size + 'px';
      el.style.background = pick(CONFETTI_COLORS);
      el.style.setProperty('--cf-dur',   rand(1.8, 3.2) + 's');
      el.style.setProperty('--cf-delay', rand(0, 0.5) + 's');
      el.style.setProperty('--cf-spin',  (Math.random() > 0.5 ? '' : '-') + randInt(280, 720) + 'deg');
      if (shape === 'diamond') el.style.transform = 'rotate(45deg)';
      confettiLayer.appendChild(el);
    }
    setTimeout(() => confettiLayer.innerHTML = '', 4000);
  }

  // ── Recording status display ──────────────────────────
  function setStatus(state) {
    // state: 'idle' | 'recording' | 'playing'
    statusDot.className  = 'status-dot ' + (state !== 'idle' ? state : '');
    statusLabel.textContent =
      state === 'recording' ? '⏺️' :
      state === 'playing'   ? '▶️' : '🎵';
  }

  // ── Trigger a button press (plays + records) ──────────
  function triggerInstrument(instrId, btnEl, isPlayback) {
    const inst = INSTRUMENTS.find(i => i.id === instrId);
    if (!inst) return;

    unlockAudio();
    inst.play();

    // Visual press effect
    btnEl.classList.add(isPlayback ? 'playing-back' : 'pressed');
    setTimeout(() => btnEl.classList.remove('playing-back', 'pressed'), isPlayback ? 280 : 200);

    // Note particle
    if (!isPlayback) spawnNoteParticle(btnEl, inst);

    // SR announce
    srAnnounce.textContent = inst.label;
  }

  // ── Handle a live press ───────────────────────────────
  function handlePress(instrId) {
    if (isPlaying) return; // block live input during playback

    const btnEl = btnMap.get(instrId);
    triggerInstrument(instrId, btnEl, false);

    // Record it
    if (recording.length === 0) {
      recordingStart = Date.now();
      setStatus('recording');
    }
    recording.push({ instrId, t: Date.now() - recordingStart });

    // Update tap count
    tapCount++;
    tapCountEl.textContent = tapCount;
    tapCountEl.animate(
      [{ transform:'scale(1)' },{ transform:'scale(1.5)' },{ transform:'scale(1)' }],
      { duration: 220, easing: 'cubic-bezier(0.34,1.56,0.64,1)' }
    );

    // Milestone celebration every 8 taps
    if (tapCount % 8 === 0) {
      setTimeout(() => {
        playCelebration();
        spawnConfetti(45);
        celebInner.textContent = pick(['🌟','🎉','🎊','🏆','✨','💫']);
        celebOverlay.classList.remove('show');
        void celebOverlay.offsetWidth;
        celebOverlay.classList.add('show');
        setTimeout(() => celebOverlay.classList.remove('show'), 2100);
        srAnnounce.textContent = 'Amazing! ' + tapCount + ' notes played!';
      }, 100);
    }

    // Reset idle timer — after 2.5s of silence, auto-play if we have notes
    clearTimeout(idleTimer);
    if (recording.length >= 2) {
      idleTimer = setTimeout(autoPlay, 2500);
    }
  }

  // ── Multi-touch pointer events on the grid ────────────
  const activePointers = new Map(); // pointerId → instrId

  grid.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    const btn = e.target.closest('.inst-btn');
    if (!btn) return;
    const id = btn.dataset.instrId;
    activePointers.set(e.pointerId, id);
    handlePress(id);
  }, { passive: false });

  grid.addEventListener('pointermove', function (e) {
    e.preventDefault();
    if (!activePointers.has(e.pointerId)) return;
    const btn = e.target.closest('.inst-btn');
    if (!btn) return;
    const id = btn.dataset.instrId;
    if (id !== activePointers.get(e.pointerId)) {
      activePointers.set(e.pointerId, id);
      handlePress(id); // triggers when finger slides onto a new button
    }
  }, { passive: false });

  grid.addEventListener('pointerup',     e => activePointers.delete(e.pointerId));
  grid.addEventListener('pointercancel', e => activePointers.delete(e.pointerId));

  // ── Keyboard support ──────────────────────────────────
  // Keys 1-8 trigger the 8 instruments
  document.addEventListener('keydown', function (e) {
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 8) {
      const inst = INSTRUMENTS[n - 1];
      handlePress(inst.id);
    }
  });

  // Keyboard: pressing space/enter on focused button
  grid.addEventListener('keydown', function (e) {
    if (e.key === ' ' || e.key === 'Enter') {
      const btn = e.target.closest('.inst-btn');
      if (btn) { e.preventDefault(); handlePress(btn.dataset.instrId); }
    }
  });

  // ── Playback ──────────────────────────────────────────
  function autoPlay() {
    if (recording.length < 2 || isPlaying) return;
    playRecording();
  }

  function playRecording() {
    if (!recording.length || isPlaying) return;
    clearTimeout(idleTimer);
    isPlaying = true;
    setStatus('playing');
    playbackBar.classList.add('active');

    const totalDur = recording[recording.length - 1].t + 600;
    const startMs  = Date.now();

    recording.forEach(({ instrId, t }) => {
      const timer = setTimeout(() => {
        const btnEl = btnMap.get(instrId);
        if (btnEl) triggerInstrument(instrId, btnEl, true);
      }, t);
      playTimers.push(timer);
    });

    // Progress bar update
    const barInterval = setInterval(() => {
      const elapsed  = Date.now() - startMs;
      const progress = Math.min(100, (elapsed / totalDur) * 100);
      playbackFill.style.width = progress + '%';
      if (elapsed >= totalDur) clearInterval(barInterval);
    }, 50);
    playTimers.push(barInterval);

    // End of playback
    const endTimer = setTimeout(() => {
      isPlaying = false;
      setStatus('idle');
      playbackBar.classList.remove('active');
      playbackFill.style.width = '0%';
      playTimers = [];
      playPlaybackComplete();
      srAnnounce.textContent = 'Song played back!';
    }, totalDur + 100);
    playTimers.push(endTimer);
  }

  function stopPlayback() {
    playTimers.forEach(t => { clearTimeout(t); clearInterval(t); });
    playTimers = [];
    isPlaying  = false;
    setStatus(recording.length ? 'idle' : 'idle');
    playbackBar.classList.remove('active');
    playbackFill.style.width = '0%';
  }

  // ── HUD buttons ───────────────────────────────────────
  playBtn.addEventListener('click', function () {
    if (isPlaying) { stopPlayback(); return; }
    if (!recording.length) {
      srAnnounce.textContent = 'Play some notes first!';
      return;
    }
    playRecording();
  });

  clearBtn.addEventListener('click', function () {
    stopPlayback();
    recording      = [];
    recordingStart = null;
    tapCount       = 0;
    tapCountEl.textContent = '0';
    setStatus('idle');
    clearTimeout(idleTimer);
    srAnnounce.textContent = 'Song cleared. Start a new one!';
  });

  // Prevent HUD button taps from reaching grid
  playBtn.addEventListener('pointerdown',  e => e.stopPropagation());
  clearBtn.addEventListener('pointerdown', e => e.stopPropagation());

  // ── Init ──────────────────────────────────────────────
  setStatus('idle');

}); // end DOMContentLoaded
