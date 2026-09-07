import os
import re
import csv
import json
import datetime
import openpyxl
import sys

sys.path.insert(0, r"c:\Users\strot\Antigravity IDE\Shallot-Money")
from companion.reconcile import parse_bank_file

BASE_DIR = r"c:\Users\strot\Antigravity IDE\Shallot-Money"
EXCEL_PATH = r"\\joandesk\Cloud\-Rick\Rick Spreadsheet Budget.xlsx"
OUTPUTS_DIR = os.path.join(BASE_DIR, "companion", "outputs")
INPUTS_DIR = os.path.join(BASE_DIR, "companion", "inputs")
IMPORTED_JSON_PATH = os.path.join(BASE_DIR, "src", "imported_expenses.json")

os.makedirs(OUTPUTS_DIR, exist_ok=True)

# Category mapping
CATEGORY_MAP = {
    'Food': 'food',
    'Groceries': 'food',
    'Gas': 'transport',
    'Auto': 'transport',
    'Gym': 'gym',
    'Health': 'gym',
    'Prime': 'bills',
    'Bills': 'bills',
    'Entertainment': 'entertainment',
    'Merch': 'shopping',
    'Goods?': 'shopping',
    'Fast Food': 'fastfood'
}

# 1. Load Excel
wb = openpyxl.load_workbook(EXCEL_PATH, read_only=True)
sheet = wb['Expenses']
excel_txs = []
for r_idx, r in enumerate(list(sheet.iter_rows(values_only=True))[1:], start=2):
    d, amt, desc, cat = r[1], r[2], r[3], r[4]
    if d and amt is not None:
        try:
            amt_f = round(float(amt), 2)
            d_val = d.date() if isinstance(d, datetime.datetime) else d
            excel_txs.append({
                'row': r_idx,
                'date': d_val,
                'amount': amt_f,
                'desc': str(desc).strip(),
                'cat': str(cat).strip()
            })
        except Exception:
            pass

# 2. Load Bank statements
bank_txs = []
for f in os.listdir(INPUTS_DIR):
    fpath = os.path.join(INPUTS_DIR, f)
    if os.path.isfile(fpath):
        bank_txs.extend(parse_bank_file(fpath))

print(f"Loaded {len(excel_txs)} Excel transactions and {len(bank_txs)} bank records.")

# 3. Match mathematically
verified_entries = []
unmatched = []

for et in excel_txs:
    # Filter candidates by exact amount
    candidates = [bt for bt in bank_txs if abs(bt['amount'] - et['amount']) < 0.009]
    if not candidates:
        unmatched.append((et, None, "No amount match"))
        continue

    # Find closest by date
    closest = min(candidates, key=lambda b: abs((b['date'] - et['date']).days))
    diff = (closest['date'] - et['date']).days

    if abs(diff) <= 4:
        # Verified mathematical match!
        # Extract clean merchant and items from description
        raw_desc = et['desc']
        clean_merchant = raw_desc
        items = []

        # Case A: "Merchant (item1, item2...)"
        paren_m = re.match(r'^(.*?)\s*\((.+)\)\s*$', raw_desc)
        if paren_m:
            clean_merchant = paren_m.group(1).strip()
            raw_items = paren_m.group(2).strip()
            items = [it.strip() for it in re.split(r'[,;]+', raw_items) if it.strip()]
        else:
            # Case B: "Merchant, item1, item2..." or "Merchant: item1, item2"
            delim_m = re.match(r'^([^:,]{2,25})\s*[:,\-–—]\s*(.+)$', raw_desc)
            if delim_m:
                cand_merch = delim_m.group(1).strip()
                cand_items = delim_m.group(2).strip()
                split_items = [it.strip() for it in re.split(r'[,;]+', cand_items) if it.strip()]
                if len(split_items) >= 1 and cand_merch.lower() in ('walmart', 'kroger', 'circle k', 'jimmy johns', 'jimmy john’s', 'sam’s', 'sams', 'mcdonalds'):
                    clean_merchant = cand_merch
                    items = split_items

        cat_id = CATEGORY_MAP.get(et['cat'], 'food')

        verified_entries.append({
            'date': et['date'].strftime('%Y-%m-%d'),
            'bank_date': closest['date'].strftime('%Y-%m-%d'),
            'bank_source': closest['source'],
            'bank_desc': closest['description'],
            'amount': et['amount'],
            'merchant': clean_merchant,
            'raw_description': raw_desc,
            'items': items,
            'category': cat_id,
            'day_diff': diff
        })
    else:
        unmatched.append((et, closest, f"Date spread too wide ({diff:+d}d)"))

print(f"\n[+] Successfully verified {len(verified_entries)} transactions mathematically against bank records!")
print(f"[-] Unmatched: {len(unmatched)}")

# 4. Generate shallot_money_import.csv
csv_out_path = os.path.join(OUTPUTS_DIR, "shallot_money_import.csv")
with open(csv_out_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["Date", "Amount", "Description", "Category", "Items"])
    for v in verified_entries:
        items_str = "; ".join(v['items']) if v['items'] else ""
        writer.writerow([v['date'], f"{v['amount']:.2f}", v['merchant'], v['category'], items_str])

print(f"[+] Wrote verified CSV to: {csv_out_path}")

# 5. Generate JSON for imported_expenses.json
json_entries = []
for idx, v in enumerate(verified_entries, start=1):
    entry = {
        "id": f"imported_{idx}_{v['date']}",
        "amount": v['amount'],
        "description": v['raw_description'],
        "category": v['category'],
        "date": v['date']
    }
    if v['items']:
        entry["items"] = v['items']
    json_entries.append(entry)

with open(IMPORTED_JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(json_entries, f, indent=2, ensure_ascii=False)

print(f"[+] Updated src/imported_expenses.json with {len(json_entries)} itemized entries!")

# Try copying CSV to Windows Clipboard
try:
    import subprocess
    with open(csv_out_path, "r", encoding="utf-8") as f:
        csv_text = f.read()
    subprocess.run(['clip'], input=csv_text.strip().encode('utf-8'), check=True)
    print("[+] Copied verified CSV directly to Windows Clipboard!")
except Exception as e:
    print(f"[!] Clipboard copy skipped: {e}")
