# Changelog

All notable changes to the **Shallot Money** project are documented in this file.
This changelog is updated with each development revision.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.1] - 2026-08-28

### Enhanced & Optimized
- **Tight Icon Crop & Edge Transparency**:
  - Tightly cropped the Shallot Money icon around the emblem badge to eliminate wasted edge padding.
  - Added smooth antialiased alpha transparency to outer corners and borders for seamless rendering across dark and light surfaces.
  - Maximized scale and visual clarity of the glowing golden shallot and currency coin symbol across all standard `.ico` and `.png` resolutions.

---

## [1.0.0] - 2026-08-28

### Rebranded to "Shallot Money" & Design Overhaul
- **Brand Identity**:
  - Rebranded application from generic budget tracker to **Shallot Money** (`shallot-money`).
  - Integrated into the Shallot utility suite alongside `shallot-kitchen-keeper`.
  - Updated web app title, meta tags, and `manifest.json`.

- **Shallot Plum & Copper Theme System**:
  - Imported signature **Shallot Plum** design tokens (`shallot-theme.css` and `shallot-theme.json`).
  - Applied Deep Velvet Plum (`#180d21`), elevated card surfaces (`#261533`), warm copper glows (`#d48244`), and gold highlights (`#f39c12`).
  - Integrated `Outfit` and `Playfair Display` typography via Google Fonts.
  - Added Shallot Plum option to the Theme Color Scheme selector in Settings.

- **Custom Emblem & Unified Icon Assets**:
  - Designed custom **Shallot Money** emblem featuring a stylized golden/copper shallot bulb intertwined with a glowing currency coin and dollar symbol.
  - Generated multi-size `icon.ico` and `favicon.ico` (16×16, 32×32, 48×48, 64×64, 128×128, 256×256) for Windows shortcuts and browser favicons.
  - Generated high-res 512×512 `icon.png` for PWA installation and mobile home screens.
  - Cleaned up obsolete, redundant icon files from `public/`.

- **Silent Windowless Launchers**:
  - Created `start.vbs` for 100% silent dev server background startup and automatic browser launch.
  - Created `start.bat` wrapper for easy double-clicking.
  - Created `stop.bat` to cleanly terminate background Vite processes on port 5173.

- **Repository & Tooling**:
  - Initialized dedicated Git repository at `https://github.com/strothman/shallot-money`.
  - Added comprehensive `README.md` and `CHANGELOG.md`.

---

## [0.1.0] - 2026-08-26

### Initial Prototype
- Initial Vite + Vanilla JS expense tracker foundation.
- Monthly pool calculation, category breakdowns, and weekly spending views.
- LocalStorage state management and initial CSV/Excel sync utilities.
