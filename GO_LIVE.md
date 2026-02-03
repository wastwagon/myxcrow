# MYXCROW – Go Live on Hostinger VPS with Coolify

Deploy MYXCROW to production using your Hostinger VPS, Coolify, and GitHub.

**Repository:** https://github.com/wastwagon/myxcrow

---

## Pre-flight (before pushing)

- [ ] No `.env` or `.env.production` committed (they are in `.gitignore`).
- [ ] Local app runs: `http://localhost:3007` and API `http://localhost:4000/api/health` work.
- [ ] You have production values ready: domain names, JWT secret, DB password, Paystack live keys (optional at first), SMTP (optional).

---

## Part 1: Prepare and Push Code to GitHub

### 1.1 Push your local code to GitHub (GitHub Desktop)

1. Open **GitHub Desktop**.
2. If the repo is not yet added:
   - **File** → **Add Local Repository** → choose `myxcrow` folder.
   - Or **File** → **Clone Repository** → URL: `https://github.com/wastwagon/myxcrow` → choose a local path.
3. Ensure all changes are **committed** (summary + description, then **Commit to main**).
4. **Push** to GitHub (**Push origin** or **Publish repository** if it’s the first push).
5. Confirm on https://github.com/wastwagon/myxcrow that the latest code (including `apps/web`, `services/api`, Dockerfiles, and docs) is there.

### 1.2 Files that must be in the repo

- Root: `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`
- `apps/web/` (including `Dockerfile.production`, `public/`, `pages/`, etc.)
- `services/api/` (including `Dockerfile.production`, `prisma/`, `src/`)
- `COOLIFY_ENV_TEMPLATE.md` and `GO_LIVE.md` (optional but useful)

---

## Part 2: Coolify on Hostinger VPS

### 2.1 Prerequisites

- Hostinger VPS with Coolify installed and reachable (e.g. `http://YOUR_VPS_IP:8000`).
- Domain(s) for production, e.g.:
  - **Web:** `myxcrow.com` (or your chosen domain)
  - **API:** `api.myxcrow.com` (subdomain for the API)
- DNS: **A records** for both domains pointing to your VPS public IP.

### 2.2 Create project and connect GitHub

1. Log in to **Coolify**.
2. Create a **New Project** → name: `myxcrow`.
3. In Coolify, add **GitHub** as a source:
   - **Settings** (or **Sources**) → **Add Source** → **GitHub**.
   - Authorize and select the repo: **wastwagon/myxcrow**.
4. Use **main** (or your default branch) for deployments.

---

## Part 3: Database and Redis (Coolify managed)

### 3.1 PostgreSQL

1. In project **myxcrow**, add **New Resource** → **Database** (or **PostgreSQL**).
2. Name: `myxcrow-db`.
3. Set a **strong password** and save it (e.g. password manager).
4. Create the database; note the **internal** connection details Coolify shows (hostname is usually `myxcrow-db`, port `5432`).
5. Connection string format:
   ```text
   postgresql://postgres:YOUR_PASSWORD@myxcrow-db:5432/postgres
   ```
   If Coolify uses a different database name than `postgres`, replace the last segment. The API expects a database named `escrow`; you can create it or use the default and set `DATABASE_URL` accordingly (see below).

### 3.2 Create `escrow` database (if needed)

If the managed DB has only a default database (e.g. `postgres`):

- Either create a database named `escrow` in PostgreSQL (e.g. via Coolify’s DB UI or a one-off container),  
- Or use the default DB and set:
  ```text
  DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@myxcrow-db:5432/postgres
  ```
  and ensure Prisma migrations are run against that URL (API service will do this on startup if configured).

For a dedicated DB:

```text
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@myxcrow-db:5432/escrow
```

### 3.3 Redis

1. In the same project, add **New Resource** → **Redis** (or **Database** → Redis).
2. Name: `myxcrow-redis`.
3. Note the internal URL, e.g.:
   ```text
   redis://myxcrow-redis:6379
   ```

---

## Part 4: Deploy API Service

1. In project **myxcrow**, add **New Application** (or **New Service**).
2. **Source:** GitHub → **wastwagon/myxcrow** → branch **main**.
3. **Build:**
   - **Build pack:** Dockerfile.
   - **Dockerfile path:** `services/api/Dockerfile.production`
   - **Build context / Base directory:** repository **root** (`.` or leave as root).  
     The Dockerfile expects to be built from the repo root (it copies `package.json`, `services/api`, etc.).
4. **Port:** `4000`.
5. **Health check (optional but recommended):**
   - Path: `/api/health`
   - Port: 4000
6. **Domain:**
   - Add domain: `api.myxcrow.com` (or your API subdomain).
   - Enable **SSL** (Coolify/Let’s Encrypt).
7. **Environment variables** (paste and replace placeholders):

