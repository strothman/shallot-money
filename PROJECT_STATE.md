# Shallot Money — Project State & Technical Architecture 🧅💰

> **Current Version:** `1.5.0`  
> **Repository:** [strothman/Shallot-Money](https://github.com/strothman/Shallot-Money)  
> **Ecosystem:** Shallot Personal Utility Suite (alongside Shallot Kitchen Keeper)  
> **Last Updated:** September 2026

---

## 1. Executive Summary

**Shallot Money** is a mobile-first, privacy-focused personal spending tracker and monthly budget planner. Designed around the signature **Shallot Plum & Warm Copper Glow** design language, it runs as a Progressive Web App (PWA) with 100% offline capability, zero cloud telemetry, and client-side `localStorage` persistence.

The project also includes a Python-powered **PC Companion & Statement Reconciler** (`companion/`) capable of automatically ingesting bank statements (TD Bank, Capital One), EBT transaction logs, and retail receipts (Kroger, Walmart), auto-categorizing spending, matching cross-statement charges, and generating clean imports for the web application.

---

## 2. Technology Stack & Runtime Environment

| Layer | Technologies / Tools | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | Vanilla JavaScript (ES Modules) | Zero heavy frameworks; ultra-fast rendering & low memory footprint. |
| **Build & Bundling** | [Vite 8](https://vitejs.dev/) (`vite`) | Instant Hot Module Replacement (HMR) and optimized production rollup. |
| **Design System** | Custom Vanilla CSS (`src/style.css`, `shallot-theme.css`) | Curated HSL color palette, glassmorphism surfaces, and safe-area insets. |
| **Typography** | Google Fonts (`Outfit`, `Playfair Display`) | Modern, legible mobile typography loaded locally and cached via Service Worker. |
| **Iconography** | [Lucide Icons](https://lucide.dev/) (SVG vector sprites) | 32 dynamic financial and lifestyle icons. |
| **PWA & Offline** | Web App Manifest + Service Worker (`public/sw.js`) | Installable on iOS/Android home screens with standalone window support. |
| **Persistence** | Browser `localStorage` + JSON Snapshots | Client-side privacy-first storage with automatic rolling recovery backups. |
| **Companion Tools** | Python 3.10+ (`companion/reconcile.py`, `scripts/sync_excel.py`) | Statement parsing, cross-receipt reconciliation, deduplication, and clipboard sync. |
| **Desktop Launchers** | Windows VBScript & Batch (`start.vbs`, `start.bat`, `stop.bat`) | Zero-terminal-window silent background launcher for desktop development. |

---

## 3. Architecture & Project Map

```
Shallot-Money/
├── companion/                          # Desktop Statement Reconciler & Ingestion Engine
│   ├── inputs/                         # Drop zone for bank CSVs, EBT logs & receipts
│   ├── outputs/                        # Output folder for generated Shallot imports
│   ├── reconcile.py                    # Multi-source statement matching & rules engine
│   ├── rules.json                      # Regex and keyword merchant categorization rules
│   ├── run_reconciler.bat              # 1-click batch runner for PC companion
│   └── README.md                       # Companion setup and usage instructions
├── public/                             # Static Web & PWA Assets
│   ├── favicon.ico                     # Multi-size Windows & browser icon
│   ├── icon.ico                        # Master high-res desktop shortcut icon
│   ├── icon.png                        # 512x512 PWA emblem with alpha transparency
│   ├── icons.svg                       # Lucide icon SVG sprite sheet
│   ├── manifest.json                   # Web App Manifest for mobile installation
│   └── sw.js                           # Offline caching Service Worker
├── scripts/                            # Automation & Synchronization Scripts
│   └── sync_excel.py                   # Bidirectional Excel spreadsheet sync tool
├── src/                                # Core Application Source Code
│   ├── assets/                         # Vector branding assets
│   ├── imported_expenses.json          # Seed & sample dataset
│   ├── main.js                         # State management, UI routing, charts & event handlers
│   └── style.css                       # Design tokens, layouts, animations & responsive styling
├── index.html                          # HTML5 shell, meta tags, CSP & modals
├── package.json                        # Node package metadata and build scripts
├── package-lock.json                   # Lockfile for reproducible builds
├── shallot-theme.css                   # Unified Shallot Plum CSS custom properties
├── shallot-theme.json                  # Portable palette configuration
├── start.bat                           # Desktop start batch wrapper
├── start.vbs                           # Silent windowless dev launcher
├── stop.bat                            # Vite server termination utility
├── CHANGELOG.md                        # Version history and feature release logs
├── PROJECT_STATE.md                    # Current system state & technical overview (this file)
└── README.md                           # Project presentation & quickstart guide
```

---

## 4. Key Functional Modules

### 4.1. Real-Time Budget Pool & Visual Breakdowns
- **Locked Real-Time Current Month Tracking:** The primary Monthly Pool Remaining card automatically locks to real-time calendar months with spending progress indicators.
- **Weekly & Monthly Chart Breakdowns:** Interactive stacked bar visualizations tracking daily, weekly, and monthly spending patterns.
- **1-Click Chart Drill-Down (v1.5.0):** Tap any bar or category row in weekly/monthly views to immediately jump to the History view pre-filtered to that specific timeframe or category.
- **Bill Toggle:** 1-tap toggle (`Bills Hidden` / `Bills Shown`) to isolate discretionary spending from recurring fixed expenses.

### 4.2. Rapid Expense Logging & Tactile Keypad
- **Quick Amount Buttons:** Pre-calculated shortcuts ($5, $10, $20, $50, $100) for instant entry.
- **Relative Date Shortcuts:** 1-tap chips for **[Today]**, **[Yesterday]**, and **[2d Ago]**.
- **Haptic Feedback:** Native device vibration pulses on keypad taps, category selections, and expense submissions.

### 4.3. Dynamic Category Management & Taxonomy
- **7 Default Categories:**
  1. `Groceries` (`#10b981`, `shopping-basket`)
  2. `Gas & Auto` (`#f59e0b`, `fuel`)
  3. `Fast Food` (`#f43f5e`, `utensils`)
  4. `Bills` (`#2563eb`, `receipt`)
  5. `Gaming & Fun` (`#8b5cf6`, `gamepad-2`)
  6. `Gym & Health` (`#0ea5e9`, `dumbbell`)
  7. `Shopping` (`#db2777`, `shopping-bag`)
- **Custom Categories Suite:** Add, edit, rename, customize, and delete categories with a 32-icon picker and 12-color palette.
- **Safe Reassignment:** Prevents orphan expenses when deleting categories by prompting for target reassignment.

### 4.4. Data Ingestion, Deduplication & Safety
- **Universal Paste Modal:** Direct clipboard paste support for CSV and JSON across iOS, Android, and Desktop.
- **Fragmented JSON Salvage & Headerless CSV Fallback:** Resilient regex parsing engine that recovers partially copied or headerless transaction data.
- **Duplicate Purge Engine:** 1-tap **"Clean Exact Duplicates"** in Settings with automatic pre-clean rollback snapshots.
- **Rolling Snapshots:** Automatic historical state backups recorded prior to any destructive operation or bulk import, restorable via Settings.
- **XSS Sanitization & CSP:** Strict HTML escaping on all merchant descriptions, amounts, and imported text fields.

### 4.5. Theme & Presentation Engine
- **Shallot Plum Flagship Palette:** Deep Velvet Plum (`#180d21`), Elevated Card Surfaces (`#261533`), Warm Copper Glow (`#d48244`), and Golden Core Highlights (`#f39c12`).
- **Multi-Theme Switcher:** Includes *Shallot Plum*, *Antigravity IDE*, *Christmas*, *Halloween*, *July 4th*, *Glacier*, and *Valentine* themes.
- **In-App Hard Reload / Cache Bust:** 1-tap button in Settings to purge `CacheStorage` and force-refresh the newest PWA code without manual browser intervention.

---

## 5. Application State Schema

The client application state is stored under the `shallot_money_state` `localStorage` key with the following schema:

```javascript
{
  "income": 0.00,                      // Number: Monthly income budget
  "currency": "$",                     // String: Active currency symbol ($, €, £, ¥, ₹, etc.)
  "categories": [                      // Array: Category definitions
    {
      "id": "groceries",
      "label": "Groceries",
      "iconName": "shopping-basket",
      "color": "#10b981",
      "bg": "rgba(16, 185, 129, 0.15)"
    }
  ],
  "expenses": [                        // Array: Transaction records
    {
      "id": "exp-1724889600000-1234",
      "date": "2026-08-28",
      "amount": 42.50,
      "category": "groceries",
      "description": "Trader Joe's",
      "timestamp": 1724889600000
    }
  ],
  "selectedCategory": "groceries",     // String: Active selection in log view
  "theme": "shallot",                  // String: Selected theme identifier
  "currentWeekOffset": 0,              // Number: Week navigation offset
  "currentMonthOffset": 0,             // Number: Month navigation offset
  "hideBillsInBreakdown": false        // Boolean: Toggle state for fixed bills in chart
}
```

---

## 6. PC Companion & Reconciler Architecture

The desktop companion tool (`companion/reconcile.py`) implements an automated ETL pipeline:
1. **Source Discovery:** Scans `companion/inputs/` for CSVs, TXT files, and receipt exports.
2. **Normalized Ingestion:**
   - Parses TD Bank debit/checking exports.
   - Parses Capital One credit card transactions.
   - Parses EBT cash/food transaction histories.
   - Parses Walmart & Kroger digital receipt JSON/CSV dumps.
3. **Receipt Matching & Splitting:** Cross-references posted bank debit amounts with retailer receipts to break aggregate charges down into itemized grocery vs. general merchandise categories.
4. **Keyword & Regex Rules Engine:** Applies `companion/rules.json` patterns to assign standard taxonomy tags.
5. **Deduplication:** Merges overlapping statement exports without duplicating shared transactions.
6. **Delivery:** Outputs `companion/outputs/shallot_money_import.csv` and auto-copies the payload to the Windows system clipboard for immediate pasting.

---

## 7. Version History & Release Milestones

- **v1.5.0 (2026-08-28):** Interactive 1-click chart and category breakdown drill-down investigation with active filter banner and tactile feedback.
- **v1.4.0 (2026-08-28):** Refined 7-category taxonomy, store return/refund negative credit tracking, and expanded merchant rules.
- **v1.3.0 (2026-08-28):** In-app duplicate transaction cleaner with safety snapshots and companion auto-deduplication.
- **v1.2.0 (2026-08-28):** Custom categories suite with 32-icon and 12-color picker, dynamic chart synchronization, and safe deletion reassignments.
- **v1.1.0 (2026-08-28):** Rolling snapshot recovery system, offline PWA Service Worker (`sw.js`), undo delete toast, haptics, and security hardening.
- **v1.0.0 (2026-08-28):** Rebranding to Shallot Money, Shallot Plum design tokens overhaul, custom vector emblem, and silent windowless launchers.

---

## 8. Current Health & Roadmap

### Current Status
- **Build Status:** Clean, verified Vite production build with zero lint/runtime errors.
- **Git Status:** Clean working tree on `main` branch, in sync with `origin/main`.
- **Browser Compatibility:** Validated on Chrome, Safari (iOS), Edge, and Firefox.

### Potential Future Enhancements
- [ ] Export directly to encrypted backup files.
- [ ] Optional biometric lock (WebAuthn / TouchID / FaceID) for mobile PWA launches.
- [ ] Recurring recurring bill schedule reminders with projected end-of-month balance forecasting.
- [ ] Multi-currency exchange rate conversion table for travel mode.
