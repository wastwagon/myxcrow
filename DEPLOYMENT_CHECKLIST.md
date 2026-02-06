# Deployment Checklist (Render)

Use this checklist before deploying MYXCROW to **Render** with the Blueprint.

## Code & Repo

- [ ] All code committed and pushed to GitHub/GitLab
- [ ] `.gitignore` includes `.env` and secrets
- [ ] No hardcoded secrets in code

**Security:** See **[PRODUCTION_SECURITY.md](PRODUCTION_SECURITY.md)** for JWT, webhooks, HTTPS, and rate limiting.

## Render Setup

- [ ] Render account created
- [ ] Repo connected to Render
- [ ] Blueprint will use `render.yaml` from repo root

## Secrets & Env (prepare before Apply)

### API (`myxcrow-bp-api`) – set when prompted or in Dashboard

- [ ] `WEB_APP_URL` (e.g. `https://myxcrow-bp-web.onrender.com`)
- [ ] `WEB_BASE_URL` (same as WEB_APP_URL)
- [ ] `JWT_SECRET` (Blueprint can generate; or set manually)
- [ ] `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` (or add after first deploy)
- [ ] `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`, `PAYSTACK_WEBHOOK_SECRET`
- [ ] `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`

### Web (`myxcrow-bp-web`)

- [ ] `NEXT_PUBLIC_API_BASE_URL` = `https://myxcrow-bp-api.onrender.com/api` (set after first deploy, then redeploy web)

## External Services

- [ ] Paystack: production keys; webhook URL = `https://<api-domain>/api/payments/webhook`
- [ ] SMTP: SendGrid/Mailgun/etc. credentials
- [ ] S3: bucket and IAM keys (for evidence uploads)

## After First Deploy

- [ ] Set **myxcrow-bp-web** → `NEXT_PUBLIC_API_BASE_URL` to your API URL
- [ ] Trigger **Manual Deploy** on **myxcrow-bp-web**
- [ ] API health: `https://myxcrow-bp-api.onrender.com/api/health` → 200
- [ ] Web loads and login works

## Optional: Custom domains

- [ ] Add custom domains in Render for API and Web
- [ ] DNS CNAME records pointing to Render
- [ ] Update `WEB_APP_URL`, `WEB_BASE_URL`, `NEXT_PUBLIC_API_BASE_URL`; redeploy

---

See **[RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)** for full steps.
