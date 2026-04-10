import { test, expect } from '@playwright/test';

test('Successfully create a job vacancy and handle the popup', async ({ page }) => {
  const humanType = async (locator: ReturnType<typeof page.getByRole>, value: string) => {
    await locator.click();
    await locator.pressSequentially(value, { delay: 80 });
  };

  const humanPause = async (ms = 400) => {
    await page.waitForTimeout(ms);
  };

  // Avoid duplicate "職缺 ID" collisions across repeated runs.
  const unique = Date.now().toString().slice(-6);
  const jobName = `Senior IT Engineer ${unique}`;
  const jobId = `mis_${unique}`;

  // 1. Login flow
  await page.goto('http://localhost:4321/abcd/login');
  await humanType(page.getByRole('textbox', { name: '電子郵件' }), 'admin@innodisk.com');
  await humanPause();
  await humanType(page.getByRole('textbox', { name: '密碼' }), 'admin123');
  await humanPause();
  await page.getByRole('button', { name: '登入' }).click();
  await humanPause(700);

  // 2. Fill in job vacancy information
  await page.getByRole('button', { name: '新增職缺' }).click();
  await humanPause(500);
  await humanType(page.getByRole('textbox', { name: '職缺名稱' }), jobName);
  await humanPause();
  await humanType(page.getByRole('textbox', { name: '部門' }), 'MIS');
  await humanPause();
  await humanType(page.getByRole('textbox', { name: '職缺 ID' }), jobId);
  await humanPause();
  await humanType(page.getByRole('textbox', { name: '地點' }), 'Taipei');
  await humanPause(600);
  await page.getByRole('button', { name: '下一步' }).click();
  await humanPause(700);

  // 3. Fetch external information
  await humanType(page.getByRole('textbox', { name: '職缺網址' }), 'https://www.104.com.tw/job/8xg6k?jobsource=company_job');
  await humanPause(700);
  const fetchButton = page.getByRole('button', { name: '抓取職缺內容' });
  await fetchButton.click();

  // Wait until the fetch action finishes before proceeding.
  const fetchingButton = page.getByRole('button', { name: '抓取中...' });
  await expect(fetchingButton).toBeVisible({ timeout: 10000 });
  await expect(fetchingButton).toBeHidden({ timeout: 30000 });
  await expect(fetchButton).toBeVisible({ timeout: 30000 });

  // Wait for job description to become usable after the fetch completes.
  const jobDescField = page.getByRole('textbox', { name: '工作內容描述' });
  await jobDescField.waitFor({ state: 'visible', timeout: 30000 });
  await expect(jobDescField).toBeEnabled({ timeout: 30000 });
  await page.waitForFunction(() => {
    const field = document.querySelector('textarea[placeholder*="請描述詳細"]') as HTMLTextAreaElement | null;
    return !!field && field.value.length > 100;
  }, { timeout: 30000 });

  // Proceed to step 3
  await humanPause(800);
  await page.getByRole('button', { name: '下一步' }).last().click();
  await expect(page.getByRole('heading', { name: 'AI 評分標準設定' })).toBeVisible({ timeout: 20000 });
  await page.waitForLoadState('networkidle');
  await page.locator('.MuiBackdrop-root').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => { });

  // 4. AI scoring setup
  // Use a stable textarea selector to avoid role/name ambiguity across hidden step content.
  const aiScoringField = page.locator('textarea[placeholder="請設定 AI 評分標準"]').first();
  await expect(aiScoringField).toBeVisible({ timeout: 20000 });
  await aiScoringField.click();
  await aiScoringField.pressSequentially('Experience with AI and technical skills', { delay: 70 });
  await humanPause(800);

  // Treat the dialog text as part of the contract so create failures do not pass silently.
  const dialogPromise = page.waitForEvent('dialog');
  
  // 5. Click create
  await page.getByRole('button', { name: '建立職缺' }).click();

  // Wait for and handle dialog
  const dialog = await dialogPromise;
  const dialogMessage = dialog.message();
  console.log(`Dialog message: ${dialogMessage}`);
  await dialog.accept();
  expect(dialogMessage).toContain('已建立');

  // 6. Final check: Ensure it returns to the job list page (or other expected page)
  await expect(page).toHaveURL(/.*jobs/);
});
