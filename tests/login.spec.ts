import { test, expect } from '@playwright/test';

test('admin login should redirect to jobs page', async ({ page }) => {
  await page.goto('http://localhost:4321/abcd/login');

  await page.getByRole('textbox', { name: '電子郵件' })
    .fill('admin@innodisk.com');

  await page.getByRole('textbox', { name: '密碼' })
    .fill('admin123');

  await page.getByRole('button', { name: '登入' })
    .click();

  await page.waitForURL(/jobs/);
  await expect(page.getByText('職缺管理新增職缺')).toBeVisible();
});

test('admin login fails with wrong password', async ({ page }) => {
  await page.goto('http://localhost:4321/abcd/login');

  await page.getByRole('textbox', { name: '電子郵件' }).fill('admin@innodisk.com');
  await page.getByRole('textbox', { name: '密碼' }).fill('wrongpassword123');
  await page.getByRole('button', { name: '登入' }).click();

  await page.waitForURL(/login/);
  await expect(page.getByText('電子郵件或密碼錯誤')).toBeVisible();
});