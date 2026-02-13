# MYXCROW – Implementation Phase Plan

**Purpose:** Systematic implementation of system improvements for a flawless public-facing escrow platform.  
**Created:** February 2025  
**Status:** Planning

---

## Overview

This document organizes all recommendations from the system review into phases. Each phase is designed to be completed before moving to the next. Dependencies are respected, and each task includes acceptance criteria.

---

## Phase 0: Preparation (Before Implementation)

**Duration:** 1 day  
**Goal:** Set up tooling and baseline for safe implementation.

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 0.1 | Create feature branch `feat/system-hardening` | 5 min | Work off main; merge after each phase |
| 0.2 | Ensure all existing tests pass | 30 min | `cd services/api && pnpm test` |
| 0.3 | Document current API behavior (manual smoke test) | 1 hr | Register, create escrow, fund, release – record steps |
| 0.4 | Set up staging/preview env on Render (optional) | 1 hr | Test changes before production |

**Exit criteria:** Branch exists, tests pass, baseline behavior documented.

---

## Phase 1: Critical Security & Data Integrity (P0)

**Duration:** 3–5 days  
**Goal:** Prevent double-crediting and inconsistent financial state.

### 1.1 Webhook Idempotency

**Files:** `services/api/src/modules/payments/payments.service.ts`, `wallet-topup.service.ts`

| Step | Action | Acceptance Criteria |
|------|--------|---------------------|
| 1.1.1 | In `handleWebhook`, before processing `charge.success`, check if payment/funding already completed | Duplicate webhook returns `{ received: true }` without side effects |
| 1.1.2 | In `verifyWalletTopup`, check `WalletFunding.status` before crediting | Idempotent – safe to call multiple times |
| 1.1.3 | In `verifyEscrowFunding`, check escrow status before updating | Idempotent – safe to call multiple times |
| 1.1.4 | Add unit tests for idempotent webhook handling | Tests pass |

**Effort:** 4–6 hours

---

### 1.2 Database Transactions for Financial Flows

**Files:** `services/api/src/modules/wallet/wallet.service.ts`, `escrow.service.ts`, `payments/ledger-helper.service.ts`

| Step | Action | Acceptance Criteria |
|------|--------|---------------------|
| 1.2.1 | Wrap `topUpWallet` (create funding + update balance + ledger) in `prisma.$transaction` | On any failure, no partial updates |
| 1.2.2 | Wrap `creditFromFunding` in transaction | Same as above |
| 1.2.3 | Wrap escrow release flow (update escrow + wallet credits + ledger) in transaction | Same as above |
| 1.2.4 | Wrap escrow refund flow in transaction | Same as above |
| 1.2.5 | Add/update unit tests for rollback behavior | Tests pass |

**Effort:** 6–8 hours

---

**Phase 1 Exit Criteria:**
- [x] Webhook can be called 3× with same reference – only first processes
- [x] Simulated DB failure mid-flow – no partial wallet/escrow updates
- [ ] All Phase 1 tests pass (existing tests have TS config issues)

---

## Phase 2: Security Hardening (P1)

**Duration:** 2–3 days  
**Goal:** Add security headers, safe error handling, and stricter rate limits.

### 2.1 Helmet & Security Headers

**Files:** `services/api/src/main.ts`, `package.json`

| Step | Action | Acceptance Criteria |
|------|--------|---------------------|
| 2.1.1 | Add `helmet` package | `pnpm add helmet` |
| 2.1.2 | Apply helmet middleware in `main.ts` (before routes) | Response headers include X-Content-Type-Options, X-Frame-Options, etc. |
| 2.1.3 | Configure CSP if needed (e.g. allow Intercom) | No broken scripts on web |

**Effort:** 1–2 hours

---

### 2.2 Global Exception Filter

**Files:** `services/api/src/common/filters/http-exception.filter.ts`, `app.module.ts`

| Step | Action | Acceptance Criteria |
|------|--------|---------------------|
| 2.2.1 | Create `HttpExceptionFilter` that catches all exceptions | Unhandled errors return 500 with generic message |
| 2.2.2 | In production, never expose stack trace or internal details | Response body is safe for clients |
| 2.2.3 | Log full error + stack server-side | Logs available for debugging |
| 2.2.4 | Register filter globally in `main.ts` | All routes use filter |

**Effort:** 2–3 hours

---

### 2.3 Stricter Rate Limits for Auth & OTP

**Files:** `services/api/src/common/rate-limit/`, `auth.controller.ts`

| Step | Action | Acceptance Criteria |
|------|--------|---------------------|
| 2.3.1 | Add endpoint-specific rate limit (e.g. decorator or middleware) | Configurable per route |
| 2.3.2 | `/auth/send-phone-otp`: 3 per phone per 15 min | Exceeding returns 429 |
| 2.3.3 | `/auth/login`: 5 per IP per 15 min | Exceeding returns 429 |
| 2.3.4 | `/auth/register`: 3 per IP per hour | Exceeding returns 429 |
| 2.3.5 | Document new env vars (e.g. `RATE_LIMIT_OTP_PER_PHONE`) | `.env.example` updated |

**Effort:** 4–5 hours

