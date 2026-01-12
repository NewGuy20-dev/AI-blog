import { test, expect } from '@playwright/test';

test.describe('User Sign-Up Flow', () => {
  test('should display sign-up page', async ({ page }) => {
    await page.goto('/');
    
    // Look for sign-up or login button
    const signUpButton = page.locator('text=/sign.?up|create account/i').first();
    await expect(signUpButton).toBeVisible();
  });

  test('should navigate to Auth0 sign-up page', async ({ page }) => {
    await page.goto('/');
    
    // Click sign-up button
    const signUpButton = page.locator('text=/sign.?up|create account/i').first();
    await signUpButton.click();
    
    // Should redirect to Auth0
    await page.waitForURL(/auth0\.com/, { timeout: 5000 });
    expect(page.url()).toContain('auth0.com');
  });

  test('should show sign-up form on Auth0', async ({ page }) => {
    await page.goto('/');
    
    const signUpButton = page.locator('text=/sign.?up|create account/i').first();
    await signUpButton.click();
    
    await page.waitForURL(/auth0\.com/);
    
    // Check for email and password fields
    const emailField = page.locator('input[type="email"], input[name="email"]');
    const passwordField = page.locator('input[type="password"], input[name="password"]');
    
    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/');
    
    const signUpButton = page.locator('text=/sign.?up|create account/i').first();
    await signUpButton.click();
    
    await page.waitForURL(/auth0\.com/);
    
    // Try invalid email
    const emailField = page.locator('input[type="email"], input[name="email"]').first();
    await emailField.fill('invalid-email');
    
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    // Should show validation error
    const errorMessage = page.locator('text=/invalid|error/i');
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
  });
});
