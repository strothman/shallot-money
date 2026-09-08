/**
 * Shallot Money — Sam's Club Precision Harvester (v2 Master)
 * ==========================================================
 * Automatically extracts complete, itemized purchase history, exact line-item
 * prices, dates, totals, and tender splits directly from Sam's Club!
 * 
 * Includes SHARED ACCOUNT FILTERING:
 * Filters to only YOUR personal purchases (matching your cards or EBT)
 * and automatically skips orders placed by other family members.
 * 
 * HOW TO USE:
 * 1. Log in to: https://www.samsclub.com/orders
 * 2. Press F12 -> Console.
 * 3. Paste this code and press Enter.
 * 4. Enter your card last 4 digits when prompted (e.g. 1640, 1874, 3952).
 * 5. Your personal itemized CSV downloads automatically!
 */

(async function runSamsClubMasterHarvester() {
  console.log("%c🧅 Shallot Money — Sam's Club Harvester Starting...", "color: #0062a9; font-size: 16px; font-weight: bold;");

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // 💳 Shared Membership Filter: Enter all your card endings
  let savedCards = {};
  try {
    savedCards = JSON.parse(localStorage.getItem('shallot_sams_my_cards') || '{}');
  } catch (e) {}

  let userCardsInput = savedCards.cards || '';
  if (!userCardsInput) {
    userCardsInput = prompt(
      "💳 Shared Sam's Club Account Filter:\n\n" +
      "Enter the last 4 digits of your cards separated by comma (e.g. 1640, 1874, 3952):\n" +
      "(EBT purchases are automatically included! Leave blank to export all)."
    ) || '';
    if (userCardsInput) {
      localStorage.setItem('shallot_sams_my_cards', JSON.stringify({ cards: userCardsInput }));
    }
  }

  const myCardDigits = new Set(
    userCardsInput.split(/[,;\s]+/).map(p => p.trim().slice(-4)).filter(p => p.length === 4)
  );

  if (myCardDigits.size > 0) {
    console.log(`🔒 Active Filter: Matching your cards [${Array.from(myCardDigits).join(', ')}] + any EBT purchases.`);
  } else {
    console.log("ℹ️ No filter: Exporting all orders on account.");
  }

  // Find all receipt cards on the page
  const seeDetailsBtns = Array.from(document.querySelectorAll('*'))
    .filter(el => el.children.length === 0 && /^see details$/i.test(el.textContent.trim()));

  const receiptsToProcess = [];

  for (const btn of seeDetailsBtns) {
    const card = btn.closest('div[class*="ld_AJ"]') || btn.parentElement.parentElement.parentElement.parentElement;
    if (!card) continue;

    const cardText = card.innerText || '';
    const tcMatch = cardText.match(/TC\s*([0-9\s]{15,30})/i);
    const dateMatch = cardText.match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})/i) ||
                      cardText.match(/Purchased on\s*([A-Za-z]+,?\s+[A-Za-z]+\s+\d{1,2})/i);

    let tcClean = tcMatch ? tcMatch[1].replace(/\s+/g, '') : '';
    let targetUrl = '';

    const linkEl = card.querySelector('a[href*="/orders/"], a[href*="storePurchase"]');
    if (linkEl && linkEl.href) {
      targetUrl = linkEl.href;
    } else if (tcClean) {
      targetUrl = `https://www.samsclub.com/en/orders/${tcClean}?storePurchase=true`;
    }

    if (targetUrl) {
      receiptsToProcess.push({
        url: targetUrl,
        tc: tcClean,
        cardPreview: cardText.replace(/\n+/g, ' | ').slice(0, 80)
      });
    }
  }

  console.log(`🎯 Found ${receiptsToProcess.length} total receipts to inspect across your account...`);
  if (receiptsToProcess.length === 0) {
    alert("⚠️ Could not find any orders. Please make sure you are on https://www.samsclub.com/orders with orders visible on screen.");
    return;
  }

  const finalizedOrders = [];
  const ifr = document.createElement('iframe');
  ifr.style.cssText = 'width: 10px; height: 10px; position: fixed; bottom: 0; right: 0; opacity: 0; pointer-events: none;';
  document.body.appendChild(ifr);

  for (let i = 0; i < receiptsToProcess.length; i++) {
    const rec = receiptsToProcess[i];

    try {
      await new Promise(res => {
        let done = false;
        ifr.onload = () => { done = true; res(); };
        ifr.src = rec.url;
        setTimeout(() => { if (!done) res(); }, 5000);
      });

      await sleep(1800); // Allow item cards to hydrate

      const doc = ifr.contentDocument || ifr.contentWindow?.document;
      if (!doc) continue;

      const bodyText = doc.body.innerText || '';

      // 1. Extract Date
      const dMatch = bodyText.match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})/i);
      let dateStr = '';
      if (dMatch) {
        const d = new Date(dMatch[1]);
        if (!isNaN(d.getTime())) dateStr = d.toISOString().split('T')[0];
      }

      // 2. Extract Total Amount
      let amt = 0;
      const totalMatch = bodyText.match(/Total\s*\$([0-9,]+\.[0-9]{2})/i) || bodyText.match(/\$([0-9,]+\.[0-9]{2})/);
      if (totalMatch) amt = parseFloat(totalMatch[1].replace(/,/g, ''));

      // 3. Extract Payment Card and EBT
      const cardMatch = bodyText.match(/(?:\*|ending in|••••)\s*(\d{4})/i) || bodyText.match(/Payment\s*method[^\n]*\n[^\n]*\*(\d{4})/i);
      const matchedCard = cardMatch ? cardMatch[1] : '';

      let tenders = { ebt: 0, card: 0 };
      const ebtMatch = bodyText.match(/(?:snap|ebt)[^\$\n\r]*\$([0-9,]+\.[0-9]{2})/i);
      if (ebtMatch) tenders.ebt = parseFloat(ebtMatch[1].replace(/,/g, ''));

      const isEBT = tenders.ebt > 0 || /(?:snap|ebt|food\s*stamp)/i.test(bodyText);

      // Check Shared Account Filter
      if (myCardDigits.size > 0) {
        const isMine = (matchedCard && myCardDigits.has(matchedCard)) || isEBT;
        if (!isMine && matchedCard) {
          console.log(`  ⏭️ [${i + 1}/${receiptsToProcess.length}] Skipped other member's purchase: $${amt.toFixed(2)} (Paid on card *${matchedCard})`);
          continue;
        }
      }

      // 4. Extract Line Items with Prices
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
        console.log(`  ✅ [${i + 1}/${receiptsToProcess.length}] MATCHED: ${dateStr} | $${amt.toFixed(2)} (Card: *${matchedCard || 'EBT'}) | 🛍️ ${preview}`);
      }

    } catch (err) {
      console.warn("Could not load receipt", rec.url, err);
    }
    await sleep(200);
  }

  ifr.remove();

  if (finalizedOrders.length === 0) {
    alert("⚠️ No personal orders matched your cards. Check your card digits and try again!");
    return;
  }

  // Step 3: Export CSV
  const csvRows = [["Date", "Amount", "Description", "Category", "Items"]];
  for (const o of finalizedOrders) {
    csvRows.push([o.date, o.amount.toFixed(2), o.desc, o.cat, o.items.join('; ')]);
  }

  const csvContent = csvRows.map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const filename = `shallot_samsclub_my_purchases_${finalizedOrders.length}_orders.csv`;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  console.log(`\n🎉 SUCCESS! Downloaded ${finalizedOrders.length} personal purchases to: ${filename}`);
  alert(`🎉 SUCCESS!\n\nHarvested ${finalizedOrders.length} personal Sam's Club purchases!\n\nDownloaded: ${filename}\n\nYou can now import this into Shallot Money.`);
})();
