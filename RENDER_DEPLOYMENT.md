# MYXCROW – Deploy on Render (Blueprint)

Deploy MYXCROW to production using **Render Blueprint** with managed PostgreSQL and Redis. No VPS or self-managed servers.

## What You Get

- **PostgreSQL** – Render-managed database (free tier available)
- **Redis (Key Value)** – Render-managed cache/queue (free tier)
- **API** – NestJS backend (Starter plan)
- **Web** – Next.js frontend (Starter plan)

## Prerequisites

- GitHub (or GitLab) account with this repo
- Render account: [dashboard.render.com](https://dashboard.render.com)
- Paystack keys (production): [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developer)
- SMTP provider (SendGrid, Mailgun, etc.) for email
- S3-compatible storage (AWS S3 recommended for production; optional for testing)

## Deploy in 3 Steps

### 1. Connect Repo and Create Blueprint

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New** → **Blueprint**.
3. Connect your Git provider and select the **myxcrow** repository.
4. Render will detect `render.yaml` in the repo root.
5. Click **Apply**. Render will create:
   - PostgreSQL database: `myxcrow-bp-db`
   - Key Value (Redis): `myxcrow-bp-redis`
   - Web service: `myxcrow-bp-api`
   - Web service: `myxcrow-bp-web`

### 2. Set Secret Environment Variables

During Blueprint creation, Render will prompt for variables marked `sync: false`. Provide:

**API service (`myxcrow-bp-api`):**

| Variable | Description | Example |
|----------|-------------|---------|
| `WEB_APP_URL` | Public URL of the web app | `https://myxcrow-bp-web.onrender.com` or `https://myxcrow.com` |
| `WEB_BASE_URL` | Same as WEB_APP_URL (used for links) | Same as above |
| `S3_ENDPOINT` | S3-compatible endpoint | `https://s3.amazonaws.com` or leave blank for later |
| `S3_ACCESS_KEY` | S3 access key | Your AWS key |
| `S3_SECRET_KEY` | S3 secret key | Your AWS secret |
| `PAYSTACK_SECRET_KEY` | Paystack secret | `sk_live_...` |
| `PAYSTACK_PUBLIC_KEY` | Paystack public | `pk_live_...` |
| `PAYSTACK_WEBHOOK_SECRET` | Paystack webhook secret | From Paystack dashboard |
| `EMAIL_HOST` | SMTP host | `smtp.sendgrid.net` |
| `EMAIL_USER` | SMTP user | `apikey` (SendGrid) |
| `EMAIL_PASS` | SMTP password | Your SendGrid API key |

**Web service (`myxcrow-bp-web`):**

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Full API URL including `/api` | `https://myxcrow-bp-api.onrender.com/api` |

Use the **actual** API URL Render gives you (e.g. `https://myxcrow-bp-api.onrender.com/api`). The web app needs this at **build time**.

### 3. Redeploy Web After API URL Is Known

1. Deploy the Blueprint once so the API gets its URL (e.g. `https://myxcrow-bp-api.onrender.com`).
2. In **myxcrow-bp-web** → **Environment**, set:
   - `NEXT_PUBLIC_API_BASE_URL` = `https://myxcrow-bp-api.onrender.com/api`
3. Trigger a **Manual Deploy** for **myxcrow-bp-web** so the new value is baked into the build.

## Custom Domains (Optional)

1. **API:** Dashboard → **myxcrow-bp-api** → **Settings** → **Custom Domains** → Add e.g. `api.myxcrow.com`.
2. **Web:** Dashboard → **myxcrow-bp-web** → **Settings** → **Custom Domains** → Add e.g. `myxcrow.com`.
3. In your DNS provider, add CNAME records pointing to the URLs Render shows.
4. Update env vars: set `WEB_APP_URL` / `WEB_BASE_URL` and `NEXT_PUBLIC_API_BASE_URL` to your custom domains, then redeploy.

## Paystack Webhook

In Paystack Dashboard → Settings → Webhooks, set:

- **URL:** `https://myxcrow-bp-api.onrender.com/api/payments/webhook` (or your API custom domain + `/api/payments/webhook`)
- **Secret:** Copy into `PAYSTACK_WEBHOOK_SECRET` in Render.

## S3 / File Storage

For production, use **AWS S3** (or compatible):

- Create a bucket (e.g. `myxcrow-escrow-evidence`).
- Create an IAM user with read/write to that bucket.
- Set in Render (API): `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_REGION`.

Free tier on Render does not include persistent file storage; external S3 is required for evidence uploads.

## Node and pnpm

Render uses the Node version from `.nvmrc` (20) if present. The API and Web use `rootDir` so builds run from `services/api` and `apps/web`; each has its own `package.json`. If the build fails with "pnpm not found", add to the start of `buildCommand`: `npm install -g pnpm@9 && ` (e.g. `npm install -g pnpm@9 && pnpm install && pnpm build`).

## Troubleshooting

- **API health check fails:** Ensure `preDeployCommand` (Prisma migrate) succeeded. Check **Logs** for the API service.
- **Web can’t reach API:** Confirm `NEXT_PUBLIC_API_BASE_URL` is set and that you redeployed the web service after setting it.
- **CORS errors:** API uses `WEB_APP_URL` for CORS. Ensure it matches your web app’s origin (including custom domain if used).
- **Database:** Connection string is injected by Render from the `myxcrow-bp-db` database. No manual `DATABASE_URL` needed unless you use an external DB.

## Reference

- **Blueprint spec:** [render.com/docs/blueprint-spec](https://render.com/docs/blueprint-spec)
- **Env template:** `RENDER_ENV_TEMPLATE.md` (copy/paste reference for manual edits)
