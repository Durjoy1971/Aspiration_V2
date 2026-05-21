import { test, expect } from '@playwright/test';

async function setE2EUser(
  page: import('@playwright/test').Page,
  role: 'learner' | 'admin' | 'superAdmin'
) {
  const uid = `e2e-${role}`;
  await page.context().addCookies([
    {
      name: 'session-token',
      value: uid,
      domain: 'localhost',
      path: '/',
      sameSite: 'Lax',
      httpOnly: false,
      secure: false,
    },
  ]);

  await page.addInitScript((userRole) => {
    window.localStorage.setItem(
      '__e2eAuthUser',
      JSON.stringify({
        uid: `e2e-${userRole}`,
        email: `${userRole}@e2e.local`,
        displayName: `E2E ${userRole}`,
        role: userRole,
      })
    );
  }, role);
}

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

  test('should allow authenticated learner to access skill workspace', async ({ page }) => {
    await setE2EUser(page, 'learner');
    await page.goto('/dashboard/skills/e2e-skill');

    await expect(page).toHaveURL(/\/dashboard\/skills\/e2e-skill/);
    await expect(page.locator('text=Aspiration Console')).toBeVisible();
  });

  test('should allow authenticated learner to view skill videos', async ({ page }) => {
    await setE2EUser(page, 'learner');
    await page.goto('/dashboard/skills/e2e-skill');

    // Wait for skill workspace to load
    await expect(page.locator('text=Aspiration Console')).toBeVisible();

    // Check that videos are displayed (if any exist)
    const videoCards = page.locator('div[class*="aspect-video"]');
    const videoCount = await videoCards.count();
    
    // If videos exist, verify at least one is visible
    if (videoCount > 0) {
      await expect(videoCards.first()).toBeVisible();
    }
  });
});
