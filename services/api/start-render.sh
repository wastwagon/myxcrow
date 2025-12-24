#!/bin/bash
set -e

cd services/api

# Run migrations
pnpm prisma migrate deploy

# Check if dist exists, if not rebuild
if [ -f dist/main.js ]; then
  echo "✅ dist/main.js found, starting..."
  node dist/main.js
else
  echo "❌ dist/main.js missing, rebuilding..."
  
  # Install only API workspace dependencies to save memory
  # TypeScript and @nestjs/cli are already in dependencies
  cd ../..
  NODE_OPTIONS="--max-old-space-size=400" pnpm install --no-frozen-lockfile --prod=false --filter=api
  cd services/api
  
  # Generate Prisma Client
  pnpm prisma:generate
  
  # Build with memory limit (stay within Render's 512MB)
  NODE_OPTIONS="--max-old-space-size=400" pnpm build
  
  # Verify build succeeded
  if [ ! -f dist/main.js ]; then
    echo "ERROR: Build failed - dist/main.js not found"
    exit 1
  fi
  
  echo "✅ Build successful, starting..."
  node dist/main.js
fi

