# MYXCROW - Escrow Platform

A comprehensive escrow platform built with Next.js and NestJS, designed for secure transactions in Ghana.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)
- pnpm (package manager)

### Start All Services

```bash
docker-compose -f infra/docker/docker-compose.dev.yml up -d
```

### Access the Application

- **Frontend:** http://localhost:3003
- **API:** http://localhost:4000/api
- **API Health:** http://localhost:4000/api/health
- **Mailpit (Email):** http://localhost:8026
- **MinIO Console:** http://localhost:9004

## 📁 Project Structure

```
myexrow/
├── apps/
│   └── web/              # Next.js frontend
├── services/
│   └── api/              # NestJS backend
├── infra/
│   └── docker/           # Docker configuration
└── packages/
    └── types/            # Shared TypeScript types
```

## 🔑 Test Accounts

### Admin
- **Email:** `admin@myxcrow.com`
- **Password:** `Admin123!`

### Test Users (Password: `password123`)
- Buyers: `buyer1@test.com` through `buyer5@test.com`
- Sellers: `seller1@test.com` through `seller5@test.com`

## 📚 Documentation

- [Product Review](PRODUCT_REVIEW.md) - Complete feature overview
- [Implementation Summary](README_IMPLEMENTATION.md) - Detailed implementation guide

## 🛠️ Development

### Backend (API)
```bash
cd services/api
pnpm install
pnpm dev
```

### Frontend (Web)
```bash
cd apps/web
pnpm install
pnpm dev
```

### Database Seeding
```bash
cd services/api
pnpm seed
```

## 📄 License

Private - All Rights Reserved
