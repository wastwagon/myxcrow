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
  
  # Install only production dependencies first (saves memory)
  pnpm install --no-frozen-lockfile --prod
  
  # Then install only the build tools we need (TypeScript and NestJS CLI are already in dependencies)
  # Skip test dependencies to save memory
  pnpm add -D typescript@^5.4.0 @nestjs/cli@^10.0.0 --no-save || true
  
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

