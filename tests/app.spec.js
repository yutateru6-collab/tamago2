import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
let errors;
test.beforeEach(async({page})=>{errors=[];page.on('pageerror',e=>errors.push(e.message));});
test.afterEach(async()=>{expect(errors).toEqual([]);});
async function go(page,dev=true){await page.goto(dev?'/?dev=1':'/');if(dev){await page.getByRole('button',{name:'孵化',exact:true}).click();} }
async function settled(page){await expect(page.locator('#lcd')).toHaveAttribute('data-motion','',{timeout:5000});}
async function shot(page,info,name){await mkdir('test-results/visual',{recursive:true});await page.screenshot({path:`test-results/visual/${info.project.name}-${name}.png`,fullPage:true});}
const snap=page=>page.evaluate(()=>window.tamagoTest.snapshot());

test('home: eight named care menus, three real buttons and phone fit @live',async({page},info)=>{
  await go(page,false);
  for(const label of ['ごはん','トイレ','くすり','でんき','あそぶ','ようす','やくそく','ひと休み']) await expect(page.getByRole('button',{name:label,exact:true})).toBeVisible();
  for(const label of ['A 選ぶ','B 決定','C 戻る']) await expect(page.getByRole('button',{name:label})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  for(const b of await page.locator('.menu-button,.hardware button').all()){const box=await b.boundingBox();expect(box.height).toBeGreaterThanOrEqual(44);}
  await expect(page.locator('#lcd')).toHaveAttribute('data-life','egg');
  await shot(page,info,'01-home-egg');
});
test('egg automatically hatches without debug',async({page},info)=>{await go(page,false);await expect(page.locator('#lcd')).toHaveAttribute('data-life','pet',{timeout:10000});await settled(page);await shot(page,info,'02-hatched');});
test('food: real hunger restoration and eating motion @live',async({page},info)=>{
  await go(page);await page.getByRole('button',{name:'空腹にする'}).click();const before=(await snap(page)).hunger;
  await page.getByRole('button',{name:'ごはん',exact:true}).click();
  await page.locator('#screen-panel').getByRole('button',{name:'ごはん',exact:true}).click();
  await expect(page.locator('#lcd')).toHaveAttribute('data-motion','meal');
  expect((await snap(page)).hunger).toBeGreaterThan(before+27);
  await page.locator('.device').scrollIntoViewIfNeeded();await shot(page,info,'03-eating');
});
test('snack submenu can be selected with hardware A and B',async({page})=>{
  await go(page);await page.getByRole('button',{name:'A 選ぶ'}).click();await page.getByRole('button',{name:'B 決定'}).click();
  await expect(page.locator('#scene')).toHaveAttribute('data-panel','food');
  await page.getByRole('button',{name:'A 選ぶ'}).click();await page.getByRole('button',{name:'B 決定'}).click();
  await expect(page.locator('#lcd')).toHaveAttribute('data-motion','snack');expect((await snap(page)).snackCount).toBe(1);
});
test('toilet: A selects and B flushes actual waste @live',async({page},info)=>{
  await go(page);await page.getByRole('button',{name:'うんち＋1'}).click();
  await expect(page.locator('.poop')).toHaveCount(1);
  await page.getByRole('button',{name:'A 選ぶ'}).click();await page.getByRole('button',{name:'A 選ぶ'}).click();await page.getByRole('button',{name:'B 決定'}).click();
  await expect(page.locator('.poop')).toHaveCount(0);await expect(page.locator('#lcd')).toHaveAttribute('data-motion','toilet');
  expect((await snap(page)).clean).toBe(100);await shot(page,info,'04-toilet');
});
test('medicine cures illness through the actual menu @live',async({page},info)=>{
  await go(page);await page.getByRole('button',{name:'病気にする'}).click();
  await expect(page.locator('#lcd')).toHaveAttribute('data-sick','true');
  await page.getByRole('button',{name:'くすり',exact:true}).click();
  await expect(page.locator('#lcd')).toHaveAttribute('data-sick','false');
  expect((await snap(page)).health).toBeGreaterThan(49);await shot(page,info,'05-medicine');
});
test('light switches sleep and wake, with a visible sleeping character @live',async({page},info)=>{
  await go(page);await page.getByRole('button',{name:'でんき',exact:true}).click();await expect(page.locator('#lcd')).toHaveAttribute('data-sleeping','true');
  await expect(page.locator('.sleep-z')).toBeVisible();await shot(page,info,'06-sleep');
  await page.getByRole('button',{name:'ごはん',exact:true}).click();await expect(page.locator('#lcd-message')).toContainText('でんき');
  await page.getByRole('button',{name:'でんき',exact:true}).click();await expect(page.locator('#lcd')).toHaveAttribute('data-sleeping','false');
});
test('status has sixteen heart glyphs and C returns to the moving pet',async({page},info)=>{
  await go(page);await page.getByRole('button',{name:'ようす',exact:true}).click();await expect(page.locator('.status-row')).toHaveCount(4);await expect(page.locator('.hearts svg')).toHaveCount(16);await shot(page,info,'07-status');
  await page.getByRole('button',{name:'B 決定'}).click();await expect(page.locator('#screen-panel')).toContainText('きろく');
  await page.getByRole('button',{name:'C 戻る'}).click();await expect(page.locator('#screen-panel')).toBeHidden();
});
test('game choice produces a result and changes happiness',async({page})=>{
  await go(page);const before=(await snap(page)).happy;await page.getByRole('button',{name:'あそぶ',exact:true}).click();await page.locator('#screen-panel').getByRole('button',{name:'ひだり',exact:false}).click();expect((await snap(page)).happy).toBeGreaterThan(before+6);await expect(page.locator('#lcd')).toHaveAttribute('data-motion','play');
});
test('multiple rests create an adult; screen use can degenerate it',async({page},info)=>{
  await go(page);for(let i=0;i<6;i++)await page.getByRole('button',{name:'＋30分休息'}).click();await page.getByRole('button',{name:'C 戻る'}).click();await expect(page.locator('#lcd')).toHaveAttribute('data-form','4');await settled(page);await shot(page,info,'08-adult');
  for(let i=0;i<3;i++)await page.getByRole('button',{name:'＋60分使用'}).click();expect((await snap(page)).form).toBeLessThan(4);
});
test('waste accumulation visibly causes illness',async({page},info)=>{
  await go(page);for(let i=0;i<3;i++)await page.getByRole('button',{name:'うんち＋1'}).click();await expect(page.locator('.poop')).toHaveCount(3);await expect(page.locator('#lcd')).toHaveAttribute('data-sick','true');await expect(page.locator('#illness-icon')).toBeVisible();await shot(page,info,'09-sick-dirty');
});
test('death is not a debug-only label and starts a new generation',async({page},info)=>{
  await go(page);await page.evaluate(()=>window.tamagoTest.advance(1000,'screen'));await expect(page.locator('#lcd')).toHaveAttribute('data-life','dead');await shot(page,info,'10-goodbye');
  await page.getByRole('button',{name:'新しいたまごを迎える'}).click();await page.locator('#screen-panel').getByRole('button',{name:'迎える',exact:true}).click();await expect(page.locator('#lcd')).toHaveAttribute('data-life','egg');expect((await snap(page)).generation).toBe(2);
});
test('care state persists after reload',async({page})=>{
  await go(page);await page.getByRole('button',{name:'うんち＋1'}).click();await page.reload();await expect(page.locator('.poop')).toHaveCount(1);await expect(page.locator('#lcd')).toHaveAttribute('data-life','pet');
});
test('developer death does not contaminate normal user save',async({page})=>{
  await go(page);await page.getByRole('button',{name:'お別れを確認'}).click();await expect(page.locator('#lcd')).toHaveAttribute('data-life','dead');await page.goto('/');await expect(page.locator('#lcd')).toHaveAttribute('data-life','egg');expect(await page.evaluate(()=>typeof window.tamagoTest)).toBe('undefined');
});
test('rest requires honest explicit confirmation, never elapsed time alone @live',async({page})=>{
  await go(page);await page.getByRole('button',{name:'30分、スマホを置く',exact:false}).click();await page.evaluate(()=>window.tamagoTest.readyRest());expect((await snap(page)).restMinutes).toBe(0);
  await page.reload();await page.getByRole('button',{name:'休めたか確認する',exact:false}).click();
  await page.locator('#screen-panel').getByRole('button',{name:'置けた',exact:true}).click();expect((await snap(page)).restMinutes).toBe(30);expect((await snap(page)).rest).toBe(null);
});
test('unsuccessful rest and cancel do not grant rewards',async({page})=>{
  await go(page);await page.getByRole('button',{name:'30分、スマホを置く',exact:false}).click();await page.evaluate(()=>window.tamagoTest.readyRest());await page.locator('#screen-panel').getByRole('button',{name:'置けなかった',exact:true}).click();expect((await snap(page)).restMinutes).toBe(0);expect((await snap(page)).rest).toBe(null);
});
test('animation advances and does not rebuild the whole character DOM @live',async({page})=>{
  await go(page);await page.locator('.device').scrollIntoViewIfNeeded();
  await page.evaluate(()=>{window.savedPet=document.querySelector('#pet-body svg');});
  const values=[];for(let i=0;i<5;i++){values.push(await page.locator('.foot-left').evaluate(el=>getComputedStyle(el).transform));await page.waitForTimeout(220);}
  expect(new Set(values).size).toBeGreaterThan(1);expect(await page.evaluate(()=>window.savedPet===document.querySelector('#pet-body svg'))).toBe(true);
  await page.locator('.eyes-open').evaluate(el=>{for(const a of el.getAnimations()){a.pause();a.currentTime=5500;}});await expect(page.locator('.eyes-open')).toHaveCSS('opacity','0');
});
test('opening food panel remains stable across timer ticks',async({page})=>{
  await go(page);await page.getByRole('button',{name:'ごはん',exact:true}).click();await page.evaluate(()=>window.savedChoice=document.querySelector('[data-choice="meal"]'));await page.waitForTimeout(1300);expect(await page.evaluate(()=>window.savedChoice===document.querySelector('[data-choice="meal"]'))).toBe(true);
});
test('help explains limits and storage failure is visible',async({page})=>{
  await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new Error('blocked');};});await go(page,false);await expect(page.locator('#save-warning')).toBeVisible();await page.getByRole('button',{name:'遊び方と計測の説明'}).click();await expect(page.locator('#help-dialog')).toBeVisible();await expect(page.locator('#help-dialog')).toContainText('他アプリ');await page.getByRole('button',{name:'わかった',exact:true}).click();await expect(page.locator('#help-dialog')).not.toBeVisible();
});
test('320px phone still fits without horizontal overflow',async({page},info)=>{await page.setViewportSize({width:320,height:740});await go(page,false);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await shot(page,info,'11-small-phone');});

