# 🎈 Tiny Games for Tiny Humans

> Free browser-based touch games for tiny humans. No ads. No tracking. No accounts.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![No dependencies](https://img.shields.io/badge/dependencies-none-brightgreen)
![Works offline](https://img.shields.io/badge/works-offline-blue)

---

## What is this?

A growing collection of tiny, self-contained browser games built for toddlers and young children. Every game is a **single HTML file** with zero external dependencies — no frameworks, no build steps, no tracking scripts, no accounts. Just open and play.

The games are designed to be:

- **Touch-first** — large tap targets, responsive to little fingers
- **Visually bold** — bright saturated colours, chunky shapes, emoji-driven
- **Sound-enabled** — all audio generated via the Web Audio API (no audio files)
- **Instant** — no loading screens, no sign-ups, no pop-ups
- **Offline-capable** — works after the page has loaded, no internet needed

---

## 🕹️ Games

| Game                | Status  | Description                                 |
| ------------------- | ------- | ------------------------------------------- |
| 🎈 **Balloon Pop**  | ✅ Live | Tap colourful floating balloons to pop them |
| 🎨 **Paint Splat**  | ✅ Live | Finger-paint with bright colours            |
| 🌈 **Rainbow Sort** | 🔜 Soon | Drag blobs into matching colour buckets     |
| ⭐ **Star Catcher** | 🔜 Soon | Touch falling stars before they disappear   |
| 🎵 **Music Maker**  | 🔜 Soon | Tap buttons to build funny sounds and songs |
| 🔷 **Shape Sorter** | 🔜 Soon | Drag shapes into matching holes             |

---

## 🗂️ Project structure

```
tiny-games/
├── index.html          # Landing page
├── games
    ├── balloon-pop
        ├── index.html
        ├── styles.css
        ├── script.js
        ├── og-image.png
├── README.md
└── og-image.png        # Open Graph share image
```

Each game is fully self-contained in its own directory. The styles and javascript are split into their separate files.

---

## 🚀 Getting started

No build tools. No npm install. No config.

```bash
git clone https://github.com/rvgpl/tiny-games.git
cd tiny-games
open index.html
# or double-click index.html in your file explorer
```

---

## 🏗️ How games are built

Every game follows the same rules:

- **Simple HTML file** — CSS, JS, and markup in their own files.
- **No external dependencies** — no CDN links, no audio files
- **Web Audio API** — all sounds synthesised in code
- **CSS/SVG/emoji only** — no external images
- **Touch + click** — works on mobile Safari, Chrome, and desktop
- **No reading required** — fully visual and audio feedback

## 🎨 Landing page

`index.html` is the main hub. It's built with:

- **CSS `@layer`** — `reset → tokens → base → layout → components → animations → utilities`
- **CSS custom properties** — full design token system for colours, spacing, typography, shadows, and per-card accents
- **Keyboard navigation** — skip link, `:focus-visible` ring, for interactive vs static cards
- **Accessibility** — `aria-label`, `aria-hidden` on decorations, `role="list"`, `.sr-only`, `prefers-reduced-motion` support
- **Full meta tags** — Open Graph, Twitter Card, canonical URL, theme-color

## 📄 Licence

MIT — do whatever you like with it. See [LICENSE](LICENSE) for details.

---

Made with 💛 by [Ravigopal Kesari](https://www.ravigopal.com) for the little ones.
