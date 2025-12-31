import { test, expect } from '@playwright/test';

const ADMIN_ROUTES = [
  '/admin',
  '/admin/security-events',
  '/admin/emergency-lockdown',
  '/admin/hardware-bans',
  '/admin/blocked-ips',
  '/admin/fingerprints',
  '/admin/trusted-devices',
  '/admin/users',
  '/admin/posts',
  '/admin/support',
  '/admin/logs',
  '/admin/terminal',
];

test.describe('Admin Access Control - Unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const route of ADMIN_ROUTES) {
    test(`${route} should deny access when not logged in`, async ({ page }) => {
      await page.goto(route);
      
      // Should see Access Denied heading
      await expect(page.getByRole('heading', { name: 'Access Denied' })).toBeVisible({ timeout: 10000 });
      
      // Should see Sign In link
      await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
      
      // Should NOT see admin sidebar navigation
      await expect(page.locator('nav >> text=Security')).not.toBeVisible();
    });
  }

  test('should show Sign In button when not logged in', async ({ page }) => {
    await page.goto('/admin');
    
    await expect(page.getByRole('heading', { name: 'Access Denied' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
  });

  test('should not render sidebar navigation when not logged in', async ({ page }) => {
    await page.goto('/admin');
    
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('nav >> text=Security')).not.toBeVisible();
    await expect(page.locator('nav >> text=Management')).not.toBeVisible();
  });
});

test.describe('Admin Page Content Protection', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should not expose sensitive data on /admin/users', async ({ page }) => {
    await page.goto('/admin/users');
    
    await expect(page.locator('text=Users & Admins')).not.toBeVisible();
    await expect(page.locator('text=Add Admin')).not.toBeVisible();
  });

  test('should not expose security events on /admin/security-events', async ({ page }) => {
    await page.goto('/admin/security-events');
    
    await expect(page.locator('h1:has-text("Security Events")')).not.toBeVisible();
  });

  test('should not expose lockdown controls on /admin/emergency-lockdown', async ({ page }) => {
    await page.goto('/admin/emergency-lockdown');
    
    await expect(page.locator('h1:has-text("Emergency Lockdown")')).not.toBeVisible();
    await expect(page.locator('text=Initiate Lockdown')).not.toBeVisible();
  });
});
