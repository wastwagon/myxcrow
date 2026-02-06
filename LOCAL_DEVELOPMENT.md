# MYXCROW Local Development Guide

Complete guide for setting up and running MYXCROW locally using Docker.

## 📋 Prerequisites

- **Docker Desktop** (v20.10+)
- **Docker Compose** (v2.0+ or v1.29+)
- **Git** (for cloning the repository)

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

Run the setup script:

```bash
./setup-local.sh
```

This script will:
- ✅ Check Docker is running
- ✅ Free up required ports
- ✅ Start all infrastructure services
- ✅ Initialize database and run migrations
- ✅ Start API and Web services
- ✅ Verify all services are healthy

### Option 2: Manual Setup

1. **Start Docker Desktop** and wait for it to be fully running

2. **Start all services:**
   ```bash
   docker-compose -f infra/docker/docker-compose.dev.yml up -d
   ```

3. **Wait for services to be healthy** (check with `docker-compose ps`)

4. **Run database migrations** (if needed):
   ```bash
   docker exec escrow_api pnpm prisma migrate deploy
   ```

5. **Seed test data** (optional):
   ```bash
   docker exec escrow_api pnpm seed
   ```

## 🌐 Access Points

Once services are running, access them at:

| Service | URL | Credentials |
|---------|-----|-------------|
| **Web Frontend** | http://localhost:3007 | - |
| **API** | http://localhost:4000/api | - |
| **API Health** | http://localhost:4000/api/health | - |
| **Mailpit** | http://localhost:8026 | - |
| **MinIO Console** | http://localhost:9004 | `minioadmin` / `minioadmin` |
| **MinIO API** | http://localhost:9003 | `minioadmin` / `minioadmin` |
| **PostgreSQL** | localhost:5434 | `postgres` / `postgres` |
| **Redis** | localhost:6380 | - |

## 🧪 Test Accounts

After seeding the database, you can use these test accounts:

### Admin Account
- **Email:** `admin@myxcrow.com`
- **Password:** `Admin123!`

### Test Users (Password: `password123`)
- **Buyers:** `buyer1@test.com` through `buyer5@test.com`
- **Sellers:** `seller1@test.com` through `seller5@test.com`

## 📦 Services Overview

### Infrastructure Services

1. **PostgreSQL** (`escrow_db`)
   - Database for the application
   - Port: `5434`
   - Database: `escrow`
   - User: `postgres`
   - Password: `postgres`

2. **Redis** (`escrow_redis`)
   - Cache and queue backend
   - Port: `6380`

3. **MinIO** (`escrow_minio`)
   - S3-compatible object storage
   - API Port: `9003`
   - Console Port: `9004`
   - Bucket: `escrow-evidence` (auto-created)

4. **Mailpit** (`escrow_mailpit`)
   - Email testing tool
   - SMTP Port: `1026`
   - Web UI Port: `8026`

### Application Services

1. **API** (`escrow_api`)
   - NestJS backend service
   - Port: `4000`
   - Auto-runs migrations on startup
   - Hot-reload enabled

2. **Web** (`escrow_web`)
   - Next.js frontend service
   - Port: `3000`
   - Hot-reload enabled

## 🛠️ Common Commands

### View Logs

```bash
# All services
docker-compose -f infra/docker/docker-compose.dev.yml logs -f

# Specific service
docker-compose -f infra/docker/docker-compose.dev.yml logs -f api
docker-compose -f infra/docker/docker-compose.dev.yml logs -f web
```

### Stop Services

```bash
# Stop all services
docker-compose -f infra/docker/docker-compose.dev.yml down

# Stop and remove volumes (clean slate)
docker-compose -f infra/docker/docker-compose.dev.yml down -v
```

### Restart Services

```bash
# Restart all services
docker-compose -f infra/docker/docker-compose.dev.yml restart

# Restart specific service
docker-compose -f infra/docker/docker-compose.dev.yml restart api
```

### Check Service Status

```bash
docker-compose -f infra/docker/docker-compose.dev.yml ps
```

### Execute Commands in Containers

```bash
# Run database migrations
docker exec escrow_api pnpm prisma migrate deploy

# Generate Prisma client
docker exec escrow_api pnpm prisma generate

# Seed database
docker exec escrow_api pnpm seed

# Access API container shell
docker exec -it escrow_api sh

# Access Web container shell
docker exec -it escrow_web sh

# Access database
docker exec -it escrow_db psql -U postgres -d escrow
```

