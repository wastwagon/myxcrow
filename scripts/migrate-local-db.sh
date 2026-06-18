#!/bin/bash
# Apply Prisma migrations against a local PostgreSQL instance.
# Uses DATABASE_URL from .env when set; otherwise tries common dev ports.

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT/services/api"

if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

try_migrate() {
  local url="$1"
  echo -e "${YELLOW}→ Trying ${url%%@*}@***${NC}"
  if (cd "$API_DIR" && DATABASE_URL="$url" pnpm exec prisma migrate deploy); then
    return 0
  fi
  return 1
}

echo "Generating Prisma client..."
(cd "$API_DIR" && pnpm exec prisma generate)

if [ -n "$DATABASE_URL" ]; then
  if try_migrate "$DATABASE_URL"; then
    echo -e "${GREEN}✅ Migrations applied using DATABASE_URL from .env${NC}"
    exit 0
  fi
  echo -e "${YELLOW}⚠️  DATABASE_URL from .env failed; trying fallbacks...${NC}"
fi

FALLBACKS=(
  "postgresql://postgres:postgres@localhost:5434/escrow"
  "postgresql://postgres:postgres@localhost:5444/escrow"
)

for url in "${FALLBACKS[@]}"; do
  if try_migrate "$url"; then
    echo -e "${GREEN}✅ Migrations applied${NC}"
    echo -e "${YELLOW}Tip: set DATABASE_URL=$url in .env to match your running database.${NC}"
    exit 0
  fi
done

echo -e "${RED}❌ Could not apply migrations.${NC}"
echo "Start Postgres (e.g. docker compose -f infra/docker/docker-compose.dev.yml up -d db)"
echo "or the registration stack (infra/docker/docker-compose.registration.yml on port 5444)."
exit 1
