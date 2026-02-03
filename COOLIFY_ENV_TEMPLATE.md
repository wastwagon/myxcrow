# Coolify Environment Variables Template

Copy these environment variables into your Coolify applications.

## API Service (`myxcrow-api`)

### Application Configuration
```bash
NODE_ENV=production
PORT=4000
WEB_APP_URL=https://myxcrow.com
```

### Database (PostgreSQL)
```bash
# If using Coolify managed PostgreSQL:
DATABASE_URL=postgresql://postgres:PASSWORD@myxcrow-db:5432/postgres

# If using external PostgreSQL:
# DATABASE_URL=postgresql://user:password@host:5432/database
```

### Redis
```bash
# If using Coolify managed Redis:
REDIS_URL=redis://myxcrow-redis:6379

# If using external Redis:
# REDIS_URL=redis://host:6379
# REDIS_URL=redis://:password@host:6379
```

### JWT Authentication
```bash
# Generate with: openssl rand -base64 32
JWT_SECRET=your-strong-secret-key-here-minimum-32-characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### S3 Storage (MinIO or AWS S3)
```bash
# For MinIO (self-hosted):
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=change-me-in-production
S3_BUCKET=escrow-evidence
S3_REGION=us-east-1

# For AWS S3:
# S3_ENDPOINT=https://s3.amazonaws.com
# S3_ACCESS_KEY=your-aws-access-key
# S3_SECRET_KEY=your-aws-secret-key
# S3_BUCKET=escrow-evidence
# S3_REGION=us-east-1
```

### Paystack Payment Gateway
```bash
# Production keys from https://dashboard.paystack.com/#/settings/developer
PAYSTACK_SECRET_KEY=sk_live_your_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_live_your_public_key_here
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret_here

# Currency and Country defaults
DEFAULT_CURRENCY=GHS
DEFAULT_COUNTRY=GH
```

### Email Configuration (SMTP)
```bash
# Example: SendGrid
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@myxcrow.com

# Example: Mailgun
# EMAIL_HOST=smtp.mailgun.org
# EMAIL_PORT=587
# EMAIL_USER=postmaster@myxcrow.com
# EMAIL_PASSWORD=your-mailgun-password
# EMAIL_FROM=noreply@myxcrow.com

# Example: AWS SES
# EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
# EMAIL_PORT=587
# EMAIL_USER=your-ses-access-key
# EMAIL_PASSWORD=your-ses-secret-key
# EMAIL_FROM=noreply@myxcrow.com
```

### Security Configuration
```bash
CSRF_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=60

# Generate with: openssl rand -base64 32
ENCRYPTION_KEY=your-encryption-key-here-minimum-32-characters
```

---

## Web Service (`myxcrow-web`)

### Application Configuration
```bash
NODE_ENV=production
PORT=3000
```

### API Configuration
```bash
# Use your API domain (from Coolify)
NEXT_PUBLIC_API_BASE_URL=https://api.myxcrow.com/api
NEXT_PUBLIC_ENV=production
```

---

## Notes

1. **Generate Secrets:** Use `openssl rand -base64 32` to generate secure random strings for:
   - `JWT_SECRET`
   - `ENCRYPTION_KEY`
   - `POSTGRES_PASSWORD` (if managing PostgreSQL yourself)

2. **Database Connection:** 
   - Coolify managed databases use service names as hostnames (e.g., `myxcrow-db`)
   - External databases use IP addresses or domain names

3. **Redis Connection:**
   - Coolify managed Redis uses service name as hostname (e.g., `myxcrow-redis`)
   - External Redis uses IP addresses or domain names

4. **S3 Storage:**
   - For production, consider using AWS S3 or compatible service
   - MinIO is suitable for development/testing
   - Ensure bucket exists and has proper permissions

5. **Email Service:**
   - Use a production SMTP service (SendGrid, Mailgun, AWS SES)
   - Configure SPF/DKIM records for your domain
   - Test email delivery before going live

6. **Paystack:**
   - Use production keys (`sk_live_*`, `pk_live_*`) for production
   - Configure webhook endpoint: `https://api.myxcrow.com/api/payments/webhook`
   - Set webhook secret in Paystack dashboard

7. **Domain Configuration:**
   - Main domain: `myxcrow.com` (web app)
   - API domain: `api.myxcrow.com` (API service)
   - Ensure DNS A records point to your VPS IP:
     - `myxcrow.com` → VPS IP
     - `api.myxcrow.com` → VPS IP
   - Coolify will automatically generate SSL certificates via Let's Encrypt

---

## Quick Setup Commands

```bash
# Generate JWT Secret
openssl rand -base64 32

# Generate Encryption Key
openssl rand -base64 32

# Generate Database Password
openssl rand -base64 24
```

---

**Last Updated:** January 2026
