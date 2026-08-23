> **Verification policy (Aug 2026):** MYXCROW uses SMS OTP at registration only. No ID/document KYC. See [docs/PHONE_VERIFICATION.md](docs/PHONE_VERIFICATION.md).

# Software Registration — Submission Checklist

**Application:** MYXCROW Escrow Platform v1.0.0  
**Fee:** GHS 185  
**Delivery:** Two identical pen drives + supporting documents  
**Certificate issued:** Within 30 days  

Print this page and tick each item before submission.

---

## Pen drive contents (both drives must be identical)

### Drive 1 & Drive 2

- [ ] **01-executable/** — Runnable application (Docker images export OR built `dist/` + `node_modules` + start scripts)
- [ ] **02-source-code/** — Full source zip of MYXCROW monorepo (exclude `node_modules`, `.next`, `dist`, `.env`)
- [ ] **03-database-schema/** — Copy of `software-registration/database-schema/` (schema.prisma, migrations, data dictionary, full-schema.sql)
- [ ] **04-screen-recording/** — MP4 demo (5–15 minutes) showing core flows
- [ ] **05-company-documents/** — Ghana Cards (all developers) + Certificate of Incorporation (PDF scans)
- [ ] **06-webview-gold-project/** — Source + APK/IPA if you have a separate mobile wrapper (optional if web-only)
- [ ] **README.txt** — Cover sheet with product name, version, company name, contact email/phone, date

---

## Source code checklist

- [ ] `apps/web/` — Next.js frontend (all pages, components, styles)
- [ ] `services/api/` — NestJS backend (all modules, Prisma schema, migrations)
- [ ] `infra/docker/` — Docker Compose for local run
- [ ] `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` — dependency lockfiles
- [ ] `README.md`, `SHARED_ARCHITECTURE.md` — setup instructions included in zip
- [ ] No `.env` files with real secrets (use `.env.example` only)
- [ ] No `node_modules/` in zip (registrar can run `pnpm install`)

---

## Database schema checklist

- [ ] `schema.prisma` — canonical schema
- [ ] `migrations/` — all 13 SQL migration folders
- [ ] `DATABASE_DATA_DICTIONARY.md` — table/column descriptions
- [ ] `full-schema.sql` — single-file DDL export (run `scripts/generate-full-schema-sql.sh`)

---

## Executable checklist

Choose **one** approach (Docker recommended for reviewers):

- [ ] **Option A — Docker (recommended):** `docker save` images for API + Web + Postgres, plus `docker-compose.production.yml` and `RUN.txt` instructions
- [ ] **Option B — Node builds:** `services/api/dist/` + `apps/web/.next/` + `package.json` files + `START.sh` script
- [ ] **Option C — Offline demo:** Docker Compose dev stack pre-seeded with test data (`./setup-local.sh` instructions in README)

- [ ] Reviewer can start app without your Paystack/Smile ID (removed) production keys (document test mode)
- [ ] Default test login documented (from seed: `admin@myxcrow.com` / see seed script)

---

## Screen recording checklist

- [ ] Shows product name and version on screen (login or about page)
- [ ] User registration / login
- [ ] Create escrow transaction
- [ ] Fund escrow (wallet or payment flow)
- [ ] Seller marks shipped / delivery confirmation
- [ ] Release funds or dispute flow
- [ ] Admin dashboard (optional but recommended)
- [ ] Recording is MP4, 1080p, with visible cursor
- [ ] No real customer PII or live payment credentials shown
- [ ] Saved to both pen drives under `04-screen-recording/MYXCROW-demo.mp4`

---

## Company documents (not on pen drive only — may also need physical copies)

- [ ] Ghana Card (front + back) for **each developer** listed on the application
- [ ] Certificate of Incorporation (Registrar General) — certified copy or clear scan
- [ ] Company name matches application exactly
- [ ] GHS 185 registration fee ready (confirm payment method with registering office)

---

## WebView Gold project (if applicable)

If you have a separate Android/iOS WebView wrapper branded "Gold":

- [ ] Full source code of that project
- [ ] Built APK (Android) and/or IPA (iOS) as executable
- [ ] Its own README explaining it wraps MYXCROW web URL
- [ ] See `webview-gold-project/WHAT_TO_INCLUDE.md`

If MYXCROW is **web-only** (current repo state), note this on the cover letter — the web app is the deliverable.

---

## Final verification

- [ ] Both pen drives have **identical** folder structure and file names
- [ ] Both drives readable on Windows and macOS (FAT32 or exFAT formatted)
- [ ] Total size fits on drive (source zip + Docker images can be large — use 32GB+ drives)
- [ ] Cover letter / README.txt on root of each drive
- [ ] Backup copy of everything kept locally before submission

---

## Contact block (fill in before printing)

| Field | Value |
|-------|-------|
| Company name | _________________________________ |
| Registration number | _________________________________ |
| Product name | MYXCROW |
| Version | 1.0.0 |
| Lead developer | _________________________________ |
| Phone | _________________________________ |
| Email | _________________________________ |
| Submission date | _________________________________ |
