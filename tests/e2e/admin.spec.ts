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

  test('should allow admin to create a category', async ({ page }) => {
    await setE2EUser(page, 'admin');
    await page.goto('/dashboard/admin/categories');

    // Fill in category form
    await page.fill('input[placeholder="e.g. frontend"]', 'e2e-test-category');
    await page.fill('input[placeholder="e.g. Frontend Development"]', 'E2E Test Category');
    await page.fill('textarea[placeholder="Brief description of this learning pathway..."]', 'Test category for E2E');
    await page.fill('input[type="number"]', '1');

    // Submit form
    await page.click('button:has-text("Save Category")');

    // Wait for success message
    await expect(page.locator('text=Category created successfully!')).toBeVisible();
  });

  test('should allow admin to create a skill', async ({ page }) => {
    await setE2EUser(page, 'admin');
    await page.goto('/dashboard/admin/skills');

    // Select category (assuming there's at least one)
    const categorySelect = page.locator('select').first();
    const optionCount = await categorySelect.locator('option').count();
    if (optionCount > 0) {
      await categorySelect.selectOption({ index: 0 });

      // Fill in skill form
      await page.fill('input[placeholder="e.g. react-basics"]', 'e2e-test-skill');
      await page.fill('input[placeholder="e.g. React Fundamentals"]', 'E2E Test Skill');
      await page.fill('textarea[placeholder="Core concepts details..."]', 'Test skill for E2E');
      await page.fill('input[placeholder="e.g. react, components, hooks"]', 'e2e,test,skill');
      await page.fill('input[type="number"]', '1');

      // Submit form
      await page.click('button:has-text("Save Skill")');

      // Wait for success message
      await expect(page.locator('text=Skill created successfully!')).toBeVisible();
    }
  });
});
