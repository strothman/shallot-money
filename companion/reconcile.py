#!/usr/bin/env python3
"""
Shallot Money — PC Companion & Transaction Reconciler
Aggregates TD Bank, Capital One, and EBT statements, cross-references with 
Kroger and Walmart digital receipts, auto-categorizes spending, and generates 
a Shallot Money-ready CSV.
"""

import os
import sys
import re
import csv
import json
import glob
import subprocess
from datetime import datetime, timedelta

# Fix Windows console UTF-8 output
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUTS_DIR = os.path.join(BASE_DIR, "inputs")
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")
RULES_FILE = os.path.join(BASE_DIR, "rules.json")

def load_rules():
    if os.path.exists(RULES_FILE):
        try:
            with open(RULES_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("merchant_rules", {})
        except Exception as e:
            print(f"[!] Warning reading rules.json: {e}")
    return {}

def auto_categorize(desc, rules):
    desc_lower = desc.lower()
    for cat_id, keywords in rules.items():
        for kw in keywords:
            if kw.lower() in desc_lower:
                return cat_id
    return "groceries" if "kroger" in desc_lower or "walmart" in desc_lower else "shopping"

def parse_date(date_str):
    if not date_str:
        return None
    date_str = str(date_str).strip()
    for fmt in ('%Y-%m-%d', '%m/%d/%Y', '%m-%d-%Y', '%m/%d/%y', '%Y/%m/%d', '%b %d, %Y', '%B %d, %Y'):
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            pass
    return None

def clean_amount(val):
    if val is None:
        return 0.0
    s = str(val).replace('$', '').replace(',', '').replace(' ', '').strip()
    try:
        return float(s)
    except ValueError:
        return 0.0

# ---------------------------------------------------------------------------
# STORE RECEIPT PARSERS (KROGER & WALMART)
# ---------------------------------------------------------------------------
def load_store_receipts(inputs_dir):
    receipts = []
    
    # 1. Kroger receipt JSON or CSV
    for fpath in glob.glob(os.path.join(inputs_dir, "*kroger*.*")):
        try:
            if fpath.endswith(".json"):
                with open(fpath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    orders = data if isinstance(data, list) else data.get("orders", [data])
                    for order in orders:
                        d = parse_date(order.get("date") or order.get("orderDate"))
                        amt = clean_amount(order.get("total") or order.get("amount"))
                        items = order.get("items", [])
                        item_names = [it.get("name", "") for it in items if isinstance(it, dict)] if items else []
                        if d and amt > 0:
                            receipts.append({
                                "store": "Kroger",
                                "date": d,
                                "amount": round(amt, 2),
                                "items": item_names,
                                "raw": f"Kroger ({', '.join(item_names[:3]) + '...' if item_names else 'Groceries'})"
                            })
            elif fpath.endswith(".csv"):
                with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        # Find date and total
                        d = None
                        amt = 0.0
                        items = []
                        for k, v in row.items():
                            k_low = k.lower()
                            if "date" in k_low and not d:
                                d = parse_date(v)
                            elif ("total" in k_low or "amount" in k_low) and amt == 0:
                                amt = clean_amount(v)
                            elif "item" in k_low or "desc" in k_low:
                                items.append(str(v).strip())
                        if d and amt > 0:
                            receipts.append({
                                "store": "Kroger",
                                "date": d,
                                "amount": round(amt, 2),
                                "items": items,
                                "raw": f"Kroger ({', '.join(items[:3]) if items else 'Groceries'})"
                            })
        except Exception as e:
            print(f"[!] Warning reading Kroger receipt {fpath}: {e}")

    # 2. Walmart receipt JSON or CSV
    for fpath in glob.glob(os.path.join(inputs_dir, "*walmart*.*")):
        try:
            if fpath.endswith(".json"):
                with open(fpath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    orders = data if isinstance(data, list) else data.get("orders", [data])
                    for order in orders:
                        d = parse_date(order.get("date") or order.get("orderDate"))
                        amt = clean_amount(order.get("total") or order.get("amount"))
                        items = order.get("items", [])
                        item_names = [it.get("name", "") for it in items if isinstance(it, dict)] if items else []
                        if d and amt > 0:
                            receipts.append({
                                "store": "Walmart",
                                "date": d,
                                "amount": round(amt, 2),
                                "items": item_names,
                                "raw": f"Walmart ({', '.join(item_names[:3]) + '...' if item_names else 'Groceries & Goods'})"
                            })
            elif fpath.endswith(".csv"):
                with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        d = None
                        amt = 0.0
                        items = []
                        for k, v in row.items():
                            k_low = k.lower()
                            if "date" in k_low and not d:
                                d = parse_date(v)
                            elif ("total" in k_low or "amount" in k_low) and amt == 0:
                                amt = clean_amount(v)
                            elif "item" in k_low or "desc" in k_low:
                                items.append(str(v).strip())
                        if d and amt > 0:
                            receipts.append({
                                "store": "Walmart",
                                "date": d,
                                "amount": round(amt, 2),
                                "items": items,
                                "raw": f"Walmart ({', '.join(items[:3]) if items else 'Goods'})"
                            })
        except Exception as e:
            print(f"[!] Warning reading Walmart receipt {fpath}: {e}")

    return receipts

# ---------------------------------------------------------------------------
# BANK & EBT PARSERS
# ---------------------------------------------------------------------------
def parse_bank_file(fpath):
    transactions = []
    fname = os.path.basename(fpath).lower()
    
    # Check if text file (e.g. EBT copy paste)
    if fpath.endswith(".txt"):
        with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                # Match patterns like: 08/14/2026 KROGER #524 $43.12 or 08/14/26 WALMART -45.00
                date_match = re.search(r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', line)
                amt_match = re.search(r'\$?\s*(-?\d+\.\d{2})', line)
                if date_match and amt_match:
                    d = parse_date(date_match.group(1))
                    amt = abs(clean_amount(amt_match.group(1)))
                    # Description is remaining text
                    desc = line.replace(date_match.group(1), '').replace(amt_match.group(0), '').replace('$', '').strip()
                    if not desc:
                        desc = "EBT Purchase"
                    if d and amt > 0:
                        transactions.append({
                            "source": "EBT",
                            "date": d,
                            "amount": round(amt, 2),
                            "description": desc
                        })
        return transactions

    # Otherwise parse CSV
    with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.reader(f)
        rows = list(reader)
        if not rows:
            return transactions

        header = [h.lower().strip() for h in rows[0]]
        
        # Capital One pattern: Transaction Date, Posted Date, Card No., Description, Category, Debit, Credit
        if "transaction date" in header or ("card no." in header and "debit" in header):
            t_date_idx = header.index("transaction date") if "transaction date" in header else header.index("posted date")
            desc_idx = header.index("description")
            debit_idx = header.index("debit") if "debit" in header else -1
            credit_idx = header.index("credit") if "credit" in header else -1
            cat_idx = header.index("category") if "category" in header else -1

            for r in rows[1:]:
                if len(r) <= max(t_date_idx, desc_idx):
                    continue
                d = parse_date(r[t_date_idx])
                desc = r[desc_idx].strip()
                debit = clean_amount(r[debit_idx]) if debit_idx != -1 and len(r) > debit_idx else 0.0
                credit = clean_amount(r[credit_idx]) if credit_idx != -1 and len(r) > credit_idx else 0.0

                if debit > 0:
                    transactions.append({
                        "source": "Capital One",
                        "date": d,
                        "amount": round(debit, 2),
                        "description": desc,
                        "orig_cat": r[cat_idx] if cat_idx != -1 and len(r) > cat_idx else ""
                    })
                elif credit > 0:
                    # Refund
                    transactions.append({
                        "source": "Capital One",
                        "date": d,
                        "amount": round(-credit, 2),
                        "description": f"Refund: {desc}",
                        "orig_cat": r[cat_idx] if cat_idx != -1 and len(r) > cat_idx else ""
                    })

        # TD Bank pattern: Date, Description, Amount / Withdrawals
        else:
            date_idx = -1
            desc_idx = -1
            amt_idx = -1
            out_idx = -1
            in_idx = -1

            for idx, col in enumerate(header):
                if "date" in col and date_idx == -1:
                    date_idx = idx
                elif "desc" in col or "memo" in col or "payee" in col:
                    desc_idx = idx
                elif col in ("amount", "transaction amount"):
                    amt_idx = idx
                elif "withdrawal" in col or "debit" in col or "out" in col:
                    out_idx = idx
                elif "deposit" in col or "credit" in col or "in" in col:
                    in_idx = idx

            for r in rows[1:]:
                if date_idx == -1 or len(r) <= date_idx:
                    continue
                d = parse_date(r[date_idx])
                desc = r[desc_idx].strip() if desc_idx != -1 and len(r) > desc_idx else "Debit Purchase"
                
                amt = 0.0
                if out_idx != -1 and len(r) > out_idx and clean_amount(r[out_idx]) > 0:
                    amt = clean_amount(r[out_idx])
                elif amt_idx != -1 and len(r) > amt_idx:
                    amt = abs(clean_amount(r[amt_idx]))
                
                if d and amt > 0:
                    transactions.append({
                        "source": "TD Bank" if "td" in fname else "Bank",
                        "date": d,
                        "amount": round(amt, 2),
                        "description": desc
                    })

    return transactions

# ---------------------------------------------------------------------------
# MAIN RECONCILIATION ROUTINE
# ---------------------------------------------------------------------------
def run_reconciliation():
    os.makedirs(INPUTS_DIR, exist_ok=True)
    os.makedirs(OUTPUTS_DIR, exist_ok=True)
    
    print("=" * 65)
    print("       🧅 SHALLOT MONEY — TRANSACTION RECONCILER")
    print("=" * 65)
    print(f"[*] Scanning inputs folder: {INPUTS_DIR}")
    
    rules = load_rules()
    receipts = load_store_receipts(INPUTS_DIR)
    print(f"[+] Loaded {len(receipts)} store receipts from Kroger / Walmart")

    all_txs = []
    for fpath in glob.glob(os.path.join(INPUTS_DIR, "*.*")):
        fname = os.path.basename(fpath).lower()
        if any(store in fname for store in ["kroger", "walmart"]) and ("receipt" in fname or "order" in fname):
            continue # Already loaded in store receipts
        txs = parse_bank_file(fpath)
        if txs:
            print(f"[+] Parsed {len(txs)} transactions from {os.path.basename(fpath)}")
            all_txs.extend(txs)

    if not all_txs:
        print("\n[!] No bank statement files found in inputs/.")
        print(f"👉 Please drop your TD Bank, Capital One, or EBT statement files into:\n   {INPUTS_DIR}")
        return

    # Deduplicate & Match against receipts
    reconciled_expenses = []
    used_receipts = set()

    for tx in all_txs:
        tx_date = tx["date"]
        tx_amt = tx["amount"]
        tx_desc = tx["description"]
        matched_receipt = None

        # Try to match store receipts by exact amount and date (+/- 2 days)
        for idx, rec in enumerate(receipts):
            if idx in used_receipts:
                continue
            if abs((rec["date"] - tx_date).days) <= 2 and abs(rec["amount"] - tx_amt) < 0.01:
                matched_receipt = rec
                used_receipts.add(idx)
                break

        final_desc = tx_desc
        if matched_receipt:
            final_desc = matched_receipt["raw"]
            category = "groceries" if matched_receipt["store"] == "Kroger" else auto_categorize(final_desc, rules)
        else:
            category = auto_categorize(tx_desc, rules)

        reconciled_expenses.append({
            "date": tx_date.strftime("%Y-%m-%d"),
            "amount": tx_amt,
            "description": final_desc,
            "category": category
        })

    # Sort chronological
    reconciled_expenses.sort(key=lambda x: x["date"])

    # Export CSV
    out_file = os.path.join(OUTPUTS_DIR, "shallot_money_import.csv")
    with open(out_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Date", "Amount", "Description", "Category"])
        for exp in reconciled_expenses:
            writer.writerow([exp["date"], f"{exp['amount']:.2f}", exp["description"], exp["category"]])

    print("\n" + "-" * 65)
    print(f"🎉 SUCCESS! Reconciled {len(reconciled_expenses)} transactions.")
    print(f"📄 Output generated at:\n   {out_file}")
    print("-" * 65)

    # Try copying to Windows Clipboard
    try:
        with open(out_file, "r", encoding="utf-8") as f:
            csv_text = f.read()
        subprocess.run(['clip'], input=csv_text.strip().encode('utf-8'), check=True)
        print("📋 CSV data has been automatically copied to your Windows Clipboard!")
        print("👉 You can now go to Shallot Money -> Settings -> 'Paste Data' and click Import!")
    except Exception:
        pass

if __name__ == "__main__":
    run_reconciliation()
