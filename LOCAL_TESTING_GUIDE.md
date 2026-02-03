# 🚀 Local Testing Guide - Complete Setup
**Date:** January 25, 2026

---

## 📋 Prerequisites

### Required Software:
- ✅ **Docker Desktop** - Already installed
- ✅ **Node.js 18+** (check: `node --version`)
- ✅ **pnpm** (check: `pnpm --version`)

---

## 🎯 Quick Start (Recommended)

### Option 1: Use the Automated Script

```bash
cd /Users/OceanCyber/Downloads/myxcrow

# Make script executable (first time only)
chmod +x START_SERVICES_NOW.sh

# Run the script
./START_SERVICES_NOW.sh
```

This script will:
- ✅ Check Docker is running
- ✅ Build all Docker images
- ✅ Start all services (Database, Redis, MinIO, Mailpit, API, Web)
- ✅ Test that everything is working

---

## 🔧 Manual Setup (Step-by-Step)

### Step 1: Start Docker Desktop

1. Open **Docker Desktop** application
2. Wait for "Engine running" status
3. Verify Docker is accessible:

```bash
docker ps
```

If you see a table (even empty), Docker is ready ✅

### Step 2: Navigate to Project Directory

```bash
cd /Users/OceanCyber/Downloads/myxcrow
```

### Step 3: Start Infrastructure Services

```bash
# Start database, cache, storage, and email services
docker-compose -f infra/docker/docker-compose.dev.yml up -d db redis minio mailpit
```

**What this starts:**
- **PostgreSQL** (port 5434) - Database
- **Redis** (port 6380) - Cache & job queue
- **MinIO** (ports 9003, 9004) - File storage (S3-compatible)
- **Mailpit** (ports 1026, 8026) - Email testing

### Step 4: Wait for Services to be Healthy

```bash
# Check service status
docker-compose -f infra/docker/docker-compose.dev.yml ps
```

Look for "healthy" status on db, redis, and minio. Wait 10-15 seconds if needed.

### Step 5: Start Application Services

```bash
# Start API and Web
docker-compose -f infra/docker/docker-compose.dev.yml up -d api web
```

**What this starts:**
- **API Server** (port 4000) - NestJS backend
- **Web App** (port 3005) - Next.js frontend

### Step 6: Wait for Applications to Build

First-time startup takes 3-5 minutes while:
- Dependencies are installed
- Database migrations run
- Applications compile

Watch the logs:
```bash
docker-compose -f infra/docker/docker-compose.dev.yml logs -f api
```

Look for: `Nest application successfully started` ✅

### Step 7: Verify Everything is Running

```bash
# Check all services
docker-compose -f infra/docker/docker-compose.dev.yml ps
```

You should see 6 containers running:
- ✅ escrow_db
- ✅ escrow_redis
- ✅ escrow_minio
- ✅ escrow_mailpit
- ✅ escrow_api
- ✅ escrow_web

---

## 🌐 Access Your Services

### Main Applications:
| Service | URL | Description |
|---------|-----|-------------|
| **Web App** | http://localhost:3005 | Main web interface |
| **API** | http://localhost:4000/api | Backend API |
| **API Health** | http://localhost:4000/api/health | Health check |

### Developer Tools:
| Service | URL | Credentials | Purpose |
|---------|-----|-------------|---------|
| **MinIO Console** | http://localhost:9004 | minioadmin / minioadmin | View uploaded files |
| **Mailpit** | http://localhost:8026 | None | View sent emails |

---

## 📱 Testing Mobile App

The mobile app runs separately using Expo. Here's how to set it up:

### Step 1: Install Expo CLI

```bash
npm install -g expo-cli eas-cli
```

### Step 2: Navigate to Mobile App

```bash
cd apps/mobile
```

### Step 3: Install Dependencies

```bash
pnpm install
```

### Step 4: Configure API Endpoint

Create `.env` file:
```bash
cat > .env << 'EOF'
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000/api
EOF
```

**Important:** 
- For iOS Simulator: Use `http://localhost:4000/api`
- For Android Emulator: Use `http://10.0.2.2:4000/api`
- For Physical Device: Use your computer's IP (e.g., `http://192.168.1.100:4000/api`)

### Step 5: Start Mobile App

**For iOS (Mac only):**
```bash
pnpm ios
```

**For Android:**
```bash
pnpm android
```

**For Both (Expo Go):**
```bash
pnpm start
```

Then scan QR code with:
- iOS: Camera app
- Android: Expo Go app

---

## 🧪 Testing Your Setup

### Test 1: API Health Check

```bash
curl http://localhost:4000/api/health
```

