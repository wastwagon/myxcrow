#!/usr/bin/env bash
# Automated MYXCROW demo video for registration submission
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REG_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$REG_DIR")"
BASE_URL="${BASE_URL:-http://localhost:3017}"
OUT_DIR="$REG_DIR/pen-drive-1/04-screen-recording"
MP4="$OUT_DIR/MYXCROW-demo.mp4"

cd "$REPO_ROOT"

if ! curl -sf "$BASE_URL" >/dev/null 2>&1; then
  if curl -sf "${BASE_URL/3017/4010}/api/health" >/dev/null 2>&1; then
    echo "API up, waiting for web to compile..."
    for i in $(seq 1 60); do
      curl -sf "$BASE_URL" >/dev/null 2>&1 && break
      sleep 5
    done
  else
    echo "App not running. Starting..."
    "$SCRIPT_DIR/start-app.sh"
  fi
fi

for i in $(seq 1 30); do
  curl -sf "$BASE_URL" >/dev/null 2>&1 && break
  sleep 5
done

curl -sf "$BASE_URL" >/dev/null 2>&1 || { echo "❌ Web not available at $BASE_URL"; exit 1; }

echo "Installing Playwright chromium..."
cd "$REPO_ROOT"
pnpm exec playwright install chromium 2>/dev/null || npx playwright install chromium

rm -rf "$OUT_DIR/playwright-output"
mkdir -p "$OUT_DIR/playwright-output"

echo "Recording demo..."
BASE_URL="$BASE_URL" PW_OUTPUT="$OUT_DIR/playwright-output" \
  pnpm exec playwright test "$SCRIPT_DIR/demo.spec.ts" \
  --config="$SCRIPT_DIR/playwright.demo.config.js" \
  --reporter=line

WEBM=$(find "$OUT_DIR/playwright-output" -name "*.webm" | head -1)
if [[ -z "$WEBM" ]]; then
  echo "❌ No video captured"
  exit 1
fi

if command -v ffmpeg >/dev/null; then
  ffmpeg -y -i "$WEBM" -c:v libx264 -crf 23 -pix_fmt yuv420p "$MP4" 2>/dev/null
  cp -f "$MP4" "$REG_DIR/pen-drive-2/04-screen-recording/MYXCROW-demo.mp4"
  rm -f "$OUT_DIR/PLACE_RECORDING_HERE.txt"
  echo "✅ Demo video: $MP4 ($(du -h "$MP4" | cut -f1))"
else
  cp -f "$WEBM" "$OUT_DIR/MYXCROW-demo.webm"
  cp -f "$WEBM" "$REG_DIR/pen-drive-2/04-screen-recording/MYXCROW-demo.webm"
  echo "✅ Demo video: $OUT_DIR/MYXCROW-demo.webm"
fi
