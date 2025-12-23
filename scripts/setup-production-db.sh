#!/bin/bash

# Production Database Setup Script for Render
# This script sets up the production database with migrations and seed data

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Production Database Setup           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Database connection details (from Render)
DB_HOST="${DB_HOST:-dpg-d55a92ili9vc73cfddh0-a.oregon-postgres.render.com}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-escrow_o4vn}"
DB_USER="${DB_USER:-escrow_user}"
DB_PASSWORD="${DB_PASSWORD:-FXWHozYuaE3bZZjt0JEV9uXqSQfPUrN7}"

DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

echo -e "${BLUE}📋 Step 1: Setting up database connection...${NC}"
echo "   Host: $DB_HOST"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL is not set!${NC}"
    echo "Please set DATABASE_URL environment variable"
    exit 1
fi

export DATABASE_URL

echo -e "${BLUE}📋 Step 2: Running database migrations...${NC}"
cd services/api

# Generate Prisma Client
echo "   Generating Prisma Client..."
pnpm prisma generate

# Run migrations
echo "   Running migrations..."
pnpm prisma migrate deploy

echo -e "${GREEN}✅ Migrations completed${NC}"
echo ""

echo -e "${BLUE}📋 Step 3: Verifying database schema...${NC}"
# Check if tables exist
TABLE_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)

if [ "$TABLE_COUNT" -gt "0" ]; then
    echo -e "${GREEN}✅ Database schema verified ($TABLE_COUNT tables found)${NC}"
else
    echo -e "${YELLOW}⚠️  No tables found. Migrations may have failed.${NC}"
fi
echo ""

echo -e "${BLUE}📋 Step 4: Seeding database (optional)...${NC}"
read -p "Do you want to seed the database with test data? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "   Seeding database..."
    pnpm seed
    echo -e "${GREEN}✅ Database seeded${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping database seeding${NC}"
fi
echo ""

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Setup Complete! 🎉                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Database is ready for production${NC}"
echo ""
echo "📊 Database Info:"
echo "   • Host: $DB_HOST"
echo "   • Database: $DB_NAME"
echo "   • Tables: $TABLE_COUNT"
echo ""

