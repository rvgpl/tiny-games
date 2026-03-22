'use strict';

/* ═══════════════════════════════════════════════════════════
   STAR CATCHER — star-catcher.js
   Touch golden stars — watch them arc into your basket!
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

function playCatch(isBonus) {
  unlockAudio();
  const ctx = getAC(), t = ctx.currentTime;
  const freqs = isBonus
    ? [880, 1108, 1318, 1760, 2093]   // bright ascending arpeggio
    : [659, 880];                       // simple double chime

  freqs.forEach((freq, i) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    const st   = t + i * (isBonus ? 0.07 : 0.09);
    osc.type = 'sine'; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, st);
    gain.gain.linearRampToValueAtTime(isBonus ? 0.22 : 0.28, st + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, st + 0.26);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(st); osc.stop(st + 0.30);
  });
}

function playLand() {
  // Short soft clink when star lands in basket
  unlockAudio();
  const ctx = getAC(), t = ctx.currentTime;
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle'; osc.frequency.setValueAtTime(1200, t);
  osc.frequency.exponentialRampToValueAtTime(600, t + 0.10);
  gain.gain.setValueAtTime(0.20, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(t); osc.stop(t + 0.14);
}

function playMiss() {
  unlockAudio();
  const ctx = getAC(), t = ctx.currentTime;
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle'; osc.frequency.setValueAtTime(280, t);
  osc.frequency.exponentialRampToValueAtTime(110, t + 0.20);
  gain.gain.setValueAtTime(0.16, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(t); osc.stop(t + 0.24);
}

function playLevelUp() {
  unlockAudio();
  const ctx = getAC();
  [523, 659, 784, 1047].forEach((freq, i) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    const t    = ctx.currentTime + i * 0.10;
    osc.type = 'sine'; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.32);
  });
}

function playGameOver() {
  unlockAudio();
  const ctx = getAC();
  [523, 415, 349, 261].forEach((freq, i) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    const t    = ctx.currentTime + i * 0.14;
    osc.type = 'sine'; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.38);
  });
}

// ── Helpers ───────────────────────────────────────────────
const rand    = (a, b) => a + Math.random() * (b - a);
const clamp   = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ── SVG star builder ──────────────────────────────────────
// Returns an inline SVG element with a proper 5-pointed star path.
// viewBox is 100×100 centred at 50,50. Rounded tips via strokeLinecap
// are emulated by using a path with slightly curved points.
// We use SVG <defs> with a radialGradient for the golden fill.
// The SVG is overflow:visible so the glow filter on the wrapper shows.

function makeSVGDefs() {
  // One shared <svg> hidden off-screen holds the gradient defs
  // so every star SVG can reference the same gradients.
  if (document.getElementById('starDefs')) return;
  const defsSvg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  defsSvg.id = 'starDefs';
  defsSvg.setAttribute('width','0');
  defsSvg.setAttribute('height','0');
  defsSvg.style.position = 'absolute';
  defsSvg.innerHTML = `
    <defs>
      <radialGradient id="starGrad" cx="40%" cy="32%" r="62%">
        <stop offset="0%"   stop-color="#FFFDE7"/>
        <stop offset="30%"  stop-color="#FFE566"/>
        <stop offset="65%"  stop-color="#FFD600"/>
        <stop offset="100%" stop-color="#FFA000"/>
      </radialGradient>
      <radialGradient id="starGradBonus" cx="38%" cy="30%" r="65%">
        <stop offset="0%"   stop-color="#FFFFFF"/>
        <stop offset="20%"  stop-color="#FFF9C4"/>
        <stop offset="50%"  stop-color="#FFE566"/>
        <stop offset="80%"  stop-color="#FFD600"/>
        <stop offset="100%" stop-color="#FF8F00"/>
      </radialGradient>
    </defs>`;
  document.body.appendChild(defsSvg);
}

// Compute 5-pointed star path centred at (cx,cy) with outer radius R and inner r.
// Returns an SVG path d string.
function starPath(cx, cy, R, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const angle  = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? R : r;
    pts.push([
      cx + radius * Math.cos(angle),
      cy + radius * Math.sin(angle),
    ]);
  }
  return pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join(' ') + ' Z';
}

function makeStarSVG(sz, isBonus) {
  const ns  = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('width',  sz);
  svg.setAttribute('height', sz);
  svg.setAttribute('overflow', 'visible');
  svg.className.baseVal = 'star-svg';
  svg.style.setProperty('--sz', sz + 'px');
  svg.style.setProperty('--spin-dur', isBonus ? rand(1.4, 2.2) + 's' : rand(5, 10) + 's');

  // Outer R and inner r give the star its pointiness.
  // 50 / 22 = classic sharp star. 50 / 30 = chunkier friendlier star.
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', starPath(50, 50, 48, 20));
  path.setAttribute('fill', isBonus ? 'url(#starGradBonus)' : 'url(#starGrad)');
  // Slightly rounded joins
  path.setAttribute('stroke', isBonus ? '#FFE066' : '#FFD600');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('stroke-linejoin', 'round');
  path.className.baseVal = 'star-fill';

  svg.appendChild(path);
  return svg;
}

// ── Level config ──────────────────────────────────────────
// Size range is now WIDE within every level — a mix of tiny and big stars
// makes each screen feel varied. The min shrinks per level (harder to tap),
// but max stays generous so toddlers always have something easy to hit.
const LEVELS = [
  { catchesNeeded:  8, sizeMin: 55, sizeMax:135, durMin:4.8, durMax:7.0, spawnMin:1100, spawnMax:2000, maxStars:3 },
  { catchesNeeded: 12, sizeMin: 46, sizeMax:120, durMin:4.0, durMax:6.0, spawnMin: 950, spawnMax:1750, maxStars:4 },
  { catchesNeeded: 15, sizeMin: 40, sizeMax:108, durMin:3.4, durMax:5.2, spawnMin: 800, spawnMax:1550, maxStars:5 },
  { catchesNeeded: 18, sizeMin: 34, sizeMax: 96, durMin:2.9, durMax:4.5, spawnMin: 700, spawnMax:1350, maxStars:5 },
  { catchesNeeded: 99, sizeMin: 28, sizeMax: 86, durMin:2.5, durMax:3.8, spawnMin: 600, spawnMax:1200, maxStars:6 },
];

const MAX_MISSES   = 3;
const BONUS_CHANCE = 0.10;   // 10% chance of a spinning bonus star (worth 3)

// ── Boot ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

  const sky             = document.getElementById('sky');
  const starLayer       = document.getElementById('starLayer');
  const bgStarsEl       = document.getElementById('bgStars');
  const arcLayer        = document.getElementById('arcLayer');
  const basket          = document.getElementById('basket');
  const basketCount     = document.getElementById('basketCount');
  const heartsWrap      = document.getElementById('heartsWrap');
  const levelNumEl      = document.getElementById('levelNum');
  const levelBanner     = document.getElementById('levelBanner');
  const levelBannerText = document.getElementById('levelBannerText');
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const gameOverEmoji   = document.getElementById('gameOverEmoji');
  const gameOverTally   = document.getElementById('gameOverTally');
  const playAgainBtn    = document.getElementById('playAgainBtn');
  const srAnnounce      = document.getElementById('sr-announce');

  // ── State
  let score          = 0;
  let levelIdx       = 0;
  let catchesThisLvl = 0;
  let misses         = 0;
  let gameRunning    = false;
  let spawnTimer     = null;
  const activeStars  = new Set();

  // ── Background stars ─────────────────────────────────
  function buildBgStars() {
    bgStarsEl.innerHTML = '';
    for (let i = 0; i < 90; i++) {
      const s  = document.createElement('div');
      s.className = 'bg-star';
      const sz = rand(1, 3.2);
      s.style.cssText = [
        `width:${sz}px`, `height:${sz}px`,
        `left:${rand(0,100)}%`, `top:${rand(0,100)}%`,
      ].join(';');
      s.style.setProperty('--op',     rand(0.15, 0.65).toFixed(2));
      s.style.setProperty('--tw-dur', rand(2, 5.5) + 's');
      s.style.setProperty('--tw-del', rand(0, 4) + 's');
      bgStarsEl.appendChild(s);
    }
  }

  // ── Hearts ────────────────────────────────────────────
  function renderHearts() {
    heartsWrap.innerHTML = '';
    for (let i = 0; i < MAX_MISSES; i++) {
      const h = document.createElement('span');
      h.className  = 'heart' + (i >= MAX_MISSES - misses ? ' lost' : '');
      h.textContent = '❤️';
      h.setAttribute('aria-hidden', 'true');
      heartsWrap.appendChild(h);
    }
  }

  // ── Arc-to-basket animation ───────────────────────────
  function flyToBasket(fromX, fromY, sz, isBonus, onArrival) {
    const basketRect = basket.getBoundingClientRect();
    const toX = basketRect.left + basketRect.width  / 2;
    const toY = basketRect.top  + basketRect.height / 2;

    const ghostSz = Math.max(sz * 0.55, 24);

    // Ghost: an SVG star same shape as the caught one
    const wrap = document.createElement('div');
    wrap.className = 'arc-star';
    wrap.style.position = 'fixed';
    wrap.style.width    = ghostSz + 'px';
    wrap.style.height   = ghostSz + 'px';
    wrap.style.left     = (fromX - ghostSz / 2) + 'px';
    wrap.style.top      = (fromY - ghostSz / 2) + 'px';

    const svg = makeStarSVG(ghostSz, isBonus);
    wrap.appendChild(svg);
    arcLayer.appendChild(wrap);

    // Bezier arc — peaks above both points
    const midX = (fromX + toX) / 2 + rand(-50, 50);
    const midY = Math.min(fromY, toY) - rand(80, 200);

    const steps = 40;
    let   frame = 0;

    function step() {
      if (frame > steps) {
        wrap.remove();
        onArrival();
        return;
      }
      const t  = frame / steps;
      const mt = 1 - t;
      const bx = mt*mt*fromX + 2*mt*t*midX + t*t*toX;
      const by = mt*mt*fromY + 2*mt*t*midY + t*t*toY;
      const sc = 1 - t * 0.72;
      wrap.style.left      = (bx - ghostSz / 2) + 'px';
      wrap.style.top       = (by - ghostSz / 2) + 'px';
      wrap.style.transform = `scale(${sc}) rotate(${t * 300}deg)`;
      wrap.style.opacity   = String(Math.max(0, 1 - t * 0.45));
      frame++;
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ── Sparks on catch ───────────────────────────────────
  function spawnSparks(x, y, count) {
    for (let i = 0; i < count; i++) {
      const sp    = document.createElement('div');
      sp.className = 'spark';
      const sz    = rand(5, 16);
      const angle = (i / count) * Math.PI * 2 + rand(-0.5, 0.5);
      const dist  = rand(35, 110);
      // Use gold tones only
      const lightness = Math.floor(rand(55, 90));
      sp.style.cssText = [
        `left:${x}px`, `top:${y}px`,
        `width:${sz}px`, `height:${sz}px`,
        `background:hsl(45,100%,${lightness}%)`,
        `position:fixed`,
      ].join(';');
      sp.style.setProperty('--tx', (Math.cos(angle) * dist) + 'px');
      sp.style.setProperty('--ty', (Math.sin(angle) * dist) + 'px');
      sp.style.setProperty('--sp-dur', rand(0.40, 0.75) + 's');
      sp.style.setProperty('--sp-del', rand(0, 0.06) + 's');
      arcLayer.appendChild(sp);
      setTimeout(() => sp.remove(), 900);
    }
  }

  // ── Basket receives a star ────────────────────────────
  function landInBasket(pts) {
    score += pts;
    basketCount.textContent = score;

    // Jingle
    playLand();
    basket.classList.remove('jingle');
    void basket.offsetWidth;
    basket.classList.add('jingle');
    setTimeout(() => basket.classList.remove('jingle'), 420);

    // Basket count bounce
    basketCount.animate(
      [{ transform:'scale(1)' },{ transform:'scale(1.8)' },{ transform:'scale(1)' }],
      { duration: 280, easing: 'cubic-bezier(0.34,1.56,0.64,1)' }
    );

    srAnnounce.textContent = score + ' stars collected!';
  }

  // ── Spawn a falling star ──────────────────────────────
  function spawnStar() {
    if (!gameRunning) return;
    const cfg = LEVELS[levelIdx];
    if (activeStars.size >= cfg.maxStars) return;

    const isBonus = Math.random() < BONUS_CHANCE;
    const sz      = Math.round(rand(cfg.sizeMin, cfg.sizeMax));
    const wrapSz  = Math.round(sz * 1.4);
    const dur     = rand(cfg.durMin, cfg.durMax);
    const skyW    = sky.clientWidth  || window.innerWidth;

    const x = rand(wrapSz * 0.2, skyW - wrapSz * 1.2);

    // ── Wrapper (pointer events + fall + glow)
    const wrap = document.createElement('div');
    wrap.className = 'star-wrap' + (isBonus ? ' bonus' : '');
    wrap.style.left = x + 'px';
    wrap.style.top  = (-wrapSz - 10) + 'px';
    wrap.style.setProperty('--sz',  sz  + 'px');
    wrap.style.setProperty('--dur', dur + 's');
    wrap.setAttribute('tabindex', '0');
    wrap.setAttribute('role', 'button');
    wrap.setAttribute('aria-label', (isBonus ? 'Bonus star worth 3' : 'Falling star') + ' — tap to catch!');

    // ── SVG star shape
    const starSvg = makeStarSVG(sz, isBonus);
    wrap.appendChild(starSvg);
    starLayer.appendChild(wrap);
    activeStars.add(wrap);

    let caught = false;

    // ── Catch handler
    function catchStar(e) {
      if (!gameRunning || caught) return;
      if (e && e.preventDefault) e.preventDefault();
      caught = true;
      unlockAudio();
      activeStars.delete(wrap);

      // Where is the star right now (viewport coords)?
      const r  = wrap.getBoundingClientRect();
      const cx = r.left + r.width  / 2;
      const cy = r.top  + r.height / 2;

      // 1. Catch flash on the wrapper
      wrap.classList.add('caught');

      // 2. Sparks
      spawnSparks(cx, cy, isBonus ? 24 : 14);

      // 3. Sound
      playCatch(isBonus);

      // 4. After flash, remove and arc the ghost to basket
      setTimeout(() => {
        wrap.remove();
        const pts = isBonus ? 3 : 1;
        flyToBasket(cx, cy, sz, isBonus, () => {
          landInBasket(pts);

          catchesThisLvl++;
          const cfg = LEVELS[levelIdx];
          if (catchesThisLvl >= cfg.catchesNeeded && levelIdx < LEVELS.length - 1) {
            levelIdx++;
            catchesThisLvl = 0;
            levelNumEl.textContent = levelIdx + 1;
            levelNumEl.animate(
              [{ transform:'scale(1)' },{ transform:'scale(1.6)' },{ transform:'scale(1)' }],
              { duration:280, easing:'cubic-bezier(0.34,1.56,0.64,1)' }
            );
            showLevelBanner();
            playLevelUp();
            srAnnounce.textContent = 'Level ' + (levelIdx + 1) + '!';
          }
        });
      }, 290);
    }

    wrap.addEventListener('pointerdown', catchStar, { passive: false });
    wrap.addEventListener('keydown', e => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); catchStar(); }
    });

    // ── Miss: star reaches bottom
    const missMs = (dur + 0.08) * 1000;
    const missTimer = setTimeout(() => {
      if (caught || !gameRunning) { if (!caught) wrap.remove(); return; }
      caught = true;
      activeStars.delete(wrap);
      wrap.classList.add('missed');
      playMiss();

      misses++;
      renderHearts();

      const lostHearts = heartsWrap.querySelectorAll('.heart.lost');
      if (lostHearts.length) {
        lostHearts[lostHearts.length - 1].animate(
          [{ transform:'scale(1.5)' },{ transform:'scale(0.6)' },{ transform:'scale(0.72)' }],
          { duration: 380, easing: 'ease' }
        );
      }

      srAnnounce.textContent = 'Missed! ' + (MAX_MISSES - misses) + ' chances left.';
      setTimeout(() => wrap.remove(), 400);
      if (misses >= MAX_MISSES) setTimeout(showGameOver, 520);
    }, missMs);

    wrap.addEventListener('pointerdown', () => clearTimeout(missTimer), { once: true });
  }

  // ── Spawn loop ────────────────────────────────────────
  function scheduleSpawn() {
    if (!gameRunning) return;
    const cfg   = LEVELS[levelIdx];
    const delay = rand(cfg.spawnMin, cfg.spawnMax);
    spawnTimer  = setTimeout(() => { spawnStar(); scheduleSpawn(); }, delay);
  }

  // ── Level banner ──────────────────────────────────────
  function showLevelBanner() {
    const msgs = ['⭐ Level Up!', '🌟 Faster!', '✨ Amazing!', '💫 Star Pro!', '🏆 Legend!'];
    levelBannerText.textContent = msgs[Math.min(levelIdx - 1, msgs.length - 1)];
    levelBanner.classList.remove('show');
    void levelBanner.offsetWidth;
    levelBanner.classList.add('show');
    setTimeout(() => levelBanner.classList.remove('show'), 2000);
  }

  // ── Game over ─────────────────────────────────────────
  function showGameOver() {
    gameRunning = false;
    clearTimeout(spawnTimer);
    activeStars.forEach(w => w.remove());
    activeStars.clear();
    arcLayer.innerHTML = '';

    playGameOver();

    gameOverEmoji.textContent = score >= 25 ? '🏆' : score >= 12 ? '🌟' : '🌙';
    gameOverTally.textContent = '⭐ ' + score;

    gameOverOverlay.classList.add('show');
    gameOverOverlay.setAttribute('aria-hidden', 'false');
    playAgainBtn.focus();
    srAnnounce.textContent = 'Game over! ' + score + ' stars. Press play to try again.';
  }

  // ── Start / restart ───────────────────────────────────
  function startGame() {
    score = 0; levelIdx = 0; catchesThisLvl = 0; misses = 0;
    gameRunning = true;

    basketCount.textContent  = '0';
    levelNumEl.textContent   = '1';

    renderHearts();
    starLayer.innerHTML = '';
    arcLayer.innerHTML  = '';
    activeStars.clear();

    gameOverOverlay.classList.remove('show');
    gameOverOverlay.setAttribute('aria-hidden', 'true');

    // Stagger first two stars so screen isn't immediately empty
    setTimeout(spawnStar, 500);
    setTimeout(spawnStar, 1100);
    scheduleSpawn();
  }

  // ── Controls ──────────────────────────────────────────
  playAgainBtn.addEventListener('click', startGame);
  playAgainBtn.addEventListener('pointerdown', e => e.stopPropagation());
  gameOverOverlay.addEventListener('pointerdown', e => e.stopPropagation());

  // ── Init ──────────────────────────────────────────────
  makeSVGDefs();
  buildBgStars();
  startGame();

}); // end DOMContentLoaded
