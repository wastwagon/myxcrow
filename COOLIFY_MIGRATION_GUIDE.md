# MYXCROW - Coolify Migration Guide

**Migration Date:** January 2026  
**Platform:** VPS with Coolify  
**Repository:** https://github.com/wastwagon/myxcrow

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Coolify Setup](#coolify-setup)
4. [Infrastructure Services](#infrastructure-services)
5. [API Service Deployment](#api-service-deployment)
6. [Web Service Deployment](#web-service-deployment)
7. [Environment Variables](#environment-variables)
8. [Database Migration](#database-migration)
9. [Post-Deployment Checklist](#post-deployment-checklist)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This guide will help you deploy MYXCROW to your own VPS running Coolify. Coolify is a self-hosted deployment platform that provides Docker-based deployments with automatic SSL, domain management, and Git integration.

### Key Notes

- **Build Context:** Coolify uses Dockerfiles directly (no separate build/runtime environments)
- **Monorepo Support:** Use "Base Directory" setting in Coolify to target specific services
- **Environment Variables:** Set directly in Coolify dashboard
- **Database:** Can use Coolify's managed PostgreSQL or external database
- **Storage:** Persistent volumes for MinIO/S3 storage

---

## Prerequisites

### VPS Requirements

- **Minimum:** 2 CPU cores, 4GB RAM, 20GB SSD
- **Recommended:** 4 CPU cores, 8GB RAM, 50GB SSD
- **OS:** Ubuntu 22.04 LTS or Debian 12 (recommended)
- **Network:** Public IP address with ports 80, 443, 22 open

### Software Requirements

- Docker Engine 24.0+
- Docker Compose 2.0+
- Coolify 4.x installed and configured
- Domain name(s) pointing to your VPS IP

### Domain Setup

- **API Domain:** `api.myxcrow.com`
- **Web Domain:** `myxcrow.com` (main domain)
- **Optional:** `www.myxcrow.com` → redirect to `myxcrow.com`

**DNS Configuration:**
- Create A record: `myxcrow.com` → Your VPS IP
- Create A record: `api.myxcrow.com` → Your VPS IP
- Optional: Create A record: `www.myxcrow.com` → Your VPS IP (or use CNAME to `myxcrow.com`)

---

## Coolify Setup

### 1. Install Coolify (if not already installed)

```bash
# On your VPS
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Follow the installation prompts and access Coolify at `http://your-vps-ip:8000`

### 2. Create a New Project

1. Log into Coolify dashboard
2. Click **"New Project"**
3. Name: `myxcrow`
4. Description: `MYXCROW Escrow Platform`

### 3. Connect GitHub Repository

1. In Coolify, go to **Settings** → **Source Providers**
2. Connect your GitHub account
3. Select repository: `wastwagon/myxcrow`
4. Save the connection

---

## Infrastructure Services

Coolify can manage PostgreSQL and Redis, or you can deploy them via Docker Compose.

### Option A: Use Coolify's Managed Services (Recommended)

#### PostgreSQL Database

1. In your Coolify project, click **"New Resource"** → **"Database"**
2. Select **PostgreSQL**
3. Name: `myxcrow-db`
4. Version: `15-alpine` (or latest)
5. Set password (save securely)
6. **Important:** Note the connection string format:
   ```
   postgresql://postgres:PASSWORD@myxcrow-db:5432/postgres
   ```

#### Redis Cache

1. Click **"New Resource"** → **"Database"**
2. Select **Redis**
3. Name: `myxcrow-redis`
4. Version: `7-alpine` (or latest)
5. **Important:** Note the connection string format:
   ```
   redis://myxcrow-redis:6379
   ```

### Option B: Deploy via Docker Compose (Alternative)

If you prefer to manage infrastructure separately, use the provided `docker-compose.production.yml`:

```bash
# On your VPS (outside Coolify)
cd /opt/myxcrow-infra
docker-compose -f docker-compose.production.yml up -d
```

**Note:** Update connection strings in Coolify environment variables to use external hostnames/IPs.

---

## API Service Deployment

### 1. Create New Application

1. In Coolify project, click **"New Application"**
2. Name: `myxcrow-api`
3. Source: Select your GitHub repository (`wastwagon/myxcrow`)
4. Branch: `main` (or your production branch)

### 2. Configure Build Settings

1. **Build Pack:** Select **"Dockerfile"**
2. **Dockerfile Path:** `services/api/Dockerfile.production`
3. **Docker Build Context:** `.` (root of repository)
4. **Base Directory:** Leave empty (we'll use Dockerfile context)

### 3. Configure Ports

- **Port:** `4000`
- **Expose Port:** `4000`

### 4. Configure Health Check

- **Health Check Path:** `/api/health`
- **Health Check Port:** `4000`
- **Interval:** `30s`
- **Timeout:** `10s`
- **Retries:** `3`

### 5. Set Environment Variables

Add the following environment variables in Coolify:

```bash
# Application
NODE_ENV=production
PORT=4000
WEB_APP_URL=https://myxcrow.com

# Database (from Coolify managed PostgreSQL)
DATABASE_URL=postgresql://postgres:PASSWORD@myxcrow-db:5432/postgres

# Redis (from Coolify managed Redis)
REDIS_URL=redis://myxcrow-redis:6379

# JWT
JWT_SECRET=your-strong-secret-key-here-generate-with-openssl-rand-base64-32
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# S3 Storage (MinIO or AWS S3)
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=escrow-evidence
S3_REGION=us-east-1

# Paystack
PAYSTACK_SECRET_KEY=sk_live_your_secret_key
PAYSTACK_PUBLIC_KEY=pk_live_your_public_key
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret

# Email (SMTP)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com

# Security
CSRF_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=60
ENCRYPTION_KEY=your-encryption-key-generate-with-openssl-rand-base64-32
```

### 6. Configure Domain

1. Click **"Domains"** tab
2. Add domain: `api.myxcrow.com`
3. Enable **"Generate SSL Certificate"** (Let's Encrypt)
4. Save

### 7. Deploy

1. Click **"Deploy"**
2. Monitor build logs
3. Wait for health check to pass

---

## Web Service Deployment

### 1. Create New Application

1. In Coolify project, click **"New Application"**
2. Name: `myxcrow-web`
3. Source: Select your GitHub repository (`wastwagon/myxcrow`)
4. Branch: `main` (or your production branch)

### 2. Configure Build Settings

1. **Build Pack:** Select **"Dockerfile"**
2. **Dockerfile Path:** `apps/web/Dockerfile.production`
3. **Docker Build Context:** `.` (root of repository)
4. **Base Directory:** Leave empty

### 3. Configure Ports

- **Port:** `3000`
- **Expose Port:** `3000`

### 4. Configure Health Check

- **Health Check Path:** `/`
- **Health Check Port:** `3000`
- **Interval:** `30s`
- **Timeout:** `10s`
- **Retries:** `3`

### 5. Set Environment Variables

```bash
# Application
NODE_ENV=production
PORT=3000

# API URL (use your API domain)
NEXT_PUBLIC_API_BASE_URL=https://api.myxcrow.com/api
NEXT_PUBLIC_ENV=production
```

### 6. Configure Domain

1. Click **"Domains"** tab
2. Add domain: `myxcrow.com` (main domain)
3. Optional: Add `www.myxcrow.com` and redirect to `myxcrow.com`
4. Enable **"Generate SSL Certificate"** (Let's Encrypt)
5. Save

### 7. Deploy

1. Click **"Deploy"**
2. Monitor build logs
3. Wait for health check to pass

---

## Environment Variables

### Generate Secure Secrets

```bash
# Generate JWT Secret
openssl rand -base64 32

# Generate Encryption Key
openssl rand -base64 32
```

### Environment Variable Reference

See `.env.example` for all available environment variables and their descriptions.

---

## Database Migration

### 1. Run Migrations

After the API service is deployed, migrations should run automatically via the Dockerfile `CMD`. However, you can also run them manually:

```bash
# Via Coolify terminal (if available)
cd /opt/coolify/data/applications/myxcrow-api
docker exec -it myxcrow-api-container sh
cd /app/services/api
pnpm prisma migrate deploy
```

### 2. Verify Database Schema

```bash
# Connect to PostgreSQL
docker exec -it myxcrow-db psql -U postgres -d postgres

# List tables
\dt

# Verify key tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

### 3. Seed Initial Data (Optional)

```bash
# Via Coolify terminal or SSH
docker exec -it myxcrow-api-container sh
cd /app/services/api
pnpm seed
```

---

## Post-Deployment Checklist

### ✅ Application Health

- [ ] API health check: `https://api.myxcrow.com/api/health` returns 200
- [ ] Web app loads: `https://myxcrow.com` displays correctly
- [ ] SSL certificates are valid (green lock in browser)

### ✅ Database

- [ ] Database migrations completed successfully
- [ ] Can connect to database from API service
- [ ] Test data seeded (if applicable)

### ✅ Redis

- [ ] Redis connection successful
- [ ] Queue jobs are processing (check logs)

### ✅ Storage (S3/MinIO)

- [ ] S3/MinIO connection successful
- [ ] Can upload files (test evidence upload)
- [ ] Files are accessible via URLs

### ✅ Authentication

- [ ] Can register new user
- [ ] Can login
- [ ] JWT tokens are generated correctly
- [ ] Protected routes require authentication

### ✅ Payments

- [ ] Paystack integration configured
- [ ] Test payment flow works
- [ ] Webhooks are configured (if using Paystack webhooks)

### ✅ Email

- [ ] Email service configured
- [ ] Test email sent successfully
- [ ] Email templates render correctly

### ✅ Monitoring

- [ ] Set up log aggregation (optional)
- [ ] Set up uptime monitoring (optional)
- [ ] Configure backup strategy for database

---

## Troubleshooting

### Build Failures

**Issue:** `pnpm install` fails with lockfile errors  
**Solution:** Ensure `pnpm-lock.yaml` is committed to repository

**Issue:** `canvas` native module fails to build  
**Solution:** Dockerfile includes required Alpine packages (`cairo-dev`, `pixman-dev`, etc.)

**Issue:** Prisma generate fails  
**Solution:** Ensure `DATABASE_URL` is set correctly (can be dummy URL during build)

### Runtime Issues

**Issue:** `Cannot find module '/app/...'`  
**Solution:** Ensure the production Dockerfile `WORKDIR` is `/app` and you are starting the built output from `services/api/dist`.

**Issue:** Database connection refused  
**Solution:** 
- Check `DATABASE_URL` format
- Ensure database service is running
- Verify network connectivity between containers

**Issue:** Redis connection refused  
**Solution:**
- Check `REDIS_URL` format
- Ensure Redis service is running
- Verify network connectivity

### Domain/SSL Issues

**Issue:** SSL certificate not generating  
**Solution:**
- Ensure domain DNS points to VPS IP
- Check ports 80 and 443 are open
- Wait 5-10 minutes for DNS propagation

**Issue:** Domain not resolving  
**Solution:**
- Verify DNS A records point to VPS IP:
  - `myxcrow.com` → VPS IP
  - `api.myxcrow.com` → VPS IP
- Check firewall allows ports 80/443
- Test with `curl -I https://myxcrow.com` and `curl -I https://api.myxcrow.com`

### Performance Issues

**Issue:** Slow builds  
**Solution:**
- Increase VPS resources (CPU/RAM)
- Use Docker layer caching
- Consider using Coolify's build cache

**Issue:** High memory usage  
**Solution:**
- Monitor container resources in Coolify
- Adjust Node.js memory limits: `NODE_OPTIONS=--max-old-space-size=2048`
- Consider upgrading VPS plan

---

## Additional Resources

- [Coolify Documentation](https://coolify.io/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [pnpm Workspaces Guide](https://pnpm.io/workspaces)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)

---

## Support

For issues specific to:
- **Coolify:** Check [Coolify GitHub Issues](https://github.com/coollabsio/coolify/issues)
- **MYXCROW:** Review logs in Coolify dashboard or check application logs

---

**Last Updated:** January 2026
