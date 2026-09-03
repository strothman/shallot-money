import './style.css';
import importedExpenses from './imported_expenses.json';

// ----------------------------------------------------
// CATEGORY DEFINITIONS & PALETTES
// ----------------------------------------------------
const DEFAULT_CATEGORIES = [
  { id: 'groceries', label: 'Groceries', iconName: 'shopping-basket', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  { id: 'transport', label: 'Gas & Auto', iconName: 'fuel', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  { id: 'fastfood', label: 'Fast Food', iconName: 'utensils', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)' },
  { id: 'bills', label: 'Bills', iconName: 'receipt', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.15)' },
  { id: 'entertainment', label: 'Gaming & Fun', iconName: 'gamepad-2', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
  { id: 'gym', label: 'Gym & Health', iconName: 'dumbbell', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.15)' },
  { id: 'shopping', label: 'Shopping', iconName: 'shopping-bag', color: '#db2777', bg: 'rgba(219, 39, 119, 0.15)' },
];

const AVAILABLE_ICONS = [
  'shopping-basket', 'pizza', 'utensils', 'coffee', 'car', 'fuel', 'bus', 'plane',
  'shopping-bag', 'tag', 'gift', 'clapperboard', 'film', 'gamepad-2', 'music', 'tv',
  'receipt', 'home', 'zap', 'wifi', 'smartphone', 'laptop', 'briefcase', 'wrench',
  'heart-pulse', 'dumbbell', 'baby', 'dog', 'cat', 'book-open', 'graduation-cap', 'sparkles'
];

const AVAILABLE_COLORS = [
  '#10b981', '#0d9488', '#0ea5e9', '#2563eb', '#6366f1', '#8b5cf6',
  '#d946ef', '#db2777', '#f43f5e', '#b91c1c', '#ea580c', '#f59e0b'
];

function hexToRgba(hex, alpha = 0.15) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getCategories() {
  if (!state.categories || !Array.isArray(state.categories) || state.categories.length === 0) {
    state.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
  }
  return state.categories;
}

function getCategory(id) {
  const cats = getCategories();
  // Support legacy food mapping
  if (id === 'food') {
    return cats.find(c => c.id === 'groceries') || cats[0];
  }
  return cats.find(c => c.id === id) || {
    id,
    label: id.charAt(0).toUpperCase() + id.slice(1),
    iconName: 'tag',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.15)'
  };
}

function getCategoryIconHtml(cat) {
  const iconName = cat.iconName || 'tag';
  return `<i data-lucide="${iconName}"></i>`;
}

function getDisplayCategoryId(catId) {
  return catId === 'food' ? 'groceries' : catId;
}

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ----------------------------------------------------
// UTILITIES & SECURITY
// ----------------------------------------------------
function escapeHTML(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

function triggerHaptic(duration = 10) {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(duration);
    } catch (e) {}
  }
}

// ----------------------------------------------------
// SMART ITEM CATEGORIZATION ENGINE
// ----------------------------------------------------
const ITEM_RULES = {
  groceries: [
    'lettuce', 'tomato', 'potato', 'potatoes', 'onion', 'onions', 'garlic', 'apple', 'apples', 'banana', 'bananas',
    'cherry', 'cherries', 'fruit', 'fruits', 'vegetable', 'vegetables', 'produce', 'salad', 'milk', 'cheese', 'cheeses',
    'butter', 'yogurt', 'cream', 'creamer', 'egg', 'eggs', 'bread', 'buns', 'bagel', 'bagels', 'tortilla', 'tortillas',
    'chicken', 'beef', 'pork', 'meat', 'patty', 'patties', 'nugget', 'nuggets', 'nugs', 'fries', 'fish', 'salmon',
    'tuna', 'turkey', 'bacon', 'sausage', 'water', 'cereal', 'salsa', 'chips', 'sauce', 'oil', 'pasta', 'rice',
    'soup', 'bean', 'beans', 'flour', 'sugar', 'spice', 'spices', 'pepper', 'salt', 'cookie', 'cookies', 'sweet bread',
    'donette', 'donettes', 'can', 'cans', 'groceries', 'grocery', 'lime', 'lemon', 'orange', 'berry', 'berries'
  ],
  fastfood: [
    'sandwich', 'sandwiches', 'pizza', 'pizzas', 'burger', 'burgers', 'taco', 'tacos', 'burrito', 'burritos',
    'subway', 'mcdonald', 'wendy', 'kfc', 'popeye', 'starbucks', 'dunkin', 'panera', 'chipotle', 'smoothie', 'smoothies',
    'shake', 'shakes', 'ice cream', 'donut', 'donuts', 'combo', 'meal', 'nuggets meal', 'fry', 'drink', 'drinks',
    'coffee', 'latte', 'frappe', 'biscuit', 'wings'
  ],
  transport: [
    'gas', 'fuel', 'unleaded', 'diesel', 'oil change', 'car wash', 'tire', 'tires', 'wiper', 'wipers',
    'parking', 'toll', 'tolls', 'uber', 'lyft', 'auto', 'brake', 'brakes', 'alignment', 'transit'
  ],
  bills: [
    'prime', 'amazon prime', 'subscription', 'sub', 'membership', 'cloud', 'icloud', 'netflix', 'spotify',
    'hulu', 'disney', 'utility', 'electric', 'power', 'water bill', 'internet', 'wifi', 'cable', 'phone',
    'insurance', 'storage', 'domain', 'hosting'
  ],
  entertainment: [
    'game', 'games', 'gaming', 'steam', 'arena', 'sineus arena', 'ticket', 'tickets', 'movie', 'movies', 'cinema',
    'theatre', 'theater', 'nintendo', 'playstation', 'xbox', 'roblox', 'oculus', 'concert', 'museum', 'dlc'
  ],
  gym: [
    'fitness', 'gym', 'workout', 'protein', 'powder', 'creatine', 'vitamin', 'vitamins', 'supplement', 'supplements',
    'dumbbell', 'bandage', 'band-aid', 'advil', 'tylenol', 'medicine', 'pharmacy', 'prescription', 'first aid',
    'shaker', 'electrolytes'
  ],
  shopping: [
    'sock', 'socks', 'shirt', 'shirts', 'pants', 'jeans', 'hoodie', 'jacket', 'shoes', 'boots', 'sunglasses',
    'glasses', 'towel', 'towels', 'soap', 'shampoo', 'conditioner', 'deodorant', 'toothpaste', 'toothbrush',
    'cleaner', 'detergent', 'bleach', 'sponge', 'paper towel', 'toilet paper', 'tissue', 'trash bag', 'trash bags',
    'card', 'cards', 'gift', 'gift card', 'amazon card', 'charger', 'cable', 'cord', 'case', 'pillow', 'blanket',
    'candle', 'lamp', 'bulb', 'battery', 'batteries', 'tape', 'tool', 'tools', 'blender', 'pan', 'pot', 'knife',
    'plate', 'cup', 'mug', 'clothes', 'clothing', 'apparel', 'hardware'
  ]
};

function categorizeItem(itemName) {
  if (!itemName || typeof itemName !== 'string') return null;
  const lower = itemName.toLowerCase().trim();

  // Keyword / Substring search across item rules
  for (const [catId, keywords] of Object.entries(ITEM_RULES)) {
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw}`, 'i');
      if (regex.test(lower) || lower.includes(kw)) {
        return catId;
      }
    }
  }

  return null;
}

function predictCategoryFromItems(items) {
  if (!items || !Array.isArray(items) || items.length === 0) return null;

  const counts = {};
  items.forEach(item => {
    const cat = categorizeItem(item);
    if (cat) {
      counts[cat] = (counts[cat] || 0) + 1;
    }
  });

  const sortedCats = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  return sortedCats.length > 0 ? sortedCats[0] : null;
}

function parseExpenseDetails(exp) {
  let cleanDesc = (exp.description || '').trim();
  let items = [];

  if (Array.isArray(exp.items) && exp.items.length > 0) {
    items = exp.items.map(it => String(it).trim()).filter(Boolean);
  } else if (typeof exp.items === 'string' && exp.items.trim()) {
    items = exp.items.split(/[,;\n]+/).map(it => it.trim()).filter(Boolean);
  }

  // If no explicit items, check description for patterns like "Merchant (item1, item2, ...)"
  if (items.length === 0 && cleanDesc) {
    const parenMatch = cleanDesc.match(/^(.*?)\s*\((.+)\)\s*$/);
    if (parenMatch) {
      const candidateMerchant = parenMatch[1].trim();
      const rawItems = parenMatch[2].trim();
      // Split items by commas or semicolons
      const splitItems = rawItems.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
      if (candidateMerchant && splitItems.length > 0) {
        cleanDesc = candidateMerchant;
        items = splitItems;
      }
    }
  }

  // Smart classify each item
  const categorizedItems = items.map(item => {
    const detectedCatId = categorizeItem(item);
    return {
      name: item,
      categoryId: detectedCatId || exp.category || 'groceries'
    };
  });

  // Calculate multi-category distribution
  const catDistribution = {};
  categorizedItems.forEach(ci => {
    catDistribution[ci.categoryId] = (catDistribution[ci.categoryId] || 0) + 1;
  });

  return {
    merchant: cleanDesc || 'Expense',
    rawDescription: exp.description || '',
    items: items,
    categorizedItems: categorizedItems,
    catDistribution: catDistribution,
    hasItems: items.length > 0
  };
}

function renderReceiptDrawerHtml(details, drawerId) {
  if (!details.hasItems) return '';

  const distKeys = Object.keys(details.catDistribution);
  const distHtml = distKeys.length > 1 ? `
    <div class="receipt-drawer-cats">
      ${distKeys.map(cId => {
        const c = getCategory(cId);
        const count = details.catDistribution[cId];
        return `
          <span class="receipt-cat-tag" style="--cat-color: ${c.color}; --cat-bg: ${c.bg}; --cat-border: ${c.color}40;">
            <span class="cat-dot"></span>
            <span>${escapeHTML(c.label)} (${count})</span>
          </span>
        `;
      }).join('')}
    </div>
  ` : '';

  return `
    <div class="expense-items-drawer" id="${drawerId}">
      <div class="receipt-drawer-header">
        <span class="receipt-drawer-title"><i data-lucide="receipt"></i> Purchased Items (${details.items.length})</span>
        ${distHtml}
      </div>
      <div class="receipt-item-chips">
        ${details.categorizedItems.map(ci => {
          const c = getCategory(ci.categoryId);
          return `
            <span class="receipt-item-chip" style="--item-cat-color: ${c.color}; --item-cat-bg: ${c.bg}; --item-cat-border: ${c.color}35; --item-cat-bg-hover: ${c.bg}">
              <span class="item-chip-dot" style="background-color: ${c.color};"></span>
              <span class="item-chip-label">${escapeHTML(ci.name)}</span>
              <span class="item-chip-cat" style="color: ${c.color};">${escapeHTML(c.label)}</span>
            </span>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ----------------------------------------------------
// MOBILE SMART RECEIPT PARSER & AUTO-MERGE ENGINE
// ----------------------------------------------------
function parseReceiptText(content) {
  if (!content || typeof content !== 'string') return null;
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  const lower = content.toLowerCase();
  let store = 'Store';
  if (lower.includes('walmart') || lower.includes('wal-mart')) store = 'Walmart';
  else if (lower.includes('kroger')) store = 'Kroger';
  else if (lower.includes("sam's") || lower.includes('sams club') || lower.includes('samsclub')) store = "Sam's Club";
  else if (lower.includes('target')) store = 'Target';
  else if (lower.includes('amazon') || lower.includes('amzn')) store = 'Amazon';
  else if (lower.includes('trader joe')) store = "Trader Joe's";
  else if (lower.includes('aldi')) store = 'Aldi';
  else if (lower.includes('costco')) store = 'Costco';
  else if (lower.includes('wawa')) store = 'Wawa';

  // Total amount extraction
  let totalAmt = 0.0;
  for (const line of lines) {
    const m = line.match(/(?:total|amount charged|grand total|final total|paid|balance due)[:\s]*\$?\s*([0-9]+\.[0-9]{2})/i);
    if (m) {
      totalAmt = parseFloat(m[1]);
      break;
    }
  }
  if (totalAmt === 0.0) {
    for (const line of lines) {
      if (/total/i.test(line)) {
        const amtM = line.match(/\$?\s*([0-9]+\.[0-9]{2})/);
        if (amtM) {
          totalAmt = parseFloat(amtM[1]);
          break;
        }
      }
    }
  }
  if (totalAmt === 0.0) {
    const allAmts = Array.from(content.matchAll(/\$([0-9]+\.[0-9]{2})/g)).map(m => parseFloat(m[1]));
    if (allAmts.length > 0) {
      totalAmt = Math.max(...allAmts);
    }
  }

  // Date extraction
  let dateStr = null;
  const dateMatch = content.match(/(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})/i);
  if (dateMatch) {
    const parsedD = new Date(dateMatch[1]);
    if (!isNaN(parsedD.getTime())) {
      dateStr = formatDateLocal(parsedD);
    }
  }
  if (!dateStr) {
    dateStr = formatDateLocal(new Date());
  }

  // Item extraction
  const ignoreWords = new Set([
    'total', 'subtotal', 'tax', 'order', 'delivered', 'delivery', 'pickup', 'shipping',
    'visa', 'mastercard', 'amex', 'payment', 'items', 'qty', 'quantity', 'track', 'review',
    'return', 'help', 'placed', 'arriving', 'savings', 'discount', 'change', 'cash', 'account',
    'status', 'order#', 'order #', 'member', 'store', 'phone', 'receipt', 'customer',
    'barcode', 'tender', 'auth', 'sold by', 'fulfilled by', 'gift card', 'coupons'
  ]);

  const items = [];
  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (line.length < 3 || line.length > 90) continue;
    const firstWord = line.split(/\s+/)[0].toLowerCase().replace(/[:#]/g, '');
    if (ignoreWords.has(firstWord)) continue;
    if (/^\$?[0-9]+\.[0-9]{2}$/.test(line)) continue;
    if (/^(date|time|card|auth|store|phone|order\s*#|trans\s*#|member|cashier)/i.test(line)) continue;

    let clean = line.replace(/^[•\-\*\d+\.]\s*/, '').trim();
    clean = clean.replace(/\s+\$\d+\.\d{2}.*$/, '').trim();
    clean = clean.replace(/\s*(?:qty:?\s*\d+|\bx\d+)\s*$/i, '').trim();

    if (clean.length >= 3 && !/terms of use|privacy policy|rights reserved|thank you for shopping/i.test(clean)) {
      items.push(clean);
    }
  }

  const predictedCat = predictCategoryFromItems(items) || (store === 'Walmart' || store === 'Kroger' || store === 'Aldi' ? 'groceries' : 'shopping');

  return {
    store,
    amount: totalAmt,
    date: dateStr,
    items,
    predictedCategory: predictedCat,
    hasDetails: totalAmt > 0 || items.length > 0
  };
}

function findMatchingExpense(parsedReceipt) {
  if (!parsedReceipt || parsedReceipt.amount <= 0) return null;
  const targetAmt = parsedReceipt.amount;
  const targetTime = new Date(parsedReceipt.date + 'T12:00:00').getTime();

  // Search state.expenses for matching amount within +/- 3 days
  const candidates = state.expenses.filter(exp => {
    const amtMatch = Math.abs(Math.abs(exp.amount) - targetAmt) < 0.01;
    if (!amtMatch) return false;
    const expTime = new Date(exp.date + 'T12:00:00').getTime();
    const diffDays = Math.abs((expTime - targetTime) / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  });

  if (candidates.length === 0) return null;
  const storeLower = parsedReceipt.store.toLowerCase();
  const storeMatch = candidates.find(c => c.description.toLowerCase().includes(storeLower));
  return storeMatch || candidates[0];
}

// ----------------------------------------------------
// APPLICATION STATE
// ----------------------------------------------------
let state = {
  income: 0.00,
  currency: '$',
  categories: null,
  expenses: [],
  selectedCategory: 'groceries',
  theme: 'shallot',
  currentWeekOffset: 0,
  currentMonthOffset: 0,
  hideBillsInBreakdown: false,
};

// ----------------------------------------------------
// DOM ELEMENTS
// ----------------------------------------------------
// Views
const views = {
  dashboard: document.getElementById('view-dashboard'),
  log: document.getElementById('view-log'),
  history: document.getElementById('view-history'),
};

// Tab Navigation
const tabItems = document.querySelectorAll('.tab-item');

// Header Elements
const themeToggle = document.getElementById('theme-toggle');
const settingsBtn = document.getElementById('settings-btn');

// Dashboard Elements
const poolIncomeVal = document.getElementById('pool-income-val');
const poolRemainingVal = document.getElementById('pool-remaining-val');
const poolSpentVal = document.getElementById('pool-spent-val');
const weekSpentVal = document.getElementById('week-spent-val');
const poolProgressFill = document.getElementById('pool-progress-fill');
const weeklyDateRange = document.getElementById('weekly-date-range');
const weeklyChartBars = document.getElementById('weekly-chart-bars');
const categoryBreakdownList = document.getElementById('category-breakdown-list');
const recentSpendingList = document.getElementById('recent-spending-list');
const viewAllRecent = document.getElementById('view-all-recent');
const editIncomeQuick = document.getElementById('edit-income-quick');

// Monthly Breakdown Elements
const monthlyDateLabel = document.getElementById('monthly-date-label');
const monthlyChartBars = document.getElementById('monthly-chart-bars');
const monthlyCategoryBreakdownList = document.getElementById('monthly-category-breakdown-list');

// Log Expense Elements
const expenseAmountInput = document.getElementById('expense-amount');
const expenseDescInput = document.getElementById('expense-desc');
const expenseItemsInput = document.getElementById('expense-items');
const expenseDateInput = document.getElementById('expense-date');
const categoryPicker = document.getElementById('category-picker');
const submitExpenseBtn = document.getElementById('submit-expense-btn');

// History Elements
const historySearchInput = document.getElementById('history-search');
const historyFilterCategory = document.getElementById('history-filter-category');
const historyFeedList = document.getElementById('history-feed-list');

// Settings Elements
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');
const monthlyIncomeInput = document.getElementById('monthly-income-input');
const currencySelect = document.getElementById('currency-select');
const snapshotSelect = document.getElementById('snapshot-select');
const restoreSnapshotBtn = document.getElementById('restore-snapshot-btn');
const exportDataBtn = document.getElementById('export-data-btn');
const importDataBtn = document.getElementById('import-data-btn');
const importFileInput = document.getElementById('import-file-input');
const resetAllBtn = document.getElementById('reset-all-btn');

// Edit Expense Elements
const editExpenseModal = document.getElementById('edit-expense-modal');
const closeEditExpense = document.getElementById('close-edit-expense');
const editExpenseId = document.getElementById('edit-expense-id');
const editExpenseAmount = document.getElementById('edit-expense-amount');
const editExpenseDesc = document.getElementById('edit-expense-desc');
const editExpenseItemsInput = document.getElementById('edit-expense-items');
const editExpenseDate = document.getElementById('edit-expense-date');
const editCategoryPicker = document.getElementById('edit-category-picker');
const saveExpenseBtn = document.getElementById('save-expense-btn');

// Delete Confirmation Elements
const deleteConfirmModal = document.getElementById('delete-confirm-modal');
const closeDeleteConfirm = document.getElementById('close-delete-confirm');
const deleteConfirmText = document.getElementById('delete-confirm-text');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

// Undo Toast Elements
const undoToast = document.getElementById('undo-toast');
const toastMessage = document.getElementById('toast-message');
const toastUndoBtn = document.getElementById('toast-undo-btn');
let lastDeletedExpense = null;
let toastTimeout = null;

function showToast(msg, duration = 3000) {
  if (!undoToast || !toastMessage) return;
  toastMessage.textContent = msg;
  if (toastUndoBtn) toastUndoBtn.style.display = 'none';
  undoToast.classList.add('active');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    undoToast.classList.remove('active');
  }, duration);
}

// Smart Receipt Ingest Modal Elements
const btnOpenReceiptPaste = document.getElementById('btn-open-receipt-paste');
const receiptPasteModal = document.getElementById('receipt-paste-modal');
const closeReceiptPaste = document.getElementById('close-receipt-paste');
const receiptPasteInput = document.getElementById('receipt-paste-input');
const receiptParsePreview = document.getElementById('receipt-parse-preview');
const previewStoreBadge = document.getElementById('preview-store-badge');
const previewDateBadge = document.getElementById('preview-date-badge');
const previewAmtBadge = document.getElementById('preview-amt-badge');
const previewItemsCount = document.getElementById('preview-items-count');
const previewChipsContainer = document.getElementById('preview-chips-container');
const previewMatchNotice = document.getElementById('preview-match-notice');
const btnReceiptAutofill = document.getElementById('btn-receipt-autofill');
const btnReceiptMerge = document.getElementById('btn-receipt-merge');
const btnEditPasteReceipt = document.getElementById('btn-edit-paste-receipt');

// ----------------------------------------------------
// LOCALSTORAGE & SNAPSHOT FUNCTIONS
// ----------------------------------------------------
const SNAPSHOT_KEY = 'shallot_money_snapshots';

function saveState() {
  localStorage.setItem('shallot_money_state', JSON.stringify(state));
  localStorage.setItem('capybudget_state', JSON.stringify(state)); // dual-write for 100% backward safety
}

function createSnapshot(reason = 'Automatic backup') {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    let snapshots = raw ? JSON.parse(raw) : [];
    const newSnap = {
      timestamp: Date.now(),
      reason,
      state: JSON.parse(JSON.stringify(state))
    };
    snapshots.unshift(newSnap);
    if (snapshots.length > 5) snapshots = snapshots.slice(0, 5);
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshots));
    populateSnapshotSelector();
  } catch (e) {
    console.warn('Snapshot error:', e);
  }
}

function populateSnapshotSelector() {
  if (!snapshotSelect) return;
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    const snapshots = raw ? JSON.parse(raw) : [];
    if (!snapshots || snapshots.length === 0) {
      snapshotSelect.innerHTML = '<option value="">No snapshots recorded yet</option>';
      return;
    }
    snapshotSelect.innerHTML = snapshots.map((s, idx) => {
      const d = new Date(s.timestamp);
      const timeStr = `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      return `<option value="${idx}">[${timeStr}] ${s.reason} (${s.state.expenses?.length || 0} items)</option>`;
    }).join('');
  } catch (e) {
    console.warn('Snapshot populate error:', e);
  }
}

function restoreSelectedSnapshot() {
  if (!snapshotSelect || snapshotSelect.value === '') {
    alert('Please select a snapshot to restore.');
    return;
  }
  const idx = parseInt(snapshotSelect.value, 10);
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    const snapshots = raw ? JSON.parse(raw) : [];
    if (snapshots[idx]) {
      if (confirm(`Restore snapshot "${snapshots[idx].reason}"? Current data will be replaced.`)) {
        createSnapshot('Pre-restore backup');
        state = { ...state, ...snapshots[idx].state };
        saveState();
        applyTheme();
        updateCurrencyUI();
        updateBillsToggleUI();
        renderDashboard();
        renderMonthlyBreakdown();
        initCategorySelectors();
        alert('Snapshot restored successfully!');
      }
    }
  } catch (e) {
    alert('Failed to restore snapshot: ' + e.message);
  }
}

