# Coolify Deployment Checklist

Use this checklist to ensure a smooth deployment to **VPS + Coolify**.

## Pre-Migration

### Repository Setup
- [ ] Repository is pushed to GitHub: `https://github.com/wastwagon/myxcrow`
- [ ] All code changes are committed
- [ ] `.gitignore` is properly configured
- [ ] Production Dockerfiles are created:
  - [ ] `services/api/Dockerfile.production`
  - [ ] `apps/web/Dockerfile.production`

### VPS Preparation
- [ ] VPS is provisioned with adequate resources (4GB+ RAM recommended)
- [ ] Ubuntu 22.04 LTS or Debian 12 installed
- [ ] Docker Engine 24.0+ installed
- [ ] Docker Compose 2.0+ installed
- [ ] Coolify 4.x installed and accessible
- [ ] Firewall configured (ports 80, 443, 22 open)
- [ ] SSH access configured

### Domain Setup
- [ ] Domain name: `myxcrow.com` configured
- [ ] DNS A records created:
  - [ ] `myxcrow.com` → VPS IP
  - [ ] `api.myxcrow.com` → VPS IP
  - [ ] Optional: `www.myxcrow.com` → VPS IP (or CNAME to `myxcrow.com`)
- [ ] DNS propagation verified (use `dig` or `nslookup`)

### Backups (recommended)
- [ ] Database backup strategy configured (daily recommended)
- [ ] Backup restoration tested

---

## Coolify Setup

### Project Configuration
- [ ] Coolify project created: `myxcrow`
- [ ] GitHub repository connected in Coolify
- [ ] Repository access verified

### Infrastructure Services

#### PostgreSQL Database
- [ ] PostgreSQL database created in Coolify: `myxcrow-db`
- [ ] Database password saved securely
- [ ] Connection string documented
- [ ] Database version: PostgreSQL 15 (or latest)

#### Redis Cache
- [ ] Redis instance created in Coolify: `myxcrow-redis`
- [ ] Connection string documented
- [ ] Redis version: 7 (or latest)

#### Optional: MinIO/S3 Storage
- [ ] MinIO deployed (via Docker Compose or Coolify)
- [ ] OR AWS S3 bucket created and configured
- [ ] Access keys documented securely
- [ ] Bucket name: `escrow-evidence`

---

## API Service Deployment

### Application Setup
- [ ] Application created: `myxcrow-api`
- [ ] Source: GitHub repository `wastwagon/myxcrow`
- [ ] Branch: `main` (or production branch)

### Build Configuration
- [ ] Build Pack: Dockerfile
- [ ] Dockerfile Path: `services/api/Dockerfile.production`
- [ ] Docker Build Context: `.` (root)
- [ ] Base Directory: (empty)

### Runtime Configuration
- [ ] Port: `4000`
- [ ] Expose Port: `4000`
- [ ] Health Check Path: `/api/health`
- [ ] Health Check Port: `4000`

### Environment Variables
- [ ] `NODE_ENV=production`
- [ ] `PORT=4000`
- [ ] `WEB_APP_URL=https://app.yourdomain.com`
- [ ] `DATABASE_URL` (from Coolify PostgreSQL)
- [ ] `REDIS_URL` (from Coolify Redis)
- [ ] `JWT_SECRET` (generated securely)
- [ ] `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_REGION`
- [ ] `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`
- [ ] `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM`
- [ ] `ENCRYPTION_KEY` (generated securely)

### Domain Configuration
- [ ] Domain added: `api.myxcrow.com`
- [ ] SSL certificate generation enabled
- [ ] SSL certificate verified (green lock)

### Deployment
- [ ] Initial deployment triggered
- [ ] Build logs reviewed (no errors)
- [ ] Health check passing
- [ ] Application accessible at `https://api.myxcrow.com/api/health`

### Database Migration
- [ ] Prisma migrations run successfully
- [ ] Database schema verified (all tables exist)
- [ ] Test data seeded (if applicable)

