import { test, expect } from '@playwright/test';

test.describe('Authentication & Gated Routing E2E', () => {
  test('should redirect unauthenticated users from /dashboard to landing page', async ({ page }) => {
    // Attempt to access gated dashboard directly
    await page.goto('/dashboard');

    // Should be redirected to landing login page (/)
    await expect(page).toHaveURL('/');
    
    // Should display the sign-in prompt/card
    const loginHeading = page.locator('h1');
    await expect(loginHeading).toContainText(/Aspiration/i);
  });

  test('should display landing page with premium Google Sign-In interface', async ({ page }) => {
    await page.goto('/');
    
    // Check for title and Google sign-in button
    await expect(page.locator('text=Sign In with Google')).toBeVisible();
    await expect(page.locator('text=Guided Skill Pathways for Developers')).toBeVisible();
  });
});
