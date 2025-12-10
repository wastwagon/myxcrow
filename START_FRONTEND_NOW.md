# Start Frontend - Step by Step

## Current Issue
- ❌ Next.js server is NOT running
- ❌ Dependencies not fully installed
- ❌ Node.js may not be in your PATH

## Solution

### Step 1: Check Node.js Installation

Open a **NEW terminal window** (not this one) and run:

```bash
node --version
```

**If Node.js is NOT installed:**
- Install from: https://nodejs.org/ (download LTS version)
- Or via Homebrew: `brew install node`

### Step 2: Install Dependencies

In the new terminal:

```bash
cd /Users/OceanCyber/Downloads/myexrow/apps/web

# Install pnpm (recommended)
npm install -g pnpm

# Install project dependencies
pnpm install
```

**If pnpm fails, use npm:**
```bash
npm install
```

### Step 3: Start the Server

```bash
# Still in apps/web directory
pnpm dev
# OR
npm run dev
```

### Step 4: Access the App

Once you see:
```
✓ Ready in X seconds
○ Local: http://localhost:3003
```

Open your browser: **http://localhost:3003**

---

## Quick Commands (Copy & Paste)

```bash
# Navigate to frontend
cd /Users/OceanCyber/Downloads/myexrow/apps/web

# Install pnpm (if needed)
npm install -g pnpm

# Install dependencies
pnpm install

# Start server
pnpm dev
```

---

## Troubleshooting

### "node: command not found"
→ Install Node.js from https://nodejs.org/

### "pnpm: command not found"
→ Run: `npm install -g pnpm`
→ Or use: `npm install` and `npm run dev`

### "Cannot find module" errors
→ Delete and reinstall:
```bash
cd apps/web
rm -rf node_modules .next
pnpm install
pnpm dev
```

### Port 3003 still shows "Unable to connect"
→ Make sure the server actually started
→ Check terminal for errors
→ Verify you see "Ready" message

---

## Expected Output

When server starts successfully, you'll see:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3003
- Ready in X seconds
```

Then the browser at http://localhost:3003 will show the home page.

---

**Important**: You MUST open a NEW terminal window because Node.js may not be in the current shell's PATH.




