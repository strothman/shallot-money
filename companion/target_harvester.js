/**
 * Shallot Money — Target Purchase & Receipt Harvester
 * ===================================================
 * HOW TO USE:
 * 1. Navigate to: https://www.target.com/orders
 * 2. Press F12 -> Console.
 * 3. Paste this entire script and press Enter.
 * 4. It will auto-scroll to load past purchases, extract items & totals,
 *    and download "shallot_target_itemized_history.csv" ready for Shallot Money!
 */

(async function harvestTargetOrders() {
  console.log("%c🎯 Shallot Money — Target Harvester Starting...", "color: #cc0000; font-size: 16px; font-weight: bold;");

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // Step 1: Smoothly scroll down to trigger lazy loading of orders
  console.log("📜 Scanning and loading order history...");
  for (let i = 0; i < 4; i++) {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    await sleep(1200);
  }

  const orders = [];
  const seenKeys = new Set();

  // Find all potential order containers
  const selectors = [
    '[data-test="order-card"]',
    'div[class*="OrderCard"]',
    'div[data-test*="orderCard"]',
    'div[class*="styles__OrderCard"]',
    'div[data-test="order-history-card"]',
    'section[class*="OrderCard"]'
  ];

  let cards = Array.from(document.querySelectorAll(selectors.join(', ')));

  // Fallback: If no dedicated cards found, search parent blocks containing order totals
  if (cards.length === 0) {
    const totals = Array.from(document.querySelectorAll('*')).filter(el => {
      return el.children.length === 0 && /\$[0-9,]+\.[0-9]{2}/.test(el.textContent) && /order|total/i.test(el.parentElement?.textContent || '');
    });
    cards = totals.map(t => t.closest('div[class*="card"], div[class*="container"], li, section') || t.parentElement).filter(Boolean);
  }

  console.log(`🔍 Found ${cards.length} potential order cards. Extracting receipt data...`);

  for (const card of cards) {
    const text = card.innerText || '';

    // Extract Date
    const dateMatch = text.match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})/i) ||
                      text.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);

    let dateStr = '';
    if (dateMatch) {
      const d = new Date(dateMatch[1]);
      if (!isNaN(d.getTime())) {
        dateStr = d.toISOString().split('T')[0];
      }
    }

    // Extract Amount (look for total or highest dollar value in the card)
    const amtMatches = Array.from(text.matchAll(/\$([0-9,]+\.[0-9]{2})/g));
    let amt = 0;
    if (amtMatches.length > 0) {
      // Find the match that likely represents the total
      const values = amtMatches.map(m => parseFloat(m[1].replace(/,/g, '')));
      amt = Math.max(...values);
    }

    // Extract Product Titles and Prices
    const itemElements = Array.from(card.querySelectorAll([
      'a[href*="/p/"]',
      '[data-test="order-item-name"]',
      '[data-test="product-title"]',
      'span[class*="ItemTitle"]',
      'div[class*="OrderItem"] span'
    ].join(', ')));

    const itemTitles = itemElements
      .map(el => {
        const title = (el.textContent || el.getAttribute('aria-label') || '').trim();
        if (title.length <= 2 || /^\$\d/.test(title) || /view order|details|reorder|track/i.test(title)) return null;
        const container = el.closest('[data-test="order-item"], div[class*="OrderItem"], li, tr') || el.parentElement;
        let priceStr = '';
        if (container) {
          const priceMatch = container.innerText.match(/\$([0-9,]+\.[0-9]{2})/);
          if (priceMatch) priceStr = ` ($${priceMatch[1]})`;
        }
        return `${title}${priceStr}`;
      })
      .filter(Boolean);

    // Also check image alt tags if text links were empty
    if (itemTitles.length === 0) {
      const imgElements = Array.from(card.querySelectorAll('img[alt]'));
      for (const img of imgElements) {
        const alt = img.getAttribute('alt').trim();
        if (alt && alt.length > 2 && !/target|icon|logo/i.test(alt)) {
          itemTitles.push(alt);
        }
      }
    }

    const items = [...new Set(itemTitles)];
    const uniqueKey = `${dateStr}_${amt.toFixed(2)}`;

    let cat = 'groceries';
    if (items.length > 0) {
      const isPureShopping = items.every(it => {
        const lower = it.toLowerCase();
        return /plush|toy|toys|stuffed|squishmallow|doll|lego|puzzle|shirt|pants|jeans|hoodie|shoes|socks|underwear|apparel|charger|battery|batteries|headphones|blender|towel|pillow|blanket|candle|knife|hardware/i.test(lower);
      });
      if (isPureShopping) {
        cat = 'shopping';
      }
    }

    // Detect EBT vs Card tender
    let tenders = { ebt: 0, card: 0 };
    const ebtMatch = text.match(/(?:snap|ebt|food\s*stamp)[^\$\n\r]*\$([0-9,]+\.[0-9]{2})/i);
    if (ebtMatch) tenders.ebt = parseFloat(ebtMatch[1].replace(/,/g, ''));

    const cardMatch = text.match(/(?:visa|mastercard|discover|amex|debit|credit|redcard|target\s*circle\s*card)[^\$\n\r]*\$([0-9,]+\.[0-9]{2})/i);
    if (cardMatch) tenders.card = parseFloat(cardMatch[1].replace(/,/g, ''));

    if (dateStr && amt > 0 && !seenKeys.has(uniqueKey)) {
      seenKeys.add(uniqueKey);

      if (tenders.ebt > 0 && tenders.card > 0) {
        orders.push({
          date: dateStr,
          amount: tenders.card,
          description: 'Target (Card)',
          category: cat,
          items: items
        });
        orders.push({
          date: dateStr,
          amount: tenders.ebt,
          description: 'Target (EBT)',
          category: cat,
          items: items
        });
        console.log(`  💳 Split Tender: Target (Card) $${tenders.card.toFixed(2)} + Target (EBT) $${tenders.ebt.toFixed(2)}`);
      } else if (tenders.ebt > 0) {
        orders.push({
          date: dateStr,
          amount: amt,
          description: 'Target (EBT)',
          category: cat,
          items: items
        });
      } else {
        orders.push({
          date: dateStr,
          amount: amt,
          description: 'Target',
          category: cat,
          items: items
        });
      }
      console.log(`  ✅ ${dateStr} | $${amt.toFixed(2)} | ${items.slice(0, 3).join(', ')}${items.length > 3 ? ` (+${items.length - 3} more)` : ''}`);
    }
  }

  if (orders.length === 0) {
    console.warn("⚠️ No orders were detected. Make sure you are on https://www.target.com/orders and logged in.");
    alert("⚠️ Could not detect any orders on this page.\n\nPlease verify you are logged in at https://www.target.com/orders and have order history visible.");
    return;
  }

  // Generate Clean CSV (Semicolon-delimited items for Shallot Money)
  const csvRows = [["Date", "Amount", "Description", "Category", "Items"]];
  for (const o of orders) {
    csvRows.push([
      o.date,
      o.amount.toFixed(2),
      o.description,
      o.category,
      o.items.join('; ')
    ]);
  }

  const csvContent = csvRows.map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const filename = `shallot_target_itemized_${orders.length}_orders.csv`;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  console.log(`🎉 Downloaded: ${filename}`);
  alert(`🎉 SUCCESS!\n\nHarvested ${orders.length} Target purchases!\n\nDownloaded: ${filename}\n\nYou can now import this CSV directly into Shallot Money!`);
})();
