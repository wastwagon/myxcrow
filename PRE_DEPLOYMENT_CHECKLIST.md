# Pre-Deployment Checklist (Render)

Use this checklist before deploying MYXCROW to **Render** with the Blueprint.

## Code & Repo

- [ ] All changes committed to git
- [ ] `.gitignore` includes `.env` and secrets
- [ ] Code pushed to GitHub/GitLab

## Render Setup

- [ ] Render account created
- [ ] Repo connected to Render (Blueprint will use `render.yaml`)

## Secrets to Prepare (set when prompted or in Dashboard)

### API (`myxcrow-bp-api`)

- [ ] `WEB_APP_URL` (e.g. `https://myxcrow-bp-web.onrender.com`)
- [ ] `WEB_BASE_URL` (same as WEB_APP_URL)
- [ ] `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` (or add after first deploy)
- [ ] `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`, `PAYSTACK_WEBHOOK_SECRET`
- [ ] `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`

### Web (`myxcrow-bp-web`)

- [ ] `NEXT_PUBLIC_API_BASE_URL` = `https://myxcrow-bp-api.onrender.com/api` (set after first deploy, then **Manual Deploy** web)

## External Services

- [ ] Paystack: production keys; webhook URL = `https://<api-domain>/api/payments/webhook`
- [ ] SMTP: SendGrid/Mailgun/etc. credentials
- [ ] S3: bucket and IAM keys (for evidence uploads)

## Deployment Steps

1. **Apply Blueprint** in Render (New → Blueprint → select repo).
2. **Enter secrets** when prompted.
3. After first deploy: set **myxcrow-bp-web** → `NEXT_PUBLIC_API_BASE_URL` → **Manual Deploy**.
4. **Verify:** API health, web loads, login works.

## Notes

- **API URL:** `NEXT_PUBLIC_API_BASE_URL` must be set and web redeployed so the value is in the build.
- **Database:** Migrations run automatically via preDeployCommand.
- **Health:** API health path is `/api/health`.

---

See **[RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)** for full steps.
