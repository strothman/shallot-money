/**
 * Shallot Money — Sam's Club Purchase & Receipt Harvester
 * =======================================================
 * HOW TO USE:
 * 1. Navigate to: https://www.samsclub.com/account/orders
 * 2. Press F12 -> Console.
 * 3. Paste this code and press Enter.
 * 4. Downloads: "shallot_samsclub_itemized_history.csv"
 */

(async function harvestSamsClubOrders() {
  console.log("%c🧅 Shallot Money — Sam's Club Harvester Starting...", "color: #0062a9; font-size: 16px; font-weight: bold;");

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const orders = [];
  const seenKeys = new Set();

  // Auto-scroll down to trigger lazy loading of older orders
  console.log("📜 Scrolling to load Sam's Club order cards...");
  for (let i = 0; i < 4; i++) {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    await sleep(1200);
  }

  const selectors = [
    'div[class*="order-card"]',
    'div[class*="OrderCard"]',
    'div[data-automation-id="order-card"]',
    'div[class*="sc-order-card"]'
  ];

  let cards = Array.from(document.querySelectorAll(selectors.join(', ')));
  if (cards.length === 0) {
    const totals = Array.from(document.querySelectorAll('*')).filter(el => {
      return el.children.length === 0 && /\$[0-9,]+\.[0-9]{2}/.test(el.textContent) && /order/i.test(el.parentElement?.textContent || '');
    });
    cards = totals.map(t => t.closest('div[class*="card"], div[class*="container"], li, section') || t.parentElement).filter(Boolean);
  }

  console.log(`Found ${cards.length} order cards...`);

  for (const card of cards) {
    const text = card.innerText || '';
    const dateMatch = text.match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})/i) ||
                      text.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    const amtMatch = text.match(/\$([0-9,]+\.[0-9]{2})/);

    let dateStr = '';
    if (dateMatch) {
      const d = new Date(dateMatch[1]);
      if (!isNaN(d.getTime())) dateStr = d.toISOString().split('T')[0];
    }

    const amt = amtMatch ? parseFloat(amtMatch[1].replace(/,/g, '')) : 0;

    // Extract product names and prices
    const itemElements = Array.from(card.querySelectorAll([
      'a[href*="/p/"]',
      'a[href*="/product/"]',
      '[data-automation-id="item-name"]',
      'span[class*="itemTitle"]',
      'div[class*="product-name"]'
    ].join(', ')));

    const itemTitles = itemElements
      .map(el => {
        const title = (el.textContent || '').trim();
        if (title.length <= 2 || /^\$\d/.test(title) || /reorder|details|track/i.test(title)) return null;
        const container = el.closest('div[class*="item"], div[class*="product"], li, tr') || el.parentElement;
        let priceStr = '';
        if (container) {
          const priceMatch = container.innerText.match(/\$([0-9,]+\.[0-9]{2})/);
          if (priceMatch) priceStr = ` ($${priceMatch[1]})`;
        }
        return `${title}${priceStr}`;
      })
      .filter(Boolean);

    // Image alt fallbacks
    if (itemTitles.length === 0) {
      const imgs = Array.from(card.querySelectorAll('img[alt]'));
      for (const img of imgs) {
        const alt = img.getAttribute('alt').trim();
        if (alt && alt.length > 2 && !/sams club|sam's|logo|icon/i.test(alt)) {
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

    if (dateStr && amt > 0 && !seenKeys.has(uniqueKey)) {
      seenKeys.add(uniqueKey);
      orders.push({
        date: dateStr,
        amount: amt,
        description: "Sam's Club",
        category: cat,
        items: items
      });
      console.log(`  ✅ ${dateStr} | $${amt.toFixed(2)} | ${items.slice(0, 3).join(', ')}${items.length > 3 ? ` (+${items.length - 3} more)` : ''}`);
    }
  }

  if (orders.length === 0) {
    console.warn("⚠️ No orders were detected on https://www.samsclub.com/account/orders");
    alert("⚠️ Could not detect any orders.\n\nPlease verify you are logged in at https://www.samsclub.com/account/orders with orders visible on screen.");
    return;
  }

  // Export CSV
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
  const filename = `shallot_samsclub_itemized_${orders.length}_orders.csv`;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  console.log(`🎉 Downloaded: ${filename}`);
  alert(`🎉 SUCCESS!\n\nHarvested ${orders.length} Sam's Club purchases!\n\nDownloaded: ${filename}`);
})();
