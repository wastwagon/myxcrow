# Frontend Setup Guide

## Current Issue
You're getting a 404 error from port 3000. This is because:
1. **Next.js server is NOT running** - The frontend needs to be started
2. **Node.js/pnpm may not be installed** - Required to run Next.js

## Solution Steps

### Step 1: Install Node.js (if not installed)
```bash
# Check if Node.js is installed
node --version

# If not installed, install via:
# - Homebrew: brew install node
# - Or download from: https://nodejs.org/
```

### Step 2: Install pnpm (recommended) or use npm
```bash
# Install pnpm globally
npm install -g pnpm

# OR use npm (comes with Node.js)
# npm is already available if Node.js is installed
```

### Step 3: Install Frontend Dependencies
```bash
cd /Users/OceanCyber/Downloads/myexrow/apps/web
pnpm install
# OR
npm install
```

### Step 4: Start the Development Server
```bash
# From apps/web directory
pnpm dev
# OR
npm run dev
```

### Step 5: Access the Application
Once started, you'll see:
```
✓ Ready in X seconds
○ Local: http://localhost:3000
```

Visit: **http://localhost:3000**

---

## Alternative: Run in Docker (if preferred)

If you want to run the frontend in Docker instead, we can add it to docker-compose. But for development, running locally with `pnpm dev` is recommended for hot reload.

---

## Quick Troubleshooting

### Port 3000 Already in Use
```bash
# Use a different port
PORT=3003 pnpm dev
# Then access at http://localhost:3003
```

### "Command not found: pnpm"
```bash
# Install pnpm
npm install -g pnpm
# OR use npm instead
npm run dev
```

### "Cannot find module" errors
```bash
cd apps/web
rm -rf node_modules .next
pnpm install
pnpm dev
```

### TypeScript errors
```bash
cd apps/web
pnpm type-check
# Fix any errors shown
```

---

## Expected Behavior

Once the server starts, you should see:
- ✅ Next.js compilation messages
- ✅ "Ready" message with localhost URL
- ✅ No errors in terminal

Then visiting http://localhost:3000 should show:
- ✅ Home page with API health check
- ✅ Links to login/register
- ✅ Developer tool links (if local mode)

---

## Current Status

- ✅ All frontend files created (36 files)
- ✅ Configuration files ready
- ⚠️ Dependencies need to be installed
- ⚠️ Dev server needs to be started

**Next Action**: Install Node.js → Install dependencies → Start dev server




