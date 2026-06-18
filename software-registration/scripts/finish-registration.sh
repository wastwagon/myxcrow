#!/usr/bin/env bash
# Complete registration package after run-all (or standalone)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REG_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$REG_DIR")"

echo "=== Finishing MYXCROW registration package ==="

# iOS WebView Gold (MYXCROWAPP)
IOS_SRC="$HOME/Downloads/MYXCROWAPP"
if [[ -d "$IOS_SRC/XcodeSourceCode" ]]; then
  echo "→ Zipping iOS MYXCROWAPP..."
  (cd "$IOS_SRC" && zip -r "$REG_DIR/webview-gold-project/MYXCROW-ios-source.zip" XcodeSourceCode \
    -x "*/build/*" -x "*/Pods/*" -x "*/DerivedData/*" -q) || true
  echo "  ✅ MYXCROW-ios-source.zip"
fi

# Copy webview artifacts into registration folder
mkdir -p "$REG_DIR/webview-gold-project"
ANDROID_SRC="$HOME/Downloads/MYXCROWAPP_Android_v16-2.7"
if [[ -d "$ANDROID_SRC/AndroidStudioSourceCode" && ! -f "$REG_DIR/webview-gold-project/MYXCROW-webview-gold-source.zip" ]]; then
  (cd "$ANDROID_SRC" && zip -r "$REG_DIR/webview-gold-project/MYXCROW-webview-gold-source.zip" AndroidStudioSourceCode myxcrow-keystore.jks \
    -x "*/build/*" -x "*/.gradle/*" -q) || true
fi
APK="$ANDROID_SRC/AndroidStudioSourceCode/app/build/outputs/apk/debug/app-debug.apk"
[[ -f "$APK" ]] && cp -f "$APK" "$REG_DIR/webview-gold-project/MYXCROW-android.apk"

cat > "$REG_DIR/webview-gold-project/README.txt" << EOF
MYXCROW Mobile Wrapper (WebView Gold)

Android source: MYXCROWAPP_Android_v16-2.7
iOS source: MYXCROWAPP (XcodeSourceCode)
APK: MYXCROW-android.apk (debug build)

The mobile apps load the MYXCROW web application URL in a native WebView shell.
Backend and database are in the main MYXCROW monorepo (02-source-code/).
EOF

# Regenerate schema + pen drives
"$SCRIPT_DIR/generate-full-schema-sql.sh"
"$SCRIPT_DIR/prepare-pen-drive.sh" 1

# Copy webview + cover letter + node build into pen drives
for drive in pen-drive-1 pen-drive-2; do
  D="$REG_DIR/$drive"
  mkdir -p "$D/06-webview-gold-project" "$D/01-executable/node-build"
  cp -f "$REG_DIR/webview-gold-project/"* "$D/06-webview-gold-project/" 2>/dev/null || true
  cp -f "$REG_DIR/COVER_LETTER.html" "$D/" 2>/dev/null || true
  cp -f "$REG_DIR/pen-drive-1/01-executable/node-build/"* "$D/01-executable/node-build/" 2>/dev/null || true
done

rm -rf "$REG_DIR/pen-drive-2"
cp -r "$REG_DIR/pen-drive-1" "$REG_DIR/pen-drive-2"

echo ""
echo "=== Package sizes ==="
du -sh "$REG_DIR/pen-drive-1" "$REG_DIR/pen-drive-1/02-source-code/"*.zip
du -sh "$REG_DIR/pen-drive-1/06-webview-gold-project/"* 2>/dev/null || true
du -sh "$REG_DIR/pen-drive-1/01-executable/node-build/"* 2>/dev/null || true
du -sh "$REG_DIR/pen-drive-1/03-database-schema" 2>/dev/null || true

echo ""
echo "✅ Pen drives ready at:"
echo "   $REG_DIR/pen-drive-1"
echo "   $REG_DIR/pen-drive-2"
