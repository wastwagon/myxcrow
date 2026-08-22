# Starting Local Services

## Step 1: Start Docker Desktop

**The Docker daemon is not running.** You need to:

1. **Open Docker Desktop** application on your Mac
2. **Wait for it to fully start** (you'll see "Docker Desktop is running" in the menu bar)
3. **Verify it's running**: The Docker whale icon should be visible in your menu bar

## Step 2: Start All Services

Once Docker Desktop is running, execute:

```bash
cd /Users/OceanCyber/Downloads/myxcrow
docker-compose -f infra/docker/docker-compose.dev.yml up -d
```

This will start:
- ✅ PostgreSQL database (port 5434)
- ✅ Redis cache (port 6380)
- ✅ MinIO object storage (ports 9003, 9004)
- ✅ Mailpit email testing (ports 1026, 8026)
- ✅ API service (port 4000)
- ✅ Web service (host port 3007 → container 3000)

## Step 3: Check Service Status

```bash
docker-compose -f infra/docker/docker-compose.dev.yml ps
```

All services should show "Up" status.

## Step 4: Test Services

### Test API:
```bash
curl http://localhost:4000/api/health
```
Expected: `{"status":"ok"}`

### Test Web:
Open in browser: **http://localhost:3007**

## Step 5: View Logs (if needed)

```bash
# All services
docker-compose -f infra/docker/docker-compose.dev.yml logs -f

# Specific service
docker-compose -f infra/docker/docker-compose.dev.yml logs -f web
docker-compose -f infra/docker/docker-compose.dev.yml logs -f api
```

## Troubleshooting

### Docker Desktop Not Starting
- Check if Docker Desktop is installed
- Restart Docker Desktop
- Check system requirements

### Port Already in Use
```bash
# Find process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port in docker-compose.dev.yml
```

### Services Not Starting
```bash
# Check logs for errors
docker-compose -f infra/docker/docker-compose.dev.yml logs

# Restart services
docker-compose -f infra/docker/docker-compose.dev.yml restart
```

### Database Connection Issues
```bash
# Check database is healthy
docker-compose -f infra/docker/docker-compose.dev.yml ps db

# Run migrations
docker-compose -f infra/docker/docker-compose.dev.yml exec api pnpm prisma migrate deploy
```

## Access Points

Once services are running:
- **Web Frontend**: http://localhost:3007
- **API**: http://localhost:4000/api
- **API Health**: http://localhost:4000/api/health
- **Mailpit**: http://localhost:8026
- **MinIO Console**: http://localhost:9004 (minioadmin/minioadmin)

---

**Note**: Make sure Docker Desktop is running before executing any docker commands!

