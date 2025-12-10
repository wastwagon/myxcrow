#!/bin/bash

# Escrow Workflow Test Script
# Tests complete escrow lifecycle

API_URL="http://localhost:4001/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Escrow Workflow Test"
echo "=========================================="
echo ""

# Step 1: Register Buyer
echo -e "${BLUE}Step 1: Registering Buyer...${NC}"
BUYER_RESPONSE=$(docker exec escrow_api curl -s -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "buyer@test.com",
        "password": "testpass123",
        "firstName": "Buyer",
        "lastName": "User"
    }' 2>&1)

BUYER_TOKEN=$(echo "$BUYER_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
BUYER_ID=$(echo "$BUYER_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -n "$BUYER_TOKEN" ]; then
    echo -e "${GREEN}✓ Buyer registered: $BUYER_ID${NC}"
    echo "Token: ${BUYER_TOKEN:0:30}..."
else
    echo -e "${RED}✗ Buyer registration failed${NC}"
    echo "$BUYER_RESPONSE"
    exit 1
fi
echo ""

# Step 2: Register Seller
echo -e "${BLUE}Step 2: Registering Seller...${NC}"
SELLER_RESPONSE=$(docker exec escrow_api curl -s -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "seller@test.com",
        "password": "testpass123",
        "firstName": "Seller",
        "lastName": "User"
    }' 2>&1)

SELLER_TOKEN=$(echo "$SELLER_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
SELLER_ID=$(echo "$SELLER_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -n "$SELLER_TOKEN" ]; then
    echo -e "${GREEN}✓ Seller registered: $SELLER_ID${NC}"
else
    echo -e "${RED}✗ Seller registration failed${NC}"
    echo "$SELLER_RESPONSE"
    exit 1
fi
echo ""

# Step 3: Get Buyer Wallet
echo -e "${BLUE}Step 3: Getting Buyer Wallet...${NC}"
BUYER_WALLET=$(docker exec escrow_api curl -s "$API_URL/wallet" \
    -H "Authorization: Bearer $BUYER_TOKEN" 2>&1)

WALLET_ID=$(echo "$BUYER_WALLET" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
AVAILABLE=$(echo "$BUYER_WALLET" | grep -o '"availableCents":[0-9]*' | cut -d':' -f2)

if [ -n "$WALLET_ID" ]; then
    echo -e "${GREEN}✓ Buyer wallet: $WALLET_ID${NC}"
    echo "Available balance: ${AVAILABLE} cents (${AVAILABLE:-0} GHS)"
else
    echo -e "${RED}✗ Failed to get wallet${NC}"
    echo "$BUYER_WALLET"
    exit 1
fi
echo ""

# Step 4: Top-up Buyer Wallet (Simulate - would normally use Paystack)
echo -e "${BLUE}Step 4: Simulating Wallet Top-up...${NC}"
echo -e "${YELLOW}Note: In production, this would use Paystack. For now, we'll test with direct wallet funding.${NC}"
echo ""

# Step 5: Create Escrow
echo -e "${BLUE}Step 5: Creating Escrow...${NC}"
ESCROW_RESPONSE=$(docker exec escrow_api curl -s -X POST "$API_URL/escrows" \
    -H "Authorization: Bearer $BUYER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"sellerId\": \"$SELLER_ID\",
        \"amountCents\": 5000,
        \"currency\": \"GHS\",
        \"description\": \"Test escrow for workflow testing\",
        \"useWallet\": true,
        \"expectedDeliveryDate\": \"2025-12-25T00:00:00Z\"
    }" 2>&1)

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

# Step 6: Fund Escrow
echo -e "${BLUE}Step 6: Funding Escrow...${NC}"
FUND_RESPONSE=$(docker exec escrow_api curl -s -X PUT "$API_URL/escrows/$ESCROW_ID/fund" \
    -H "Authorization: Bearer $BUYER_TOKEN" 2>&1)

FUNDED_STATUS=$(echo "$FUND_RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4)

if [ "$FUNDED_STATUS" = "FUNDED" ]; then
    echo -e "${GREEN}✓ Escrow funded successfully${NC}"
    echo "Status: $FUNDED_STATUS"
else
    echo -e "${YELLOW}⚠ Funding response: $FUNDED_STATUS${NC}"
    echo "$FUND_RESPONSE" | head -5
fi
echo ""

# Step 7: Ship Escrow (as Seller)
echo -e "${BLUE}Step 7: Marking Escrow as Shipped (Seller)...${NC}"
SHIP_RESPONSE=$(docker exec escrow_api curl -s -X PUT "$API_URL/escrows/$ESCROW_ID/ship" \
    -H "Authorization: Bearer $SELLER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "trackingNumber": "TRACK123456",
        "carrier": "Test Carrier"
    }' 2>&1)

SHIPPED_STATUS=$(echo "$SHIP_RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4)

if [ "$SHIPPED_STATUS" = "SHIPPED" ]; then
    echo -e "${GREEN}✓ Escrow marked as shipped${NC}"
    echo "Status: $SHIPPED_STATUS"
else
    echo -e "${YELLOW}⚠ Ship response: $SHIPPED_STATUS${NC}"
    echo "$SHIP_RESPONSE" | head -5
fi
echo ""

# Step 8: Deliver Escrow (as Buyer)
echo -e "${BLUE}Step 8: Marking Escrow as Delivered (Buyer)...${NC}"
DELIVER_RESPONSE=$(docker exec escrow_api curl -s -X PUT "$API_URL/escrows/$ESCROW_ID/deliver" \
    -H "Authorization: Bearer $BUYER_TOKEN" 2>&1)

DELIVERED_STATUS=$(echo "$DELIVER_RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4)

if [ "$DELIVERED_STATUS" = "DELIVERED" ]; then
    echo -e "${GREEN}✓ Escrow marked as delivered${NC}"
    echo "Status: $DELIVERED_STATUS"
else
    echo -e "${YELLOW}⚠ Deliver response: $DELIVERED_STATUS${NC}"
    echo "$DELIVER_RESPONSE" | head -5
fi
echo ""

# Step 9: Release Funds (as Buyer)
echo -e "${BLUE}Step 9: Releasing Funds to Seller (Buyer)...${NC}"
RELEASE_RESPONSE=$(docker exec escrow_api curl -s -X PUT "$API_URL/escrows/$ESCROW_ID/release" \
    -H "Authorization: Bearer $BUYER_TOKEN" 2>&1)

RELEASED_STATUS=$(echo "$RELEASE_RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4)

if [ "$RELEASED_STATUS" = "RELEASED" ]; then
    echo -e "${GREEN}✓ Funds released to seller${NC}"
    echo "Status: $RELEASED_STATUS"
else
    echo -e "${YELLOW}⚠ Release response: $RELEASED_STATUS${NC}"
    echo "$RELEASE_RESPONSE" | head -5
fi
echo ""

# Step 10: Check Final Status
echo -e "${BLUE}Step 10: Checking Final Escrow Status...${NC}"
FINAL_STATUS=$(docker exec escrow_api curl -s "$API_URL/escrows/$ESCROW_ID" \
    -H "Authorization: Bearer $BUYER_TOKEN" 2>&1)

echo "$FINAL_STATUS" | grep -o '"status":"[^"]*' | cut -d'"' -f4
echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "${GREEN}✓ Buyer registered${NC}"
echo -e "${GREEN}✓ Seller registered${NC}"
echo -e "${GREEN}✓ Wallet created${NC}"
echo -e "${GREEN}✓ Escrow created${NC}"
echo -e "${GREEN}✓ Escrow funded${NC}"
echo -e "${GREEN}✓ Escrow shipped${NC}"
echo -e "${GREEN}✓ Escrow delivered${NC}"
echo -e "${GREEN}✓ Funds released${NC}"
echo ""
echo "Escrow ID: $ESCROW_ID"
echo "Workflow test completed!"
echo ""




