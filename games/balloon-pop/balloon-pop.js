'use strict';

// ── Audio ─────────────────────────────────────────────────────────────
// AudioContext must not be created until after a user gesture.
// We create it lazily on first interaction to avoid the browser warning.
let AC = null;

function getAC() {
  if (!AC) {
    AC = new (window.AudioContext || window.webkitAudioContext)();
  }
  return AC;
}

function unlockAudio() {
  const ctx = getAC();
  if (ctx.state === 'suspended') ctx.resume();
}

function playPop() {
  unlockAudio();
  const ctx  = getAC();
  const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.14, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2.2);
  }
  const src    = ctx.createBufferSource();
  const gain   = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  src.buffer             = buf;
  filter.type            = 'bandpass';
  filter.frequency.value = 380;
  filter.Q.value         = 0.7;
  gain.gain.setValueAtTime(1.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start();
}

function playCelebration() {
  unlockAudio();
  const ctx = getAC();
  [523, 659, 784, 1047, 1319, 1568].forEach((freq, i) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    const t    = ctx.currentTime + i * 0.13;
    osc.type            = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.35);
  });
}

function playLevelUp() {
  unlockAudio();
  const ctx = getAC();
  [440, 554, 659, 880].forEach((freq, i) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    const t    = ctx.currentTime + i * 0.1;
    osc.type            = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.28, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  });
}

// ── Helpers ───────────────────────────────────────────────────────────
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr)  => arr[Math.floor(Math.random() * arr.length)];

const COLORS = [
  '#FF4D4D','#FFD600','#2979FF','#FF4081',
  '#76FF03','#D500F9','#FF6D00','#00E5FF',
  '#FF1493','#AEEA00',
];

const STARS = ['⭐','🌟','✨','🎉','🏆','🎊'];

// ── Speed levels ──────────────────────────────────────────────────────
const LEVELS = [
  { threshold:  0, minDur: 9.5, maxDur: 12.0, wobble: 12, label: '🐢 Start!'      },
  { threshold: 10, minDur: 7.5, maxDur:  9.5, wobble: 14, label: '🐇 Faster!'     },
  { threshold: 20, minDur: 5.5, maxDur:  7.5, wobble: 16, label: '🚀 Super Fast!' },
  { threshold: 35, minDur: 4.0, maxDur:  5.5, wobble: 18, label: '⚡ Lightning!'  },
  { threshold: 55, minDur: 3.0, maxDur:  4.0, wobble: 20, label: '🔥 INSANE!'     },
];

function getLevelIndex(s) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (s >= LEVELS[i].threshold) idx = i;
  }
  return idx;
}

