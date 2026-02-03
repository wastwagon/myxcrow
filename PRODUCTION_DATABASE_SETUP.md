# Production Database Setup (Render)

This guide covers the production database when deploying MYXCROW on **Render** with the Blueprint.

## Database connection

The Blueprint creates a Render Postgres database (`myxcrow-bp-db`) and injects `DATABASE_URL` into the API service. You do **not** set `DATABASE_URL` manually.

## Migrations

### Automatic (recommended)

The API’s **preDeployCommand** in `render.yaml` runs:

```bash
pnpm prisma:deploy
```

So every deploy runs `prisma migrate deploy` before the app starts. No manual step needed.

### Manual (Render Shell / local)

If you need to run migrations manually (e.g. from Render Shell or with a one-off job):

1. Get `DATABASE_URL` from Render Dashboard → **myxcrow-bp-db** → **Info** (Internal Database URL).
2. From repo root with `DATABASE_URL` set:

```bash
cd services/api
pnpm prisma generate
pnpm prisma migrate deploy
```

Or use the project script (with `DATABASE_URL` set):

```bash
./scripts/migrate-production.sh
```

## Seeding

From Render Dashboard → **myxcrow-bp-api** → **Shell** (if available), or run locally with `DATABASE_URL` set:

```bash
cd services/api
pnpm seed
```

## Backups

Use Render’s managed Postgres backups (Dashboard → **myxcrow-bp-db** → Backups). For extra safety, schedule your own dumps to external storage.

## Security

- Never commit `DATABASE_URL` or any production secrets.
- Render keeps credentials in the Dashboard and injects them into the API service.
