/**
 * Validate required environment variables at startup.
 * Fails fast with a clear message if any are missing.
 */
const REQUIRED = [
  'DATABASE_URL',
  'JWT_SECRET',
] as const;

const PRODUCTION_REQUIRED = [
  'PAYSTACK_SECRET_KEY',
  'WEB_APP_URL',
] as const;

export function validateEnv(): void {
  const missing: string[] = [];
  const production = process.env.NODE_ENV === 'production';

  for (const key of REQUIRED) {
    const val = process.env[key];
    if (!val || val.trim() === '') {
      missing.push(key);
    }
  }

  if (production) {
    for (const key of PRODUCTION_REQUIRED) {
      const val = process.env[key];
      if (!val || val.trim() === '') {
        missing.push(key);
      }
    }
    if (process.env.OTP_DEV_BYPASS === 'true') {
      missing.push('OTP_DEV_BYPASS must not be true in production');
    }
    if (process.env.SWAGGER_ENABLED === 'true') {
      missing.push('SWAGGER_ENABLED must not be true in production');
    }
  }

  if (process.env.SMS_ENABLED === 'true' && !process.env.ARKESEL_API_KEY?.trim()) {
    missing.push('ARKESEL_API_KEY (required when SMS_ENABLED=true)');
  }

  if (missing.length > 0) {
    const msg = `Missing required environment variables:\n  - ${missing.join('\n  - ')}\n\nCheck .env or your deployment configuration.`;
    console.error(msg);
    process.exit(1);
  }
}
