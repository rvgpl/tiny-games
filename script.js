// ── Decorative background (aria-hidden, no keyboard interaction) ──
const palette = [
  "#FF6B6B",
  "#FFD93D",
  "#6BCB77",
  "#4D96FF",
  "#C77DFF",
  "#FF9A3C",
  "#FF6FD8",
];
const starChars = ["★", "✦", "✧", "◆", "●"];
const bg = document.getElementById("bgShapes");

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

for (let i = 0; i < 18; i++) {
  const el = document.createElement("div");
  el.className = "shape";
  const size = rand(60, 220);
  el.style.cssText = `width:${size}px;height:${size}px;left:${rand(0, 100)}%;top:${rand(0, 100)}%;background:${pick(palette)};animation-duration:${rand(6, 14)}s;animation-delay:${-rand(0, 8)}s`;
  bg.appendChild(el);
}

for (let i = 0; i < 14; i++) {
  const s = document.createElement("div");
  s.className = "star";
  s.textContent = pick(starChars);
  s.setAttribute("aria-hidden", "true");
  s.style.cssText = `left:${rand(0, 100)}%;top:${rand(0, 100)}%;color:${pick(palette)};animation-duration:${rand(1.5, 3.5)}s;animation-delay:${-rand(0, 2)}s`;
  bg.appendChild(s);
}
