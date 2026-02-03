#!/bin/bash

# Production Database Setup Script (use with DATABASE_URL from Render or other provider)
# This script sets up the production database with migrations and (optional) seed data.

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

echo -e "${BLUE}📋 Step 1: Setting up database connection...${NC}"
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL is not set!${NC}"
    echo ""
    echo "Set it in your environment (e.g. Render Dashboard or .env) and re-run:"
    echo "  export DATABASE_URL='postgresql://user:pass@host:5432/dbname'"
    exit 1
fi

echo "   DATABASE_URL is set (value hidden)"
echo ""

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
TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)

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
echo "   • Tables: $TABLE_COUNT"
echo ""

