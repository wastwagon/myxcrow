#!/usr/bin/env bash
# Build and export Docker images for pen drive submission.
# Requires Docker Desktop running. May take 10–20 minutes on first run.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
VERSION="${1:-1.0.0}"
OUT_DIR="$REPO_ROOT/software-registration/pen-drive-1/01-executable/docker-images"

echo "Building MYXCROW Docker images v${VERSION}..."
echo "Repo: $REPO_ROOT"

if ! docker info >/dev/null 2>&1; then
  echo "ERROR: Docker is not running. Start Docker Desktop and retry."
  exit 1
fi

mkdir -p "$OUT_DIR"

cd "$REPO_ROOT"

echo "→ Building API image..."
docker build -f services/api/Dockerfile.production -t "myxcrow-api:${VERSION}" .

echo "→ Building Web image..."
docker build -f apps/web/Dockerfile.production -t "myxcrow-web:${VERSION}" .

echo "→ Exporting API image..."
docker save "myxcrow-api:${VERSION}" -o "$OUT_DIR/myxcrow-api-${VERSION}.tar"

echo "→ Exporting Web image..."
docker save "myxcrow-web:${VERSION}" -o "$OUT_DIR/myxcrow-web-${VERSION}.tar"

# Copy compose + env example
cp "$REPO_ROOT/docker-compose.production.yml" "$REPO_ROOT/software-registration/pen-drive-1/01-executable/"

cat > "$REPO_ROOT/software-registration/pen-drive-1/01-executable/docker-images/LOAD_AND_RUN.txt" << EOF
MYXCROW Docker Images v${VERSION}

Load images:
  docker load -i myxcrow-api-${VERSION}.tar
  docker load -i myxcrow-web-${VERSION}.tar

Verify:
  docker images | grep myxcrow

Run (from 01-executable/):
  docker compose -f docker-compose.production.yml up -d

Note: PostgreSQL, Redis, and MinIO must be configured in docker-compose.production.yml
or run the dev stack via setup-local.sh instead.
EOF

echo ""
echo "Done. Images saved to: $OUT_DIR"
du -h "$OUT_DIR"/*.tar
