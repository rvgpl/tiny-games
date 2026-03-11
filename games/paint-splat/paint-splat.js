'use strict';

/* ═══════════════════════════════════════════════════════════
   PAINT SPLAT — paint-splat.js
   ═══════════════════════════════════════════════════════════ */

// ── Audio ─────────────────────────────────────────────────
let AC = null;
function getAC() {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  return AC;
}
function unlockAudio() {
  const c = getAC();
  if (c.state === 'suspended') c.resume();
}

let pitchIdx = 0;
const SCALE = [261.6, 293.7, 329.6, 349.2, 392.0, 440.0, 493.9, 523.3, 587.3, 659.3];

function playSplat() {
  unlockAudio();
  const ctx  = getAC();
  const freq = SCALE[pitchIdx++ % SCALE.length];
  const t    = ctx.currentTime;

  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq * 1.5, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.65, t + 0.16);
  gain.gain.setValueAtTime(0.32, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(t); osc.stop(t + 0.25);

  // Thud noise
  const buf  = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.06), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random()*2-1)*(1-i/data.length)*0.16;
  const src = ctx.createBufferSource(), flt = ctx.createBiquadFilter(), gn = ctx.createGain();
  src.buffer = buf; flt.type = 'lowpass'; flt.frequency.value = 300;
  gn.gain.setValueAtTime(0.5, t); gn.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  src.connect(flt); flt.connect(gn); gn.connect(ctx.destination); src.start(t);
}

function playCelebration() {
  unlockAudio();
  const ctx = getAC();
  [523.3, 587.3, 659.3, 698.5, 784.0, 880.0, 987.8, 1046.5].forEach((freq, i) => {
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    const t   = ctx.currentTime + i * 0.09;
    osc.type = 'sine'; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.30);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.34);
  });
}

function playClear() {
  unlockAudio();
  const ctx = getAC(), t = ctx.currentTime;
  const osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(600, t);
  osc.frequency.exponentialRampToValueAtTime(80, t + 0.28);
  gain.gain.setValueAtTime(0.22, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(t); osc.stop(t + 0.30);
}

function playSwoosh() {
  unlockAudio();
  const ctx = getAC();
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.055), ctx.sampleRate);
  const d   = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1)*Math.pow(1-i/d.length,1.4)*0.09;
  const src = ctx.createBufferSource(), flt = ctx.createBiquadFilter(), gn = ctx.createGain();
  src.buffer = buf; flt.type = 'bandpass'; flt.frequency.value = 900; flt.Q.value = 0.6;
  gn.gain.setValueAtTime(0.38, ctx.currentTime);
  gn.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.055);
  src.connect(flt); flt.connect(gn); gn.connect(ctx.destination); src.start();
}

// ── Helpers ───────────────────────────────────────────────
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr   => arr[Math.floor(Math.random() * arr.length)];
const PALETTE = ['#FF1744','#FF6D00','#FFD600','#00E676','#2979FF','#D500F9','#FF4081'];
const randomColor = () => pick(PALETTE);

// ── SVG Splat Shapes ──────────────────────────────────────
// Three hand-crafted shapes replicating the reference images.
// Each is defined in a 200×200 viewBox centred at (100,100).
// They are rendered to an offscreen SVG → Image → drawn onto canvas.
//
// SPLAT_A: Round blob with short rounded nubs (Image 1)
// SPLAT_B: Irregular blob with chunky drip arms + floating teardrops (Image 2)
// SPLAT_C: Compact centre with many thin radiating arms + floating drop (Image 3)

