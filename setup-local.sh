#!/bin/bash

# MYXCROW Local Development Setup Script
# This script sets up and starts all Docker services for local development

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project directory (repo root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Ensure .env exists for Paystack and other config (Docker Compose loads it from here)
if [ ! -f .env ]; then
    echo -e "${YELLOW}📄 No .env found. Copying from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}   Edit .env and add your PAYSTACK_SECRET_KEY and PAYSTACK_PUBLIC_KEY for wallet top-up.${NC}"
    echo -e "${YELLOW}   See LOCAL_PAYSTACK_TESTING.md for details.${NC}"
    echo ""
fi

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   MYXCROW Local Development Setup     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -ti:"$1" >/dev/null 2>&1
}

# Function to free a port
free_port() {
    local port=$1
    if port_in_use "$port"; then
        echo -e "${YELLOW}⚠️  Port $port is in use, freeing it...${NC}"
        lsof -ti:"$port" | xargs kill -9 2>/dev/null || true
        sleep 2
        echo -e "${GREEN}✅ Port $port is now free${NC}"
    else
        echo -e "${GREEN}✅ Port $port is available${NC}"
    fi
}

# Step 1: Check Docker
echo -e "${BLUE}📋 Step 1: Checking Docker...${NC}"
if ! command_exists docker; then
    echo -e "${RED}❌ Docker is not installed!${NC}"
    echo "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    exit 1
fi

if ! docker ps >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker daemon is not running!${NC}"
    echo ""
    echo "Please:"
    echo "1. Open Docker Desktop"
    echo "2. Wait for it to fully start"
    echo "3. Run this script again"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Step 2: Check Docker Compose
echo -e "${BLUE}📋 Step 2: Checking Docker Compose...${NC}"
if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker Compose is not available!${NC}"
    exit 1
fi

# Use docker compose (v2) if available, otherwise docker-compose (v1)
if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi
echo -e "${GREEN}✅ Docker Compose is available${NC}"
echo ""

# Step 3: Check and free ports
echo -e "${BLUE}📋 Step 3: Checking ports...${NC}"
free_port 3007
free_port 4000
free_port 5434
free_port 6380
free_port 9003
free_port 9004
free_port 8026
echo ""

# Step 4: Stop existing containers
echo -e "${BLUE}📋 Step 4: Cleaning up existing containers...${NC}"
$COMPOSE_CMD -f infra/docker/docker-compose.dev.yml down 2>/dev/null || true
echo -e "${GREEN}✅ Cleaned up${NC}"
echo ""

# Step 5: Start infrastructure services
echo -e "${BLUE}📋 Step 5: Starting infrastructure services...${NC}"
echo "   Starting: PostgreSQL, Redis, MinIO, Mailpit..."
$COMPOSE_CMD -f infra/docker/docker-compose.dev.yml up -d db redis minio mailpit

echo -e "${YELLOW}⏳ Waiting for infrastructure services to be healthy...${NC}"
sleep 5

# Wait for services to be healthy
MAX_WAIT=60
WAIT_COUNT=0
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if docker exec escrow_db pg_isready -U postgres >/dev/null 2>&1 && \
       docker exec escrow_redis redis-cli ping >/dev/null 2>&1; then
        break
    fi
    WAIT_COUNT=$((WAIT_COUNT + 5))
    sleep 5
done

if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    echo -e "${RED}❌ Infrastructure services did not become healthy in time${NC}"
    echo "Check logs with: $COMPOSE_CMD -f infra/docker/docker-compose.dev.yml logs"
    exit 1
fi

echo -e "${GREEN}✅ Infrastructure services are healthy${NC}"
echo ""

# Step 6: Initialize MinIO bucket (if needed)
echo -e "${BLUE}📋 Step 6: Setting up MinIO bucket...${NC}"
sleep 5  # Give MinIO time to start
docker exec escrow_minio mc alias set local http://localhost:9000 minioadmin minioadmin 2>/dev/null || true
docker exec escrow_minio mc mb local/escrow-evidence 2>/dev/null || true
docker exec escrow_minio mc anonymous set download local/escrow-evidence 2>/dev/null || true
echo -e "${GREEN}✅ MinIO bucket ready${NC}"
echo ""