---

**Phase 2 Exit Criteria:**
- [x] Security headers present on API responses
- [x] Unhandled error returns safe 500 response
- [x] OTP and auth endpoints enforce stricter limits
- [ ] All Phase 2 tests pass

---

## Phase 3: API & Backend Improvements (P1–P2)

**Duration:** 3–4 days  
**Goal:** Better API design, health checks, and environment validation.

### 3.1 API Documentation (Swagger)

**Files:** `services/api/package.json`, `main.ts`, controllers (add decorators)

| Step | Action | Acceptance Criteria |
|------|--------|---------------------|
| 3.1.1 | Add `@nestjs/swagger` | Package installed |
| 3.1.2 | Configure Swagger in `main.ts` (e.g. `/api/docs`) | UI accessible at `/api/docs` |
| 3.1.3 | Add `@ApiTags`, `@ApiOperation` to main controllers | Key endpoints documented |
| 3.1.4 | Add `@ApiBearerAuth()` for protected routes | Auth flow clear in docs |

**Effort:** 4–6 hours

---

### 3.2 Health Check for Deployment

**Files:** `render.yaml`

| Step | Action | Acceptance Criteria |
|------|--------|---------------------|
| 3.2.1 | Change `healthCheckPath` to `/api/health/readiness` | Render uses readiness for health |
| 3.2.2 | Ensure readiness checks DB connectivity | Unhealthy if DB unreachable |

**Effort:** 15 min

---

### 3.3 Payments List Endpoint

**Files:** `services/api/src/modules/payments/payments.controller.ts`

| Step | Action | Acceptance Criteria |
|------|--------|---------------------|
| 3.3.1 | Change `list` from `@Body()` to `@Query()` for filters | `GET /payments?userId=...&escrowId=...` works |
| 3.3.2 | Add `@UseGuards(JwtAuthGuard)` and scope to current user | Users only see own payments |

**Effort:** 1 hour

---

### 3.4 Environment Validation at Startup

**Files:** `services/api/src/app.module.ts`, new `config/validate.env.ts`

| Step | Action | Acceptance Criteria |
|------|--------|---------------------|
| 3.4.1 | Define required env vars (e.g. DATABASE_URL, JWT_SECRET) | List documented |
| 3.4.2 | Validate on app bootstrap – fail fast if missing | App won't start with invalid config |
| 3.4.3 | Log validated config (mask secrets) | Startup log confirms config |

**Effort:** 2–3 hours

---

**Phase 3 Exit Criteria:**
- [x] Swagger docs available and useful
- [x] Render uses readiness health check
- [x] Payments list uses query params and auth
- [x] App fails fast on missing env vars
- [ ] All Phase 3 tests pass

---

## Phase 4: Frontend & Client Improvements (P2)

**Duration:** 2–3 days  
**Goal:** Safer token handling, better error UX, and client robustness.

### 4.1 Web – Token Storage (Optional / Future)

**Files:** `apps/web/lib/auth.ts`, `api-client.ts`, API auth flow

| Step | Action | Acceptance Criteria |
|------|--------|---------------------|
| 4.1.1 | Evaluate httpOnly cookie approach | Decision documented |
| 4.1.2 | If keeping localStorage: ensure CSP, XSS mitigations | Security note in code |
| 4.1.3 | If migrating to cookies: implement server-side cookie set + API reads | Auth works with cookies |

**Effort:** 4–8 hours (if migrating)

**Note:** Can defer to later phase; localStorage + strict CSP is acceptable short-term.

---

### 4.2 API Client – Refresh Timeout & Error Handling

**Files:** `apps/web/lib/api-client.ts`, `apps/mobile/src/lib/api-client.ts`

| Step | Action | Acceptance Criteria |
|------|--------|---------------------|
| 4.2.1 | Add timeout (e.g. 10s) to refresh token request | No indefinite hang |
| 4.2.2 | On timeout, clear auth and redirect to login | Clean failure |
| 4.2.3 | Map common API error codes to user-friendly messages | Consistent UX |

**Effort:** 2–3 hours

---

### 4.3 Error UX – User-Friendly Messages

**Files:** Web + mobile components that display errors

| Step | Action | Acceptance Criteria |
|------|--------|---------------------|
| 4.3.1 | Create error message map (e.g. `INVALID_PHONE` → "Please enter a valid Ghana phone number") | Central mapping |
| 4.3.2 | Use map in toast/alert components | Users see friendly messages |
| 4.3.3 | Fallback for unknown errors: "Something went wrong. Please try again." | No raw API messages |

**Effort:** 2–3 hours

---

**Phase 4 Exit Criteria:**
- [x] Refresh token has timeout and clean failure
- [x] Common errors show user-friendly messages
- [x] No raw stack traces or internal errors to users

---

## Phase 5: Testing & Observability (P2)

**Duration:** 4–5 days  
**Goal:** Higher test coverage and better production visibility.

### 5.1 Unit Tests – Critical Paths

**Files:** New/updated `*.spec.ts` in `services/api`