const SPLAT_PATHS = {

  // ── Type A: large round blob with bumpy perimeter nubs ──
  A: `
    <path d="
      M 100 22
      C 108 18, 115 14, 118 8
      C 121 2,  128 4,  128 10
      C 128 16, 122 20, 120 24
      C 130 20, 140 18, 145 22
      C 150 26, 148 33, 143 35
      C 150 34, 158 35, 160 41
      C 162 47, 157 52, 151 51
      C 157 54, 162 60, 160 66
      C 158 72, 151 73, 146 70
      C 149 76, 149 84, 144 88
      C 139 92, 133 90, 130 85
      C 128 92, 126 100, 120 104
      C 114 108, 107 105, 105 99
      C 103 106, 99 113, 92 115
      C 85 117, 79 112, 79 105
      C 74 110, 68 115, 62 113
      C 56 111, 54 104, 57 98
      C 50 101, 42 101, 39 95
      C 36 89, 40 83, 46 81
      C 40 79, 35 74, 36 68
      C 37 62, 43 58, 49 59
      C 44 54, 42 47, 46 42
      C 50 37, 57 36, 62 39
      C 59 33, 59 26, 64 22
      C 69 18, 75 19, 78 24
      C 78 17, 80 10, 86 8
      C 92 6,  97 11, 98 17
      Z
    "/>
    <circle cx="44" cy="118" r="6"/>
    <circle cx="38" cy="128" r="4"/>
    <ellipse cx="112" cy="170" rx="7" ry="10" transform="rotate(-10,112,170)"/>
  `,

  // ── Type B: irregular blob + chunky drips + floating teardrops ──
  B: `
    <path d="
      M 100 30
      C 112 25, 125 24, 132 30
      C 140 20, 152 18, 158 26
      C 164 34, 158 44, 150 46
      C 162 46, 172 52, 170 62
      C 168 72, 157 75, 148 71
      C 156 76, 162 86, 157 94
      C 152 102, 141 103, 134 97
      C 136 108, 132 120, 122 124
      C 112 128, 102 122, 100 112
      C 98  122, 92  132, 82 134
      C 72  136, 64  128, 65 118
      C 58  124, 50  128, 43 123
      C 36  118, 36  108, 42 102
      C 34  100, 28  93,  32 85
      C 36  77,  46  75,  54 79
      C 48  72,  46  62,  52 56
      C 58  50,  68  50,  74 56
      C 72  47,  74  38,  82 34
      C 90  30,  98  33, 100 40
      Z
    "/>
    <ellipse cx="25"  cy="120" rx="5"  ry="5"/>
    <ellipse cx="155" cy="118" rx="12" ry="14" transform="rotate(15,155,118)"/>
    <ellipse cx="115" cy="168" rx="10" ry="13" transform="rotate(-5,115,168)"/>
    <ellipse cx="138" cy="158" rx="7"  ry="9"  transform="rotate(10,138,158)"/>
    <circle  cx="168" cy="148" r="6"/>
    <circle  cx="148" cy="22"  r="8"/>
    <circle  cx="165" cy="32"  r="5"/>
    <circle  cx="30"  cy="100" r="4"/>
    <circle  cx="42"  cy="148" r="10"/>
  `,

  // ── Type C: small core + many thin radiating arms + floating drop ──
  C: `
    <path d="
      M 100 58
      C 104 50, 102 40, 100 32
      C 98  24, 96  18, 100 14
      C 104 10, 110 12, 110 18
      C 110 24, 107 32, 106 40
      C 114 34, 122 26, 130 24
      C 134 23, 138 26, 136 30
      C 134 34, 126 36, 120 40
      C 128 40, 138 40, 144 44
      C 150 48, 150 55, 144 58
      C 138 61, 128 58, 122 58
      C 130 64, 138 72, 138 80
      C 138 86, 132 90, 126 86
      C 120 82, 116 72, 114 64
      C 112 72, 110 84, 106 90
      C 102 96, 95  96, 93  90
      C 91  84, 94  72, 96  64
      C 88  72, 80  82, 72  82
      C 64  82, 60  75, 64  68
      C 68  61, 78  58, 86  60
      C 80  56, 70  52, 66  46
      C 62  40, 64  32, 70  30
      C 76  28, 84  34, 88  42
      C 86  34, 84  24, 88  18
      C 92  12, 98  12, 100 18
      Z
    "/>
    <ellipse cx="100" cy="6"  rx="7" ry="10" transform="rotate(5,100,6)"/>
    <circle  cx="100" cy="108" r="8"/>
    <circle  cx="86"  cy="116" r="5"/>
    <circle  cx="114" cy="116" r="5"/>
    <circle  cx="56"  cy="94"  r="4"/>
    <circle  cx="148" cy="70"  r="4"/>
  `,
};

