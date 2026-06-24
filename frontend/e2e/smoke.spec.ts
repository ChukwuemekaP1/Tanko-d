import { test, expect } from '@playwright/test';

test.describe('smoke', () => {
  test('marketing shell loads without server error', async ({ page }) => {
    const res = await page.goto('/menu');
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: 'TANKO' }).first()).toBeVisible();
  });

  test('connect entry page renders', async ({ page }) => {
    const res = await page.goto('/connect');
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: 'TANKO' })).toBeVisible();
  });

  test('dashboard guard: unauthenticated user is sent away from /dashboard', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/menu$/, { timeout: 30_000 });
    expect(page.url()).toMatch(/\/menu$/);
  });

  test('dashboard with localStorage wallet stub shows fleet shell', async ({ page }) => {
    const stellar =
      'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
    await page.addInitScript(
      ({ addr, role }: { addr: string; role: string }) => {
        window.localStorage.setItem('tanko_stellar_address', addr);
        window.localStorage.setItem('tanko_user_role', role);
      },
      { addr: stellar, role: 'JEFE' },
    );

    await page.goto('/dashboard');
    await expect(page.getByRole('link', { name: 'Overview' })).toBeVisible({ timeout: 30_000 });
  });
});
