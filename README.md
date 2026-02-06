# MYXCROW - Escrow Platform

A comprehensive escrow platform built with Next.js and NestJS, designed for secure transactions in Ghana.

## 🎉 MVP Status: **100% COMPLETE** ✅

All MVP phases have been successfully implemented:
- ✅ SMS Notifications
- ✅ Mobile App (iOS + Android)
- ✅ Live Chat Support

See [MVP_COMPLETE.md](MVP_COMPLETE.md) for full details.

## 🚀 Quick Start

### Prerequisites
- **Docker Desktop** (v20.10+)
- **Docker Compose** (v2.0+ or v1.29+)

### Automated Setup (Recommended)

Run the setup script to start all services:

```bash
./setup-local.sh
```

This will automatically:
- ✅ Check Docker is running
- ✅ Start all infrastructure services (PostgreSQL, Redis, MinIO, Mailpit)
- ✅ Run database migrations
- ✅ Start API and Web services
- ✅ Verify all services are healthy

### Manual Setup

Alternatively, start services manually:

```bash
docker-compose -f infra/docker/docker-compose.dev.yml up -d
```

### Access the Application

Once services are running (Docker maps web to port **3007**):

- **Frontend:** http://localhost:3007
- **API:** http://localhost:4000/api
- **API Health:** http://localhost:4000/api/health
- **Mailpit (Email):** http://localhost:8026
- **MinIO Console:** http://localhost:9004 (minioadmin/minioadmin)

### Seed Test Data

After starting services, seed the database with test data:

```bash
./scripts/db-seed.sh
```

Or manually:
```bash
docker exec escrow_api pnpm seed
```

**Wallet top-up (Paystack):** To test payments locally, add your Paystack keys to `.env` and see **[LOCAL_PAYSTACK_TESTING.md](LOCAL_PAYSTACK_TESTING.md)**.

## 🏗️ Shared Architecture

**Web and mobile use the same infrastructure:**
- **One database** (PostgreSQL) — shared by all users and admin
- **One backend API** (NestJS) — serves both web and mobile
- **Same admin backend** — admin dashboard (web UI) uses the same API and DB

Only the **frontends** differ: web (Next.js) and mobile (Expo/React Native) are different clients talking to the same API. See **[SHARED_ARCHITECTURE.md](SHARED_ARCHITECTURE.md)** for details.

## 📁 Project Structure

```
myxcrow/
├── apps/
│   ├── web/              # Next.js frontend (includes admin dashboard)
│   └── mobile/           # React Native mobile app (iOS + Android)
├── services/
│   └── api/              # NestJS backend (shared by web + mobile)
└── infra/
    └── docker/           # Docker configuration
```

## 🔑 Test Accounts

### Admin
- **Email:** `admin@myxcrow.com`
- **Password:** `Admin123!`

### Test Users (Password: `password123`)
- Buyers: `buyer1@test.com` through `buyer5@test.com`
- Sellers: `seller1@test.com` through `seller5@test.com`

## 📚 Documentation

### Architecture & Development
- **[Shared Architecture](SHARED_ARCHITECTURE.md)** - One DB, one backend, one admin for web + mobile
- **[Local Development Guide](LOCAL_DEVELOPMENT.md)** - Complete guide for local setup and development
- [Product Review](PRODUCT_REVIEW.md) - Complete feature overview

### Production Deployment
- **[Render Deployment](RENDER_DEPLOYMENT.md)** - Deploy with Render Blueprint (start here!)
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Canonical deployment guide
- **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** - Pre-deploy checklist
- **[Domain Configuration](DOMAIN_CONFIGURATION.md)** - Custom domains on Render
- **[Environment Variables](RENDER_ENV_TEMPLATE.md)** - Production env vars reference
- **[Complete Product Review](PRODUCT_REVIEW_COMPLETE.md)** - Full product review and architecture overview

### Market Analysis & Enhancements
- **[MVP Focus Summary](MVP_FOCUS_SUMMARY.md)** - Quick MVP overview (start here!)
- **[MVP Enhancement Plan](MVP_ENHANCEMENT_PLAN.md)** - Detailed MVP implementation plan
- **[MVP Implementation Status](MVP_IMPLEMENTATION_STATUS.md)** - ✅ **100% Complete** - All phases done!
- **[SMS Notifications Implementation](SMS_NOTIFICATIONS_IMPLEMENTATION.md)** - ✅ SMS feature implementation guide
- **[Mobile App Implementation](apps/mobile/MOBILE_APP_IMPLEMENTATION.md)** - ✅ Mobile app development guide
- **[Live Chat Implementation](LIVE_CHAT_IMPLEMENTATION.md)** - ✅ Live chat integration guide
- **[Self-Hosted Face Verification](SELF_HOSTED_FACE_VERIFICATION.md)** - ✅ Face verification system documentation
- **[Phase 2 Complete Summary](PHASE_2_COMPLETE_SUMMARY.md)** - Mobile app completion summary
- **[Phase 3 Complete Summary](PHASE_3_COMPLETE_SUMMARY.md)** - Live chat completion summary
- **[Competitor Analysis](COMPETITOR_ANALYSIS_AND_ENHANCEMENTS.md)** - Comprehensive competitor feature analysis
- **[Ghana Enhancement Roadmap](GHANA_ENHANCEMENT_ROADMAP.md)** - 12-month enhancement plan (updated for MVP)
- **[Competitor Features Summary](COMPETITOR_FEATURES_SUMMARY.md)** - Quick reference comparison
- **[Deferred Features](DEFERRED_FEATURES.md)** - Features moved to future phases

## 🛠️ Development

### Using Docker (Recommended)

All services run in Docker containers with hot-reload enabled. See [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) for complete details.

**Quick Commands:**
```bash
# Start all services
./setup-local.sh

# View logs
docker-compose -f infra/docker/docker-compose.dev.yml logs -f

# Stop services
docker-compose -f infra/docker/docker-compose.dev.yml down

# Seed database
./scripts/db-seed.sh

# Check service health
./scripts/check-services.sh
```

### Local Development (Without Docker)

If you prefer to run services locally:

**Backend (API):**
```bash
cd services/api
pnpm install
pnpm dev
```

**Frontend (Web):**
```bash
cd apps/web
pnpm install
pnpm dev
```

**Mobile App:**
```bash
cd apps/mobile
pnpm install
pnpm start
```

**Note:** You'll need to set up PostgreSQL, Redis, and MinIO separately for local development.

## 📄 License

Private - All Rights Reserved