function updateCurrencyUI() {
  const sym = state.currency || '$';
  document.querySelectorAll('.currency-symbol').forEach(el => {
    el.textContent = sym;
  });
  if (currencySelect) {
    currencySelect.value = sym;
  }
}

function showUndoToast(msgOrExpense) {
  if (!undoToast) return;
  if (typeof msgOrExpense === 'string') {
    toastMessage.textContent = msgOrExpense;
  } else if (msgOrExpense && msgOrExpense.description) {
    lastDeletedExpense = msgOrExpense;
    toastMessage.textContent = `Deleted "${escapeHTML(msgOrExpense.description)}" (${formatCurrency(msgOrExpense.amount)})`;
  }
  if (toastUndoBtn) toastUndoBtn.style.display = 'inline-block';
  undoToast.classList.add('active');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    undoToast.classList.remove('active');
    lastDeletedExpense = null;
  }, 5000);
}

function handleUndoDelete() {
  if (lastDeletedExpense) {
    triggerHaptic(15);
    state.expenses.unshift(lastDeletedExpense);
    saveState();
    renderDashboard();
    renderMonthlyBreakdown();
    renderHistory();
    if (undoToast) undoToast.classList.remove('active');
    lastDeletedExpense = null;
  }
}

function loadState() {
  const saved = localStorage.getItem('shallot_money_state') || localStorage.getItem('capybudget_state');
  if (saved) {
    try {
      state = { ...state, ...JSON.parse(saved) };
      if (!state.currency) state.currency = '$';
      if (!state.categories || !Array.isArray(state.categories) || state.categories.length === 0) {
        state.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
      }
    } catch (e) {
      console.error('Error loading state from localStorage:', e);
    }
  } else {
    // If no local storage exists, load the imported Excel data directly as default!
    state.income = 3000.00;
    state.currency = '$';
    state.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
    state.expenses = [...importedExpenses];
    saveState();
  }
  updateCurrencyUI();
  populateSnapshotSelector();
}

