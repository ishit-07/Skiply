import { test, expect } from '@playwright/test';

test('basic browser smoke test', async ({ page }) => {
  await page.setContent('<html><body><h1>Skiply smoke test</h1></body></html>');
  await expect(page.locator('h1')).toHaveText('Skiply smoke test');
});
