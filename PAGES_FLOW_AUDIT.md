# Pages, Menus & Transaction Flow Audit

**Date:** January 2026  
**Scope:** Web + mobile pages, nav links, transaction flow (DB ↔ API ↔ frontends)

---

## 1. Pages & Dashboards

### Web

| Page | Exists | Nav Link | Notes |
|------|--------|----------|--------|
| `/` | ✅ | — | Landing |
| `/login` | ✅ | — | Auth |
| `/register` | ✅ | — | Auth |
| `/dashboard` | ✅ | ✅ Nav | User dashboard |
| `/admin` | ✅ | ✅ Nav (admin) | Admin dashboard |
| `/admin/users` | ✅ | ✅ Nav | User management |
| `/admin/kyc-review` | ✅ | ✅ Nav | KYC review |
| `/admin/withdrawals` | ✅ | ✅ Nav | Withdrawal approvals |
| `/admin/reconciliation` | ✅ | ✅ Nav | Reconciliation |
| `/admin/fees` | ✅ | ✅ Nav **(added)** | Fee config |
| `/admin/settings` | ✅ | ✅ Nav | Platform settings |
| `/admin/wallet/credit` | ✅ | Admin index, users | Credit wallet |
| `/admin/wallet/debit` | ✅ | Admin index | Debit wallet |
| `/escrows` | ✅ | ✅ Nav | Escrow list |
| `/escrows/new` | ✅ | Dashboard, escrows | Create escrow |
| `/escrows/[id]` | ✅ | Escrow list, detail | Escrow detail |
| `/escrows/[id]/evidence` | ✅ | Escrow detail | Evidence |
| `/disputes` | ✅ | ✅ Nav | Dispute list |
| `/disputes/new` | ✅ | Escrow detail | Create dispute |
| `/disputes/[id]` | ✅ | Dispute list | Dispute detail |
| `/wallet` | ✅ | ✅ Nav | Wallet overview |
| `/wallet/topup` | ✅ **(added)** | Wallet page | Top-up via Paystack |
| `/wallet/topup/callback` | ✅ **(added)** | Paystack redirect | Verify top-up |
| `/wallet/withdraw` | ✅ | Wallet page | Request withdrawal |
| `/wallet/admin/[userId]` | ✅ **(added)** | Admin users “View Wallet” | Admin view user wallet |
| `/profile` | ✅ | ✅ Nav | User profile |
| `/profile/[userId]` | ✅ | UserProfileLink | User profile by ID |
| `404` / `500` | ✅ | — | Error pages |

### Mobile

| Screen | Exists | Access | Notes |
|--------|--------|--------|--------|
| `(auth)/login` | ✅ | — | Auth |
| `(auth)/register` | ✅ | — | Auth |
| `(tabs)/dashboard` | ✅ | Tab | Dashboard |
| `(tabs)/escrows/index` | ✅ | Tab | Escrow list |
| `(tabs)/escrows/new` | ✅ | Escrows + | Create escrow |
| `(tabs)/escrows/[id]` | ✅ | Escrow list | Escrow detail |
| `(tabs)/wallet` | ✅ | Tab | Wallet |
| `(tabs)/wallet/topup` | ✅ | Wallet | Top-up via Paystack |
| `(tabs)/wallet/withdraw` | ✅ **(added)** | Wallet | Request withdrawal |
| `(tabs)/profile` | ✅ | Tab | Profile |
| `(tabs)/profile/index` | ✅ | — | Profile (nested) |

---

## 2. Menus & Links

### Web Navigation

- **User:** Dashboard, Escrows, Wallet, Disputes, Profile, Logout.
- **Admin (extra):** Admin, Users, KYC, Withdrawals, Reconciliation, **Fees** **(added)**, Settings.
- **Wallet:** Top Up **(added)**, Request Withdrawal, (Admin Panel for admins).
- **Admin users:** Credit Wallet → `/admin/wallet/credit?userId=...`, View Wallet → `/wallet/admin/[userId]` **(page added)**.

### Mobile

- **Tabs:** Dashboard, Escrows, Wallet, Profile.
- **Wallet:** Top Up → `/(tabs)/wallet/topup`, Withdraw → `/(tabs)/wallet/withdraw` **(screen added)**.
- **Escrows:** List → detail → new; detail → Fund / Ship / Deliver / Release, Create Dispute.

All main user and admin entry points are reachable from nav or in-app links.

---

## 3. Transaction Flow (DB ↔ API ↔ Frontends)

### Escrow lifecycle

1. **Create**  
   - Web: `POST /escrows` (form).  
   - Mobile: `POST /escrows` (form).  
   - API: `EscrowController.create` → `EscrowService.createEscrow` → Prisma `escrowAgreement` + notifications.  
   - ✅ Implemented end-to-end.

2. **Fund**  
   - Web: `PUT /escrows/:id/fund` (useWallet).  
   - Mobile: `PUT /escrows/:id/fund` (useWallet).  
   - API: `fund` → `fundEscrow` → ledger + notifications.  
   - ✅ Implemented.

3. **Ship**  
   - Web: `PUT /escrows/:id/ship` (tracking).  
   - Mobile: `PUT /escrows/:id/ship` (tracking).  
   - API: `ship` → `shipEscrow` → notifications.  
   - ✅ Implemented.

4. **Deliver**  
   - Web: `PUT /escrows/:id/deliver`.  
   - Mobile: `PUT /escrows/:id/deliver`.  
   - API: `deliver` → `deliverEscrow` → notifications.  
   - ✅ Implemented.

5. **Release**  
   - Web: `PUT /escrows/:id/release`.  
   - Mobile: `PUT /escrows/:id/release`.  
   - API: `release` → `releaseFunds` → ledger + notifications.  
   - ✅ Implemented.

Same DB, same API; web and mobile both use these endpoints. Flow is consistent.

### Wallet

- **Balance:** `GET /wallet` (web + mobile).  
- **Top-up:**  
  - Web: `/wallet/topup` → `POST /payments/wallet/topup` → redirect to Paystack → `/wallet/topup/callback` → `GET /payments/wallet/topup/verify/:reference` → back to `/wallet`.  
  - Mobile: `/(tabs)/wallet/topup` → same API → WebView Paystack → verify → back.  
- **Withdraw:**  
  - Web: `/wallet/withdraw` → `POST /wallet/withdraw`.  
  - Mobile: `/(tabs)/wallet/withdraw` **(added)** → `POST /wallet/withdraw`.  
- **Transactions:**  
  - Web: `GET /wallet/funding-history`, `GET /wallet/withdrawal-history`.  
  - Mobile: `GET /wallet/transactions` **(added)** → merged funding + withdrawals, normalized for list.

### Disputes

- Create: `POST /disputes` (web + mobile).  
- List: `GET /disputes` (web + mobile).  
- Detail: `GET /disputes/:id` (web + mobile).  
- ✅ All wired to API and DB.

### Admin

- Users, KYC, withdrawals, reconciliation, fees, settings, wallet credit/debit, **view user wallet** (`/wallet/admin/[userId]`) all hit admin or wallet admin API routes.  
- ✅ Implemented and linked.

---

## 4. Fixes Applied This Audit

| Issue | Fix |
|-------|-----|
| Mobile `GET /wallet/transactions` 404 | Added `GET /wallet/transactions` in `WalletController`, returns merged funding + withdrawals for current user. |
| Mobile wallet withdraw missing | Added `(tabs)/wallet/withdraw.tsx` and nav from Wallet. |
| Admin “View Wallet” 404 | Added `pages/wallet/admin/[userId].tsx`, fetch `GET /wallet/admin/:userId`. |
| Web wallet no top-up | Added `pages/wallet/topup.tsx`, `pages/wallet/topup/callback.tsx`, “Top Up” on Wallet page. |
| Admin Fees not in nav | Added “Fees” to admin nav (desktop + mobile menu). |

---

## 5. Next Steps

### Recommended (short term)

1. **End-to-end tests**  
   - Escrow: create → fund → ship → deliver → release (web + mobile).  
   - Wallet: top-up (Paystack test), withdraw request, transaction list.

2. **Web withdraw `methodType`**  
   - Web form uses `BANK_TRANSFER`; API/Prisma use `BANK_ACCOUNT`.  
   - Align web form with `BANK_ACCOUNT` (or add mapping) so withdrawals succeed.

3. **Escrow create seller**  
   - Backend expects `sellerId` (user ID).  
   - Mobile sends seller email.  
   - Either resolve email → userId in API, or add a “resolve seller by email” step before create.

### Optional

4. **Mobile wallet layout**  
   - `wallet/_layout` references `index` but `wallet/index` is missing; main wallet is `(tabs)/wallet`.  
   - Confirm expo-router behavior and remove or fix the `index` reference if it causes issues.

5. **`WEB_BASE_URL`** ✅  
   - Added to `.env.example`. Wallet top-up callback uses `WEB_BASE_URL || WEB_APP_URL || 'http://localhost:3003'`.  
   - See [REMAINING_WORK_COMPLETE.md](REMAINING_WORK_COMPLETE.md).

---

## 6. Summary

- **Pages:** All required web and mobile pages exist; admin “View Wallet” and web top-up + callback were added.  
- **Menus:** Nav links for user, admin, wallet, and Fees are correct; “View Wallet” and withdraw are reachable.  
- **Transaction flow:** Escrow create → fund → ship → deliver → release and wallet top-up/withdraw/transactions are implemented and communicating with the same DB and API from both web and mobile.  
- **Remaining work:** Optional E2E tests and mobile wallet layout check. Web `methodType`, seller resolution, `WEB_BASE_URL`, and escrow unit tests are done (see [REMAINING_WORK_COMPLETE.md](REMAINING_WORK_COMPLETE.md)).

---

**Last updated:** January 2026
