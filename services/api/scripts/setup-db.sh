#!/bin/bash
# Database setup script — generate client and apply migrations
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
exec "$ROOT/scripts/migrate-local-db.sh"
