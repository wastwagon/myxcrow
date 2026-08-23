#!/bin/bash
# Seed database via registration API container or local API directory

set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if docker ps --format '{{.Names}}' | grep -q '^myxcrow_reg_api$'; then
  echo "🌱 Seeding via myxcrow_reg_api container..."
  docker exec myxcrow_reg_api sh -c 'cd /usr/src/monorepo/services/api && pnpm seed'
elif docker ps --format '{{.Names}}' | grep -q '^escrow_api$'; then
  echo "🌱 Seeding via escrow_api container..."
  docker exec escrow_api pnpm seed
else
  echo "🌱 Seeding locally (services/api)..."
  cd "$ROOT/services/api"
  if [ -f "$ROOT/.env" ]; then set -a; source "$ROOT/.env"; set +a; fi
  pnpm seed
fi

echo ""
echo "✅ Database seeded"
echo "   buyer1@test.com / seller1@test.com — password: password123"
