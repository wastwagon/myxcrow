# Production Checklist – Going Live

Use this before deploying MYXCROW to production.

---

## Mobile App (`apps/mobile`)

### Config (no placeholders)

- [ ] **app.json** – Run `npx eas-cli init` to add real `projectId` (removes invalid placeholder)
- [ ] **eas.json** – `submit.production.ios.appleId` and `ascAppId` are empty; fill before `eas submit`:
  - `appleId`: Your Apple ID email
  - `ascAppId`: App Store Connect app ID (numeric)
- [ ] **eas.json** – `submit.production.android.serviceAccountKeyPath`: Create `google-service-account.json` from Play Console before submit

### Build & test

- [ ] `eas build --platform all --profile production` succeeds
- [ ] Test on physical Android and iOS devices
- [ ] Paystack topup works (set `EXPO_PUBLIC_WEB_BASE_URL` to your live web URL)

---

## API & Web

### Environment variables (set in Render / hosting)

- [ ] `JWT_SECRET` – Strong random value (not `your-secret-key-change-in-production`)
- [ ] `DATABASE_URL` – Production PostgreSQL
- [ ] `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` – Live keys
- [ ] `ARKESEL_API_KEY` – For OTP/SMS
- [ ] `WEB_APP_URL`, `WEB_BASE_URL` – Your live domain (e.g. `https://myxcrow.com`)
- [ ] `NEXT_PUBLIC_API_BASE_URL` – API URL (e.g. `https://api.myxcrow.com/api`)
- [ ] `EMAIL_*`, `S3_*` – Production mail and storage

---

## Domains

- [ ] `myxcrow.com` – Web app
- [ ] `api.myxcrow.com` – API
- [ ] SSL certificates active

---

## Final smoke test

- [ ] Register with OTP
- [ ] Create escrow → fund → ship → deliver → release
- [ ] Wallet topup (Paystack)
- [ ] Admin: users, withdrawals, KYC, wallet credit/debit