// ── Everything runs after DOM is ready ───────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

  // Grab DOM refs inside DOMContentLoaded so they are guaranteed to exist
  const gameArea    = document.getElementById('game-area');
  const scoreNumEl  = document.getElementById('scoreNum');
  const levelNumEl  = document.getElementById('levelNum');
  const srAnnounce  = document.getElementById('sr-announce');
  const celebration = document.getElementById('celebration');
  const celebStar   = document.getElementById('celeb-star');
  const flashEl     = document.getElementById('flash');
  const bannerEl    = document.getElementById('level-banner');
  const levelText   = document.getElementById('level-text');

  // Safety check — log clearly if anything is missing
  const missing = { gameArea, scoreNumEl, levelNumEl, srAnnounce,
                    celebration, celebStar, flashEl, bannerEl, levelText };
  for (const [name, el] of Object.entries(missing)) {
    if (!el) { console.error('Balloon Pop: missing element #' + name); }
  }
  if (!gameArea) return; // can't continue without the canvas

  // ── State
  let score        = 0;
  let currentLevel = 0;
  const activeBalloons = new Set();
  const TARGET = 7;

  // ── Score & level ─────────────────────────────────────────────────
  function addScore() {
    score++;
    scoreNumEl.textContent = score;
    scoreNumEl.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.55)' }, { transform: 'scale(1)' }],
      { duration: 220, easing: 'cubic-bezier(0.34,1.56,0.64,1)' }
    );

    if (score % 5 === 0) {
      srAnnounce.textContent = score + ' balloons popped!';
    }

    const newLevel = getLevelIndex(score);
    if (newLevel !== currentLevel) {
      currentLevel = newLevel;
      levelNumEl.textContent = currentLevel + 1;
      showLevelBanner(LEVELS[currentLevel].label);
      playLevelUp();
    }

    if (score % 10 === 0) {
      triggerCelebration();
    }
  }

  function showLevelBanner(label) {
    levelText.textContent = label;
    bannerEl.classList.remove('show');
    void bannerEl.offsetWidth; // force reflow so animation restarts
    bannerEl.classList.add('show');
  }

  // ── Celebration ───────────────────────────────────────────────────
  function triggerCelebration() {
    playCelebration();
    celebStar.textContent = pick(STARS);

    celebration.classList.remove('active');
    void celebration.offsetWidth;
    celebration.classList.add('active');

    flashEl.classList.remove('active');
    void flashEl.offsetWidth;
    flashEl.classList.add('active');

    spawnCelebConfetti();
    srAnnounce.textContent = 'Amazing! ' + score + ' balloons popped!';

    setTimeout(() => {
      celebration.classList.remove('active');
      flashEl.classList.remove('active');
    }, 1600);
  }

  function spawnCelebConfetti() {
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    for (let i = 0; i < 40; i++) spawnParticle(cx, cy, rand(80, 240));
  }

  // ── Particles ────────────────────────────────────────────────────
  function spawnParticle(cx, cy, maxDist) {
    maxDist = maxDist || 120;
    const el    = document.createElement('div');
    el.className = 'confetti';
    const size  = rand(8, 20);
    const angle = rand(0, Math.PI * 2);
    const dist  = rand(maxDist * 0.35, maxDist);
    const dur   = rand(0.45, 0.8);
    const tx    = Math.cos(angle) * dist;
    const ty    = Math.sin(angle) * dist;

    // Set CSS custom properties and position individually (not via cssText join)
    el.style.left             = cx + 'px';
    el.style.top              = cy + 'px';
    el.style.width            = size + 'px';
    el.style.height           = size + 'px';
    el.style.background       = pick(COLORS);
    el.style.setProperty('--tx', tx + 'px');
    el.style.setProperty('--ty', ty + 'px');
    el.style.animationDuration = dur + 's';

    document.body.appendChild(el);
    setTimeout(() => el.remove(), dur * 1000 + 150);
  }

  // ── Balloon factory ───────────────────────────────────────────────
  function spawnBalloon() {
    if (activeBalloons.size >= TARGET + 2) return;

    const level  = LEVELS[currentLevel];
    const color  = pick(COLORS);
    const scale  = rand(0.88, 1.15);
    const w      = Math.round(90  * scale);
    const h      = Math.round(115 * scale);
    const wobble = Math.round(level.wobble * scale);
    const dur    = rand(level.minDur, level.maxDur);
    const wobDur = rand(1.1, 2.1);
    const delay  = rand(0, 0.4);

    const margin = w + 10;
    const x      = rand(margin, window.innerWidth - margin);

    // Build the animation value as a single string — no array join across lines
    const animValue =
      'floatUp ' + dur + 's ' + delay + 's linear forwards, ' +
      'wobble '  + wobDur + 's ' + delay + 's ease-in-out infinite alternate';

    // Wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'balloon';
    wrapper.setAttribute('tabindex', '0');
    wrapper.setAttribute('role', 'button');
    wrapper.setAttribute('aria-label', 'Pop this balloon');

    // Set styles individually to avoid cssText multiline issues
    wrapper.style.left   = x + 'px';
    wrapper.style.bottom = '-' + (h + 70) + 'px';
    wrapper.style.setProperty('--wobble', wobble + 'px');
    wrapper.style.animation = animValue;

    // Body
    const body = document.createElement('div');
    body.className      = 'balloon-body';
    body.style.width    = w + 'px';
    body.style.height   = h + 'px';
    body.style.background = color;

    // Knot
    const knot = document.createElement('div');
    knot.className         = 'balloon-knot';
    knot.style.background  = color;

    // String
    const str = document.createElement('div');
    str.className = 'balloon-string';

    wrapper.appendChild(body);
    wrapper.appendChild(knot);
    wrapper.appendChild(str);
    gameArea.appendChild(wrapper);
    activeBalloons.add(wrapper);

    // Auto-remove when balloon floats off screen
    const floatTime = (dur + delay + 0.5) * 1000;
    const autoRemove = setTimeout(function () {
      if (activeBalloons.has(wrapper)) {
        wrapper.remove();
        activeBalloons.delete(wrapper);
        scheduleSpawn();
      }
    }, floatTime);

    // Pop handler
    function pop(e) {
      if (e.type === 'keydown' && e.key !== ' ' && e.key !== 'Enter') return;
      if (!activeBalloons.has(wrapper)) return;

      e.preventDefault();
      clearTimeout(autoRemove);
      activeBalloons.delete(wrapper);

      unlockAudio();
      playPop();

      const rect = body.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;

      for (let i = 0; i < 18; i++) spawnParticle(cx, cy, 120);

      const burst = document.createElement('div');
      burst.className   = 'pop-burst';
      burst.textContent = '💥';
      burst.style.left  = cx + 'px';
      burst.style.top   = cy + 'px';
      document.body.appendChild(burst);
      setTimeout(() => burst.remove(), 700);

      wrapper.remove();
      addScore();
      scheduleSpawn();
    }

    wrapper.addEventListener('pointerdown', pop, { passive: false });
    wrapper.addEventListener('keydown',     pop);
  }

  // ── Spawn scheduling ──────────────────────────────────────────────
  function scheduleSpawn(delayMs) {
    delayMs = delayMs || 0;
    setTimeout(function () {
      const needed = Math.max(1, TARGET - activeBalloons.size);
      for (let i = 0; i < needed; i++) {
        setTimeout(spawnBalloon, i * 260);
      }
    }, delayMs);
  }

  // Top-up loop
  setInterval(function () {
    if (activeBalloons.size < TARGET - 1) scheduleSpawn();
  }, 1200);

  // Unlock audio on any interaction
  document.addEventListener('pointerdown', unlockAudio, { once: true });
  document.addEventListener('keydown',     unlockAudio, { once: true });

  // ── Init ──────────────────────────────────────────────────────────
  levelNumEl.textContent = '1';
  for (let i = 0; i < TARGET; i++) {
    setTimeout(spawnBalloon, i * 300);
  }
  setTimeout(function () {
    showLevelBanner(LEVELS[0].label);
  }, 500);

}); // end DOMContentLoaded
