# Building Executables for Registration Submission

MYXCROW is a **Node.js web application** — there is no single `.exe` file. For software registration, you submit **runnable deployable artifacts** that a reviewer can start locally.

---

## Recommended: Docker bundle (easiest for reviewers)

A reviewer with Docker Desktop can run the full stack with one command.

### Step 1 — Build production images

From repo root:

```bash
docker build -f services/api/Dockerfile.production -t myxcrow-api:1.0.0 .
docker build -f apps/web/Dockerfile.production -t myxcrow-web:1.0.0 .
```

### Step 2 — Export images to tar files

```bash
mkdir -p software-registration/pen-drive-1/01-executable/docker-images
docker save myxcrow-api:1.0.0 -o software-registration/pen-drive-1/01-executable/docker-images/myxcrow-api-1.0.0.tar
docker save myxcrow-web:1.0.0 -o software-registration/pen-drive-1/01-executable/docker-images/myxcrow-web-1.0.0.tar
```

Also include `docker-compose.production.yml` from repo root.

### Step 3 — Add RUN instructions

Create `software-registration/pen-drive-1/01-executable/RUN.txt`:

```
MYXCROW v1.0.0 — How to Run (Docker)

Requirements:
- Docker Desktop 4.x+
- 8GB RAM minimum
- Ports 3000, 4000, 5432 free

Steps:
1. docker load -i docker-images/myxcrow-api-1.0.0.tar
2. docker load -i docker-images/myxcrow-web-1.0.0.tar
3. Copy .env.example to .env and set DATABASE_URL (or use defaults in compose)
4. docker compose -f docker-compose.production.yml up -d
5. Open http://localhost:3000

Test login (after seeding):
- admin@myxcrow.com — see services/api/scripts/seed-users-and-transactions.ts for password
```

---

## Alternative: Dev stack (simpler, larger)

If production Dockerfiles are not configured, use the **dev compose** which is known to work:

```bash
./setup-local.sh
# App at http://localhost:3007
```

For pen drive, include:
- `infra/docker/docker-compose.dev.yml`
- `setup-local.sh`
- `README.md` with instructions
- Note: reviewer needs internet for `pnpm install` on first run

---

## Alternative: Pre-built Node artifacts

```bash
pnpm install
cd services/api && pnpm build    # → services/api/dist/
cd apps/web && pnpm build        # → apps/web/.next/
```

Package for pen drive:
```
01-executable/
├── api/
│   ├── dist/           # compiled NestJS
│   ├── package.json
│   ├── prisma/         # schema + migrations
│   └── node_modules/   # or document pnpm install
├── web/
│   ├── .next/          # compiled Next.js
│   ├── package.json
│   └── node_modules/
├── START.sh
└── RUN.txt
```

**START.sh** example:

```bash
#!/bin/bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myxcrow"
cd api && node dist/src/main.js &
cd ../web && pnpm start
```

Reviewer still needs PostgreSQL, Redis, and MinIO running separately — Docker is strongly preferred.

---

## WebView Gold project executable (if applicable)

If you have a separate Android/iOS wrapper:

| Platform | Executable | How to build |
|----------|------------|--------------|
| Android | `.apk` or `.aab` | Android Studio → Build → Build Bundle(s) / APK(s) |
| iOS | `.ipa` | Xcode → Archive → Distribute (Ad Hoc or Development) |

Place built files in `06-webview-gold-project/` on both pen drives.

---

## What counts as "executable" for a web app

Ghana software registration accepts:
- Docker images that run the application
- Compiled build output with start scripts
- Mobile APK/IPA if you ship a native wrapper
- A `docker-compose up` one-command demo

Include a **RUN.txt** on the pen drive root so reviewers know how to start the software without contacting you.

---

## Size planning

| Item | Approximate size |
|------|------------------|
| Source code zip (no node_modules) | 5–20 MB |
| API Docker image | 300–500 MB |
| Web Docker image | 200–400 MB |
| Postgres image (if bundled) | 150 MB |
| Screen recording MP4 | 50–500 MB |

Use **32 GB pen drives** to be safe. Format as **exFAT** for Windows + macOS compatibility.

---

## Security note for submission

- Remove real API keys from `.env` files
- Include `.env.example` with placeholder values
- Use seed data only — no production customer data
- Paystack/Smile ID can run in test/sandbox mode for the demo
