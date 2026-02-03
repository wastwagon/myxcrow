## Missing Pages, UI, and Flow Audit

This document tracks **missing or incomplete pages/flows** across **API**, **Web**, and **Mobile**.
It’s intended as a “work queue” for polishing the product into a complete MVP.

### Newly completed in this pass

- **Forgot Password / Reset Password (end-to-end)**
  - **API**: `POST /auth/password-reset/request`, `POST /auth/password-reset/confirm`
  - **DB**: `PasswordResetToken` table (hashed one-time tokens with expiry)
  - **Web UI**: `/forgot-password`, `/reset-password` + link from `/login`
  - **Mobile UI**: `/(auth)/forgot-password`, `/(auth)/reset-password` + link from mobile login

- **Mobile escrow messaging**
  - **Mobile UI**: `/(tabs)/escrows/[id]/messages` (view + send) + link from escrow detail
  - **API already existed**: `GET /escrows/:id/messages`, `POST /escrows/:id/messages`

### Navigation / menu audit findings (this pass)

- **Fixed dead link (mobile)**: Mobile dashboard calls `GET /escrows/stats`
  - **Added API endpoint**: `GET /escrows/stats` (counts: active/pending/completed)

- **Fixed status badge mismatch (mobile)**: Escrow list was styling `statusPENDING` but API returns `AWAITING_FUNDING`, etc.
  - Updated styles in `apps/mobile/app/(tabs)/escrows/index.tsx` to match real statuses.

---

### High-impact gaps (recommended next)

- **Mobile evidence upload (escrow + dispute)**
  - **API exists**: `POST /evidence/presigned-url`, `POST /evidence/verify-upload`, `GET /evidence/:id/download`
  - **Missing**: mobile screens to pick a file, upload to presigned URL, then verify/create evidence record.

- **Mobile escrow milestones UI**
  - **API exists**: milestone endpoints in `EscrowController`
  - **Missing**: UI to view milestones and buyer “complete milestone”.

- **Mobile dispute details parity**
  - **Has**: list/new/detail screens
  - **Missing** (optional): add dispute messages timeline parity with web.

- **Account settings (change password while logged in)**
  - **Missing**: authenticated “change password” flow in API + UI (separate from forgot password).

---

### Lower-priority polish items

- **Legal pages**: Terms of Service / Privacy Policy pages (web) + links
- **Help / FAQ** page (web) + support CTAs
- **Notification center** (web/mobile) if desired (email/SMS already cover MVP)

