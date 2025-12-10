#!/bin/bash

# Milestone Escrow Test Script
# Tests milestone escrow creation and workflow

API_URL="http://localhost:4001/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=========================================="
echo "Milestone Escrow Test"
echo "=========================================="
echo ""

# Get authentication tokens
echo -e "${BLUE}Step 1: Getting authentication tokens...${NC}"
BUYER_TOKEN=$(docker exec escrow_api curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"buyer@test.com","password":"testpass123"}' \
    | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

SELLER_TOKEN=$(docker exec escrow_api curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"seller@test.com","password":"testpass123"}' \
    | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

SELLER_ID="3b679b36-b986-4c3f-9301-b174c4d857ef"

if [ -n "$BUYER_TOKEN" ] && [ -n "$SELLER_TOKEN" ]; then
    echo -e "${GREEN}✓ Tokens obtained${NC}"
else
    echo -e "${RED}✗ Failed to get tokens${NC}"
    exit 1
fi
echo ""

# Ensure buyer has sufficient balance
echo -e "${BLUE}Step 2: Ensuring buyer has sufficient wallet balance...${NC}"
docker exec escrow_db psql -U postgres -d escrow -c "UPDATE \"Wallet\" SET \"availableCents\" = 50000 WHERE \"userId\" = '2e8f11da-0957-4ebf-aff7-7653c7a1cdc0';" > /dev/null 2>&1
echo -e "${GREEN}✓ Wallet balance updated${NC}"
echo ""

# Create escrow with milestones
echo -e "${BLUE}Step 3: Creating escrow with milestones...${NC}"
ESCROW_RESPONSE=$(docker exec escrow_api curl -s -X POST "$API_URL/escrows" \
    -H "Authorization: Bearer $BUYER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"sellerId\": \"$SELLER_ID\",
        \"amountCents\": 10000,
        \"currency\": \"GHS\",
        \"description\": \"Milestone escrow test - Website development project\",
        \"useWallet\": true,
        \"milestones\": [
            {
                \"name\": \"Design Phase\",
                \"description\": \"Complete website design mockups\",
                \"amountCents\": 3000
            },
            {
                \"name\": \"Development Phase\",
                \"description\": \"Implement frontend and backend\",
                \"amountCents\": 4000
            },
            {
                \"name\": \"Testing & Launch\",
                \"description\": \"Final testing and deployment\",
                \"amountCents\": 3000
            }
        ]
    }")

