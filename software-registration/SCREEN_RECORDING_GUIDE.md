> **Verification policy (Aug 2026):** MYXCROW uses SMS OTP at registration only. No ID/document KYC. See [docs/PHONE_VERIFICATION.md](docs/PHONE_VERIFICATION.md).

# Screen Recording Guide — MYXCROW Demo

Record a **5–15 minute** screen recording showing how MYXCROW works. Save as `MYXCROW-demo.mp4` on both pen drives under `04-screen-recording/`.

---

## Before recording

1. Start local environment:
   ```bash
   ./setup-local.sh
   ./scripts/db-seed.sh
   ```
2. Open http://localhost:3007 in Chrome or Safari (full screen, 1920×1080 if possible)
3. Use seed accounts from `services/api/scripts/seed-users-and-transactions.ts`
4. Turn off notifications/popups; close unrelated tabs
5. Use **test/sandbox** Paystack keys only — never show live credentials

**Recording tools (free):**
- macOS: QuickTime → File → New Screen Recording, or OBS Studio
- Windows: Xbox Game Bar (Win+G) or OBS Studio
- Export: MP4, H.264, 1080p

---

## Suggested demo script (≈10 minutes)

### 1. Introduction (30 sec)
- Show browser URL and MYXCROW login page
- Briefly state: "MYXCROW escrow platform v1.0.0 — secure buyer-seller transactions in Ghana"

### 2. Registration / Login (1 min)
- Log in as a **buyer** test account
- Show dashboard with wallet balance and recent escrows

### 3. Create escrow (1.5 min)
- Navigate to **New Escrow**
- Enter seller email, amount (GHS), description
- Add delivery address
- Submit and show escrow in AWAITING_FUNDING status

### 4. Fund escrow (2 min)
- Open escrow detail
- Fund via wallet or Paystack (test mode)
- Show status change to FUNDED

### 5. Seller flow (2 min)
- Log out → log in as **seller** account
- Mark as shipped, enter tracking info
- Show delivery code / short reference

### 6. Delivery confirmation (1.5 min)
- Show public delivery confirmation page (`/confirm-delivery`)
- Enter delivery code
- Show status → DELIVERED / AWAITING_RELEASE

### 7. Release funds (1 min)
- Buyer confirms release (or auto-release)
- Show RELEASED status and wallet balance update

### 8. Dispute (optional, 1 min)
- Create a dispute on another escrow
- Show dispute messages and admin resolution path

### 9. Admin dashboard (1 min)
- Log in as `admin@myxcrow.com`
- Show admin overview: users, escrows, phone verification queue, settings

### 10. Closing (30 sec)
- Show Terms/Privacy pages
- State company name and version again

---

## What NOT to show

- Real customer names, emails, or Ghana Card numbers
- Production API keys or passwords (blur if visible)
- Unfinished/broken pages without explanation

---

## File requirements

| Setting | Value |
|---------|-------|
| Format | MP4 |
| Resolution | 1280×720 minimum, 1920×1080 preferred |
| Audio | Optional narration (recommended) |
| Filename | `MYXCROW-demo.mp4` |
| Location | `pen-drive-1/04-screen-recording/` and `pen-drive-2/04-screen-recording/` |

---

## Quick test without Paystack

If Paystack test keys are not configured:
1. Use **admin wallet credit** (`/admin/wallet/credit`) to fund buyer wallet
2. Fund escrow from wallet balance
3. Continue with ship → deliver → release flow

This still demonstrates the full escrow lifecycle for registration purposes.
