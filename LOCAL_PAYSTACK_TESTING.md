# Local development: Paystack & wallet top-up

Use this to run the app locally with **Paystack live** (or test) keys and verify wallet top-up.

## 1. Create your local `.env`

From the **project root** (same folder as `README.md`):

```bash
cp .env.example .env
```

Then edit `.env` and set at least:

- **PAYSTACK_SECRET_KEY** – Your Paystack **live** secret key (`sk_live_...`).  
  If you ever shared it (e.g. in chat), regenerate it in [Paystack Dashboard → API Keys](https://dashboard.paystack.com/#/settings/developer).
- **PAYSTACK_PUBLIC_KEY** – Your Paystack **live** public key (`pk_live_...`).
- **PAYSTACK_WEBHOOK_SECRET** – Optional for local. Only needed if you expose your API (e.g. ngrok) and set a live webhook URL. For local you can leave a placeholder; top-up still works via the callback flow.

Also ensure (defaults in `.env.example` are fine for Docker):

- **WEB_APP_URL** = `http://localhost:3007`
- **WEB_BASE_URL** = `http://localhost:3007`

Do **not** commit `.env`; it is in `.gitignore`.

## 2. Start database and services

From the **project root** so Docker Compose picks up `.env`:

```bash
./setup-local.sh
```

This starts PostgreSQL, Redis, MinIO, Mailpit, API, and Web. The API will use the Paystack keys from `.env`.

## 3. Seed the database (test users)

```bash
./scripts/db-seed.sh
```

This creates test users you can use to log in and test wallet top-up.

## 4. Test wallet top-up

1. Open **http://localhost:3007** in your browser.
2. Sign in with a test user, e.g. **buyer1@test.com** / **password123**.
3. Go to **Wallet** → **Top up**.
4. Enter amount and start top-up. You’ll be sent to Paystack’s payment page.
5. Complete payment (use a real card or Paystack test card for test keys).
6. Paystack redirects to **http://localhost:3007/wallet/topup/callback**. The app will verify the payment with Paystack and credit your wallet.

**Note:** Locally, Paystack cannot reach your API for webhooks. The app still credits the wallet when you land on the callback URL and the frontend calls the verify endpoint. For production, set the webhook URL in Paystack so credits also happen via webhook.

## 5. Quick checks

- **API health:** http://localhost:4000/api/health (should return `{"status":"ok"}` or similar).
- **Web:** http://localhost:3007 (login and Wallet → Top up).

If top-up fails, check API logs:

```bash
docker compose -f infra/docker/docker-compose.dev.yml logs -f api
```

Look for Paystack-related errors (invalid key, network, etc.).

---

## Wallet top-up (web app)

The **web app** uses the same API for wallet top-up:

1. User goes to Wallet → Top up, enters amount, clicks "Continue to Paystack".
2. Web app calls `POST /payments/wallet/topup` with `amountCents`, `email`; API returns `authorizationUrl`.
3. User is redirected to the Paystack payment page.
4. After payment, Paystack redirects to your callback URL (e.g. `https://www.myxcrow.com/wallet/topup/callback?reference=xxx`). The app then calls `GET /payments/wallet/topup/verify/:reference` to credit the wallet.

**Production:** Set your web app URL so the Paystack callback redirects to your domain (e.g. `https://www.myxcrow.com/wallet/topup/callback`).

**Local dev:** Use your web app URL (e.g. `http://localhost:3007`). On a real device, use your machine LAN IP so the device can reach the callback page. Use your machine’s LAN URL for the web app (e.g. `WEB_APP_URL=http://192.168.1.x:3007`) and ensure the device can load that URL so the browser can land on the callback page and the app can verify. Or test in a browser on your machine at `http://localhost:3007`.
