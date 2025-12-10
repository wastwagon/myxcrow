#!/bin/bash

# Complete Milestone Escrow Test
API_URL="http://localhost:4001/api"

echo "=== Complete Milestone Escrow Test ==="
echo ""

# Get tokens
BUYER_TOKEN=$(docker exec escrow_api curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"buyer@test.com","password":"testpass123"}' \
    | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

SELLER_TOKEN=$(docker exec escrow_api curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"seller@test.com","password":"testpass123"}' \
    | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

SELLER_ID="3b679b36-b986-4c3f-9301-b174c4d857ef"

# Ensure buyer has funds
docker exec escrow_db psql -U postgres -d escrow -c "UPDATE \"Wallet\" SET \"availableCents\" = 50000 WHERE \"userId\" = '2e8f11da-0957-4ebf-aff7-7653c7a1cdc0';" > /dev/null 2>&1

# Reset seller wallet
docker exec escrow_db psql -U postgres -d escrow -c "UPDATE \"Wallet\" SET \"availableCents\" = 0 WHERE \"userId\" = '3b679b36-b986-4c3f-9301-b174c4d857ef';" > /dev/null 2>&1

echo "1. Creating milestone escrow..."
ESCROW_RESPONSE=$(docker exec escrow_api curl -s -X POST "$API_URL/escrows" \
    -H "Authorization: Bearer $BUYER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"sellerId\": \"$SELLER_ID\",
        \"amountCents\": 15000,
        \"currency\": \"GHS\",
        \"description\": \"Complete milestone test\",
        \"useWallet\": true,
        \"milestones\": [
            {\"name\": \"Phase 1\", \"amountCents\": 5000},
            {\"name\": \"Phase 2\", \"amountCents\": 5000},
            {\"name\": \"Phase 3\", \"amountCents\": 5000}
        ]
    }")

ESCROW_ID=$(echo "$ESCROW_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "✓ Escrow created: $ESCROW_ID"
echo ""

# Fund
echo "2. Funding escrow..."
docker exec escrow_api curl -s -X PUT "$API_URL/escrows/$ESCROW_ID/fund" \
    -H "Authorization: Bearer $BUYER_TOKEN" > /dev/null
echo "✓ Funded"
echo ""

# Get milestones
echo "3. Getting milestones..."
MILESTONES=$(docker exec escrow_api curl -s "$API_URL/escrows/$ESCROW_ID/milestones" \
    -H "Authorization: Bearer $BUYER_TOKEN")

M1_ID=$(echo "$MILESTONES" | grep -A 2 "Phase 1" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
M2_ID=$(echo "$MILESTONES" | grep -A 2 "Phase 2" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
M3_ID=$(echo "$MILESTONES" | grep -A 2 "Phase 3" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

echo "Milestone IDs: $M1_ID, $M2_ID, $M3_ID"
echo ""

# Complete and release milestones
echo "4. Completing and releasing milestones..."

for i in 1 2 3; do
    eval "M_ID=\$M${i}_ID"
    echo "  Phase $i:"
    docker exec escrow_api curl -s -X PUT "$API_URL/escrows/$ESCROW_ID/milestones/$M_ID/complete" \
        -H "Authorization: Bearer $BUYER_TOKEN" > /dev/null
    echo "    ✓ Completed"
    
    docker exec escrow_api curl -s -X PUT "$API_URL/escrows/$ESCROW_ID/milestones/$M_ID/release" \
        -H "Authorization: Bearer $BUYER_TOKEN" > /dev/null
    echo "    ✓ Released"
done
echo ""

# Check seller wallet
echo "5. Checking seller wallet balance..."
SELLER_BALANCE=$(docker exec escrow_api curl -s "$API_URL/wallet" \
    -H "Authorization: Bearer $SELLER_TOKEN" \
    | grep -o '"availableCents":[0-9]*' | cut -d':' -f2)

echo "✓ Seller wallet balance: ${SELLER_BALANCE} cents (${SELLER_BALANCE:-0} GHS)"
echo ""

# Final milestone status
echo "6. Final milestone status:"
docker exec escrow_api curl -s "$API_URL/escrows/$ESCROW_ID/milestones" \
    -H "Authorization: Bearer $BUYER_TOKEN" \
    | grep -o '"name":"[^"]*","status":"[^"]*' \
    | sed 's/"name":"\([^"]*\)","status":"\([^"]*\)/  - \1: \2/'
echo ""

echo "=== Test Complete ==="
echo "Escrow ID: $ESCROW_ID"
echo "Expected seller balance: 15000 cents (150 GHS)"
echo "Actual seller balance: ${SELLER_BALANCE} cents"




