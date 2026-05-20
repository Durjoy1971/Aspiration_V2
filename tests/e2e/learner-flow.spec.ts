import { test, expect } from '@playwright/test';

test.describe('Learner Flow Route Guards E2E', () => {
  test('should redirect unauthenticated users from skill workspace to landing page', async ({ page }) => {
    await page.goto('/dashboard/skills/react');
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Sign In with Google')).toBeVisible();
  });

  test('should redirect unauthenticated users from video learning page to landing page', async ({ page }) => {
    await page.goto('/dashboard/skills/react/video/dQw4w9WgXcQ');
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Sign In with Google')).toBeVisible();
  });
});
