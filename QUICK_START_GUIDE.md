# Quick Start Guide - MYXCROW Platform

## 🚀 Getting Started

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for running seed script)
- Database running

### Step 1: Start Services
```bash
cd infra/docker
docker-compose -f docker-compose.dev.yml up -d
```

### Step 2: Run Database Migrations
```bash
cd services/api
npm install
npm run prisma:generate
npm run prisma:migrate
```

### Step 3: Seed Test Data
```bash
cd services/api
npm run seed
```

This creates:
- 10 test users (5 buyers, 5 sellers)
- 8 escrows with various statuses
- Wallets, messages, evidence, disputes

### Step 4: Start Frontend
```bash
cd apps/web
npm install
npm run dev
```

Visit: http://localhost:3000

## 🔑 Test Accounts

All test users have password: `password123`

**Buyers:**
- buyer1@test.com - John Buyer
- buyer2@test.com - Mike Customer
- buyer3@test.com - David Client
- buyer4@test.com - Chris Purchaser
- buyer5@test.com - Tom Acquirer

**Sellers:**
- seller1@test.com - Jane Seller
- seller2@test.com - Sarah Merchant
- seller3@test.com - Emma Vendor
- seller4@test.com - Lisa Provider
- seller5@test.com - Anna Supplier

**Admin:**
- admin@myxcrow.com (create using create-admin.sh)

## 📊 Testing Features

### User Dashboard
1. Login as `buyer1@test.com`
2. View wallet balance (500 GHS)
3. See active escrows
4. View recent transactions

### Escrow Workflow
1. Create new escrow
2. Fund escrow (AWAITING_FUNDING → FUNDED)
3. Mark as shipped (FUNDED → SHIPPED)
4. Confirm delivery (SHIPPED → DELIVERED)
5. Release funds (DELIVERED → RELEASED)

### Admin Dashboard
1. Login as admin
2. View platform statistics
3. Manage users
4. Credit/debit wallets
5. Approve withdrawals

## 🔍 Verification

### Check Database
```bash
docker exec -it escrow_db psql -U postgres -d escrow -c "SELECT COUNT(*) FROM \"User\";"
docker exec -it escrow_db psql -U postgres -d escrow -c "SELECT COUNT(*) FROM \"EscrowAgreement\";"
```

### Check API Health
```bash
curl http://localhost:3001/health
```

### Check Frontend
Visit: http://localhost:3000

## 📝 Common Commands

```bash
# View logs
docker-compose -f infra/docker/docker-compose.dev.yml logs -f

# Restart services
docker-compose -f infra/docker/docker-compose.dev.yml restart

# Stop services
docker-compose -f infra/docker/docker-compose.dev.yml down

# Run seed script
cd services/api && npm run seed

# Generate Prisma client
cd services/api && npm run prisma:generate

# Open Prisma Studio
cd services/api && npm run prisma:studio
```

## 🐛 Troubleshooting

### Seed Script Fails
- Check database connection
- Verify Prisma client is generated
- Check if users already exist (script uses upsert)

### Dashboard Shows No Data
- Verify seed script ran successfully
- Check API is running
- Verify authentication token
- Check browser console for errors

### API Not Responding
- Check if API container is running
- Verify database connection
- Check environment variables
- View API logs

## 📚 Documentation

- `FEATURE_FRONTEND_MAPPING.md` - Feature to frontend mapping
- `SEED_AND_TESTING_GUIDE.md` - Detailed testing guide
- `REPUTATION_SYSTEM_COMPLETE.md` - Reputation system docs
- `ADMIN_ACCESS_GUIDE.md` - Admin setup guide




