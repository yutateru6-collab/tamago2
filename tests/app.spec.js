import { test, expect } from '@playwright/test';

test('first view explains the concept and starts from an egg', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /スマホを置くほど/ })).toBeVisible();
  await expect(page.getByText('↑ 進化', { exact: true })).toBeVisible();
  await expect(page.getByText('↓ 退化', { exact: true })).toBeVisible();
  await expect(page.locator('.toy-shell')).toBeVisible();
  await expect(page.locator('.lcd')).toHaveAttribute('data-life', 'egg');
  await expect(page.getByRole('button', { name: /30分、スマホを置く/ })).toBeVisible();
  await page.screenshot({ path: `test-results/visual/${info.project.name}-01-egg-home.png`, fullPage: true });
});

test('thirty minutes of rest evolves the pet', async ({ page }, info) => {
  await page.goto('/?dev=1');
  await page.getByRole('button', { name: '孵化' }).click();
  await expect(page.locator('.lcd')).toHaveAttribute('data-life', 'pet');
  await expect(page.getByText('FORM 1', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '+30分休息' }).click();
  await expect(page.getByText('FORM 2', { exact: true })).toBeVisible();
  await page.screenshot({ path: `test-results/visual/${info.project.name}-02-evolved.png`, fullPage: true });
});

test('simulated heavy screen use causes waste sickness and degeneration', async ({ page }, info) => {
  await page.goto('/?dev=1');
  await page.getByRole('button', { name: '孵化' }).click();
  await page.getByRole('button', { name: '+30分休息' }).click();
  await expect(page.getByText('FORM 2', { exact: true })).toBeVisible();

  for (let i = 0; i < 6; i += 1) {
    await page.getByRole('button', { name: '+30分使用' }).click();
  }

  await expect(page.getByText('FORM 1', { exact: true })).toBeVisible();
  await expect(page.locator('.poop-svg')).toHaveCount(4);
  await expect(page.locator('.lcd')).toHaveAttribute('data-condition', 'びょうき');
  await page.screenshot({ path: `test-results/visual/${info.project.name}-03-sick-dirty.png`, fullPage: true });
});

test('clean action removes waste without requiring a long interaction', async ({ page }) => {
  await page.goto('/?dev=1');
  await page.getByRole('button', { name: '孵化' }).click();
  await page.getByRole('button', { name: 'うんち+1' }).click();
  await expect(page.locator('.poop-svg')).toHaveCount(1);
  await page.getByRole('button', { name: '全部きれい' }).click();
  await expect(page.locator('.poop-svg')).toHaveCount(0);
  await expect(page.getByText('きれい', { exact: true })).toBeVisible();
});

test('death state has a restart path', async ({ page }, info) => {
  await page.goto('/?dev=1');
  await page.getByRole('button', { name: '力尽きる' }).click();
  await expect(page.locator('.lcd')).toHaveAttribute('data-life', 'dead');
  await expect(page.getByRole('button', { name: '新しいたまごから始める' })).toBeVisible();
  await page.screenshot({ path: `test-results/visual/${info.project.name}-04-dead.png`, fullPage: true });
  await page.getByRole('button', { name: '新しいたまごから始める' }).click();
  await expect(page.locator('.lcd')).toHaveAttribute('data-life', 'egg');
});

test('web limitation is stated explicitly rather than pretending to read iPhone screen time', async ({ page }) => {
  await page.goto('/');
  await page.getByText('この試作で計測できる範囲').click();
  await expect(page.getByText(/Web版はiPhone全体のスクリーンタイムを読み取れません/)).toBeVisible();
});
