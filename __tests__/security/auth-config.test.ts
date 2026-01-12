import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Auth0 Configuration Security', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should read AUTH0_DOMAIN from environment variables', async () => {
    process.env.AUTH0_DOMAIN = 'https://test.auth0.com';
    process.env.AUTH0_APPLICATION_ID = 'test-app-id';

    // Dynamic import to get fresh config
    const config = await import('../../convex/auth.config');
    
    expect(config.default.providers[0].domain).toBe(process.env.AUTH0_DOMAIN);
  });

  it('should read AUTH0_APPLICATION_ID from environment variables', async () => {
    process.env.AUTH0_DOMAIN = 'https://test.auth0.com';
    process.env.AUTH0_APPLICATION_ID = 'test-app-id';

    const config = await import('../../convex/auth.config');
    
    expect(config.default.providers[0].applicationID).toBe(process.env.AUTH0_APPLICATION_ID);
  });

  it('should not contain hardcoded credentials', async () => {
    process.env.AUTH0_DOMAIN = 'https://test.auth0.com';
    process.env.AUTH0_APPLICATION_ID = 'test-app-id';

    const config = await import('../../convex/auth.config');
    
    // Verify no hardcoded values
    expect(config.default.providers[0].domain).not.toBe('https://pageo.jp.auth0.com');
    expect(config.default.providers[0].applicationID).not.toBe('WGUNWtdJLSAksnIfBMGgpxNx9V7hw8R2');
  });
});
