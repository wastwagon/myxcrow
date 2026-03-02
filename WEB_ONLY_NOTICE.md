# MYXCROW is web-only

**The MYXCROW codebase is a single web application** (mobile-first, PWA-ready). There is **no native iOS/Android app** and **no Expo or React Native** in this repo.

- **Frontend:** `apps/web` (Next.js) only.
- **Backend:** `services/api` (NestJS).
- **Setup and run:** See [README](README.md). Use the web app in a browser (including on phones).

## Why do some docs mention "mobile app" or Expo?

Many markdown files are **historical or roadmap** documents. They may still refer to:

- `apps/mobile` (removed)
- Expo, React Native, iOS/Android app
- "Mobile App" as a phase or competitor feature

**You can ignore those for current development.** They are not instructions for this repo. If you see a command like `cd apps/mobile`, do **not** run it; use `apps/web` instead.

For current architecture, see [SHARED_ARCHITECTURE.md](SHARED_ARCHITECTURE.md) and [README](README.md).
