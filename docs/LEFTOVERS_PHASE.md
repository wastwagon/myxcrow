# Leftovers phase — completed

Cleanup pass after phone-only verification and customer UI polish. See [PHONE_VERIFICATION.md](./PHONE_VERIFICATION.md) for the canonical policy.

## Completed in this phase

### API
- **Merged guards**: `PhoneRequiredGuard` now requires phone on file **and** `kycStatus === VERIFIED` (staff roles bypass verification check). Deleted unused `KYCVerifiedGuard`.
- **Reputation API**: `GET /reputation/profile/:id` and reputation payload include `phoneVerified` alongside legacy `kycStatus` / `kycLevel`.
- **Dead code removed**: `sendKYCStatusUpdateNotifications`, `sendAdminPhoneVerificationPendingNotification` (no callers after KYC module removal).

### Web — customer
- **Home wallet card**: “Statements” → “Transactions” (matches dashboard and `/wallet/transactions`).
- **CustomerLayout**: Removed unused grouped iOS header branch; all pages use maroon `CustomerShellChrome`.
- **Public profile**: Displays phone verification via `phoneVerified` when present.
- **Constants**: `PHONE_VERIFICATION_STATUS_COLORS` with deprecated `KYC_STATUS_COLORS` alias.

### Web — admin
- **Reconciliation** empty states link to `/escrows/history` instead of the escrows hub.

## Deferred (intentional)

| Item | Reason |
|------|--------|
| `KYCDetail` Prisma model / `kycStatus` DB column | Legacy schema; rename needs a migration plan |
| Historical `.md` review docs | Bulk policy banners may read awkwardly; product behavior is correct |
| `auth.service.spec.ts` bcrypt mock failures | Pre-existing; unrelated to verification cleanup |
| `useCustomerShellHeader` escrow prefetch | Performance tweak; 60s staleTime already applied |

## Verification grep checklist

After this phase, customer/admin UI should have **no**:
- `/kyc` or `/admin/kyc-review` routes
- Ghana Card / Smile ID / document upload flows
- Admin “approve user” or manual verification buttons

Escrows, wallet, payments, disputes, and evidence routes use `PhoneRequiredGuard` on the API.