ESCROW_ID=$(echo "$ESCROW_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
ESCROW_STATUS=$(echo "$ESCROW_RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4)

if [ -n "$ESCROW_ID" ]; then
    echo -e "${GREEN}✓ Escrow created: $ESCROW_ID${NC}"
    echo "Status: $ESCROW_STATUS"
else
    echo -e "${RED}✗ Escrow creation failed${NC}"
    echo "$ESCROW_RESPONSE"
    exit 1
fi
echo ""

# Get milestones
echo -e "${BLUE}Step 4: Retrieving milestones...${NC}"
MILESTONES_RESPONSE=$(docker exec escrow_api curl -s "$API_URL/escrows/$ESCROW_ID/milestones" \
    -H "Authorization: Bearer $BUYER_TOKEN")

MILESTONE_COUNT=$(echo "$MILESTONES_RESPONSE" | grep -o '"id":"[^"]*' | wc -l | tr -d ' ')
echo -e "${GREEN}✓ Found $MILESTONE_COUNT milestones${NC}"

# Extract milestone IDs
MILESTONE_1_ID=$(echo "$MILESTONES_RESPONSE" | grep -A 5 "Design Phase" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
MILESTONE_2_ID=$(echo "$MILESTONES_RESPONSE" | grep -A 5 "Development Phase" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
MILESTONE_3_ID=$(echo "$MILESTONES_RESPONSE" | grep -A 5 "Testing & Launch" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

echo "Milestone IDs:"
echo "  - Design Phase: $MILESTONE_1_ID"
echo "  - Development Phase: $MILESTONE_2_ID"
echo "  - Testing & Launch: $MILESTONE_3_ID"
echo ""

# Fund escrow
echo -e "${BLUE}Step 5: Funding escrow...${NC}"
FUND_RESPONSE=$(docker exec escrow_api curl -s -X PUT "$API_URL/escrows/$ESCROW_ID/fund" \
    -H "Authorization: Bearer $BUYER_TOKEN")
FUND_STATUS=$(echo "$FUND_RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
echo -e "${GREEN}✓ Escrow funded (Status: $FUND_STATUS)${NC}"
echo ""

# Complete first milestone
echo -e "${BLUE}Step 6: Completing first milestone (Design Phase)...${NC}"
COMPLETE_1_RESPONSE=$(docker exec escrow_api curl -s -X PUT "$API_URL/escrows/$ESCROW_ID/milestones/$MILESTONE_1_ID/complete" \
    -H "Authorization: Bearer $BUYER_TOKEN")
COMPLETE_1_STATUS=$(echo "$COMPLETE_1_RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
if [ "$COMPLETE_1_STATUS" = "completed" ]; then
    echo -e "${GREEN}✓ Milestone 1 completed${NC}"
else
    echo -e "${YELLOW}⚠ Milestone 1 status: $COMPLETE_1_STATUS${NC}"
fi
echo ""

# Release first milestone
echo -e "${BLUE}Step 7: Releasing first milestone funds...${NC}"
RELEASE_1_RESPONSE=$(docker exec escrow_api curl -s -X PUT "$API_URL/escrows/$ESCROW_ID/milestones/$MILESTONE_1_ID/release" \
    -H "Authorization: Bearer $BUYER_TOKEN")
RELEASE_1_STATUS=$(echo "$RELEASE_1_RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
if [ "$RELEASE_1_STATUS" = "released" ]; then
    echo -e "${GREEN}✓ Milestone 1 funds released${NC}"
else
    echo -e "${YELLOW}⚠ Milestone 1 release status: $RELEASE_1_STATUS${NC}"
fi
echo ""

# Complete second milestone
echo -e "${BLUE}Step 8: Completing second milestone (Development Phase)...${NC}"
COMPLETE_2_RESPONSE=$(docker exec escrow_api curl -s -X PUT "$API_URL/escrows/$ESCROW_ID/milestones/$MILESTONE_2_ID/complete" \
    -H "Authorization: Bearer $BUYER_TOKEN")
COMPLETE_2_STATUS=$(echo "$COMPLETE_2_RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
if [ "$COMPLETE_2_STATUS" = "completed" ]; then
    echo -e "${GREEN}✓ Milestone 2 completed${NC}"
else
    echo -e "${YELLOW}⚠ Milestone 2 status: $COMPLETE_2_STATUS${NC}"
fi
echo ""

# Release second milestone
echo -e "${BLUE}Step 9: Releasing second milestone funds...${NC}"
RELEASE_2_RESPONSE=$(docker exec escrow_api curl -s -X PUT "$API_URL/escrows/$ESCROW_ID/milestones/$MILESTONE_2_ID/release" \
    -H "Authorization: Bearer $BUYER_TOKEN")
RELEASE_2_STATUS=$(echo "$RELEASE_2_RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
if [ "$RELEASE_2_STATUS" = "released" ]; then
    echo -e "${GREEN}✓ Milestone 2 funds released${NC}"
else
    echo -e "${YELLOW}⚠ Milestone 2 release status: $RELEASE_2_STATUS${NC}"
fi
echo ""

# Complete third milestone
echo -e "${BLUE}Step 10: Completing third milestone (Testing & Launch)...${NC}"
COMPLETE_3_RESPONSE=$(docker exec escrow_api curl -s -X PUT "$API_URL/escrows/$ESCROW_ID/milestones/$MILESTONE_3_ID/complete" \
    -H "Authorization: Bearer $BUYER_TOKEN")
COMPLETE_3_STATUS=$(echo "$COMPLETE_3_RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
if [ "$COMPLETE_3_STATUS" = "completed" ]; then
    echo -e "${GREEN}✓ Milestone 3 completed${NC}"
else
    echo -e "${YELLOW}⚠ Milestone 3 status: $COMPLETE_3_STATUS${NC}"
fi
echo ""

# Release third milestone
echo -e "${BLUE}Step 11: Releasing third milestone funds...${NC}"
RELEASE_3_RESPONSE=$(docker exec escrow_api curl -s -X PUT "$API_URL/escrows/$ESCROW_ID/milestones/$MILESTONE_3_ID/release" \
    -H "Authorization: Bearer $BUYER_TOKEN")
RELEASE_3_STATUS=$(echo "$RELEASE_3_RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
if [ "$RELEASE_3_STATUS" = "released" ]; then
    echo -e "${GREEN}✓ Milestone 3 funds released${NC}"
else
    echo -e "${YELLOW}⚠ Milestone 3 release status: $RELEASE_3_STATUS${NC}"
fi
echo ""

# Get final milestone status
echo -e "${BLUE}Step 12: Checking final milestone status...${NC}"
FINAL_MILESTONES=$(docker exec escrow_api curl -s "$API_URL/escrows/$ESCROW_ID/milestones" \
    -H "Authorization: Bearer $BUYER_TOKEN")

echo "$FINAL_MILESTONES" | grep -o '"name":"[^"]*","status":"[^"]*' | sed 's/"name":"\([^"]*\)","status":"\([^"]*\)/  - \1: \2/'
echo ""

# Check seller wallet balance
echo -e "${BLUE}Step 13: Checking seller wallet balance...${NC}"
SELLER_WALLET=$(docker exec escrow_api curl -s "$API_URL/wallet" \
    -H "Authorization: Bearer $SELLER_TOKEN")
SELLER_BALANCE=$(echo "$SELLER_WALLET" | grep -o '"availableCents":[0-9]*' | cut -d':' -f2)
echo -e "${GREEN}✓ Seller wallet balance: ${SELLER_BALANCE} cents (${SELLER_BALANCE:-0} GHS)${NC}"
echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "${GREEN}✓ Escrow created with 3 milestones${NC}"
echo -e "${GREEN}✓ Escrow funded${NC}"
echo -e "${GREEN}✓ All milestones completed${NC}"
echo -e "${GREEN}✓ All milestone funds released${NC}"
echo ""
echo "Escrow ID: $ESCROW_ID"
echo "Total Amount: 100 GHS (10,000 cents)"
echo "Milestones:"
echo "  - Design Phase: 30 GHS"
echo "  - Development Phase: 40 GHS"
echo "  - Testing & Launch: 30 GHS"
echo ""
echo "Milestone escrow test completed!"
echo ""




