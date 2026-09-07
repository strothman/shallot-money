# 🧅 Shallot Money — Retail Receipt Harvesters Guide

Easily harvest order histories with **exact dates, penny-accurate totals, and complete line-item receipt breakdowns** from the 4 major grocery & retail stores.

Each script runs **100% locally in your browser** (Chrome or Edge) without sharing passwords or sending data to third parties.

---

## 🛒 Supported Retailers & Harvester Scripts

| Store | Order History URL | Harvester Script | Default Category |
| :--- | :--- | :--- | :--- |
| **Kroger** | [kroger.com/mypurchases](https://www.kroger.com/mypurchases) | [`kroger_harvester.js`](kroger_harvester.js) | `groceries` (or `gas` for fuel, `shopping` for pure runs) |
| **Walmart** | [walmart.com/orders](https://www.walmart.com/orders) | [`walmart_harvester.js`](walmart_harvester.js) | `groceries` (or `shopping` for pure runs) |
| **Sam's Club** | [samsclub.com/account/orders](https://www.samsclub.com/account/orders) | [`samsclub_harvester.js`](samsclub_harvester.js) | `groceries` (or `shopping` for pure runs) |
| **Target** | [target.com/orders](https://www.target.com/orders) | [`target_harvester.js`](target_harvester.js) | `groceries` (or `shopping` for pure runs) |

---

## ⚡ How to Run Any Harvester (3 Quick Steps)

### Step 1: Open Store Orders in Browser
1. Open **Google Chrome** or **Microsoft Edge**.
2. Log into your account and navigate to the order history page (see table above).

### Step 2: Paste the Script in Developer Console
1. Press **F12** on your keyboard (or right-click $\rightarrow$ **Inspect**).
2. Click the **Console** tab at the top.
3. Open the corresponding `.js` file from the [`companion/`](.) folder:
   - For Kroger: Copy all text from [`kroger_harvester.js`](kroger_harvester.js)
   - For Walmart: Copy all text from [`walmart_harvester.js`](walmart_harvester.js)
   - For Sam's Club: Copy all text from [`samsclub_harvester.js`](samsclub_harvester.js)
   - For Target: Copy all text from [`target_harvester.js`](target_harvester.js)
4. Paste it into the Console and press **Enter**.
5. Watch it stream the receipts and auto-scroll. When finished, your browser will immediately download the CSV (e.g. `shallot_kroger_itemized_history.csv`).

### Step 3: Import into Shallot Money
1. Open **Shallot Money** (on your phone, tablet, or PC).
2. Tap **Settings & Budget** (⚙️).
3. Under **Backup & Restore**, tap **Import CSV** and select your downloaded file.
4. **Done!**
   - **Zero Duplicates**: Shallot Money automatically matches by date, merchant, and dollar amount. If you already have bank transactions, it simply attaches the itemized receipt without creating duplicates!
   - **No Legacy "Food" Categories**: Everything automatically routes into **Groceries** (or Gas & Auto for fuel).
   - **Item Breakdown**: Tap on any transaction card to expand the purchased items drawer!

---

## ✂️ Handling "Mixed Baskets" (Groceries + Stuffed Animals, Toys, Clothes)

When you buy groceries plus a non-grocery item (like a stuffed animal for your son, a shirt, or a video game), Shallot Money protects your bank reconciliation while giving you 1-tap splitting:

1. **Initial Bank Integrity**: The purchase imports as a single swipe matching your bank statement (e.g., `$84.74` at Kroger).
2. **Expand the Card**: Tap the receipt pill (`🛒 3 items`) to open the drawer.
3. **Smart Badges**: Each item chip shows its smart category (🥦 for food, 🛍️ for toys/shopping, 💊 for pharmacy).
4. **1-Tap "Split"**: Tap the **✂️ Split** button on the non-grocery item chip (e.g., *Disney Stitch Plush*).
5. **Confirm**: A balance comparison modal appears:
   - Remaining in **Groceries**: `$69.75`
   - New in **Shopping**: `$14.99`
   - Total still matches: `$84.74` *(zero discrepancy with your bank statement!)*
6. **Pure Shopping Trips**: If you went to Target, Kroger, or Walmart and *only* bought toys, clothes, or electronics, the harvester automatically categorizes the whole transaction as **Shopping** right out of the box.

---

## 🥦 Split-Tender EBT / SNAP Tracking

If you pay for part of an order with **EBT (SNAP)** and the rest with **Credit Card, Debit, or Cash**:

1. **Automatic Tender Detection**:
   - The harvester reads the payment breakdown on the receipt (e.g. `SNAP / EBT $50.00` and `VISA $34.74`).
2. **Penny-Accurate Split Rows**:
   - It exports **two separate rows** in the CSV:
     - `Kroger (Card)` $\rightarrow$ `$34.74`
     - `Kroger (EBT)`  $\rightarrow$ `$50.00`
3. **Flawless Bank Matching**:
   - When you reconcile your checking account or credit card statement, the `$34.74` row matches your bank swipe to the exact penny!
4. **Visual EBT Badges in Shallot Money**:
   - Transactions tagged with `(EBT)` display a green sprout badge (`🌱 EBT`) on the dashboard and history, so you can easily track benefit spending.
   - Since EBT is factored into your monthly pool at the top, both rows count normally toward your overall spending.

---

## 💡 Tips for Family (e.g. Running on Mom's Computer)
* You don't need to install Python, Node.js, or any software.
* All you need is the browser she normally uses to shop on Kroger, Walmart, Sam's Club, or Target.
* When she runs it, the CSV downloads directly into her `Downloads` folder, ready to be sent or imported into Shallot Money.
