# Shallot Money — PC Companion & Reconciler 🧅🖥️

A lightweight local Python companion tool that automatically aggregates your **TD Bank**, **Capital One**, and **EBT** statements, cross-references them with your **Kroger** and **Walmart** receipts, auto-categorizes spending, and generates a clean CSV ready for Shallot Money.

---

## 🚀 How to Use (3 Simple Steps):

### 1. Drop Statements into `companion/inputs/`
You can drop any combination of:
- **TD Bank Statements**: `.csv` downloaded from TD online banking.
- **Capital One Statements**: `.csv` downloaded from Capital One online banking.
- **EBT Statements**: `.txt` (copy-pasted from ConnectEBT / ebtEDGE) or `.csv`.
- **Kroger / Walmart Receipts (Optional)**: `.csv`, `.json`, or text exports containing your order totals and item summaries (named e.g. `kroger_orders.csv` or `walmart_receipts.json`).

### 2. Run the Reconciler
Double-click **`run_reconciler.bat`** (or run `python reconcile.py`).
- The script matches bank charges to store receipts (handling bank post delays).
- It auto-assigns categories using `rules.json` (Groceries, Fast Food, Auto, Bills, Shopping, Health, Entertainment).
- It exports `outputs/shallot_money_import.csv` **AND** copies the CSV text directly to your Windows Clipboard!

### 3. Import into Shallot Money
Open **Shallot Money** on your browser or mobile phone:
- Tap **Settings** (⚙️) $\rightarrow$ tap **Paste Data** $\rightarrow$ paste and tap **Import**!
- Or tap **Import CSV** and select `outputs/shallot_money_import.csv`.

---

## ⚙️ Customizing Categories & Rules:
You can edit `companion/rules.json` anytime to teach the reconciler your local store names, subscription services, and personal merchant keywords!
