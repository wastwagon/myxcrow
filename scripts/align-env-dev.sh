#!/bin/bash
# Restore local .env files to the main dev Docker stack (infra/docker/docker-compose.dev.yml)
# Web: http://localhost:3007  API: http://localhost:4000

set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

patch_file() {
  local f="$1"
  [ -f "$f" ] || return 0
  sed -i '' \
    -e 's|@localhost:5444/escrow|@localhost:5434/escrow|g' \
    -e 's|redis://localhost:6388|redis://localhost:6380|g' \
    -e 's|http://localhost:9013|http://localhost:9003|g' \
    -e 's|http://localhost:9014|http://localhost:9004|g' \
    -e 's|EMAIL_PORT=1036|EMAIL_PORT=1026|g' \
    -e 's|http://localhost:4010/api|http://localhost:4000/api|g' \
    -e 's|http://localhost:3017|http://localhost:3007|g' \
    -e 's|http://localhost:8036|http://localhost:8026|g' \
    "$f"
  echo "  patched $f"
}

echo "Aligning env files for main dev stack (ports 5434/6380/4000/3007)..."
for f in "$ROOT/.env" "$ROOT/services/api/.env" "$ROOT/apps/web/.env.local"; do
  patch_file "$f"
done

echo ""
echo "Done. Start stack:"
echo "  docker compose -f infra/docker/docker-compose.dev.yml up -d"
