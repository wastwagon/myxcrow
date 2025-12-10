# Test Accounts - Quick Reference

## 🔑 All Test Users

**Password for all users:** `password123`

### Buyers (5 users)

| Email | Name | Wallet Balance |
|-------|------|----------------|
| buyer1@test.com | John Buyer | 500 GHS |
| buyer2@test.com | Mike Customer | 1000 GHS |
| buyer3@test.com | David Client | 750 GHS |
| buyer4@test.com | Chris Purchaser | 1500 GHS |
| buyer5@test.com | Tom Acquirer | 2000 GHS |

### Sellers (5 users)

| Email | Name | Wallet Balance |
|-------|------|----------------|
| seller1@test.com | Jane Seller | 0 GHS (has released escrow) |
| seller2@test.com | Sarah Merchant | 0 GHS |
| seller3@test.com | Emma Vendor | 0 GHS |
| seller4@test.com | Lisa Provider | 0 GHS |
| seller5@test.com | Anna Supplier | 0 GHS |

## 📦 Test Escrows

### Escrow Statuses Created:

1. **AWAITING_FUNDING** (buyer1 ↔ seller1)
   - Amount: 500 GHS
   - Description: "Laptop Purchase - Awaiting Payment"

2. **FUNDED** (buyer2 ↔ seller2)
   - Amount: 1000 GHS
   - Description: "Smartphone Sale - Payment Received"

3. **SHIPPED** (buyer3 ↔ seller3)
   - Amount: 750 GHS
   - Description: "Electronics Bundle - Shipped"

4. **DELIVERED** (buyer4 ↔ seller4)
   - Amount: 1500 GHS
   - Description: "Furniture Set - Delivered"

5. **RELEASED** (buyer1 ↔ seller2) ✅ Completed
   - Amount: 800 GHS
   - Description: "Camera Equipment - Completed"

6. **DISPUTED** (buyer5 ↔ seller5)
   - Amount: 1200 GHS
   - Description: "Gaming Console - Under Dispute"

7. **CANCELLED** (buyer3 ↔ seller4)
   - Amount: 600 GHS
   - Description: "Cancelled Order"

8. **Milestone Escrow** (buyer2 ↔ seller3)
   - Amount: 2000 GHS
   - Description: "Website Development Project"
   - Status: FUNDED
   - Milestones: 3 (1 completed, 2 pending)

## 🧪 Testing Scenarios

### Scenario 1: Complete Escrow Flow
1. Login as `buyer1@test.com`
2. View escrow "Laptop Purchase" (AWAITING_FUNDING)
3. Fund the escrow
4. Login as `seller1@test.com`
5. Mark as shipped
6. Login as `buyer1@test.com`
7. Confirm delivery
8. Release funds

### Scenario 2: Test Dispute
1. Login as `buyer5@test.com`
2. View escrow "Gaming Console" (DISPUTED)
3. View dispute details
4. Add dispute message
5. Login as admin
6. Resolve dispute

### Scenario 3: Test Milestones
1. Login as `buyer2@test.com`
2. View escrow "Website Development Project"
3. View milestones tab
4. Complete pending milestone
5. Release milestone payment

### Scenario 4: Test Reputation
1. Login as `buyer1@test.com`
2. View completed escrow "Camera Equipment"
3. Rate seller
4. View seller's public profile
5. Check reputation score

### Scenario 5: Test Admin Features
1. Login as admin
2. View admin dashboard
3. Credit wallet for a user
4. View all escrows
5. Approve withdrawal request
6. View user list

## 🔍 Quick Verification

### Check if seed worked:
```bash
cd services/api
npm run seed:verify
```

### Check specific data:
```bash
# Check users
docker exec -it escrow_db psql -U postgres -d escrow -c "SELECT email, role FROM \"User\" LIMIT 10;"

# Check escrows
docker exec -it escrow_db psql -U postgres -d escrow -c "SELECT description, status FROM \"EscrowAgreement\" LIMIT 10;"

# Check wallets
docker exec -it escrow_db psql -U postgres -d escrow -c "SELECT \"availableCents\", \"pendingCents\" FROM \"Wallet\" LIMIT 10;"
```

## 📝 Notes

- All users are KYC verified
- All users are active
- Buyers have pre-funded wallets
- Sellers receive funds when escrows are released
- One dispute is already created for testing
- One withdrawal request is pending approval




