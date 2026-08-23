# Phone verification (MYXCROW)

MYXCROW does **not** use document-based identity verification (no Ghana Card upload, selfie matching, or third-party ID checks).

## How accounts are verified

1. User registers with name, email, password, and a Ghana mobile number.
2. We send a **6-digit SMS code** to that number (`POST /auth/send-phone-otp`).
3. User enters the code and submits registration (`POST /auth/register`).
4. **Only if the OTP is valid** is the account created, with `kycStatus: VERIFIED` and `kycVerifiedAt` set (legacy field names).

Invalid or expired OTP → registration fails. There is no “pending signup” state and **no admin step** to mark users verified.

## Admin

- **Users** (`/admin/users`): Phone column shows the registered mobile number only.
- Verification is automatic at signup; admins do not approve phone verification.

## Not in scope

- Ghana Card / ID document upload
- Selfie or face matching
- Manual admin verification
- `/admin/kyc-review` or `/kyc` customer pages (removed)
- Smile ID or `/api/kyc/*` endpoints (removed from API)

## Related code

- Registration UI: `apps/web/pages/register.tsx`
- API registration: `services/api/src/modules/auth/auth.service.ts` (`register`)
- API guard (escrows, wallet, payments): `services/api/src/modules/auth/guards/phone-required.guard.ts`
- Display helpers: `apps/web/lib/phone-verification.ts`
- Cleanup log: [LEFTOVERS_PHASE.md](./LEFTOVERS_PHASE.md)
