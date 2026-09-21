import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium,webkit} from '@playwright/test';
const root=resolve('dist'),out=process.env.BASE_URL?'verification/lab-live':'verification/lab-local';await mkdir(out,{recursive:true});let server,base=process.env.BASE_URL;const results=[];
if(!base){server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost'),file=resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));if(!file.startsWith(root+sep))return res.writeHead(403).end();const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(await readFile(file));}catch{res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;}
try{
 for(const type of [chromium,webkit]){
  const browser=await type.launch();let page;
  try{
   const context=await browser.newContext({viewport:{width:390,height:664},isMobile:true,hasTouch:true,locale:'ja-JP'});page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/',{waitUntil:'networkidle'});await page.locator('#pet-body svg').waitFor();assert.equal(await page.locator('[data-menu]').count(),9);
   assert.equal(await page.evaluate(()=>typeof window.hitoikiLab),'undefined');
   await page.waitForFunction(()=>document.querySelector('#lcd').dataset.life==='pet');await page.waitForFunction(()=>!document.querySelector('#lcd').dataset.motion);
   await page.locator('[data-menu="food"]').click();await page.locator('[data-choice="meal"]').click();await page.waitForTimeout(900);assert.equal(await page.locator('#lcd').getAttribute('data-motion'),'meal');await page.screenshot({path:out+'/'+type.name()+'-meal.png',fullPage:true});await page.waitForTimeout(3800);
   const mealAt=await page.evaluate(()=>JSON.parse(localStorage.getItem('tamago2.care.v3')).lastMeal);await page.reload({waitUntil:'networkidle'});assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('tamago2.care.v3')).lastMeal),mealAt);await page.screenshot({path:out+'/'+type.name()+'-home.png',fullPage:true});
   await page.goto(base+'/?dev=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>!!window.hitoikiLab);
   // Capture after leaving normal mode: pagehide legitimately saves the final timestamp.
   const normal=await page.evaluate(()=>localStorage.getItem('tamago2.care.v3'));
   await page.locator('#lab-open').click();await page.locator('[data-lab="meal"]').click();await page.waitForTimeout(950);assert.equal(await page.locator('#lcd').getAttribute('data-reaction'),'eat');await page.screenshot({path:out+'/'+type.name()+'-lab-meal.png',fullPage:true});
   await page.locator('#lab-open').click();await page.locator('[data-tab="events"]').click();assert.equal(await page.locator('[data-lab="event"]').count(),32);await page.locator('[data-lab="event"][data-value="read"]').click();await page.locator('.memory-card').waitFor();await page.screenshot({path:out+'/'+type.name()+'-report.png',fullPage:true});
   await page.locator('#lab-open').click();await page.locator('[data-tab="states"]').click();await page.locator('[data-lab="bad-5"]').click();await page.evaluate(()=>window.hitoikiLab.next());await page.screenshot({path:out+'/'+type.name()+'-bad5.png',fullPage:true});
   await page.locator('#lab-open').click();await page.locator('[data-tab="explore"]').click();await page.locator('[data-lab="capture"][data-value="002"]').click();await page.locator('.capture-peek img').waitFor();await page.waitForFunction(()=>document.querySelector('.capture-peek img').naturalWidth>0);await page.screenshot({path:out+'/'+type.name()+'-capture.png',fullPage:true});
   await page.locator('#lab-open').click();await page.locator('#lab-check-all').click();await page.waitForFunction(()=>!document.querySelector('#lab-check-all').disabled,{},{timeout:120000});
   await page.screenshot({path:out+'/'+type.name()+'-diagnostics.png',fullPage:true});
   const status=await page.locator('#lab-check-status').textContent();const checks=await page.locator('#lab-check-results li').allTextContents();await writeFile(out+'/'+type.name()+'-checks.json',JSON.stringify({status,checks},null,2));
   assert.ok(status.startsWith('完了'),status);const fails=await page.locator('#lab-check-results [data-result="fail"]').allTextContents();const passed=await page.locator('#lab-check-results [data-result="pass"]').count();assert.deepEqual(fails,[]);assert.ok(passed>60);
   assert.equal(await page.evaluate(()=>localStorage.getItem('tamago2.care.v3')),normal,'Developer controls wrote production state');
   const labBefore=await page.evaluate(()=>window.hitoikiLab.snapshot());await page.locator('#lab-close').click();await page.reload({waitUntil:'networkidle'});assert.equal(await page.evaluate(()=>window.hitoikiLab.snapshot().world.captures.length),labBefore.world.captures.length);
   await page.setViewportSize({width:320,height:568});await page.locator('#lab-open').click();await page.locator('[data-tab="care"]').click();await page.screenshot({path:out+'/'+type.name()+'-small-lab.png',fullPage:true});assert.ok(await page.locator('#lab-close').isVisible());assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);assert.deepEqual(errors,[]);
   results.push({browser:type.name(),passed,normalStartup:true,meal:true,saveReload:true,productionDataUnchanged:true,smallLayout:true,errors});console.log('LAB_CHECK_OK',type.name(),passed);await context.close();
  }catch(e){if(page)await page.screenshot({path:out+'/'+type.name()+'-failure.png',fullPage:true}).catch(()=>{});throw e;}finally{await browser.close();}
 }
}finally{await writeFile(out+'/results.json',JSON.stringify({base,results},null,2));if(server)await new Promise(r=>server.close(r));}
