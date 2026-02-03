# MYXCROW Deployment Guide (Render)

Canonical deployment guide for running MYXCROW on **Render** using the Blueprint. No VPS or self-managed servers.

## What Render runs

- **PostgreSQL** – Render-managed database (from Blueprint)
- **Redis (Key Value)** – Render-managed cache/queue (from Blueprint)
- **API** – NestJS backend (`services/api`), Starter plan
- **Web** – Next.js frontend (`apps/web`), Starter plan

## Prerequisites

- GitHub (or GitLab) repo connected to Render
- Render account: [dashboard.render.com](https://dashboard.render.com)
- Production env values: Paystack keys, SMTP, S3 (see `RENDER_ENV_TEMPLATE.md`)

## Deploy with Blueprint

1. **New Blueprint** in Render Dashboard; select this repo. Render uses `render.yaml` at repo root.
2. **Apply** – Render creates database, Redis, API, and Web services.
3. **Set secrets** when prompted (WEB_APP_URL, WEB_BASE_URL, S3_*, PAYSTACK_*, EMAIL_*, and `NEXT_PUBLIC_API_BASE_URL` for web).
4. After first deploy, set **myxcrow-bp-web** → `NEXT_PUBLIC_API_BASE_URL` = `https://myxcrow-bp-api.onrender.com/api` (or your API URL), then **Manual Deploy** the web service.

Full steps: **[RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)**  
Env reference: **[RENDER_ENV_TEMPLATE.md](RENDER_ENV_TEMPLATE.md)**

## Custom domains

- In Render: **myxcrow-bp-api** → Custom Domains → e.g. `api.myxcrow.com`
- **myxcrow-bp-web** → Custom Domains → e.g. `myxcrow.com`
- In DNS: CNAME to the URLs Render provides.
- Update `WEB_APP_URL`, `WEB_BASE_URL`, and `NEXT_PUBLIC_API_BASE_URL` to your domains; redeploy.

## Related docs

- [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) – Step-by-step deploy
- [RENDER_ENV_TEMPLATE.md](RENDER_ENV_TEMPLATE.md) – Env vars reference
- [DOMAIN_CONFIGURATION.md](DOMAIN_CONFIGURATION.md) – DNS & SSL (Render)
