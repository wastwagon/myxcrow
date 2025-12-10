# Starting the Frontend

## Issue
Port 3000 is currently in use by Docker. The Next.js server needs to be started.

## Solution

### Option 1: Start Next.js on Default Port (3000)
First, check what's using port 3000:
```bash
lsof -i:3000
```

If it's not needed, stop it. Then start Next.js:
```bash
cd apps/web
pnpm install  # If not already done
pnpm dev
```

### Option 2: Start Next.js on Different Port
```bash
cd apps/web
PORT=3003 pnpm dev
```
Then access at: http://localhost:3003

### Option 3: Use npm/yarn if pnpm not available
```bash
cd apps/web
npm install  # or yarn install
npm run dev  # or yarn dev
```

## Quick Start Commands

```bash
# Navigate to frontend
cd /Users/OceanCyber/Downloads/myexrow/apps/web

# Install dependencies (if not done)
pnpm install
# OR
npm install

# Start development server
pnpm dev
# OR
npm run dev

# If port 3000 is busy, use different port:
PORT=3003 pnpm dev
```

## Verify It's Working

Once started, you should see:
```
✓ Ready in X seconds
○ Local: http://localhost:3000
```

Then visit http://localhost:3000 in your browser.

## Troubleshooting

### "Cannot GET /" Error
- Make sure Next.js dev server is actually running
- Check that `pages/index.tsx` exists
- Verify dependencies are installed: `pnpm install`

### Port Already in Use
- Use a different port: `PORT=3003 pnpm dev`
- Or stop the process using port 3000

### Module Not Found Errors
- Run `pnpm install` to install dependencies
- Delete `node_modules` and `.next`, then reinstall

### TypeScript Errors
- Run `pnpm type-check` to see errors
- Make sure all imports are correct




