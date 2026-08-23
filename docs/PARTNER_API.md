# MYXCROW Partner API (PSP / Escrow)

Production partner surface for commerce platforms (DwumaPOS and others).

## Base URL

- Production: `https://api.myxcrow.com/api`
- Auth: `Authorization: Bearer mx_live_sk_<keyId>.<secret>`

## Bootstrap platform + key

```bash
cd services/api
pnpm exec prisma migrate deploy
pnpm exec tsx scripts/bootstrap-dwumapos-platform.ts
```

Optionally set:

- `DWUMAPOS_PLATFORM_SLUG=dwumapos`
- `DWUMAPOS_SUCCESS_URL_PREFIXES=https://your-store.com,https://admin.dwumapos.com`

Admin JWT routes:

- `POST /api/admin/platforms` — create platform (+ optional live key)
- `POST /api/admin/platforms/:id/api-keys` — mint keys
- `GET /api/admin/platforms/:id/api-keys`

## Core flow

1. `POST /api/v1/partner/merchants` — link phone-verified MYXCROW seller  
   `{ "externalMerchantId": "<tenantId>", "sellerEmail": "merchant@…" }`
2. `POST /api/v1/partner/webhook-endpoints` — `{ "url": "https://…/api/v1/webhooks/myxcrow/<slug>" }`  
   Store returned `secret` as DwumaPOS webhook secret.
3. `POST /api/v1/partner/checkout/sessions` — create hosted checkout  
   Headers: `Idempotency-Key: <order-ref>`  
   Body includes `externalOrderId`, `amountCents`, `externalMerchantId`, `successUrl`, `cancelUrl`.
4. Redirect buyer to `checkoutUrl` (`/partner/checkout/:sessionId` on myxcrow.com).
5. Webhooks: `checkout.session.completed` / `escrow.funded` → mark order paid (held).
6. On delivery POD / service complete: `POST /api/v1/partner/escrows/:id/release`.
7. Webhook `escrow.released` → merchant wallet credited.

## Signature verification

Header `X-Myxcrow-Signature: t=<unix>,v1=<hex>`  
HMAC-SHA256 of `${t}.${rawBody}` with endpoint secret.

## Release policy

Default for DwumaPOS platform: `PLATFORM_RELEASE` (commerce system attests delivery/service).

## Admin UI

MYXCROW admin → **Partner APIs** (`/admin/platforms`) to create platforms and mint/revoke API keys.

## DwumaPOS integration (automated)

When a merchant enables MYXCROW in **DwumaPOS → Settings → Payments**:

1. Set server env `MYXCROW_PLATFORM_API_KEY` (from bootstrap) and `MYXCROW_API_BASE_URL`.
2. Merchant enters **MYXCROW seller email** (phone-verified myxcrow.com account).
3. On save, DwumaPOS automatically:
   - links the seller via `POST /v1/partner/merchants`
   - registers webhook `…/webhooks/myxcrow/<tenantSlug>` and stores `whsec_…`

Manual steps 1–2 above are only needed if not using DwumaPOS auto-sync.

## DwumaPOS release triggers

| Event | Action |
|-------|--------|
| Rider POD / delivery `DELIVERED` | `POST …/escrows/:id/release` |
| Merchant marks order `FULFILLED` (pickup) | same |
| Service appointment `COMPLETED` | same |

Failed webhook deliveries retry every 5 minutes (up to 8 attempts).