```bash
NODE_ENV=production
PORT=4000
WEB_APP_URL=https://myxcrow.com

DATABASE_URL=postgresql://postgres:YOUR_DB_PASSWORD@myxcrow-db:5432/escrow
REDIS_URL=redis://myxcrow-redis:6379

JWT_SECRET=GENERATE_WITH_openssl_rand_base64_32
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=CHANGE_ME_STRONG_PASSWORD
S3_BUCKET=escrow-evidence
S3_REGION=us-east-1

PAYSTACK_SECRET_KEY=sk_live_xxx
PAYSTACK_PUBLIC_KEY=pk_live_xxx
PAYSTACK_WEBHOOK_SECRET=xxx

DEFAULT_CURRENCY=GHS
DEFAULT_COUNTRY=GH

EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_USER=your-smtp-user
EMAIL_PASSWORD=your-smtp-password
EMAIL_FROM=noreply@myxcrow.com

CSRF_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=60
ENCRYPTION_KEY=GENERATE_WITH_openssl_rand_base64_32
```

Generate secrets:

```bash
openssl rand -base64 32   # JWT_SECRET, ENCRYPTION_KEY
```

8. **Deploy** the API. Wait until the build finishes and the container is healthy (e.g. `/api/health` returns 200).

### 4.1 MinIO (object storage)

The API expects MinIO (or S3). Two options:

- **A) Coolify MinIO:** If Coolify has a MinIO resource, add it to the same project and use its internal URL (e.g. `http://minio:9000`) and credentials in `S3_*` above. Ensure the API service and MinIO are on the same Docker network (same project in Coolify usually does this).
- **B) Use `docker-compose.production.yml` on the same VPS:** Run Postgres/Redis/MinIO with that file, and point the API’s `DATABASE_URL`, `REDIS_URL`, and `S3_ENDPOINT` to those services (by hostname/IP). Then deploy only the API (and web) with Coolify.

If you don’t add MinIO, the API will need a real S3 bucket and you’ll set `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET` to that bucket.

---

## Part 5: Deploy Web App (Next.js)

1. In the same project, add another **New Application**.
2. **Source:** GitHub → **wastwagon/myxcrow** → **main**.
3. **Build:**
   - **Build pack:** Dockerfile.
   - **Dockerfile path:** `apps/web/Dockerfile.production`
   - **Build context / Base directory:** repository **root**.
4. **Port:** `3000`.
5. **Health check:** path `/`, port 3000.
6. **Domain:** `myxcrow.com` (and optionally `www.myxcrow.com`) with SSL.

7. **Environment variables** – set these **before** the first build (Next.js bakes `NEXT_PUBLIC_*` into the build):

```bash
NODE_ENV=production
PORT=3000

NEXT_PUBLIC_API_BASE_URL=https://api.myxcrow.com/api
NEXT_PUBLIC_ENV=production
```

Use your real API URL. Do **not** use `localhost` here.

8. **Deploy** the web app. The first build may take several minutes.

---

## Part 6: Post-deploy checks

1. **API**
   - Open: `https://api.myxcrow.com/api/health`  
   - Expect: `{"status":"ok",...}` and status 200.

2. **Web**
   - Open: `https://myxcrow.com`  
   - Home page loads; “System Status” shows healthy if the frontend can reach the API.

3. **SSL**
   - Both URLs should show a valid certificate (green lock).

4. **Login**
   - Use an existing admin/user account (or create one via API/DB) and log in from the web app.

5. **CORS**
   - If the repo’s API is configured with `WEB_APP_URL=https://myxcrow.com`, browser requests from `https://myxcrow.com` to `https://api.myxcrow.com` should be allowed.

---

## Part 7: Optional – Seed admin user

If the database is empty, you need at least one user. Options:

- Run the API’s seed script once (e.g. Coolify “Run command” or a one-off container with the same env and `pnpm run seed` or equivalent from `services/api`).
- Or insert a user and wallet manually in the database and use “forgot password” to set a password.

See `scripts/db-seed.sh` or `services/api/scripts/seed-users-and-transactions.ts` in the repo for how your app seeds data.

---

## Quick reference

| Item              | Value                               |
|-------------------|-------------------------------------|
| GitHub repo       | https://github.com/wastwagon/myxcrow |
| API Dockerfile    | `services/api/Dockerfile.production`  |
| Web Dockerfile    | `apps/web/Dockerfile.production`     |
| Build context     | Repository root                      |
| API port          | 4000                                 |
| Web port          | 3000                                 |
| Env template      | `COOLIFY_ENV_TEMPLATE.md`            |

---

## Troubleshooting

- **Build fails (API or Web)**  
  - Ensure build context is the **repo root** (not `services/api` or `apps/web`).
  - Ensure `pnpm-lock.yaml` and all referenced `package.json` files are committed.

- **API: database connection failed**  
  - Check `DATABASE_URL` (hostname `myxcrow-db`, password, database name `escrow` or `postgres`).
  - Ensure the DB resource is running and on the same network as the API in Coolify.

- **Web: “Connection Failed” or CORS errors**  
  - Set `NEXT_PUBLIC_API_BASE_URL=https://api.myxcrow.com/api` and **rebuild** the web app.
  - Set API `WEB_APP_URL=https://myxcrow.com` and restart the API.

- **SSL not working**  
  - Confirm DNS A records for `myxcrow.com` and `api.myxcrow.com` point to the VPS IP.
  - Wait 5–10 minutes for DNS, then retry certificate in Coolify.

For more detail, see `COOLIFY_MIGRATION_GUIDE.md` and `COOLIFY_ENV_TEMPLATE.md`.
