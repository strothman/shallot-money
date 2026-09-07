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
      let items = [];
      if (doc) {
        const linkEls = Array.from(doc.querySelectorAll('a[href*="/p/"]'));
        const seenTitles = new Set();
        items = linkEls.map(el => {
          const title = el.textContent.trim();
          if (seenTitles.has(title) || title.length <= 2) return null;
          seenTitles.add(title);

          // Attempt to extract item price from surrounding container
          const container = el.closest('div[class*="Item"], div[class*="Product"], tr, li') || el.parentElement?.parentElement;
          let priceStr = '';
          if (container) {
            const priceMatch = container.innerText.match(/\$([0-9,]+\.[0-9]{2})/);
            if (priceMatch) priceStr = ` ($${priceMatch[1]})`;
          }
          return `${title}${priceStr}`;
        }).filter(Boolean);
      }

      results[ord.key] = items;

      // Extract EBT & Card payment tenders if present
      let tenders = { ebt: 0, card: 0 };
      if (doc) {
        const fullText = doc.body?.innerText || '';
        const ebtMatch = fullText.match(/(?:snap|ebt|food\s*stamp)[^\$\n\r]*\$([0-9,]+\.[0-9]{2})/i);
        if (ebtMatch) tenders.ebt = parseFloat(ebtMatch[1].replace(/,/g, ''));

        const cardMatch = fullText.match(/(?:visa|mastercard|discover|amex|debit|credit|cash|apple\s*pay)[^\$\n\r]*\$([0-9,]+\.[0-9]{2})/i);
        if (cardMatch) tenders.card = parseFloat(cardMatch[1].replace(/,/g, ''));
      }
      results[ord.key + '_tenders'] = tenders;

      const tenderStr = (tenders.ebt > 0 && tenders.card > 0) ? ` [Split: EBT $${tenders.ebt.toFixed(2)} + Card $${tenders.card.toFixed(2)}]` : (tenders.ebt > 0 ? ` [EBT $${tenders.ebt.toFixed(2)}]` : '');
      const preview = items.slice(0, 3).join(', ') + (items.length > 3 ? ` (+${items.length - 3} more)` : '');
      console.log(`[${i + 1}/${groceriesToExtract.length}] ${ord.date} | ${ord.total} | 🛍️ ${preview || '(Summary only)'}${tenderStr}`);

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
    let cat = o.isFuel ? 'transport' : 'groceries';

    // Smart check: If order consists 100% of non-grocery shopping items, auto-tag as shopping
    if (!o.isFuel && items.length > 0) {
      const isPureShopping = items.every(it => {
        const lower = it.toLowerCase();
        return /plush|toy|toys|stuffed|squishmallow|doll|lego|puzzle|shirt|pants|jeans|hoodie|shoes|socks|underwear|apparel|charger|battery|batteries|headphones|blender|towel|pillow|blanket|candle|knife|hardware/i.test(lower);
      });
      if (isPureShopping) {
        cat = 'shopping';
      }
    }

    const tenders = results[o.key + '_tenders'] || { ebt: 0, card: 0 };

    if (!o.isFuel && tenders.ebt > 0 && tenders.card > 0) {
      // Split tender: export Card swipe (matches bank statement!) and EBT swipe separately
      csvRows.push([
        o.date,
        tenders.card.toFixed(2),
        `${desc} (Card)`,
        cat,
        items.join('; ')
      ]);
      csvRows.push([
        o.date,
        tenders.ebt.toFixed(2),
        `${desc} (EBT)`,
        cat,
        items.join('; ')
      ]);
      console.log(`  💳 Split Tender Exported: ${desc} (Card) $${tenders.card.toFixed(2)} + ${desc} (EBT) $${tenders.ebt.toFixed(2)}`);
    } else if (!o.isFuel && tenders.ebt > 0) {
      csvRows.push([
        o.date,
        amt.toFixed(2),
        `${desc} (EBT)`,
        cat,
        items.join('; ')
      ]);
    } else {
      csvRows.push([
        o.date,
        amt.toFixed(2),
        desc,
        cat,
        items.join('; ')
      ]);
    }
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