function seedMockData() {
  state.income = 5000;
  state.currency = '$';

  const today = new Date();
  const getPastDateString = (daysAgo) => {
    const d = new Date();
    d.setDate(today.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  state.expenses = [
    { id: '1', amount: 15.50, description: 'Starbucks Coffee', category: 'food', date: getPastDateString(0) },
    { id: '2', amount: 28.00, description: 'Uber Ride', category: 'transport', date: getPastDateString(0) },
    { id: '3', amount: 120.00, description: 'Electricity Bill', category: 'bills', date: getPastDateString(1) },
    { id: '4', amount: 45.00, description: 'Cinema Tickets', category: 'entertainment', date: getPastDateString(2) },
    { id: '5', amount: 89.99, description: 'New Shoes', category: 'shopping', date: getPastDateString(3) },
  ];
  saveState();
}

// ----------------------------------------------------
// THEME MANAGEMENT
// ----------------------------------------------------
const THEMES = ['shallot', 'christmas', 'antigravity', 'halloween', 'july4th', 'glacier', 'valentine'];

function applyTheme() {
  if (!state.theme || !THEMES.includes(state.theme)) {
    state.theme = 'shallot';
  }
  document.documentElement.setAttribute('data-theme', state.theme);

  // Update theme option selection state
  document.querySelectorAll('.theme-option').forEach(opt => {
    if (opt.getAttribute('data-theme') === state.theme) {
      opt.classList.add('active');
    } else {
      opt.classList.remove('active');
    }
  });
}

function toggleTheme() {
  triggerHaptic(12);
  const currentIndex = THEMES.indexOf(state.theme);
  const nextIndex = (currentIndex + 1) % THEMES.length;
  state.theme = THEMES[nextIndex];
  applyTheme();
  saveState();
}

function updateBillsToggleUI() {
  const toggleButtons = [
    document.getElementById('toggle-bills-btn'),
    document.getElementById('monthly-toggle-bills-btn')
  ];

  toggleButtons.forEach(btn => {
    if (!btn) return;
    if (state.hideBillsInBreakdown) {
      btn.classList.add('active');
      btn.innerHTML = `<i data-lucide="eye-off"></i> <span>Bills Hidden</span>`;
    } else {
      btn.classList.remove('active');
      btn.innerHTML = `<i data-lucide="eye"></i> <span>Bills Shown</span>`;
    }
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// ----------------------------------------------------
// DATE & FORMATTING UTILITIES
// ----------------------------------------------------
function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getStartOfWeek(date, offsetWeeks = 0) {
  const d = new Date(date);
  d.setDate(d.getDate() + offsetWeeks * 7);
  const day = d.getDay();
  // Adjust so Sunday is first day of the week
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function getEndOfWeek(date, offsetWeeks = 0) {
  const start = getStartOfWeek(date, offsetWeeks);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

function getMonthName(date) {
  return date.toLocaleString('default', { month: 'long' });
}

function formatCurrency(amount) {
  const sym = state.currency || '$';
  const val = Number(amount || 0);
  const formatted = Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (val < 0) {
    return `-${sym}${formatted}`;
  }
  return `${sym}${formatted}`;
}

function formatDateDisplay(dateStr) {
  const [year, month, day] = dateStr.split('-');
  const dateObj = new Date(year, month - 1, day);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const tStr = formatDateLocal(today);
  const yStr = formatDateLocal(yesterday);

  if (dateStr === tStr) return 'Today';
  if (dateStr === yStr) return 'Yesterday';

  return dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ----------------------------------------------------
// UI RENDERING & DRILL-DOWN INVESTIGATION
// ----------------------------------------------------
function drillDownToHistory({ startDate, endDate, label, categoryId = null }) {
  state.historyDrillDownFilter = { startDate, endDate, label, categoryId };

  if (categoryId) {
    historyFilterCategory.value = categoryId;
  } else {
    historyFilterCategory.value = 'all';
  }

  // Switch to History Tab
  tabItems.forEach(t => t.classList.remove('active'));
  const historyTab = Array.from(tabItems).find(t => t.getAttribute('data-view') === 'view-history');
  if (historyTab) historyTab.classList.add('active');

  Object.keys(views).forEach(key => {
    if (views[key].id === 'view-history') {
      views[key].classList.add('active');
    } else {
      views[key].classList.remove('active');
    }
  });

  renderHistory();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderDashboard() {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // 1. Calculate Real-Time Current Month Pool Stats (Always locked to active month)
  const currentMonthExpenses = state.expenses.filter(exp => {
    const expDate = new Date(exp.date + 'T00:00:00');
    return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
  });

  const totalSpentCurrentMonth = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remaining = state.income - totalSpentCurrentMonth;
  const percentLeft = state.income > 0 ? Math.max(0, Math.min(100, (remaining / state.income) * 100)) : 0;

  poolRemainingVal.textContent = formatCurrency(remaining);
  poolSpentVal.textContent = formatCurrency(totalSpentCurrentMonth);
  poolIncomeVal.textContent = formatCurrency(state.income);
  poolProgressFill.style.width = `${percentLeft}%`;

  if (percentLeft > 50) {
    poolProgressFill.style.background = 'var(--emerald-500)';
  } else if (percentLeft > 20) {
    poolProgressFill.style.background = 'var(--amber-500)';
  } else if (percentLeft > 0) {
    poolProgressFill.style.background = 'var(--rose-500)';
  } else {
    poolProgressFill.style.background = 'white';
  }

  // 2. Calculate Weekly Breakdown stats
  const startOfWeek = getStartOfWeek(today, state.currentWeekOffset);
  const endOfWeek = getEndOfWeek(today, state.currentWeekOffset);

  weeklyDateRange.textContent = `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  const startOfWeekStr = formatDateLocal(startOfWeek);
  const endOfWeekStr = formatDateLocal(endOfWeek);

  const weeklyExpenses = state.expenses.filter(exp => exp.date >= startOfWeekStr && exp.date <= endOfWeekStr);
  const totalSpentWeek = weeklyExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Spent This Week (always reflects the current real-time week, offset = 0)
  const realStartOfWeek = getStartOfWeek(today, 0);
  const realEndOfWeek = getEndOfWeek(today, 0);
  const realStartOfWeekStr = formatDateLocal(realStartOfWeek);
  const realEndOfWeekStr = formatDateLocal(realEndOfWeek);
  const realWeeklyExpenses = state.expenses.filter(exp => exp.date >= realStartOfWeekStr && exp.date <= realEndOfWeekStr);
  const totalSpentRealWeek = realWeeklyExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  weekSpentVal.textContent = formatCurrency(totalSpentRealWeek);

  // Group by day of week and category
  const cats = getCategories();
  const daySums = Array(7).fill(0);
  const dayCatSums = Array(7).fill(null).map(() => {
    const obj = {};
    cats.forEach(c => obj[c.id] = 0);
    return obj;
  });

  weeklyExpenses.forEach(exp => {
    const expDate = new Date(exp.date + 'T00:00:00');
    const dayIndex = expDate.getDay(); // Sun = 0, Mon = 1 ... Sat = 6
    if (!state.hideBillsInBreakdown || exp.category !== 'bills') {
      daySums[dayIndex] += exp.amount;
    }
    const cat = getCategory(exp.category);
    if (!dayCatSums[dayIndex][cat.id]) dayCatSums[dayIndex][cat.id] = 0;
    dayCatSums[dayIndex][cat.id] += exp.amount;
  });

  const maxDaySum = Math.max(...daySums, 10); // Minimum scale limit of $10

  // Render weekly chart bars
  weeklyChartBars.innerHTML = WEEK_DAYS.map((day, i) => {
    const total = daySums[i];
    const catAmounts = dayCatSums[i];
    const isToday = state.currentWeekOffset === 0 && today.getDay() === i;

    // Create segments for each active category
    const segmentsHtml = cats.map(cat => {
      if (state.hideBillsInBreakdown && cat.id === 'bills') return '';
      const amt = catAmounts[cat.id] || 0;
      if (amt === 0) return '';
      const heightPercent = (amt / maxDaySum) * 100;
      const bgStyle = `background-color: ${cat.color};`;

      return `
        <div class="chart-bar-segment" 
             style="height: ${heightPercent}%; ${bgStyle}" 
             title="${escapeHTML(cat.label)}: ${formatCurrency(amt)}"></div>
      `;
    }).join('');

    return `
      <div class="chart-bar-container" data-day-index="${i}">
        <span class="chart-bar-val ${isToday ? 'today' : ''}">${total > 0 ? (state.currency || '$') + total.toFixed(0) : '&nbsp;'}</span>
        <div class="chart-bar-wrapper">
          ${segmentsHtml}
        </div>
        <span class="chart-day ${isToday ? 'today' : ''}">${day}</span>
      </div>
    `;
  }).join('');

  // Attach click listeners to daily bars
  weeklyChartBars.querySelectorAll('.chart-bar-container').forEach(barEl => {
    barEl.addEventListener('click', () => {
      const idx = parseInt(barEl.getAttribute('data-day-index'), 10);
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + idx);
      const dateStr = formatDateLocal(d);
      const total = daySums[idx];
      drillDownToHistory({
        startDate: dateStr,
        endDate: dateStr,
        label: `${formatDateDisplay(dateStr)} — ${formatCurrency(total)}`,
      });
    });
  });

  // Category breakdown lists
  const catSums = {};
  cats.forEach(c => catSums[c.id] = 0);
  weeklyExpenses.forEach(exp => {
    const cat = getCategory(exp.category);
    if (!catSums[cat.id]) catSums[cat.id] = 0;
    catSums[cat.id] += exp.amount;
  });

  const sortedCategories = [...cats].sort((a, b) => (catSums[b.id] || 0) - (catSums[a.id] || 0));

  let categoryHtml = sortedCategories.map(cat => {
    if (state.hideBillsInBreakdown && cat.id === 'bills') return '';
    const totalAmt = catSums[cat.id] || 0;
    if (totalAmt === 0) return '';

    return `
      <div class="category-row" data-cat-id="${cat.id}">
        <div class="category-row-info">
          <div class="category-icon-wrapper" style="background-color: ${cat.color}">
            ${getCategoryIconHtml(cat)}
          </div>
          <span class="category-name">${escapeHTML(cat.label)}</span>
        </div>
        <span class="category-amt">${formatCurrency(totalAmt)}</span>
      </div>
    `;
  }).join('');

  if (totalSpentWeek > 0) {
    const displayTotal = state.hideBillsInBreakdown ?
      weeklyExpenses.filter(e => e.category !== 'bills').reduce((sum, exp) => sum + exp.amount, 0) :
      totalSpentWeek;
    const labelText = state.hideBillsInBreakdown ? 'Total Weekly Spent (excl. Bills)' : 'Total Weekly Spent';
    categoryHtml += `
      <div class="category-row total-row" style="margin-top: 8px; border-top: 1px dashed var(--border-color); padding-top: 12px; opacity: 0.95;">
        <div class="category-row-info">
          <div class="category-icon-wrapper" style="background: var(--accent-gradient); display: flex; justify-content: center; align-items: center;">
            <i data-lucide="calculator" style="width: 14px; height: 14px; color: white;"></i>
          </div>
          <span class="category-name" style="font-weight: 700;">${labelText}</span>
        </div>
        <span class="category-amt" style="font-weight: 800; font-size: 0.95rem; color: var(--accent-color);">${formatCurrency(displayTotal)}</span>
      </div>
    `;
  }

  categoryBreakdownList.innerHTML = categoryHtml;

  // Attach click listeners to weekly category rows
  categoryBreakdownList.querySelectorAll('.category-row:not(.total-row)').forEach(rowEl => {
    rowEl.addEventListener('click', () => {
      const catId = rowEl.getAttribute('data-cat-id');
      const cat = getCategory(catId);
      const catTotal = catSums[catId] || 0;
      drillDownToHistory({
        startDate: startOfWeekStr,
        endDate: endOfWeekStr,
        label: `${cat.label} (${formatDateDisplay(startOfWeekStr)} - ${formatDateDisplay(endOfWeekStr)}) — ${formatCurrency(catTotal)}`,
        categoryId: catId
      });
    });
  });

  // 3. Render Recent list
  const recentSorted = [...state.expenses]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 4);

  if (recentSorted.length === 0) {
    recentSpendingList.innerHTML = `
      <div class="empty-state">
        <i data-lucide="info"></i>
        <p>No recent spending logged yet.</p>
      </div>
    `;
  } else {
    recentSpendingList.innerHTML = recentSorted.map(exp => {
      const cat = getCategory(exp.category);
      const details = parseExpenseDetails(exp);
      const hasItems = details.hasItems;

      const receiptPillHtml = hasItems ? `
        <button type="button" class="receipt-pill" data-drawer-id="drawer-recent-${exp.id}" title="Click to view purchased items">
          <i data-lucide="shopping-bag"></i>
          <span>${details.items.length} ${details.items.length === 1 ? 'item' : 'items'}</span>
          <span class="receipt-toggle-chevron"><i data-lucide="chevron-down"></i></span>
        </button>
      ` : '';

      const drawerHtml = renderReceiptDrawerHtml(details, `drawer-recent-${exp.id}`);

      return `
        <div class="expense-item" data-id="${exp.id}">
          <div class="expense-item-content">
            <div class="item-left">
              <div class="category-icon-wrapper" style="background-color: ${cat.color}">
                ${getCategoryIconHtml(cat)}
              </div>
              <div class="item-details">
                <div class="item-title-row">
                  <span class="item-desc">${escapeHTML(details.merchant)}</span>
                  ${receiptPillHtml}
                </div>
                <span class="item-meta">${formatDateDisplay(exp.date)} &bull; ${escapeHTML(cat.label)}</span>
              </div>
            </div>
            <div class="item-right">
              <span class="item-amount ${exp.amount < 0 ? 'refund' : ''}">${formatCurrency(exp.amount)}</span>
            </div>
          </div>
          ${drawerHtml}
        </div>
      `;
    }).join('');

    // Attach click listeners for recent receipt pills
    recentSpendingList.querySelectorAll('.receipt-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerHaptic(6);
        const drawerId = pill.getAttribute('data-drawer-id');
        const drawer = document.getElementById(drawerId);
        if (drawer) {
          const isOpen = drawer.classList.toggle('open');
          pill.classList.toggle('open', isOpen);
        }
      });
    });
  }

  // Reinitialize icons in dynamically added DOM
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderMonthlyBreakdown() {
  const today = new Date();
  const targetDate = new Date(today.getFullYear(), today.getMonth() + state.currentMonthOffset, 1);
  const targetMonth = targetDate.getMonth();
  const targetYear = targetDate.getFullYear();

  // Update month label
  monthlyDateLabel.textContent = targetDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Get all expenses for the target month
  const monthExpenses = state.expenses.filter(exp => {
    const expDate = new Date(exp.date + 'T00:00:00');
    return expDate.getMonth() === targetMonth && expDate.getFullYear() === targetYear;
  });

  // Determine weeks of the month (Sunday-based)
  const firstDay = new Date(targetYear, targetMonth, 1);
  const lastDay = new Date(targetYear, targetMonth + 1, 0);

  // Build week ranges for this month
  const weeks = [];
  let weekStart = new Date(firstDay);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  while (weekStart <= lastDay) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const displayStart = new Date(Math.max(weekStart.getTime(), firstDay.getTime()));
    const displayEnd = new Date(Math.min(weekEnd.getTime(), lastDay.getTime()));

    weeks.push({
      start: new Date(weekStart),
      end: weekEnd,
      displayStart,
      displayEnd,
      startStr: formatDateLocal(weekStart),
      endStr: formatDateLocal(weekEnd),
    });

    weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() + 1);
  }

  // Calculate spending per week and per category
  const cats = getCategories();
  const weekSums = [];
  const weekCatSums = [];

  weeks.forEach(w => {
    const weekExpenses = monthExpenses.filter(exp => exp.date >= w.startStr && exp.date <= w.endStr);
    const total = weekExpenses
      .filter(exp => !state.hideBillsInBreakdown || exp.category !== 'bills')
      .reduce((sum, exp) => sum + exp.amount, 0);
    weekSums.push(total);

    const catSumsObj = {};
    cats.forEach(c => catSumsObj[c.id] = 0);
    weekExpenses.forEach(exp => {
      const cat = getCategory(exp.category);
      if (!catSumsObj[cat.id]) catSumsObj[cat.id] = 0;
      catSumsObj[cat.id] += exp.amount;
    });
    weekCatSums.push(catSumsObj);
  });

  const maxWeekSum = Math.max(...weekSums, 10);
  const totalSpentMonth = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Render weekly bars for the month
  monthlyChartBars.innerHTML = weeks.map((w, i) => {
    const total = weekSums[i];
    const catAmounts = weekCatSums[i];
    const startDay = w.displayStart.getDate();
    const endDay = w.displayEnd.getDate();
    const label = startDay === endDay ? `${startDay}` : `${startDay}-${endDay}`;
    const isCurrentWeek = state.currentMonthOffset === 0 && today >= w.start && today <= w.end;

    // Create segments for each active category
    const segmentsHtml = cats.map(cat => {
      if (state.hideBillsInBreakdown && cat.id === 'bills') return '';
      const amt = catAmounts[cat.id] || 0;
      if (amt === 0) return '';
      const heightPercent = (amt / maxWeekSum) * 100;
      const bgStyle = `background-color: ${cat.color};`;

      return `
        <div class="chart-bar-segment" 
             style="height: ${heightPercent}%; ${bgStyle}" 
             title="${escapeHTML(cat.label)}: ${formatCurrency(amt)}"></div>
      `;
    }).join('');

    return `
      <div class="chart-bar-container">
        <span class="chart-bar-val ${isCurrentWeek ? 'today' : ''}">${total > 0 ? (state.currency || '$') + total.toFixed(0) : '&nbsp;'}</span>
        <div class="chart-bar-wrapper">
          ${segmentsHtml}
        </div>
        <span class="chart-day ${isCurrentWeek ? 'today' : ''}">${label}</span>
      </div>
    `;
  }).join('');

  // Category breakdown for the month
  const catSums = {};
  cats.forEach(c => catSums[c.id] = 0);
  monthExpenses.forEach(exp => {
    const cat = getCategory(exp.category);
    if (!catSums[cat.id]) catSums[cat.id] = 0;
    catSums[cat.id] += exp.amount;
  });

  const sortedCategories = [...cats].sort((a, b) => (catSums[b.id] || 0) - (catSums[a.id] || 0));

  let categoryHtml = sortedCategories.map(cat => {
    if (state.hideBillsInBreakdown && cat.id === 'bills') return '';
    const totalAmt = catSums[cat.id] || 0;
    if (totalAmt === 0) return '';

    return `
      <div class="category-row" data-cat-id="${cat.id}">
        <div class="category-row-info">
          <div class="category-icon-wrapper" style="background-color: ${cat.color}">
            ${getCategoryIconHtml(cat)}
          </div>
          <span class="category-name">${escapeHTML(cat.label)}</span>
        </div>
        <span class="category-amt">${formatCurrency(totalAmt)}</span>
      </div>
    `;
  }).join('');

  if (totalSpentMonth > 0) {
    const displayTotal = state.hideBillsInBreakdown ?
      monthExpenses.filter(e => e.category !== 'bills').reduce((sum, exp) => sum + exp.amount, 0) :
      totalSpentMonth;
    const labelText = state.hideBillsInBreakdown ? 'Total Monthly Spent (excl. Bills)' : 'Total Monthly Spent';
    categoryHtml += `
      <div class="category-row total-row" style="margin-top: 8px; border-top: 1px dashed var(--border-color); padding-top: 12px; opacity: 0.95;">
        <div class="category-row-info">
          <div class="category-icon-wrapper" style="background: var(--accent-gradient); display: flex; justify-content: center; align-items: center;">
            <i data-lucide="calendar" style="width: 14px; height: 14px; color: white;"></i>
          </div>
          <span class="category-name" style="font-weight: 700;">${labelText}</span>
        </div>
        <span class="category-amt" style="font-weight: 800; font-size: 0.95rem; color: var(--accent-color);">${formatCurrency(displayTotal)}</span>
      </div>
    `;
  }

  monthlyCategoryBreakdownList.innerHTML = categoryHtml;

  // Attach click listeners to monthly weekly bars
  monthlyChartBars.querySelectorAll('.chart-bar-container').forEach((barEl, i) => {
    barEl.addEventListener('click', () => {
      const w = weeks[i];
      const total = weekSums[i];
      const startDay = w.displayStart.getDate();
      const endDay = w.displayEnd.getDate();
      const label = startDay === endDay ? `${startDay}` : `${startDay}-${endDay}`;
      drillDownToHistory({
        startDate: w.startStr,
        endDate: w.endStr,
        label: `${targetDate.toLocaleString('default', { month: 'long', year: 'numeric' })} (${label}) — ${formatCurrency(total)}`,
      });
    });
  });

  // Attach click listeners to monthly category rows
  monthlyCategoryBreakdownList.querySelectorAll('.category-row:not(.total-row)').forEach(rowEl => {
    rowEl.addEventListener('click', () => {
      const catId = rowEl.getAttribute('data-cat-id');
      const cat = getCategory(catId);
      const catTotal = catSums[catId] || 0;
      const monthStartStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01`;
      const monthEndStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${new Date(targetYear, targetMonth + 1, 0).getDate()}`;
      drillDownToHistory({
        startDate: monthStartStr,
        endDate: monthEndStr,
        label: `${cat.label} (${targetDate.toLocaleString('default', { month: 'long', year: 'numeric' })}) — ${formatCurrency(catTotal)}`,
        categoryId: catId
      });
    });
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderHistory() {
  const searchQuery = historySearchInput.value.toLowerCase().trim();
  const catFilter = historyFilterCategory.value;

  const banner = document.getElementById('history-filter-banner');
  const bannerLabel = document.getElementById('history-filter-label');
  const clearBannerBtn = document.getElementById('clear-history-filter-btn');

  if (state.historyDrillDownFilter) {
    if (banner && bannerLabel) {
      banner.style.display = 'flex';
      bannerLabel.textContent = `Showing: ${state.historyDrillDownFilter.label}`;
    }
  } else {
    if (banner) banner.style.display = 'none';
  }

  if (clearBannerBtn) {
    clearBannerBtn.onclick = () => {
      triggerHaptic(8);
      state.historyDrillDownFilter = null;
      historyFilterCategory.value = 'all';
      historySearchInput.value = '';
      renderHistory();
    };
  }

  // Filter expenses
  let filtered = state.expenses.filter(exp => {
    const details = parseExpenseDetails(exp);
    const matchesDesc = details.merchant.toLowerCase().includes(searchQuery) || (exp.description || '').toLowerCase().includes(searchQuery);
    const matchesItems = details.items.some(item => item.toLowerCase().includes(searchQuery));
    const matchesSearch = matchesDesc || matchesItems;
    const matchesCat = catFilter === 'all' || exp.category === catFilter;

    let matchesDrillDown = true;
    if (state.historyDrillDownFilter) {
      const { startDate, endDate, categoryId } = state.historyDrillDownFilter;
      if (startDate && exp.date < startDate) matchesDrillDown = false;
      if (endDate && exp.date > endDate) matchesDrillDown = false;
      if (categoryId && exp.category !== categoryId) matchesDrillDown = false;
    }

    return matchesSearch && matchesCat && matchesDrillDown;
  });

  // Sort descending by date
  filtered.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  // Group by Date
  const groups = {};
  filtered.forEach(exp => {
    if (!groups[exp.date]) {
      groups[exp.date] = [];
    }
    groups[exp.date].push(exp);
  });

  if (filtered.length === 0) {
    historyFeedList.innerHTML = `
      <div class="empty-state">
        <i data-lucide="filter-x"></i>
        <p>No matching expenses found.</p>
      </div>
    `;
  } else {
    historyFeedList.innerHTML = Object.keys(groups).map(dateStr => {
      const groupExpenses = groups[dateStr];
      const dayTotal = groupExpenses.reduce((sum, exp) => sum + exp.amount, 0);

      const itemsHtml = groupExpenses.map(exp => {
        const cat = getCategory(exp.category);
        const details = parseExpenseDetails(exp);
        const hasItems = details.hasItems;

        const receiptPillHtml = hasItems ? `
          <button type="button" class="receipt-pill" data-drawer-id="drawer-hist-${exp.id}" title="Click to view purchased items">
            <i data-lucide="shopping-bag"></i>
            <span>${details.items.length} ${details.items.length === 1 ? 'item' : 'items'}</span>
            <span class="receipt-toggle-chevron"><i data-lucide="chevron-down"></i></span>
          </button>
        ` : '';

        const drawerHtml = renderReceiptDrawerHtml(details, `drawer-hist-${exp.id}`);

        return `
          <div class="expense-item" data-id="${exp.id}">
            <div class="expense-item-content">
              <div class="item-left">
                <div class="category-icon-wrapper" style="background-color: ${cat.color}">
                  ${getCategoryIconHtml(cat)}
                </div>
                <div class="item-details">
                  <div class="item-title-row">
                    <span class="item-desc">${escapeHTML(details.merchant)}</span>
                    ${receiptPillHtml}
                  </div>
                  <span class="item-meta">${escapeHTML(cat.label)}</span>
                </div>
              </div>
              <div class="item-right">
                <span class="item-amount ${exp.amount < 0 ? 'refund' : ''}">${formatCurrency(exp.amount)}</span>
              </div>
            </div>
            ${drawerHtml}
            <div class="expense-actions-overlay">
              <button class="action-btn edit-btn" data-id="${exp.id}" title="Edit Expense">
                <i data-lucide="edit-3"></i>
              </button>
              <button class="action-btn delete-btn" data-id="${exp.id}" title="Delete Expense">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="history-day-group">
          <div class="history-day-header">
            <span>${formatDateDisplay(dateStr)}</span>
            <span style="float: right;">Total: ${formatCurrency(dayTotal)}</span>
          </div>
          <div class="recent-list">
            ${itemsHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  // Hook up click to show action overlays, ignoring clicks on overlays, receipt pills, or drawers
  historyFeedList.querySelectorAll('.expense-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.expense-actions-overlay') || e.target.closest('.receipt-pill') || e.target.closest('.expense-items-drawer')) {
        return;
      }

      const wasShown = item.classList.contains('show-actions');

      // Close all other action overlays
      historyFeedList.querySelectorAll('.expense-item').forEach(otherItem => {
        otherItem.classList.remove('show-actions');
      });

      if (!wasShown) {
        item.classList.add('show-actions');
      }
    });
  });

  // Attach click listeners for history receipt pills
  historyFeedList.querySelectorAll('.receipt-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerHaptic(6);
      const drawerId = pill.getAttribute('data-drawer-id');
      const drawer = document.getElementById(drawerId);
      if (drawer) {
        const isOpen = drawer.classList.toggle('open');
        pill.classList.toggle('open', isOpen);
      }
    });
  });

  // Edit action
  historyFeedList.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerHaptic(10);
      const id = btn.getAttribute('data-id');
      openEditExpenseModal(id);

      const item = btn.closest('.expense-item');
      if (item) item.classList.remove('show-actions');
    });
  });

  // Delete action
  historyFeedList.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerHaptic(10);
      const id = btn.getAttribute('data-id');
      showDeleteConfirmation(id);

      const item = btn.closest('.expense-item');
      if (item) item.classList.remove('show-actions');
    });
  });

  // Global click to close open action overlays when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.expense-item')) {
      historyFeedList.querySelectorAll('.expense-item').forEach(item => {
        item.classList.remove('show-actions');
      });
    }
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// ----------------------------------------------------
// EXPENSE MUTATION ACTIONS (ADD, EDIT, DELETE)
// ----------------------------------------------------
let expenseIdToDelete = null;

