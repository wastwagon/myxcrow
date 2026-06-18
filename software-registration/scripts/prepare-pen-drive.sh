#!/usr/bin/env bash
# Prepare pen drive folder structure for software registration submission.
# Usage: ./prepare-pen-drive.sh [1|2]
#
# Run twice (for drive 1 and drive 2) or copy pen-drive-1 to pen-drive-2 after.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REG_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$REG_DIR")"
DRIVE_NUM="${1:-1}"
DRIVE_DIR="$REG_DIR/pen-drive-${DRIVE_NUM}"

echo "Preparing pen drive folder: $DRIVE_DIR"

# Ensure full schema SQL is up to date
"$SCRIPT_DIR/generate-full-schema-sql.sh"

# Create folder structure
mkdir -p "$DRIVE_DIR"/{01-executable,02-source-code,03-database-schema,04-screen-recording,05-company-documents,06-webview-gold-project}

# 01 - Executable placeholder + compose files
cp "$REPO_ROOT/docker-compose.production.yml" "$DRIVE_DIR/01-executable/" 2>/dev/null || true
cp "$REPO_ROOT/infra/docker/docker-compose.dev.yml" "$DRIVE_DIR/01-executable/docker-compose.dev.yml" 2>/dev/null || true
cp "$REPO_ROOT/setup-local.sh" "$DRIVE_DIR/01-executable/" 2>/dev/null || true

cat > "$DRIVE_DIR/01-executable/RUN.txt" << 'EOF'
MYXCROW v1.0.0 — How to Run

OPTION A — Docker dev stack (recommended for review):
  1. Install Docker Desktop
  2. cd 01-executable
  3. chmod +x setup-local.sh && ./setup-local.sh
  4. Open http://localhost:3007
  5. Seed data: see 02-source-code/MYXCROW-source/README.md

OPTION B — Docker production images:
  See BUILD_EXECUTABLES.md in software-registration folder.
  Load docker-images/*.tar if included.

Test logins (after seeding database):
  Admin:  admin@myxcrow.com / password123
  Buyer:  buyer1@test.com / password123
  Seller: seller1@test.com / password123

Contact: [YOUR COMPANY EMAIL]
EOF

# 02 - Source code zip
echo "Creating source code zip (this may take a minute)..."
ZIP_PATH="$DRIVE_DIR/02-source-code/MYXCROW-source-v1.0.0.zip"
cd "$(dirname "$REPO_ROOT")"
REPO_NAME="$(basename "$REPO_ROOT")"
zip -r "$ZIP_PATH" "$REPO_NAME" \
  -x "$REPO_NAME/node_modules/*" \
  -x "$REPO_NAME/apps/web/node_modules/*" \
  -x "$REPO_NAME/services/api/node_modules/*" \
  -x "$REPO_NAME/apps/web/.pnpm-store/*" \
  -x "$REPO_NAME/services/api/.pnpm-store/*" \
  -x "$REPO_NAME/**/.pnpm-store/*" \
  -x "$REPO_NAME/apps/web/.next/*" \
  -x "$REPO_NAME/services/api/dist/*" \
  -x "$REPO_NAME/apps/web/.next/*" \
  -x "$REPO_NAME/.git/*" \
  -x "$REPO_NAME/**/.env" \
  -x "$REPO_NAME/escrow_backup.sql" \
  -x "$REPO_NAME/software-registration/pen-drive-1/*" \
  -x "$REPO_NAME/software-registration/pen-drive-2/*" \
  -q
echo "Source zip: $ZIP_PATH ($(du -h "$ZIP_PATH" | cut -f1))"

# 03 - Database schema
cp -r "$REG_DIR/database-schema/"* "$DRIVE_DIR/03-database-schema/"

# 04 - Screen recording placeholder
cat > "$DRIVE_DIR/04-screen-recording/PLACE_RECORDING_HERE.txt" << 'EOF'
Add MYXCROW-demo.mp4 here before submission.

See software-registration/SCREEN_RECORDING_GUIDE.md for recording script.
EOF

# 05 - Company documents (copy if present)
if [[ -d "$REG_DIR/company-documents/ghana-cards" ]]; then
  cp -r "$REG_DIR/company-documents/"* "$DRIVE_DIR/05-company-documents/" 2>/dev/null || true
else
  cp "$REG_DIR/company-documents/README.md" "$DRIVE_DIR/05-company-documents/"
fi

# 06 - WebView Gold placeholder
cp "$REG_DIR/webview-gold-project/WHAT_TO_INCLUDE.md" "$DRIVE_DIR/06-webview-gold-project/"
cat > "$DRIVE_DIR/06-webview-gold-project/PLACE_FILES_HERE.txt" << 'EOF'
If you have a WebView Gold Android/iOS wrapper project, add:
- Source zip
- MYXCROW-android.apk (and .ipa if iOS)
- README.txt with app URL and version

If web-only, leave this note:
"MYXCROW is delivered as a web application. No native mobile binary."
EOF

# Root README for pen drive
cat > "$DRIVE_DIR/README.txt" << EOF
MYXCROW Escrow Platform — Software Registration Package
Version: 1.0.0
Date: $(date +"%Y-%m-%d")

Company: [YOUR COMPANY NAME]
Contact: [YOUR EMAIL / PHONE]

Contents:
  01-executable/     Runnable application (Docker compose + instructions)
  02-source-code/    Full source code zip
  03-database-schema/ PostgreSQL schema (Prisma + SQL migrations)
  04-screen-recording/ Demo video (add MYXCROW-demo.mp4)
  05-company-documents/ Ghana Cards + Certificate of Incorporation
  06-webview-gold-project/ Mobile wrapper (if applicable)

Registration fee: GHS 185
Certificate issued within 30 days.

See SUBMISSION_CHECKLIST.md for full checklist.
EOF

cp "$REG_DIR/SUBMISSION_CHECKLIST.md" "$DRIVE_DIR/"

echo ""
echo "Pen drive $DRIVE_NUM prepared at: $DRIVE_DIR"
echo ""
echo "Still needed manually:"
echo "  - Add MYXCROW-demo.mp4 to 04-screen-recording/"
echo "  - Add Ghana Cards + incorporation cert to 05-company-documents/"
echo "  - Add WebView Gold files to 06-webview-gold-project/ (if applicable)"
echo "  - Build Docker images to 01-executable/docker-images/ (optional)"
echo "  - Fill in company name/contact in README.txt"
echo ""
if [[ "$DRIVE_NUM" == "1" ]]; then
  echo "When done, duplicate to pen-drive-2:"
  echo "  rm -rf $REG_DIR/pen-drive-2 && cp -r $DRIVE_DIR $REG_DIR/pen-drive-2"
fi
