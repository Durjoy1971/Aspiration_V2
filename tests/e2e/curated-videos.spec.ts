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

test.describe('Curated Video Manager E2E', () => {
  test('should allow admin to open video manager modal for a skill', async ({ page }) => {
    await setE2EUser(page, 'admin');
    await page.goto('/dashboard/admin/skills');

    await expect(page.getByRole('heading', { name: 'Skill Control Panel' })).toBeVisible();

    // Find a skill and click "Manage Videos"
    const manageVideosButton = page.getByText('Manage Videos').first();
    await expect(manageVideosButton).toBeVisible();
    await manageVideosButton.click();

    // Verify modal opens
    await expect(page.getByText('Manage Curated Videos')).toBeVisible();
  });

  test('should allow admin to add a video ID to curated list', async ({ page }) => {
    await setE2EUser(page, 'admin');
    await page.goto('/dashboard/admin/skills');

    const manageVideosButton = page.getByText('Manage Videos').first();
    await manageVideosButton.click();

    // Add a video ID
    const videoIdInput = page.getByPlaceholder('e.g. dQw4w9WgXcQ');
    await videoIdInput.fill('testVideoId123');

    const addButton = page.getByText('Add');
    await addButton.click();

    // Verify video ID appears in list (may need to wait for Firestore update)
    await expect(page.getByText('testVideoId123')).toBeVisible({ timeout: 5000 });
  });

  test('should prevent adding duplicate video IDs', async ({ page }) => {
    await setE2EUser(page, 'admin');
    await page.goto('/dashboard/admin/skills');

    const manageVideosButton = page.getByText('Manage Videos').first();
    await manageVideosButton.click();

    const videoIdInput = page.getByPlaceholder('e.g. dQw4w9WgXcQ');
    await videoIdInput.fill('duplicateId123');

    const addButton = page.getByText('Add');
    await addButton.click();

    // Try to add the same ID again
    await videoIdInput.fill('duplicateId123');
    await addButton.click();

    // Should show error message
    await expect(page.getByText(/already in the curated list/)).toBeVisible();
  });

  test('should allow admin to remove a video ID from curated list', async ({ page }) => {
    await setE2EUser(page, 'admin');
    await page.goto('/dashboard/admin/skills');

    const manageVideosButton = page.getByText('Manage Videos').first();
    await manageVideosButton.click();

    // Add a video ID first
    const videoIdInput = page.getByPlaceholder('e.g. dQw4w9WgXcQ');
    await videoIdInput.fill('toBeRemoved123');
    await page.getByText('Add').click();
    await expect(page.getByText('toBeRemoved123')).toBeVisible({ timeout: 5000 });

    // Remove it
    const removeButton = page.getByText('Remove').first();
    await removeButton.click();

    // Verify it's gone
    await expect(page.getByText('toBeRemoved123')).not.toBeVisible({ timeout: 5000 });
  });

  test('should allow admin to reorder video IDs with up/down buttons', async ({ page }) => {
    await setE2EUser(page, 'admin');
    await page.goto('/dashboard/admin/skills');

    const manageVideosButton = page.getByText('Manage Videos').first();
    await manageVideosButton.click();

    // Add two video IDs
    const videoIdInput = page.getByPlaceholder('e.g. dQw4w9WgXcQ');
    await videoIdInput.fill('videoA');
    await page.getByText('Add').click();
    await expect(page.getByText('videoA')).toBeVisible({ timeout: 5000 });

    await videoIdInput.fill('videoB');
    await page.getByText('Add').click();
    await expect(page.getByText('videoB')).toBeVisible({ timeout: 5000 });

    // Move videoB up (should swap with videoA)
    const videoBRow = page.getByText('videoB').locator('..');
    const upButton = videoBRow.getByTitle('Move up');
    await upButton.click();

    // Verify order changed (videoB should now be at position 1)
    await expect(page.locator('text=videoB').locator('..').getByText('Position 1')).toBeVisible();
  });

  test('should allow admin to preview skill as learner from video manager', async ({ page }) => {
    await setE2EUser(page, 'admin');
    await page.goto('/dashboard/admin/skills');

    const manageVideosButton = page.getByText('Manage Videos').first();
    await manageVideosButton.click();

    // Click preview button
    const previewButton = page.getByText('👁️ Preview as Learner');
    await previewButton.click();

    // Should navigate to learner skill page
    await expect(page).toHaveURL(/\/dashboard\/skills\/.+/);
    await expect(page.getByText('Curriculum Tutorials')).toBeVisible();
  });

  test('should close video manager modal when clicking Done', async ({ page }) => {
    await setE2EUser(page, 'admin');
    await page.goto('/dashboard/admin/skills');

    const manageVideosButton = page.getByText('Manage Videos').first();
    await manageVideosButton.click();

    await expect(page.getByText('Manage Curated Videos')).toBeVisible();

    // Click Done
    const doneButton = page.getByText('Done');
    await doneButton.click();

    // Modal should be closed
    await expect(page.getByText('Manage Curated Videos')).not.toBeVisible();
  });

  test('should display curated videos on learner skill page', async ({ page }) => {
    await setE2EUser(page, 'admin');
    await page.goto('/dashboard/admin/skills');

    const manageVideosButton = page.getByText('Manage Videos').first();
    await manageVideosButton.click();

    // Add a real YouTube video ID
    const videoIdInput = page.getByPlaceholder('e.g. dQw4w9WgXcQ');
    await videoIdInput.fill('dQw4w9WgXcQ');
    await page.getByText('Add').click();
    await expect(page.getByText('dQw4w9WgXcQ')).toBeVisible({ timeout: 5000 });

    // Preview as learner
    await page.getByText('👁️ Preview as Learner').click();
    await expect(page).toHaveURL(/\/dashboard\/skills\/.+/);

    // Verify videos are displayed on learner page
    await expect(page.getByText('Curriculum Tutorials')).toBeVisible();
    // Video cards should be visible
    await expect(page.locator('[data-testid="video-card"]').first()).toBeVisible({ timeout: 5000 });
  });
});
