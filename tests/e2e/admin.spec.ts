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

test.describe('Admin Control Panels Security E2E', () => {
  test('should redirect unauthenticated users trying to access /dashboard/admin directly to landing page', async ({ page }) => {
    await page.goto('/dashboard/admin');

    // Edge middleware redirects unauthenticated users to landing
    await expect(page).toHaveURL('/');
    
    // Check that we see the landing page Google login prompt
    await expect(page.locator('text=Sign In with Google')).toBeVisible();
  });

  test('should redirect unauthenticated users trying to access /dashboard/admin/categories directly to landing page', async ({ page }) => {
    await page.goto('/dashboard/admin/categories');

    // Redirects unauthenticated users to landing
    await expect(page).toHaveURL('/');
  });

  test('should redirect unauthenticated users trying to access /dashboard/admin/skills directly to landing page', async ({ page }) => {
    await page.goto('/dashboard/admin/skills');

    // Redirects unauthenticated users to landing
    await expect(page).toHaveURL('/');
  });

  test('should redirect unauthenticated users trying to access /dashboard/admin/users directly to landing page', async ({ page }) => {
    await page.goto('/dashboard/admin/users');

    // Redirects unauthenticated users to landing
    await expect(page).toHaveURL('/');
  });

  test('should redirect authenticated learner from /dashboard/admin to /dashboard', async ({ page }) => {
    await setE2EUser(page, 'learner');
    await page.goto('/dashboard/admin');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Aspiration Workspace')).toBeVisible();
  });

  test('should allow authenticated admin access to /dashboard/admin and show management cards', async ({ page }) => {
    await setE2EUser(page, 'admin');
    await page.goto('/dashboard/admin');

    await expect(page).toHaveURL('/dashboard/admin');
    await expect(page.getByRole('heading', { name: 'Admin Control Center' })).toBeVisible();
    await expect(page.locator('text=Manage Categories')).toBeVisible();
    await expect(page.locator('text=Manage Skills')).toBeVisible();
  });

  test('should hide superAdmin-only user manager card for admin role', async ({ page }) => {
    await setE2EUser(page, 'admin');
    await page.goto('/dashboard/admin');

    await expect(page.locator('text=Role & Users Panel')).toHaveCount(0);
  });

  test('should show superAdmin-only user manager card for superAdmin role', async ({ page }) => {
    await setE2EUser(page, 'superAdmin');
    await page.goto('/dashboard/admin');

    await expect(page.locator('text=Role & Users Panel')).toBeVisible();
    await expect(page.locator('text=Open User Manager')).toBeVisible();
  });
});
