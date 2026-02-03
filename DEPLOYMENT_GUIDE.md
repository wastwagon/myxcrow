# MYXCROW Deployment Guide (VPS + Coolify)

Canonical deployment guide for running MYXCROW on your **VPS** using **Coolify**.

## What Coolify will run

- **API**: `services/api/Dockerfile.production` (listens on port `4000`)
- **Web**: `apps/web/Dockerfile.production` (listens on port `3000`)
- **Infrastructure** (choose one):
  - **Recommended**: Create Postgres + Redis as **Coolify Resources**
  - **Alternative**: Run your own with `docker-compose.production.yml`

## Prerequisites

- VPS with Coolify installed and working
- DNS A records pointing to the VPS
  - `api.myxcrow.com` → VPS IP
  - `myxcrow.com` (and optionally `www.myxcrow.com`) → VPS IP
- Ports open: `80`, `443` (and `22` for SSH)
- Production environment variables prepared: see `COOLIFY_ENV_TEMPLATE.md`

## Deploy in Coolify (recommended path)

### 1) Create resources

In Coolify:

- **PostgreSQL** resource (save connection string)
- **Redis** resource (save connection string)

### 2) Deploy the API

Create a new application:

- **Repo**: your GitHub repo
- **Build pack**: Dockerfile
- **Dockerfile path**: `services/api/Dockerfile.production`
- **Port**: `4000`
- **Health check**: `/api/health`
- **Domain**: `api.myxcrow.com`
- **Environment variables**: copy from `COOLIFY_ENV_TEMPLATE.md`

**Important**: ensure the API container runs DB migrations on start (the production Dockerfile/start script should already handle this; if you changed it, verify migrations are executed before serving traffic).

### 3) Deploy the Web

Create a new application:

- **Build pack**: Dockerfile
- **Dockerfile path**: `apps/web/Dockerfile.production`
- **Port**: `3000`
- **Domain**: `myxcrow.com`
- **Environment variables**:
  - `NEXT_PUBLIC_API_BASE_URL=https://api.myxcrow.com/api`
  - `NEXT_PUBLIC_ENV=production`

### 4) Verify

- API health: `https://api.myxcrow.com/api/health` → `200`
- Web loads: `https://myxcrow.com`
- Login works using your seeded/admin credentials

## Alternative: self-managed Postgres/Redis/MinIO on VPS

If you do not want to use Coolify Resources for infrastructure, you can run them yourself:

```bash
docker compose -f docker-compose.production.yml up -d
```

Then point your API environment variables to the container endpoints (especially `DATABASE_URL`, `REDIS_URL`, and S3/MinIO settings).

## Secrets

Generate strong secrets on your VPS:

```bash
openssl rand -base64 32
```

Use for values like `JWT_SECRET` and any encryption keys used by the API.

## Related docs

- `COOLIFY_QUICK_START.md` (fast setup)
- `COOLIFY_ENV_TEMPLATE.md` (copy/paste env vars)
- `DOMAIN_CONFIGURATION.md` (DNS & SSL notes)

