import { test, expect } from '@playwright/test';

test.describe('Protected Routes Security', () => {
  test('should redirect to login when accessing /bookmarks without auth', async ({ page }) => {
    await page.goto('/bookmarks');
    
    // Should redirect to login or Auth0
    await page.waitForTimeout(2000);
    expect(page.url()).toMatch(/\/$|\/login|auth0\.com/);
  });

  test('should return 401 for API routes without auth', async ({ request }) => {
    const response = await request.post('/api/convex/mutation', {
      data: {
        function: 'posts:create',
        args: { title: 'Test' }
      }
    });
    
    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body.code).toBe('UNAUTHORIZED');
  });

  test('should block access to mutation endpoint without auth', async ({ request }) => {
    const response = await request.post('/api/convex/mutation', {
      data: {
        function: 'bookmarks:toggle',
        args: { postId: '123' }
      }
    });
    
    expect(response.status()).toBe(401);
  });

  test('should allow access to public routes without auth', async ({ page }) => {
    // Home page should be accessible
    const homeResponse = await page.goto('/');
    expect(homeResponse?.status()).toBe(200);
    
    // Feed page should be accessible
    const feedResponse = await page.goto('/feed');
    expect(feedResponse?.status()).toBe(200);
  });

  test('should allow access to public API routes', async ({ request }) => {
    // RSS feed should be public
    const response = await request.get('/api/rss');
    expect(response.status()).toBe(200);
  });

  test('should protect admin routes', async ({ page }) => {
    await page.goto('/admin');
    
    // Should redirect or show 404/403
    await page.waitForTimeout(2000);
    const url = page.url();
    const isProtected = url.includes('login') || url.includes('auth0') || url === '/';
    
    expect(isProtected).toBe(true);
  });

  test('should require auth for cron job endpoint', async ({ request }) => {
    const response = await request.get('/api/run-job');
    
    // Should return 401 without proper auth header
    expect(response.status()).toBe(401);
  });

  test('should require valid Bearer token for cron endpoint', async ({ request }) => {
    const response = await request.get('/api/run-job', {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    
    expect(response.status()).toBe(401);
  });

  test('should block non-whitelisted mutation functions', async ({ request }) => {
    // Even with auth, non-whitelisted functions should be blocked
    const response = await request.post('/api/convex/mutation', {
      data: {
        function: 'admin:deleteAll',
        args: {}
      },
      headers: {
        // Note: This would need a valid session cookie in real test
        'Cookie': 'auth-session=test'
      }
    });
    
    // Should return 401 (no auth) or 403 (not whitelisted)
    expect([401, 403]).toContain(response.status());
  });
});
