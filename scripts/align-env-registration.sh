#!/bin/bash
# Point local .env files at the registration Docker stack (infra/docker/docker-compose.registration.yml)
# Web: http://localhost:3017  API: http://localhost:4010

set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

patch_file() {
  local f="$1"
  [ -f "$f" ] || return 0
  sed -i '' \
    -e 's|@localhost:5434/escrow|@localhost:5444/escrow|g' \
    -e 's|redis://localhost:6380|redis://localhost:6388|g' \
    -e 's|http://localhost:9003|http://localhost:9013|g' \
    -e 's|http://localhost:9004|http://localhost:9014|g' \
    -e 's|EMAIL_PORT=1026|EMAIL_PORT=1036|g' \
    -e 's|http://localhost:4000/api|http://localhost:4010/api|g' \
    -e 's|http://localhost:3007|http://localhost:3017|g' \
    -e 's|http://localhost:8026|http://localhost:8036|g' \
    "$f"
  echo "  patched $f"
}

echo "Aligning env files for registration stack (ports 5444/6388/4010/3017)..."
for f in "$ROOT/.env" "$ROOT/services/api/.env" "$ROOT/apps/web/.env.local"; do
  patch_file "$f"
done

echo ""
echo "Done. Start stack:"
echo "  docker compose -f infra/docker/docker-compose.registration.yml up -d"
echo ""
echo "URLs:"
echo "  Web:     http://localhost:3017"
echo "  API:     http://localhost:4010/api"
echo "  Mailpit: http://localhost:8036"
