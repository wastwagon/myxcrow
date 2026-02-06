# 🚀 START HERE - Complete Setup Guide

## The Problem

Your terminal session can't access Docker daemon even though Docker Desktop is running. This is a common macOS issue.

## ✅ Quick Fix (Choose One)

### Option 1: New Terminal Window (Easiest - 90% success rate)

1. **Close your current terminal window**
2. **Open a NEW terminal window** (fresh session)
3. **Run these commands:**

```bash
cd /Users/OceanCyber/Downloads/myxcrow
./diagnose-docker.sh
```

4. **If it shows ✅ Docker is accessible**, then:
```bash
./fix-and-start.sh
```

5. **Wait 2-3 minutes** for everything to build and start
6. **Access**: http://localhost:3007

### Option 2: Restart Docker Desktop

1. **Quit Docker Desktop completely**
   - Click Docker icon in menu bar → Quit Docker Desktop
   - Wait 10 seconds

2. **Restart Docker Desktop**
   - Open from Applications
   - Wait for "Engine running" status (30-60 seconds)

3. **In your terminal, test:**
```bash
docker ps
```

4. **If `docker ps` works**, then:
```bash
cd /Users/OceanCyber/Downloads/myxcrow
./fix-and-start.sh
```

### Option 3: Use Docker Desktop Terminal

1. Open Docker Desktop
2. Some versions have a built-in terminal
3. Use that terminal to run the setup scripts

## What the Scripts Do

### `diagnose-docker.sh`
- Checks if Docker is accessible
- Shows what's wrong
- Provides specific fixes

### `fix-and-start.sh`
- Builds Docker images (this was missing!)
- Starts all services
- Tests endpoints
- Shows final status

## Expected Result

After running `./fix-and-start.sh`, you should see:

```
✅ Images built
✅ All services starting
📊 6 containers running:
   - escrow_db
   - escrow_redis
   - escrow_minio
   - escrow_mailpit
   - escrow_api
   - escrow_web
```

Then access:
- **Web**: http://localhost:3007
- **API**: http://localhost:4000/api

## Still Not Working?

If Docker still can't connect after trying all options:

1. **Check Docker Desktop Settings:**
   - Docker Desktop → Settings → General
   - Make sure "Use Docker Compose V2" is enabled

2. **Check System Requirements:**
   - macOS version compatibility
   - Sufficient resources allocated

3. **Last Resort - Reinstall Docker Desktop:**
   - Download from docker.com
   - Uninstall current version first
   - Install fresh copy

## Why This Happens

Terminal sessions opened BEFORE Docker Desktop starts don't get the Docker environment variables. A new terminal window picks up the current Docker environment.

---

**Most likely solution: Open a NEW terminal window and run the scripts there.**

