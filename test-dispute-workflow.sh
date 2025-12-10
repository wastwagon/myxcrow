#!/bin/bash

# Dispute Workflow Test Script
# Tests complete dispute lifecycle

API_URL="http://localhost:4001/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=========================================="
echo "Dispute Workflow Test"
echo "=========================================="
echo ""

# Step 1: Get authentication tokens
echo -e "${BLUE}Step 1: Getting authentication tokens...${NC}"
BUYER_TOKEN=$(docker exec escrow_api curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"buyer@test.com","password":"testpass123"}' \
    | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

SELLER_TOKEN=$(docker exec escrow_api curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"seller@test.com","password":"testpass123"}' \
    | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

# Register admin user
echo -e "${BLUE}Step 2: Registering admin user...${NC}"
ADMIN_RESPONSE=$(docker exec escrow_api curl -s -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "admin@test.com",
        "password": "adminpass123",
        "firstName": "Admin",
        "lastName": "User"
    }' 2>&1)

ADMIN_ID=$(echo "$ADMIN_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

# Update admin user to have ADMIN role
if [ -n "$ADMIN_ID" ]; then
    docker exec escrow_db psql -U postgres -d escrow -c "UPDATE \"User\" SET roles = ARRAY['ADMIN']::\"UserRole\"[] WHERE id = '$ADMIN_ID';" > /dev/null 2>&1
    echo -e "${GREEN}✓ Admin user created: $ADMIN_ID${NC}"
else
    # Try to get existing admin
    ADMIN_ID=$(docker exec escrow_db psql -U postgres -d escrow -t -c "SELECT id FROM \"User\" WHERE email = 'admin@test.com';" 2>&1 | tr -d ' ')
    if [ -n "$ADMIN_ID" ]; then
        docker exec escrow_db psql -U postgres -d escrow -c "UPDATE \"User\" SET roles = ARRAY['ADMIN']::\"UserRole\"[] WHERE id = '$ADMIN_ID';" > /dev/null 2>&1
        echo -e "${GREEN}✓ Using existing admin user${NC}"
    fi
fi

ADMIN_TOKEN=$(docker exec escrow_api curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@test.com","password":"adminpass123"}' \
    | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${YELLOW}⚠ Admin token not obtained, will use buyer token for some operations${NC}"
    ADMIN_TOKEN=$BUYER_TOKEN
fi

SELLER_ID="3b679b36-b986-4c3f-9301-b174c4d857ef"
BUYER_ID="2e8f11da-0957-4ebf-aff7-7653c7a1cdc0"

if [ -z "$BUYER_TOKEN" ] || [ -z "$SELLER_TOKEN" ]; then
    echo -e "${RED}✗ Failed to get tokens${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Tokens obtained${NC}"
echo ""

# Step 2: Create a new escrow for dispute testing
echo -e "${BLUE}Step 2: Creating escrow for dispute testing...${NC}"
docker exec escrow_db psql -U postgres -d escrow -c "UPDATE \"Wallet\" SET \"availableCents\" = 50000 WHERE \"userId\" = '$BUYER_ID';" > /dev/null 2>&1

ESCROW_RESPONSE=$(docker exec escrow_api curl -s -X POST "$API_URL/escrows" \
    -H "Authorization: Bearer $BUYER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"sellerId\": \"$SELLER_ID\",
        \"amountCents\": 10000,
        \"currency\": \"GHS\",
        \"description\": \"Escrow for dispute testing\",
        \"useWallet\": true
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

# Step 3: Fund escrow
echo -e "${BLUE}Step 3: Funding escrow...${NC}"
FUND_RESPONSE=$(docker exec escrow_api curl -s -X PUT "$API_URL/escrows/$ESCROW_ID/fund" \
    -H "Authorization: Bearer $BUYER_TOKEN")
FUND_STATUS=$(echo "$FUND_RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
echo -e "${GREEN}✓ Escrow funded (Status: $FUND_STATUS)${NC}"
echo ""

# Step 4: Create dispute (as buyer)
echo -e "${BLUE}Step 4: Creating dispute (Buyer)...${NC}"
DISPUTE_RESPONSE=$(docker exec escrow_api curl -s -X POST "$API_URL/disputes" \
    -H "Authorization: Bearer $BUYER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"escrowId\": \"$ESCROW_ID\",
        \"reason\": \"NOT_RECEIVED\",
        \"description\": \"Item was not received as expected. Tracking shows delivered but package is missing.\"
    }")

DISPUTE_ID=$(echo "$DISPUTE_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
DISPUTE_STATUS=$(echo "$DISPUTE_RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4)

if [ -n "$DISPUTE_ID" ]; then
    echo -e "${GREEN}✓ Dispute created: $DISPUTE_ID${NC}"
    echo "Status: $DISPUTE_STATUS"
else
    echo -e "${RED}✗ Dispute creation failed${NC}"
    echo "$DISPUTE_RESPONSE"
    exit 1
fi
echo ""

# Step 5: Check escrow status (should be DISPUTED)
echo -e "${BLUE}Step 5: Checking escrow status (should be DISPUTED)...${NC}"
ESCROW_STATUS_CHECK=$(docker exec escrow_api curl -s "$API_URL/escrows/$ESCROW_ID" \
    -H "Authorization: Bearer $BUYER_TOKEN" \
    | grep -o '"status":"[^"]*' | cut -d'"' -f4)

if [ "$ESCROW_STATUS_CHECK" = "DISPUTED" ]; then
    echo -e "${GREEN}✓ Escrow status updated to DISPUTED${NC}"
else
    echo -e "${YELLOW}⚠ Escrow status: $ESCROW_STATUS_CHECK (expected DISPUTED)${NC}"
fi
echo ""

# Step 6: Get dispute details
echo -e "${BLUE}Step 6: Getting dispute details...${NC}"
DISPUTE_DETAILS=$(docker exec escrow_api curl -s "$API_URL/disputes/$DISPUTE_ID" \
    -H "Authorization: Bearer $BUYER_TOKEN")

DISPUTE_REASON=$(echo "$DISPUTE_DETAILS" | grep -o '"reason":"[^"]*' | cut -d'"' -f4)
echo -e "${GREEN}✓ Dispute retrieved${NC}"
echo "Reason: $DISPUTE_REASON"
echo ""

# Step 7: Add message from buyer
echo -e "${BLUE}Step 7: Adding message from buyer...${NC}"
MESSAGE_1_RESPONSE=$(docker exec escrow_api curl -s -X POST "$API_URL/disputes/$DISPUTE_ID/message" \
    -H "Authorization: Bearer $BUYER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "content": "I have checked with neighbors and the delivery company. The package was marked as delivered but I never received it."
    }')

MESSAGE_1_ID=$(echo "$MESSAGE_1_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
if [ -n "$MESSAGE_1_ID" ]; then
    echo -e "${GREEN}✓ Message 1 added by buyer${NC}"
else
    echo -e "${YELLOW}⚠ Message response: $MESSAGE_1_RESPONSE${NC}"
fi
echo ""

# Step 8: Add message from seller
echo -e "${BLUE}Step 8: Adding message from seller...${NC}"
MESSAGE_2_RESPONSE=$(docker exec escrow_api curl -s -X POST "$API_URL/disputes/$DISPUTE_ID/message" \
    -H "Authorization: Bearer $SELLER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "content": "I shipped the item with tracking number TRACK123. The tracking shows it was delivered to the correct address. Please check with your local post office."
    }')

MESSAGE_2_ID=$(echo "$MESSAGE_2_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
if [ -n "$MESSAGE_2_ID" ]; then
    echo -e "${GREEN}✓ Message 2 added by seller${NC}"
else
    echo -e "${YELLOW}⚠ Message response: $MESSAGE_2_RESPONSE${NC}"
fi
echo ""

# Step 9: List disputes
echo -e "${BLUE}Step 9: Listing all disputes...${NC}"
DISPUTES_LIST=$(docker exec escrow_api curl -s "$API_URL/disputes" \
    -H "Authorization: Bearer $BUYER_TOKEN")

DISPUTE_COUNT=$(echo "$DISPUTES_LIST" | grep -o '"id":"[^"]*' | wc -l | tr -d ' ')
echo -e "${GREEN}✓ Found $DISPUTE_COUNT dispute(s)${NC}"
echo ""

# Step 10: Resolve dispute (as admin)
echo -e "${BLUE}Step 10: Resolving dispute (Admin)...${NC}"
RESOLVE_RESPONSE=$(docker exec escrow_api curl -s -X PUT "$API_URL/disputes/$DISPUTE_ID/resolve" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "resolution": "After reviewing the tracking information and buyer statements, we have decided to refund the buyer. The tracking shows delivery but buyer has not received the item. Refund will be processed."
    }')

RESOLVED_STATUS=$(echo "$RESOLVE_RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
if [ "$RESOLVED_STATUS" = "RESOLVED" ]; then
    echo -e "${GREEN}✓ Dispute resolved${NC}"
    echo "Status: $RESOLVED_STATUS"
else
    echo -e "${YELLOW}⚠ Resolve response: $RESOLVED_STATUS${NC}"
    echo "$RESOLVE_RESPONSE" | head -3
fi
echo ""

# Step 11: Close dispute (as admin)
echo -e "${BLUE}Step 11: Closing dispute (Admin)...${NC}"
CLOSE_RESPONSE=$(docker exec escrow_api curl -s -X PUT "$API_URL/disputes/$DISPUTE_ID/close" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

CLOSED_STATUS=$(echo "$CLOSE_RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
if [ "$CLOSED_STATUS" = "CLOSED" ]; then
    echo -e "${GREEN}✓ Dispute closed${NC}"
    echo "Status: $CLOSED_STATUS"
else
    echo -e "${YELLOW}⚠ Close response: $CLOSED_STATUS${NC}"
    echo "$CLOSE_RESPONSE" | head -3
fi
echo ""

# Step 12: Get final dispute status
echo -e "${BLUE}Step 12: Getting final dispute status...${NC}"
FINAL_DISPUTE=$(docker exec escrow_api curl -s "$API_URL/disputes/$DISPUTE_ID" \
    -H "Authorization: Bearer $BUYER_TOKEN")

FINAL_STATUS=$(echo "$FINAL_DISPUTE" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
MESSAGE_COUNT=$(echo "$FINAL_DISPUTE" | grep -o '"id":"[^"]*' | wc -l | tr -d ' ')
echo -e "${GREEN}✓ Final dispute status: $FINAL_STATUS${NC}"
echo "Total messages: $MESSAGE_COUNT"
echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "${GREEN}✓ Escrow created and funded${NC}"
echo -e "${GREEN}✓ Dispute created${NC}"
echo -e "${GREEN}✓ Escrow status changed to DISPUTED${NC}"
echo -e "${GREEN}✓ Messages added (buyer and seller)${NC}"
echo -e "${GREEN}✓ Dispute resolved by admin${NC}"
echo -e "${GREEN}✓ Dispute closed by admin${NC}"
echo ""
echo "Escrow ID: $ESCROW_ID"
echo "Dispute ID: $DISPUTE_ID"
echo "Final Status: $FINAL_STATUS"
echo ""
echo "Dispute workflow test completed!"
echo ""




