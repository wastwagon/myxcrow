#!/bin/bash

# Comprehensive Test Script for MYXCROW Platform
# Tests all Phase 1, 2, and 3 features

set -e

echo "🧪 MYXCROW Platform - Comprehensive Feature Test"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0
SKIPPED=0

# API base URL
API_URL="${API_URL:-http://localhost:4001/api}"

# Test result function
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        ((FAILED++))
    fi
}

skip_test() {
    echo -e "${YELLOW}⏭️  SKIP${NC}: $1"
    ((SKIPPED++))
}

echo -e "${BLUE}📋 Phase 1: Security Features${NC}"
echo "-----------------------------------"

# Test 1: Health Endpoints
echo ""
echo "Testing Health Endpoints..."
if curl -s -f "${API_URL}/health" > /dev/null 2>&1; then
    test_result 0 "Health endpoint (/health)"
else
    test_result 1 "Health endpoint (/health)"
fi

if curl -s -f "${API_URL}/health/readiness" > /dev/null 2>&1; then
    test_result 0 "Readiness endpoint (/health/readiness)"
else
    test_result 1 "Readiness endpoint (/health/readiness)"
fi

if curl -s -f "${API_URL}/health/liveness" > /dev/null 2>&1; then
    test_result 0 "Liveness endpoint (/health/liveness)"
else
    test_result 1 "Liveness endpoint (/health/liveness)"
fi

# Test 2: Request ID Middleware
echo ""
echo "Testing Request ID Tracking..."
RESPONSE=$(curl -s -i "${API_URL}/health" 2>/dev/null | grep -i "x-request-id" || echo "")
if [ -n "$RESPONSE" ]; then
    test_result 0 "Request ID header present"
else
    test_result 1 "Request ID header present"
fi

echo ""
echo -e "${BLUE}📋 Phase 2: Operational Features${NC}"
echo "-----------------------------------"

# Test 3: Queue System (check if BullMQ is configured)
echo ""
echo "Testing Queue System..."
if [ -f "services/api/src/common/queue/queue.service.ts" ]; then
    test_result 0 "Queue service exists"
else
    test_result 1 "Queue service exists"
fi

if [ -f "services/api/src/common/queue/processors/email.processor.ts" ]; then
    test_result 0 "Email processor exists"
else
    test_result 1 "Email processor exists"
fi

if [ -f "services/api/src/common/queue/processors/webhook.processor.ts" ]; then
    test_result 0 "Webhook processor exists"
else
    test_result 1 "Webhook processor exists"
fi

if [ -f "services/api/src/common/queue/processors/cleanup.processor.ts" ]; then
    test_result 0 "Cleanup processor exists"
else
    test_result 1 "Cleanup processor exists"
fi

# Test 4: Antivirus Service
echo ""
echo "Testing Antivirus Service..."
if [ -f "services/api/src/common/security/antivirus.service.ts" ]; then
    test_result 0 "Antivirus service exists"
else
    test_result 1 "Antivirus service exists"
fi

# Test 5: Data Retention Cleanup
echo ""
echo "Testing Data Retention Cleanup..."
if [ -f "services/api/src/modules/settings/cleanup-scheduler.service.ts" ]; then
    test_result 0 "Cleanup scheduler exists"
else
    test_result 1 "Cleanup scheduler exists"
fi

echo ""
echo -e "${BLUE}📋 Phase 3: Product Features${NC}"
echo "-----------------------------------"

# Test 6: Escrow Messaging
echo ""
echo "Testing Escrow Messaging..."
if [ -f "services/api/src/modules/escrow/escrow-message.service.ts" ]; then
    test_result 0 "Escrow message service exists"
else
    test_result 1 "Escrow message service exists"
fi

if [ -f "apps/web/components/EscrowMessaging.tsx" ]; then
    test_result 0 "Escrow messaging UI component exists"
else
    test_result 1 "Escrow messaging UI component exists"
fi

# Test 7: Enhanced Search
echo ""
echo "Testing Enhanced Search..."
if grep -q "search\|minAmount\|maxAmount\|counterpartyEmail\|startDate\|endDate" "services/api/src/modules/escrow/escrow.service.ts" 2>/dev/null; then
    test_result 0 "Enhanced search filters in escrow service"
