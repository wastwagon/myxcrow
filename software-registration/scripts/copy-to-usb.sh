#!/usr/bin/env bash
# Copy pen-drive-1 contents to all mounted USB volumes
# Usage: ./copy-to-usb.sh [drive_number]
# Plug in pen drive(s), wait for mount, then run this script.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REG_DIR="$(dirname "$SCRIPT_DIR")"
SOURCE="$REG_DIR/pen-drive-1"

if [[ ! -d "$SOURCE/02-source-code" ]]; then
  echo "Run prepare-pen-drive.sh or run-all.sh first."
  exit 1
fi

echo "Looking for USB volumes in /Volumes/..."
FOUND=0

for vol in /Volumes/*; do
  name="$(basename "$vol")"
  # Skip system volumes
  case "$name" in
    Macintosh\ HD|Macintosh\ HD\ -*|Preboot|Recovery|VM|Data|com.apple.*) continue ;;
  esac
  if [[ -d "$vol" && -w "$vol" ]]; then
    echo ""
    echo "→ Copying to: $vol"
    echo "  This will ERASE existing files on the drive root."
    read -p "  Copy to $name? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      rsync -av --progress "$SOURCE/" "$vol/"
      echo "✅ Done: $vol"
      FOUND=$((FOUND + 1))
    fi
  fi
done

if [[ $FOUND -eq 0 ]]; then
  echo ""
  echo "No USB drives selected. Plug in pen drive (format as exFAT) and run again."
  echo ""
  echo "Manual copy:"
  echo "  cp -R $SOURCE/* /Volumes/YOUR_DRIVE_NAME/"
  ls -la /Volumes/ 2>/dev/null || true
fi
