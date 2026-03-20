'use strict';

/* ═══════════════════════════════════════════════════════════
   DO ANYTHING — do-anything.js
   Tap, touch, type — everything makes something magical happen.
   ═══════════════════════════════════════════════════════════ */

// ── Audio (lazy) ──────────────────────────────────────────
let AC = null;
function getAC() {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  return AC;
}
function unlockAudio() {
  const c = getAC();
  if (c.state === 'suspended') c.resume();
}

// Musical scale — C major + pentatonic extension
// Each key press cycles through so typing feels melodic
const NOTE_FREQS = [
  261.6, 293.7, 329.6, 349.2, 392.0,
  440.0, 493.9, 523.3, 587.3, 659.3,
  698.5, 784.0, 880.0, 987.8, 1046.5
];
let noteIdx = 0;

function playNote(freq, type = 'sine', duration = 0.35, volume = 0.28) {
  unlockAudio();
  const ctx  = getAC();
  const t    = ctx.currentTime;
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.92, t + duration);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(t); osc.stop(t + duration + 0.05);
}

function playTap(x, y) {
  // Pitch varies with horizontal position — left = low, right = high
  const ratio = Math.max(0, Math.min(1, x / window.innerWidth));
  const freq  = 180 + ratio * 600;
  unlockAudio();
  const ctx  = getAC();
  const t    = ctx.currentTime;

  // Bubble pop: sine sweep down
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq * 1.6, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.18);
  gain.gain.setValueAtTime(0.32, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.20);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(t); osc.stop(t + 0.22);

  // Noise thud
  const buf  = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random()*2-1)*(1-i/data.length)*0.14;
  const src = ctx.createBufferSource(), flt = ctx.createBiquadFilter(), gn = ctx.createGain();
  src.buffer = buf; flt.type = 'lowpass'; flt.frequency.value = 280;
  gn.gain.setValueAtTime(0.45, t); gn.gain.exponentialRampToValueAtTime(0.001, t+0.06);
  src.connect(flt); flt.connect(gn); gn.connect(ctx.destination); src.start(t);
}

function playKeyNote() {
  const freq = NOTE_FREQS[noteIdx % NOTE_FREQS.length];
  noteIdx++;
  // Alternate between sine (warm) and triangle (bright)
  playNote(freq, noteIdx % 2 === 0 ? 'sine' : 'triangle', 0.40, 0.26);
}

function playSpacebar() {
  // Whoosh up
  unlockAudio();
  const ctx = getAC(), t = ctx.currentTime;
  const osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(120, t);
  osc.frequency.exponentialRampToValueAtTime(900, t + 0.22);
  gain.gain.setValueAtTime(0.18, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(t); osc.stop(t + 0.26);
}

function playEnter() {
  // Happy ascending fanfare
  unlockAudio();
  const ctx = getAC();
  [392, 523, 659, 784, 1047].forEach((freq, i) => {
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    const t   = ctx.currentTime + i * 0.08;
    osc.type = 'sine'; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.28, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.32);
  });
}

function playBackspace() {
  // Quick descending blip
  unlockAudio();
  const ctx = getAC(), t = ctx.currentTime;
  const osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(440, t);
  osc.frequency.exponentialRampToValueAtTime(110, t + 0.14);
  gain.gain.setValueAtTime(0.18, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(t); osc.stop(t + 0.18);
}

// ── Helpers ───────────────────────────────────────────────
const rand    = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b));
const pick    = arr   => arr[Math.floor(Math.random() * arr.length)];

const COLORS = [
  '#FF1744','#FF6D00','#FFD600','#00E676',
  '#2979FF','#D500F9','#FF4081','#00E5FF',
  '#AEEA00','#FF6F00',
];

// Tap emojis — fun, toddler-safe, varied
const TAP_EMOJIS = [
  '⭐','🌟','💥','🎈','🎉','✨','🦋','🌈',
  '🎊','💫','🌸','🍭','🎵','🎶','🌺','💎',
  '🍬','🦄','🐢','🐸','🐙','🦊','🐬','🦁',
  '🍕','🍩','🍦','🌮','🍓','🍉','🍋','🎂',
];

// Special key emojis
const SPECIAL_KEY_EMOJIS = {
  ' ':         ['🚀','💨','🌬️','🎠','🎡','🎢'],
  'Enter':     ['🎉','🥳','🏆','🎊','👑','⭐'],
  'Backspace': ['💥','🌀','🔄','💫'],
  'ArrowUp':   ['⬆️','🚀','🌠','🕊️'],
  'ArrowDown': ['⬇️','🏄','🐠','🌊'],
  'ArrowLeft': ['⬅️','🐎','🚂','🌀'],
  'ArrowRight':['➡️','🐇','✈️','⚡'],
};

