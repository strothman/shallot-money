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

  // 💳 Shared Membership Filter: Only export YOUR personal purchases
  // Automatically includes all EBT purchases and checks for your Credit & Debit card digits.
  let savedCards = {};
  try {
    savedCards = JSON.parse(localStorage.getItem('shallot_sams_my_cards') || '{}');
  } catch (e) {}

  let creditLast4 = savedCards.creditLast4 || '';
  let debitLast4 = savedCards.debitLast4 || '';

  if (!creditLast4 && !debitLast4) {
    const input = prompt(
      "💳 Shared Sam's Club Account Filter:\n\n" +
      "Enter the last 4 digits of your Credit and/or Debit card separated by comma (e.g. 1234, 5678):\n" +
      "(EBT purchases will be automatically included! Leave blank to export all orders)."
    );
    if (input) {
      const parts = input.split(/[,;\s]+/).map(p => p.trim().slice(-4)).filter(p => p.length === 4);
      if (parts[0]) creditLast4 = parts[0];
      if (parts[1]) debitLast4 = parts[1];
      localStorage.setItem('shallot_sams_my_cards', JSON.stringify({ creditLast4, debitLast4 }));
    }
  }

  const myCardSet = new Set([creditLast4, debitLast4].filter(Boolean));
  if (myCardSet.size > 0) {
    console.log(`🔒 Shared Account Filtering Active: Matching cards [${Array.from(myCardSet).join(', ')}] + any EBT/SNAP orders.`);
  } else {
    console.log("ℹ️ No card filter specified: Exporting all orders on account.");
  }

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
    'div[class*="sc-order-card"]',
    'div[class*="purchase-card"]',
    'div[class*="history-card"]'
  ];

  let cards = Array.from(document.querySelectorAll(selectors.join(', ')));
  if (cards.length === 0) {
    const totals = Array.from(document.querySelectorAll('*')).filter(el => {
      return el.children.length === 0 && /\$[0-9,]+\.[0-9]{2}/.test(el.textContent) && /order|purchase|total/i.test(el.parentElement?.textContent || '');
    });
    cards = totals.map(t => t.closest('div[class*="card"], div[class*="container"], li, section') || t.parentElement).filter(Boolean);
  }

  console.log(`Found ${cards.length} total order cards on page...`);

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

    // Detect EBT vs Card tender
    let tenders = { ebt: 0, card: 0 };
    const ebtMatch = text.match(/(?:snap|ebt|food\s*stamp)[^\$\n\r]*\$([0-9,]+\.[0-9]{2})/i);
    if (ebtMatch) tenders.ebt = parseFloat(ebtMatch[1].replace(/,/g, ''));

    const cardMatch = text.match(/(?:visa|mastercard|discover|amex|debit|credit|cash)[^\$\n\r]*\$([0-9,]+\.[0-9]{2})/i);
    if (cardMatch) tenders.card = parseFloat(cardMatch[1].replace(/,/g, ''));

    // Check payment card digits (e.g. •••• 1234, ending in 1234)
    const cardDigitsMatch = text.match(/(?:ending in|••••|\*{4}|\.{4}|visa|mastercard|discover|amex|debit|credit)[^\d\n\r]*(\d{4})/i);
    const cardDigits = cardDigitsMatch ? cardDigitsMatch[1] : '';
    const isEBT = tenders.ebt > 0 || /(?:snap|ebt|food\s*stamp)/i.test(text);

    // If shared membership filter is active, skip purchases made on other cards
    if (myCardSet.size > 0) {
      const isMyCard = (cardDigits && myCardSet.has(cardDigits)) || isEBT;
      if (!isMyCard && cardDigits) {
        console.log(`  ⏭️ Skipped order from another cardholder ($${amt.toFixed(2)} on card ending in •••• ${cardDigits})`);
        continue;
      }
    }

    if (dateStr && amt > 0 && !seenKeys.has(uniqueKey)) {
      seenKeys.add(uniqueKey);

      if (tenders.ebt > 0 && tenders.card > 0) {
        orders.push({
          date: dateStr,
          amount: tenders.card,
          description: "Sam's Club (Card)",
          category: cat,
          items: items
        });
        orders.push({
          date: dateStr,
          amount: tenders.ebt,
          description: "Sam's Club (EBT)",
          category: cat,
          items: items
        });
        console.log(`  💳 Split Tender: Sam's Club (Card) $${tenders.card.toFixed(2)} + Sam's Club (EBT) $${tenders.ebt.toFixed(2)}`);
      } else if (tenders.ebt > 0) {
        orders.push({
          date: dateStr,
          amount: amt,
          description: "Sam's Club (EBT)",
          category: cat,
          items: items
        });
      } else {
        orders.push({
          date: dateStr,
          amount: amt,
          description: "Sam's Club",
          category: cat,
          items: items
        });
      }
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
