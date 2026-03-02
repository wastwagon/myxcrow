# Production Checklist – Going Live

Use this before deploying MYXCROW to production. **If you're already live**, keep the "Live environment" section below updated so the next person (or you in 6 months) knows exactly what "live" means.

---

## Live environment (update with your real values)

Fill this in once and keep it updated. This is your runbook reference.

| What | Your value (example) |
|------|----------------------|
| **Web app URL** | `https://myxcrow.com` or `https://myxcrow-web.onrender.com` |
| **API URL** | `https://myxcrow-api.onrender.com` or `https://api.myxcrow.com` |
| **API base (for env)** | `https://myxcrow-api.onrender.com/api` or `https://api.myxcrow.com/api` |
| **Render** | Web service: ________  \|  API service: ________  \|  DB: ________ |
| **Where env is set** | Render Dashboard → Service → Environment |
| **Deploy** | Auto-deploy from repo branch: ________  \|  Or manual Deploy |

---

## API & Web

### Environment variables (set in Render / hosting)

- [ ] `JWT_SECRET` – Strong random value (not `your-secret-key-change-in-production`)
- [ ] `DATABASE_URL` – Production PostgreSQL
- [ ] `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` – Live keys
- [ ] `ARKESEL_API_KEY` – For OTP/SMS
- [ ] `WEB_APP_URL`, `WEB_BASE_URL` – Your live domain (e.g. `https://myxcrow.com`)
- [ ] `NEXT_PUBLIC_API_BASE_URL` – API URL (e.g. `https://api.myxcrow.com/api`)
- [ ] `EMAIL_*`, `S3_*` – Production mail and storage

---

## Domains

- [ ] Web app domain (e.g. `myxcrow.com` or Render URL)
- [ ] API domain (e.g. `api.myxcrow.com` or Render URL)
- [ ] SSL certificates active (Render provides for *.onrender.com)

---

## PWA / Add to Home Screen

The web app is PWA-ready so users can **Add to Home Screen** on phones:

- [ ] **HTTPS** – Your live site is served over HTTPS (required for install prompt).
- [ ] **Manifest** – `manifest.json` is deployed (name, icons, theme_color, display: standalone).
- [ ] **Icons** – Favicon and apple-touch-icon point to `/logo/MYXCROWLOGO.png`.

No extra deploy step: the app already has the manifest and meta tags. On mobile browsers, users use the browser menu (e.g. “Add to Home Screen” or “Install app”) to install.

---

## Final smoke test

- [ ] Register with OTP
- [ ] Create escrow → fund → ship → deliver → release
- [ ] Wallet topup (Paystack)
- [ ] Admin: users, withdrawals, KYC, wallet credit/debit
