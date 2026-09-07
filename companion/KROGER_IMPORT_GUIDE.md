# 🧅 Shallot Money — Kroger Mass Purchase Harvester

This tool allows you (or family members like your mom) to automatically extract your entire Kroger order history—including **exact dates, penny-accurate totals, fuel tracking, and complete grocery line items** (*Coca-Cola, Goldfish, milk, produce, etc.*)—and import them directly into Shallot Money in under 60 seconds!

---

## ⚡ Quick 3-Step Guide (For You or Your Mom)

### Step 1: Log in to Kroger
1. Open **Google Chrome** or **Microsoft Edge** on the computer.
2. Go to: **[https://www.kroger.com/mypurchases](https://www.kroger.com/mypurchases)**
3. Make sure you are logged into the Kroger account.

### Step 2: Run the Harvester (Takes ~60 seconds)
1. Press **F12** on the keyboard (or right-click anywhere on the page $\rightarrow$ click **Inspect**).
2. Click the **Console** tab at the top of the developer panel.
3. Open [`companion/kroger_harvester.js`](kroger_harvester.js), copy all the code, paste it into the Console, and press **Enter**.
4. You will see it stream each receipt live on the screen:
   ```
   [1/27] 2026-09-06 | $84.74 | 🛍️ Coca-Cola, Goldfish, Plush...
   [2/27] 2026-09-03 | $57.45 | 🛍️ 2% Milk, Water, Monster...
   ```
5. When finished, your browser will automatically pop up with:
   **`shallot_kroger_itemized_history.csv`** downloaded directly into your **Downloads** folder!

### Step 3: Import into Shallot Money
1. Open **Shallot Money** (on your phone or computer).
2. Tap **Settings & Budget** (⚙️).
3. Tap **Import CSV** and select `shallot_kroger_itemized_history.csv`.
4. **All set!** 
   - The app's exact-match protection ensures no duplicate spending is created.
   - All transactions are automatically tagged as **Groceries** (or **Gas & Auto** for Fuel).
   - Tapping any card expands its **Purchased Items** drawer with full product details!

---

## 🛡️ Privacy & Safety
* **100% Client-Side**: Runs entirely inside your own browser session.
* **No Passwords Shared**: You never need to enter credentials into any third-party app or script.
* **No Memory Leaks**: Uses lightweight micro-workers that clean up after themselves.
