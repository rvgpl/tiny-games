'use strict';

/* ═══════════════════════════════════════════════════════════
   RAINBOW SORT — rainbow-sort.js
   Drag colourful blobs into matching buckets.
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

function playMatch(colorIdx) {
  unlockAudio();
  const ctx = getAC();
  // Each colour maps to a cheerful note
  const notes = [523.3, 587.3, 659.3, 698.5, 784.0, 880.0, 987.8];
  const freq  = notes[colorIdx % notes.length];
  const t     = ctx.currentTime;
  // Bouncy double-note
  [freq, freq * 1.5].forEach((f, i) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    const st   = t + i * 0.10;
    osc.type = 'sine'; osc.frequency.value = f;
    gain.gain.setValueAtTime(0, st);
    gain.gain.linearRampToValueAtTime(0.30, st + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, st + 0.28);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(st); osc.stop(st + 0.30);
  });
}

function playWrong() {
  unlockAudio();
  const ctx = getAC(), t = ctx.currentTime;
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth'; osc.frequency.value = 180;
  osc.frequency.linearRampToValueAtTime(120, t + 0.15);
  gain.gain.setValueAtTime(0.18, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(t); osc.stop(t + 0.20);
}

function playPickup() {
  unlockAudio();
  const ctx = getAC(), t = ctx.currentTime;
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine'; osc.frequency.setValueAtTime(400, t);
  osc.frequency.exponentialRampToValueAtTime(600, t + 0.08);
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.10);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(t); osc.stop(t + 0.12);
}

function playCelebration() {
  unlockAudio();
  const ctx = getAC();
  [523.3, 659.3, 784.0, 1046.5, 1318.5].forEach((freq, i) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    const t    = ctx.currentTime + i * 0.10;
    osc.type = 'sine'; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.30);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.34);
  });
}

function playWin() {
  unlockAudio();
  const ctx  = getAC();
  const seq  = [523.3,659.3,784.0,1046.5,1318.5,1568.0,2093.0];
  seq.forEach((freq, i) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    const t    = ctx.currentTime + i * 0.09;
    osc.type = (i % 2 === 0) ? 'sine' : 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.30);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.33);
  });
}

// ── Helpers ───────────────────────────────────────────────
const rand    = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b));
const pick    = arr   => arr[Math.floor(Math.random() * arr.length)];
const clamp   = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ── Game config ───────────────────────────────────────────
const COLORS = [
  { id: 'red',    hex: '#FF1744', label: 'Red',    emoji: '❤️'  },
  { id: 'orange', hex: '#FF6D00', label: 'Orange', emoji: '🧡'  },
  { id: 'yellow', hex: '#FFD600', label: 'Yellow', emoji: '💛'  },
  { id: 'green',  hex: '#00C853', label: 'Green',  emoji: '💚'  },
  { id: 'blue',   hex: '#2979FF', label: 'Blue',   emoji: '💙'  },
  { id: 'purple', hex: '#AA00FF', label: 'Purple', emoji: '💜'  },
  { id: 'pink',   hex: '#FF4081', label: 'Pink',   emoji: '🩷'  },
];

// Blob face emojis — toddler-safe and fun
const BLOB_FACES = ['😊','😄','🤩','😍','🥰','😋','🤪','😎'];

// Blob border-radius variants for organic shapes
const BLOB_SHAPES = [
  '60% 40% 55% 45% / 45% 55% 45% 55%',
  '45% 55% 65% 35% / 55% 45% 55% 45%',
  '70% 30% 50% 50% / 40% 60% 40% 60%',
  '40% 60% 35% 65% / 60% 40% 65% 35%',
  '55% 45% 60% 40% / 35% 65% 45% 55%',
  '50% 50% 40% 60% / 50% 50% 60% 40%',
];

// Round definitions: [numColors, blobsPerColor]
const ROUNDS = [
  { colors: 2, perColor: 2 },  // Round 1: easy  — 4 blobs
  { colors: 3, perColor: 2 },  // Round 2: medium — 6 blobs
  { colors: 4, perColor: 2 },  // Round 3: harder — 8 blobs
  { colors: 5, perColor: 2 },  // Round 4: challenge — 10 blobs
];

const ROUND_EMOJIS  = ['🌟','🎉','🏆','🌈'];
const CONFETTI_COLS = ['#FF1744','#FF6D00','#FFD600','#00C853','#2979FF','#AA00FF','#FF4081'];

// ── Boot ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

  const blobLayer    = document.getElementById('blobLayer');
  const bucketLayer  = document.getElementById('bucketLayer');
  const roundPips    = document.getElementById('roundPips');
  const scoreNumEl   = document.getElementById('scoreNum');
  const roundOverlay = document.getElementById('roundOverlay');
  const roundEmoji   = document.getElementById('roundEmoji');
  const roundStars   = document.getElementById('roundStars');
  const winOverlay   = document.getElementById('winOverlay');
  const confettiLayer = document.getElementById('confettiLayer');
  const srAnnounce   = document.getElementById('sr-announce');

  // ── State ──────────────────────────────────────────────
  let currentRound  = 0;
  let score         = 0;
  let pendingBlobs  = 0;   // blobs left to sort this round
  let roundActive   = false;

  // pointerId → { blobEl, startX, startY, offsetX, offsetY }
  const dragging = new Map();

  // ── Round pips ────────────────────────────────────────
  function renderPips() {
    roundPips.innerHTML = '';
    ROUNDS.forEach((_, i) => {
      const pip = document.createElement('div');
      pip.className = 'round-pip';
      if (i < currentRound)  pip.classList.add('done');
      if (i === currentRound) pip.classList.add('active');
      roundPips.appendChild(pip);
    });
  }

  // ── Score ─────────────────────────────────────────────
  function addScore(n) {
    score += n;
    scoreNumEl.textContent = score;
    scoreNumEl.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.6)' }, { transform: 'scale(1)' }],
      { duration: 280, easing: 'cubic-bezier(0.34,1.56,0.64,1)' }
    );
  }

  // ── Confetti ──────────────────────────────────────────
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
      el.style.background = pick(CONFETTI_COLS);
      el.style.setProperty('--cf-dur',   rand(2.0, 3.4) + 's');
      el.style.setProperty('--cf-delay', rand(0, 0.6)   + 's');
      el.style.setProperty('--cf-spin',  (Math.random() > 0.5 ? '' : '-') + randInt(300, 720) + 'deg');
      if (shape === 'diamond') el.style.transform = 'rotate(45deg)';
      confettiLayer.appendChild(el);
    }
    setTimeout(() => { confettiLayer.innerHTML = ''; }, 4000);
  }

  // ── Build a round ─────────────────────────────────────
  function startRound(roundIdx) {
    roundActive = false;
    blobLayer.innerHTML   = '';
    bucketLayer.innerHTML = '';

    const cfg     = ROUNDS[roundIdx];
    // Pick a random subset of colours
    const shuffled = [...COLORS].sort(() => Math.random() - 0.5);
    const activeColors = shuffled.slice(0, cfg.colors);

    pendingBlobs = cfg.colors * cfg.perColor;

    // ── Create buckets ──
    activeColors.forEach((col, ci) => {
      const bucket = document.createElement('div');
      bucket.className = 'bucket';
      bucket.dataset.colorId = col.id;
      bucket.setAttribute('role', 'listitem');
      bucket.setAttribute('aria-label', col.label + ' bucket');
      bucket.style.setProperty('--bucket-color', col.hex);

      const rim  = document.createElement('div'); rim.className  = 'bucket-rim';
      const body = document.createElement('div'); body.className = 'bucket-body';
      const cnt  = document.createElement('div'); cnt.className  = 'bucket-count';
      cnt.textContent = col.emoji;
      cnt.dataset.needed = cfg.perColor;
      cnt.dataset.filled = '0';

      bucket.appendChild(rim);
      bucket.appendChild(body);
      bucket.appendChild(cnt);
      bucketLayer.appendChild(bucket);
    });

    // ── Create blobs — one per colour * perColor, shuffled ──
    const blobDefs = [];
    activeColors.forEach((col, ci) => {
      for (let b = 0; b < cfg.perColor; b++) {
        blobDefs.push({ col, ci });
      }
    });
    // Shuffle blobs so same colours aren't clumped
    blobDefs.sort(() => Math.random() - 0.5);

    const areaW = blobLayer.clientWidth  || window.innerWidth;
    const areaH = blobLayer.clientHeight || (window.innerHeight * 0.55);
    const blobSize = clamp(Math.floor(Math.min(areaW, areaH) * 0.16), 68, 96);

    // Simple non-overlapping placement with retries
    const placed = [];
    blobDefs.forEach(({ col, ci }) => {
      const blob = document.createElement('div');
      blob.className = 'blob';
      blob.dataset.colorId = col.id;
      blob.dataset.colorIdx = ci;
      blob.setAttribute('tabindex', '0');
      blob.setAttribute('role', 'button');
      blob.setAttribute('aria-label', col.label + ' blob — drag to ' + col.label + ' bucket');
      blob.setAttribute('aria-grabbed', 'false');

      const shape = pick(BLOB_SHAPES);
      blob.style.setProperty('--blob-color',  col.hex);
      blob.style.setProperty('--blob-size',   blobSize + 'px');
      blob.style.setProperty('--blob-radius', shape);
      blob.style.setProperty('--wiggle-dur',  rand(2.0, 3.2) + 's');
      blob.style.setProperty('--wiggle-delay', rand(0, 1.5) + 's');
      blob.style.setProperty('--drag-rot', (Math.random() > 0.5 ? '' : '-') + rand(3, 8) + 'deg');
      blob.textContent = pick(BLOB_FACES);

      // Non-overlapping random position
      const margin = blobSize * 0.6;
      let x, y, attempts = 0, ok = false;
      while (!ok && attempts < 40) {
        x = rand(margin, areaW - blobSize - margin);
        y = rand(margin, areaH - blobSize - margin);
        ok = placed.every(p => Math.hypot(p.x - x, p.y - y) > blobSize * 1.3);
        attempts++;
      }
      placed.push({ x, y });

      blob.style.left = x + 'px';
      blob.style.top  = y + 'px';

      // Entrance animation stagger
      blob.style.opacity   = '0';
      blob.style.transform = 'scale(0) rotate(20deg)';
      blob.style.transition = 'opacity 0.3s, transform 0.3s var(--ease-bounce)';
      const delay = placed.length * 60;
      setTimeout(() => {
        blob.style.opacity   = '1';
        blob.style.transform = '';
        // Re-apply wiggle after entrance
        setTimeout(() => { blob.style.transition = ''; }, 350);
      }, delay);

      blobLayer.appendChild(blob);
    });

    renderPips();
    roundActive = true;
  }

  // ── Drag logic ────────────────────────────────────────
  // pointerId → { blobEl, startBlobX, startBlobY, startPtrX, startPtrY }

  function getBlobCenter(blobEl) {
    const r = blobEl.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function getBucketCenter(bucketEl) {
    const r = bucketEl.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function hitTestBucket(cx, cy) {
    const buckets = bucketLayer.querySelectorAll('.bucket');
    let best = null, bestDist = 999999;
    buckets.forEach(b => {
      const bc   = getBucketCenter(b);
      const dist = Math.hypot(cx - bc.x, cy - bc.y);
      // Generous hit radius
      if (dist < 90 && dist < bestDist) { bestDist = dist; best = b; }
    });
    return best;
  }

  // Start dragging a blob
  function startDrag(e, blobEl) {
    if (!roundActive) return;
    unlockAudio();
    playPickup();

    blobEl.classList.add('dragging');
    blobEl.setAttribute('aria-grabbed', 'true');
    blobEl.style.zIndex = String(parseInt(blobEl.style.zIndex || '4') + 1);

    const r  = blobEl.getBoundingClientRect();
    dragging.set(e.pointerId, {
      blobEl,
      offsetX: e.clientX - (r.left + r.width  / 2),
      offsetY: e.clientY - (r.top  + r.height / 2),
    });

    e.preventDefault();
  }

  // Move dragged blob
  function moveDrag(e) {
    if (!dragging.has(e.pointerId)) return;
    e.preventDefault();

    const { blobEl, offsetX, offsetY } = dragging.get(e.pointerId);
    const blobSize = parseFloat(blobEl.style.getPropertyValue('--blob-size')) || 80;

    // Position blob centred on finger minus initial offset
    const newLeft = e.clientX - offsetX - blobSize / 2;
    const newTop  = e.clientY - offsetY - blobSize / 2;
    blobEl.style.left = newLeft + 'px';
    blobEl.style.top  = newTop  + 'px';
    // Override blob-layer parent positioning while dragging (use fixed-like)
    blobEl.style.position = 'fixed';

    // Highlight hovered bucket
    const cx = e.clientX - offsetX;
    const cy = e.clientY - offsetY;
    const hovered = hitTestBucket(cx, cy);
    bucketLayer.querySelectorAll('.bucket').forEach(b => {
      b.classList.toggle('highlight', b === hovered);
    });
  }

  // Drop blob
  function endDrag(e) {
    if (!dragging.has(e.pointerId)) return;
    e.preventDefault();

    const { blobEl, offsetX, offsetY } = dragging.get(e.pointerId);
    dragging.delete(e.pointerId);

    blobEl.classList.remove('dragging');
    blobEl.setAttribute('aria-grabbed', 'false');
    blobEl.style.position = 'absolute';

    // Clear bucket highlights
    bucketLayer.querySelectorAll('.bucket').forEach(b => b.classList.remove('highlight'));

    // Hit-test
    const cx     = e.clientX - offsetX;
    const cy     = e.clientY - offsetY;
    const target = hitTestBucket(cx, cy);

    if (target && target.dataset.colorId === blobEl.dataset.colorId) {
      // ── CORRECT MATCH
      handleCorrectDrop(blobEl, target);
    } else if (target) {
      // ── WRONG BUCKET
      handleWrongDrop(blobEl, target);
    } else {
      // ── Dropped in empty space — fly to a random spot
      snapBackBlob(blobEl);
    }
  }

  function handleCorrectDrop(blobEl, bucketEl) {
    const ci  = parseInt(blobEl.dataset.colorIdx, 10);
    playMatch(ci);
    addScore(10);

    // Animate blob into bucket
    const bc   = getBucketCenter(bucketEl);
    blobEl.style.position = 'fixed';
    blobEl.style.left = (bc.x - parseFloat(blobEl.style.getPropertyValue('--blob-size') || 80) / 2) + 'px';
    blobEl.style.top  = (bc.y - parseFloat(blobEl.style.getPropertyValue('--blob-size') || 80) / 2) + 'px';
    blobEl.classList.add('matched');

    // Update bucket count
    const cnt    = bucketEl.querySelector('.bucket-count');
    const filled = parseInt(cnt.dataset.filled, 10) + 1;
    const needed = parseInt(cnt.dataset.needed, 10);
    cnt.dataset.filled = filled;
    cnt.textContent = '✓'.repeat(filled);
    cnt.animate([{ transform: 'scale(1)' },{ transform: 'scale(1.5)' },{ transform: 'scale(1)' }],
      { duration: 250, easing: 'cubic-bezier(0.34,1.56,0.64,1)' });

    srAnnounce.textContent = blobEl.getAttribute('aria-label').replace('blob — drag to', 'matched to');

    setTimeout(() => {
      if (blobEl.parentNode) blobEl.parentNode.removeChild(blobEl);
    }, 520);

    pendingBlobs--;
    if (pendingBlobs <= 0) {
      setTimeout(handleRoundComplete, 550);
    }
  }

  function handleWrongDrop(blobEl, bucketEl) {
    playWrong();

    // Shake the blob first
    blobEl.classList.add('wrong');
    bucketEl.classList.add('wrong-flash');

    setTimeout(() => {
      blobEl.classList.remove('wrong');
      bucketEl.classList.remove('wrong-flash');
      // After the shake finishes, fly the blob to a random spot
      // well away from the bucket so it's clear to try again elsewhere
      snapBackBlob(blobEl);
    }, 460);

    srAnnounce.textContent = 'Wrong bucket — try again!';
  }

  function snapBackBlob(blobEl) {
    const areaW    = blobLayer.clientWidth  || window.innerWidth;
    const areaH    = blobLayer.clientHeight || (window.innerHeight * 0.55);
    const blobSize = parseFloat(blobEl.style.getPropertyValue('--blob-size') || 80);
    const margin   = blobSize * 0.7;

    // Find a random destination at least 140px from the blob's current spot
    const currentLeft = parseFloat(blobEl.style.left) || 0;
    const currentTop  = parseFloat(blobEl.style.top)  || 0;

    let destX, destY, attempts = 0;
    do {
      destX = rand(margin, areaW - blobSize - margin);
      destY = rand(margin, areaH - blobSize - margin);
      attempts++;
    } while (
      attempts < 20 &&
      Math.hypot(destX - currentLeft, destY - currentTop) < 140
    );

    // Blob is currently position:fixed after the drag.
    // Convert the absolute destination to viewport coords for the animation.
    const layerRect  = blobLayer.getBoundingClientRect();
    const fixedDestX = destX + layerRect.left;
    const fixedDestY = destY + layerRect.top;
    const startLeft  = parseFloat(blobEl.style.left);
    const startTop   = parseFloat(blobEl.style.top);

    blobEl.style.position = 'fixed';

    blobEl.animate([
      { left: startLeft + 'px',  top: startTop  + 'px',
        transform: 'scale(1.05) rotate(0deg)',
        easing: 'cubic-bezier(0.34,1.56,0.64,1)' },
      { left: fixedDestX + 'px', top: fixedDestY + 'px',
        transform: 'scale(0.9) rotate(var(--drag-rot, 4deg))' },
    ], { duration: 440, fill: 'forwards' }).finished.then(() => {
      // Commit final position as absolute inside blob-layer
      blobEl.style.position = 'absolute';
      blobEl.style.left = destX + 'px';
      blobEl.style.top  = destY + 'px';
      // Cancel WAAPI fill so the CSS wiggle animation resumes
      blobEl.getAnimations().forEach(a => a.cancel());
    });
  }

  // ── Pointer event listeners on blob-layer (capture) ──
  blobLayer.addEventListener('pointerdown', function (e) {
    const blob = e.target.closest('.blob');
    if (blob) {
      e.preventDefault();
      blob.setPointerCapture(e.pointerId);
      startDrag(e, blob);
    }
  }, { passive: false });

  blobLayer.addEventListener('pointermove', moveDrag, { passive: false });
  blobLayer.addEventListener('pointerup',   endDrag,  { passive: false });
  blobLayer.addEventListener('pointercancel', e => {
    if (dragging.has(e.pointerId)) {
      const { blobEl } = dragging.get(e.pointerId);
      dragging.delete(e.pointerId);
      blobEl.classList.remove('dragging');
      blobEl.style.position = 'absolute';
      bucketLayer.querySelectorAll('.bucket').forEach(b => b.classList.remove('highlight'));
    }
  });

  // ── Keyboard drag (accessibility) ────────────────────
  // Tab to a blob, Space/Enter to pick up, Arrow keys to move,
  // Space/Enter to drop onto nearest bucket
  let kbBlob   = null;
  let kbOffset = { x: 0, y: 0 };

  document.addEventListener('keydown', function (e) {
    if (!roundActive) return;

    if ((e.key === ' ' || e.key === 'Enter') && !kbBlob) {
      // Pick up focused blob
      const focused = document.activeElement;
      if (focused && focused.classList.contains('blob')) {
        e.preventDefault();
        kbBlob = focused;
        kbBlob.classList.add('dragging');
        kbBlob.setAttribute('aria-grabbed', 'true');
        kbOffset = { x: 0, y: 0 };
        playPickup();
      }
      return;
    }

    if (kbBlob) {
      e.preventDefault();
      const step = 30;
      if (e.key === 'ArrowLeft')  kbOffset.x -= step;
      if (e.key === 'ArrowRight') kbOffset.x += step;
      if (e.key === 'ArrowUp')    kbOffset.y -= step;
      if (e.key === 'ArrowDown')  kbOffset.y += step;

      const r    = kbBlob.getBoundingClientRect();
      const size = parseFloat(kbBlob.style.getPropertyValue('--blob-size') || 80);
      kbBlob.style.position = 'fixed';
      kbBlob.style.left = (r.left + kbOffset.x) + 'px';
      kbBlob.style.top  = (r.top  + kbOffset.y) + 'px';
      kbOffset = { x: 0, y: 0 };

      // Highlight nearest bucket
      const bc = { x: r.left + kbOffset.x + size/2, y: r.top + kbOffset.y + size/2 };
      const near = hitTestBucket(bc.x, bc.y);
      bucketLayer.querySelectorAll('.bucket').forEach(b => b.classList.toggle('highlight', b === near));

      if (e.key === ' ' || e.key === 'Enter') {
        // Drop
        const r2  = kbBlob.getBoundingClientRect();
        const cx  = r2.left + r2.width  / 2;
        const cy  = r2.top  + r2.height / 2;
        const tgt = hitTestBucket(cx, cy);

        kbBlob.classList.remove('dragging');
        kbBlob.setAttribute('aria-grabbed', 'false');
        bucketLayer.querySelectorAll('.bucket').forEach(b => b.classList.remove('highlight'));

        if (tgt && tgt.dataset.colorId === kbBlob.dataset.colorId) {
          handleCorrectDrop(kbBlob, tgt);
        } else if (tgt) {
          handleWrongDrop(kbBlob, tgt);
        } else {
          snapBackBlob(kbBlob);
        }
        kbBlob = null;
      }
    }
  });

  // ── Round complete ────────────────────────────────────
  function handleRoundComplete() {
    roundActive = false;
    playCelebration();
    spawnConfetti(45);

    roundEmoji.textContent = ROUND_EMOJIS[currentRound] || '🎊';
    roundStars.textContent = '⭐'.repeat(Math.min(currentRound + 1, 5));
    roundOverlay.setAttribute('aria-hidden', 'false');
    roundOverlay.classList.remove('hide');
    roundOverlay.classList.add('show');
    srAnnounce.textContent = 'Round complete! Well done!';
    addScore(currentRound === ROUNDS.length - 1 ? 50 : 25);

    const isLast = currentRound >= ROUNDS.length - 1;

    setTimeout(() => {
      roundOverlay.classList.remove('show');
      roundOverlay.classList.add('hide');
      setTimeout(() => {
        roundOverlay.setAttribute('aria-hidden', 'true');
        roundOverlay.classList.remove('hide');
        if (isLast) {
          handleWin();
        } else {
          currentRound++;
          startRound(currentRound);
        }
      }, 380);
    }, 1800);
  }

  function handleWin() {
    playWin();
    spawnConfetti(80);
    winOverlay.setAttribute('aria-hidden', 'false');
    winOverlay.classList.add('show');
    srAnnounce.textContent = 'Amazing! You sorted all the colours!';

    // Restart after 3s
    setTimeout(() => {
      winOverlay.classList.remove('show');
      winOverlay.classList.add('hide');
      setTimeout(() => {
        winOverlay.setAttribute('aria-hidden', 'true');
        winOverlay.classList.remove('hide');
        currentRound = 0;
        score        = 0;
        scoreNumEl.textContent = '0';
        startRound(0);
      }, 380);
    }, 3200);
  }

  // ── Init ──────────────────────────────────────────────
  startRound(0);

}); // end DOMContentLoaded