**Expected:** `{"status":"ok"}` ✅

### Test 2: Web App Loading

Open browser: http://localhost:3005

**Expected:** Login/Register page loads ✅

### Test 3: Create Test Account

1. Go to http://localhost:3005
2. Click "Register"
3. Fill in details:
   - Email: `test@example.com`
   - Password: `Test123!`
   - Name: Test User
4. Click "Create Account"

**Expected:** Account created, redirected to dashboard ✅

### Test 4: Check Email (Mailpit)

1. Go to http://localhost:8026
2. You should see welcome email

**Expected:** Email appears in inbox ✅

### Test 5: Check Database

```bash
# Connect to database
docker exec -it escrow_db psql -U postgres -d escrow

# List users
SELECT email, "firstName", "lastName" FROM users;

# Exit
\q
```

**Expected:** Your test user appears ✅

### Test 6: Check File Storage (MinIO)

1. Go to http://localhost:9004
2. Login: `minioadmin` / `minioadmin`
3. Check for `escrow-evidence` bucket

**Expected:** Bucket exists ✅

---

## 🔄 Common Operations

### View Logs

**All services:**
```bash
docker-compose -f infra/docker/docker-compose.dev.yml logs -f
```

**Specific service:**
```bash
docker-compose -f infra/docker/docker-compose.dev.yml logs -f api
docker-compose -f infra/docker/docker-compose.dev.yml logs -f web
```

**Last 50 lines:**
```bash
docker-compose -f infra/docker/docker-compose.dev.yml logs --tail=50 api
```

### Restart Services

**All services:**
```bash
docker-compose -f infra/docker/docker-compose.dev.yml restart
```

**Specific service:**
```bash
docker-compose -f infra/docker/docker-compose.dev.yml restart api
```

### Stop Services

**All services:**
```bash
docker-compose -f infra/docker/docker-compose.dev.yml down
```

**Keep data (recommended):**
```bash
docker-compose -f infra/docker/docker-compose.dev.yml stop
```

### Reset Everything (Fresh Start)

```bash
# Stop and remove everything including data
docker-compose -f infra/docker/docker-compose.dev.yml down -v

# Start fresh
./START_SERVICES_NOW.sh
```

### Seed Test Data

```bash
# Run seed script
docker-compose -f infra/docker/docker-compose.dev.yml exec api pnpm seed
```

This creates:
- ✅ Test users (buyer, seller, admin)
- ✅ Sample escrows
- ✅ Disputes
- ✅ Evidence files
- ✅ Ratings

**Test Accounts:**
```
Admin:
  Email: admin@escrow.com
  Password: Admin123!

Buyer:
  Email: buyer@example.com
  Password: Buyer123!

Seller:
  Email: seller@example.com
  Password: Seller123!
```

---

## 🐛 Troubleshooting

### Problem: "Cannot connect to Docker daemon"

**Solution:**
```bash
# Start Docker Desktop
open -a Docker

# Wait for "Engine running"
# Then try again
```

### Problem: "Port already in use"

**Solution:**
```bash
# Kill process on port 3005 (web)
lsof -ti:3005 | xargs kill -9

# Kill process on port 4000 (api)
lsof -ti:4000 | xargs kill -9

# Restart services
docker-compose -f infra/docker/docker-compose.dev.yml restart
```

### Problem: "API not starting"

**Solution:**
```bash
# Check API logs
docker-compose -f infra/docker/docker-compose.dev.yml logs api

# Common issues:
# 1. Database not ready - wait 30 seconds
# 2. Migration failed - run manually:
docker-compose -f infra/docker/docker-compose.dev.yml exec api pnpm prisma migrate deploy

# 3. Dependencies issue - rebuild:
docker-compose -f infra/docker/docker-compose.dev.yml build --no-cache api
docker-compose -f infra/docker/docker-compose.dev.yml up -d api
```

### Problem: "Web not loading"

**Solution:**
```bash
# Check web logs
docker-compose -f infra/docker/docker-compose.dev.yml logs web

# Rebuild if needed
docker-compose -f infra/docker/docker-compose.dev.yml build --no-cache web
docker-compose -f infra/docker/docker-compose.dev.yml up -d web
```

### Problem: "Database connection failed"

**Solution:**
```bash
# Check database is healthy
docker-compose -f infra/docker/docker-compose.dev.yml ps db

# Should show "healthy"
# If not, check logs:
docker-compose -f infra/docker/docker-compose.dev.yml logs db

# Restart database:
docker-compose -f infra/docker/docker-compose.dev.yml restart db
```

### Problem: "Mobile app can't connect to API"

**Solution:**

