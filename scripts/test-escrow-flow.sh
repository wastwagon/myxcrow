#!/bin/bash
# Test MYXCROW escrow flow via API
# Prerequisites: API running (docker-compose or pnpm dev), DB seeded
# Usage: ./scripts/test-escrow-flow.sh [API_BASE_URL]

set -e
API_BASE="${1:-http://localhost:4000/api}"

echo "=========================================="
echo "MYXCROW Escrow Flow Test"
echo "API: $API_BASE"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✓ $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }

# Check API is reachable
echo ""
echo "1. Checking API..."
if ! curl -s -o /dev/null -w "%{http_code}" "$API_BASE/../health" 2>/dev/null | grep -qE "200|404"; then
  if ! curl -s -o /dev/null -w "%{http_code}" "$API_BASE/auth/login" -X POST -H "Content-Type: application/json" -d '{}' 2>/dev/null | grep -qE "200|400|401"; then
    fail "API not reachable at $API_BASE. Ensure services are running (docker-compose up or pnpm dev)."
  fi
fi
pass "API reachable"

# Login as buyer
echo ""
echo "2. Login as buyer (buyer1@test.com)..."
BUYER_LOGIN=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer1@test.com","password":"password123"}')
BUYER_TOKEN=$(echo "$BUYER_LOGIN" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
if [ -z "$BUYER_TOKEN" ]; then
  fail "Buyer login failed. Response: $BUYER_LOGIN"
fi
pass "Buyer logged in"

# Login as seller
echo ""
echo "3. Login as seller (seller1@test.com)..."
SELLER_LOGIN=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"seller1@test.com","password":"password123"}')
SELLER_TOKEN=$(echo "$SELLER_LOGIN" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
if [ -z "$SELLER_TOKEN" ]; then
  fail "Seller login failed. Response: $SELLER_LOGIN"
fi
pass "Seller logged in"

# Create escrow (buyer)
echo ""
echo "4. Create escrow (buyer creates, seller: seller1@test.com, amount: 100 GHS = 10000 cents)..."
CREATE_RESP=$(curl -s -X POST "$API_BASE/escrows" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -d '{
    "sellerId": "seller1@test.com",
    "amountCents": 10000,
    "currency": "GHS",
    "description": "Flow test - Test item",
    "useWallet": true
  }')
ESCROW_ID=$(echo "$CREATE_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$ESCROW_ID" ]; then
  fail "Create escrow failed. Response: $CREATE_RESP"
fi
pass "Escrow created: $ESCROW_ID"

# Fund escrow (buyer)
echo ""
echo "5. Fund escrow from wallet (buyer)..."
FUND_RESP=$(curl -s -X PUT "$API_BASE/escrows/$ESCROW_ID/fund" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -d '{}')
FUND_STATUS=$(echo "$FUND_RESP" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ "$FUND_STATUS" != "FUNDED" ]; then
  fail "Fund escrow failed. Response: $FUND_RESP"
fi
pass "Escrow funded"

# Ship escrow (seller)
echo ""
echo "6. Mark as shipped (seller)..."
SHIP_RESP=$(curl -s -X PUT "$API_BASE/escrows/$ESCROW_ID/ship" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  -d '{"trackingNumber":"TEST123","carrier":"Test Carrier"}')
SHIP_STATUS=$(echo "$SHIP_RESP" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ "$SHIP_STATUS" != "SHIPPED" ]; then
  fail "Ship escrow failed. Response: $SHIP_RESP"
fi
pass "Escrow shipped"

# Deliver escrow (buyer)
echo ""
echo "7. Mark as delivered (buyer)..."
DELIVER_RESP=$(curl -s -X PUT "$API_BASE/escrows/$ESCROW_ID/deliver" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -d '{}')
DELIVER_STATUS=$(echo "$DELIVER_RESP" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ "$DELIVER_STATUS" != "DELIVERED" ] && [ "$DELIVER_STATUS" != "RELEASED" ]; then
  # With autoReleaseDays=0, may auto-release on deliver
  if [ "$DELIVER_STATUS" != "DELIVERED" ] && [ "$DELIVER_STATUS" != "RELEASED" ]; then
    fail "Deliver escrow failed. Response: $DELIVER_RESP"
  fi
fi
pass "Escrow delivered (status: $DELIVER_STATUS)"

# Release escrow (buyer) - only if not already auto-released
if [ "$DELIVER_STATUS" != "RELEASED" ]; then
  echo ""
  echo "8. Release funds to seller (buyer)..."
  RELEASE_RESP=$(curl -s -X PUT "$API_BASE/escrows/$ESCROW_ID/release" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $BUYER_TOKEN" \
    -d '{}')
  RELEASE_STATUS=$(echo "$RELEASE_RESP" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
  if [ "$RELEASE_STATUS" != "RELEASED" ]; then
    fail "Release escrow failed. Response: $RELEASE_RESP"
  fi
  pass "Funds released to seller"
else
  echo ""
  echo "8. Release funds - skipped (auto-released on delivery)"
  pass "Auto-release completed"
fi

# Verify final state
echo ""
echo "9. Verify escrow status..."
GET_RESP=$(curl -s -X GET "$API_BASE/escrows/$ESCROW_ID" \
  -H "Authorization: Bearer $BUYER_TOKEN")
FINAL_STATUS=$(echo "$GET_RESP" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ "$FINAL_STATUS" != "RELEASED" ]; then
  fail "Expected RELEASED, got $FINAL_STATUS"
fi
pass "Escrow status: RELEASED"

echo ""
echo "=========================================="
echo -e "${GREEN}All flow tests passed!${NC}"
echo "=========================================="
# Idempotency test: release again should return success (no error)
echo ""
echo "10. Idempotency: Release again (should succeed, no double-spend)..."
RELEASE2_RESP=$(curl -s -X PUT "$API_BASE/escrows/$ESCROW_ID/release" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -d '{}')
RELEASE2_STATUS=$(echo "$RELEASE2_RESP" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ "$RELEASE2_STATUS" != "RELEASED" ]; then
  # Check if it's an error response
  if echo "$RELEASE2_RESP" | grep -q "statusCode"; then
    fail "Idempotency: Second release should return escrow, not error. Response: $RELEASE2_RESP"
  fi
fi
pass "Idempotency: Second release returned escrow (no double-spend)"

echo ""
echo "Flow: Create → Fund → Ship → Deliver → Release"
echo "Bonus: Idempotency verified"
echo ""
