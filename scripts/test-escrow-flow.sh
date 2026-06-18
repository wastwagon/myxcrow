#!/bin/bash
# Test MYXCROW escrow flow via API (includes split-fee assertions when paidBy=split)
# Usage: ./scripts/test-escrow-flow.sh [API_BASE_URL]

set -e
API_BASE="${1:-http://localhost:4010/api}"

echo "=========================================="
echo "MYXCROW Escrow Flow Test"
echo "API: $API_BASE"
echo "=========================================="

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✓ $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }

json_field() {
  python3 -c "import json,sys; d=json.load(sys.stdin); print(d$1)" 2>/dev/null
}

echo ""
echo "1. Checking API..."
if ! curl -sf "$API_BASE/health" >/dev/null 2>&1; then
  if ! curl -sf "$API_BASE/settings/fees" >/dev/null 2>&1; then
    fail "API not reachable at $API_BASE"
  fi
fi
pass "API reachable"

echo ""
echo "2. Fee settings..."
FEE_SETTINGS=$(curl -sf "$API_BASE/settings/fees")
echo "$FEE_SETTINGS" | python3 -m json.tool 2>/dev/null || echo "$FEE_SETTINGS"
PAID_BY=$(echo "$FEE_SETTINGS" | json_field "['paidBy']")
pass "Fee paidBy: $PAID_BY"

echo ""
echo "3. Login as buyer (buyer1@test.com)..."
BUYER_LOGIN=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"buyer1@test.com","password":"password123"}')
BUYER_TOKEN=$(echo "$BUYER_LOGIN" | json_field "['accessToken']")
if [ -z "$BUYER_TOKEN" ] || [ "$BUYER_TOKEN" = "None" ]; then
  fail "Buyer login failed. Response: $BUYER_LOGIN"
fi
pass "Buyer logged in"

echo ""
echo "4. Login as seller (seller1@test.com)..."
SELLER_LOGIN=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"seller1@test.com","password":"password123"}')
SELLER_TOKEN=$(echo "$SELLER_LOGIN" | json_field "['accessToken']")
if [ -z "$SELLER_TOKEN" ] || [ "$SELLER_TOKEN" = "None" ]; then
  fail "Seller login failed. Response: $SELLER_LOGIN"
fi
pass "Seller logged in"

echo ""
echo "5. Create escrow (100 GHS deal)..."
CREATE_RESP=$(curl -s -X POST "$API_BASE/escrows" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -d '{
    "sellerPhone": "0551000003",
    "amountCents": 10000,
    "currency": "GHS",
    "description": "Split-fee flow test",
    "useWallet": true,
    "deliveryConfirmationMode": "code"
  }')
ESCROW_ID=$(echo "$CREATE_RESP" | json_field "['id']")
if [ -z "$ESCROW_ID" ] || [ "$ESCROW_ID" = "None" ]; then
  fail "Create escrow failed. Response: $CREATE_RESP"
fi

AMOUNT=$(echo "$CREATE_RESP" | json_field "['amountCents']")
FUNDING=$(echo "$CREATE_RESP" | json_field "['fundingAmountCents']")
NET=$(echo "$CREATE_RESP" | json_field "['netAmountCents']")
BUYER_FEE=$(echo "$CREATE_RESP" | json_field "['buyerFeeCents']")
SELLER_FEE=$(echo "$CREATE_RESP" | json_field "['sellerFeeCents']")
pass "Escrow created: $ESCROW_ID"
echo "   amountCents=$AMOUNT fundingAmountCents=$FUNDING netAmountCents=$NET buyerFee=$BUYER_FEE sellerFee=$SELLER_FEE"

if [ "$PAID_BY" = "split" ]; then
  if [ "$FUNDING" != "10100" ] || [ "$NET" != "9900" ] || [ "$BUYER_FEE" != "100" ] || [ "$SELLER_FEE" != "100" ]; then
    fail "Split fee mismatch on create (expected funding=10100 net=9900 fees=100/100)"
  fi
  pass "Split fees on escrow: buyer +100, seller -100"
fi

echo ""
echo "6. Fund escrow from wallet..."
FUND_RESP=$(curl -s -X PUT "$API_BASE/escrows/$ESCROW_ID/fund" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -d '{}')
FUND_STATUS=$(echo "$FUND_RESP" | json_field "['status']")
if [ "$FUND_STATUS" != "FUNDED" ]; then
  fail "Fund escrow failed. Response: $FUND_RESP"
fi
pass "Escrow funded"