## 🔧 Development Workflow

### Making Code Changes

Both API and Web services have hot-reload enabled:
- **API**: Changes to `services/api/src` are automatically reloaded
- **Web**: Changes to `apps/web` are automatically reloaded

### Database Migrations

1. **Create a new migration:**
   ```bash
   docker exec escrow_api pnpm prisma migrate dev --name your_migration_name
   ```

2. **Apply existing migrations:**
   ```bash
   docker exec escrow_api pnpm prisma migrate deploy
   ```

3. **Open Prisma Studio** (database GUI):
   ```bash
   docker exec escrow_api pnpm prisma studio
   ```
   Then access at http://localhost:5555

### Testing

```bash
# Run API tests
docker exec escrow_api pnpm test

# Run Web tests (if configured)
docker exec escrow_web pnpm test
```

## 🐛 Troubleshooting

### Port Already in Use

If a port is already in use:

```bash
# Find process using port 3000
lsof -ti:3000

# Kill process
lsof -ti:3000 | xargs kill -9
```

Or change the port in `infra/docker/docker-compose.dev.yml`.

### Docker Daemon Not Running

```bash
# Check Docker status
docker ps

# If error, start Docker Desktop and wait for it to fully start
```

### Services Not Starting

1. **Check logs:**
   ```bash
   docker-compose -f infra/docker/docker-compose.dev.yml logs
   ```

2. **Check service health:**
   ```bash
   docker-compose -f infra/docker/docker-compose.dev.yml ps
   ```

3. **Rebuild images:**
   ```bash
   docker-compose -f infra/docker/docker-compose.dev.yml build --no-cache
   ```

### Database Connection Issues

1. **Check database is healthy:**
   ```bash
   docker exec escrow_db pg_isready -U postgres
   ```

2. **Check database logs:**
   ```bash
   docker-compose -f infra/docker/docker-compose.dev.yml logs db
   ```

3. **Reset database** (⚠️ **WARNING**: This deletes all data):
   ```bash
   docker-compose -f infra/docker/docker-compose.dev.yml down -v
   docker-compose -f infra/docker/docker-compose.dev.yml up -d db
   # Wait for DB to be healthy, then restart API
   ```

### API Not Responding

1. **Check API logs:**
   ```bash
   docker-compose -f infra/docker/docker-compose.dev.yml logs api
   ```

2. **Check if API is running:**
   ```bash
   curl http://localhost:4000/api/health
   ```

3. **Restart API:**
   ```bash
   docker-compose -f infra/docker/docker-compose.dev.yml restart api
   ```

### Web Not Loading

1. **Check Web logs:**
   ```bash
   docker-compose -f infra/docker/docker-compose.dev.yml logs web
   ```

2. **Check if Web is running:**
   ```bash
   curl http://localhost:3000
   ```

3. **Restart Web:**
   ```bash
   docker-compose -f infra/docker/docker-compose.dev.yml restart web
   ```

### MinIO Bucket Not Found

The setup script should create the bucket automatically. If not:

```bash
# Create bucket manually
docker exec escrow_minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker exec escrow_minio mc mb local/escrow-evidence
docker exec escrow_minio mc anonymous set download local/escrow-evidence
```

## 📝 Environment Variables

For local development, environment variables are set in `infra/docker/docker-compose.dev.yml`.

To override defaults, create a `.env` file in the project root (see `.env.example`).

## 🔐 Security Notes

⚠️ **Important for Production:**
- Change `JWT_SECRET` to a strong, random value
- Use proper S3 credentials (not MinIO defaults)
- Configure real SMTP server (not Mailpit)
- Use environment variables for sensitive data
- Enable HTTPS/TLS

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)

## 🆘 Getting Help

If you encounter issues:

1. Check the logs: `docker-compose -f infra/docker/docker-compose.dev.yml logs`
2. Verify Docker is running: `docker ps`
3. Check service health: `docker-compose -f infra/docker/docker-compose.dev.yml ps`
4. Review this guide's troubleshooting section
5. Check the main README.md for project-specific information

---

**Happy Coding! 🚀**

