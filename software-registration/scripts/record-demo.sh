#!/usr/bin/env bash
# Record MYXCROW demo video using ffmpeg (macOS screen capture)
# Prerequisites: app running at http://localhost:3007, ffmpeg installed
#
# Usage:
#   ./record-demo.sh              # interactive — picks screen, records 10 min
#   ./record-demo.sh 300          # record 300 seconds (5 min)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REG_DIR="$(dirname "$SCRIPT_DIR")"
OUT1="$REG_DIR/pen-drive-1/04-screen-recording/MYXCROW-demo.mp4"
OUT2="$REG_DIR/pen-drive-2/04-screen-recording/MYXCROW-demo.mp4"
DURATION="${1:-600}"  # default 10 minutes

if ! command -v ffmpeg >/dev/null; then
  echo "Installing ffmpeg..."
  brew install ffmpeg
fi

# Check app is up
if ! curl -sf http://localhost:3007 >/dev/null 2>&1 && ! curl -sf http://localhost:3000 >/dev/null 2>&1; then
  echo "⚠️  Web app not detected on :3007 or :3000"
  echo "   Start first: ./setup-local.sh && ./scripts/db-seed.sh"
  read -p "Continue anyway? [y/N] " -n 1 -r
  echo
  [[ $REPLY =~ ^[Yy]$ ]] || exit 1
fi

mkdir -p "$(dirname "$OUT1")" "$(dirname "$OUT2")"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║           MYXCROW Screen Recording                       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "DEMO SCRIPT (follow while recording):"
echo "  1. Open http://localhost:3007"
echo "  2. Login: buyer1@example.com / password123"
echo "  3. Dashboard → New Escrow → create transaction"
echo "  4. Fund escrow from wallet"
echo "  5. Logout → seller1@example.com / password123 → mark shipped"
echo "  6. Delivery confirm → release funds"
echo "  7. Login admin@myxcrow.com / password123 → admin dashboard"
echo ""
echo "Recording ${DURATION}s to: $OUT1"
echo ""
echo "On macOS: grant Screen Recording permission to Terminal/iTerm if prompted."
echo "Press Ctrl+C to stop early."
echo ""
read -p "Press ENTER to start recording..."

# macOS avfoundation — device 1 is usually main display
# List devices: ffmpeg -f avfoundation -list_devices true -i ""
ffmpeg -y \
  -f avfoundation \
  -capture_cursor 1 \
  -capture_mouse_clicks 1 \
  -i "1:none" \
  -t "$DURATION" \
  -c:v libx264 \
  -preset ultrafast \
  -crf 23 \
  -pix_fmt yuv420p \
  "$OUT1"

cp -f "$OUT1" "$OUT2"
echo ""
echo "✅ Recording saved:"
echo "   $OUT1"
echo "   $OUT2"
du -h "$OUT1"