# Step 7: Start API service
echo -e "${BLUE}📋 Step 7: Starting API service...${NC}"
$COMPOSE_CMD -f infra/docker/docker-compose.dev.yml up -d api

echo -e "${YELLOW}⏳ Waiting for API service to start...${NC}"
sleep 10

# Wait for API to be ready
MAX_WAIT=120
WAIT_COUNT=0
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if curl -s http://localhost:4000/api/health >/dev/null 2>&1; then
        break
    fi
    WAIT_COUNT=$((WAIT_COUNT + 5))
    sleep 5
done

if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    echo -e "${YELLOW}⚠️  API service may still be starting...${NC}"
    echo "Check logs with: $COMPOSE_CMD -f infra/docker/docker-compose.dev.yml logs api"
else
    echo -e "${GREEN}✅ API service is ready${NC}"
fi
echo ""

# Step 8: Start Web service
echo -e "${BLUE}📋 Step 8: Starting Web service...${NC}"
$COMPOSE_CMD -f infra/docker/docker-compose.dev.yml up -d web

echo -e "${YELLOW}⏳ Waiting for Web service to start...${NC}"
sleep 10

# Wait for Web to be ready
MAX_WAIT=120
WAIT_COUNT=0
while [ $WAIT_COUNT -lt $MAX_WAIT ]; then
    if curl -s http://localhost:3007 >/dev/null 2>&1; then
        break
    fi
    WAIT_COUNT=$((WAIT_COUNT + 5))
    sleep 5
done

if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    echo -e "${YELLOW}⚠️  Web service may still be starting...${NC}"
    echo "Check logs with: $COMPOSE_CMD -f infra/docker/docker-compose.dev.yml logs web"
else
    echo -e "${GREEN}✅ Web service is ready${NC}"
fi
echo ""

# Step 9: Show service status
echo -e "${BLUE}📊 Step 9: Service Status${NC}"
echo "════════════════════════════════════════"
$COMPOSE_CMD -f infra/docker/docker-compose.dev.yml ps
echo ""

# Step 10: Test services
echo -e "${BLUE}📋 Step 10: Testing services...${NC}"
echo ""

# Test API
echo -n "Testing API health endpoint... "
if curl -s http://localhost:4000/api/health | grep -q "ok"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${YELLOW}⚠️  API may still be starting${NC}"
fi

# Test Web (mapped to 3007 on host)
echo -n "Testing Web frontend... "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3007 | grep -q "200"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${YELLOW}⚠️  Web may still be starting${NC}"
fi

echo ""

# Step 11: Display access information
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Setup Complete! 🎉              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📍 Access Points:${NC}"
echo "   • Web Frontend:    http://localhost:3007"
echo "   • API:             http://localhost:4000/api"
echo "   • API Health:      http://localhost:4000/api/health"
echo "   • Mailpit:         http://localhost:8026"
echo "   • MinIO Console:   http://localhost:9004"
echo "   • MinIO API:       http://localhost:9003"
echo ""
echo -e "${GREEN}🔑 Default Credentials:${NC}"
echo "   • MinIO:           minioadmin / minioadmin"
echo "   • Database:        postgres / postgres (port 5434)"
echo ""
echo -e "${GREEN}📝 Useful Commands:${NC}"
echo "   • View logs:       $COMPOSE_CMD -f infra/docker/docker-compose.dev.yml logs -f"
echo "   • Stop services:   $COMPOSE_CMD -f infra/docker/docker-compose.dev.yml down"
echo "   • Restart:         $COMPOSE_CMD -f infra/docker/docker-compose.dev.yml restart"
echo "   • Seed database:   ./scripts/db-seed.sh   (or: docker exec escrow_api pnpm seed)"
echo ""
echo -e "${YELLOW}💡 Wallet top-up: Add PAYSTACK_SECRET_KEY and PAYSTACK_PUBLIC_KEY to .env, then seed and test at http://localhost:3007 (see LOCAL_PAYSTACK_TESTING.md)${NC}"
echo ""

