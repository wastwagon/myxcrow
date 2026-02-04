#!/bin/bash
set -e

echo "===> Starting Render build script"
echo "Current directory: $(pwd)"

echo "===> Installing workspace dependencies from root..."
cd ../..
pnpm install --no-frozen-lockfile

echo "===> Building API service..."
cd services/api
pnpm build

echo "===> Checking build output..."
if [ -d "dist" ]; then
  echo "✓ dist directory exists"
  ls -lah dist/
  if [ -f "dist/main.js" ]; then
    echo "✓ dist/main.js exists"
  else
    echo "✗ ERROR: dist/main.js not found!"
    exit 1
  fi
else
  echo "✗ ERROR: dist directory not found!"
  exit 1
fi

echo "===> Build complete!"
