<div align="center">

<img src="public/icon.png" width="120" height="120" alt="Shallot Money Icon" style="border-radius: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.4);" />

# Shallot Money 🧅💰
**A sleek, mobile-optimized spending tracker and monthly budget planner built with the signature Shallot Plum design system.**

[![Version](https://img.shields.io/badge/version-1.3.0-blue.svg?style=flat-square)](CHANGELOG.md)
[![Platform](https://img.shields.io/badge/Platform-Mobile%20PWA%20%7C%20Web-orange.svg?style=flat-square)](#-mobile-first-experience)
[![Theme](https://img.shields.io/badge/Theme-Shallot%20Plum%20%26%20Copper-purple.svg?style=flat-square)](shallot-theme.css)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg?style=flat-square)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-success.svg?style=flat-square)](public/manifest.json)
[![Build](https://img.shields.io/badge/Build-Vite-teal.svg?style=flat-square)](package.json)

<p align="center">
  <a href="#-key-features"><strong>✨ Key Features</strong></a> •
  <a href="#-mobile-first-experience">Mobile First</a> •
  <a href="#-quick-start--launchers">Quick Start</a> •
  <a href="#-theme-system">Shallot Theme</a> •
  <a href="#-excel-integration">Excel Sync</a> •
  <a href="CHANGELOG.md">Changelog</a>
</p>

</div>

---

## 📱 Mobile-First Experience

> [!IMPORTANT]
> **Shallot Money is optimized for single-handed mobile use.** Built as a lightweight, touch-native Progressive Web App (PWA) with custom safe-area insets, fluid modal sheets, and instant feedback.

- **One-Handed Navigation**: Easy-to-reach bottom navigation bar across **Dashboard**, **Log Expense**, **History**, and **Analysis**.
- **Interactive Budget Pools**: Real-time monthly spending pool balance with dynamic progress bars and quick-edit income triggers.
- **Offline & Local Storage**: 100% private. All your financial data is saved locally on your device with instant persistence.
- **Home Screen Installable**: Add to iOS or Android home screens with full standalone window mode.

---

## ✨ Key Features

### 1. 📊 Dynamic Budget Pool & Breakdown
- Set your monthly income and track your **Monthly Pool Remaining** in real time.
- Visual breakdown cards for **Weekly Spending**, **Monthly Bills**, and **Discretionary Spending**.
- Toggle bill visibility inside breakdowns with 1 tap (`Bills Hidden` / `Bills Shown`).

### 2. ⚡ Rapid Expense Logging
- Smart keypad input with pre-calculated quick amounts ($5, $10, $20, $50, $100).
- Categorized tagging: **Food & Dining**, **Housing & Utilities**, **Transportation**, **Entertainment**, **Health**, **Personal**, and custom subcategories.
- Date picker with quick offsets for yesterday and past week entries.

### 3. 📈 Financial History & Trends
- Chronological spending feed with category badges, amounts, and dates.
- Filter by category or time range (Week, Month, Year).
- Delete and edit expenses on the fly.

### 4. 🎨 Shallot Plum & Multi-Theme Switcher
- Flagship **Shallot Plum & Warm Copper Glow** palette (`#180d21`, `#d48244`, `#f39c12`) with `Outfit` typography.
- Alternate seasonal and aesthetic color schemes: *Antigravity IDE*, *Christmas*, *Halloween*, *July 4th*, *Glacier*, and *Valentine*.

### 5. 📑 Excel & CSV Spreadsheet Sync
- **One-Tap Export**: Download all expenses as formatted CSV for Excel or Google Sheets.
- **Smart CSV Import**: Import bank statements or previous budget spreadsheets directly.
- **Python Sync Script**: Automated bidirectional Excel synchronization via `scripts/sync_excel.py`.

---

## 🚀 Quick Start & Launchers

### Windowless Desktop Launchers (Windows)
Double-click either launcher in the project root to start the dev server silently with **zero terminal window flash** and open your browser automatically:
- **`start.vbs`** (Recommended) — 100% silent background launcher.
- **`start.bat`** — Batch wrapper for easy double-clicking.
- **`stop.bat`** — Cleanly shuts down the background server when finished.

### Command Line
```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Build for production
npm run build
```

---

## 🎨 Theme System

Shallot Money uses the unified **Shallot Plum** design tokens shared across the Shallot app ecosystem:

| Token | Value | Description |
| :--- | :--- | :--- |
| **`--shallot-bg-app`** | `#180d21` | Deep Velvet Plum background |
| **`--shallot-bg-card`** | `#261533` | Elevated plum card surface |
| **`--shallot-primary`** | `#d48244` | Warm Shallot Copper glow |
| **`--shallot-accent`** | `#f39c12` | Golden core amber highlight |
| **`--shallot-text-main`** | `#f5eff9` | High-contrast lilac-white |
| **`--shallot-text-muted`** | `#bda8c7` | Secondary lavender grey |
| **`--shallot-border`** | `rgba(212, 130, 68, 0.22)` | Translucent copper glass border |

---

## 📂 Project Structure

```
utilapp-moneytracker/
├── public/
│   ├── favicon.ico         # Multi-size Windows & browser icon
│   ├── icon.ico            # Master desktop icon
│   ├── icon.png            # 512x512 master PWA icon
│   ├── icons.svg           # UI vector sprite icons
│   └── manifest.json       # Web App Manifest
├── scripts/
│   └── sync_excel.py       # Python Excel sync utility
├── src/
│   ├── main.js             # Core application logic & state
│   └── style.css           # Design system & responsive styles
├── index.html              # App entry & mobile viewport shell
├── package.json            # Vite build configuration
├── shallot-theme.css       # Shallot Plum design tokens
├── shallot-theme.json      # Portable theme palette
├── start.vbs               # Silent windowless launcher
├── start.bat               # Desktop start batch wrapper
├── stop.bat                # Dev server stop utility
├── CHANGELOG.md            # Revision history
└── README.md               # Project documentation
```

---

## 📜 Changelog

All notable changes and revision milestones are documented in **[CHANGELOG.md](CHANGELOG.md)**.
