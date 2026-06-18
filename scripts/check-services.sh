#!/bin/bash
# Service health check — detects main dev stack (3007/4000) or registration stack (3017/4010)

set +e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Checking MYXCROW service health..."
echo ""

if ! docker ps >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

check_url() {
    local name=$1
    local url=$2
    local pattern=${3:-}
    if curl -sf "$url" >/dev/null 2>&1; then
        if [ -z "$pattern" ] || curl -sf "$url" | grep -q "$pattern"; then
            echo -e "${GREEN}✅ $name${NC} ($url)"
            return 0
        fi
    fi
    echo -e "${RED}❌ $name${NC} ($url)"
    return 1
}

MAIN_UP=0
REG_UP=0

check_url "API (main)" "http://localhost:4000/api/health" "ok" && MAIN_UP=1
check_url "Web (main)" "http://localhost:3007" "" && MAIN_UP=$((MAIN_UP + 1))
check_url "API (registration)" "http://localhost:4010/api/health" "ok" && REG_UP=1
check_url "Web (registration)" "http://localhost:3017" "" && REG_UP=$((REG_UP + 1))

echo ""
if [ "$REG_UP" -ge 1 ]; then
    echo -e "${YELLOW}Registration stack detected. Align env:${NC} ./scripts/align-env-registration.sh"
    check_url "Mailpit (reg)" "http://localhost:8036" ""
    check_url "MinIO (reg)" "http://localhost:9014" ""
fi

if [ "$MAIN_UP" -ge 1 ]; then
    echo -e "${YELLOW}Main dev stack detected. Align env:${NC} ./scripts/align-env-dev.sh"
    check_url "Mailpit (main)" "http://localhost:8026" ""
    check_url "MinIO (main)" "http://localhost:9004" ""
fi

echo ""
echo "📊 Registration containers:"
docker ps --filter name=myxcrow_reg --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null

echo ""
echo "📊 Main dev containers:"
docker compose -f infra/docker/docker-compose.dev.yml ps 2>/dev/null || true

echo ""
curl -sf 'http://localhost:4010/api/settings/fees/calculate?amountCents=10000' 2>/dev/null | head -c 200 && echo "" || true
curl -sf 'http://localhost:4000/api/settings/fees/calculate?amountCents=10000' 2>/dev/null | head -c 200 && echo "" || true
