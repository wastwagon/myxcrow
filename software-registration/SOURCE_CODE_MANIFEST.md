> **Verification policy (Aug 2026):** MYXCROW uses SMS OTP at registration only. No ID/document KYC. See [docs/PHONE_VERIFICATION.md](docs/PHONE_VERIFICATION.md).

# MYXCROW — Source Code Manifest

This document lists all source code included in the MYXCROW software registration submission.

**Repository:** `myxcrow` monorepo  
**Package manager:** pnpm 9.x workspaces  
**Runtime:** Node.js 20+

---

## Top-level structure

```
myxcrow/
├── apps/web/                 # Next.js 14 frontend (PRIMARY USER INTERFACE)
├── services/api/             # NestJS 10 backend API
├── infra/docker/             # Docker Compose for local development
├── scripts/                  # Utility scripts (seed, test, PDF generation)
├── software-registration/    # This registration package
├── package.json              # Root workspace config
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── docker-compose.production.yml
├── render.yaml               # Cloud deployment blueprint
└── README.md                 # Setup instructions
```

---

## Frontend — `apps/web/`

| Path | Description |
|------|-------------|
| `pages/` | Next.js routes — dashboard, escrows, wallet, disputes, admin, auth |
| `components/` | React components including UI kit (`components/ui/`) |
| `lib/` | API client, hooks, utilities, form classes, constants |
| `styles/globals.css` | Design tokens and global styles |
| `tailwind.config.js` | Tailwind theme (brand maroon/gold) |
| `public/` | Static assets, PWA manifest |
| `package.json` | Dependencies: Next.js, React, TanStack Query, Axios, Zod |

**Key pages:**
- `/login`, `/register` — authentication
- `/dashboard` — user home
- `/escrows/*` — create, view, fund, ship, release escrows
- `/wallet` — balance, top-up, withdraw
- `/disputes/*` — dispute management
- `/admin/*` — admin dashboard, users, escrows, settings, wallet credit
- `/terms`, `/privacy`, `/support` — legal and support

---

## Backend — `services/api/`

| Path | Description |
|------|-------------|
| `src/main.ts` | Application entry point |
| `src/modules/` | NestJS feature modules (see below) |
| `prisma/schema.prisma` | Database schema (30 models) |
| `prisma/migrations/` | 13 SQL migration files |
| `scripts/` | Seed data, admin creation, verification |
| `test/` | Unit and e2e tests |
| `Dockerfile.production` | Production container build |

**API modules (`src/modules/`):**

| Module | Responsibility |
|--------|----------------|
| `auth` | Login, register, JWT, password reset, email/phone verification |
| `users` | User profiles, roles |
| `phone verification` | Ghana Card verification, Smile ID (removed) |
| `escrow` | Escrow CRUD, funding, release, milestones |
| `wallet` | Balance, top-up, withdrawal |
| `payments` | Paystack integration |
| `disputes` | Dispute workflow and messaging |
| `delivery` | Shipment tracking, delivery codes |
| `evidence` | File upload to MinIO/S3 |
| `ledger` | Double-entry accounting |
| `admin` | Admin operations |
| `audit` | Audit logging |
| `compliance` | Regulatory compliance helpers |
| `notifications` | Email and SMS (Arkesel) |
| `risk` | Fraud/risk events |
| `settings` | Platform configuration |
| `reputation` | User ratings |
| `automation` | Scheduled jobs (auto-release, reminders) |
| `email` | Email templates and sending |
| `prisma` | Database service |

---

## Infrastructure

| File | Purpose |
|------|---------|
| `infra/docker/docker-compose.dev.yml` | Local dev: Postgres, Redis, MinIO, Mailpit, API, Web |
| `docker-compose.production.yml` | Production compose |
| `services/api/Dockerfile.production` | API container |
| `apps/web/Dockerfile.production` | Web container |
| `render.yaml` | Render.com deployment |
| `setup-local.sh` | One-command local setup |

---

## Scripts — `scripts/`

| Script | Purpose |
|--------|-------------|
| `db-seed.sh` | Seed database via Docker |
| `db-reset.sh` | Reset database |
| `generate-bog-clarification-letter-pdf.py` | BoG letter PDF |
| `generate-user-manual-pdf.py` | User manual PDF |
| `play-store-screenshots/` | App store screenshot tooling |

---

## What to EXCLUDE from source zip

Do **not** include on pen drives:
- `node_modules/` (reviewer runs `pnpm install`)
- `.next/` and `dist/` (these go in executable folder if pre-built)
- `.env` files with real secrets
- `escrow_backup.sql` (contains data, not needed for schema)
- `.git/` (optional — include if registrar wants version history)

---

## Creating the source zip

```bash
cd /path/to/parent-of-myxcrow
zip -r MYXCROW-source-v1.0.0.zip myxcrow \
  -x "myxcrow/node_modules/*" \
  -x "myxcrow/apps/web/node_modules/*" \
  -x "myxcrow/services/api/node_modules/*" \
  -x "myxcrow/apps/web/.next/*" \
  -x "myxcrow/services/api/dist/*" \
  -x "myxcrow/.git/*" \
  -x "myxcrow/**/.env" \
  -x "myxcrow/escrow_backup.sql"
```

Place `MYXCROW-source-v1.0.0.zip` in `pen-drive-*/02-source-code/`.

---

## Lines of code (approximate)

| Area | Files | Notes |
|------|-------|-------|
| Frontend (`apps/web`) | ~80+ TSX/TS files | Pages, components, lib |
| Backend (`services/api`) | ~100+ TS files | Modules, services, controllers |
| Database schema | 1 Prisma + 13 migrations | 30 tables |
| Tests | Jest unit + e2e | API test suite |

---

## Third-party services (documented in code, keys not in repo)

| Service | Used for |
|---------|----------|
| Paystack | Card and MoMo payments |
| Smile ID (removed) | Ghana Card phone verification |
| Arkesel | SMS OTP |
| MinIO / S3 | File storage |
| Redis | Caching and job queues |
| PostgreSQL | Primary database |

All integrations use environment variables — see `.env.example` files in each app.
