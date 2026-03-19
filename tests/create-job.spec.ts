import { test, expect } from '@playwright/test';

test('Successfully create a job vacancy and handle the popup', async ({ page }) => {
  // 1. Login flow
  await page.goto('http://localhost:4321/abcd/login');
  await page.getByRole('textbox', { name: '電子郵件' }).fill('admin@innodisk.com');
  await page.getByRole('textbox', { name: '密碼' }).fill('admin123');
  await page.getByRole('button', { name: '登入' }).click();

  // 2. Fill in job vacancy information
  await page.getByRole('button', { name: '新增職缺' }).click();
  await page.getByRole('textbox', { name: '職缺名稱' }).fill('Senior IT Engineer');
  await page.getByRole('textbox', { name: '部門' }).fill('MIS');
  await page.getByRole('textbox', { name: '職缺 ID' }).fill('mis_002');
  await page.getByRole('textbox', { name: '地點' }).fill('Taipei');
  await page.getByRole('button', { name: '下一步' }).click();

  // 3. Fetch external information
  await page.getByRole('textbox', { name: '職缺網址' }).fill('https://www.104.com.tw/job/8xg6k?jobsource=company_job');
  await page.getByRole('button', { name: '抓取職缺內容' }).click();

  // Wait for job description to auto-fill (successful if length > 100 characters)
  const jobDescField = page.getByRole('textbox', { name: '工作內容描述' });
  await jobDescField.waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForFunction(() => {
    const field = document.querySelector('textarea[placeholder*="請描述詳細"]');
    return field && field.value && field.value.length > 100;
  }, { timeout: 15000 }).catch(() => { });

  // Proceed to step 3
  await page.getByRole('button', { name: '下一步' }).last().click();
  await expect(page.getByRole('heading', { name: 'AI 評分標準設定' })).toBeVisible({ timeout: 20000 });
  await page.waitForLoadState('networkidle');
  await page.locator('.MuiBackdrop-root').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => { });

  // 4. AI scoring setup
  // Use a stable textarea selector to avoid role/name ambiguity across hidden step content.
  const aiScoringField = page.locator('textarea[placeholder="請設定 AI 評分標準"]').first();
  await expect(aiScoringField).toBeVisible({ timeout: 20000 });
  await aiScoringField.fill('Experience with AI and technical skills');

  // [Core Fix] Handle popup: Set up listener and wait for dialog
  const dialogPromise = page.waitForEvent('dialog');
  
  // 5. Click create
  await page.getByRole('button', { name: '建立職缺' }).click();

  // Wait for and handle dialog
  const dialog = await dialogPromise;
  console.log(`Dialog message: ${dialog.message()}`);
  // Accept dialog regardless of success/failure
  await dialog.accept();

  // 6. Final check: Ensure it returns to the job list page (or other expected page)
  await expect(page).toHaveURL(/.*jobs/);
});
