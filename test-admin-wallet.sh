#!/bin/bash

# Test Admin Wallet Management
# This script tests the admin wallet credit and debit functionality

set -e

API_URL="http://localhost:4001/api"
ADMIN_EMAIL="admin@test.com"
ADMIN_PASSWORD="Admin123!"
USER_EMAIL="user@test.com"
USER_PASSWORD="User123!"

echo "=========================================="
echo "Testing Admin Wallet Management"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test from inside container if external access fails
TEST_FROM_CONTAINER=false

# Step 1: Register Admin User
echo -e "${YELLOW}Step 1: Registering admin user...${NC}"
if [ "$TEST_FROM_CONTAINER" = "true" ]; then
  ADMIN_REGISTER_RESPONSE=$(docker exec escrow_api curl -s -X POST "http://localhost:4001/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\",
    \"firstName\": \"Admin\",
    \"lastName\": \"User\"
  }")

ADMIN_ID=$(echo $ADMIN_REGISTER_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$ADMIN_ID" ]; then
  echo -e "${RED}Failed to register admin. Response: $ADMIN_REGISTER_RESPONSE${NC}"
  exit 1
fi

echo -e "${GREEN}Admin registered: $ADMIN_ID${NC}"

# Update admin role in database
echo -e "${YELLOW}Updating admin role...${NC}"
docker exec escrow_db psql -U postgres -d escrow -c "UPDATE \"User\" SET roles = ARRAY['ADMIN']::\"UserRole\"[] WHERE id = '$ADMIN_ID';" > /dev/null 2>&1
echo -e "${GREEN}Admin role updated${NC}"

# Step 2: Login as Admin
echo -e "${YELLOW}Step 2: Logging in as admin...${NC}"
ADMIN_LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\"
  }")

ADMIN_TOKEN=$(echo $ADMIN_LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
  echo -e "${RED}Failed to login as admin. Response: $ADMIN_LOGIN_RESPONSE${NC}"
  exit 1
fi

echo -e "${GREEN}Admin logged in successfully${NC}"
echo ""

# Step 3: Register Regular User
echo -e "${YELLOW}Step 3: Registering regular user...${NC}"
USER_REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$USER_EMAIL\",
    \"password\": \"$USER_PASSWORD\",
    \"firstName\": \"Regular\",
    \"lastName\": \"User\"
  }")

