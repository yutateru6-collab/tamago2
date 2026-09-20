import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
test('return story exit and care menus stay fully visible on compact phones @live',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [width,height] of [[390,664],[320,568],[375,667]]){
  await page.setViewportSize({width,height});await page.goto('/?dev=1');
  await page.getByRole('button',{name:'検証をリセット',exact:true}).click();
  await page.getByRole('button',{name:'孵化',exact:true}).click();
  await page.getByRole('button',{name:'＋30分休息',exact:true}).click();
  await page.locator('#lcd').scrollIntoViewIfNeeded();
  const button=page.getByRole('button',{name:'また、あなたの時間へ',exact:true});
  const panel=await page.locator('#screen-panel').boundingBox();const box=await button.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.y+box.height).toBeLessThanOrEqual(panel.y+panel.height-2);
  const lcd=await page.locator('#lcd').boundingBox();
  for(const item of await page.locator('.menu-button').all()){
   const bounds=await item.boundingBox();
   expect(bounds.y).toBeGreaterThanOrEqual(lcd.y);
   expect(bounds.y+bounds.height).toBeLessThanOrEqual(lcd.y+lcd.height+1);
  }
  await mkdir('test-results/visual',{recursive:true});
  await page.screenshot({path:`test-results/visual/${info.project.name}-story-fit-${width}x${height}.png`,fullPage:true});
  await button.click();await expect(page.locator('#screen-panel')).toBeHidden();
 }
 expect(errors).toEqual([]);
});
