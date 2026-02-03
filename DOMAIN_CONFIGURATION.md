# Domain Configuration for myxcrow.com (Render)

**Domain:** `myxcrow.com`  
**Deployment Platform:** Render

---

## DNS Records (Custom Domains)

When using custom domains with Render, use **CNAME** records pointing to the URLs Render provides (not A records to a VPS).

### Required

1. **Web app** – In Render Dashboard → **myxcrow-web** → **Custom Domains**, add `myxcrow.com`. Render shows a target (e.g. `myxcrow-web.onrender.com`). In your DNS:
   - **Type:** CNAME  
   - **Name:** `@` (or `myxcrow.com` – depends on provider; some use `@`, some use root)  
   - **Value:** `myxcrow-web.onrender.com` (or the host Render shows)  
   - For root domains, some registrars require an A record to Render’s IP; check Render docs for “root domain”.

2. **API** – In Render Dashboard → **myxcrow-api** → **Custom Domains**, add `api.myxcrow.com`. In your DNS:
   - **Type:** CNAME  
   - **Name:** `api`  
   - **Value:** `myxcrow-api.onrender.com` (or the host Render shows)

### Optional

3. **www** – Add `www.myxcrow.com` in Render for **myxcrow-web**; Render often adds a redirect from www to root. DNS: CNAME `www` → `myxcrow-web.onrender.com`.

---

## SSL

Render provides SSL (HTTPS) for your services. No manual certificate setup. After DNS propagates, Render issues certificates automatically.

---

## Environment Variables After Adding Domains

Update in Render Dashboard and redeploy:

- **myxcrow-api:** `WEB_APP_URL` and `WEB_BASE_URL` = `https://myxcrow.com` (or your web domain)
- **myxcrow-web:** `NEXT_PUBLIC_API_BASE_URL` = `https://api.myxcrow.com/api`  
  Then trigger a **Manual Deploy** for **myxcrow-web** so the new value is baked into the build.

---

## Verification

- `https://myxcrow.com` loads (web).
- `https://api.myxcrow.com/api/health` returns 200 (API).
- Login and core flows work.

---

## Troubleshooting

- **Domain not resolving:** Confirm CNAME (or A if required) in DNS; wait for propagation (minutes to hours).
- **SSL not active:** Wait for DNS to propagate; check Render Dashboard for certificate status.
- **CORS/API errors:** Ensure `WEB_APP_URL` on the API matches the web origin (e.g. `https://myxcrow.com`).

---

**Last Updated:** February 2026
