#!/bin/bash

# Service health check script

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Checking service health..."
echo ""

# Check Docker
if ! docker ps >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

# Function to check service
check_service() {
    local name=$1
    local url=$2
    local expected=$3
    
    if curl -s "$url" | grep -q "$expected"; then
        echo -e "${GREEN}✅ $name${NC}"
        return 0
    else
        echo -e "${RED}❌ $name${NC}"
        return 1
    fi
}

# Check services
echo "Checking services..."
check_service "API Health" "http://localhost:4000/api/health" "ok" || true
check_service "Web Frontend" "http://localhost:3007" "" || true
check_service "Mailpit" "http://localhost:8026" "" || true
check_service "MinIO Console" "http://localhost:9004" "" || true

echo ""
echo "📊 Container Status:"
docker-compose -f infra/docker/docker-compose.dev.yml ps

