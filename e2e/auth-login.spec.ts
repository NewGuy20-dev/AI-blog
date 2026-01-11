import { test, expect } from '@playwright/test';

test.describe('User Login Flow', () => {
  test('should display login button', async ({ page }) => {
    await page.goto('/');
    
    const loginButton = page.locator('text=/log.?in|sign.?in/i').first();
    await expect(loginButton).toBeVisible();
  });

  test('should navigate to Auth0 login page', async ({ page }) => {
    await page.goto('/');
    
    const loginButton = page.locator('text=/log.?in|sign.?in/i').first();
    await loginButton.click();
    
    // Should redirect to Auth0
    await page.waitForURL(/auth0\.com/, { timeout: 5000 });
    expect(page.url()).toContain('auth0.com');
  });

  test('should show login form on Auth0', async ({ page }) => {
    await page.goto('/');
    
    const loginButton = page.locator('text=/log.?in|sign.?in/i').first();
    await loginButton.click();
    
    await page.waitForURL(/auth0\.com/);
    
    // Check for email and password fields
    const emailField = page.locator('input[type="email"], input[name="email"]');
    const passwordField = page.locator('input[type="password"], input[name="password"]');
    
    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/');
    
    const loginButton = page.locator('text=/log.?in|sign.?in/i').first();
    await loginButton.click();
    
    await page.waitForURL(/auth0\.com/);
    
    // Enter invalid credentials
    const emailField = page.locator('input[type="email"], input[name="email"]').first();
    const passwordField = page.locator('input[type="password"], input[name="password"]').first();
    
    await emailField.fill('invalid@example.com');
    await passwordField.fill('wrongpassword');
    
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    // Should show error message
    const errorMessage = page.locator('text=/wrong|incorrect|invalid/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should redirect to app after successful login', async ({ page }) => {
    // Note: This test requires valid test credentials
    // Skip in CI or use test account
    test.skip(process.env.CI === 'true', 'Requires test credentials');
    
    await page.goto('/');
    
    const loginButton = page.locator('text=/log.?in|sign.?in/i').first();
    await loginButton.click();
    
    await page.waitForURL(/auth0\.com/);
    
    // Login with test credentials (from env vars)
    const emailField = page.locator('input[type="email"], input[name="email"]').first();
    const passwordField = page.locator('input[type="password"], input[name="password"]').first();
    
    await emailField.fill(process.env.TEST_USER_EMAIL || '');
    await passwordField.fill(process.env.TEST_USER_PASSWORD || '');
    
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    // Should redirect back to app
    await page.waitForURL(/localhost|vercel\.app/, { timeout: 10000 });
    expect(page.url()).not.toContain('auth0.com');
  });

  test('should set session cookie after login', async ({ page, context }) => {
    test.skip(process.env.CI === 'true', 'Requires test credentials');
    
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
    
    // Check for session cookie
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name.includes('auth') || c.name.includes('session'));
    
    expect(sessionCookie).toBeDefined();
  });
});
