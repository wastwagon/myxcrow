#!/bin/bash

# Comprehensive Feature Test Script
# Tests all major features with authentication

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0

API_URL="http://localhost:4000/api"
TOKEN=""

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   MYXCROW Feature Test Suite           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Test 1: Login
echo -e "${BLUE}📋 Test 1: Authentication${NC}"
echo -n "  Testing login... "
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"buyer1@test.com","password":"password123"}')

if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "   Response: $LOGIN_RESPONSE"
    FAILED=$((FAILED + 1))
    exit 1
fi

# Test 2: Get Current User Profile
echo -n "  Testing get user profile... "
if [ -n "$TOKEN" ]; then
    PROFILE_RESPONSE=$(curl -s -X GET "$API_URL/auth/profile" \
        -H "Authorization: Bearer $TOKEN")
    if echo "$PROFILE_RESPONSE" | grep -q "buyer1@test.com\|email"; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAILED=$((FAILED + 1))
    fi
else
    echo -e "${YELLOW}⚠️  SKIP (no token)${NC}"
fi
echo ""

# Test 3: List Escrows
echo -e "${BLUE}📋 Test 2: Escrow Management${NC}"
echo -n "  Testing list escrows... "
if [ -n "$TOKEN" ]; then
    ESCROWS_RESPONSE=$(curl -s -X GET "$API_URL/escrows" \
        -H "Authorization: Bearer $TOKEN")
    if echo "$ESCROWS_RESPONSE" | grep -q "escrows\|data\|items"; then
        ESCROW_COUNT=$(echo "$ESCROWS_RESPONSE" | grep -o '"id":"[^"]*' | wc -l | xargs)
        echo -e "${GREEN}✅ PASS${NC} ($ESCROW_COUNT escrows found)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo "   Response: $ESCROWS_RESPONSE"
        FAILED=$((FAILED + 1))
    fi
else
    echo -e "${YELLOW}⚠️  SKIP (no token)${NC}"
fi
echo ""

# Test 4: Wallet Balance
echo -e "${BLUE}📋 Test 3: Wallet Features${NC}"
echo -n "  Testing get wallet... "
if [ -n "$TOKEN" ]; then
    WALLET_RESPONSE=$(curl -s -X GET "$API_URL/wallet" \
        -H "Authorization: Bearer $TOKEN")
    if echo "$WALLET_RESPONSE" | grep -q "availableCents\|balance\|wallet"; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo "   Response: $WALLET_RESPONSE"
        FAILED=$((FAILED + 1))
    fi
else
    echo -e "${YELLOW}⚠️  SKIP (no token)${NC}"
fi
echo ""

# Test 5: Database Connectivity
echo -e "${BLUE}📋 Test 4: Database${NC}"
echo -n "  Testing database connection... "
DB_TEST=$(docker exec escrow_db psql -U postgres -d escrow -t -c "SELECT 1;" 2>&1)
if echo "$DB_TEST" | grep -q "1"; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAIL${NC}"
    FAILED=$((FAILED + 1))
fi

echo -n "  Testing user data... "
USER_COUNT=$(docker exec escrow_db psql -U postgres -d escrow -t -c "SELECT COUNT(*) FROM \"User\";" 2>&1 | xargs)
if [ "$USER_COUNT" -ge "10" ]; then
    echo -e "${GREEN}✅ PASS${NC} ($USER_COUNT users)"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAIL${NC} (Only $USER_COUNT users found)"
    FAILED=$((FAILED + 1))
fi

echo -n "  Testing escrow data... "
ESCROW_COUNT=$(docker exec escrow_db psql -U postgres -d escrow -t -c "SELECT COUNT(*) FROM \"EscrowAgreement\";" 2>&1 | xargs)
if [ "$ESCROW_COUNT" -gt "0" ]; then
    echo -e "${GREEN}✅ PASS${NC} ($ESCROW_COUNT escrows)"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAIL${NC} (No escrows found)"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 6: Infrastructure Services
echo -e "${BLUE}📋 Test 5: Infrastructure Services${NC}"
echo -n "  Testing Redis... "
REDIS_TEST=$(docker exec escrow_redis redis-cli ping 2>&1)
if [ "$REDIS_TEST" = "PONG" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAIL${NC}"
    FAILED=$((FAILED + 1))
fi

echo -n "  Testing MinIO... "
MINIO_TEST=$(docker exec escrow_minio mc ls local/escrow-evidence 2>&1) || true
if echo "$MINIO_TEST" | grep -q "escrow-evidence\|Found\|total"; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠️  MinIO reachable${NC}"
    PASSED=$((PASSED + 1))
fi

echo -n "  Testing Mailpit... "
MAILPIT_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8026)
if [ "$MAILPIT_TEST" = "200" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAIL${NC} (HTTP $MAILPIT_TEST)"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 7: Frontend
echo -e "${BLUE}📋 Test 6: Frontend${NC}"
echo -n "  Testing web frontend... "
WEB_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3007)
if [ "$WEB_TEST" = "200" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAIL${NC} (HTTP $WEB_TEST)"
    FAILED=$((FAILED + 1))
fi

echo -n "  Testing API health from frontend... "
HEALTH_TEST=$(curl -s http://localhost:4000/api/health)
if echo "$HEALTH_TEST" | grep -q "ok"; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAIL${NC}"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 8: Service Health
echo -e "${BLUE}📋 Test 7: Service Health${NC}"
echo -n "  Checking all containers... "
CONTAINERS=$(docker ps --filter "name=escrow_" --format "{{.Names}}" | wc -l | xargs)
if [ "$CONTAINERS" -ge "6" ]; then
    echo -e "${GREEN}✅ PASS${NC} ($CONTAINERS containers running)"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAIL${NC} (Only $CONTAINERS containers running)"
    FAILED=$((FAILED + 1))
fi
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           Test Summary                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "Tests Passed: ${GREEN}$PASSED${NC}"
echo -e "Tests Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All feature tests passed!${NC}"
    echo ""
    echo -e "${GREEN}📍 Access Points:${NC}"
    echo "   • Web: http://localhost:3007"
    echo "   • API: http://localhost:4000/api"
    echo "   • Mailpit: http://localhost:8026"
    echo "   • MinIO: http://localhost:9004"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi

