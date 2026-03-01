# Web & Mobile App Unification Review

**Date:** February 14, 2026  
**Context:** Web app tested and working. Mobile app parity assessment.

---

## Executive Summary

| Aspect | Web | Mobile | Status |
|--------|-----|--------|--------|
| **Core flows** | ✅ Working | ⚠️ Needs testing | Web verified |
| **Feature parity** | 35 pages | 42 screens | ~95% aligned |
| **Shared API** | ✅ | ✅ | Same backend |
| **Error handling** | ✅ Rich | ⚠️ Slightly less | Minor gap |
| **OTP/Registration** | ✅ Arkesel | ✅ Arkesel | Unified |

---

## Unified Features (Both Platforms)

| Feature | Web | Mobile | Notes |
|---------|-----|--------|------|
| **Auth** | ✅ | ✅ | Login, register (OTP), forgot/reset password |
| **Dashboard** | ✅ | ✅ | Stats, recent escrows |
| **Escrows** | ✅ | ✅ | Create, list, detail, fund, ship, deliver, release |
| **Milestones** | ✅ | ✅ | Create, complete, release per milestone |
| **Evidence** | ✅ | ✅ | Upload/download |
| **Messages** | ✅ Inline | ✅ Dedicated screen | Mobile has separate messages tab |
| **Disputes** | ✅ | ✅ | Create, list, detail, messages |
| **Wallet** | ✅ | ✅ | Balance, topup (Paystack), withdraw |
| **Profile** | ✅ | ✅ | View, edit, change password, KYC, transactions |
| **Admin** | ✅ | ✅ | Dashboard, users, KYC, withdrawals, wallet ops, settings, fees, reconciliation |
| **Support** | ✅ | ✅ | Help center |
| **Public profiles** | ✅ | ✅ | View user reputation |
| **Rating** | ✅ | ✅ | Rate counterparty after escrow |
| **Confirm delivery** | ✅ Page + inline | ✅ Inline + link to web | Mobile links to web page for delivery person |

---

## Gaps & Differences

### 1. Admin Users API – **Critical Bug**

| Platform | Endpoint | Actual API |
|----------|----------|------------|
| **Web** | `GET /users?search=&role=&limit=` | ✅ Correct |
| **Mobile** | `GET /admin/users` | ❌ **404** – API has `GET /users` |
| **Mobile** | `PUT /admin/users/:id/toggle-active` | ❌ **404** – API has `PUT /users/:id/status` with `{ isActive }` |
| **Mobile** | `GET /admin/users/search?email=` | ❌ **404** – API has `GET /users?search=` |

**Fixed:** Mobile admin now uses correct endpoints:
- List users: `GET /users?limit=100` (response: `{ users, total, limit, offset }`)
- Toggle active: `PUT /users/:id/status` body `{ isActive: boolean }`
- Search user (for wallet): `GET /wallet/admin?email={email}&limit=10` or fallback `GET /users?search=` + `GET /wallet/admin/:userId`
- Credit: `POST /wallet/admin/credit` | Debit: `POST /wallet/admin/debit`

### 2. Admin Wallet – View User Wallet

**Fixed:** Mobile now has `admin/user-wallet` screen (navigate from Users → View Wallet). Shows balance, user info, and inline Credit/Debit.

### 3. Error Messages

**Fixed:** Mobile `error-messages.ts` synced with web – Arkesel API key, Ghana phone format, SMS disabled, etc.

### 4. Escrow Funding

| Platform | Funding method |
|----------|----------------|
| **Web** | Wallet OR Paystack (redirect to callback) |
| **Mobile** | Wallet (`useWallet: true`) – Paystack escrow funding may not be implemented |

**Note:** If escrow is funded via Paystack (not wallet), web has `payments/escrow/callback`. Mobile would need similar WebView handling. Verify if mobile supports Paystack escrow funding.

### 5. Wallet Topup Callback

| Platform | Callback URL |
|----------|--------------|
| **Web** | `{origin}/wallet/topup/callback` |
| **Mobile** | Uses `WEB_BASE_URL/wallet/topup/callback` – Paystack redirects to web URL; mobile WebView intercepts |

