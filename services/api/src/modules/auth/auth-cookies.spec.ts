import { authCookieOptions } from './auth-cookies';

describe('authCookieOptions', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env.COOKIE_SAMESITE = originalEnv.COOKIE_SAMESITE;
    process.env.NODE_ENV = originalEnv.NODE_ENV;
    process.env.WEB_APP_URL = originalEnv.WEB_APP_URL;
  });

  it('uses partitioned SameSite=None cookies when forced', () => {
    process.env.COOKIE_SAMESITE = 'none';
    process.env.NODE_ENV = 'production';
    const req = {
      hostname: 'myxcrow-bp-api.onrender.com',
      protocol: 'https',
      headers: { 'x-forwarded-proto': 'https' },
    } as any;

    const opts = authCookieOptions(req, 900000);

    expect(opts.sameSite).toBe('none');
    expect(opts.secure).toBe(true);
    expect(opts.httpOnly).toBe(true);
    expect((opts as { partitioned?: boolean }).partitioned).toBe(true);
  });
});
