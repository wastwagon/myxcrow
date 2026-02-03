# Shared Architecture: One Database, One Backend, One Admin

**Date:** January 2026  
**Principle:** Web and mobile use the **same database**, **same backend API**, and **same admin management backend**. Only the frontend clients differ.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SHARED BACKEND LAYER                             │
├─────────────────────────────────────────────────────────────────────────┤
│  PostgreSQL (single DB)  ←  NestJS API (single backend)  ←  Redis, etc.  │
└─────────────────────────────────────────────────────────────────────────┘
                                          │
                      ┌───────────────────┼───────────────────┐
                      │                   │                   │
                      ▼                   ▼                   ▼
              ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
              │  Web App      │   │  Mobile App   │   │  Admin        │
              │  (Next.js)    │   │  (Expo/RN)    │   │  Dashboard    │
              │               │   │               │   │  (Web only)   │
              │  • Dashboard  │   │  • Tabs       │   │  • Users      │
              │  • Escrows    │   │  • Escrows    │   │  • KYC Review │
              │  • Wallet     │   │  • Wallet     │   │  • Withdrawals│
              │  • Disputes   │   │  • Disputes   │   │  • Fees       │
              │  • Profile    │   │  • Profile    │   │  • Reconcile  │
              └───────────────┘   └───────────────┘   └───────────────┘
                      │                   │                   │
                      └───────────────────┼───────────────────┘
                                          │
                              Same API base URL (e.g. /api)
                              Same JWT auth, same endpoints
```

---

## 1. Single Database

- **PostgreSQL** — one database for the entire platform.
- **Used by:** NestJS API only. Web and mobile **never** talk to the DB directly.
- **Configured via:** `DATABASE_URL` (same for all environments serving web + mobile).
- **Prisma** — single schema; migrations apply once and serve both clients.

**Implications:**
- All users (web + mobile) are in the same `User` table.
- All escrows, wallets, disputes, KYC, etc. are in the same tables.
- Admin actions (KYC approval, withdrawals, etc.) affect the same data mobile and web users see.

---

## 2. Single Backend API

- **NestJS** (`services/api`) — one backend for web, mobile, and admin.
- **Base URL:**  
  - Web: `NEXT_PUBLIC_API_BASE_URL` (e.g. `http://localhost:4000/api`)  
  - Mobile: `EXPO_PUBLIC_API_BASE_URL` (same value in production).
- **Auth:** Same JWT issuance, validation, and refresh for both clients.
- **Endpoints:** Same routes for auth, escrows, wallet, disputes, KYC, payments, etc.

**Key API surface (shared):**

| Area        | Examples                    | Used by Web | Used by Mobile |
|------------|-----------------------------|-------------|----------------|
| Auth       | `/auth/login`, `/auth/me`   | ✅          | ✅             |
| Escrows    | `/escrows`, `/escrows/:id`  | ✅          | ✅             |
| Wallet     | `/wallet`, `/wallet/transactions` | ✅   | ✅             |
| Payments   | `/payments/wallet/topup`    | ✅          | ✅             |
| Disputes   | `/disputes`                 | ✅          | ✅             |
| KYC        | `/kyc/*`                    | ✅          | ✅             |
| Users      | `/users`                    | ✅ (admin)  | ❌ (no UI)     |
| Admin      | `/admin/reconciliation`     | ✅ (admin)  | ❌ (no UI)     |

---

## 3. Admin Management & Backend

- **Admin backend** = same NestJS API. Admin-specific logic lives in:
  - `modules/admin` (e.g. reconciliation),
  - `modules/users` (user management),
  - KYC review, fee config, wallet credit/debit, withdrawal approvals, etc.
- **Admin dashboard UI** = **web only** (`apps/web/pages/admin/*`).  
  Mobile has no admin screens; it’s a **UI choice**, not a separate backend.
- **Data:** Admin actions (approve KYC, approve withdrawals, adjust wallets, etc.) write to the **same database** that web and mobile read from.  
  **One source of truth.**

**Implications:**
- KYC approved on admin dashboard → immediately reflects for that user on web and mobile.
- Withdrawal approved on admin → wallet balance updates everywhere.
- No separate “admin database” or “admin API” — only additional **admin-only** routes and UI.

---

## 4. Web vs Mobile: Clients Only

- **Web:** Next.js app. Uses `apiClient` → `NEXT_PUBLIC_API_BASE_URL`.
- **Mobile:** Expo/React Native app. Uses `apiClient` → `EXPO_PUBLIC_API_BASE_URL`.

Same backend, same DB, same auth. Differences are only:

- **UI:** Layout, navigation, forms (e.g. web vs native).
- **Features:** e.g. admin UI and heavy reporting on web; camera, biometrics, push on mobile.
- **Storage:** Web uses `localStorage`; mobile uses `SecureStore` / `AsyncStorage` for tokens and user prefs.

---

## 5. Configuration Checklist

Ensure these point to the **same** backend (and thus same DB + admin backend):

| Variable                     | Web        | Mobile     | Purpose                    |
|-----------------------------|------------|------------|----------------------------|
| API base URL                | `NEXT_PUBLIC_API_BASE_URL` | `EXPO_PUBLIC_API_BASE_URL` | Backend used by both       |
| `DATABASE_URL`              | —          | —          | Used only by API           |
| `JWT_SECRET`                | —          | —          | Used only by API           |

**Production example:**
- `NEXT_PUBLIC_API_BASE_URL=https://api.myxcrow.com/api`
- `EXPO_PUBLIC_API_BASE_URL=https://api.myxcrow.com/api`
- `DATABASE_URL` → single PostgreSQL instance used by the API.

---

## 6. Summary

| Layer            | Shared? | Notes                                        |
|------------------|--------|----------------------------------------------|
| **Database**     | ✅ Yes | Single PostgreSQL for all users and admin   |
| **Backend API**  | ✅ Yes | Single NestJS app                            |
| **Admin backend**| ✅ Yes | Same API + DB; admin = extra routes + web UI |
| **Web frontend** | —      | Next.js; one of the clients                  |
| **Mobile frontend** | —   | Expo/RN; another client                      |
| **Admin UI**     | —      | Web-only; consumes shared admin API          |

**Remember:**  
We use the **same database** and **same admin management backend** for both the **mobile app** and **web version**. Only the frontends (and which features they expose) differ.

---

**Last Updated:** January 2026
