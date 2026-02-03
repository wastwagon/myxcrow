# Local Testing Guide

## ✅ Cleanup Completed

### Removed Unused Files/Directories:
- ✅ `packages/types/` - Empty directory
- ✅ `infra/docker/scripts/` - Empty directory  
- ✅ `services/worker/` - Unused service

### Updated Files:
- ✅ `pnpm-workspace.yaml` - Removed `packages/*` reference
- ✅ Deployment configuration is Render Blueprint–based

## 🚀 Starting Docker Services

### Prerequisites:
1. Ensure Docker Desktop is running
2. Check Docker daemon: `docker ps`

### Start All Services:

```bash
cd /Users/OceanCyber/Downloads/myexrow
docker-compose -f infra/docker/docker-compose.dev.yml up -d
```

### Start Services Individually:

```bash
# Start infrastructure services first
docker-compose -f infra/docker/docker-compose.dev.yml up -d db redis minio mailpit

# Wait for them to be healthy (check with: docker-compose ps)
# Then start application services
docker-compose -f infra/docker/docker-compose.dev.yml up -d api web
```

### Check Service Status:

```bash
docker-compose -f infra/docker/docker-compose.dev.yml ps
```

### View Logs:

```bash
# All services
docker-compose -f infra/docker/docker-compose.dev.yml logs -f

# Specific service
docker-compose -f infra/docker/docker-compose.dev.yml logs -f api
docker-compose -f infra/docker/docker-compose.dev.yml logs -f web
```

## 🧪 Testing Services

### Test API Health:
```bash
curl http://localhost:4000/api/health
```

Expected response: `{"status":"ok"}`

### Test Web Frontend:
```bash
curl http://localhost:3000
```

Should return HTML (200 status)

### Access Services:
- **API**: http://localhost:4000/api
- **Web**: http://localhost:3000
- **Mailpit**: http://localhost:8026
- **MinIO Console**: http://localhost:9004 (minioadmin/minioadmin)

## 🔧 Troubleshooting

### Port Already in Use:
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port in docker-compose.dev.yml
```

### Docker Daemon Not Running:
```bash
# Start Docker Desktop, then:
docker ps
```

### Services Not Starting:
```bash
# Check logs
docker-compose -f infra/docker/docker-compose.dev.yml logs

# Restart services
docker-compose -f infra/docker/docker-compose.dev.yml restart
```

### Database Connection Issues:
```bash
# Check database is healthy
docker-compose -f infra/docker/docker-compose.dev.yml ps db

# Run migrations manually
docker-compose -f infra/docker/docker-compose.dev.yml exec api pnpm prisma migrate deploy
```

## 📋 Pre-Commit Checklist

Before committing and pushing:

- [ ] All Docker services are running
- [ ] API health endpoint responds: `curl http://localhost:4000/api/health`
- [ ] Web frontend loads: `curl http://localhost:3000`
- [ ] No errors in service logs
- [ ] All unused files removed
- [ ] `dist/` folder is in `.gitignore` (✅ already done)
- [ ] Dockerfiles build successfully for production

## 🛑 Stopping Services

```bash
# Stop all services
docker-compose -f infra/docker/docker-compose.dev.yml down

# Stop and remove volumes (clean slate)
docker-compose -f infra/docker/docker-compose.dev.yml down -v
```

## 📝 Next Steps

1. **Start Docker services** (see above)
2. **Test all endpoints** locally
3. **Review logs** for any errors
4. **Commit changes** when everything works
5. **Push to GitHub** for Render deployment

---

**Note**: If Docker daemon stops, restart Docker Desktop and try again.