test('fullscreen removes egg case and uses the available phone viewport @live',async({page},info)=>{
  await go(page,false);await expect(page).toHaveTitle(/ひといき/);
  await expect(page.locator('.shell-ring,.device-logo,.shell-star')).toHaveCount(0);
  const box=await page.locator('#lcd').boundingBox();expect(box.width).toBe(390);
  expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1)).toBe(true);
  await expect(page.getByRole('button',{name:'ひと休み',exact:true})).toHaveAttribute('aria-pressed','true');
  await shot(page,info,'12-fullscreen');
});
test('promise offers 15/30/60 and intents, persists, and A/B still work @live',async({page},info)=>{
  await go(page);await page.getByRole('button',{name:'やくそく',exact:true}).click();
  await page.getByRole('button',{name:'15分',exact:true}).click();
  await page.getByRole('button',{name:'本を読む',exact:true}).click();await shot(page,info,'13-promise');
  await page.getByRole('button',{name:'C 戻る'}).click();
  await expect(page.locator('#rest-button')).toContainText('15分');await page.reload();
  expect((await snap(page)).journey.promise).toEqual({minutes:15,intent:'read'});
  await page.getByRole('button',{name:'やくそく',exact:true}).click();
  await page.getByRole('button',{name:'A 選ぶ'}).click();await page.getByRole('button',{name:'B 決定'}).click();
  expect((await snap(page)).journey.promise.minutes).toBe(30);
});
test('returning from rest shows a single truthful memory and durable room detail @live',async({page},info)=>{
  await go(page);await page.getByRole('button',{name:'やくそく',exact:true}).click();await page.getByRole('button',{name:'15分',exact:true}).click();await page.getByRole('button',{name:'本を読む',exact:true}).click();
  await page.locator('#rest-button').click();expect((await snap(page)).rest.minutes).toBe(15);await expect(page.locator('#rest-clock')).toBeVisible();await shot(page,info,'14-leave');
  await page.evaluate(()=>window.tamagoTest.readyRest());await page.getByRole('button',{name:'置けた',exact:true}).click();
  await expect(page.locator('.memory-card')).toContainText('窓をあけて、深呼吸。');await expect(page.locator('.memory-card')).toContainText('自己申告');await shot(page,info,'15-return-memory');
  expect((await snap(page)).restMinutes).toBe(15);expect((await snap(page)).journey.memories).toHaveLength(1);
  await page.reload();await expect(page.locator('.memory-card')).toBeVisible();
  await page.getByRole('button',{name:'また、あなたの時間へ'}).click();await expect(page.locator('.room-window')).toBeVisible();
  await page.getByRole('button',{name:/暮らしの記録/}).click();await expect(page.locator('#journal-list li')).toHaveCount(1);await shot(page,info,'16-journal');
  await page.getByRole('button',{name:'記録を閉じる'}).click();await page.reload();await expect(page.locator('.memory-card')).toHaveCount(0);
});
test('C returns from timer without cancelling; explicit cancel gives no reward',async({page})=>{
 await go(page);await page.locator('#rest-button').click();const old=(await snap(page)).rest.readyAt;
 await page.getByRole('button',{name:'C 戻る'}).click();expect((await snap(page)).rest.readyAt).toBe(old);
 await page.getByRole('button',{name:'やくそく',exact:true}).click();await page.getByRole('button',{name:'60分',exact:true}).click();expect((await snap(page)).rest.readyAt).toBe(old);
 await page.locator('#rest-button').click();await page.getByRole('button',{name:'今回はやめる',exact:true}).click();expect((await snap(page)).rest).toBe(null);expect((await snap(page)).journey.memories).toHaveLength(0);
});
test('ordinary care hands back user time but cannot farm story milestones',async({page})=>{
 await go(page);await page.getByRole('button',{name:'空腹にする'}).click();await page.getByRole('button',{name:'ごはん',exact:true}).click();await page.locator('#screen-panel').getByRole('button',{name:'ごはん',exact:true}).click();
 await expect(page.locator('#lcd-message')).toContainText('あなたの時間');expect((await snap(page)).journey.completed).toBe(0);
});
test('absence alone cannot create illness or dirty room',async({page})=>{
 await go(page);const before=await snap(page);await page.evaluate(()=>window.tamagoTest.advance(10000,'offline'));const after=await snap(page);
 expect(after.poops).toBe(before.poops);expect(after.sick).toBe(before.sick);expect(after.health).toBe(before.health);expect(after.journey.memories).toHaveLength(0);
});
test('six rests make self-directed life and room changes visible',async({page},info)=>{
 await go(page);for(let i=0;i<6;i++)await page.getByRole('button',{name:'＋30分休息'}).click();await page.getByRole('button',{name:'C 戻る'}).click();await settled(page);
 await expect(page.locator('#living-items')).toHaveAttribute('data-unlocked','6');await expect(page.locator('.room-plant')).toBeVisible();await expect(page.locator('.room-book')).toBeVisible();await shot(page,info,'17-independent-life');
});
test('landscape has no clipped main controls and no horizontal overflow',async({page},info)=>{
 await page.setViewportSize({width:844,height:390});await go(page);await page.locator('#rest-button').scrollIntoViewIfNeeded();await expect(page.locator('#rest-button')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await shot(page,info,'18-landscape');
});
test('reduced motion preference stops animation without hiding the pet',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await go(page);await expect(page.locator('#pet-body svg')).toBeVisible();await expect(page.locator('#pet-position')).toHaveCSS('animation-name','none');
});