---

## Web Service Deployment

### Application Setup
- [ ] Application created: `myxcrow-web`
- [ ] Source: GitHub repository `wastwagon/myxcrow`
- [ ] Branch: `main` (or production branch)

### Build Configuration
- [ ] Build Pack: Dockerfile
- [ ] Dockerfile Path: `apps/web/Dockerfile.production`
- [ ] Docker Build Context: `.` (root)
- [ ] Base Directory: (empty)

### Runtime Configuration
- [ ] Port: `3000`
- [ ] Expose Port: `3000`
- [ ] Health Check Path: `/`
- [ ] Health Check Port: `3000`

### Environment Variables
- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`
- [ ] `NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api`
- [ ] `NEXT_PUBLIC_ENV=production`

### Domain Configuration
- [ ] Domain added: `myxcrow.com`
- [ ] Optional: `www.myxcrow.com` added and redirected
- [ ] SSL certificate generation enabled
- [ ] SSL certificate verified (green lock)

### Deployment
- [ ] Initial deployment triggered
- [ ] Build logs reviewed (no errors)
- [ ] Health check passing
- [ ] Application accessible at `https://myxcrow.com`

---

## Post-Deployment Verification

### API Service
- [ ] Health endpoint returns 200: `https://api.myxcrow.com/api/health`
- [ ] API documentation accessible (if available)
- [ ] Database connection working
- [ ] Redis connection working
- [ ] File upload to S3/MinIO working
- [ ] Email sending working (test email sent)

### Web Service
- [ ] Frontend loads without errors: `https://myxcrow.com`
- [ ] API calls from frontend succeed
- [ ] Authentication flow works (login/register)
- [ ] Protected routes require authentication
- [ ] All pages load correctly

### Integration Testing
- [ ] User registration works
- [ ] User login works
- [ ] KYC upload works
- [ ] Escrow creation works
- [ ] Payment processing works (test mode)
- [ ] File uploads work
- [ ] Email notifications sent

### Performance
- [ ] Page load times acceptable (< 3s)
- [ ] API response times acceptable (< 500ms)
- [ ] No memory leaks (monitor over 24 hours)
- [ ] No excessive CPU usage

### Security
- [ ] SSL certificates valid
- [ ] HTTPS enforced (no HTTP redirects)
- [ ] Environment variables not exposed in frontend
- [ ] API rate limiting working
- [ ] CORS configured correctly

---

## Data Migration (optional)

### Database Migration
- [ ] Database schema matches (migrations applied)
- [ ] Data imported to production PostgreSQL (if needed)
- [ ] Data integrity verified
- [ ] Foreign key constraints satisfied

### File Storage Migration
- [ ] Files uploaded to new S3/MinIO storage
- [ ] File URLs updated in database (if needed)
- [ ] File access verified

---

## Monitoring & Maintenance

### Logging
- [ ] Application logs accessible in Coolify
- [ ] Log aggregation configured (optional)
- [ ] Error tracking configured (optional, e.g., Sentry)

### Backups
- [ ] Database backup strategy configured
- [ ] Backup schedule set (daily recommended)
- [ ] Backup restoration tested

### Updates
- [ ] Auto-deploy on Git push configured (optional)
- [ ] Manual deployment process documented
- [ ] Rollback procedure documented

---

## Cleanup (After Successful Deployment)

### Documentation
- [ ] Deployment process documented
- [ ] Environment variables documented
- [ ] Troubleshooting guide created
- [ ] Team members trained on Coolify

---

## Rollback Plan (recommended)

- [ ] Have DNS TTL set low (300s) before cutover
- [ ] Document rollback steps

---

## Notes

- Migration Date: _______________
- Coolify Project: `myxcrow`
- API Domain: `api.myxcrow.com`
- Web Domain: `myxcrow.com`
- Database: `myxcrow-db` (PostgreSQL)
- Redis: `myxcrow-redis`

---

**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Blocked

---

**Last Updated:** January 2026