function showDeleteConfirmation(id) {
  const expense = state.expenses.find(exp => exp.id === id);
  if (!expense) return;

  expenseIdToDelete = id;
  const details = parseExpenseDetails(expense);
  const amtStr = formatCurrency(expense.amount);

  deleteConfirmText.textContent = `Are you sure you want to delete "${details.merchant}" (${amtStr})?`;
  deleteConfirmModal.classList.add('active');
}

function deleteExpense(id) {
  const expenseToDelete = state.expenses.find(exp => exp.id === id);
  if (!expenseToDelete) return;

  createSnapshot(`Before deleting expense "${expenseToDelete.description}"`);
  state.expenses = state.expenses.filter(exp => exp.id !== id);
  saveState();
  showUndoToast(expenseToDelete);
  renderDashboard();
  renderMonthlyBreakdown();
  renderHistory();
}

function addExpense(amount, description, category, dateStr, items = null) {
  let parsedItems = [];
  if (Array.isArray(items)) {
    parsedItems = items.map(s => String(s).trim()).filter(Boolean);
  } else if (typeof items === 'string' && items.trim()) {
    parsedItems = items.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
  }

  const newExpense = {
    id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    amount: parseFloat(amount),
    description: description.trim(),
    category: category,
    date: dateStr,
    ...(parsedItems.length > 0 ? { items: parsedItems } : {})
  };

  createSnapshot(`Before adding expense "${description}"`);
  state.expenses.unshift(newExpense);
  saveState();

  // Clear log form inputs
  expenseAmountInput.value = '';
  expenseDescInput.value = '';
  if (expenseItemsInput) expenseItemsInput.value = '';
  expenseDateInput.value = formatDateLocal(new Date());

  // Reset toggle
  const expenseBtn = document.querySelector('#log-type-toggle [data-type="expense"]');
  const refundBtn = document.querySelector('#log-type-toggle [data-type="refund"]');
  if (expenseBtn && refundBtn) {
    refundBtn.classList.remove('active');
    expenseBtn.classList.add('active');
  }

  renderDashboard();
  renderMonthlyBreakdown();
  renderHistory();
}

