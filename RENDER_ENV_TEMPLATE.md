# Render Environment Variables Reference

Use this as a reference when setting or editing environment variables in the Render Dashboard. The Blueprint (`render.yaml`) injects **DATABASE_URL** and **REDIS_URL** automatically; set the rest in the Dashboard or during Blueprint creation.

## API Service (`myxcrow-bp-api`)

### Injected by Blueprint (do not set manually)

- `DATABASE_URL` – from Render Postgres `myxcrow-bp-db`
- `REDIS_URL` – from Render Key Value `myxcrow-bp-redis`
- `JWT_SECRET` – generated
- `ENCRYPTION_KEY` – generated

### Set in Dashboard (or when prompted)

```bash
NODE_ENV=production
PORT=4000
WEB_APP_URL=https://myxcrow-bp-web.onrender.com
WEB_BASE_URL=https://myxcrow-bp-web.onrender.com

# S3 (AWS or compatible)
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=escrow-evidence
S3_REGION=us-east-1

# Paystack
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_WEBHOOK_SECRET=your-webhook-secret
DEFAULT_CURRENCY=GHS
DEFAULT_COUNTRY=GH

# Email (e.g. SendGrid)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@myxcrow.com

# Optional
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CSRF_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=60
SMS_ENABLED=false
```

## Web Service (`myxcrow-bp-web`)

### Required

```bash
NODE_ENV=production
NEXT_PUBLIC_API_BASE_URL=https://myxcrow-bp-api.onrender.com/api
NEXT_PUBLIC_ENV=production
```

Use your actual API URL (from Render or your custom domain). Redeploy the web service after changing `NEXT_PUBLIC_API_BASE_URL` so the new value is included in the build.

## Notes

1. **Secrets:** Never commit real secrets. Use Render’s environment UI or `sync: false` in the Blueprint so you’re prompted once.
2. **Custom domains:** After adding domains in Render, update `WEB_APP_URL`, `WEB_BASE_URL`, and `NEXT_PUBLIC_API_BASE_URL` to use them, then redeploy.
3. **Paystack webhook:** URL must be `https://<your-api-domain>/api/payments/webhook`.
