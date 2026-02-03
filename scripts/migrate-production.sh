#!/bin/bash

# Quick Production Migration Script
# Run with DATABASE_URL set (e.g. from Render Dashboard or locally)

set -e

echo "🚀 Running production database migrations..."

# Set database URL if provided as argument
if [ -n "$1" ]; then
    export DATABASE_URL="$1"
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not set!"
    echo ""
    echo "Usage:"
    echo "  ./scripts/migrate-production.sh 'postgresql://user:pass@host:port/db'"
    echo ""
    echo "Or set DATABASE_URL environment variable:"
    echo "  export DATABASE_URL='postgresql://user:pass@host:port/db'"
    echo "  ./scripts/migrate-production.sh"
    exit 1
fi

cd services/api

echo "📦 Generating Prisma Client..."
pnpm prisma generate

echo "🔄 Running migrations..."
pnpm prisma migrate deploy

echo "✅ Migrations complete!"
echo ""
echo "📊 Verifying database..."
TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
echo "   Found $TABLE_COUNT tables"

echo ""
echo "✅ Production database is ready!"

