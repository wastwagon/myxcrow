# Quick Start Guide

## 🚀 Start the Frontend

Port 3000 is currently in use by another service. The frontend is configured to run on **port 3003**.

### Steps:

1. **Open a terminal** (new terminal window)

2. **Navigate to frontend directory:**
   ```bash
   cd /Users/OceanCyber/Downloads/myexrow/apps/web
   ```

3. **Install dependencies** (if not already done):
   ```bash
   pnpm install
   # OR if pnpm not available:
   npm install
   ```

4. **Start the development server:**
   ```bash
   pnpm dev
   # OR
   npm run dev
   ```

5. **Access the application:**
   - Open browser: **http://localhost:3003**
   - The app will automatically reload on file changes

---

## ✅ Verify It's Working

You should see in the terminal:
```
✓ Ready in X seconds
○ Local: http://localhost:3003
```

Then in your browser at http://localhost:3003:
- ✅ Home page loads
- ✅ API health check works
- ✅ Links to login/register visible

---

## 🔧 Troubleshooting

### "Command not found: pnpm"
```bash
# Install pnpm
npm install -g pnpm

# OR use npm instead
npm install
npm run dev
```

### "Cannot find module" errors
```bash
cd apps/web
rm -rf node_modules .next
pnpm install
pnpm dev
```

### Port 3003 also in use
```bash
# Use a different port
PORT=3004 pnpm dev
# Then access at http://localhost:3004
```

### Node.js not found
Install Node.js from: https://nodejs.org/
Or via Homebrew: `brew install node`

---

## 📝 Notes

- Frontend runs on: **http://localhost:3003**
- Backend API: **http://localhost:4001/api**
- Make sure backend is running first (docker compose up)

---

**Ready to start?** Open a terminal and run the commands above!




