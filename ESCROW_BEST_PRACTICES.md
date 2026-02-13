# MYXCROW Escrow Best Practices

Industry-aligned practices implemented for reliable, secure escrow operations.

---

## 1. Fund Movement Order (Wallet-First)

**Practice:** Credit/debit wallets before updating escrow status and creating ledger entries.

**Why:** If wallet operations fail, we avoid marking the escrow as released/refunded while funds never moved. Status is only updated after money has moved.

**Implementation:**
- `releaseFunds`: Wallet credit → Ledger → Status update
- `refundEscrow` / `refundEscrowFromDispute`: Wallet credit → Ledger → Status update

---

## 2. Idempotency

**Practice:** Critical operations (fund, release, refund) are idempotent. Calling them when already applied returns success without side effects.

**Why:** Prevents double-spend from retries, duplicate clicks, or network issues.

**Implementation:**
- `fundEscrow`: If status is FUNDED, return escrow
- `releaseFunds` / `releaseFundsFromDispute`: If status is RELEASED, return escrow
- `refundEscrow` / `refundEscrowFromDispute`: If status is REFUNDED, return escrow

---

## 3. Dispute Freeze

**Practice:** No release of funds while an active dispute exists.

**Why:** Protects both parties; funds stay held until dispute is resolved.

**Implementation:**
- Manual `releaseFunds`: Explicit check for active disputes (OPEN, NEGOTIATION, MEDIATION, ARBITRATION)
- Auto-release cron: Skips escrows with active disputes
- Immediate release on delivery: Checks for disputes before releasing

---

## 4. Wallet Fallback for Legacy Escrows

**Practice:** When `sellerWalletId` or `buyerWalletId` is null at release/refund, create or fetch the wallet and link it before crediting.

**Why:** Handles escrows created before wallet-only flow or migrated from direct payment.

**Implementation:**
- Release: `getOrCreateWallet(sellerId)` if `sellerWalletId` is null
- Refund: `getOrCreateWallet(buyerId)` if `buyerWalletId` is null and escrow was funded

---

## 5. Ledger Only When Funds Moved

**Practice:** Create refund ledger entries only when funds were actually held (escrow was funded).

**Why:** Avoids ledger entries for unfunded escrows (e.g. dispute refund of AWAITING_FUNDING).

**Implementation:**
- `refundEscrowFromDispute`: Ledger + wallet credit only when `fundedAt` is set

---

## 6. Auto-Release When Complete + No Dispute

**Practice:** Auto-release funds when transaction is complete (DELIVERED or AWAITING_RELEASE) and no active dispute.

**Why:** Reduces manual steps; aligns with industry “release on acceptance” patterns.

**Implementation:**
- Default `autoReleaseDays = 0` for immediate release on completion
- Cron processes completed escrows, skips those with active disputes

---

## 7. Audit Trail & PII Protection

**Practice:** All fund movements are logged; PII is masked in audit logs.

**Why:** Supports compliance, dispute resolution, and fraud investigation.

**Implementation:**
- `AuditService.log` for fund, release, refund
- PII masking (email, phone, names) in audit details

---

## 8. Buyer/Seller Protection

**Practice:** Funds are held until buyer confirms delivery or service completion; seller is paid only after fulfillment.

**Why:** Mirrors Escrow.com-style protection for both sides.

**Implementation:**
- Buyer funds → held in escrow
- Seller ships / completes service
- Buyer confirms delivery → release (manual or auto)
- Disputes block release until admin resolution

---

## Summary

| Practice              | Status |
|-----------------------|--------|
| Wallet-first order    | ✅     |
| Idempotency           | ✅     |
| Dispute freeze        | ✅     |
| Wallet fallback       | ✅     |
| Ledger when funded    | ✅     |
| Auto-release          | ✅     |
| Audit + PII masking   | ✅     |
| Buyer/seller protection | ✅   |