// ----------------------------------------------------
// CATEGORY MANAGER & SELECTORS
// ----------------------------------------------------
let selectedFormIcon = 'shopping-bag';
let selectedFormColor = '#10b981';

function renderCategoryManagerList() {
  const listEl = document.getElementById('category-manager-list');
  if (!listEl) return;
  const cats = getCategories();
  listEl.innerHTML = cats.map(cat => `
    <div class="category-manager-item" data-id="${cat.id}">
      <div class="category-manager-info">
        <div class="category-icon-wrapper" style="background-color: ${cat.color};">
          ${getCategoryIconHtml(cat)}
        </div>
        <span class="category-manager-name">${escapeHTML(cat.label)}</span>
      </div>
      <div class="category-manager-actions">
        <button class="category-action-btn edit-cat-btn" data-id="${cat.id}" title="Edit Category">
          <i data-lucide="edit-3"></i>
        </button>
        <button class="category-action-btn delete-cat-btn delete-cat" data-id="${cat.id}" title="Delete Category">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    </div>
  `).join('');

  listEl.querySelectorAll('.edit-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      triggerHaptic(8);
      const id = btn.getAttribute('data-id');
      openCategoryFormModal(id);
    });
  });

  listEl.querySelectorAll('.delete-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      triggerHaptic(10);
      const id = btn.getAttribute('data-id');
      deleteCategory(id);
    });
  });

  if (window.lucide) window.lucide.createIcons();
}

function openCategoryFormModal(catId = null) {
  const modal = document.getElementById('category-form-modal');
  const titleEl = document.getElementById('category-form-title');
  const idInput = document.getElementById('category-form-id');
  const nameInput = document.getElementById('category-name-input');
  const iconPicker = document.getElementById('category-icon-picker');
  const colorPicker = document.getElementById('category-color-picker');

  if (catId) {
    const cat = getCategory(catId);
    titleEl.textContent = 'Edit Category';
    idInput.value = cat.id;
    nameInput.value = cat.label;
    selectedFormIcon = cat.iconName || 'tag';
    selectedFormColor = cat.color || '#10b981';
  } else {
    titleEl.textContent = 'Add Category';
    idInput.value = '';
    nameInput.value = '';
    selectedFormIcon = AVAILABLE_ICONS[Math.floor(Math.random() * AVAILABLE_ICONS.length)];
    selectedFormColor = AVAILABLE_COLORS[Math.floor(Math.random() * AVAILABLE_COLORS.length)];
  }

  // Render icons
  iconPicker.innerHTML = AVAILABLE_ICONS.map(icon => `
    <div class="icon-picker-option ${selectedFormIcon === icon ? 'selected' : ''}" data-icon="${icon}" title="${icon}">
      <i data-lucide="${icon}"></i>
    </div>
  `).join('');

  iconPicker.querySelectorAll('.icon-picker-option').forEach(opt => {
    opt.addEventListener('click', () => {
      triggerHaptic(6);
      iconPicker.querySelectorAll('.icon-picker-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedFormIcon = opt.getAttribute('data-icon');
    });
  });

  // Render colors
  colorPicker.innerHTML = AVAILABLE_COLORS.map(c => `
    <div class="color-picker-option ${selectedFormColor === c ? 'selected' : ''}" 
         data-color="${c}" 
         style="background-color: ${c};"></div>
  `).join('');

  colorPicker.querySelectorAll('.color-picker-option').forEach(opt => {
    opt.addEventListener('click', () => {
      triggerHaptic(6);
      colorPicker.querySelectorAll('.color-picker-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedFormColor = opt.getAttribute('data-color');
    });
  });

  if (window.lucide) window.lucide.createIcons();
  modal.classList.add('active');
  setTimeout(() => nameInput.focus(), 100);
}

function saveCategoryForm() {
  const idInput = document.getElementById('category-form-id');
  const nameInput = document.getElementById('category-name-input');
  const rawName = nameInput.value.trim();

  if (!rawName) {
    alert('Please enter a category name.');
    return;
  }

  createSnapshot(`Before category change (${rawName})`);
  const cats = getCategories();
  const editId = idInput.value;

  if (editId) {
    const idx = cats.findIndex(c => c.id === editId);
    if (idx !== -1) {
      cats[idx] = {
        ...cats[idx],
        label: rawName,
        iconName: selectedFormIcon,
        color: selectedFormColor,
        bg: hexToRgba(selectedFormColor, 0.15)
      };
    }
  } else {
    const slug = rawName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 16) + '_' + Date.now().toString().slice(-4);
    cats.push({
      id: slug,
      label: rawName,
      iconName: selectedFormIcon,
      color: selectedFormColor,
      bg: hexToRgba(selectedFormColor, 0.15)
    });
  }

  state.categories = cats;
  saveState();

  const modal = document.getElementById('category-form-modal');
  if (modal) modal.classList.remove('active');

  renderCategoryManagerList();
  initCategorySelectors();
  renderDashboard();
  renderMonthlyBreakdown();
  renderHistory();
}

function deleteCategory(catId) {
  const cats = getCategories();
  if (cats.length <= 1) {
    alert('You must have at least one category.');
    return;
  }
  const catToDelete = cats.find(c => c.id === catId);
  if (!catToDelete) return;

  const usedCount = state.expenses.filter(e => e.category === catId).length;
  let confirmMsg = `Delete category "${catToDelete.label}"?`;
  if (usedCount > 0) {
    const fallbackCat = cats[0].id === catId ? cats[1] : cats[0];
    confirmMsg += `\n\nNotice: ${usedCount} existing expense(s) currently use this category and will be reassigned to "${fallbackCat.label}".`;
  }

  if (confirm(confirmMsg)) {
    createSnapshot(`Before deleting category "${catToDelete.label}"`);
    const fallbackCatId = cats[0].id === catId ? cats[1].id : cats[0].id;
    if (usedCount > 0) {
      state.expenses.forEach(e => {
        if (e.category === catId) e.category = fallbackCatId;
      });
    }
    state.categories = cats.filter(c => c.id !== catId);
    if (state.selectedCategory === catId) {
      state.selectedCategory = state.categories[0].id;
    }
    saveState();
    renderCategoryManagerList();
    initCategorySelectors();
    renderDashboard();
    renderMonthlyBreakdown();
    renderHistory();
  }
}

function resetCategoriesToDefaults() {
  if (confirm('Reset all categories back to default list?')) {
    createSnapshot('Before resetting categories to default');
    state.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
    saveState();
    renderCategoryManagerList();
    initCategorySelectors();
    renderDashboard();
    renderMonthlyBreakdown();
    renderHistory();
    alert('Categories have been reset to defaults.');
  }
}

function initCategorySelectors() {
  const cats = getCategories();

  if (!cats.some(c => c.id === state.selectedCategory)) {
    state.selectedCategory = cats[0]?.id || 'groceries';
  }

  // Log expense category picker with quick "+ Add New" pill
  categoryPicker.innerHTML = cats.map(cat => `
    <div class="category-pill ${state.selectedCategory === cat.id ? 'selected' : ''}" 
         data-id="${cat.id}" 
         style="--selected-color: ${cat.color}; --selected-bg: ${cat.bg || 'rgba(255,255,255,0.1)'}; --category-color: ${cat.color};">
      <span class="pill-icon">${getCategoryIconHtml(cat)}</span>
      <span class="pill-label">${escapeHTML(cat.label)}</span>
    </div>
  `).join('') + `
    <div class="category-pill category-add-pill" id="log-quick-add-cat" title="Add New Category">
      <span class="pill-icon"><i data-lucide="plus"></i></span>
      <span class="pill-label">+ Add</span>
    </div>
  `;

  categoryPicker.querySelectorAll('.category-pill:not(.category-add-pill)').forEach(pill => {
    pill.addEventListener('click', () => {
      triggerHaptic(8);
      categoryPicker.querySelectorAll('.category-pill').forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
      state.selectedCategory = pill.getAttribute('data-id');
    });
  });

  const logQuickAdd = categoryPicker.querySelector('#log-quick-add-cat');
  if (logQuickAdd) {
    logQuickAdd.addEventListener('click', () => {
      triggerHaptic(10);
      openCategoryFormModal();
    });
  }

  // History filter select
  historyFilterCategory.innerHTML = '<option value="all">All Categories</option>' +
    cats.map(cat => `<option value="${cat.id}">${escapeHTML(cat.label)}</option>`).join('');

  if (window.lucide) window.lucide.createIcons();
}

let editSelectedCategory = 'groceries';

function initEditCategorySelectors(currentCatId) {
  const cats = getCategories();
  editSelectedCategory = cats.some(c => c.id === currentCatId) ? currentCatId : (cats[0]?.id || 'groceries');

  editCategoryPicker.innerHTML = cats.map(cat => `
    <div class="category-pill ${editSelectedCategory === cat.id ? 'selected' : ''}" 
         data-id="${cat.id}" 
         style="--selected-color: ${cat.color}; --selected-bg: ${cat.bg || 'rgba(255,255,255,0.1)'}; --category-color: ${cat.color};">
      <span class="pill-icon">${getCategoryIconHtml(cat)}</span>
      <span class="pill-label">${escapeHTML(cat.label)}</span>
    </div>
  `).join('') + `
    <div class="category-pill category-add-pill" id="edit-quick-add-cat" title="Add New Category">
      <span class="pill-icon"><i data-lucide="plus"></i></span>
      <span class="pill-label">+ Add</span>
    </div>
  `;

  editCategoryPicker.querySelectorAll('.category-pill:not(.category-add-pill)').forEach(pill => {
    pill.addEventListener('click', () => {
      triggerHaptic(8);
      editCategoryPicker.querySelectorAll('.category-pill').forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
      editSelectedCategory = pill.getAttribute('data-id');
    });
  });

  const editQuickAdd = editCategoryPicker.querySelector('#edit-quick-add-cat');
  if (editQuickAdd) {
    editQuickAdd.addEventListener('click', () => {
      triggerHaptic(10);
      openCategoryFormModal();
    });
  }

  if (window.lucide) window.lucide.createIcons();
}

function openEditExpenseModal(id) {
  const expense = state.expenses.find(exp => exp.id === id);
  if (!expense) return;

  const details = parseExpenseDetails(expense);

  editExpenseId.value = id;
  editExpenseAmount.value = Math.abs(expense.amount).toFixed(2);
  editExpenseDesc.value = details.merchant;
  if (editExpenseItemsInput) {
    editExpenseItemsInput.value = details.items.join(', ');
  }
  editExpenseDate.value = expense.date;

  // Set toggle state
  const expenseBtn = document.querySelector('#edit-type-toggle [data-type="expense"]');
  const refundBtn = document.querySelector('#edit-type-toggle [data-type="refund"]');
  if (expenseBtn && refundBtn) {
    if (expense.amount < 0) {
      expenseBtn.classList.remove('active');
      refundBtn.classList.add('active');
    } else {
      refundBtn.classList.remove('active');
      expenseBtn.classList.add('active');
    }
  }

  initEditCategorySelectors(expense.category);

  editExpenseModal.classList.add('active');
}

function saveExpense() {
  const id = editExpenseId.value;
  const amountRaw = editExpenseAmount.value;
  const desc = editExpenseDesc.value.trim();
  const rawItems = editExpenseItemsInput ? editExpenseItemsInput.value.trim() : '';
  const date = editExpenseDate.value;

  const cleanAmountStr = amountRaw.replace(/[^-0-9.]/g, '');
  let amount = parseFloat(cleanAmountStr);

  if (isNaN(amount) || amount === 0) {
    alert('Please enter a valid expense amount.');
    return;
  }

  // Determine sign based on segmented toggle
  const isRefund = document.querySelector('#edit-type-toggle [data-type="refund"]').classList.contains('active');
  amount = isRefund ? -Math.abs(amount) : Math.abs(amount);
  if (!desc) {
    alert('Please describe what this expense was for.');
    return;
  }
  if (!date) {
    alert('Please select a date.');
    return;
  }

  const parsedItems = rawItems ? rawItems.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean) : [];

  const expenseIndex = state.expenses.findIndex(exp => exp.id === id);
  if (expenseIndex !== -1) {
    const updated = {
      ...state.expenses[expenseIndex],
      amount: parseFloat(amount),
      description: desc,
      category: editSelectedCategory,
      date: date
    };
    if (parsedItems.length > 0) {
      updated.items = parsedItems;
    } else {
      delete updated.items;
    }
    state.expenses[expenseIndex] = updated;
    saveState();

    // Refresh
    renderDashboard();
    renderMonthlyBreakdown();
    renderHistory();

    // Close modal
    editExpenseModal.classList.remove('active');
  }
}


