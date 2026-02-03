# Coolify Quick Start Guide

**Quick reference for deploying MYXCROW to Coolify**

👉 **Full step-by-step (GitHub push + Coolify):** see **GO_LIVE.md**

---

## 🚀 Quick Deployment Steps

### 1. Prerequisites (5 minutes)

- [ ] VPS with Coolify installed
- [ ] Domain names configured (DNS A records)
- [ ] GitHub repository: `https://github.com/wastwagon/myxcrow`

### 2. Create Infrastructure (10 minutes)

In Coolify dashboard:

1. **Create PostgreSQL Database:**
   - Name: `myxcrow-db`
   - Save connection string

2. **Create Redis Instance:**
   - Name: `myxcrow-redis`
   - Save connection string

### 3. Deploy API Service (15 minutes)

1. **New Application** → Name: `myxcrow-api`
2. **Source:** GitHub → `wastwagon/myxcrow`
3. **Build Pack:** Dockerfile
4. **Dockerfile Path:** `services/api/Dockerfile.production`
5. **Port:** `4000`
6. **Health Check:** `/api/health`
7. **Domain:** `api.myxcrow.com`
8. **Environment Variables:** Copy from `COOLIFY_ENV_TEMPLATE.md`
9. **Deploy**

### 4. Deploy Web Service (10 minutes)

1. **New Application** → Name: `myxcrow-web`
2. **Source:** GitHub → `wastwagon/myxcrow`
3. **Build Pack:** Dockerfile
4. **Dockerfile Path:** `apps/web/Dockerfile.production`
5. **Port:** `3000`
6. **Health Check:** `/`
7. **Domain:** `myxcrow.com` (or `www.myxcrow.com` if preferred)
8. **Environment Variables:**
   - `NEXT_PUBLIC_API_BASE_URL=https://api.myxcrow.com/api`
   - `NEXT_PUBLIC_ENV=production`
9. **Deploy**

### 5. Verify Deployment (5 minutes)

- [ ] API health: `https://api.myxcrow.com/api/health` → 200 OK
- [ ] Web app: `https://myxcrow.com` → Loads correctly
- [ ] SSL certificates: Green lock in browser
- [ ] Login works: Test with admin account

---

## 📋 Essential Files

- **Migration Guide:** `COOLIFY_MIGRATION_GUIDE.md` (detailed)
- **Checklist:** `MIGRATION_CHECKLIST.md` (step-by-step)
- **Environment Variables:** `COOLIFY_ENV_TEMPLATE.md` (copy-paste ready)
- **Product Review:** `PRODUCT_REVIEW_COMPLETE.md` (full overview)

---

## 🔑 Generate Secrets

```bash
# JWT Secret
openssl rand -base64 32

# Encryption Key
openssl rand -base64 32

# Database Password
openssl rand -base64 24
```

---

## 🐛 Common Issues

### Build Fails
- Check Dockerfile paths are correct
- Ensure `pnpm-lock.yaml` is committed
- Review build logs in Coolify

### Database Connection Fails
- Verify `DATABASE_URL` format
- Check database service is running
- Ensure network connectivity

### SSL Certificate Fails
- Verify DNS A records point to VPS
- Wait 5-10 minutes for DNS propagation
- Check ports 80/443 are open

---

## 📞 Need Help?

1. Check `COOLIFY_MIGRATION_GUIDE.md` for detailed instructions
2. Review `MIGRATION_CHECKLIST.md` for step-by-step verification
3. Check Coolify logs in dashboard
4. Review application logs in Coolify

---

**Estimated Total Time:** 45-60 minutes  
**Difficulty:** Intermediate  
**Prerequisites:** Basic Docker/Coolify knowledge

---

**Last Updated:** January 2026