// Pre-render each splat type to an Image at a base resolution
// We generate one Image per (type, color) on demand and cache them.
const splatImageCache = new Map();

function getSplatImage(type, color, size, callback) {
  const key = type + '_' + color + '_' + size;
  if (splatImageCache.has(key)) { callback(splatImageCache.get(key)); return; }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 200 200"
         width="${size}" height="${size}">
      <g fill="${color}">
        ${SPLAT_PATHS[type]}
      </g>
    </svg>`;

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url  = URL.createObjectURL(blob);
  const img  = new Image();
  img.onload = function () {
    URL.revokeObjectURL(url);
    splatImageCache.set(key, img);
    callback(img);
  };
  img.src = url;
}

// Stamp a splat image onto the canvas at (x,y), scaled + rotated randomly
function stampSplat(ctx2d, img, x, y, size, alpha) {
  const rot = rand(0, Math.PI * 2);
  ctx2d.save();
  ctx2d.globalAlpha = alpha !== undefined ? alpha : rand(0.88, 1.0);
  ctx2d.translate(x, y);
  ctx2d.rotate(rot);
  ctx2d.drawImage(img, -size / 2, -size / 2, size, size);
  ctx2d.restore();
}

// Draw a full splat: main stamp + 2-3 smaller satellite stamps
function drawSplat(ctx2d, x, y, baseSize, color, onDone) {
  // Pick a random splat shape type
  const type = pick(['A','B','C']);
  const size = baseSize * rand(0.92, 1.12);

  // We need potentially up to 4 images; track when all done
  let pending = 0;
  const done  = () => { pending--; if (pending <= 0 && onDone) onDone(); };

  // Main splat
  pending++;
  getSplatImage(type, color, Math.round(size), img => {
    stampSplat(ctx2d, img, x, y, size, rand(0.90, 1.0));
    done();
  });

  // 1-2 smaller satellite splats scattered around
  const satellites = Math.floor(rand(1, 3));
  for (let i = 0; i < satellites; i++) {
    pending++;
    const sType   = pick(['A','B','C']);
    const sFrac   = rand(0.28, 0.50);
    const sSize   = size * sFrac;
    const angle   = rand(0, Math.PI * 2);
    const dist    = rand(size * 0.45, size * 0.80);
    const sx      = x + Math.cos(angle) * dist;
    const sy      = y + Math.sin(angle) * dist;
    getSplatImage(sType, color, Math.round(sSize), img => {
      stampSplat(ctx2d, img, sx, sy, sSize, rand(0.55, 0.85));
      done();
    });
  }
}

// Sparkle stars around a splat
function drawSparkles(ctx2d, x, y, size, color) {
  const count = Math.floor(rand(6, 10));
  ctx2d.save();
  ctx2d.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rand(-0.25, 0.25);
    const dist  = size * rand(0.50, 0.85);
    const sx    = x + Math.cos(angle) * dist;
    const sy    = y + Math.sin(angle) * dist;
    const r     = size * rand(0.07, 0.14);
    ctx2d.save();
    ctx2d.globalAlpha = rand(0.7, 1.0);
    ctx2d.translate(sx, sy);
    ctx2d.rotate(rand(0, Math.PI));
    ctx2d.beginPath();
    // 4-pointed star
    for (let p = 0; p < 4; p++) {
      const outer = (p * Math.PI) / 2;
      const inner = outer + Math.PI / 4;
      if (p === 0) ctx2d.moveTo(Math.cos(outer)*r, Math.sin(outer)*r);
      else         ctx2d.lineTo(Math.cos(outer)*r, Math.sin(outer)*r);
      ctx2d.lineTo(Math.cos(inner)*r*0.35, Math.sin(inner)*r*0.35);
    }
    ctx2d.closePath();
    ctx2d.fill();
    ctx2d.restore();
  }
  ctx2d.restore();
}

// Rainbow effect: 3 overlapping splats in adjacent palette colours
function drawRainbow(ctx2d, x, y, baseSize, baseColor, onDone) {
  const idx    = PALETTE.indexOf(baseColor);
  const colors = [
    PALETTE[(idx + PALETTE.length - 1) % PALETTE.length],
    baseColor,
    PALETTE[(idx + 1) % PALETTE.length],
  ];
  let remaining = colors.length;
  const done    = () => { remaining--; if (remaining <= 0 && onDone) onDone(); };
  colors.forEach((col, i) => {
    const offset = (i - 1) * baseSize * 0.20;
    drawSplat(ctx2d, x + offset, y + offset * 0.35, baseSize * 0.82, col, done);
  });
}

// ── Effects enum ──────────────────────────────────────────
const EFFECTS      = ['normal', 'sparkle', 'rainbow'];
const EFFECT_ICONS = ['🎨', '✨', '🌈'];

// ── Boot ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

  // DOM refs
  const canvas        = document.getElementById('paintCanvas');
  const ctx           = canvas.getContext('2d');
  const srAnnounce    = document.getElementById('sr-announce');
  const clearBtn      = document.getElementById('clearBtn');
  const saveBtn       = document.getElementById('saveBtn');
  const effectBtn     = document.getElementById('effectBtn');
  const effectIcon    = document.getElementById('effectIcon');
  const confettiLayer = document.getElementById('confettiLayer');
  const clearFlash    = document.getElementById('clearFlash');
  const swatches      = document.querySelectorAll('.swatch');

  // State — default to random colour
  let activeColor  = 'random';
  let effectIndex  = 0;
  let tapCount     = 0;
  let lastSwoosh   = 0;

  // Multi-touch: pointerId → { x, y, color }
  const pointers = new Map();

  // ── Canvas sizing ─────────────────────────────────────
  const DPR = window.devicePixelRatio || 1;

  function resizeCanvas() {
    const saved = (canvas.width > 0 && canvas.height > 0)
      ? ctx.getImageData(0, 0, canvas.width, canvas.height) : null;

    canvas.width  = Math.round(window.innerWidth  * DPR);
    canvas.height = Math.round(window.innerHeight * DPR);
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';

    ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (saved) { try { ctx.putImageData(saved, 0, 0); } catch(_){} }
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function cssPoint(cx, cy) {
    const r = canvas.getBoundingClientRect();
    return { x: cx - r.left, y: cy - r.top };
  }

  // ── Colour resolution ─────────────────────────────────
  // First finger uses chosen colour; 2nd+ get random
  function resolveColor() {
    const base = (activeColor === 'random') ? randomColor() : activeColor;
    return (pointers.size === 0) ? base : randomColor();
  }

  // ── Paint dispatch ────────────────────────────────────
  function paint(x, y, color, isTap) {
    const baseSize = rand(120, 150);
    const eff      = EFFECTS[effectIndex];

    if (eff === 'rainbow') {
      drawRainbow(ctx, x, y, baseSize, color === 'random' ? randomColor() : color);
    } else {
      drawSplat(ctx, x, y, baseSize, color, () => {
        if (eff === 'sparkle') drawSparkles(ctx, x, y, baseSize, color);
      });
    }

    if (isTap) {
      tapCount++;
      playSplat();
      if (tapCount % 10 === 0) triggerConfetti();
    }
  }

  // Stroke segment (drag trail)
  function paintStroke(x0, y0, x1, y1, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth   = rand(80, 110);
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.globalAlpha = 0.80;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.restore();
  }

  // ── Pointer events ────────────────────────────────────
  canvas.addEventListener('pointerdown', function(e) {
    e.preventDefault();
    unlockAudio();
    const pt    = cssPoint(e.clientX, e.clientY);
    const color = resolveColor();
    pointers.set(e.pointerId, { x: pt.x, y: pt.y, color });
    paint(pt.x, pt.y, color, true);
  }, { passive: false });

  canvas.addEventListener('pointermove', function(e) {
    e.preventDefault();
    if (!pointers.has(e.pointerId)) return;
    const prev  = pointers.get(e.pointerId);
    const pt    = cssPoint(e.clientX, e.clientY);
    const dist  = Math.hypot(pt.x - prev.x, pt.y - prev.y);

    paintStroke(prev.x, prev.y, pt.x, pt.y, prev.color);

    if (dist > 45) {
      paint(pt.x, pt.y, prev.color, false);
      const now = Date.now();
      if (now - lastSwoosh > 70) { playSwoosh(); lastSwoosh = now; }
      pointers.set(e.pointerId, { x: pt.x, y: pt.y, color: prev.color });
    }
  }, { passive: false });

  canvas.addEventListener('pointerup',     e => { e.preventDefault(); pointers.delete(e.pointerId); }, { passive: false });
  canvas.addEventListener('pointercancel', e => { pointers.delete(e.pointerId); });
  canvas.addEventListener('contextmenu',   e => e.preventDefault());

  // ── Keyboard painting ─────────────────────────────────
  let kbX = null, kbY = null;
  canvas.addEventListener('keydown', function(e) {
    const keys = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    if (kbX === null) { kbX = window.innerWidth/2; kbY = window.innerHeight/2; }
    const px = kbX, py = kbY, step = 55;
    if (e.key==='ArrowUp')    kbY -= step;
    if (e.key==='ArrowDown')  kbY += step;
    if (e.key==='ArrowLeft')  kbX -= step;
    if (e.key==='ArrowRight') kbX += step;
    const col = (activeColor==='random') ? randomColor() : activeColor;
    if (e.key===' ') { paint(kbX, kbY, col, true); }
    else { paintStroke(px,py,kbX,kbY,col); paint(kbX,kbY,col,false); }
  });

  // ── Swatches ──────────────────────────────────────────
  swatches.forEach(sw => {
    sw.addEventListener('pointerdown', function(e) {
      e.stopPropagation();
      activeColor = this.dataset.color;
      swatches.forEach(s => { s.classList.remove('active'); s.setAttribute('aria-pressed','false'); });
      this.classList.add('active');
      this.setAttribute('aria-pressed','true');
      srAnnounce.textContent = this.getAttribute('aria-label') + ' selected';
      this.animate([
        { transform:'scale(0.80)' },
        { transform:'scale(1.22)' },
        { transform:'scale(1.14)' },
      ], { duration:260, easing:'cubic-bezier(0.34,1.56,0.64,1)', fill:'forwards' });
    });
  });

  // ── Effect cycler ─────────────────────────────────────
  effectBtn.addEventListener('click', function() {
    effectIndex = (effectIndex + 1) % EFFECTS.length;
    effectIcon.textContent = EFFECT_ICONS[effectIndex];
    srAnnounce.textContent = EFFECTS[effectIndex] + ' paint effect';
    this.animate([
      { transform:'scale(0.80)' },
      { transform:'scale(1.18)' },
      { transform:'scale(1.0)'  },
    ], { duration:280, easing:'cubic-bezier(0.34,1.56,0.64,1)' });
  });

  // ── Clear ─────────────────────────────────────────────
  clearBtn.addEventListener('click', function() {
    playClear();
    clearFlash.classList.remove('active');
    void clearFlash.offsetWidth;
    clearFlash.classList.add('active');
    setTimeout(() => clearFlash.classList.remove('active'), 560);

    ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.setTransform(DPR,0,0,DPR,0,0);

    tapCount = 0;
    srAnnounce.textContent = 'Canvas cleared';
    this.animate([
      { transform:'scale(0.78)' },
      { transform:'scale(1.12)' },
      { transform:'scale(1.0)'  },
    ], { duration:300, easing:'cubic-bezier(0.34,1.56,0.64,1)' });
  });

  // ── Save ──────────────────────────────────────────────
  saveBtn.addEventListener('click', function() {
    const tmp = document.createElement('canvas');
    tmp.width  = canvas.width; tmp.height = canvas.height;
    tmp.getContext('2d').drawImage(canvas, 0, 0);
    const a = document.createElement('a');
    a.download = 'my-masterpiece.png';
    a.href = tmp.toDataURL('image/png');
    a.click();
    srAnnounce.textContent = 'Painting saved';
    this.animate([
      { transform:'scale(0.78)' },
      { transform:'scale(1.12)' },
      { transform:'scale(1.0)'  },
    ], { duration:300, easing:'cubic-bezier(0.34,1.56,0.64,1)' });
  });

  // ── Confetti ──────────────────────────────────────────
  const SHAPES = ['square','circle','diamond','triangle'];

  function triggerConfetti() {
    playCelebration();
    confettiLayer.innerHTML = '';
    for (let i = 0; i < 60; i++) {
      const piece = document.createElement('div');
      const color = pick(PALETTE);
      const shape = pick(SHAPES);
      const size  = rand(14, 26);
      const dur   = rand(2.2, 3.5);
      const delay = rand(0, 0.8);
      const spin  = (Math.random()>.5 ? '' : '-') + Math.floor(rand(280,720)) + 'deg';

      piece.className = 'confetti-piece ' + shape;
      piece.style.setProperty('--dur',   dur   + 's');
      piece.style.setProperty('--delay', delay + 's');
      piece.style.setProperty('--spin',  spin);
      piece.style.setProperty('--pc',    color);
      piece.style.left   = rand(0, 100) + '%';
      piece.style.width  = size + 'px';
      piece.style.height = size + 'px';
      if (shape !== 'triangle') piece.style.background = color;
      if (shape === 'diamond')  piece.style.transform = 'rotate(45deg)';

      confettiLayer.appendChild(piece);
    }
    setTimeout(() => { confettiLayer.innerHTML = ''; }, 4500);
  }

  // ── Desktop cursor ring ───────────────────────────────
  const ring = document.createElement('div');
  Object.assign(ring.style, {
    position:'fixed', borderRadius:'50%', border:'3px solid',
    pointerEvents:'none', zIndex:'50',
    transform:'translate(-50%,-50%)',
    transition:'width .08s,height .08s,border-color .1s',
    opacity:'0', mixBlendMode:'multiply',
  });
  ring.setAttribute('aria-hidden','true');
  document.body.appendChild(ring);

  const isTouch = window.matchMedia('(hover: none)').matches;
  if (!isTouch) {
    canvas.addEventListener('mousemove', e => {
      ring.style.left        = e.clientX + 'px';
      ring.style.top         = e.clientY + 'px';
      ring.style.width       = '140px';
      ring.style.height      = '140px';
      ring.style.borderColor = (activeColor==='random') ? '#aaa' : activeColor;
      ring.style.opacity     = '0.40';
    });
    canvas.addEventListener('mouseleave', () => { ring.style.opacity = '0'; });
    swatches.forEach(s => s.addEventListener('pointerdown', () => {
      ring.style.borderColor = (activeColor==='random') ? '#aaa' : activeColor;
    }));
  }

}); // end DOMContentLoaded
