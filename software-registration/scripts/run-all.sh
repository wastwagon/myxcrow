#!/usr/bin/env bash
# MYXCROW Software Registration — Full automation via terminal
# Usage: ./software-registration/scripts/run-all.sh [--skip-docker] [--skip-record]
#
# Does everything possible from command line. Items requiring your files
# (Ghana Cards, incorporation cert) will create folders and pause with instructions.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REG_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$REG_DIR")"
VERSION="1.0.0"
SKIP_DOCKER=false
SKIP_RECORD=false

for arg in "$@"; do
  case "$arg" in
    --skip-docker) SKIP_DOCKER=true ;;
    --skip-record) SKIP_RECORD=true ;;
  esac
done

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${BLUE}[MYXCROW]${NC} $*"; }
ok()   { echo -e "${GREEN}✅${NC} $*"; }
warn() { echo -e "${YELLOW}⚠️${NC} $*"; }
err()  { echo -e "${RED}❌${NC} $*" >&2; }

cd "$REPO_ROOT"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   MYXCROW Software Registration — Full Terminal Setup    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ─── 1. Dependencies ─────────────────────────────────────────────────────────
log "Step 1/10: Checking dependencies..."

if ! command -v node >/dev/null; then err "Node.js required"; exit 1; fi
if ! command -v pnpm >/dev/null; then err "pnpm required"; exit 1; fi
ok "Node $(node -v), pnpm $(pnpm -v)"

if ! command -v ffmpeg >/dev/null; then
  if command -v brew >/dev/null; then
    warn "Installing ffmpeg (for screen recording)..."
    brew install ffmpeg
    ok "ffmpeg installed"
  else
    warn "ffmpeg not found — screen recording will be skipped"
    SKIP_RECORD=true
  fi
else
  ok "ffmpeg available"
fi

# ─── 2. Environment ──────────────────────────────────────────────────────────
log "Step 2/10: Environment file..."

if [[ ! -f "$REPO_ROOT/.env" ]]; then
  cp "$REPO_ROOT/.env.example" "$REPO_ROOT/.env"
  ok "Created .env from .env.example"
else
  ok ".env exists"
fi

# ─── 3. Database schema export ───────────────────────────────────────────────
log "Step 3/10: Exporting database schema..."
"$SCRIPT_DIR/generate-full-schema-sql.sh"
ok "full-schema.sql generated"

# ─── 4. Company document folders ─────────────────────────────────────────────
log "Step 4/10: Company document folders..."

mkdir -p "$REG_DIR/company-documents/ghana-cards"
mkdir -p "$REG_DIR/company-documents/certificate-of-incorporation"

