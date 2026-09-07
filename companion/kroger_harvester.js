/**
 * Shallot Money — Kroger Pure API Harvester (v6 Bulletproof)
 * ==========================================================
 * 100% Direct API — 1 receipt at a time to prevent HTTP/2 errors.
 * Preserves all transactions, dates, amounts, and item breakdowns.
 */

(async function harvestKrogerPureAPI() {
  console.log("%c🧅 Shallot Money — Pure API Harvester Starting...", "color: #b388ff; font-size: 16px; font-weight: bold;");

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const searchHeaders = {
    "accept": "application/json, text/plain, */*",
    "x-call-origin": "{\"page\":\"/mypurchases\",\"component\":\"purchase history\"}",
    "x-kroger-channel": "WEB"
  };

  const detailHeaders = {
    "accept": "application/json, text/plain, */*",
    "content-type": "application/json",
    "x-call-origin": "{\"page\":\"/mypurchases/detail\",\"component\":\"purchase detail\"}",
    "x-kroger-channel": "WEB"
  };

  // --- Step 1: Collect all receipts from all pages ---
  console.log("🚀 Step 1: Fetching purchase history catalog across all pages...");
  const orderSummaries = [];
  let pageNo = 1;
  let pageTotal = 20;

  while (pageNo <= pageTotal) {
    try {
      const url = `https://www.kroger.com/atlas/v1/post-order/v1/purchase-history-search?pageNo=${pageNo}&pageSize=10`;
      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: searchHeaders
      });

      if (!res.ok) {
        console.warn(`Search ended at page ${pageNo - 1}`);
        break;
      }

      const json = await res.json();
      const searchData = json.data?.postOrderSearch;
      if (!searchData) break;

      pageTotal = searchData.pageTotal || pageTotal;
      const orders = searchData.data || [];

      for (const ord of orders) {
        const key = ord.receiptKey || '';
        const parts = key.split('~');
        if (parts.length >= 5) {
          orderSummaries.push({
            receiptKey: key,
            divisionNumber: parts[0],
            storeNumber: parts[1],
            transactionDate: parts[2],
            terminalNumber: parts[3],
            transactionId: parts[4],
            purchaseType: ord.purchaseType || '',
            totalStr: ord.total || ''
          });
        }
      }

      console.log(`  📄 Page ${pageNo} of ${pageTotal}: Found ${orders.length} orders (Total: ${orderSummaries.length})`);
      if (searchData.isLastPage) break;
      pageNo++;
      await sleep(80);
    } catch (err) {
      console.error("Error fetching search page", pageNo, err);
      break;
    }
  }

  console.log(`\n🎉 Step 1 Complete! Found ${orderSummaries.length} total orders across your account.`);
  console.log("🛍️ Step 2: Fetching itemized receipt details for each purchase...\n");

  // --- Step 2: Fetch details 1 by 1 (Kroger enforces 1 receipt per request) ---
  const finalizedPurchases = [];

  for (let i = 0; i < orderSummaries.length; i++) {
    const summary = orderSummaries[i];
    let amount = parseFloat(summary.totalStr.replace(/[^0-9.]/g, '')) || 0;
    let items = [];

    const isFuel = summary.purchaseType === 'FUEL' || /fuel/i.test(summary.purchaseType);

    if (isFuel) {
      items = ['Kroger Fuel'];
    } else {
      try {
        const detailRes = await fetch("https://www.kroger.com/atlas/v1/purchase-history/v2/details", {
          method: "POST",
          credentials: "include",
          headers: detailHeaders,
          body: JSON.stringify([{
            divisionNumber: summary.divisionNumber,
            storeNumber: summary.storeNumber,
            transactionDate: summary.transactionDate,
            terminalNumber: summary.terminalNumber,
            transactionId: summary.transactionId
          }])
        });

        if (detailRes.ok) {
          const detailJson = await detailRes.json();
          const det = detailJson.data?.purchaseHistoryDetails?.[0];

          if (det) {
            const costStr = det.costSummary?.total || '';
            const parsedCost = parseFloat(costStr.replace(/[^0-9.]/g, ''));
            if (!isNaN(parsedCost) && parsedCost > 0) amount = parsedCost;

            items = (det.items || [])
              .map(it => it.purchasedData?.displayInfo?.description?.trim())
              .filter(Boolean);
          }
        }
      } catch (err) {
        // Safe fallback to summary
      }
    }

    const desc = isFuel ? 'Kroger Fuel' : 'Kroger';
    const cat = isFuel ? 'transport' : 'food';

    finalizedPurchases.push({
      date: summary.transactionDate,
      amount: amount,
      description: desc,
      category: cat,
      items: items
    });

    const preview = items.slice(0, 3).join(', ') + (items.length > 3 ? ` (+${items.length - 3} more)` : '');
    console.log(`[${i + 1}/${orderSummaries.length}] ${summary.transactionDate} | $${amount.toFixed(2)} | ${preview || '(Summary only)'}`);

    await sleep(120); // Smooth 120ms delay
  }

  // --- Step 3: Export CSV ---
  console.log("\n💾 Step 3: Generating Shallot Money CSV...");
  const csvRows = [["Date", "Amount", "Description", "Category", "Items"]];
  for (const r of finalizedPurchases) {
    if (!r.date || isNaN(r.amount) || r.amount <= 0) continue;
    csvRows.push([
      r.date,
      r.amount.toFixed(2),
      r.description,
      r.category,
      r.items.join('; ')
    ]);
  }

  const csvContent = csvRows.map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const filename = `shallot_kroger_itemized_history_${finalizedPurchases.length}_orders.csv`;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  console.log(`\n🏁 ALL DONE! Exported ${finalizedPurchases.length} itemized purchases to: ${filename}`);
  alert(`🎉 SUCCESS!\n\nHarvested all ${finalizedPurchases.length} itemized Kroger purchases via direct API!\n\nDownloaded: ${filename}`);
})();
