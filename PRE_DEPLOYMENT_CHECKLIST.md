# Pre-Deployment Checklist

Use this checklist before deploying to **VPS + Coolify**.

## ✅ Code Ready

- [x] All changes committed to git
- [x] `.gitignore` updated
- [x] Documentation complete

## 📋 Before Pushing to GitHub

### 1. Verify Git Status
```bash
git status
# Should show "nothing to commit, working tree clean"
```

### 2. Review Changes
```bash
git log --oneline -5
# Review recent commits
```

### 3. Push to GitHub
```bash
git push origin main
```

## 🔧 Production Deployment Setup (Coolify)

### Required Environment Variables

Before deploying, prepare these values:

#### S3/Storage
- [ ] S3 endpoint URL
- [ ] S3 access key
- [ ] S3 secret key
- [ ] S3 bucket name (default: `escrow-evidence`)
- [ ] S3 region (default: `us-east-1`)

#### Payment Gateway
- [ ] Paystack secret key
- [ ] Paystack public key

#### Email Service
- [ ] SMTP host
- [ ] SMTP port (usually 587)
- [ ] SMTP username
- [ ] SMTP password
- [ ] From email address

### Auto-Configured (No Action Needed)
- ✅ `DATABASE_URL` - From your PostgreSQL resource/instance
- ✅ `REDIS_URL` - From your Redis resource/instance

## 🚀 Deployment Steps

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Deploy in Coolify**
   - Create PostgreSQL + Redis resources (recommended)
   - Deploy API using `services/api/Dockerfile.production`
   - Deploy Web using `apps/web/Dockerfile.production`
   - Configure domains + SSL

3. **Verify Deployment**
   - API: `https://api.myxcrow.com/api/health`
   - Web: `https://myxcrow.com`

## 📝 Important Notes

- **API URL**: Ensure web env var `NEXT_PUBLIC_API_BASE_URL` matches your API domain
- **Database**: Migrations run automatically on API startup
- **Health Checks**: Both services have health check endpoints configured

## 🔗 Quick Links

- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Local Development Guide](LOCAL_DEVELOPMENT.md)

---

**Ready?** Push to GitHub and deploy! 🚀

