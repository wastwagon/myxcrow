#!/usr/bin/env bash
# Concatenate all Prisma SQL migrations into a single full-schema.sql file
# for regulator submission. Migrations are applied in chronological order.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REG_DIR="$(dirname "$SCRIPT_DIR")"
MIGRATIONS_DIR="$REG_DIR/database-schema/migrations"
OUTPUT="$REG_DIR/database-schema/full-schema.sql"

{
  echo "-- MYXCROW Database Schema — Consolidated DDL"
  echo "-- Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "-- Source: services/api/prisma/migrations/ (applied in order)"
  echo "-- Database: PostgreSQL 15"
  echo "-- Tables: 30 | Enums: 13"
  echo "--"
  echo "-- NOTE: For production use, apply migrations individually via:"
  echo "--   cd services/api && pnpm prisma:deploy"
  echo ""
} > "$OUTPUT"

# Sort migration folders chronologically and append each migration.sql
for dir in $(ls -1 "$MIGRATIONS_DIR" | grep -E '^[0-9]' | sort); do
  migration_file="$MIGRATIONS_DIR/$dir/migration.sql"
  if [[ -f "$migration_file" ]]; then
    {
      echo ""
      echo "-- ============================================"
      echo "-- Migration: $dir"
      echo "-- ============================================"
      echo ""
      cat "$migration_file"
    } >> "$OUTPUT"
  fi
done

echo "Wrote consolidated schema to: $OUTPUT"
wc -l "$OUTPUT"