**For iOS Simulator:**
```bash
# Should work with localhost
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

**For Android Emulator:**
```bash
# Use special IP
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:4000/api
```

**For Physical Device:**
```bash
# Get your computer's IP:
ipconfig getifaddr en0  # Mac WiFi
# or
ifconfig | grep "inet "

# Use that IP:
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:4000/api
```

### Problem: "MinIO bucket not created"

**Solution:**
```bash
# Access MinIO console: http://localhost:9004
# Login: minioadmin / minioadmin
# Click "Buckets" → "Create Bucket"
# Name: "escrow-evidence"
# Click "Create"
```

---

## 📊 Service Status Check

Run this to check everything:

```bash
#!/bin/bash

echo "🔍 Checking Services..."
echo ""

# Docker
if docker ps > /dev/null 2>&1; then
    echo "✅ Docker: Running"
else
    echo "❌ Docker: Not running"
fi

# Database
if docker ps | grep escrow_db | grep -q healthy; then
    echo "✅ Database: Healthy"
else
    echo "⚠️  Database: Not healthy"
fi

# Redis
if docker ps | grep escrow_redis | grep -q healthy; then
    echo "✅ Redis: Healthy"
else
    echo "⚠️  Redis: Not healthy"
fi

# MinIO
if docker ps | grep escrow_minio | grep -q healthy; then
    echo "✅ MinIO: Healthy"
else
    echo "⚠️  MinIO: Not healthy"
fi

# API
if curl -s http://localhost:4000/api/health | grep -q ok; then
    echo "✅ API: Running"
else
    echo "⚠️  API: Not responding"
fi

# Web
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3005 | grep -q 200; then
    echo "✅ Web: Running"
else
    echo "⚠️  Web: Not responding"
fi

echo ""
echo "📊 Docker Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}"
```

Save as `check-status.sh`, make executable, and run:
```bash
chmod +x check-status.sh
./check-status.sh
```

---

## 🎯 Development Workflow

### Daily Startup

```bash
cd /Users/OceanCyber/Downloads/myxcrow

# Start services
docker-compose -f infra/docker/docker-compose.dev.yml up -d

# Wait 30 seconds for startup
sleep 30

# Check status
docker-compose -f infra/docker/docker-compose.dev.yml ps

# View logs (optional)
docker-compose -f infra/docker/docker-compose.dev.yml logs -f
```

### During Development

**Backend changes:**
- Code changes auto-reload (nodemon)
- No restart needed

**Frontend changes:**
- Code changes auto-reload (Next.js Fast Refresh)
- No restart needed

**Database schema changes:**
```bash
# Edit: services/api/prisma/schema.prisma
# Then create migration:
docker-compose -f infra/docker/docker-compose.dev.yml exec api pnpm prisma migrate dev --name your_change_description
```

### End of Day

```bash
# Stop services (keeps data)
docker-compose -f infra/docker/docker-compose.dev.yml stop
```

---

## 📱 Mobile Development Tips

### Hot Reload

Changes to mobile app code automatically reload in Expo.

### Clear Cache

```bash
cd apps/mobile
pnpm start --clear
```

### View Mobile Logs

```bash
cd apps/mobile
pnpm start

# Then press 'j' to open debugger
```

### Test on Multiple Devices

1. Start Expo: `pnpm start`
2. Scan QR code on multiple devices
3. All devices connect to same backend

---

## 🎉 You're Ready!

Your local development environment is now set up:

✅ **Backend API** running on http://localhost:4000  
✅ **Web App** running on http://localhost:3005  
✅ **Database** (PostgreSQL) on port 5434  
✅ **Cache** (Redis) on port 6380  
✅ **Storage** (MinIO) on ports 9003, 9004  
✅ **Email Testing** (Mailpit) on port 8026  
✅ **Mobile App** ready with Expo  

---

## 📚 Additional Resources

- **API Documentation:** Check `services/api/README.md`
- **Database Schema:** See `services/api/prisma/schema.prisma`
- **Environment Variables:** See `infra/docker/.env.dev`
- **Docker Compose:** See `infra/docker/docker-compose.dev.yml`

---

## 🆘 Need Help?

1. **Check logs:** `docker-compose -f infra/docker/docker-compose.dev.yml logs [service]`
2. **Check status:** `docker-compose -f infra/docker/docker-compose.dev.yml ps`
3. **Restart service:** `docker-compose -f infra/docker/docker-compose.dev.yml restart [service]`
4. **Fresh start:** `docker-compose -f infra/docker/docker-compose.dev.yml down -v && ./START_SERVICES_NOW.sh`

---

**Happy Testing! 🚀**