GHANA_COUNT=$(find "$REG_DIR/company-documents/ghana-cards" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.pdf' \) 2>/dev/null | wc -l | tr -d ' ')
CERT_COUNT=$(find "$REG_DIR/company-documents/certificate-of-incorporation" -type f -iname '*.pdf' 2>/dev/null | wc -l | tr -d ' ')

if [[ "$GHANA_COUNT" -eq 0 ]]; then
  warn "No Ghana Cards found in company-documents/ghana-cards/"
  warn "  Copy scans: company-documents/ghana-cards/developer-name-front.jpg"
fi
if [[ "$CERT_COUNT" -eq 0 ]]; then
  warn "No incorporation certificate in company-documents/certificate-of-incorporation/"
  warn "  Copy PDF: company-documents/certificate-of-incorporation/certificate.pdf"
fi

# ─── 5. WebView Gold search ──────────────────────────────────────────────────
log "Step 5/10: Searching for WebView Gold project..."

WEBVIEW_SRC=""
for candidate in \
  "$HOME/Downloads/MYXCROWAPP_Android_v16-2.7" \
  "$HOME/Downloads/MYXCROWAPP" \
  "$HOME/Downloads/WebViewGold_Android_v16.7 2" \
  "$HOME/Downloads/WebViewGold" \
  "$HOME/Downloads/webview-gold"; do
  if [[ -d "$candidate" ]]; then
    WEBVIEW_SRC="$candidate"
    break
  fi
done

if [[ -n "$WEBVIEW_SRC" ]]; then
  ok "Found WebView Gold at: $WEBVIEW_SRC"
  WEBVIEW_ZIP="$REG_DIR/webview-gold-project/MYXCROW-webview-gold-source.zip"
  log "Zipping WebView Gold source..."
  (cd "$(dirname "$WEBVIEW_SRC")" && zip -r "$WEBVIEW_ZIP" "$(basename "$WEBVIEW_SRC")" \
    -x "*/build/*" -x "*/.gradle/*" -x "*/Pods/*" -x "*/node_modules/*" -q) || true
  ok "WebView source zip created"
  # Find APK if built
  APK=$(find "$WEBVIEW_SRC" -name "*.apk" -path "*/outputs/apk/*" 2>/dev/null | head -1)
  if [[ -n "$APK" ]]; then
    cp "$APK" "$REG_DIR/webview-gold-project/MYXCROW-android.apk"
    ok "Copied APK: $(basename "$APK")"
  else
    warn "No APK found — build in Android Studio if needed"
  fi
else
  warn "WebView Gold project not found on this machine"
  warn "  MYXCROW will be submitted as web-only (see 06-webview-gold-project/)"
  echo "MYXCROW v${VERSION} is delivered as a web application (Next.js). No native mobile binary." \
    > "$REG_DIR/webview-gold-project/WEB_ONLY.txt"
fi

# ─── 6. Cover letter HTML (print to PDF from browser) ─────────────────────────
log "Step 6/10: Generating cover letter HTML..."

COVER_HTML="$REG_DIR/COVER_LETTER.html"
cat > "$COVER_HTML" << HTMLEOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MYXCROW Software Registration Cover Letter</title>
  <style>
    body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; line-height: 1.6; color: #222; }
    h1 { font-size: 1.2em; text-align: center; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
    .field { background: #fffde7; padding: 2px 6px; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <p class="no-print" style="background:#e3f2fd;padding:12px;border-radius:8px;">
    <strong>Print to PDF:</strong> File → Print → Save as PDF → save as COVER_LETTER.pdf on both pen drives.
  </p>

  <p><strong>Date:</strong> <span class="field">[DD Month YYYY]</span></p>

  <p><strong>To:</strong><br>
  The Registrar / Software Registration Authority<br>
  <span class="field">[Office address]</span></p>

  <h1>Application for Registration of Computer Software<br>MYXCROW v${VERSION}</h1>

  <p>Dear Sir/Madam,</p>

  <p>We, <strong><span class="field">[COMPANY LEGAL NAME]</span></strong>
  (Registration No. <span class="field">[REGISTRATION NUMBER]</span>),
  hereby submit our application for registration of <strong>MYXCROW</strong> version <strong>${VERSION}</strong>.</p>

  <h2>Product Description</h2>
  <p>MYXCROW is a secure escrow platform for buyers and sellers in Ghana (GHS transactions, wallet, KYC, disputes, admin dashboard).</p>

  <table>
    <tr><th>Component</th><th>Technology</th></tr>
    <tr><td>Web application</td><td>Next.js 14 (TypeScript)</td></tr>
    <tr><td>Backend API</td><td>NestJS 10 (TypeScript)</td></tr>
    <tr><td>Database</td><td>PostgreSQL 15 — 30 tables</td></tr>
    <tr><td>Payments</td><td>Paystack</td></tr>
    <tr><td>KYC</td><td>Smile Identity (Ghana Card)</td></tr>
  </table>

  <h2>Pen Drive Contents</h2>
  <ol>
    <li>Executable — Docker Compose + run instructions</li>
    <li>Source code — MYXCROW-source-v${VERSION}.zip</li>
    <li>Database schema — Prisma + SQL migrations + data dictionary</li>
    <li>Screen recording — MYXCROW-demo.mp4</li>
    <li>Company documents — Ghana Cards + Certificate of Incorporation</li>
    <li>WebView Gold wrapper (if applicable)</li>
  </ol>

  <h2>Developers</h2>
  <table>
    <tr><th>Name</th><th>Role</th><th>Ghana Card No.</th></tr>
    <tr><td class="field">[Developer 1]</td><td class="field">[Role]</td><td class="field">[GHA-XXXXXXXXX-X]</td></tr>
    <tr><td class="field">[Developer 2]</td><td class="field">[Role]</td><td class="field">[GHA-XXXXXXXXX-X]</td></tr>
  </table>

  <p>Registration fee: <strong>GHS 185</strong> enclosed / paid via <span class="field">[method]</span>.</p>

  <p>Contact: <span class="field">[Name]</span> |
  <span class="field">[+233 XX XXX XXXX]</span> |
  <span class="field">[email@company.com]</span></p>

  <p>Yours faithfully,</p>
  <br><br>
  <p>_______________________________<br>
  <span class="field">[Signatory name, Title]</span><br>
  <span class="field">[COMPANY LEGAL NAME]</span></p>
</body>
</html>
HTMLEOF
ok "Cover letter: $COVER_HTML (open in browser → Print → Save as PDF)"

# ─── 7. Build Node executables (no Docker required) ───────────────────────────
log "Step 7/10: Building Node.js executables (API + Web)..."

EXEC_DIR="$REG_DIR/pen-drive-1/01-executable/node-build"
mkdir -p "$EXEC_DIR"

if [[ ! -d "$REPO_ROOT/node_modules" ]]; then
  log "Installing workspace dependencies (first time may take several minutes)..."
  cd "$REPO_ROOT" && pnpm install --no-frozen-lockfile
fi

cd "$REPO_ROOT/services/api"
pnpm prisma:generate 2>/dev/null || pnpm exec prisma generate
pnpm build
ok "API built → services/api/dist/"

cd "$REPO_ROOT/apps/web"
pnpm build
ok "Web built → apps/web/.next/"

# Package node builds
NODE_PKG="$EXEC_DIR/MYXCROW-node-build-${VERSION}.tar.gz"
tar -czf "$NODE_PKG" \
  -C "$REPO_ROOT" \
  services/api/dist \
  services/api/package.json \
  services/api/prisma \
  apps/web/.next \
  apps/web/package.json \
  apps/web/public \
  apps/web/next.config.js \
  package.json \
  pnpm-lock.yaml \
  pnpm-workspace.yaml \
  2>/dev/null || true

cat > "$EXEC_DIR/START_NODE_BUILD.sh" << 'STARTEOF'
#!/bin/bash
# Requires: Node 20+, pnpm, PostgreSQL, Redis, MinIO running
set -e
cd "$(dirname "$0")"
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5434/myxcrow}"
echo "1. pnpm install (from extracted repo root)"
echo "2. cd services/api && node dist/main.js"
echo "3. cd apps/web && pnpm start"
echo "Or use setup-local.sh with Docker instead (recommended)."
STARTEOF
chmod +x "$EXEC_DIR/START_NODE_BUILD.sh"
ok "Node build archive: $NODE_PKG"

# ─── 8. Docker ───────────────────────────────────────────────────────────────
log "Step 8/10: Docker setup..."

wait_for_docker() {
  local i=0
  while ! docker info >/dev/null 2>&1; do
  if [[ $i -eq 0 ]]; then
    warn "Starting Docker Desktop..."
    open -a Docker 2>/dev/null || true
  fi
  if [[ $i -ge 60 ]]; then
    warn "Docker not ready after 5 minutes — skipping Docker steps"
    return 1
  fi
  sleep 5
  i=$((i + 1))
  echo -n "."
  done
  echo ""
  return 0
}

if [[ "$SKIP_DOCKER" == "false" ]]; then
  set +e
  if wait_for_docker; then
    ok "Docker is running"
    log "Starting MYXCROW stack..."
    cd "$REPO_ROOT"
    docker compose -f infra/docker/docker-compose.dev.yml up -d 2>/dev/null || \
      docker-compose -f infra/docker/docker-compose.dev.yml up -d || \
      warn "Docker compose failed — pen drive still includes node-build and setup-local.sh"

    log "Waiting for API health (up to 3 min)..."
    for i in $(seq 1 36); do
      if curl -sf http://localhost:4000/api/health >/dev/null 2>&1; then
        ok "API healthy at http://localhost:4000/api"
        break
      fi
      sleep 5
    done

  log "Seeding database..."
  docker exec escrow_api pnpm seed 2>/dev/null || "$REPO_ROOT/scripts/db-seed.sh" 2>/dev/null || warn "Seed failed — run ./scripts/db-seed.sh manually"

    if [[ "$SKIP_RECORD" == "false" ]] && command -v ffmpeg >/dev/null; then
      log "Step 9/10: Screen recording (60s app overview)..."
      warn "Recording requires app at http://localhost:3007 — recording browser is manual"
      warn "Run: ./software-registration/scripts/record-demo.sh"
    else
      log "Step 9/10: Screen recording skipped (use record-demo.sh when app is running)"
    fi

    log "Building Docker images for pen drive (optional, ~15 min)..."
  if [[ "${BUILD_DOCKER_IMAGES:-0}" == "1" ]]; then
    "$SCRIPT_DIR/build-docker-executables.sh" "$VERSION" || warn "Docker image build failed"
  else
    warn "Skipping Docker image export (set BUILD_DOCKER_IMAGES=1 to enable)"
  fi
  else
    warn "Docker unavailable — pen drive includes setup-local.sh and node-build"
  fi
  set -e
else
  log "Step 8-9: Docker skipped (--skip-docker)"
fi

# ─── 10. Prepare pen drives ──────────────────────────────────────────────────
log "Step 10/10: Preparing pen drive folders..."

# Copy node build into pen drive before prepare
mkdir -p "$REG_DIR/pen-drive-1/01-executable/node-build"
cp -f "$NODE_PKG" "$REG_DIR/pen-drive-1/01-executable/node-build/" 2>/dev/null || true
cp -f "$EXEC_DIR/START_NODE_BUILD.sh" "$REG_DIR/pen-drive-1/01-executable/node-build/" 2>/dev/null || true
cp -f "$COVER_HTML" "$REG_DIR/pen-drive-1/COVER_LETTER.html" 2>/dev/null || true

"$SCRIPT_DIR/prepare-pen-drive.sh" 1
cp -f "$COVER_HTML" "$REG_DIR/pen-drive-1/COVER_LETTER.html"

rm -rf "$REG_DIR/pen-drive-2"
cp -r "$REG_DIR/pen-drive-1" "$REG_DIR/pen-drive-2"
ok "pen-drive-1 and pen-drive-2 ready"

# Copy to mounted USB if present
for vol in /Volumes/USB* /Volumes/PEN* /Volumes/MYXCROW* /Volumes/UNTITLED*; do
  if [[ -d "$vol" && -w "$vol" && "$vol" != "/Volumes/Macintosh HD" ]]; then
    log "Copying to mounted drive: $vol"
    cp -R "$REG_DIR/pen-drive-1/"* "$vol/" 2>/dev/null && ok "Copied to $vol" || warn "Copy to $vol failed"
  fi
done

# ─── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                    SETUP COMPLETE                        ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Pen drive folders:"
echo "  $REG_DIR/pen-drive-1/"
echo "  $REG_DIR/pen-drive-2/"
echo ""
du -sh "$REG_DIR/pen-drive-1" "$REG_DIR/pen-drive-1/02-source-code/"*.zip 2>/dev/null || true
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "MANUAL STEPS REMAINING:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Ghana Cards → company-documents/ghana-cards/"
echo "   Then re-run: ./software-registration/scripts/prepare-pen-drive.sh 1"
echo ""
echo "2. Incorporation cert → company-documents/certificate-of-incorporation/"
echo ""
echo "3. Cover letter → open COVER_LETTER.html → Print → Save as PDF"
echo ""
echo "4. Screen recording:"
echo "   ./setup-local.sh && ./scripts/db-seed.sh"
echo "   ./software-registration/scripts/record-demo.sh"
echo ""
echo "5. Copy to USB pen drives:"
echo "   ./software-registration/scripts/copy-to-usb.sh"
echo ""
echo "6. Pay GHS 185 and submit both drives"
echo ""
