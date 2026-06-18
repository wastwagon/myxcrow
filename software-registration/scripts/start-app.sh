#!/usr/bin/env bash
# Start MYXCROW on registration ports (avoids conflicts with other Docker projects)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/infra/docker/docker-compose.registration.yml"
WEB_URL="http://localhost:3017"
API_URL="http://localhost:4010/api"

cd "$REPO_ROOT"
[[ -f .env ]] || cp .env.example .env

open -a Docker 2>/dev/null || true
for i in $(seq 1 40); do
  docker info >/dev/null 2>&1 && break
  sleep 3
done
docker info >/dev/null 2>&1 || { echo "❌ Start Docker Desktop first"; exit 1; }

# Clean ghost mailpit from failed runs
docker rm -f a42d499fe4c6 escrow_mailpit a42d499fe4c6_escrow_mailpit 2>/dev/null || true

echo "Starting MYXCROW registration stack (ports 3017/4010)..."
docker compose -p myxcrow_reg -f "$COMPOSE_FILE" up -d --build

echo "Waiting for API at $API_URL/health ..."
for i in $(seq 1 60); do
  if curl -sf "$API_URL/health" >/dev/null 2>&1; then
    echo "✅ API ready"
    break
  fi
  sleep 5
done

echo "Waiting for Web at $WEB_URL ..."
for i in $(seq 1 30); do
  if curl -sf "$WEB_URL" >/dev/null 2>&1; then
    echo "✅ Web ready"
    break
  fi
  sleep 5
done

echo "Seeding database..."
docker exec myxcrow_reg_api pnpm seed 2>/dev/null || \
  docker exec myxcrow_reg_api npx tsx scripts/seed-users-and-transactions.ts 2>/dev/null || \
  echo "⚠️  Seed manually: docker exec myxcrow_reg_api pnpm seed"

echo ""
echo "✅ MYXCROW registration demo running:"
echo "   Web:  $WEB_URL"
echo "   API:  $API_URL/health"
echo "   Admin: admin@myxcrow.com / password123"
