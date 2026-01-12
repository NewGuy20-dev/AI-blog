// Test setup file
import { beforeAll } from 'vitest';

beforeAll(() => {
  // Set test environment variables
  process.env.AUTH0_DOMAIN = 'https://pageo.jp.auth0.com';
  process.env.AUTH0_APPLICATION_ID = 'WGUNWtdJLSAksnIfBMGgpxNx9V7hw8R2';
  process.env.CRON_SECRET = 'test-secret-key';
  process.env.NEXT_PUBLIC_CONVEX_URL = 'https://test.convex.cloud';
});