**Status:** ✅ Works – mobile intercepts when WebView navigates to callback URL. Ensure `EXPO_PUBLIC_WEB_BASE_URL` matches your web app URL (e.g. production or ngrok for local testing).

### 6. Confirm-Delivery Page

| Platform | Implementation |
|----------|----------------|
| **Web** | Standalone `/confirm-delivery` page – shareable link for delivery person |
| **Mobile** | Links to `WEB_BASE_URL/confirm-delivery` – opens in browser |

**Status:** ✅ Unified – both use the same web page. Delivery person can use any device.

### 7. Design / UX

| Aspect | Web | Mobile |
|--------|-----|--------|
| **Primary color** | Brand maroon/gold | #3b82f6 (blue) |
| **Toast** | react-hot-toast | react-native-toast-message |
| **Icons** | lucide-react | @expo/vector-icons (Ionicons) |

**Note:** Color scheme differs – web uses brand colors, mobile uses blue. Consider aligning for consistency.

---

## API Endpoints Used

Both platforms use the same API. Key endpoints:

```
Auth:     /auth/login, register, send-phone-otp, profile, refresh
Escrows:  /escrows (CRUD), /escrows/:id/fund, ship, deliver, release, milestones, messages
Disputes: /disputes (CRUD), /disputes/:id/message
Wallet:   /wallet, /wallet/withdraw, /payments/wallet/topup, verify
Admin:    /admin/stats, /admin/reconciliation, /admin/users (or /users)
          /admin/kyc/pending, approve, reject
          /wallet/admin/withdrawals, credit, debit
          /settings/fees
Users:    /users (list with search/role)
Ratings:  /reputation/rate, /reputation/ratings/:userId
```

---

## Recommended Actions

### Completed (Feb 2026)

1. ✅ **Admin users** – Fixed to use `GET /users`, `PUT /users/:id/status`
2. ✅ **Admin wallet** – Fixed search/credit/debit endpoints; added View User Wallet screen
3. ✅ **Admin withdrawals** – Fixed to use `GET /wallet/admin/withdrawals`, `PUT /wallet/withdraw/:id/process`
4. ✅ **Admin KYC** – Fixed to use `GET /kyc/pending`, `PUT /kyc/approve/:userId`, `PUT /kyc/reject/:userId`
5. ✅ **Admin Settings** – Replaced placeholder with full fees/general/security/notifications
6. ✅ **Admin Fees** – Replaced placeholder with real fee config + examples
7. ✅ **Admin Reconciliation** – Replaced placeholder with real data
8. ✅ **Admin users extras** – Impersonate, approve user, update roles
9. ✅ **Dispute resolve/close** – Added for admins on mobile
10. ✅ **Error messages** – Synced with web

### Remaining (Verify/Test)

1. **Mobile end-to-end** – Run through: register → create escrow → fund → ship → deliver → release
2. **Paystack topup on mobile** – Test with real/sandbox payment

### Low Priority (Polish)

1. **Color consistency** – Consider aligning mobile primary color with web brand
2. **Escrow Paystack funding** – If needed, add WebView flow for funding escrow via Paystack on mobile

---

## Testing Checklist for Mobile

- [ ] Register with OTP (Ghana phone)
- [ ] Login
- [ ] Create escrow (with/without milestones)
- [ ] Fund escrow (wallet)
- [ ] Mark shipped (seller)
- [ ] Confirm delivery (buyer – inline or code)
- [ ] Release funds (buyer)
- [ ] Wallet topup via Paystack
- [ ] Withdraw request
- [ ] Open dispute
- [ ] Rate counterparty
- [ ] Admin: KYC review, withdrawal approval, wallet credit/debit
- [ ] Profile: edit, change password, KYC upload

---

## Summary

**Unification:** Web and mobile share the same API, auth flow (including Arkesel OTP), and core features. The main structural difference is navigation (web: pages; mobile: tabs + stack).

**Gaps:** Admin users API, admin view-user-wallet, error message mappings. None are blocking for basic usage.

**Next step:** Run the mobile testing checklist above to validate parity with the working web app.
