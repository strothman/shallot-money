# Changelog

All notable changes to the **Shallot Money** project are documented in this file.
This changelog is updated with each development revision.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.7.7] - 2026-09-07

### Added & Enhanced
- **Smart Reharvesting & Split-Tender Upgrade Engine**:
  - Safely reharvest and re-import store receipts without fear of creating duplicate entries.
  - Automatically identifies previous single-swipe transactions (e.g. `$72.37` total) that have now been split into separate tender rows (`Store (Card)` and `Store (EBT)`) in a reharvested CSV.
  - Seamlessly replaces the legacy single-swipe row with the clean dual-tender split rows so card charges match bank statements to the penny.
  - Automatically enriches existing transactions with newly extracted line-item prices (e.g. `Item ($X.XX)`) and upgrades categories (e.g. to `shopping` if purely non-grocery).
  - Displays a detailed import summary: `Upgraded X order(s) to clean EBT/Card split tenders`, `Enriched Y existing expense(s)`, and `Skipped Z duplicate row(s)`.

---

## [1.7.6] - 2026-09-07

### Added & Enhanced
- **Split-Tender EBT / SNAP Auto-Detection Across Retail Harvesters**:
  - Automatically identifies split-tender orders where payment was divided between **EBT (SNAP)** and a **Credit Card, Debit Card, or Cash** across Kroger, Walmart, Sam's Club, and Target.
  - Automatically exports two clean rows in the CSV:
    - `Store (Card)` with the exact card charge that matches your bank statement to the penny.
    - `Store (EBT)` with the exact SNAP benefit allowance spent.
- **Visual EBT Badges in Shallot Money**:
  - Expenses tagged with `(EBT)` or `SNAP` display a distinct emerald sprout badge (`🌱 EBT`) on the dashboard and transaction history feeds, making benefit usage instantly recognizable at a glance.
  - Both card and EBT portions seamlessly flow into your monthly pool at the top.

---

## [1.7.5] - 2026-09-07

### Added & Enhanced
- **In-App 1-Tap Receipt Item Splitting (Mixed Superstore Baskets)**:
  - Solves the mixed-basket dilemma (e.g., buying milk and bread, but also a $15 stuffed animal, toy, or apparel item).
  - Inside the expandable **Purchased Items** drawer, each item chip now features a sleek **✂️ Split** button.
  - Tapping **Split** opens the **Split Receipt Item** modal with live balance calculation (e.g., Remaining in Groceries: `$69.75`, New in Shopping: `$14.99`).
  - Automatically deducts the item price from the original parent transaction, removes the split item, and creates a new linked child expense under the chosen category—keeping your budget 100% accurate while preserving exact bank statement swipe reconciliation ($84.74).
