# Safe review: tests, diagnostics, unused/duplicate files

**Date:** March 2026  
**Scope:** Testing files, diagnose/diagnostic references, unused or duplicate files that could cause confusion or conflict.  
**No application code or feature behavior was changed.**

---

## 1. Testing files

### API (Jest)

| Location | Purpose |
|----------|--------|
| `services/api/jest.config.js` | Unit test config |
| `services/api/jest-e2e.config.js` | E2E test config (uses `test/jest-e2e-setup.ts`) |
| `services/api/tsconfig.spec.json` | TypeScript config for tests (includes `jest` types) |
| `services/api/test/jest-e2e-setup.ts` | Loads `.env` and `.env.test` (`.env.test` is optional; if missing, only `.env` is used) |
| `services/api/test/e2e/*.e2e.spec.ts` | E2E: auth, escrow, wallet |
| `services/api/src/modules/**/*.spec.ts` | Unit: auth, escrow, evidence, payments, paystack, wallet, disputes |

**Commands (from repo root or `services/api`):**
- Unit: `cd services/api && pnpm test`
- E2E: `cd services/api && pnpm test:e2e`
- E2E full (migrate + seed + e2e): `cd services/api && pnpm test:e2e:full`

**Verdict:** Test setup is consistent. No duplicate test frameworks. No conflicts found.

### Root / scripts (Playwright + shell)

| File | Purpose |
|------|--------|
| `scripts/capture-app-store-screenshots.ts` | Playwright script for App Store–style mockup screenshots (uses `@playwright/test`). Run: `pnpm screenshots` (after `pnpm exec playwright install chromium`) |
| `scripts/test-all.sh` | Shell: full stack check (Docker, API health, auth, escrows, DB, Redis, MinIO, web at 3007). Requires `./setup-local.sh` first. |
| `scripts/test-features.sh` | Shell: login, profile, escrows, wallet, DB, Redis, MinIO, Mailpit, web at 3007. Overlaps with `test-all.sh`. |
| `scripts/test-escrow-flow.sh` | Shell: full escrow flow via API (create→fund→ship→deliver→release). Uses `sellerId: "seller1@test.com"` (API accepts email and resolves to user). |
| `scripts/test-phone-flow.sh` | Shell: phone-based auth and escrow with seller phone. |

**Overlap:** `test-all.sh` and `test-features.sh` both test API health, login, escrows, wallet, DB, Redis, MinIO, and frontend. They are **redundant but not conflicting**. Keeping both is safe; consider documenting that `test-all.sh` is the “full” suite and `test-features.sh` a lighter option, or vice versa.

**Verdict:** No conflicts. Optional cleanup: add one line in README or a script header stating which script to run for “quick” vs “full” manual test.

---

## 2. Diagnose / diagnostic references

| Reference | Status |
|-----------|--------|
| `START_HERE.md` | Tells users to run `./diagnose-docker.sh` then `./fix-and-start.sh`. |
| `.gitignore` | Lists `diagnose-docker.sh` (so it is **not** in the repo). |
| `fix-and-start.sh` | **Exists** at repo root. |

**Issue:** New clones will not have `diagnose-docker.sh`. Running `./diagnose-docker.sh` fails with “no such file.”

**Safe fix (docs only):** In `START_HERE.md`, either (a) say “If you have `diagnose-docker.sh`, run it; otherwise run `./fix-and-start.sh` after ensuring Docker is running,” or (b) add a one-line note that `diagnose-docker.sh` is optional and not in the repo. No need to add a real diagnose script unless you want one.

---

## 3. Setup script confusion (no app logic change)

- **README / most docs:** “Run `./setup-local.sh`” — **file exists**.
- **START_HERE.md:** “Run `./fix-and-start.sh`” — **file exists**.
- **.gitignore:** Lists `setup.sh`, `quick-setup.sh`, `robust-setup.sh`, `simple-setup.sh`, `force-setup.sh`, `fix-docker-then-setup.sh` — these are **not** in the repo (intentionally ignored or legacy).

So users have two valid entry points: `./setup-local.sh` (canonical in README) and `./fix-and-start.sh` (START_HERE). Both can coexist; no conflict. Optional: in START_HERE, add “Alternatively, use `./setup-local.sh` as in the main README.”

---

## 4. Unused or misleading script references (safe fixes only)

| File | Issue | Safe fix |
|------|--------|----------|
| `scripts/check-services.sh` | Checks “Web Frontend” at **port 3000**. Project serves web at **3007**. | Change port in script from 3000 to 3007 so the check matches actual setup. |
| `configure-docker-resources.sh` | Line 81: `myexrow` (typo) and `./robust-setup.sh` (in .gitignore, so not in repo). | Change to `myxcrow` and `./setup-local.sh` so instructions work. |

These are **documentation/script fixes only**; they do not change any feature or runtime behavior.

---

## 5. Env and config files

| File | Status |
|------|--------|
| `.env.example` | Root env template. |
| `infra/docker/.env.dev` | Docker env for dev. |
| `services/api/.env` | Not in repo (gitignored). Created from example or by generate-keys script. |
| `services/api/.env.test` | Optional; not in repo. E2E setup loads it if present. |

**Verdict:** No duplication or conflict. No `.env` is committed with secrets.

---

## 6. Other scripts (no conflict)

- `scripts/db-seed.sh` — runs `docker exec escrow_api pnpm seed`; correct.
- `scripts/db-reset.sh`, `migrate-production.sh`, `setup-production-db.sh` — exist; not audited in detail; no overlap with test/diagnose scope.
- `scripts/generate-keys-and-setup-env.sh` — writes/updates `services/api/.env` and root `.env`; no conflict with other env files.

---

## 7. Summary

| Category | Result |
|----------|--------|
| **Test files** | Single framework per layer (Jest for API, Playwright for screenshots). No duplicate or conflicting test configs. |
| **Diagnose file** | `diagnose-docker.sh` is referenced in START_HERE but not in repo; doc fix only. |
| **Setup scripts** | Two valid entry points (`setup-local.sh`, `fix-and-start.sh`); no conflict. |
| **Unused/confusing** | `check-services.sh` port (3000→3007) and `configure-docker-resources.sh` typo + wrong script name — safe to fix. |
| **Overlap** | `test-all.sh` and `test-features.sh` overlap in scope; redundant, not conflicting. |

**Recommended safe changes (no impact on existing features or working conditions):**
1. Update `scripts/check-services.sh` to use port **3007** for the web frontend check.
2. Update `configure-docker-resources.sh`: fix `myexrow` → `myxcrow` and `robust-setup.sh` → `setup-local.sh`.
3. In `START_HERE.md`, add a short note that `diagnose-docker.sh` is not in the repo and that users can run `./fix-and-start.sh` (or `./setup-local.sh`) once Docker is running.

No test files, no diagnose scripts, and no env/config were removed or changed in a way that could affect existing features or working conditions.