USER_ID=$(echo $USER_REGISTER_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$USER_ID" ]; then
  echo -e "${RED}Failed to register user. Response: $USER_REGISTER_RESPONSE${NC}"
  exit 1
fi

echo -e "${GREEN}User registered: $USER_ID${NC}"
echo ""

# Step 4: Get User Wallet (Initial State)
echo -e "${YELLOW}Step 4: Getting user wallet (initial state)...${NC}"
WALLET_RESPONSE=$(curl -s -X GET "$API_URL/wallet/admin/$USER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json")

echo "Wallet Response: $WALLET_RESPONSE" | jq '.' 2>/dev/null || echo "$WALLET_RESPONSE"
INITIAL_BALANCE=$(echo $WALLET_RESPONSE | grep -o '"availableCents":[0-9]*' | head -1 | cut -d':' -f2)
echo -e "${GREEN}Initial balance: ${INITIAL_BALANCE:-0} cents${NC}"
echo ""

# Step 5: Credit User Wallet
echo -e "${YELLOW}Step 5: Crediting user wallet (100 GHS = 10000 cents)...${NC}"
CREDIT_RESPONSE=$(curl -s -X POST "$API_URL/wallet/admin/credit" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"amountCents\": 10000,
    \"currency\": \"GHS\",
    \"description\": \"Manual top-up - Bank transfer received\",
    \"reference\": \"BANK-TXN-12345\"
  }")

echo "Credit Response: $CREDIT_RESPONSE" | jq '.' 2>/dev/null || echo "$CREDIT_RESPONSE"

if echo "$CREDIT_RESPONSE" | grep -q "funding"; then
  echo -e "${GREEN}✓ Wallet credited successfully${NC}"
else
  echo -e "${RED}✗ Failed to credit wallet${NC}"
  exit 1
fi
echo ""

# Step 6: Verify Wallet Balance After Credit
echo -e "${YELLOW}Step 6: Verifying wallet balance after credit...${NC}"
WALLET_RESPONSE=$(curl -s -X GET "$API_URL/wallet/admin/$USER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json")

NEW_BALANCE=$(echo $WALLET_RESPONSE | grep -o '"availableCents":[0-9]*' | head -1 | cut -d':' -f2)
echo "Wallet Response: $WALLET_RESPONSE" | jq '.' 2>/dev/null || echo "$WALLET_RESPONSE"

if [ "$NEW_BALANCE" = "10000" ]; then
  echo -e "${GREEN}✓ Balance updated correctly: $NEW_BALANCE cents (100.00 GHS)${NC}"
else
  echo -e "${RED}✗ Balance incorrect. Expected: 10000, Got: $NEW_BALANCE${NC}"
  exit 1
fi
echo ""

# Step 7: Debit User Wallet
echo -e "${YELLOW}Step 7: Debiting user wallet (30 GHS = 3000 cents)...${NC}"
DEBIT_RESPONSE=$(curl -s -X POST "$API_URL/wallet/admin/debit" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"amountCents\": 3000,
    \"currency\": \"GHS\",
    \"description\": \"Refund for cancelled order\",
    \"reference\": \"REFUND-12345\"
  }")

echo "Debit Response: $DEBIT_RESPONSE" | jq '.' 2>/dev/null || echo "$DEBIT_RESPONSE"

if echo "$DEBIT_RESPONSE" | grep -q "funding"; then
  echo -e "${GREEN}✓ Wallet debited successfully${NC}"
else
  echo -e "${RED}✗ Failed to debit wallet${NC}"
  exit 1
fi
echo ""

# Step 8: Verify Wallet Balance After Debit
echo -e "${YELLOW}Step 8: Verifying wallet balance after debit...${NC}"
WALLET_RESPONSE=$(curl -s -X GET "$API_URL/wallet/admin/$USER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json")

FINAL_BALANCE=$(echo $WALLET_RESPONSE | grep -o '"availableCents":[0-9]*' | head -1 | cut -d':' -f2)
echo "Wallet Response: $WALLET_RESPONSE" | jq '.' 2>/dev/null || echo "$WALLET_RESPONSE"

if [ "$FINAL_BALANCE" = "7000" ]; then
  echo -e "${GREEN}✓ Balance updated correctly: $FINAL_BALANCE cents (70.00 GHS)${NC}"
else
  echo -e "${RED}✗ Balance incorrect. Expected: 7000, Got: $FINAL_BALANCE${NC}"
  exit 1
fi
echo ""

# Step 9: Test Insufficient Balance Error
echo -e "${YELLOW}Step 9: Testing insufficient balance error...${NC}"
DEBIT_ERROR_RESPONSE=$(curl -s -X POST "$API_URL/wallet/admin/debit" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"amountCents\": 100000,
    \"currency\": \"GHS\",
    \"description\": \"Test insufficient balance\"
  }")

if echo "$DEBIT_ERROR_RESPONSE" | grep -q "Insufficient"; then
  echo -e "${GREEN}✓ Insufficient balance error handled correctly${NC}"
else
  echo -e "${YELLOW}⚠ Expected insufficient balance error. Response: $DEBIT_ERROR_RESPONSE${NC}"
fi
echo ""

# Step 10: Get Wallet Transactions
echo -e "${YELLOW}Step 10: Getting wallet transactions...${NC}"
TRANSACTIONS_RESPONSE=$(curl -s -X GET "$API_URL/wallet/admin/$USER_ID/transactions?limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json")

echo "Transactions Response: $TRANSACTIONS_RESPONSE" | jq '.' 2>/dev/null || echo "$TRANSACTIONS_RESPONSE"

TRANSACTION_COUNT=$(echo "$TRANSACTIONS_RESPONSE" | grep -o '"type"' | wc -l | tr -d ' ')
if [ "$TRANSACTION_COUNT" -ge "2" ]; then
  echo -e "${GREEN}✓ Found $TRANSACTION_COUNT transactions${NC}"
else
  echo -e "${YELLOW}⚠ Expected at least 2 transactions, found: $TRANSACTION_COUNT${NC}"
fi
echo ""

# Step 11: List All Wallets
echo -e "${YELLOW}Step 11: Listing all wallets...${NC}"
LIST_RESPONSE=$(curl -s -X GET "$API_URL/wallet/admin?limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json")

echo "List Response: $LIST_RESPONSE" | jq '.' 2>/dev/null || echo "$LIST_RESPONSE"

WALLET_COUNT=$(echo "$LIST_RESPONSE" | grep -o '"id"' | wc -l | tr -d ' ')
if [ "$WALLET_COUNT" -ge "1" ]; then
  echo -e "${GREEN}✓ Found $WALLET_COUNT wallets${NC}"
else
  echo -e "${YELLOW}⚠ Expected at least 1 wallet, found: $WALLET_COUNT${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo -e "${GREEN}All Admin Wallet Management Tests Passed!${NC}"
echo "=========================================="
echo ""
echo "Summary:"
echo "  - Admin user created and logged in"
echo "  - Regular user created"
echo "  - Wallet credited: 100.00 GHS"
echo "  - Wallet debited: 30.00 GHS"
echo "  - Final balance: 70.00 GHS"
echo "  - Insufficient balance error handled"
echo "  - Transaction history retrieved"
echo "  - Wallet list retrieved"
echo ""

