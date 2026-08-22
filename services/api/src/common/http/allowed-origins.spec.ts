import { getAllowedOrigins } from './allowed-origins';

describe('getAllowedOrigins', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env.CORS_ORIGINS = originalEnv.CORS_ORIGINS;
    process.env.WEB_APP_URL = originalEnv.WEB_APP_URL;
    process.env.WEB_BASE_URL = originalEnv.WEB_BASE_URL;
    process.env.NODE_ENV = originalEnv.NODE_ENV;
  });

  it('includes www and http variants of the production web origin', () => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ORIGINS = 'https://www.myxcrow.com,https://myxcrow.com';
    delete process.env.WEB_APP_URL;
    delete process.env.WEB_BASE_URL;

    const origins = getAllowedOrigins();

    expect(origins).toEqual(
      expect.arrayContaining([
        'https://www.myxcrow.com',
        'https://myxcrow.com',
        'http://www.myxcrow.com',
        'http://myxcrow.com',
      ]),
    );
  });
});
