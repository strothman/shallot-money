/**
 * Shallot Money — Walmart Purchase & Receipt Harvester
 * ====================================================
 * HOW TO USE:
 * 1. Navigate to: https://www.walmart.com/orders
 * 2. Press F12 -> Console.
 * 3. Paste this code and press Enter.
 * 4. Downloads: "shallot_walmart_itemized_history.csv"
 */

(async function harvestWalmartOrders() {
  console.log("%c🧅 Shallot Money — Walmart Harvester Starting...", "color: #0071dc; font-size: 16px; font-weight: bold;");

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const orders = [];
  const seenKeys = new Set();

  // Auto-scroll down to trigger lazy loading of older orders
  console.log("📜 Scrolling to load order cards...");
  for (let i = 0; i < 4; i++) {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    await sleep(1200);
  }

  // Find all order cards on page
  const selectors = [
    '[data-automation-id="order-card"]',
    'div[class*="orderCard"]',
    'div[class*="order-history-card"]',
    'div[data-testid="order-card"]'
  ];

  let orderCards = Array.from(document.querySelectorAll(selectors.join(', ')));
  if (orderCards.length === 0) {
    const totals = Array.from(document.querySelectorAll('*')).filter(el => {
      return el.children.length === 0 && /\$[0-9,]+\.[0-9]{2}/.test(el.textContent) && /order/i.test(el.parentElement?.textContent || '');
    });
    orderCards = totals.map(t => t.closest('div[class*="card"], div[class*="container"], li, section') || t.parentElement).filter(Boolean);
  }

  console.log(`Found ${orderCards.length} order cards on page...`);

  for (const card of orderCards) {
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

    // Extract product titles
    const itemElements = Array.from(card.querySelectorAll([
      'a[href*="/ip/"]',
      '[data-automation-id="product-title"]',
      'span[class*="productTitle"]',
      'div[class*="itemTitle"]'
    ].join(', ')));

    const itemTitles = itemElements
      .map(el => (el.textContent || '').trim())
      .filter(t => t.length > 2 && !/^\$\d/.test(t) && !/view details|track order|reorder/i.test(t));

    // Also check image alt tags if needed
    if (itemTitles.length === 0) {
      const imgs = Array.from(card.querySelectorAll('img[alt]'));
      for (const img of imgs) {
        const alt = img.getAttribute('alt').trim();
        if (alt && alt.length > 2 && !/walmart|logo|icon/i.test(alt)) {
          itemTitles.push(alt);
        }
      }
    }

    const items = [...new Set(itemTitles)];
    const uniqueKey = `${dateStr}_${amt.toFixed(2)}`;

    if (dateStr && amt > 0 && !seenKeys.has(uniqueKey)) {
      seenKeys.add(uniqueKey);
      orders.push({
        date: dateStr,
        amount: amt,
        description: 'Walmart',
        category: 'groceries',
        items: items
      });
      console.log(`  ✅ ${dateStr} | $${amt.toFixed(2)} | ${items.slice(0, 3).join(', ')}${items.length > 3 ? ` (+${items.length - 3} more)` : ''}`);
    }
  }

  if (orders.length === 0) {
    console.warn("⚠️ No orders were detected on https://www.walmart.com/orders");
    alert("⚠️ Could not detect any orders.\n\nPlease verify you are logged in at https://www.walmart.com/orders with orders visible on screen.");
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
  const filename = `shallot_walmart_itemized_${orders.length}_orders.csv`;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  console.log(`🎉 Downloaded: ${filename}`);
  alert(`🎉 SUCCESS!\n\nHarvested ${orders.length} Walmart purchases!\n\nDownloaded: ${filename}`);
})();
