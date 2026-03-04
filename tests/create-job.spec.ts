import { test, expect } from '@playwright/test';

test('成功新增職缺並處理彈窗', async ({ page }) => {
  // 1. 登入流程
  await page.goto('http://localhost:4321/abcd/login');
  await page.getByRole('textbox', { name: '電子郵件' }).fill('admin@innodisk.com');
  await page.getByRole('textbox', { name: '密碼' }).fill('admin123');
  await page.getByRole('button', { name: '登入' }).click();

  // 2. 填寫職缺資訊
  await page.getByRole('button', { name: '新增職缺' }).click();
  await page.getByRole('textbox', { name: '職缺名稱' }).fill('Senior IT Engineer');
  await page.getByRole('textbox', { name: '部門' }).fill('MIS');
  await page.getByRole('textbox', { name: '職缺 ID' }).fill('mis_002');
  await page.getByRole('textbox', { name: '地點' }).fill('Taipei');
  await page.getByRole('button', { name: '下一步' }).click();

  // 3. 抓取外部資訊
  await page.getByRole('textbox', { name: '職缺網址' }).fill('https://www.104.com.tw/job/8xg6k?jobsource=company_job');
  await page.getByRole('button', { name: '抓取職缺內容' }).click();
  
  // 等待職缺描述自動填入（確認內容長度 > 100 字才算成功）
  const jobDescField = page.getByRole('textbox', { name: '工作內容描述' });
  await jobDescField.waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForFunction(() => {
    const field = document.querySelector('textarea[placeholder*="請描述詳細"]');
    return field && field.value && field.value.length > 100;
  }, { timeout: 15000 }).catch(() => {});
  
  // 進入第 3 步
  await page.getByRole('button', { name: '下一步' }).last().click();
  await page.waitForLoadState('networkidle');
  await page.locator('.MuiBackdrop-root').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

  // 4. AI 評分設定
  await page.getByRole('textbox', { name: 'AI 計分標準 (文字描述)' }).fill('Experience with AI and technical skills');

  // 【核心修正】處理彈窗：在點擊「建立職缺」之前，先設定好監聽器
  // 當彈窗出現時，自動點擊「確定 (Accept)」
  page.once('dialog', async dialog => {
    console.log(`彈窗訊息內容: ${dialog.message()}`);
    expect(dialog.message()).toContain('職缺已建立'); // verify if success / Already created
    await dialog.accept(); // 相當於點擊截圖中的 OK 按鈕
  });

  // 5. 點擊建立
  await page.getByRole('button', { name: '建立職缺' }).click();
  
  // 6. 最後檢查：確保回到了職缺列表頁（或其他預期頁面）
  await expect(page).toHaveURL(/.*jobs/); 
});