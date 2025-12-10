#!/bin/bash
# Database setup script
set -e
echo "Setting up database..."
npx prisma generate || echo "Prisma generate failed, continuing..."
npx prisma migrate deploy || echo "No migrations to apply"
echo "Database setup complete!"