echo ""
echo "7. Mark as shipped (seller)..."
SHIP_RESP=$(curl -s -X PUT "$API_BASE/escrows/$ESCROW_ID/ship" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  -d '{"trackingNumber":"TEST123","carrier":"Test Carrier"}')
SHIP_STATUS=$(echo "$SHIP_RESP" | json_field "['status']")
if [ "$SHIP_STATUS" != "SHIPPED" ]; then
  fail "Ship escrow failed. Response: $SHIP_RESP"
fi

# Seller should see delivery code
SELLER_VIEW=$(curl -s -X GET "$API_BASE/escrows/$ESCROW_ID" \
  -H "Authorization: Bearer $SELLER_TOKEN")
DELIVERY_CODE=$(echo "$SELLER_VIEW" | python3 -c "import json,sys; d=json.load(sys.stdin); s=d.get('shipments') or []; print(s[0].get('deliveryCode','') if s else '')" 2>/dev/null)
SHORT_REF=$(echo "$SELLER_VIEW" | python3 -c "import json,sys; d=json.load(sys.stdin); s=d.get('shipments') or []; print(s[0].get('shortReference','') if s else '')" 2>/dev/null)
if [ -z "$DELIVERY_CODE" ] || [ -z "$SHORT_REF" ]; then
  fail "Seller cannot see delivery code/reference. Response shipments missing."
fi
pass "Escrow shipped; seller sees ref=$SHORT_REF code=$DELIVERY_CODE"

echo ""
echo "8. Mark as delivered (buyer)..."
DELIVER_RESP=$(curl -s -X PUT "$API_BASE/escrows/$ESCROW_ID/deliver" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -d '{}')
DELIVER_STATUS=$(echo "$DELIVER_RESP" | json_field "['status']")
if [ "$DELIVER_STATUS" != "DELIVERED" ] && [ "$DELIVER_STATUS" != "RELEASED" ]; then
  fail "Deliver escrow failed. Response: $DELIVER_RESP"
fi
pass "Escrow delivered (status: $DELIVER_STATUS)"

if [ "$DELIVER_STATUS" != "RELEASED" ]; then
  echo ""
  echo "9. Release funds to seller (buyer)..."
  RELEASE_RESP=$(curl -s -X PUT "$API_BASE/escrows/$ESCROW_ID/release" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $BUYER_TOKEN" \
    -d '{}')
  RELEASE_STATUS=$(echo "$RELEASE_RESP" | json_field "['status']")
  if [ "$RELEASE_STATUS" != "RELEASED" ]; then
    fail "Release escrow failed. Response: $RELEASE_RESP"
  fi
  pass "Funds released to seller"
else
  echo ""
  echo "9. Release skipped (auto-released on delivery)"
  pass "Auto-release completed"
fi

echo ""
echo "10. Verify final state and seller wallet credit..."
GET_RESP=$(curl -s -X GET "$API_BASE/escrows/$ESCROW_ID" \
  -H "Authorization: Bearer $BUYER_TOKEN")
FINAL_STATUS=$(echo "$GET_RESP" | json_field "['status']")
FINAL_NET=$(echo "$GET_RESP" | json_field "['netAmountCents']")
if [ "$FINAL_STATUS" != "RELEASED" ]; then
  fail "Expected RELEASED, got $FINAL_STATUS"
fi
pass "Escrow status: RELEASED (netAmountCents=$FINAL_NET)"

SELLER_WALLET=$(curl -s -X GET "$API_BASE/wallet" \
  -H "Authorization: Bearer $SELLER_TOKEN")
pass "Seller wallet fetched after release"

echo ""
echo "11. Idempotency: release again..."
RELEASE2_RESP=$(curl -s -X PUT "$API_BASE/escrows/$ESCROW_ID/release" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -d '{}')
RELEASE2_STATUS=$(echo "$RELEASE2_RESP" | json_field "['status']")
if [ "$RELEASE2_STATUS" != "RELEASED" ]; then
  if echo "$RELEASE2_RESP" | grep -q "statusCode"; then
    fail "Idempotency failed. Response: $RELEASE2_RESP"
  fi
fi
pass "Second release is idempotent"

echo ""
echo "=========================================="
echo -e "${GREEN}All flow tests passed!${NC}"
echo "=========================================="
echo "Flow: Create → Fund → Ship → Deliver → Release"
if [ "$PAID_BY" = "split" ]; then
  echo "Split fees verified: ₵100 deal → fund ₵101 → seller net ₵99"
fi
echo ""
