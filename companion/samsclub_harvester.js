/**
 * Shallot Money — Sam's Club Multi-Year Precision Harvester (v3 Master)
 * ====================================================================
 * Automatically scans across ALL years (2026, 2025, 2024, etc.) to collect
 * every single personal purchase on your Sam's Club account!
 * 
 * Features:
 * - Multi-Year Auto-Scanning: Cycles through date filters automatically.
 * - Shared Account Filtering: Matches your cards (e.g. 1640, 1874, 3952) & EBT,
 *   cleanly skipping purchases made by other family members.
 * - Line-Item Prices: Extracts exact product names and individual prices.
 * - Split-Tender Detection: Automatically tracks Card + EBT split tenders.
 * 
 * HOW TO USE:
 * 1. Log in to: https://www.samsclub.com/orders
 * 2. Press F12 -> Console.
 * 3. Paste this code and press Enter.
 * 4. Your complete multi-year personal CSV downloads automatically!
 */

(async function runSamsClubMultiYearHarvester() {
  console.log("%c🧅 Shallot Money — Sam's Club Multi-Year Harvester Starting...", "color: #0062a9; font-size: 16px; font-weight: bold;");

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // 💳 Shared Membership Filter: Enter your card endings
  let savedCards = {};
  try {
    savedCards = JSON.parse(localStorage.getItem('shallot_sams_my_cards') || '{}');
  } catch (e) {}

  let userCardsInput = savedCards.cards || '1640, 1874, 3952';
  const myCardDigits = new Set(
    userCardsInput.split(/[,;\s]+/).map(p => p.trim().slice(-4)).filter(p => p.length === 4)
  );

  console.log(`🔒 Active Filter: Matching your cards [${Array.from(myCardDigits).join(', ')}] + any EBT purchases.`);

  // Step 1: Scan across all available years (Current year down to 4 years ago)
  const yearFilters = [
    { label: "Current Year (2026)", param: "year-0" },
    { label: "2025", param: "year-1" },
    { label: "2024", param: "year-2" },
    { label: "2023", param: "year-3" }
  ];

  console.log("🔍 Step 1: Scanning order catalogs across all years...");

  const scanIfr = document.createElement('iframe');
  scanIfr.style.cssText = 'width: 10px; height: 10px; position: fixed; bottom: 0; right: 0; opacity: 0; pointer-events: none;';
  document.body.appendChild(scanIfr);

  const allReceiptsMap = new Map();

  // Helper to extract receipt URLs from any document
  function extractReceiptsFromDoc(doc) {
    if (!doc) return [];
    const seeDetailsBtns = Array.from(doc.querySelectorAll('*'))
      .filter(el => el.children.length === 0 && /^see details$/i.test(el.textContent.trim()));

    const list = [];
    for (const btn of seeDetailsBtns) {
      const card = btn.closest('div[class*="ld_AJ"]') || btn.parentElement.parentElement.parentElement.parentElement;
      if (!card) continue;

      const cardText = card.innerText || '';
      const tcMatch = cardText.match(/TC\s*([0-9\s]{15,30})/i);
      let tcClean = tcMatch ? tcMatch[1].replace(/\s+/g, '') : '';
      let targetUrl = '';

      const linkEl = card.querySelector('a[href*="/orders/"], a[href*="storePurchase"]');
      if (linkEl && linkEl.href) {
        targetUrl = linkEl.href;
      } else if (tcClean) {
        targetUrl = `https://www.samsclub.com/en/orders/${tcClean}?storePurchase=true`;
      }

      if (targetUrl && tcClean) {
        list.push({ tc: tcClean, url: targetUrl });
      }
    }
    return list;
  }

  // Also extract from the current active page immediately
  const activePageReceipts = extractReceiptsFromDoc(document);
  for (const r of activePageReceipts) {
    if (!allReceiptsMap.has(r.tc)) allReceiptsMap.set(r.tc, r.url);
  }

  // Loop through all years via background worker
  for (const yf of yearFilters) {
    const filterUrl = `https://www.samsclub.com/en/orders?dateFilter=${yf.param}`;
    try {
      await new Promise(res => {
        let done = false;
        scanIfr.onload = () => { done = true; res(); };
        scanIfr.src = filterUrl;
        setTimeout(() => { if (!done) res(); }, 5000);
      });

      await sleep(1500); // Allow cards to hydrate

      const doc = scanIfr.contentDocument || scanIfr.contentWindow?.document;
      const yearReceipts = extractReceiptsFromDoc(doc);

      let newlyAdded = 0;
      for (const r of yearReceipts) {
        if (!allReceiptsMap.has(r.tc)) {
          allReceiptsMap.set(r.tc, r.url);
          newlyAdded++;
        }
      }

      console.log(`  📅 ${yf.label}: Found ${yearReceipts.length} orders (${newlyAdded} new). Total collected: ${allReceiptsMap.size}`);

      // If a historical year has 0 orders, we've likely reached the beginning of account history
      if (yearReceipts.length === 0 && yf.param !== "year-0") {
        console.log(`  ⏹️ Reached earliest account history at ${yf.label}.`);
        break;
      }
    } catch (e) {
      console.warn("Could not scan year", yf.label, e);
    }
    await sleep(200);
  }

  scanIfr.remove();

  const receiptsList = Array.from(allReceiptsMap.entries()).map(([tc, url]) => ({ tc, url }));
  console.log(`\n🎉 Step 1 Complete! Found ${receiptsList.length} total receipts across all years.`);
  console.log(`🛍️ Step 2: Itemizing and filtering to your personal cards...`);

  if (receiptsList.length === 0) {
    alert("⚠️ No orders found on account.");
    return;
  }

  // Step 2: Itemize and filter
  const finalizedOrders = [];
  const detailIfr = document.createElement('iframe');
  detailIfr.style.cssText = 'width: 10px; height: 10px; position: fixed; bottom: 0; right: 0; opacity: 0; pointer-events: none;';
  document.body.appendChild(detailIfr);

  for (let i = 0; i < receiptsList.length; i++) {
    const rec = receiptsList[i];

    try {
      await new Promise(res => {
        let done = false;
        detailIfr.onload = () => { done = true; res(); };
        detailIfr.src = rec.url;
        setTimeout(() => { if (!done) res(); }, 5000);
      });

      await sleep(1800);

      const doc = detailIfr.contentDocument || detailIfr.contentWindow?.document;
      if (!doc) continue;

      const bodyText = doc.body.innerText || '';

      // Date
      const dMatch = bodyText.match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})/i);
      let dateStr = '';
      if (dMatch) {
        const d = new Date(dMatch[1]);
        if (!isNaN(d.getTime())) dateStr = d.toISOString().split('T')[0];
      }

      // Total
      let amt = 0;
      const totalMatch = bodyText.match(/Total\s*\$([0-9,]+\.[0-9]{2})/i) || bodyText.match(/\$([0-9,]+\.[0-9]{2})/);
      if (totalMatch) amt = parseFloat(totalMatch[1].replace(/,/g, ''));

      // Card & EBT
      const cardMatch = bodyText.match(/(?:\*|ending in|••••)\s*(\d{4})/i) || bodyText.match(/Payment\s*method[^\n]*\n[^\n]*\*(\d{4})/i);
      const matchedCard = cardMatch ? cardMatch[1] : '';

      let tenders = { ebt: 0, card: 0 };
      const ebtMatch = bodyText.match(/(?:snap|ebt)[^\$\n\r]*\$([0-9,]+\.[0-9]{2})/i);
      if (ebtMatch) tenders.ebt = parseFloat(ebtMatch[1].replace(/,/g, ''));
      const isEBT = tenders.ebt > 0 || /(?:snap|ebt|food\s*stamp)/i.test(bodyText);

      // Shared Account Filter
      if (myCardDigits.size > 0) {
        const isMine = (matchedCard && myCardDigits.has(matchedCard)) || isEBT;
        if (!isMine && matchedCard) {
          console.log(`  ⏭️ [${i + 1}/${receiptsList.length}] Skipped other member ($${amt.toFixed(2)} on card *${matchedCard})`);
          continue;
        }
      }

      // Items & Prices
      const itemSection = bodyText.split(/\d+\s*items/i)[1]?.split(/Payment\s*method|Subtotal/i)[0] || "";
      const rawLines = itemSection.trim().split('\n').map(l => l.trim()).filter(Boolean);
      const items = [];

      for (let j = 0; j < rawLines.length; j++) {
        const line = rawLines[j];
        const next = rawLines[j + 1] || '';
        if (/^\$[0-9,]+\.[0-9]{2}$/.test(next) && line.length > 2 && !/qty|\$|subtotal|tax|total/i.test(line)) {
          items.push(`${line} (${next})`);
        }
      }

      let cat = 'groceries';
      if (items.length > 0) {
        const isPureShopping = items.every(it => {
          const lower = it.toLowerCase();
          return /plush|toy|toys|stuffed|squishmallow|doll|lego|puzzle|shirt|pants|jeans|hoodie|shoes|socks|underwear|apparel|charger|battery|batteries|headphones|blender|towel|pillow|blanket|candle|knife|hardware/i.test(lower);
        });
        if (isPureShopping) cat = 'shopping';
      }

      if (dateStr && amt > 0) {
        if (tenders.ebt > 0 && amt > tenders.ebt) {
          finalizedOrders.push({ date: dateStr, amount: amt - tenders.ebt, desc: "Sam's Club (Card)", cat, items });
          finalizedOrders.push({ date: dateStr, amount: tenders.ebt, desc: "Sam's Club (EBT)", cat, items });
        } else if (isEBT) {
          finalizedOrders.push({ date: dateStr, amount: amt, desc: "Sam's Club (EBT)", cat, items });
        } else {
          finalizedOrders.push({ date: dateStr, amount: amt, desc: "Sam's Club", cat, items });
        }

        const preview = items.slice(0, 3).join(', ') + (items.length > 3 ? ` (+${items.length - 3} more)` : '');
        console.log(`  ✅ [${i + 1}/${receiptsList.length}] MATCHED: ${dateStr} | $${amt.toFixed(2)} (Card: *${matchedCard || 'EBT'}) | 🛍️ ${preview}`);
      }

    } catch (err) {
      console.warn("Could not extract receipt", rec.url, err);
    }
    await sleep(200);
  }

  detailIfr.remove();

  if (finalizedOrders.length === 0) {
    alert("⚠️ No personal orders matched your cards across any year.");
    return;
  }

  // Step 3: Export master CSV
  const csvRows = [["Date", "Amount", "Description", "Category", "Items"]];
  for (const o of finalizedOrders) {
    csvRows.push([o.date, o.amount.toFixed(2), o.desc, o.cat, o.items.join('; ')]);
  }

  const csvContent = csvRows.map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const filename = `shallot_samsclub_all_years_${finalizedOrders.length}_orders.csv`;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  console.log(`\n🎉 SUCCESS! Downloaded ${finalizedOrders.length} personal purchases across all years to: ${filename}`);
  alert(`🎉 SUCCESS!\n\nHarvested all ${finalizedOrders.length} personal purchases across all years!\n\nDownloaded: ${filename}\n\nYou can now import this into Shallot Money.`);
})();
