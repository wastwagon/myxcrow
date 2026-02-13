/**
 * Validate required environment variables at startup.
 * Fails fast with a clear message if any are missing.
 */
const REQUIRED = [
  'DATABASE_URL',
  'JWT_SECRET',
] as const;

export function validateEnv(): void {
  const missing: string[] = [];

  for (const key of REQUIRED) {
    const val = process.env[key];
    if (!val || val.trim() === '') {
      missing.push(key);
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
