# Seed Script & Testing Guide

## 🌱 Seed Script Overview

The seed script creates 10 test users and various transactions to test all platform features.

### Created Users

**Buyers (5 users):**
- buyer1@test.com - John Buyer
- buyer2@test.com - Mike Customer
- buyer3@test.com - David Client
- buyer4@test.com - Chris Purchaser
- buyer5@test.com - Tom Acquirer

**Sellers (5 users):**
- seller1@test.com - Jane Seller
- seller2@test.com - Sarah Merchant
- seller3@test.com - Emma Vendor
- seller4@test.com - Lisa Provider
- seller5@test.com - Anna Supplier

**Password for all users:** `password123`

### Created Data

1. **10 Users** - 5 buyers, 5 sellers (all verified KYC)
2. **10 Wallets** - One for each user
3. **8 Escrows** with different statuses:
   - 1 AWAITING_FUNDING
   - 1 FUNDED
   - 1 SHIPPED
   - 1 DELIVERED
   - 1 RELEASED (completed)
   - 1 DISPUTED
   - 1 CANCELLED
   - 1 Milestone escrow (FUNDED with 3 milestones)
4. **3 Escrow Messages** - Sample conversations
5. **2 Evidence Records** - Uploaded files
6. **1 Withdrawal Request** - Pending approval

## 🚀 Running the Seed Script

### Option 1: Using npm script (Recommended)
```bash
cd services/api
npm run seed
```

### Option 2: Using bash wrapper
```bash
cd services/api
npm run seed:bash
```

### Option 3: Direct execution
```bash
cd services/api
tsx scripts/seed-users-and-transactions.ts
```

**Note:** Make sure you have:
- Node.js installed
- Database running and accessible
- Prisma client generated (`npm run prisma:generate`)

## 📊 Testing Checklist

### User Dashboard Tests

1. **Login as buyer1@test.com**
   - ✅ Should see wallet balance (500 GHS)
   - ✅ Should see active escrows count
   - ✅ Should see recent escrows list
   - ✅ Should see "AWAITING_FUNDING" escrow

2. **Login as seller1@test.com**
   - ✅ Should see wallet balance
   - ✅ Should see escrows where they are seller
   - ✅ Should see "RELEASED" escrow with funds

3. **Login as buyer2@test.com**
   - ✅ Should see "FUNDED" escrow
   - ✅ Should see pending balance

### Admin Dashboard Tests

1. **Login as admin@myxcrow.com**
   - ✅ Should see total escrows: 8
   - ✅ Should see total users: 10+ (including admin)
   - ✅ Should see total value in GHS
   - ✅ Should see open disputes: 1
   - ✅ Should see recent escrows
   - ✅ Should see recent disputes

### Feature Testing

#### Escrow Features
- [ ] Create new escrow
- [ ] Fund escrow (AWAITING_FUNDING → FUNDED)
- [ ] Mark as shipped (FUNDED → SHIPPED)
- [ ] Confirm delivery (SHIPPED → DELIVERED)
- [ ] Release funds (DELIVERED → RELEASED)
- [ ] View milestone escrow
- [ ] Complete milestone
- [ ] View escrow messages
- [ ] Upload evidence
- [ ] View activity timeline
- [ ] View ledger entries

#### Dispute Features
- [ ] View open dispute
- [ ] Add dispute message
- [ ] Upload dispute evidence
- [ ] Resolve dispute (admin)

#### Wallet Features
- [ ] View wallet balance
- [ ] View transaction history
- [ ] Request withdrawal
- [ ] Admin: Credit wallet
- [ ] Admin: Debit wallet

#### Reputation Features
- [ ] View public profile
- [ ] Rate completed escrow
- [ ] View reputation score
- [ ] View ratings breakdown

## 🔍 Dashboard Data Verification

### User Dashboard (`/dashboard`)

**Data Sources:**
- Wallet: `GET /wallet` ✅
- Escrows: `GET /escrows` ✅
- Active count: Calculated from escrows ✅

**Expected Data:**
- Available Balance: From wallet.availableCents
- Pending Balance: From wallet.pendingCents
- Active Escrows: Count of non-RELEASED/CANCELLED escrows
- Recent Escrows: First 5 escrows from API

### Admin Dashboard (`/admin`)

**Data Sources:**
- Escrows: `GET /escrows` ✅
- Disputes: `GET /disputes` ✅
- Users: `GET /users?limit=100` ✅
- Wallets: `GET /wallet/admin?limit=100` ✅

**Expected Data:**
- Total Escrows: Count from API
- Total Value: Sum of all escrow.amountCents
- Open Disputes: Count of OPEN status disputes
- Total Users: From users API response
- Active Users: Count of isActive=true users
- Total Wallet Balance: Sum of all wallet.availableCents

## 🐛 Troubleshooting

### Seed Script Fails

1. **Database Connection Error**
   ```bash
   # Check DATABASE_URL in .env
   # Verify database is running
   docker ps | grep postgres
   ```

2. **Prisma Client Not Generated**
   ```bash
   cd services/api
   npm run prisma:generate
   ```

3. **TypeScript Errors**
   ```bash
   # Install tsx if not available
   npm install -g tsx
   # Or use ts-node
   npm install -g ts-node typescript
   ```

### Dashboard Shows No Data

1. **Check API Endpoints**
   - Verify API is running
   - Check browser console for errors
   - Verify authentication token

2. **Check Database**
   - Verify seed script ran successfully
   - Check if data exists in database
   ```bash
   docker exec -it escrow_db psql -U postgres -d escrow -c "SELECT COUNT(*) FROM \"User\";"
   ```

3. **Check API Responses**
   - Use browser DevTools Network tab
   - Verify API returns correct data
   - Check for CORS errors

## 📝 Notes

- All users have the same password: `password123`
- All users are KYC verified
- Wallets are pre-funded for buyers
- Escrows span different statuses for testing
- One dispute is created for testing dispute workflow
- Milestone escrow has 3 milestones (1 completed, 2 pending)

## 🎯 Next Steps After Seeding

1. **Test User Flows**
   - Complete an escrow end-to-end
   - Create and resolve a dispute
   - Test wallet operations

2. **Test Admin Features**
   - Credit/debit wallets
   - Approve withdrawals
   - View audit logs

3. **Test Advanced Features**
   - Milestone management
   - Reputation system
   - Messaging system

4. **Verify Dashboards**
   - Check all metrics display correctly
   - Verify calculations are accurate
   - Test filtering and sorting




