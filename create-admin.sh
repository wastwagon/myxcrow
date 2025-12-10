#!/bin/bash

# Quick script to create an admin user
# Usage: ./create-admin.sh [email] [password]

API_URL="http://localhost:4001/api"
ADMIN_EMAIL="${1:-admin@myxcrow.com}"
ADMIN_PASSWORD="${2:-Admin123!}"

echo "=========================================="
echo "Creating Admin User"
echo "=========================================="
echo ""
echo "Email: $ADMIN_EMAIL"
echo "Password: $ADMIN_PASSWORD"
echo ""

# Step 1: Register user
echo "Step 1: Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\",
    \"firstName\": \"Admin\",
    \"lastName\": \"User\"
  }")

ADMIN_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$ADMIN_ID" ]; then
  # User might already exist, try to get ID
  echo "User might already exist, checking..."
  ADMIN_ID=$(docker exec escrow_db psql -U postgres -d escrow -t -c "SELECT id FROM \"User\" WHERE email = '$ADMIN_EMAIL';" 2>&1 | tr -d ' \n')
  
  if [ -z "$ADMIN_ID" ]; then
    echo "❌ Failed to create or find user"
    echo "Response: $REGISTER_RESPONSE"
    exit 1
  fi
  echo "✓ Found existing user: $ADMIN_ID"
else
  echo "✓ User registered: $ADMIN_ID"
fi

# Step 2: Update role to ADMIN
echo ""
echo "Step 2: Updating role to ADMIN..."
UPDATE_RESULT=$(docker exec escrow_db psql -U postgres -d escrow -c \
  "UPDATE \"User\" SET roles = ARRAY['ADMIN']::\"UserRole\"[] WHERE id = '$ADMIN_ID';" 2>&1)

if echo "$UPDATE_RESULT" | grep -q "UPDATE 1"; then
  echo "✓ Admin role assigned successfully"
else
  echo "⚠ Warning: Role update may have failed"
  echo "$UPDATE_RESULT"
fi

# Step 3: Verify
echo ""
echo "Step 3: Verifying admin role..."
VERIFY_ROLE=$(docker exec escrow_db psql -U postgres -d escrow -t -c \
  "SELECT roles FROM \"User\" WHERE id = '$ADMIN_ID';" 2>&1 | tr -d ' \n')

if echo "$VERIFY_ROLE" | grep -q "ADMIN"; then
  echo "✓ Admin role verified"
else
  echo "❌ Admin role not found. Current roles: $VERIFY_ROLE"
  exit 1
fi

# Step 4: Test login
echo ""
echo "Step 4: Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\"
  }")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | head -1 | cut -d'"' -f4)
ROLES=$(echo "$LOGIN_RESPONSE" | grep -o '"roles":\[[^]]*\]' | head -1)

if [ -n "$TOKEN" ]; then
  echo "✓ Login successful"
  if echo "$ROLES" | grep -q "ADMIN"; then
    echo "✓ Admin role confirmed in token"
  else
    echo "⚠ Warning: Admin role not in token. Roles: $ROLES"
  fi
else
  echo "❌ Login failed"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo ""
echo "=========================================="
echo "✅ Admin User Created Successfully!"
echo "=========================================="
echo ""
echo "Email: $ADMIN_EMAIL"
echo "Password: $ADMIN_PASSWORD"
echo ""
echo "Next steps:"
echo "1. Login at: http://localhost:3003/login"
echo "2. Access admin dashboard: http://localhost:3003/admin"
echo ""
echo "Or use the API with this token:"
echo "$TOKEN"
echo ""

