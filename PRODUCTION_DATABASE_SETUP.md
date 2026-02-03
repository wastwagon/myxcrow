# Production Database Setup Guide (VPS + Coolify)

This guide explains how to set up and maintain the production database when deploying MYXCROW on a **VPS** using **Coolify**.

## Database connection

Your API needs a `DATABASE_URL` in this format:

```bash
export DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

Where you get it:

- **Recommended**: Create a PostgreSQL **Resource** in Coolify and copy the connection string into your API app env vars.
- **Alternative**: Run PostgreSQL yourself (e.g. `docker-compose.production.yml`) and use that connection string.

## Running migrations

### Automatic (recommended)

Ensure the API startup flow runs:

- `pnpm prisma generate`
- `pnpm prisma migrate deploy`

This keeps schema up to date on every deployment.

### Manual (via Coolify shell)

Open your **API app** in Coolify → **Terminal/Shell**, then:

```bash
cd services/api
pnpm prisma generate
pnpm prisma migrate deploy
```

### Script (from your laptop/VPS)

```bash
export DATABASE_URL="postgresql://user:password@host:5432/dbname"
./scripts/migrate-production.sh
```

## Seeding

Run from the API container shell:

```bash
cd services/api
pnpm seed
```

## Verification

```bash
psql "$DATABASE_URL" -c "\dt"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

## Security notes

- Never commit database credentials (or any production secrets) to git.
- Enable automatic backups:
  - Coolify resource backups, or
  - Your own scheduled dumps + offsite storage.

