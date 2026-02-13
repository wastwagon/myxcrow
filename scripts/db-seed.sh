#!/bin/bash

# Database seeding script for local development
# This script seeds the database with test users and transactions

set -e

echo "🌱 Seeding database with test data..."
echo ""

# Check if API container is running
if ! docker ps | grep -q escrow_api; then
    echo "❌ API container is not running!"
    echo "Please start services first: ./setup-local.sh"
    exit 1
fi

# Run seed script
echo "Running seed script..."
docker exec escrow_api pnpm seed

echo ""
echo "✅ Database seeded successfully!"
echo ""
echo "📝 Test Accounts:"
echo "   Admin: admin@myxcrow.com / password123"
echo "   Users: buyer1@test.com through buyer5@test.com (password: password123)"
echo "   Users: seller1@test.com through seller5@test.com (password: password123)"

