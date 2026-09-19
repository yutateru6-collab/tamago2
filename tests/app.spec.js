import { test, expect } from '@playwright/test';

test('initial soft-pixel home fits phone and is intentionally sparse',async({page},info)=>{
  await page.goto('/');
  await expect(page.getByText('SOFT PIXEL TAMAGO')).toBeVisible();
  await expect(page.locator('.sprite-stage svg')).toBeVisible();
  await expect(page.locator('.room')).toHaveAttribute('data-stage','0');
  await expect(page.locator('.decor:visible')).toHaveCount(0);
  await page.screenshot({path:`test-results/visual/${info.project.name}-home-initial.png`,fullPage:true});
});

test('thirty minute confirmations grow the room and persist',async({page},info)=>{
  await page.goto('/?dev=1');
  for(let i=1;i<=3;i++){
    await page.getByRole('button',{name:'30分、スマホを置く'}).click();
    await page.getByRole('button',{name:'30分経過させる'}).click();
    await page.getByRole('button',{name:'30分、休めた'}).click();
    await expect(page.locator('.room')).toHaveAttribute('data-stage',String(i));
  }
  await expect(page.locator('.lamp')).toBeVisible();
  await expect(page.locator('.shelf')).toBeVisible();
  await expect(page.locator('.plant')).toBeVisible();
  await page.reload();
  await expect(page.locator('.room')).toHaveAttribute('data-stage','3');
  await page.screenshot({path:`test-results/visual/${info.project.name}-home-grown.png`,fullPage:true});
});

test('five sprite states reuse one lightweight character system',async({page},info)=>{
  await page.goto('/?dev=1');
  for(const state of ['idle','blink','happy','tired','craft']){
    await page.getByRole('button',{name:state,exact:true}).click();
    await expect(page.locator('.room')).toHaveAttribute('data-state',state);
    await page.screenshot({path:`test-results/visual/${info.project.name}-state-${state}.png`});
  }
});

test('manual overuse makes the character tired without pretending to detect phone usage',async({page})=>{
  await page.goto('/');
  page.on('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'今日は見すぎた（自己申告）'}).click();
  await expect(page.locator('.room')).toHaveAttribute('data-state','tired');
  await expect(page.locator('[data-stat="vitality"]')).toHaveText('52/100');
  await expect(page.getByText(/Web版は他アプリの使用を検知しません/)).toBeVisible();
});