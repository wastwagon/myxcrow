#!/usr/bin/env bash
# Generate JWT_SECRET and ENCRYPTION_KEY, then create/update .env files.
# Run from repo root: bash scripts/generate-keys-and-setup-env.sh

set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "=== Generating secure keys ==="
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)

echo "JWT_SECRET generated (${#JWT_SECRET} chars)"
echo "ENCRYPTION_KEY generated (${#ENCRYPTION_KEY} chars)"

# --- services/api/.env (for running API directly) ---
API_ENV="$REPO_ROOT/services/api/.env"
if [ -f "$API_ENV" ]; then
  echo ""
  echo "Updating existing $API_ENV with new keys..."
  # Replace JWT_SECRET and ENCRYPTION_KEY lines
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" "$API_ENV"
    sed -i '' "s|^ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$ENCRYPTION_KEY|" "$API_ENV"
  else
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" "$API_ENV"
    sed -i "s|^ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$ENCRYPTION_KEY|" "$API_ENV"
  fi
else
  echo ""
  echo "Creating $API_ENV from .env.example..."
  cp .env.example "$API_ENV"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" "$API_ENV"
    sed -i '' "s|^ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$ENCRYPTION_KEY|" "$API_ENV"
  else
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" "$API_ENV"
    sed -i "s|^ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$ENCRYPTION_KEY|" "$API_ENV"
  fi
fi

# --- infra/docker/.env.dev (for Docker dev) ---
DOCKER_ENV="$REPO_ROOT/infra/docker/.env.dev"
echo ""
echo "Updating $DOCKER_ENV with generated keys..."
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" "$DOCKER_ENV"
  if grep -q "^ENCRYPTION_KEY=" "$DOCKER_ENV"; then
    sed -i '' "s|^ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$ENCRYPTION_KEY|" "$DOCKER_ENV"
  else
    echo "ENCRYPTION_KEY=$ENCRYPTION_KEY" >> "$DOCKER_ENV"
  fi
else
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" "$DOCKER_ENV"
  if grep -q "^ENCRYPTION_KEY=" "$DOCKER_ENV"; then
    sed -i "s|^ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$ENCRYPTION_KEY|" "$DOCKER_ENV"
  else
    echo "ENCRYPTION_KEY=$ENCRYPTION_KEY" >> "$DOCKER_ENV"
  fi
fi

# --- Docker: ensure api gets these when using docker-compose ---
# Create infra/docker/.env so docker-compose picks up JWT_SECRET for ${JWT_SECRET}
DOCKER_DOTENV="$REPO_ROOT/infra/docker/.env"
echo ""
echo "Creating $DOCKER_DOTENV for docker-compose (JWT_SECRET, ENCRYPTION_KEY)..."
echo "JWT_SECRET=$JWT_SECRET" > "$DOCKER_DOTENV"
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY" >> "$DOCKER_DOTENV"

echo ""
echo "=== Setup complete ==="
echo ""
echo "Keys have been generated and written to:"
echo "  - services/api/.env (for local API)"
echo "  - infra/docker/.env (for docker-compose)"
echo "  - infra/docker/.env.dev (JWT_SECRET, ENCRYPTION_KEY)"
echo ""
echo "For production (Render, etc.), add these env vars in your dashboard:"
echo "  JWT_SECRET=<generated above - copy from services/api/.env>"
echo "  ENCRYPTION_KEY=<generated above - copy from services/api/.env>"
echo ""
echo "To copy for production, run:"
echo "  grep -E '^JWT_SECRET=|^ENCRYPTION_KEY=' services/api/.env"
echo ""
