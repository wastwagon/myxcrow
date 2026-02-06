# Production Security Checklist

Use this alongside [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) when deploying MYXCROW to production.

## Secrets

- **JWT_SECRET**  
  Must be a strong random value (e.g. `openssl rand -base64 32`). Never use the default or example value from `.env.example`.

- **ENCRYPTION_KEY**  
  Used for encrypting sensitive data. Generate with `openssl rand -base64 32` and keep it secret. Rotate periodically and re-encrypt if required.

- **PAYSTACK_WEBHOOK_SECRET**  
  Set in Paystack dashboard and in your env. The API verifies webhook signatures with this; without it, webhook handlers are unsafe.

- **DATABASE_URL**, **REDIS_URL**, **S3_***, **EMAIL_***, **SMS_***  
  Use production credentials only. Restrict DB/Redis and S3 access by IP or VPC where possible.

## HTTPS and CORS

- Serve the API and web app over **HTTPS only** in production. Configure TLS on your host (e.g. Render, Cloudflare).

- **CORS**: Set `CORS_ORIGINS` (or `WEB_APP_URL`) to the exact production frontend origin(s). Avoid `*` in production.

## Paystack webhooks

- Webhook URL must use **HTTPS** (e.g. `https://your-api-domain/api/payments/webhook`).
- The API uses **raw body** for webhook requests and verifies the signature via `PaystackService.verifyWebhookSignature`. Ensure `PAYSTACK_WEBHOOK_SECRET` is set so verification is effective.
- In Paystack dashboard, set the webhook URL and confirm events (e.g. charge.success) are delivered and processed.

## Rate limiting

- With **REDIS_URL** set, the API uses **Redis-backed rate limiting**, which works across multiple instances.
- Without Redis, rate limiting is in-memory (single-instance only). For production with more than one API instance, configure Redis and set `REDIS_URL`.
- If Redis is unavailable at runtime, the API allows requests through (rate limiting is effectively disabled) and logs a warning so the app stays up; fix Redis to restore limiting.

## Optional hardening

- Prefer **read-only** DB user for reporting/analytics if you split roles.
- Rotate **JWT_SECRET** and **ENCRYPTION_KEY** on a schedule; plan for re-login or token invalidation when rotating JWT.
- Keep dependencies updated (`pnpm update`, security audits) and fix known vulnerabilities.
