import { test, expect } from '@playwright/test';

test.describe('User Logout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Skip if no test credentials
    test.skip(process.env.CI === 'true' || !process.env.TEST_USER_EMAIL, 'Requires test credentials');
    
    // Login first
    await page.goto('/');
    const loginButton = page.locator('text=/log.?in|sign.?in/i').first();
    await loginButton.click();
    
    await page.waitForURL(/auth0\.com/);
    
    const emailField = page.locator('input[type="email"], input[name="email"]').first();
    const passwordField = page.locator('input[type="password"], input[name="password"]').first();
    
    await emailField.fill(process.env.TEST_USER_EMAIL || '');
    await passwordField.fill(process.env.TEST_USER_PASSWORD || '');
    
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    await page.waitForURL(/localhost|vercel\.app/);
  });

  test('should display logout button when logged in', async ({ page }) => {
    const logoutButton = page.locator('text=/log.?out|sign.?out/i').first();
    await expect(logoutButton).toBeVisible();
  });

  test('should logout and redirect to home page', async ({ page }) => {
    const logoutButton = page.locator('text=/log.?out|sign.?out/i').first();
    await logoutButton.click();
    
    // Should redirect to home or login page
    await page.waitForURL(/\/$|\/login/);
    
    // Login button should be visible again
    const loginButton = page.locator('text=/log.?in|sign.?in/i').first();
    await expect(loginButton).toBeVisible();
  });

  test('should clear session cookie after logout', async ({ page, context }) => {
    const logoutButton = page.locator('text=/log.?out|sign.?out/i').first();
    await logoutButton.click();
    
    await page.waitForURL(/\/$|\/login/);
    
    // Check that session cookie is cleared
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name.includes('auth') || c.name.includes('session'));
    
    expect(sessionCookie).toBeUndefined();
  });

  test('should not access protected routes after logout', async ({ page }) => {
    const logoutButton = page.locator('text=/log.?out|sign.?out/i').first();
    await logoutButton.click();
    
    await page.waitForURL(/\/$|\/login/);
    
    // Try to access protected route
    await page.goto('/bookmarks');
    
    // Should redirect to login or show unauthorized
    await page.waitForTimeout(2000);
    expect(page.url()).toMatch(/\/$|\/login|auth0\.com/);
  });

  test('should be able to login again after logout', async ({ page }) => {
    // Logout
    const logoutButton = page.locator('text=/log.?out|sign.?out/i').first();
    await logoutButton.click();
    
    await page.waitForURL(/\/$|\/login/);
    
    // Login again
    const loginButton = page.locator('text=/log.?in|sign.?in/i').first();
    await loginButton.click();
    
    await page.waitForURL(/auth0\.com/);
    
    const emailField = page.locator('input[type="email"], input[name="email"]').first();
    const passwordField = page.locator('input[type="password"], input[name="password"]').first();
    
    await emailField.fill(process.env.TEST_USER_EMAIL || '');
    await passwordField.fill(process.env.TEST_USER_PASSWORD || '');
    
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    await page.waitForURL(/localhost|vercel\.app/);
    
    // Should be logged in again
    const logoutButtonAgain = page.locator('text=/log.?out|sign.?out/i').first();
    await expect(logoutButtonAgain).toBeVisible();
  });
});
