# Admin Backend Access Guide

## Overview

The admin backend provides access to administrative features including:
- **Wallet Management**: Credit/debit user wallets
- **Dispute Resolution**: Resolve and close disputes
- **Settings Management**: Configure platform settings
- **Audit Logs**: View system audit logs
- **User Management**: View all users and their wallets

## Method 1: Create Admin User via Database (Recommended)

### Step 1: Register a User

Register a user through the frontend or API:

**Via Frontend:**
1. Go to http://localhost:3003/register
2. Fill in the registration form
3. Note the email you used

**Via API:**
```bash
curl -X POST http://localhost:4001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@myxcrow.com",
    "password": "Admin123!",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

### Step 2: Update User Role to ADMIN

Update the user's role in the database:

```bash
# Get the user ID from the registration response, then:
docker exec escrow_db psql -U postgres -d escrow -c \
  "UPDATE \"User\" SET roles = ARRAY['ADMIN']::\"UserRole\"[] WHERE email = 'admin@myxcrow.com';"
```

Or if you have the user ID:
```bash
docker exec escrow_db psql -U postgres -d escrow -c \
  "UPDATE \"User\" SET roles = ARRAY['ADMIN']::\"UserRole\"[] WHERE id = 'USER_ID_HERE';"
```

### Step 3: Login as Admin

**Via Frontend:**
1. Go to http://localhost:3003/login
2. Login with your admin credentials
3. You'll be redirected to `/admin` dashboard

**Via API:**
```bash
curl -X POST http://localhost:4001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@myxcrow.com",
    "password": "Admin123!"
  }'
```

Save the `accessToken` from the response for API calls.

## Method 2: Quick Admin Creation Script

Run this script to create an admin user quickly:

```bash
#!/bin/bash
API_URL="http://localhost:4001/api"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="Admin123!"

# Register
RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\",
    \"firstName\": \"Admin\",
    \"lastName\": \"User\"
  }")

ADMIN_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

# Update role
docker exec escrow_db psql -U postgres -d escrow -c \
  "UPDATE \"User\" SET roles = ARRAY['ADMIN']::\"UserRole\"[] WHERE id = '$ADMIN_ID';"

echo "Admin user created: $ADMIN_EMAIL"
echo "Password: $ADMIN_PASSWORD"
```

## Accessing Admin Features

### Frontend Admin Dashboard

Once logged in as admin, access:

- **Main Dashboard**: http://localhost:3003/admin
- **Credit Wallet**: http://localhost:3003/admin/wallet/credit
- **Debit Wallet**: http://localhost:3003/admin/wallet/debit
- **Disputes**: http://localhost:3003/disputes (admin view)
- **All Escrows**: http://localhost:3003/escrows (admin can see all)

### Admin API Endpoints

All admin endpoints require:
- `Authorization: Bearer YOUR_ADMIN_TOKEN` header
- User must have `ADMIN` role

#### Wallet Management

**Credit User Wallet:**
```bash
curl -X POST http://localhost:4001/api/wallet/admin/credit \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "amountCents": 10000,
    "description": "Manual credit"
  }'
```

**Debit User Wallet:**
```bash
curl -X POST http://localhost:4001/api/wallet/admin/debit \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "amountCents": 5000,
    "description": "Manual debit"
  }'
```

**List All Wallets:**
```bash
curl -X GET "http://localhost:4001/api/wallet/admin?limit=50&offset=0" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Get User Wallet:**
```bash
curl -X GET "http://localhost:4001/api/wallet/admin/USER_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Get Wallet Transactions:**
```bash
curl -X GET "http://localhost:4001/api/wallet/admin/USER_ID/transactions" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Dispute Management

**Resolve Dispute:**
```bash
curl -X PUT "http://localhost:4001/api/disputes/DISPUTE_ID/resolve" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resolution": "Resolved in favor of buyer",
    "action": "refund"
  }'
```

**Close Dispute:**
```bash
curl -X PUT "http://localhost:4001/api/disputes/DISPUTE_ID/close" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Settings Management

**Get Setting:**
```bash
curl -X GET "http://localhost:4001/api/settings/KEY" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Update Setting:**
```bash
curl -X PUT "http://localhost:4001/api/settings/KEY" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "new_value"
  }'
```

**Get Fee Settings:**
```bash
curl -X GET "http://localhost:4001/api/settings/fees" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Audit Logs

**List Audit Logs:**
```bash
curl -X GET "http://localhost:4001/api/audit?limit=50&offset=0" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Available Admin Roles

The system supports multiple admin roles:

- **ADMIN**: Full administrative access
- **AUDITOR**: Can view audit logs and read-only access
- **SUPPORT**: Can view disputes and assist users

To assign different roles:
```bash
# ADMIN
docker exec escrow_db psql -U postgres -d escrow -c \
  "UPDATE \"User\" SET roles = ARRAY['ADMIN']::\"UserRole\"[] WHERE id = 'USER_ID';"

# AUDITOR
docker exec escrow_db psql -U postgres -d escrow -c \
  "UPDATE \"User\" SET roles = ARRAY['AUDITOR']::\"UserRole\"[] WHERE id = 'USER_ID';"

# SUPPORT
docker exec escrow_db psql -U postgres -d escrow -c \
  "UPDATE \"User\" SET roles = ARRAY['SUPPORT']::\"UserRole\"[] WHERE id = 'USER_ID';"
```

## Troubleshooting

### "Unauthorized" or "Forbidden" Errors

1. **Check your token**: Make sure you're using a valid JWT token
2. **Check user role**: Verify the user has ADMIN role in database
3. **Token expiration**: Tokens expire after a period - login again to get a new token

### Can't Access Admin Dashboard

1. **Check authentication**: Make sure you're logged in
2. **Check role**: Verify user has ADMIN role
3. **Clear browser cache**: Sometimes cached data can cause issues

### Finding User IDs

```bash
# List all users
docker exec escrow_db psql -U postgres -d escrow -c \
  "SELECT id, email, roles FROM \"User\";"

# Find specific user
docker exec escrow_db psql -U postgres -d escrow -c \
  "SELECT id, email, roles FROM \"User\" WHERE email = 'user@example.com';"
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Change default passwords**: Always use strong passwords for admin accounts
2. **Limit admin access**: Only grant ADMIN role to trusted users
3. **Monitor audit logs**: Regularly check audit logs for suspicious activity
4. **Use HTTPS in production**: Never expose admin endpoints over HTTP in production
5. **Token security**: Never share admin tokens or commit them to version control

## Quick Reference

| Feature | Frontend URL | API Endpoint |
|---------|-------------|--------------|
| Admin Dashboard | `/admin` | N/A |
| Credit Wallet | `/admin/wallet/credit` | `POST /wallet/admin/credit` |
| Debit Wallet | `/admin/wallet/debit` | `POST /wallet/admin/debit` |
| List Wallets | N/A | `GET /wallet/admin` |
| Resolve Dispute | `/disputes/:id` | `PUT /disputes/:id/resolve` |
| Settings | `/admin/settings` | `GET/PUT /settings/:key` |
| Audit Logs | N/A | `GET /audit` |

