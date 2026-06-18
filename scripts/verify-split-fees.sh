#!/bin/bash
# Verify split-fee math via the public fee calculate endpoint.

set -e

API_BASE="${API_BASE:-http://localhost:4010/api}"
AMOUNT_CENTS="${1:-10000}"

echo "Fee settings:"
curl -sf "$API_BASE/settings/fees" | python3 -m json.tool 2>/dev/null || curl -sf "$API_BASE/settings/fees"
echo ""

echo "Calculate for amountCents=$AMOUNT_CENTS:"
RESP=$(curl -sf "$API_BASE/settings/fees/calculate?amountCents=$AMOUNT_CENTS")
echo "$RESP" | python3 -m json.tool 2>/dev/null || echo "$RESP"
echo ""

python3 - <<'PY' "$RESP"
import json, sys
d = json.loads(sys.argv[1])
errors = []
if d.get("feeCents") != d.get("buyerFeeCents", 0) + d.get("sellerFeeCents", 0):
    errors.append("feeCents != buyerFeeCents + sellerFeeCents")
if d.get("fundingAmountCents") != d.get("amountCents", 0) + d.get("buyerFeeCents", 0):
    errors.append("fundingAmountCents != amountCents + buyerFeeCents")
if d.get("netAmountCents") != d.get("amountCents", 0) - d.get("sellerFeeCents", 0):
    errors.append("netAmountCents != amountCents - sellerFeeCents")
if d.get("paidBy") == "split" and d.get("amountCents") == 10000:
    if d.get("buyerFeeCents") != 100 or d.get("sellerFeeCents") != 100:
        errors.append("split @ 2% on 10000: expected 100/100 buyer/seller fees")
if errors:
    print("FAILED:")
    for e in errors:
        print(" -", e)
    sys.exit(1)
print("OK: fee breakdown is internally consistent")
PY
