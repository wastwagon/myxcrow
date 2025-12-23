# Production Database Setup Guide

Complete guide for setting up the production database on Render.

## 📋 Database Information

**Internal Database URL:**
```
postgresql://escrow_user:FXWHozYuaE3bZZjt0JEV9uXqSQfPUrN7@dpg-d55a92ili9vc73cfddh0-a/escrow_o4vn
```

**External Database URL:**
```
postgresql://escrow_user:FXWHozYuaE3bZZjt0JEV9uXqSQfPUrN7@dpg-d55a92ili9vc73cfddh0-a.oregon-postgres.render.com/escrow_o4vn
```

**PSQL Command:**
```bash
PGPASSWORD=FXWHozYuaE3bZZjt0JEV9uXqSQfPUrN7 psql -h dpg-d55a92ili9vc73cfddh0-a.oregon-postgres.render.com -U escrow_user escrow_o4vn
```

## 🗄️ Database Schema

The complete database schema includes:

### Core Tables (25 tables total):
1. **User** - User accounts and authentication
2. **Session** - User sessions
3. **Device** - Device tracking
4. **UserProfile** - User profiles
5. **KYCDetail** - KYC verification data
6. **Wallet** - User wallets
7. **WalletFunding** - Wallet funding transactions
8. **Withdrawal** - Withdrawal requests
9. **EscrowAgreement** - Escrow agreements
10. **EscrowMilestone** - Milestone-based escrows
11. **PaymentMethod** - Payment methods
12. **BankAccount** - Bank accounts
13. **Payment** - Payment transactions
14. **Shipment** - Shipment tracking
15. **ShipmentEvent** - Shipment events
16. **Evidence** - Evidence files
17. **Dispute** - Disputes
18. **DisputeMessage** - Dispute messages
19. **EscrowMessage** - Escrow messages
20. **EscrowRating** - User ratings
21. **LedgerJournal** - Ledger journals
22. **LedgerEntry** - Ledger entries
23. **PlatformSettings** - Platform settings
24. **AuditLog** - Audit logs
25. **RiskEvent** - Risk events

### Enums (11 enums):
- UserRole, KYCStatus, EscrowStatus, PaymentMethodType, PaymentStatus
- DisputeStatus, DisputeReason, WalletFundingSource, WalletFundingStatus
- WithdrawalMethod, WithdrawalStatus

## 🚀 Setup Methods

### Method 1: Automatic (Recommended)

Migrations run automatically when the API service starts on Render:

```yaml
startCommand: cd services/api && pnpm prisma migrate deploy && node dist/main.js
```

This ensures migrations are always up-to-date on every deployment.

### Method 2: Manual via Render Shell

1. Go to your `myxcrow-api` service in Render dashboard
2. Click **Shell** tab
3. Run:
```bash
cd services/api
export DATABASE_URL="postgresql://escrow_user:FXWHozYuaE3bZZjt0JEV9uXqSQfPUrN7@dpg-d55a92ili9vc73cfddh0-a.oregon-postgres.render.com/escrow_o4vn"
pnpm prisma generate
pnpm prisma migrate deploy
```

### Method 3: Local Script

Run from your local machine:

```bash
export DATABASE_URL="postgresql://escrow_user:FXWHozYuaE3bZZjt0JEV9uXqSQfPUrN7@dpg-d55a92ili9vc73cfddh0-a.oregon-postgres.render.com/escrow_o4vn"
./scripts/migrate-production.sh
```

## 🌱 Seeding Production Database

### Option 1: Via Render Shell

1. Go to `myxcrow-api` service → Shell
2. Run:
```bash
cd services/api
export DATABASE_URL="postgresql://escrow_user:FXWHozYuaE3bZZjt0JEV9uXqSQfPUrN7@dpg-d55a92ili9vc73cfddh0-a.oregon-postgres.render.com/escrow_o4vn"
pnpm seed
```

### Option 2: Create Admin User Only

If you only want to create an admin user:

```bash
cd services/api
export DATABASE_URL="postgresql://escrow_user:FXWHozYuaE3bZZjt0JEV9uXqSQfPUrN7@dpg-d55a92ili9vc73cfddh0-a.oregon-postgres.render.com/escrow_o4vn"
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@myxcrow.com' },
    update: {},
    create: {
      email: 'admin@myxcrow.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      roles: ['ADMIN'],
      kycStatus: 'VERIFIED',
      isActive: true,
    },
  });
  console.log('Admin user created:', admin.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.\$disconnect());
"
```

## ✅ Verification

### Check Migration Status

```bash
PGPASSWORD=FXWHozYuaE3bZZjt0JEV9uXqSQfPUrN7 psql -h dpg-d55a92ili9vc73cfddh0-a.oregon-postgres.render.com -U escrow_user escrow_o4vn -c "\dt"
```

### Check Table Count

```bash
PGPASSWORD=FXWHozYuaE3bZZjt0JEV9uXqSQfPUrN7 psql -h dpg-d55a92ili9vc73cfddh0-a.oregon-postgres.render.com -U escrow_user escrow_o4vn -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

Expected: **25 tables**

### Verify Admin User

```bash
PGPASSWORD=FXWHozYuaE3bZZjt0JEV9uXqSQfPUrN7 psql -h dpg-d55a92ili9vc73cfddh0-a.oregon-postgres.render.com -U escrow_user escrow_o4vn -c "SELECT email, roles FROM \"User\" WHERE 'ADMIN' = ANY(roles);"
```

## 🔐 Security Notes

⚠️ **Important:**
- Database credentials are sensitive - never commit them to git
- Use Render environment variables for `DATABASE_URL`
- Change default admin password after first login
- Enable database backups in Render dashboard

## 📊 Migration Files

All migrations are in: `services/api/prisma/migrations/`

- **Initial Migration:** `20251126143158_init/migration.sql`
  - Contains complete schema (25 tables, 11 enums, all indexes and foreign keys)
  - 714 lines of SQL
  - Creates all database structures

## 🔄 Migration Process

1. **Prisma Generate** - Generates Prisma Client from schema
2. **Prisma Migrate Deploy** - Applies migrations to database
3. **Verification** - Checks that all tables exist

## 📝 Next Steps After Migration

1. ✅ Verify all tables exist (25 tables)
2. ✅ Create admin user (if not seeded)
3. ✅ Test API endpoints
4. ✅ Verify Redis connection
5. ✅ Configure S3 bucket
6. ✅ Set up email service
7. ✅ Configure Paystack webhooks

---

**Database is ready!** All migrations are included and will run automatically on Render deployment.