- **Smart Category Detection Across All Retail Harvesters (Kroger, Walmart, Sam's Club, Target)**:
  - If an entire order contains only non-grocery merchandise (toys, plush, clothes, electronics, home goods), the harvester automatically categorizes it as **Shopping** directly.
  - Harvesters now extract individual product prices where available on receipt detail pages and cards, auto-filling the in-app split modal with exact prices.
- **Full Retail Harvester Suite (Kroger, Walmart, Sam's Club, Target)**:
  - Added dedicated browser-console companion harvesters for **Walmart** (`walmart_harvester.js`), **Sam's Club** (`samsclub_harvester.js`), and **Target** (`target_harvester.js`), complementing the master **Kroger** harvester (`kroger_harvester.js`).
  - All harvesters include auto-scroll lazy loading to pull past order cards, penny-accurate totals, exact dates, and product line items.
  - Generates ready-to-import CSVs formatted with semicolon-delimited items and defaults to `groceries` (or `gas` for fuel).
- **Unified Retail Import Guide**:
  - Published [`companion/RETAIL_HARVESTERS_GUIDE.md`](file:///c:/Users/strot/Antigravity%20IDE/Shallot-Money/companion/RETAIL_HARVESTERS_GUIDE.md) offering clear 3-step instructions for personal use and family members with no software installation required.
- **Food Category Adoption into Groceries**:
  - Automatically migrates and cleanses legacy `food` categories into `groceries` on app load and CSV import, preventing duplicate tags.
- **Robust Semicolon Item Delimiter**:
  - CSV importer and parser split on semicolons `;` first so product names with internal commas (e.g. *"Fish Oil, 1200mg"*) stay intact as single items.

---

## [1.7.1] - 2026-09-07

### Added & Enhanced
- **Smart CSV Import Deduplication & Dollar Amount Verification**:
  - The CSV importer now checks existing transactions and **strictly verifies the exact dollar amount** (along with date and merchant) before skipping any incoming row.
  - Guarantees that manual edits (e.g. re-categorizing Target from "shopping" to "groceries") are preserved without being reverted or duplicated across overlapping statement imports.
  - If a transaction on the same date at the same merchant has a different dollar amount, it is recognized as a separate purchase and safely imported rather than skipped.
  - Immune to row number shifts across monthly export files.

---

## [1.7.0] - 2026-09-03

### Added & Enhanced
- **In-App Mobile Smart Receipt Pasting & Auto-Merge**:
  - **100% Phone-Only Workflow**: Run full receipt reconciliation directly in mobile browsers without requiring a PC or Python.
  - **1-Tap "Paste Receipt" Button**: Added to the Log Expense screen and Edit Expense modal.
  - **Real-Time Client-Side Receipt Parsing**: Automatically extracts Store Name, Date, Total Amount, and Line Items from copied text (Walmart, Kroger, Sam's Club, Target, Amazon, emails).
  - **Live Preview Card**: Shows detected store, amount, date, and category-badged item chips.
  - **Auto-Fill Log Form**: 1-tap transfers receipt details directly into the Log form and auto-selects the category.
  - **Smart Auto-Merge**: Automatically identifies existing matching transactions in spending history and merges the item breakdown directly into them, avoiding duplicate records.

---

## [1.6.0] - 2026-09-03

### Added & Enhanced
- **Itemized Purchase Breakdowns**:
  - **Expandable Receipt Drawer**: Transactions with purchased items feature a warm copper badge (e.g. `🛒 5 items`) that expands to show each item as an interactive chip in both Recent Spending and History.
  - **Deep Item Search in History**: The History search bar matches against both merchant names and purchased line items (e.g. searching "milk" or "drinks" surfaces matching transactions).
  - **Purchased Items Input**: Added optional "Purchased Items" input fields to both the Log Expense screen and Edit Expense modal.
  - **Smart Item Extraction**: Automatically extracts clean merchant names and individual items from notes/descriptions formatted as `Merchant (item1, item2...)` with 100% backward compatibility.
- **Smart Item Categorization Engine**:
  - **Item-Level Classification Taxonomy (`ITEM_RULES`)**: Built-in rules classifying line items into Groceries, Shopping, Fast Food, Gas & Auto, Bills, Gym & Health, and Entertainment.
  - **Category-Badged Item Chips**: Individual item chips display active category color dots and category labels, with multi-category distribution summaries for mixed store trips.
  - **Real-Time Category Auto-Detection**: As you type items into the Log Expense form, the matching category is automatically detected and selected.
  - **Superstore Disambiguation & Companion Rules**: Synchronized item classification rules with `companion/rules.json`, `scripts/sync_excel.py`, and `companion/reconcile.py`.

---

## [1.5.0] - 2026-08-28

### Added & Enhanced
- **Interactive Chart Drill-Down & Investigation**:
  - **1-Click Weekly & Monthly Bar Drill-Down**: Tap any bar or dollar total in the weekly or monthly breakdown charts to immediately open the History tab filtered to that exact time window!
  - **1-Click Category Breakdown Drill-Down**: Tap any category row in the breakdown lists (e.g. *Shopping in April 2026*) to view every transaction in that category for that period.
  - **Active Filter Banner**: Added an animated, dismissible filter banner with 1-tap **"Clear Filter"** button.
  - **Tactile Hover & Tap Feedback**: Added smooth lift animations and haptic feedback when tapping bars and categories.

---

## [1.4.0] - 2026-08-28

### Added & Enhanced
- **Refined 7-Category Taxonomy & Icon Palette**:
  - `Groceries`: Emerald Green (`#10b981`) • `shopping-basket`
  - `Gas & Auto`: Amber Gold (`#f59e0b`) • `fuel`
  - `Fast Food & Dining`: Coral Red (`#f43f5e`) • `utensils`
  - `Bills & Utilities`: Electric Blue (`#2563eb`) • `receipt`
  - `Gaming & Fun`: Royal Violet (`#8b5cf6`) • `gamepad-2`
  - `Gym & Health`: Cyan Teal (`#0ea5e9`) • `dumbbell`
  - `Shopping`: Rose Pink (`#db2777`) • `shopping-bag`
- **Store Return & Refund Tracking**:
  - Automatically captures store returns and refunds as negative expense credits to accurately adjust monthly totals.
- **Enhanced Reconciler Rules**:
  - Added specialized rules for digital services, gaming platforms, utility providers, and dual gym memberships.

---

## [1.3.0] - 2026-08-28

### Added & Enhanced
- **"Clean Exact Duplicates" Feature**:
  - Added a 1-tap **"Clean Exact Duplicates"** tool in Settings.
  - Automatically identifies and purges duplicate transactions sharing the same date, amount, and merchant name.
  - Automatically creates a rollback recovery snapshot before cleaning duplicates.
- **PC Companion Auto-Deduplication**:
  - Reconciler script automatically deduplicates transactions across overlapping statements and date ranges.

---

## [1.2.0] - 2026-08-28

### Added & Enhanced
- **Custom Spending Categories Suite**:
  - Full freedom to create, edit, rename, customize, and delete expense categories.
- **Curated Icon & Color Palette Picker**:
  - 32 finance, lifestyle, and household icons (coffee, dog, cat, car, fuel, utensils, plane, gift, gym, etc.).
  - 12 tailored vibrant HSL theme colors with automated badge background shading.
- **Quick `+ Add` Tile in Category Grids**:
  - Added an intuitive `+ Add` tile directly inside the Log Expense and Edit Expense category selectors for on-the-fly category creation.
- **Category Manager in Settings**:
  - Added a dedicated **"Manage Categories"** dialog with individual Edit and Delete actions, plus a 1-tap **"Reset to Defaults"** option.
- **Safety Reassignment on Delete**:
  - Automatically checks and safely reassigns existing expenses before deleting a category.
- **Dynamic Weekly & Monthly Chart & Breakdown Sync**:
  - Weekly and monthly stacked bar charts, totals, and category breakdown lists dynamically adapt to any custom categories.
- **Smart CSV Import Mapping**:
  - Automatically detects unknown category names in imported spreadsheets and creates corresponding color-coded categories on the fly.

---

## [1.1.0] - 2026-08-28

### Added & Enhanced
- **Automatic Rolling Snapshots (Recovery System)**:
  - Automatically records rotating state snapshots before deletions, imports, and data resets.
  - Added a **"Restore from Snapshot"** selector in Settings for instant 1-tap recovery.
- **Offline Service Worker (`sw.js`)**:
  - Full PWA Service Worker caching core assets and Google Fonts for 100% offline capability with zero cell signal.
- **Undo Delete Floating Toast**:
  - 5-second floating toast notification with an **"Undo"** action whenever an expense is deleted.
- **Haptic Vibration Feedback**:
  - Subtle tactile haptic pulses (`navigator.vibrate`) on keypad inputs, expense logging, tab navigation, and theme toggling on mobile devices.
- **Quick Date Shortcuts on Log View**:
  - 1-tap chips for **[Today]**, **[Yesterday]**, and **[2d Ago]** to speed up expense entry.
- **Custom Currency Selector**:
  - Global currency preference in Settings supporting `$`, `€`, `£`, `¥`, `₹`, `CHF`, `kr`, `R$`, and `₱`.
- **Security Hardening**:
  - Strict XSS input sanitization (`escapeHTML`) on all descriptions and CSV imports.
  - Hardened Content Security Policy (CSP) meta tag in `index.html`.

---

## [1.0.3] - 2026-08-28

### Added & Enhanced
- **In-App "Check for Updates / Reload" Button**:
  - Added a 1-tap **"Check for Updates / Reload"** button inside Settings.
  - Automatically clears web CacheStorage and executes a hard, cache-busting network reload (`?_t=timestamp`), forcing Android and iOS devices to fetch the latest deployed code instantly without manual browser cache clearing.

---

## [1.0.2] - 2026-08-28

### Added & Enhanced
- **In-App Version Indicator**:
  - Added an official Shallot Money version badge (`v1.0.2`) and build info inside the **Settings** modal.
- **Universal Paste Import Modal**:
  - Added dedicated **"Paste Data"** dialog allowing 1-tap import of raw CSV or JSON data across all Android and iOS devices.
- **Android File Picker Universal Support**:
  - Removed file input MIME restrictions so Android devices can select and import `.csv` and `.json` files without greyed-out limitations.

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