| Step | Action | Acceptance Criteria |
|------|--------|---------------------|
| 5.1.1 | Escrow: create, fund, release, refund | Tests cover happy path + edge cases |
| 5.1.2 | Wallet: top-up, credit, debit | Same |
| 5.1.3 | Payments: webhook idempotency, duplicate handling | Same |
| 5.1.4 | Auth: register, login, refresh, OTP | Same |

**Effort:** 8–12 hours

---

### 5.2 E2E Tests – Critical Flows

**Files:** `services/api/test/e2e/`

| Step | Action | Acceptance Criteria |
|------|--------|---------------------|
| 5.2.1 | E2E: Register → Login → Create Escrow | Flow passes |
| 5.2.2 | E2E: Fund escrow (mock Paystack) → Release | Flow passes |
| 5.2.3 | E2E: Wallet top-up (mock) → Verify | Flow passes |

**Effort:** 6–8 hours

---

### 5.3 Structured Logging (Optional)

**Files:** `services/api/package.json`, `main.ts`, logger service

| Step | Action | Acceptance Criteria |
|------|--------|---------------------|
| 5.3.1 | Add Pino or similar | JSON logs with timestamps |
| 5.3.2 | Include request ID in logs | Traceable requests |
| 5.3.3 | Replace key `console.log` with structured logger | Consistent format |

**Effort:** 3–4 hours

---

**Phase 5 Exit Criteria:**
- [x] Payments webhook idempotency unit tests pass (`pnpm test -- payments.service.spec`)
- [x] Auth E2E tests updated for phone/OTP flow (`pnpm test:e2e`; requires `DATABASE_URL` in `.env`)
- [x] Escrow E2E: create → fund → deliver (auto-release)
- [x] Wallet E2E: get wallet, funding history, transactions
- [ ] (Optional) Structured logging in place

---

## Phase 6: Data & Code Quality (P3)

**Duration:** 2–3 days  
**Goal:** Better data model and type safety.

### 6.1 Soft Deletes (Optional)

**Files:** `schema.prisma`, migration, services

| Step | Action | Acceptance Criteria |
|------|--------|---------------------|
| 6.1.1 | Add `deletedAt DateTime?` to User, Escrow (if desired) | Migration created |
| 6.1.2 | Update queries to filter `deletedAt: null` | No hard deletes for these |
| 6.1.3 | Add "restore" or "purge" for admin if needed | Documented |

**Effort:** 4–6 hours

---

### 6.2 Type Safety – Remove `any`

**Files:** Controllers, DTOs

| Step | Action | Acceptance Criteria |
|------|--------|---------------------|
| 6.2.1 | Create `CurrentUser` interface | Typed user in guards |
| 6.2.2 | Replace `user: any` with `CurrentUser` | No `any` in auth flow |
| 6.2.3 | Type webhook body with DTO | Paystack event typed |

**Effort:** 2–3 hours

---

### 6.3 Database Indexes

**Files:** `schema.prisma`, migration

| Step | Action | Acceptance Criteria |
|------|--------|---------------------|
| 6.3.1 | Add composite indexes for common queries | Migration created |
| 6.3.2 | Verify with EXPLAIN on slow queries | Performance improved |

**Effort:** 1–2 hours

---

**Phase 6 Exit Criteria:**
- [ ] (Optional) Soft deletes where planned
- [x] Key `any` types removed (ICurrentUser in controllers)
- [x] Indexes added and validated (composite indexes migration)

---

## Implementation Timeline (Suggested)

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 0: Preparation | 1 day | 1 day |
| Phase 1: Critical Security & Data Integrity | 3–5 days | 4–6 days |
| Phase 2: Security Hardening | 2–3 days | 6–9 days |
| Phase 3: API & Backend Improvements | 3–4 days | 9–13 days |
| Phase 4: Frontend & Client | 2–3 days | 11–16 days |
| Phase 5: Testing & Observability | 4–5 days | 15–21 days |
| Phase 6: Data & Code Quality | 2–3 days | 17–24 days |

**Total estimate:** ~3–4 weeks for one developer, assuming no major blockers.

---

## Checklist Summary

Use this as a high-level tracker:

```
Phase 0: [x] 0.1 [x] 0.2 [ ] 0.3 [ ] 0.4
Phase 1: [x] 1.1 Webhook Idempotency [x] 1.2 DB Transactions
Phase 2: [x] 2.1 Helmet [x] 2.2 Exception Filter [x] 2.3 Rate Limits
Phase 3: [x] 3.1 Swagger [x] 3.2 Health [x] 3.3 Payments [x] 3.4 Env Validation
Phase 4: [ ] 4.1 Token (optional) [x] 4.2 Client [x] 4.3 Error UX
Phase 5: [x] 5.1 Unit Tests [x] 5.2 E2E [ ] 5.3 Logging (optional)
Phase 6: [ ] 6.1 Soft Deletes (optional) [x] 6.2 Types [x] 6.3 Indexes
```

---

## Notes

- **Merge strategy:** Merge after each phase; avoid long-lived branches.
- **Rollback:** Each phase should be independently revertible.
- **Staging:** Test on staging/preview before production when possible.
- **Monitoring:** After Phase 5, monitor errors and performance in production.

---

*Document version: 1.0*
