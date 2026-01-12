import { test, expect } from '@playwright/test';

test.describe('Security Headers', () => {
  test('should have X-Frame-Options header set to DENY', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    
    expect(headers?.['x-frame-options']).toBe('DENY');
  });

  test('should have X-Content-Type-Options header set to nosniff', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    
    expect(headers?.['x-content-type-options']).toBe('nosniff');
  });

  test('should have Strict-Transport-Security header', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    
    expect(headers?.['strict-transport-security']).toContain('max-age=31536000');
    expect(headers?.['strict-transport-security']).toContain('includeSubDomains');
  });

  test('should have Content-Security-Policy header', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    
    expect(headers?.['content-security-policy']).toBeDefined();
    expect(headers?.['content-security-policy']).toContain("default-src 'self'");
  });

  test('should have Referrer-Policy header', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    
    expect(headers?.['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  test('should have all security headers on API routes', async ({ request }) => {
    const response = await request.get('/api/run-job', {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    
    const headers = response.headers();
    
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['strict-transport-security']).toBeDefined();
  });
});
