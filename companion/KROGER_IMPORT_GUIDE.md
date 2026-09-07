# Mass Importing Kroger Purchase History 🛒🥦

Kroger protects its servers with Akamai bot detection, which blocks third-party automated tools from logging in. However, because you can log in through your own regular browser, we can safely extract your entire purchase backlog right from inside your authenticated session.

---

## 🚀 3-Step Mass Export Guide

### Step 1: Open Kroger Purchase History
1. Open **Google Chrome**, **Microsoft Edge**, or **Firefox** on your PC.
2. Log into your account and navigate to:
   **[https://www.kroger.com/mypurchases](https://www.kroger.com/mypurchases)**
   *(Make sure you can see your list of past in-store and online purchases).*

### Step 2: Run the Harvester Script
1. Press **F12** on your keyboard (or Right-Click anywhere on the page $\rightarrow$ select **Inspect**).
2. Click on the **Console** tab at the top of the developer panel.
3. Open [`companion/kroger_harvester.js`](kroger_harvester.js), copy all the code, paste it into the Console, and press **Enter**.

### Step 3: What the Script Does
* Automatically scrolls down to trigger lazy loading of older purchases.
* Collects every purchase order on the page.
* Fetches the itemized details for each order using your authenticated session.
* Extracts the **Date**, **Total Amount**, and **All Purchased Items**.
* Automatically triggers a download of:
  **`shallot_kroger_backlog_YYYY-MM-DD.csv`** into your Downloads folder!

---

## 📥 Loading into Shallot Money

Once you have `shallot_kroger_backlog_YYYY-MM-DD.csv`:

### Option A: Direct Web App Import
1. In Shallot Money, go to **Settings** (⚙️) $\rightarrow$ **Import CSV**.
2. Select the downloaded Kroger CSV.
3. Because Shallot Money verifies exact dollar amounts and dates, it will automatically match your bank transactions and enrich them with the purchased items!

### Option B: Companion Reconciler (Cross-Bank Matching)
1. Drop the downloaded CSV into [`companion/inputs/`](inputs/).
2. Run [`run_reconciler.bat`](run_reconciler.bat).
3. The reconciler cross-references your TD Bank charges and Kroger purchases, categorizes all items, and generates a unified import.