else
    test_result 1 "Enhanced search filters in escrow service"
fi

# Test 8: CSV Export
echo ""
echo "Testing CSV Export..."
if [ -f "services/api/src/modules/escrow/escrow-export.service.ts" ]; then
    test_result 0 "CSV export service exists"
else
    test_result 1 "CSV export service exists"
fi

# Test 9: Reconciliation Dashboard
echo ""
echo "Testing Reconciliation Dashboard..."
if [ -f "services/api/src/modules/admin/reconciliation.service.ts" ]; then
    test_result 0 "Reconciliation service exists"
else
    test_result 1 "Reconciliation service exists"
fi

if [ -f "apps/web/pages/admin/reconciliation.tsx" ]; then
    test_result 0 "Reconciliation dashboard UI exists"
else
    test_result 1 "Reconciliation dashboard UI exists"
fi

# Test 10: SLA Timers
echo ""
echo "Testing SLA Timers..."
if [ -f "services/api/src/modules/disputes/disputes.service.ts" ]; then
    if grep -q "getSlaStatus" "services/api/src/modules/disputes/disputes.service.ts" 2>/dev/null; then
        test_result 0 "SLA status method in disputes service"
    else
        test_result 1 "SLA status method in disputes service"
    fi
else
    test_result 1 "Disputes service exists"
fi

if [ -f "apps/web/components/DisputeSLATimer.tsx" ]; then
    test_result 0 "SLA timer UI component exists"
else
    test_result 1 "SLA timer UI component exists"
fi

echo ""
echo -e "${BLUE}📋 Security Features${NC}"
echo "-----------------------------------"

# Test 11: PII Encryption
echo ""
echo "Testing PII Encryption..."
if [ -f "services/api/src/common/crypto/encryption.service.ts" ]; then
    test_result 0 "Encryption service exists"
else
    test_result 1 "Encryption service exists"
fi

# Test 12: PII Masking
echo ""
echo "Testing PII Masking..."
if [ -f "services/api/src/common/utils/pii-masker.ts" ]; then
    test_result 0 "PII masker utility exists"
else
    test_result 1 "PII masker utility exists"
fi

if [ -f "apps/web/lib/pii-masker.ts" ]; then
    test_result 0 "Frontend PII masker exists"
else
    test_result 1 "Frontend PII masker exists"
fi

# Test 13: Secrets Management
echo ""
echo "Testing Secrets Management..."
if [ -f "services/api/src/common/secrets/secrets.service.ts" ]; then
    test_result 0 "Secrets service exists"
else
    test_result 1 "Secrets service exists"
fi

# Test 14: CSRF Protection
echo ""
echo "Testing CSRF Protection..."
if [ -f "services/api/src/common/middleware/csrf.middleware.ts" ]; then
    test_result 0 "CSRF middleware exists"
else
    test_result 1 "CSRF middleware exists"
fi

echo ""
echo -e "${BLUE}📋 File Structure Verification${NC}"
echo "-----------------------------------"

# Test 15: Module Structure
echo ""
echo "Testing Module Structure..."
if [ -f "services/api/src/common/queue/queue.module.ts" ]; then
    test_result 0 "Queue module exists"
else
    test_result 1 "Queue module exists"
fi

if [ -f "services/api/src/common/security/security.module.ts" ]; then
    test_result 0 "Security module exists"
else
    test_result 1 "Security module exists"
fi

if [ -f "services/api/src/modules/admin/admin.module.ts" ]; then
    test_result 0 "Admin module exists"
else
    test_result 1 "Admin module exists"
fi

echo ""
echo "================================================"
echo -e "${BLUE}📊 Test Summary${NC}"
echo "================================================"
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${RED}Failed:${NC} $FAILED"
echo -e "${YELLOW}Skipped:${NC} $SKIPPED"
echo ""

TOTAL=$((PASSED + FAILED + SKIPPED))
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please review the errors above.${NC}"
    exit 1
fi
