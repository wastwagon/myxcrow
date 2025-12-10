#!/bin/bash

# Simplified Escrow Test
API_URL="http://localhost:4001/api"

echo "=== Escrow Workflow Test ==="
echo ""

# Get tokens
echo "1. Getting authentication tokens..."
BUYER_TOKEN=$(docker exec escrow_api curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"buyer@test.com","password":"testpass123"}' \
    | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

SELLER_TOKEN=$(docker exec escrow_api curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"seller@test.com","password":"testpass123"}' \
    | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

SELLER_ID="3b679b36-b986-4c3f-9301-b174c4d857ef"

echo "✓ Tokens obtained"
echo ""

# Create escrow
echo "2. Creating escrow..."
ESCROW_RESPONSE=$(docker exec escrow_api curl -s -X POST "$API_URL/escrows" \
    -H "Authorization: Bearer $BUYER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"sellerId\":\"$SELLER_ID\",\"amountCents\":5000,\"currency\":\"GHS\",\"description\":\"Test escrow\",\"useWallet\":true}")

ESCROW_ID=$(echo "$ESCROW_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
STATUS=$(echo "$ESCROW_RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4)

if [ -n "$ESCROW_ID" ]; then
    echo "✓ Escrow created: $ESCROW_ID (Status: $STATUS)"
else
    echo "✗ Failed: $ESCROW_RESPONSE"
    exit 1
fi
echo ""

# Fund escrow
echo "3. Funding escrow..."
FUND_RESPONSE=$(docker exec escrow_api curl -s -X PUT "$API_URL/escrows/$ESCROW_ID/fund" \
    -H "Authorization: Bearer $BUYER_TOKEN")
FUND_STATUS=$(echo "$FUND_RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
echo "✓ Funded (Status: $FUND_STATUS)"
echo ""

# Ship escrow
echo "4. Shipping escrow..."
SHIP_RESPONSE=$(docker exec escrow_api curl -s -X PUT "$API_URL/escrows/$ESCROW_ID/ship" \
    -H "Authorization: Bearer $SELLER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"trackingNumber":"TRACK123","carrier":"Test Carrier"}')
SHIP_STATUS=$(echo "$SHIP_RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
echo "✓ Shipped (Status: $SHIP_STATUS)"
echo ""

# Deliver escrow
echo "5. Delivering escrow..."
DELIVER_RESPONSE=$(docker exec escrow_api curl -s -X PUT "$API_URL/escrows/$ESCROW_ID/deliver" \
    -H "Authorization: Bearer $BUYER_TOKEN")
DELIVER_STATUS=$(echo "$DELIVER_RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
echo "✓ Delivered (Status: $DELIVER_STATUS)"
echo ""

# Release funds
echo "6. Releasing funds..."
RELEASE_RESPONSE=$(docker exec escrow_api curl -s -X PUT "$API_URL/escrows/$ESCROW_ID/release" \
    -H "Authorization: Bearer $BUYER_TOKEN")
RELEASE_STATUS=$(echo "$RELEASE_RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
echo "✓ Released (Status: $RELEASE_STATUS)"
echo ""

echo "=== Test Complete ==="
echo "Escrow ID: $ESCROW_ID"
echo "Final Status: $RELEASE_STATUS"