// ── DOM refs ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

  const playground    = document.getElementById('playground');
  const particleLayer = document.getElementById('particleLayer');
  const idleHint      = document.getElementById('idleHint');
  const srAnnounce    = document.getElementById('sr-announce');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const fullscreenIcon = document.getElementById('fullscreenIcon');
  const escToast      = document.getElementById('escToast');
  const escDots       = document.getElementById('escDots');

  // Focus playground so it catches keyboard events immediately
  playground.focus();

  // ── Fullscreen ────────────────────────────────────────
  function enterFullscreen() {
    const el = document.documentElement;
    if (el.requestFullscreen)            el.requestFullscreen({ navigationUI: 'hide' });
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  }

  function exitFullscreen() {
    if (document.exitFullscreen)            document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  }

  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function updateFullscreenBtn() {
    if (isFullscreen()) {
      fullscreenIcon.textContent = '✕';
      fullscreenBtn.setAttribute('aria-label', 'Exit fullscreen (or press Escape 3 times)');
    } else {
      fullscreenIcon.textContent = '⛶';
      fullscreenBtn.setAttribute('aria-label', 'Enter fullscreen');
    }
  }

  fullscreenBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (isFullscreen()) exitFullscreen();
    else enterFullscreen();
  });

  document.addEventListener('fullscreenchange',       updateFullscreenBtn);
  document.addEventListener('webkitfullscreenchange', updateFullscreenBtn);

  // ── Triple-ESC exit hatch ─────────────────────────────
  // In fullscreen, ESC is intercepted by the browser to exit fullscreen,
  // so we can't use it ourselves. Instead we track rapid ESC taps BEFORE
  // fullscreen engages, or use it outside fullscreen as a triple-press exit.
  // 
  // Our approach: track ESC presses within a 1.5s window.
  // 1st press → show toast with one dot filled, keep going
  // 2nd press → two dots filled
  // 3rd press → exit fullscreen + navigate back
  let escCount    = 0;
  let escTimer    = null;
  let toastTimer  = null;

  const DOT_STATES = ['●○○', '●●○', '●●●'];

  function showEscToast(count) {
    escDots.textContent = DOT_STATES[count - 1];
    escToast.setAttribute('aria-hidden', 'false');
    escToast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideEscToast, 1800);
  }

  function hideEscToast() {
    escToast.classList.remove('visible');
    escToast.setAttribute('aria-hidden', 'true');
  }

  function handleEsc() {
    escCount++;
    showEscToast(escCount);

    if (escCount >= 3) {
      // Third press — exit fullscreen and go back
      escCount = 0;
      clearTimeout(escTimer);
      hideEscToast();
      if (isFullscreen()) {
        exitFullscreen();
        // Small delay so fullscreen exits cleanly before navigation
        setTimeout(() => { window.location.href = 'index.html'; }, 300);
      } else {
        window.location.href = 'index.html';
      }
      return;
    }

    // Reset counter if no follow-up within 1.5s
    clearTimeout(escTimer);
    escTimer = setTimeout(() => {
      escCount = 0;
      hideEscToast();
    }, 1500);
  }

  // ── Idle detection ────────────────────────────────────
  let idleTimer = null;

  function resetIdle() {
    idleHint.classList.remove('visible');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      idleHint.classList.add('visible');
    }, 3500);
  }

  resetIdle();

  // ── Utility: auto-remove elements after animation ─────
  function autoRemove(el, ms) {
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, ms);
  }

  // ── Ripple ring ───────────────────────────────────────
  function spawnRipple(x, y, color) {
    const el = document.createElement('div');
    el.className  = 'ripple';
    const size    = randInt(120, 240);
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
    el.style.width  = size + 'px';
    el.style.height = size + 'px';
    el.style.border = '6px solid ' + color;
    particleLayer.appendChild(el);
    autoRemove(el, 900);
  }

  // ── Firework particles ────────────────────────────────
  function spawnFireworks(x, y, color, count) {
    count = count || 14;
    for (let i = 0; i < count; i++) {
      const el    = document.createElement('div');
      el.className = 'firework';
      const size  = randInt(10, 22);
      const angle = (i / count) * Math.PI * 2 + rand(-0.3, 0.3);
      const dist  = rand(80, 200);
      const tx    = Math.cos(angle) * dist;
      const ty    = Math.sin(angle) * dist;
      el.style.left   = x + 'px';
      el.style.top    = y + 'px';
      el.style.width  = size + 'px';
      el.style.height = size + 'px';
      el.style.background    = pick(COLORS);
      el.style.borderRadius  = Math.random() > 0.5 ? '50%' : '3px';
      el.style.setProperty('--tx', tx + 'px');
      el.style.setProperty('--ty', ty + 'px');
      el.style.animationDelay    = rand(0, 0.08) + 's';
      el.style.animationDuration = rand(0.55, 0.90) + 's';
      particleLayer.appendChild(el);
      autoRemove(el, 1000);
    }
  }

  // ── Tap emoji burst ───────────────────────────────────
  function spawnTapBurst(x, y, emoji) {
    const el       = document.createElement('div');
    el.className   = 'tap-burst';
    el.textContent = emoji;
    el.style.left  = x + 'px';
    el.style.top   = y + 'px';
    particleLayer.appendChild(el);
    autoRemove(el, 800);
  }

  // ── Confetti shower ───────────────────────────────────
  function spawnConfetti(count) {
    const shapes = ['square', 'circle', 'diamond'];
    for (let i = 0; i < count; i++) {
      const el    = document.createElement('div');
      const shape = pick(shapes);
      el.className = 'confetti-piece ' + shape;
      const size  = randInt(14, 26);
      el.style.left   = rand(0, 100) + '%';
      el.style.width  = size + 'px';
      el.style.height = size + 'px';
      el.style.background = pick(COLORS);
      el.style.setProperty('--cf-dur',   rand(1.8, 3.2) + 's');
      el.style.setProperty('--cf-delay', rand(0, 0.5) + 's');
      el.style.setProperty('--cf-spin',  (Math.random() > 0.5 ? '' : '-') + randInt(280, 720) + 'deg');
      particleLayer.appendChild(el);
      autoRemove(el, 3800);
    }
  }

  // ── Screen flash ──────────────────────────────────────
  function spawnScreenFlash(color) {
    const el      = document.createElement('div');
    el.className  = 'screen-flash';
    el.style.background = color;
    document.body.appendChild(el);
    autoRemove(el, 600);
  }

  // ── Letter burst (keyboard) ───────────────────────────
  function spawnLetter(char) {
    const el       = document.createElement('div');
    el.className   = 'letter-burst';
    el.textContent = char.toUpperCase();
    const color    = pick(COLORS);
    el.style.color  = color;
    const x = rand(10, 90);
    const y = rand(55, 80);
    el.style.left   = x + 'vw';
    el.style.top    = y + 'vh';
    el.style.setProperty('--rot', (rand(-12, 12)) + 'deg');
    el.style.animationDuration = rand(1.0, 1.4) + 's';
    particleLayer.appendChild(el);
    autoRemove(el, 1500);
  }

  // ── Trail dot on drag ─────────────────────────────────
  function spawnTrailDot(x, y, color) {
    const el      = document.createElement('div');
    el.className  = 'trail-dot';
    const size    = randInt(18, 48);
    el.style.left   = x + 'px';
    el.style.top    = y + 'px';
    el.style.width  = size + 'px';
    el.style.height = size + 'px';
    el.style.background       = color;
    el.style.animationDuration = rand(0.4, 0.7) + 's';
    particleLayer.appendChild(el);
    autoRemove(el, 800);
  }

  // ── Full tap response ─────────────────────────────────
  function handleTap(x, y, emoji) {
    resetIdle();
    const color = pick(COLORS);
    emoji = emoji || pick(TAP_EMOJIS);
    spawnTapBurst(x, y, emoji);
    spawnRipple(x, y, color);
    spawnFireworks(x, y, color, randInt(10, 18));
    playTap(x, y);
  }

  // ── Pointer events (multi-touch) ──────────────────────
  const activePointers = new Map();

  playground.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    resetIdle();
    unlockAudio();
    const color = pick(COLORS);
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY, color, lastTrail: 0 });
    handleTap(e.clientX, e.clientY);
  }, { passive: false });

  playground.addEventListener('pointermove', function (e) {
    e.preventDefault();
    if (!activePointers.has(e.pointerId)) return;
    const state = activePointers.get(e.pointerId);
    const now   = Date.now();
    if (now - state.lastTrail > 30) {
      spawnTrailDot(e.clientX, e.clientY, state.color);
      activePointers.set(e.pointerId, { ...state, x: e.clientX, y: e.clientY, lastTrail: now });
    }
  }, { passive: false });

  playground.addEventListener('pointerup',     e => activePointers.delete(e.pointerId));
  playground.addEventListener('pointercancel', e => activePointers.delete(e.pointerId));
  playground.addEventListener('contextmenu',   e => e.preventDefault());

  // ── Keyboard: block ALL combos + handle keys ──────────
  document.addEventListener('keydown', function (e) {

    // ── ESC: triple-press exit hatch ──────────────────
    if (e.key === 'Escape') {
      // Don't call preventDefault on ESC — browser needs it to exit fullscreen.
      // We track the presses ourselves.
      handleEsc();
      return;
    }

    // ── Block ALL modifier combos the browser allows us to block.
    // Cmd/Ctrl+W (close tab), Cmd/Ctrl+T (new tab), Cmd/Ctrl+L (address bar),
    // Cmd/Ctrl+R (reload), F5 (reload), Alt+Left/Right (history nav),
    // Cmd/Ctrl+[, Cmd/Ctrl+], Tab (focus change), F1-F12, etc.
    // NOTE: Cmd+Tab (app switch) and Cmd+Q (quit) are OS-level — no browser can block them.
    const combo = e.metaKey || e.ctrlKey || e.altKey;
    if (combo || e.key === 'Tab' || (e.key.startsWith('F') && e.key.length <= 3)) {
      e.preventDefault();
      e.stopPropagation();
      // Still make something fun happen on the combo press
      resetIdle();
      unlockAudio();
      const cx = rand(20, 80) / 100 * window.innerWidth;
      const cy = rand(20, 80) / 100 * window.innerHeight;
      spawnFireworks(cx, cy, pick(COLORS), 12);
      spawnTapBurst(cx, cy, pick(TAP_EMOJIS));
      playTap(cx, cy);
      return;
    }

    // ── From here: all normal single-key presses ──────
    resetIdle();
    unlockAudio();
    e.preventDefault();

    const key = e.key;

    if (key === 'Enter') {
      const cx = window.innerWidth  / 2;
      const cy = window.innerHeight / 2;
      playEnter();
      spawnScreenFlash(pick(COLORS) + '55');
      spawnConfetti(50);
      spawnFireworks(cx, cy, pick(COLORS), 28);
      spawnTapBurst(cx, cy, pick(SPECIAL_KEY_EMOJIS['Enter']));
      srAnnounce.textContent = 'Celebration!';
      return;
    }

    if (key === ' ') {
      playSpacebar();
      for (let i = 0; i < 3; i++) {
        const rx = rand(20, 80) / 100 * window.innerWidth;
        const ry = rand(20, 80) / 100 * window.innerHeight;
        setTimeout(() => {
          spawnFireworks(rx, ry, pick(COLORS), 16);
          spawnTapBurst(rx, ry, pick(SPECIAL_KEY_EMOJIS[' ']));
        }, i * 120);
      }
      srAnnounce.textContent = 'Whoosh!';
      return;
    }

    if (key === 'Backspace' || key === 'Delete') {
      playBackspace();
      const cx = window.innerWidth  / 2;
      const cy = window.innerHeight / 2;
      spawnTapBurst(cx, cy, pick(SPECIAL_KEY_EMOJIS['Backspace']));
      spawnRipple(cx, cy, pick(COLORS));
      return;
    }

    if (key.startsWith('Arrow')) {
      const emojis = SPECIAL_KEY_EMOJIS[key] || ['⭐'];
      const cx = window.innerWidth  / 2;
      const cy = window.innerHeight / 2;
      playNote(pick([392, 440, 523, 587]), 'triangle', 0.25);
      spawnTapBurst(cx, cy, pick(emojis));
      spawnRipple(cx, cy, pick(COLORS));
      return;
    }

    // Printable characters
    if (key.length === 1) {
      spawnLetter(key);
      playKeyNote();
      if (/\d/.test(key)) {
        const n  = parseInt(key, 10);
        const cx = rand(20, 80) / 100 * window.innerWidth;
        const cy = rand(20, 80) / 100 * window.innerHeight;
        spawnFireworks(cx, cy, pick(COLORS), n === 0 ? 20 : n * 2 + 4);
      }
      srAnnounce.textContent = key.toUpperCase();
    }

  }, true); // capture phase — fires before browser shortcuts

  // Also block keyup/keypress combos in capture phase
  document.addEventListener('keyup', function (e) {
    if (e.key !== 'Escape' && (e.metaKey || e.ctrlKey || e.altKey || e.key === 'Tab')) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  // ── Milestone: every 20 taps → celebration ────────────
  let tapTotal = 0;
  playground.addEventListener('pointerdown', function () {
    tapTotal++;
    if (tapTotal % 20 === 0) {
      setTimeout(() => { spawnConfetti(40); playEnter(); }, 200);
    }
  }, { passive: true });

}); // end DOMContentLoaded
