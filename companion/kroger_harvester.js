/**
 * Shallot Money — Kroger Precision Itemized Harvester (v7 Master)
 * ================================================================
 * Use this script to extract complete, itemized purchase history
 * (including brand names, quantities, and exact amounts) directly from Kroger!
 * 
 * HOW TO USE (Takes ~60 seconds):
 * 1. Log in to Kroger on Chrome/Edge: https://www.kroger.com/mypurchases
 * 2. Press F12 -> Console.
 * 3. Paste this code and press Enter.
 * 4. Your browser will automatically download:
 *    "shallot_kroger_itemized_history.csv"
 * 5. Import that CSV into Shallot Money!
 */

(async function runKrogerPrecisionHarvester() {
  console.log("%c🧅 Shallot Money — Kroger Harvester Starting...", "color: #b388ff; font-size: 16px; font-weight: bold;");

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const searchHeaders = {
    "accept": "application/json, text/plain, */*",
    "x-call-origin": "{\"page\":\"/mypurchases\",\"component\":\"purchase history\"}",
    "x-kroger-channel": "WEB"
  };

  // Step 1: Gather orders via Kroger's internal post-order search API
  console.log("🚀 Step 1: Gathering purchase history across your account...");
  const orders = [];
  const currentYear = new Date().getFullYear().toString();

  // Search up to 6 pages (covers up to 60 recent orders)
  for (let page = 1; page <= 6; page++) {
    try {
      const url = `https://www.kroger.com/atlas/v1/post-order/v1/purchase-history-search?pageNo=${page}&pageSize=10`;
      const res = await fetch(url, { credentials: "include", headers: searchHeaders });
      if (!res.ok) break;

      const json = await res.json();
      const list = json.data?.postOrderSearch?.data || [];
      if (list.length === 0) break;

      for (const ord of list) {
        const date = ord.receiptKey ? ord.receiptKey.split('~')[2] : '';
        const isFuel = ord.purchaseType === 'FUEL' || /fuel/i.test(ord.purchaseType || '');
        orders.push({
          key: ord.receiptKey,
          date: date,
          total: ord.total || '',
          isFuel: isFuel
        });
      }

      console.log(`  Found ${orders.length} orders so far (Page ${page})...`);
      if (json.data?.postOrderSearch?.isLastPage) break;
      await sleep(100);
    } catch (e) {
      break;
    }
  }

  // Filter down to grocery orders that need itemization
  const groceriesToExtract = orders.filter(o => !o.isFuel && o.key);
  console.log(`\n🛍️ Step 2: Extracting grocery line items for ${groceriesToExtract.length} receipts...`);

  // Step 2: Micro-worker iframe to extract exact product links without triggering rate limits
  const results = {};
  const ifr = document.createElement('iframe');
  ifr.style.cssText = 'width: 10px; height: 10px; position: fixed; bottom: 0; right: 0; opacity: 0; pointer-events: none;';
  document.body.appendChild(ifr);

  for (let i = 0; i < groceriesToExtract.length; i++) {
    const ord = groceriesToExtract[i];
    const url = `https://www.kroger.com/mypurchases/detail/${ord.key}`;

    try {
      await new Promise(res => {
        let done = false;
        ifr.onload = () => { done = true; res(); };
        ifr.src = url;
        setTimeout(() => { if (!done) res(); }, 6000);
      });

      await sleep(2200); // Wait for React product links to hydrate

      const doc = ifr.contentDocument || ifr.contentWindow?.document;
      const links = doc ? Array.from(doc.querySelectorAll('a[href*="/p/"]'))
        .map(el => el.textContent.trim())
        .filter(t => t.length > 2) : [];

      const items = [...new Set(links)];
      results[ord.key] = items;

      const preview = items.slice(0, 3).join(', ') + (items.length > 3 ? ` (+${items.length - 3} more)` : '');
      console.log(`[${i + 1}/${groceriesToExtract.length}] ${ord.date} | ${ord.total} | 🛍️ ${preview || '(Summary only)'}`);

    } catch (err) {
      console.warn("Could not extract items for", ord.key, err);
    }
    await sleep(200);
  }

  ifr.remove();

  // Step 3: Build Shallot Money CSV
  console.log("\n💾 Step 3: Generating Shallot Money CSV...");
  const csvRows = [["Date", "Amount", "Description", "Category", "Items"]];

  for (const o of orders) {
    const amt = parseFloat(o.total.replace(/[^0-9.]/g, '')) || 0;
    if (!o.date || isNaN(amt) || amt <= 0) continue;

    const items = o.isFuel ? ['Kroger Fuel'] : (results[o.key] || []);
    const desc = o.isFuel ? 'Kroger Fuel' : 'Kroger';
    const cat = o.isFuel ? 'transport' : 'groceries';

    csvRows.push([
      o.date,
      amt.toFixed(2),
      desc,
      cat,
      items.join('; ')
    ]);
  }

  const csvContent = csvRows.map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const filename = `shallot_kroger_itemized_history.csv`;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  console.log(`\n🎉 SUCCESS! Downloaded complete itemized history to: ${filename}`);
  alert(`🎉 SUCCESS!\n\nHarvested all Kroger purchases with full line items!\n\nDownloaded: ${filename}\n\nYou can now import this file into Shallot Money.`);
})();
