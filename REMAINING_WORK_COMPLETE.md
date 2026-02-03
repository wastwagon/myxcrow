# Remaining Work Complete

**Date:** January 2026  
**Scope:** Fixes and additions from [PAGES_FLOW_AUDIT.md](PAGES_FLOW_AUDIT.md) remaining work.

---

## 1. Web Withdraw `methodType` Fix

**Issue:** Web form used `BANK_TRANSFER`; API/Prisma expect `BANK_ACCOUNT`.

**Changes:**
- `apps/web/pages/wallet/withdraw.tsx`:
  - Schema: `methodType` enum `['BANK_TRANSFER', 'MOBILE_MONEY']` → `['BANK_ACCOUNT', 'MOBILE_MONEY']`.
  - Mutation: use `BANK_ACCOUNT` when bank transfer is selected.
  - UI: option value `BANK_TRANSFER` → `BANK_ACCOUNT` (label remains "Bank Transfer").
  - Conditional: `methodType === 'BANK_TRANSFER'` → `'BANK_ACCOUNT'`.
  - Form `defaultValues`: `methodType: 'BANK_ACCOUNT'`.

Withdrawals from web now align with the API.

---

## 2. Escrow Create – Seller Resolution by Email

**Issue:** Backend expected `sellerId` (user ID); web/mobile send seller email.

**Changes:**
- `services/api/src/modules/escrow/escrow.service.ts`:
  - `createEscrow` accepts `sellerEmail` (optional) and treats `sellerId` as email when it contains `@`.
  - If `sellerEmail` is set, or `sellerId` looks like email:
    - Look up user by `email` (trimmed, lowercased).
    - Use `user.id` as `sellerId` for the rest of the flow.
  - If no user found → `NotFoundException` with message:  
    `Seller not found with email: … . They must register first.`
  - If `sellerId` is not an email (no `@`), it is used as user ID unchanged.

Web and mobile can keep sending seller email; the API resolves it to `sellerId`.

---

## 3. `WEB_BASE_URL` and Paystack Callback Fallback

**Issue:** Paystack callback used `WEB_BASE_URL`; only `WEB_APP_URL` was documented.

**Changes:**
- `.env.example`:
  - Added `WEB_BASE_URL=http://localhost:3003` with a short comment (Paystack callback, CORS, etc., fallback to `WEB_APP_URL` if unset).
- `services/api/src/modules/payments/wallet-topup.service.ts`:
  - Callback URL logic:  
    `WEB_BASE_URL || WEB_APP_URL || 'http://localhost:3003'`  
    so existing setups with only `WEB_APP_URL` still work.

---

## 4. API Unit Tests (Escrow Service)

**Added:**
- `services/api/jest.config.js`: Jest config for `src` (ts-jest, `*.spec.ts`).
- `services/api/src/modules/escrow/escrow.service.spec.ts`:
  - **Resolve seller by email:** when `sellerId` is an email, `createEscrow` calls `user.findUnique` by email and uses the returned user ID in the escrow.
  - **Unknown seller email:** when email has no matching user, `createEscrow` throws `NotFoundException` and does not create an escrow.
  - **Use `sellerId` as user ID:** when `sellerId` has no `@`, no email lookup; `sellerId` is used as-is.

**Run tests:**
```bash
cd services/api && pnpm test
# or
cd services/api && npm test
```

---

## 5. Summary

| Item | Status |
|------|--------|
| Web withdraw `methodType` → `BANK_ACCOUNT` | Done |
| Seller resolution by email in escrow create | Done |
| `WEB_BASE_URL` in `.env.example` + callback fallback | Done |
| Escrow service unit tests | Done |

---

**Last updated:** January 2026