// ----------------------------------------------------
// CSV EXPORT / IMPORT
// ----------------------------------------------------
async function exportToCSV() {
  const filename = `shallot_money_expenses_${formatDateLocal(new Date())}.csv`;
  const headers = ['Date', 'Amount', 'Description', 'Category', 'Items'];
  const rows = [...state.expenses]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(exp => {
      const details = parseExpenseDetails(exp);
      const desc = '"' + details.merchant.replace(/"/g, '""') + '"';
      const cat = getCategory(exp.category);
      const catLabel = cat ? cat.label : exp.category;
      const itemsStr = details.items.length > 0 ? '"' + details.items.join('; ').replace(/"/g, '""') + '"' : '""';
      return [exp.date, exp.amount.toFixed(2), desc, catLabel, itemsStr].join(',');
    });

  const csvContent = [headers.join(','), ...rows].join('\n');

  // Try Web Share API (native iOS / Android Share Sheet)
  if (navigator.share) {
    try {
      const file = new File([csvContent], filename, { type: 'text/csv' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Shallot Money CSV Export',
          text: `Shallot Money expenses CSV (${formatDateLocal(new Date())})`,
        });
        return;
      }
    } catch (err) {
      if (err.name === 'AbortError') return; // User cancelled
      console.warn('Web Share failed, falling back to Blob download:', err);
    }
  }

  // Fallback: Blob URL download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function exportToJSON() {
  const filename = `shallot_money_backup_${formatDateLocal(new Date())}.json`;
  const jsonStr = JSON.stringify(state, null, 2);

  // Try Web Share API (native iOS / Android Share Sheet)
  if (navigator.share) {
    try {
      const file = new File([jsonStr], filename, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Shallot Money Backup',
          text: `Shallot Money spending backup (${formatDateLocal(new Date())})`,
        });
        return;
      }
    } catch (err) {
      if (err.name === 'AbortError') return; // User cancelled
      console.warn('Web Share failed, falling back to Blob download:', err);
    }
  }

  // Fallback: Blob URL download
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", url);
  downloadAnchor.setAttribute("download", filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copyJSONBackup() {
  const jsonStr = JSON.stringify(state, null, 2);
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(jsonStr);
      alert('Backup JSON copied to clipboard! You can paste it into Notes or an email to save it.');
    } else {
      prompt('Copy your backup JSON data below:', jsonStr);
    }
  } catch (err) {
    prompt('Copy your backup JSON data below:', jsonStr);
  }
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

function importFromCSV(fileContent) {
  const lines = fileContent.split(/\r?\n/).map(l => l.trim()).filter(l => l !== '');
  if (lines.length === 0) {
    alert('Pasted data is empty.');
    return;
  }

  // Find header line or detect columns
  let headerIndex = -1;
  let dateIdx = -1;
  let amountIdx = -1;
  let descIdx = -1;
  let catIdx = -1;
  let itemsIdx = -1;

  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const fields = parseCSVLine(lines[i]).map(h => h.toLowerCase().trim());
    const dIdx = fields.findIndex(h => h === 'date' || h === 'transaction date' || h === 'posting date');
    const aIdx = fields.findIndex(h => h === 'amount' || h === 'debit' || h === 'cost' || h === 'total');
    if (dIdx !== -1 && aIdx !== -1) {
      headerIndex = i;
      dateIdx = dIdx;
      amountIdx = aIdx;
      descIdx = fields.findIndex(h => h.includes('desc') || h.includes('merchant') || h.includes('payee') || h.includes('memo'));
      catIdx = fields.findIndex(h => h.includes('cat') || h.includes('type'));
      itemsIdx = fields.findIndex(h => h === 'items' || h === 'item' || h.includes('purchased') || h.includes('note'));
      break;
    }
  }

  let startRow = 1;
  if (headerIndex !== -1) {
    startRow = headerIndex + 1;
  } else {
    // Headerless check
    const firstRow = parseCSVLine(lines[0]);
    if (firstRow.length >= 2 && !isNaN(parseFloat(firstRow[1]))) {
      dateIdx = 0;
      amountIdx = 1;
      descIdx = firstRow.length > 2 ? 2 : -1;
      catIdx = firstRow.length > 3 ? 3 : -1;
      itemsIdx = firstRow.length > 4 ? 4 : -1;
      startRow = 0;
    } else {
      alert('Could not find "Date" and "Amount" columns. Please verify the CSV text contains dates and amounts.');
      return;
    }
  }

  // Build category label-to-id map
  const cats = getCategories();
  const catMap = {};
  cats.forEach(c => {
    catMap[c.label.toLowerCase()] = c.id;
    catMap[c.id] = c.id;
  });

  const existingIds = new Set(state.expenses.map(e => e.id));
  let addedCount = 0;
  let skippedCount = 0;

  for (let i = startRow; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    const dateStr = fields[dateIdx];
    const amount = parseFloat(fields[amountIdx]);
    const description = descIdx !== -1 ? fields[descIdx] : 'Imported expense';
    const rawCatName = catIdx !== -1 ? (fields[catIdx] || '').trim() : '';
    const rawItems = itemsIdx !== -1 && fields.length > itemsIdx ? (fields[itemsIdx] || '').trim() : '';
    const catLower = rawCatName.toLowerCase();

    let categoryId = catMap[catLower];
    if (!categoryId && rawCatName) {
      const slug = rawCatName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 16) + '_' + Date.now().toString().slice(-4);
      const randomColor = AVAILABLE_COLORS[cats.length % AVAILABLE_COLORS.length];
      const newCat = {
        id: slug,
        label: rawCatName,
        iconName: 'tag',
        color: randomColor,
        bg: hexToRgba(randomColor, 0.15)
      };
      cats.push(newCat);
      catMap[catLower] = slug;
      catMap[slug] = slug;
      categoryId = slug;
    } else if (!categoryId) {
      categoryId = cats[0]?.id || 'groceries';
    }

    // Validate
    if (!dateStr || isNaN(amount) || amount === 0) {
      skippedCount++;
      continue;
    }

    // Normalize date format (handle M/D/YYYY or YYYY-MM-DD)
    let normalizedDate = dateStr;
    const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      normalizedDate = `${slashMatch[3]}-${slashMatch[1].padStart(2, '0')}-${slashMatch[2].padStart(2, '0')}`;
    }

    const id = `csv_${i}_${normalizedDate}_${amount}`;
    if (existingIds.has(id)) {
      skippedCount++;
      continue;
    }

    const parsedItems = rawItems ? rawItems.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean) : [];

    const newExpense = {
      id,
      amount,
      description,
      category: categoryId,
      date: normalizedDate,
    };
    if (parsedItems.length > 0) {
      newExpense.items = parsedItems;
    }

    state.expenses.push(newExpense);
    existingIds.add(id);
    addedCount++;
  }

  saveState();
  initCategorySelectors();
  renderDashboard();
  renderMonthlyBreakdown();
  renderHistory();

  let msg = `Import complete! Added ${addedCount} expense(s).`;
  if (skippedCount > 0) msg += ` Skipped ${skippedCount} row(s) (duplicates or invalid).`;
  alert(msg);
}

function deduplicateExpenses() {
  triggerHaptic(12);
  const seen = new Set();
  const uniqueList = [];
  let duplicatesCount = 0;

  // Known legitimate twin charges / dual memberships
  const dualChargeKeywords = ['planet fitness', 'membership', 'gym', 'subscription'];

  state.expenses.forEach(exp => {
    const descLower = (exp.description || '').toLowerCase().trim();
    const isDualExempt = dualChargeKeywords.some(kw => descLower.includes(kw));

    if (isDualExempt) {
      // Keep all legitimate dual memberships intact
      uniqueList.push(exp);
      return;
    }

    // Unique key matching normalized date, absolute amount (2 decimals), and lowercase description
    const key = `${exp.date}_${Math.abs(exp.amount).toFixed(2)}_${descLower}`;
    if (seen.has(key)) {
      duplicatesCount++;
    } else {
      seen.add(key);
      uniqueList.push(exp);
    }
  });

  if (duplicatesCount === 0) {
    alert('No duplicate expenses found! (Legitimate dual charges like Planet Fitness memberships are safely protected).');
    return;
  }

  if (confirm(`Found ${duplicatesCount} exact duplicate expense(s).\n\nRemove duplicates now? (Your dual Planet Fitness memberships will NOT be touched, and an automatic backup snapshot will be saved first).`)) {
    createSnapshot(`Before removing ${duplicatesCount} duplicates`);
    state.expenses = uniqueList;
    saveState();
    renderDashboard();
    renderMonthlyBreakdown();
    renderHistory();
    alert(`Cleaned up ${duplicatesCount} duplicate(s)! Total unique expenses: ${state.expenses.length}.`);
  }
}

