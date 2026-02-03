# Flow Completeness, Dispute Resolution & Auto-Settlement

**Date:** January 2026  
**Scope:** End-to-end escrow flow, dispute resolution with fund outcomes, payment approval, and auto-settlement when the system confirms delivery or service completion.

---

## 1. Escrow Flow Completeness

| Step | Actor | Action | API | Status |
|------|-------|--------|-----|--------|
| 1 | Buyer | Create escrow (seller email, amount, description) | `POST /escrows` | ✅ |
| 2 | Buyer | Fund escrow (wallet or Paystack) | `PUT /escrows/:id/fund` | ✅ |
| 3 | Seller | Mark shipped (tracking, carrier) | `PUT /escrows/:id/ship` | ✅ |
| 4 | Buyer | Mark delivered (goods/service received) | `PUT /escrows/:id/deliver` | ✅ |
| 5a | Buyer | Manual release | `PUT /escrows/:id/release` | ✅ |
| 5b | System | Auto-release after `autoReleaseDays` | Cron (hourly) | ✅ |
| 5c | System | **Immediate release on deliver** when `autoReleaseDays = 0` | In `deliverEscrow` | ✅ **New** |

- **Create:** Seller is resolved by email when `sellerId` contains `@` (see [REMAINING_WORK_COMPLETE.md](REMAINING_WORK_COMPLETE.md)).
- **Deliver:** Only the buyer can mark delivered. Optional **immediate auto-settlement**: if `autoReleaseDays === 0` and there is no active dispute, the system releases funds to the seller right after delivery, without waiting for the cron.

---

## 2. Auto-Settlement Options

### When system confirms “purchase received” or “service completed”

- **Purchase received:** Buyer marks **Deliver** → escrow becomes `DELIVERED`.  
  - If `autoReleaseDays = 0` and no active dispute → **immediate release** (auto-settlement).  
  - Otherwise → release after `autoReleaseDays` (default 7) via the hourly cron.

- **Service completed:** Treated like “delivery” in the current flow. The buyer confirms receipt (goods or service) via **Deliver**. The same auto-settlement rules apply (`autoReleaseDays = 0` → immediate; else scheduled).

### Configuration

- **Per escrow:** `autoReleaseDays` (default 7). Set to `0` at create time for immediate release on deliver.
- **Cron:** `EscrowSchedulerService` runs hourly and releases `DELIVERED` escrows past the release date, skipping those with active disputes.

### Implementation

- **`deliverEscrow`** (`escrow.service.ts`): After setting `DELIVERED`, if `autoReleaseDays === 0` and no open dispute, calls `releaseFunds(escrowId, 'system')` immediately.
- **`AutoReleaseService.processAutoRelease`**: Unchanged; still processes `DELIVERED` escrows after `autoReleaseDays` from `deliveredAt`.

---

## 3. Dispute Resolution with Fund Outcomes

### Previous behavior

- Admin **Resolve** only stored resolution notes. No release or refund.

### New behavior

- Admin **Resolve** requires an **outcome**:  
  - **`RELEASE_TO_SELLER`** → Release escrow funds to the seller.  
  - **`REFUND_TO_BUYER`** → Refund escrow funds to the buyer.

- Resolve **applies** the chosen outcome to the escrow (release or refund), then updates the dispute as `RESOLVED` with `resolution` (notes) and `resolutionOutcome`.

### Schema

- **`Dispute`:** New optional field `resolutionOutcome` (`RELEASE_TO_SELLER` | `REFUND_TO_BUYER`).
- **Migration:** `20260124000000_add_dispute_resolution_outcome`.

### API

- **`PUT /disputes/:id/resolve`**  
  - Body: `{ resolution: string; outcome: 'RELEASE_TO_SELLER' | 'REFUND_TO_BUYER' }`  
  - `outcome` is required.  
  - Applies release or refund, then updates the dispute.

### Backend

- **`EscrowService`:**  
  - `releaseFundsFromDispute(escrowId, adminId)`  
  - `refundEscrowFromDispute(escrowId, adminId, reason?)`  
  Both allow `DISPUTED` escrows; logic matches normal release/refund.
- **`DisputesService.resolveDispute`:** Accepts `outcome`, calls the right escrow method, then updates the dispute.
- **`DisputesModule`:** Imports `EscrowModule` and uses `EscrowService`.

### Web UI

- **`/disputes/[id]`:** Admin resolve form includes:
  - **Outcome** select: “Release to seller” | “Refund to buyer”.
  - **Resolution notes** textarea.
- **Resolve & apply funds** submits `{ resolution, outcome }`.  
- **Close only (no funds)** still uses `PUT /disputes/:id/close` (no fund movement).

---

## 4. Payment Approval (Withdrawals)

- User requests withdrawal → `POST /wallet/withdraw` (balance reserved).
- Admin approves or denies → `PUT /wallet/withdraw/:id/process` with `{ succeeded, reason? }`.
- **Approved:** Funds remain debited; ledger entry; user notified (email + SMS).
- **Denied:** Balance restored; user notified (email + SMS) with optional reason.

### Withdrawal approval notifications

- **`WalletService.processWithdrawal`** now calls:
  - **Approved:** `NotificationsService.sendWithdrawalApprovedNotifications({ email, phone, amount, currency })`
  - **Denied:** `NotificationsService.sendWithdrawalDeniedNotifications({ email, phone, amount, currency, reason })`
- User `email` and `phone` come from `withdrawal.wallet.user` (include in query).
- **`WalletModule`** imports **`NotificationsModule`** and injects **`NotificationsService`**.

---

## 5. Summary of Code Changes

| Area | Changes |
|------|---------|
| **Prisma** | `DisputeResolutionOutcome` enum; `Dispute.resolutionOutcome`; migration `20260124000000_add_dispute_resolution_outcome` |
| **Escrow** | `releaseFundsFromDispute`, `refundEscrowFromDispute`; immediate release in `deliverEscrow` when `autoReleaseDays = 0` |
| **Disputes** | `resolveDispute` accepts `outcome`, applies release/refund; controller validates `outcome` |
| **DisputesModule** | Imports `EscrowModule` |
| **Wallet** | `processWithdrawal` sends approval/denial notifications; `WalletModule` imports `NotificationsModule`; withdrawal fetch includes `wallet.user` |
| **Web dispute detail** | Resolve form: outcome select + notes; display `resolutionOutcome` and `resolution` when resolved |

---

## 6. Running Migrations

```bash
cd services/api
pnpm install   # or npm install
pnpm exec prisma migrate deploy   # or npm run prisma:deploy
pnpm exec prisma generate         # or npm run prisma:generate
```

---

## 7. Optional Next Steps

- **Service-only escrows:** Add “Mark service completed” by seller, then “Confirm” by buyer, if you want a distinct service flow separate from physical delivery.
- **Platform default `autoReleaseDays`:** Add a setting (e.g. in fee config) to default new escrows to `0` (immediate) or `7` (scheduled).
- **Partial refunds:** Extend `DisputeResolutionOutcome` and refund logic to support partial amounts.

---

**Last updated:** January 2026
