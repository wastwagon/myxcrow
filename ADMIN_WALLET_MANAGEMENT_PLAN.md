# Admin Wallet Management - Implementation Plan

## Overview

Since Paystack is not yet available, we need to add manual wallet management capabilities for admins to:
- **Credit** user wallets (manual top-up)
- **Debit** user wallets (manual deduction/refund)
- View wallet transaction history
- Manage wallet balances

## Proposed Features

### 1. Admin Wallet Management Endpoints

#### Credit Wallet (Manual Top-up)
```
POST /api/admin/wallet/credit
- userId: string
- amountCents: number
- currency: string (default: GHS)
- description: string (optional)
- reference: string (optional)
```

**What it does:**
- Adds funds to user's available balance
- Creates a WalletFunding record with sourceType: ADJUSTMENT
- Creates ledger entry
- Logs audit trail

#### Debit Wallet (Manual Deduction)
```
POST /api/admin/wallet/debit
- userId: string
- amountCents: number
- currency: string (default: GHS)
- description: string (required)
- reference: string (optional)
```

**What it does:**
- Deducts funds from user's available balance
- Creates a WalletFunding record with sourceType: ADJUSTMENT (negative amount)
- Creates ledger entry
- Logs audit trail
- Validates sufficient balance before deduction

#### Get User Wallet
```
GET /api/admin/wallet/:userId
- Returns wallet balance, funding history, withdrawal history
```

#### List All Wallets
```
GET /api/admin/wallets
- Query params: userId, email, minBalance, maxBalance
- Returns list of all user wallets with balances
```

#### Get Wallet Transactions
```
GET /api/admin/wallet/:userId/transactions
- Returns all funding and withdrawal transactions for a user
```

### 2. Implementation Details

#### WalletService Methods to Add:
```typescript
async creditWallet(data: {
  userId: string;
  amountCents: number;
  currency?: string;
  description?: string;
  reference?: string;
  adminId: string;
})

async debitWallet(data: {
  userId: string;
  amountCents: number;
  currency?: string;
  description: string;
  reference?: string;
  adminId: string;
})
```

#### WalletController - New Admin Endpoints:
- `POST /admin/wallet/credit` - Credit wallet
- `POST /admin/wallet/debit` - Debit wallet
- `GET /admin/wallet/:userId` - Get user wallet
- `GET /admin/wallets` - List all wallets
- `GET /admin/wallet/:userId/transactions` - Get transactions

### 3. Security & Validation

- **Authorization**: Admin-only (RolesGuard with ADMIN role)
- **Validation**: 
  - Check user exists
  - Validate amount > 0
  - For debit: Check sufficient balance
  - Required description for debit operations
- **Audit Logging**: All credit/debit operations logged
- **Ledger Entries**: All transactions recorded in ledger

### 4. WalletFunding Record

For manual adjustments:
- `sourceType`: ADJUSTMENT
- `status`: SUCCEEDED (immediate)
- `externalRef`: Optional reference number
- `metadata`: Store admin ID, description, etc.

## Questions for Clarification

1. **Debit Validation**: Should we allow negative balances, or always require sufficient balance?

2. **Currency**: Should we support multiple currencies, or just GHS for now?

3. **Reference System**: Do you want a reference number system for tracking manual transactions?

4. **Transaction Limits**: Any limits on credit/debit amounts?

5. **Notification**: Should users be notified via email when their wallet is credited/debited?

6. **Approval Workflow**: Do you need a two-step approval (request → approve) or direct credit/debit?

## Proposed Implementation Order

1. Add `creditWallet` and `debitWallet` methods to WalletService
2. Add admin endpoints to WalletController
3. Add proper authorization guards
4. Add validation and error handling
5. Add audit logging
6. Test the functionality

## Example Usage

```typescript
// Credit user wallet (manual top-up)
POST /api/admin/wallet/credit
{
  "userId": "user-id-here",
  "amountCents": 10000,  // 100 GHS
  "description": "Manual top-up - Bank transfer received",
  "reference": "BANK-TXN-12345"
}

// Debit user wallet (refund/chargeback)
POST /api/admin/wallet/debit
{
  "userId": "user-id-here",
  "amountCents": 5000,  // 50 GHS
  "description": "Refund for cancelled order",
  "reference": "REFUND-12345"
}
```

## Does this approach work for you?

Please confirm:
1. ✅ This approach is correct
2. Any changes or additions needed
3. Answers to the clarification questions above

Once confirmed, I'll implement it!




