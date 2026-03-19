# Paystack 1.95% Fee & PIN Delivery Confirmation

## 1. Paystack 1.95% processing fee (passed to customer)

**Context:** Paystack charges you 1.95% per transaction. You want to pass this to the customer when they use Paystack (wallet top-up).

**Where it applies:**
- **Wallet top-up via Paystack** – When a user tops up their wallet using Paystack (card/mobile money), we deduct 1.95% before crediting. Example: user pays ₵100 via Paystack → we credit ₵98.05 (₵1.95 fee).
- **Escrow funding** – Escrow is funded from wallet (not direct Paystack). So the 1.95% is only applied at top-up time, not again when funding an escrow.

**Implementation:**
- Backend: When creating/verifying a Paystack wallet top-up, set `feeCents = round(amountCents * 1.95 / 100)`. Wallet is credited `amountCents - feeCents`.
- Frontend (top-up page): Show before redirect: “Paystack processing fee (1.95%): ₵X.XX. You will receive ₵Y.YY.”
- Optional: Make 1.95% a config (e.g. in settings) so you can change it if Paystack updates.

**Clarification:** If you ever support “direct Paystack” for escrow (pay without wallet), the same 1.95% would apply to that payment; for now only wallet top-up is in scope.

---

## 2. PIN confirmation for delivery (certain categories)

**Context:** Keep the current release system (manual release / auto-release after code). Add an option: for some escrows, “confirm delivery with PIN” so that when the PIN is entered at delivery point, delivery is confirmed and funds auto-release. Only the person who created the transaction (and whoever they share the PIN with) knows the PIN.

**Flow:**
1. **Create escrow** – Creator (buyer) can choose “Confirm delivery with PIN”. They set a 4–6 digit PIN (stored hashed). Optional: restrict to “certain categories” (e.g. services only); for simplicity we can expose it as a checkbox for any escrow.
2. **Ship** – Seller ships as today; shipment gets `shortReference` (and optionally delivery code for code flow).
3. **At delivery** – Someone (buyer or delivery person with buyer’s PIN) goes to **Confirm Delivery** page, enters:
   - **Reference** (e.g. MV7K2A) to identify the shipment/escrow.
   - **PIN** (or, for standard escrows, the existing delivery code).
4. **Backend** – If PIN matches for that escrow: we have confirmed the rightful owner at delivery; mark DELIVERED, then if `autoReleaseDays === 0` and no dispute, release funds from escrow.

**What stays the same:**
- Manual “Release” in app and auto-release after N days still work.
- Existing “delivery code” flow (ref + code) unchanged for escrows that don’t use PIN.
- No change to who can release: only buyer (or system when conditions are met).

**Implementation outline:**
- **Schema:** `EscrowAgreement`: add `deliveryConfirmationMode` ('code' | 'pin'), `deliveryPinHash` (optional).
- **Create escrow:** Optional “Use PIN to confirm delivery”; when selected, buyer sets PIN (sent once, stored hashed).
- **Confirm-delivery API:** Accept either `{ shortReference, deliveryCode }` (current) or `{ shortReference, deliveryPin }`. For PIN: resolve shipment by ref, verify PIN for that escrow, then same logic as code (DELIVERED + auto-release if applicable).
- **Confirm-delivery page:** One form; if user enters 6 chars we can treat as code, if 4–6 digits as PIN (or have a toggle). Simpler: two inputs – “Reference” and “Code or PIN” – backend tries code first, then PIN if code fails (or we use a single field and backend detects format). Cleanest: one field “Code or PIN” and backend tries both (code match first, then PIN for that ref’s escrow).

**Categories:** You mentioned “certain category of services”. Options:
- **A)** Add escrow category (e.g. goods / services / real_estate) and only show “PIN delivery” for e.g. services.
- **B)** Let the creator choose per escrow: “Delivery confirmation: Standard (code) or PIN” with no category.

Recommendation: Start with **B** (per-escrow choice). You can add category later and restrict PIN to “services” if needed.

---

## 3. Summary

| Item | Scope | Status |
|------|--------|--------|
| Paystack 1.95% | Wallet top-up only; show fee and credit (amount - fee) | Implemented |
| PIN delivery | Optional per escrow; PIN set by transaction creator only; ref + PIN at delivery confirms rightful owner before releasing funds | Implemented |
| Current release system | Unchanged (manual release, code confirmation, auto-release) | Preserved |