// ----------------------------------------------------
// EVENT LISTENERS & NAVIGATION
// ----------------------------------------------------
function setupEventListeners() {
  // Category Manager Modals
  const manageCategoriesBtn = document.getElementById('manage-categories-btn');
  const categoryManagerModal = document.getElementById('category-manager-modal');
  const closeCategoryManager = document.getElementById('close-category-manager');
  const addNewCategoryBtn = document.getElementById('add-new-category-btn');
  const resetCategoriesBtn = document.getElementById('reset-categories-btn');

  const categoryFormModal = document.getElementById('category-form-modal');
  const closeCategoryForm = document.getElementById('close-category-form');
  const saveCategoryBtn = document.getElementById('save-category-btn');

  if (manageCategoriesBtn && categoryManagerModal) {
    manageCategoriesBtn.addEventListener('click', () => {
      triggerHaptic(8);
      renderCategoryManagerList();
      categoryManagerModal.classList.add('active');
    });

    const closeCatMgr = () => categoryManagerModal.classList.remove('active');
    if (closeCategoryManager) closeCategoryManager.addEventListener('click', closeCatMgr);
    categoryManagerModal.addEventListener('click', (e) => {
      if (e.target === categoryManagerModal) closeCatMgr();
    });
  }

  if (addNewCategoryBtn) {
    addNewCategoryBtn.addEventListener('click', () => {
      triggerHaptic(8);
      openCategoryFormModal();
    });
  }

  if (resetCategoriesBtn) {
    resetCategoriesBtn.addEventListener('click', () => {
      triggerHaptic(10);
      resetCategoriesToDefaults();
    });
  }

  if (categoryFormModal) {
    const closeCatForm = () => categoryFormModal.classList.remove('active');
    if (closeCategoryForm) closeCategoryForm.addEventListener('click', closeCatForm);
    categoryFormModal.addEventListener('click', (e) => {
      if (e.target === categoryFormModal) closeCatForm();
    });
  }

  if (saveCategoryBtn) {
    saveCategoryBtn.addEventListener('click', (e) => {
      e.preventDefault();
      triggerHaptic(10);
      saveCategoryForm();
    });
  }

  // Transaction Type Toggle Setup
  const setupToggleListeners = (toggleId) => {
    const toggleContainer = document.getElementById(toggleId);
    if (!toggleContainer) return;
    const buttons = toggleContainer.querySelectorAll('.type-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  };
  setupToggleListeners('log-type-toggle');
  setupToggleListeners('edit-type-toggle');

  // Navigation
  tabItems.forEach(tab => {
    tab.addEventListener('click', () => {
      triggerHaptic(8);
      const targetView = tab.getAttribute('data-view');

      tabItems.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      Object.keys(views).forEach(key => {
        if (views[key].id === targetView) {
          views[key].classList.add('active');
        } else {
          views[key].classList.remove('active');
        }
      });

      // Special refreshes
      if (targetView === 'view-dashboard') { renderDashboard(); renderMonthlyBreakdown(); }
      if (targetView === 'view-history') renderHistory();
    });
  });

  // Quick Dashboard Buttons
  viewAllRecent.addEventListener('click', () => {
    const historyTab = Array.from(tabItems).find(t => t.getAttribute('data-view') === 'view-history');
    if (historyTab) historyTab.click();
  });

  editIncomeQuick.addEventListener('click', () => {
    settingsBtn.click();
  });

  // Bills Toggle Buttons
  const toggleMonthlyBillsBtn = document.getElementById('toggle-monthly-bills');
  const toggleWeeklyBillsBtn = document.getElementById('toggle-weekly-bills');

  const handleToggleBills = () => {
    triggerHaptic(10);
    state.hideBillsInBreakdown = !state.hideBillsInBreakdown;
    saveState();
    updateBillsToggleUI();
    renderDashboard();
    renderMonthlyBreakdown();
  };

  if (toggleMonthlyBillsBtn) {
    toggleMonthlyBillsBtn.addEventListener('click', handleToggleBills);
  }
  if (toggleWeeklyBillsBtn) {
    toggleWeeklyBillsBtn.addEventListener('click', handleToggleBills);
  }

  // Weekly Navigation Buttons
  const prevWeekBtn = document.getElementById('prev-week-btn');
  const nextWeekBtn = document.getElementById('next-week-btn');
  if (prevWeekBtn && nextWeekBtn) {
    prevWeekBtn.addEventListener('click', () => {
      triggerHaptic(8);
      state.currentWeekOffset--;
      renderDashboard();
    });
    nextWeekBtn.addEventListener('click', () => {
      triggerHaptic(8);
      state.currentWeekOffset++;
      renderDashboard();
    });
  }

  // Monthly Navigation Buttons
  const prevMonthBtn = document.getElementById('prev-month-btn');
  const nextMonthBtn = document.getElementById('next-month-btn');
  if (prevMonthBtn && nextMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
      triggerHaptic(8);
      state.currentMonthOffset--;
      renderMonthlyBreakdown();
    });
    nextMonthBtn.addEventListener('click', () => {
      triggerHaptic(8);
      state.currentMonthOffset++;
      renderMonthlyBreakdown();
    });
  }

  // Undo Toast Action
  if (toastUndoBtn) {
    toastUndoBtn.addEventListener('click', handleUndoDelete);
  }

  // Quick Date Chips on Log Form
  const dateChips = document.querySelectorAll('.date-chip');
  dateChips.forEach(chip => {
    chip.addEventListener('click', () => {
      triggerHaptic(8);
      dateChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const offset = parseInt(chip.getAttribute('data-offset') || '0', 10);
      const d = new Date();
      d.setDate(d.getDate() - offset);
      expenseDateInput.value = formatDateLocal(d);
    });
  });

  // Log Form Submission
  submitExpenseBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const amountRaw = expenseAmountInput.value;
    const desc = expenseDescInput.value;
    const itemsRaw = expenseItemsInput ? expenseItemsInput.value.trim() : '';
    const date = expenseDateInput.value;

    const cleanAmountStr = amountRaw.replace(/[^-0-9.]/g, '');
    let amount = parseFloat(cleanAmountStr);

    if (isNaN(amount) || amount === 0) {
      alert('Please enter a valid expense amount.');
      return;
    }

    // Determine sign based on segmented toggle
    const isRefund = document.querySelector('#log-type-toggle [data-type="refund"]').classList.contains('active');
    amount = isRefund ? -Math.abs(amount) : Math.abs(amount);
    if (!desc.trim()) {
      alert('Please describe what this expense was for.');
      return;
    }
    if (!date) {
      alert('Please select a date.');
      return;
    }

    addExpense(amount, desc, state.selectedCategory, date, itemsRaw);

    // Auto switch back to dashboard after logging
    const dashboardTab = Array.from(tabItems).find(t => t.getAttribute('data-view') === 'view-dashboard');
    if (dashboardTab) dashboardTab.click();
  });

  // Smart Auto-Categorization on Log Form as user types items or description
  if (expenseItemsInput && categoryPicker) {
    let userManuallySelectedCategory = false;

    // Notice if user explicitly clicks a category pill
    categoryPicker.addEventListener('click', (e) => {
      if (e.target.closest('.category-pill:not(.category-add-pill)')) {
        userManuallySelectedCategory = true;
      }
    });

    const handleAutoCategorize = () => {
      if (userManuallySelectedCategory) return;
      const itemsVal = expenseItemsInput.value.trim();
      const descVal = expenseDescInput.value.trim();

      let candidateItems = [];
      if (itemsVal) {
        candidateItems = itemsVal.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
      } else if (descVal) {
        candidateItems = [descVal];
      }

      if (candidateItems.length > 0) {
        const predicted = predictCategoryFromItems(candidateItems);
        if (predicted && predicted !== state.selectedCategory) {
          const cats = getCategories();
          if (cats.some(c => c.id === predicted)) {
            state.selectedCategory = predicted;
            categoryPicker.querySelectorAll('.category-pill').forEach(p => {
              if (p.getAttribute('data-id') === predicted) {
                p.classList.add('selected');
              } else {
                p.classList.remove('selected');
              }
            });
            triggerHaptic(6);
          }
        }
      }
    };

    expenseItemsInput.addEventListener('input', handleAutoCategorize);
    expenseDescInput.addEventListener('input', handleAutoCategorize);
  }

  // Smart Receipt Ingest Modal Listeners
  if (btnOpenReceiptPaste && receiptPasteModal) {
    let currentParsedReceipt = null;

    const openReceiptModal = (targetMode = 'log') => {
      receiptPasteModal.setAttribute('data-mode', targetMode);
      receiptPasteInput.value = '';
      receiptParsePreview.style.display = 'none';
      btnReceiptAutofill.disabled = true;
      btnReceiptMerge.disabled = true;
      receiptPasteModal.classList.add('active');
      triggerHaptic(8);
      setTimeout(() => receiptPasteInput.focus(), 100);
    };

    const closeReceiptModal = () => {
      receiptPasteModal.classList.remove('active');
    };

    btnOpenReceiptPaste.addEventListener('click', () => openReceiptModal('log'));
    if (btnEditPasteReceipt) {
      btnEditPasteReceipt.addEventListener('click', () => openReceiptModal('edit'));
    }
    if (closeReceiptPaste) {
      closeReceiptPaste.addEventListener('click', closeReceiptModal);
    }
    receiptPasteModal.addEventListener('click', (e) => {
      if (e.target === receiptPasteModal) closeReceiptModal();
    });

    receiptPasteInput.addEventListener('input', () => {
      const text = receiptPasteInput.value.trim();
      if (!text) {
        receiptParsePreview.style.display = 'none';
        btnReceiptAutofill.disabled = true;
        btnReceiptMerge.disabled = true;
        currentParsedReceipt = null;
        return;
      }

      currentParsedReceipt = parseReceiptText(text);
      if (!currentParsedReceipt || !currentParsedReceipt.hasDetails) {
        receiptParsePreview.style.display = 'none';
        btnReceiptAutofill.disabled = true;
        btnReceiptMerge.disabled = true;
        return;
      }

      // Populate preview
      previewStoreBadge.textContent = currentParsedReceipt.store;
      previewDateBadge.textContent = currentParsedReceipt.date;
      previewAmtBadge.textContent = formatCurrency(currentParsedReceipt.amount);
      previewItemsCount.textContent = `${currentParsedReceipt.items.length} item${currentParsedReceipt.items.length === 1 ? '' : 's'} detected`;

      previewChipsContainer.innerHTML = currentParsedReceipt.items.map(it => {
        const cId = categorizeItem(it) || currentParsedReceipt.predictedCategory;
        const c = getCategory(cId);
        return `
          <span class="receipt-item-chip" style="--item-cat-color: ${c.color}; --item-cat-bg: ${c.bg}; --item-cat-border: ${c.color}35;">
            <span class="item-chip-dot" style="background-color: ${c.color};"></span>
            <span class="item-chip-label">${escapeHTML(it)}</span>
          </span>
        `;
      }).join('');

      // Check for match in history
      const match = findMatchingExpense(currentParsedReceipt);
      if (match) {
        previewMatchNotice.style.display = 'flex';
        previewMatchNotice.innerHTML = `
          <i data-lucide="check-circle-2" style="width: 14px; height: 14px;"></i>
          <span>Found matching purchase: ${escapeHTML(match.description)} (${formatCurrency(match.amount)} on ${formatDateDisplay(match.date)})</span>
        `;
        btnReceiptMerge.disabled = false;
        btnReceiptMerge.innerHTML = `<i data-lucide="git-merge"></i> Merge into ${escapeHTML(match.description.slice(0, 14))}...`;
      } else {
        previewMatchNotice.style.display = 'none';
        btnReceiptMerge.disabled = true;
        btnReceiptMerge.innerHTML = `<i data-lucide="git-merge"></i> Find &amp; Merge Existing`;
      }

      receiptParsePreview.style.display = 'flex';
      btnReceiptAutofill.disabled = false;
      if (window.lucide) window.lucide.createIcons();
    });

    // Action 1: Auto-Fill Form
    btnReceiptAutofill.addEventListener('click', () => {
      if (!currentParsedReceipt) return;
      triggerHaptic(12);

      const mode = receiptPasteModal.getAttribute('data-mode') || 'log';
      if (mode === 'edit') {
        if (editExpenseItemsInput) {
          editExpenseItemsInput.value = currentParsedReceipt.items.join(', ');
        }
        closeReceiptModal();
        showToast('Receipt items added to expense!');
        return;
      }

      // Fill Log Form
      expenseAmountInput.value = currentParsedReceipt.amount > 0 ? currentParsedReceipt.amount.toFixed(2) : '';
      expenseDescInput.value = currentParsedReceipt.store;
      if (expenseItemsInput) {
        expenseItemsInput.value = currentParsedReceipt.items.join(', ');
      }
      expenseDateInput.value = currentParsedReceipt.date;

      // Set predicted category
      if (currentParsedReceipt.predictedCategory) {
        const cats = getCategories();
        if (cats.some(c => c.id === currentParsedReceipt.predictedCategory)) {
          state.selectedCategory = currentParsedReceipt.predictedCategory;
          categoryPicker.querySelectorAll('.category-pill').forEach(p => {
            if (p.getAttribute('data-id') === currentParsedReceipt.predictedCategory) {
              p.classList.add('selected');
            } else {
              p.classList.remove('selected');
            }
          });
        }
      }

      closeReceiptModal();
      const logTab = Array.from(tabItems).find(t => t.getAttribute('data-view') === 'view-log');
      if (logTab) logTab.click();
      showToast(`Auto-filled ${currentParsedReceipt.store} receipt details!`);
    });

    // Action 2: Merge into Existing Transaction
    btnReceiptMerge.addEventListener('click', () => {
      if (!currentParsedReceipt) return;
      const match = findMatchingExpense(currentParsedReceipt);
      if (!match) return;
      triggerHaptic(15);

      createSnapshot(`Before merging receipt into ${match.description}`);

      const idx = state.expenses.findIndex(e => e.id === match.id);
      if (idx !== -1) {
        state.expenses[idx] = {
          ...state.expenses[idx],
          items: currentParsedReceipt.items
        };
        if ((match.category === 'food' || match.category === 'groceries' || match.category === 'shopping') && currentParsedReceipt.predictedCategory) {
          state.expenses[idx].category = currentParsedReceipt.predictedCategory;
        }
        saveState();
        renderDashboard();
        renderMonthlyBreakdown();
        renderHistory();
        closeReceiptModal();

        showUndoToast(`Merged ${currentParsedReceipt.items.length} items into ${match.description}!`);

        const histTab = Array.from(tabItems).find(t => t.getAttribute('data-view') === 'view-history');
        if (histTab) histTab.click();
      }
    });
  }

  // History Search/Filters
  historySearchInput.addEventListener('input', renderHistory);
  historyFilterCategory.addEventListener('change', renderHistory);

  // Settings Modal Toggle
  settingsBtn.addEventListener('click', () => {
    monthlyIncomeInput.value = state.income;
    if (currencySelect) currencySelect.value = state.currency || '$';
    populateSnapshotSelector();
    settingsModal.classList.add('active');
  });

  const closeModal = () => settingsModal.classList.remove('active');
  closeSettings.addEventListener('click', closeModal);
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeModal();
  });

  // Edit Expense Modal Toggle & Event Listeners
  const closeEditModal = () => editExpenseModal.classList.remove('active');
  closeEditExpense.addEventListener('click', closeEditModal);
  editExpenseModal.addEventListener('click', (e) => {
    if (e.target === editExpenseModal) closeEditModal();
  });
  saveExpenseBtn.addEventListener('click', (e) => {
    e.preventDefault();
    saveExpense();
  });

  // Delete Confirmation Modal Toggle & Event Listeners
  const closeDeleteConfirmModal = () => {
    deleteConfirmModal.classList.remove('active');
    expenseIdToDelete = null;
  };
  closeDeleteConfirm.addEventListener('click', closeDeleteConfirmModal);
  cancelDeleteBtn.addEventListener('click', closeDeleteConfirmModal);
  deleteConfirmModal.addEventListener('click', (e) => {
    if (e.target === deleteConfirmModal) closeDeleteConfirmModal();
  });
  confirmDeleteBtn.addEventListener('click', () => {
    if (expenseIdToDelete) {
      deleteExpense(expenseIdToDelete);
    }
    closeDeleteConfirmModal();
  });

  // Settings Income change
  monthlyIncomeInput.addEventListener('input', () => {
    const val = parseFloat(monthlyIncomeInput.value);
    if (!isNaN(val) && val >= 0) {
      state.income = val;
      saveState();
      renderDashboard();
      renderMonthlyBreakdown();
    }
  });

  // Settings Currency change
  if (currencySelect) {
    currencySelect.addEventListener('change', () => {
      triggerHaptic(10);
      state.currency = currencySelect.value;
      saveState();
      updateCurrencyUI();
      renderDashboard();
      renderMonthlyBreakdown();
      renderHistory();
    });
  }

  // Settings Snapshot Restore
  if (restoreSnapshotBtn) {
    restoreSnapshotBtn.addEventListener('click', () => {
      triggerHaptic(10);
      restoreSelectedSnapshot();
    });
  }

  // Export JSON
  exportDataBtn.addEventListener('click', () => {
    exportToJSON();
  });

  const copyDataBtn = document.getElementById('copy-data-btn');
  if (copyDataBtn) {
    copyDataBtn.addEventListener('click', () => {
      copyJSONBackup();
    });
  }

  // Deduplicate Expenses Handler
  const dedupBtn = document.getElementById('dedup-btn');
  if (dedupBtn) {
    dedupBtn.addEventListener('click', () => {
      deduplicateExpenses();
    });
  }

  // Paste Data Modal (Universal Fallback for Android & iOS)
  const pasteDataBtn = document.getElementById('paste-data-btn');
  const pasteDataModal = document.getElementById('paste-data-modal');
  const closePasteModal = document.getElementById('close-paste-modal');
  const submitPasteBtn = document.getElementById('submit-paste-btn');
  const pasteDataTextarea = document.getElementById('paste-data-textarea');

  if (pasteDataBtn && pasteDataModal) {
    pasteDataBtn.addEventListener('click', () => {
      pasteDataTextarea.value = '';
      pasteDataModal.classList.add('active');
    });

    const closePaste = () => pasteDataModal.classList.remove('active');
    if (closePasteModal) closePasteModal.addEventListener('click', closePaste);
    pasteDataModal.addEventListener('click', (e) => {
      if (e.target === pasteDataModal) closePaste();
    });

    if (submitPasteBtn) {
      submitPasteBtn.addEventListener('click', () => {
        const text = pasteDataTextarea.value.trim();
        if (!text) {
          alert('Please paste some CSV or JSON text first.');
          return;
        }

        // Auto-detect JSON vs CSV
        const jsonStartObj = text.indexOf('{');
        const jsonEndObj = text.lastIndexOf('}');
        const jsonStartArr = text.indexOf('[');
        const jsonEndArr = text.lastIndexOf(']');

        let jsonCandidate = null;
        if (jsonStartObj !== -1 && jsonEndObj > jsonStartObj) {
          jsonCandidate = text.slice(jsonStartObj, jsonEndObj + 1);
        } else if (jsonStartArr !== -1 && jsonEndArr > jsonStartArr) {
          jsonCandidate = text.slice(jsonStartArr, jsonEndArr + 1);
        }

        if (jsonCandidate) {
          try {
            const parsed = JSON.parse(jsonCandidate);
            if (parsed && typeof parsed === 'object') {
              createSnapshot('Pre-import backup');
              state = { ...state, ...parsed };
              saveState();
              applyTheme();
              updateCurrencyUI();
              updateBillsToggleUI();
              renderDashboard();
              renderMonthlyBreakdown();
              initCategorySelectors();
              alert(`Backup successfully imported with ${state.expenses.length} transactions!`);
              closePaste();
              closeModal();
              return;
            }
          } catch (err) {
            console.warn('Failed to parse as JSON, trying salvage / CSV:', err);
          }
        }

        // Fragmented JSON salvage fallback (e.g. if chat app cut off start/end brackets)
        if (text.includes('"amount"') && text.includes('"date"')) {
          const expenseRegex = /\{[^{}]*"amount"\s*:\s*([0-9.-]+)[^{}]*"description"\s*:\s*"([^"]*)"[^{}]*"category"\s*:\s*"([^"]*)"[^{}]*"date"\s*:\s*"([^"]+)"[^{}]*\}/g;
          const salvaged = [];
          let match;
          while ((match = expenseRegex.exec(text)) !== null) {
            salvaged.push({
              id: `salvaged_${Date.now()}_${match[4]}_${match[1]}_${salvaged.length}`,
              amount: parseFloat(match[1]),
              description: match[2] || 'Imported item',
              category: match[3] || 'groceries',
              date: match[4],
              type: 'expense'
            });
          }
          if (salvaged.length > 0) {
            createSnapshot('Pre-import backup');
            const map = new Map(state.expenses.map(e => [e.id, e]));
            salvaged.forEach(e => map.set(e.id, e));
            state.expenses = Array.from(map.values());
            saveState();
            renderDashboard();
            renderMonthlyBreakdown();
            renderHistory();
            alert(`Successfully salvaged and imported ${salvaged.length} transactions from text!`);
            closePaste();
            closeModal();
            return;
          }
        }

        try {
          createSnapshot('Pre-import backup');
          importFromCSV(text);
          closePaste();
          closeModal();
        } catch (err) {
          alert('Could not parse pasted data: ' + err.message);
        }
      });
    }
  }

  // Import JSON
  importDataBtn.addEventListener('click', () => {
    importFileInput.click();
  });

  importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed && typeof parsed === 'object') {
          createSnapshot('Pre-import backup');
          state = { ...state, ...parsed };
          saveState();
          applyTheme();
          updateCurrencyUI();
          updateBillsToggleUI();
          renderDashboard();
          renderMonthlyBreakdown();
          initCategorySelectors();
          alert('Backup data successfully imported!');
          closeModal();
        } else {
          alert('Invalid backup format.');
        }
      } catch (err) {
        alert('Failed to read file: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  // Excel CSV Export/Import Buttons
  const exportExcelBtn = document.getElementById('export-excel-btn');
  const importExcelBtn = document.getElementById('import-excel-btn');
  const importExcelInput = document.getElementById('import-excel-input');

  if (exportExcelBtn) {
    exportExcelBtn.addEventListener('click', () => {
      exportToCSV();
    });
  }

  if (importExcelBtn && importExcelInput) {
    importExcelBtn.addEventListener('click', () => {
      importExcelInput.click();
    });

    importExcelInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        createSnapshot('Pre-import backup');
        importFromCSV(event.target.result);
        closeModal();
      };
      reader.readAsText(file);
      importExcelInput.value = ''; // reset so same file can be re-imported
    });
  }

  // Theme Option grid selectors
  const themeOptions = document.querySelectorAll('.theme-option');
  themeOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      state.theme = opt.getAttribute('data-theme');
      applyTheme();
      saveState();
    });
  });

  // Theme Toggle (Quick cycle in header)
  themeToggle.addEventListener('click', toggleTheme);

  // Check for Updates / Force Refresh
  const forceUpdateBtn = document.getElementById('force-update-btn');
  if (forceUpdateBtn) {
    forceUpdateBtn.addEventListener('click', async () => {
      forceUpdateBtn.innerHTML = `<i data-lucide="refresh-cw" class="spin-icon"></i> Checking & Updating...`;
      if (window.lucide) window.lucide.createIcons();
      saveState();

      // Clear any CacheStorage caches if present
      if ('caches' in window) {
        try {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        } catch (e) {
          console.warn('Cache clearing error:', e);
        }
      }

      // Hard cache-busting reload
      const cleanUrl = window.location.origin + window.location.pathname;
      setTimeout(() => {
        window.location.replace(`${cleanUrl}?_t=${Date.now()}`);
      }, 400);
    });
  }

  // Reset Data
  resetAllBtn.addEventListener('click', () => {
    if (confirm('Are you absolutely sure you want to reset all budget and spending data? This cannot be undone.')) {
      createSnapshot('Pre-reset backup');
      state = {
        income: 0.00,
        currency: '$',
        expenses: [],
        selectedCategory: 'food',
        theme: 'shallot',
        currentWeekOffset: 0,
        currentMonthOffset: 0,
        hideBillsInBreakdown: false,
      };
      saveState();
      applyTheme();
      updateCurrencyUI();
      updateBillsToggleUI();
      renderDashboard();
      initCategorySelectors();
      closeModal();
    }
  });
}

let isInitialized = false;
function init() {
  if (isInitialized) return;
  isInitialized = true;

  loadState();
  applyTheme();

  // Set default date input to today
  expenseDateInput.value = formatDateLocal(new Date());

  initCategorySelectors();
  updateBillsToggleUI();
  setupEventListeners();
  renderDashboard();
  renderMonthlyBreakdown();

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Execute on DOM loaded
document.addEventListener('DOMContentLoaded', init);
// Run init immediately in case script loaded async after DOMContentLoaded
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  init();
}

// Register Service Worker for offline resilience
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.warn('SW registration info:', err);
    });
  });
}

