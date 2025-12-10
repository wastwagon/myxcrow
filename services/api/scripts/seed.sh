#!/bin/bash
# Seed script wrapper for creating test users and transactions

echo "🌱 Starting seed script..."
echo ""

# Check if ts-node is available, otherwise use tsx
if command -v tsx &> /dev/null; then
  echo "Using tsx to run TypeScript..."
  tsx scripts/seed-users-and-transactions.ts
elif command -v ts-node &> /dev/null; then
  echo "Using ts-node to run TypeScript..."
  ts-node scripts/seed-users-and-transactions.ts
else
  echo "❌ Error: Neither tsx nor ts-node found. Please install one:"
  echo "   npm install -g tsx"
  echo "   or"
  echo "   npm install -g ts-node typescript"
  exit 1
fi




