> **Verification policy (Aug 2026):** MYXCROW uses SMS OTP at registration only. No ID/document KYC. See [docs/PHONE_VERIFICATION.md](docs/PHONE_VERIFICATION.md).

# Shared Architecture: One Database, One Backend, One Admin

**Date:** January 2026  
**Principle:** One **database**, one **backend API**, and one **admin dashboard**. The web app (mobile-first, PWA-ready) is the single frontend.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SHARED BACKEND LAYER                             │
├─────────────────────────────────────────────────────────────────────────┤
│  PostgreSQL (single DB)  ←  NestJS API (single backend)  ←  Redis, etc.  │
└─────────────────────────────────────────────────────────────────────────┘
                                          │
                      ┌───────────────────┴───────────────────┐
                      │                                       │
                      ▼                                       ▼
              ┌───────────────┐                       ┌───────────────┐
              │  Web App      │                       │  Admin        │
              │  (Next.js)    │                       │  Dashboard    │
              │               │                       │  (Web only)   │
              │  • Dashboard  │                       │  • Users      │
              │  • Escrows    │                       │  • phone verification review │
              │  • Wallet     │                       │  • Withdrawals│
              │  • Disputes   │                       │  • Fees       │
              │  • Profile    │                       │  • Reconcile  │
              │  • PWA-ready  │                       └───────────────┘
              └───────────────┘
                      │
                      └───────────────────────────────────────
                                          │
                              Same API base URL (e.g. /api)
                              Same JWT auth, same endpoints
```

---

## 1. Single Database

- **PostgreSQL** — one database for the entire platform.
- **Used by:** NestJS API only. The web app **never** talks to the DB directly.
- **Configured via:** `DATABASE_URL` (same for all environments).
- **Prisma** — single schema; migrations apply once and serve both clients.

**Implications:**
- All users are in the same `User` table.
- All escrows, wallets, disputes, phone verification, etc. are in the same tables.
- Admin actions (phone verification approval, withdrawals, etc.) affect the same data users see.

---

## 2. Single Backend API

- **NestJS** (`services/api`) — one backend for web and admin.
- **Base URL:** `NEXT_PUBLIC_API_BASE_URL` (e.g. `http://localhost:4000/api`)
- **Auth:** Same JWT issuance, validation, and refresh for the web app.
- **Endpoints:** Same routes for auth, escrows, wallet, disputes, phone verification, payments, etc.

**Key API surface (shared):**

| Area        | Examples                    | Used by Web |
|------------|-----------------------------|-------------|
| Auth       | `/auth/login`, `/auth/me`   | ✅          |
| Escrows    | `/escrows`, `/escrows/:id`  | ✅          |
| Wallet     | `/wallet`, `/wallet/transactions` | ✅   |
| Payments   | `/payments/wallet/topup`    | ✅          |
| Disputes   | `/disputes`                 | ✅          |
| phone verification        | `/phone verification/*`                    | ✅          |
| Users      | `/users`                    | ✅ (admin)  |
| Admin      | `/admin/reconciliation`     | ✅ (admin)  |

---

## 3. Admin Management & Backend

- **Admin backend** = same NestJS API. Admin-specific logic lives in:
  - `modules/admin` (e.g. reconciliation),
  - `modules/users` (user management),
  - phone verification review, fee config, wallet credit/debit, withdrawal approvals, etc.
- **Admin dashboard UI** = **web only** (`apps/web/pages/admin/*`).  
- **Data:** Admin actions (approve phone verification, approve withdrawals, adjust wallets, etc.) write to the **same database** that the web app reads from. **One source of truth.**

**Implications:**
- phone verification approved on admin dashboard → immediately reflects for that user on the web app.
- Withdrawal approved on admin → wallet balance updates everywhere.
- No separate “admin database” or “admin API” — only additional **admin-only** routes and UI.

---

## 4. Web App: Single Frontend

- **Web:** Next.js app (mobile-first, PWA-ready). Uses `apiClient` → `NEXT_PUBLIC_API_BASE_URL`.
- Same backend, same DB, same auth. Responsive design works on desktop and mobile browsers.

---

## 5. Configuration Checklist

| Variable                     | Where       | Purpose                    |
|-----------------------------|-------------|----------------------------|
| API base URL                | `NEXT_PUBLIC_API_BASE_URL` (web) | Backend used by web app |
| `DATABASE_URL`              | API only    | PostgreSQL connection      |
| `JWT_SECRET`                | API only    | Token signing              |

**Production example:**
- `NEXT_PUBLIC_API_BASE_URL=https://api.myxcrow.com/api`
- `DATABASE_URL` → single PostgreSQL instance used by the API.

---

## 6. Summary

| Layer            | Shared? | Notes                                        |
|------------------|--------|----------------------------------------------|
| **Database**     | ✅ Yes | Single PostgreSQL for all users and admin   |
| **Backend API**  | ✅ Yes | Single NestJS app                            |
| **Admin backend**| ✅ Yes | Same API + DB; admin = extra routes + web UI |
| **Web frontend** | —      | Next.js (mobile-first, PWA-ready)            |
| **Admin UI**     | —      | Web-only; consumes shared admin API          |

**Remember:** One database, one backend, one web app.

---

**Last Updated:** January 2026
