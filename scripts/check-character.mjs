import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium,webkit} from '@playwright/test';
const root=resolve('dist'),out=process.env.BASE_URL?'verification/art-live':'verification/art-local';
await mkdir(out,{recursive:true});let server,base=process.env.BASE_URL;const results=[];
if(!base){server=createServer(async(req,res)=>{try{const u=new URL(req.url,'http://localhost'),f=resolve(root,'.'+(u.pathname==='/'?'/index.html':decodeURIComponent(u.pathname)));if(!f.startsWith(root+sep))return res.writeHead(403).end();const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};res.writeHead(200,{'Content-Type':types[extname(f)]||'application/octet-stream','Cache-Control':'no-store'}).end(await readFile(f));}catch{res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;}
try{
 for(const type of [chromium,webkit]){
  const browser=await type.launch();let page;
  try{
   const context=await browser.newContext({viewport:{width:390,height:664},isMobile:true,hasTouch:true,locale:'ja-JP'});
   page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/?dev=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>!!window.hitoikiLab);
   const run=async(id)=>page.evaluate(id=>window.hitoikiLab.run(id),id);
   const shot=async(name)=>page.screenshot({path:out+'/'+type.name()+'-'+name+'.png',fullPage:true});
   const poses=async()=>page.locator('#pet-body .pc-frame').evaluateAll(gs=>gs.filter(g=>getComputedStyle(g).display!=='none'&&Number(getComputedStyle(g).opacity)>.5).map(g=>g.dataset.pose));
   await run('healthy');
   assert.equal(await page.locator('#pet-body svg').getAttribute('data-art'),'catalog-face-20260921-01');
   const box=await page.locator('#pet-body svg').boundingBox();assert.equal(box.width,160);assert.equal(box.height,176);
   assert.equal(await page.locator('[data-menu]').count(),9);assert.ok((await poses()).length>0);
   const atlas=await page.evaluate(async()=>{
    const img=new Image();img.src='./mame-sheet.png?v=catalog-face-20260921-01';await img.decode();
    const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);const p=ctx.getImageData(0,0,c.width,c.height).data;
    const colors=new Set(),alpha=new Set();for(let i=0;i<p.length;i+=4){alpha.add(p[i+3]);if(p[i+3])colors.add([p[i],p[i+1],p[i+2]].join(','));}
    function signature(x,y){const a=ctx.getImageData(x,y,40,44).data;let h=2166136261;for(const v of a)h=Math.imul(h^v,16777619);return h>>>0;}
    return {width:img.width,height:img.height,colors:[...colors],alpha:[...alpha],looks:Array.from({length:13},(_,i)=>signature(0,i*44)),poses:Array.from({length:16},(_,i)=>signature(i*40,0))};
   });
   assert.equal(atlas.width,640);assert.equal(atlas.height,572);assert.equal(atlas.colors.length,4);assert.deepEqual(atlas.alpha.sort((a,b)=>a-b),[0,255]);assert.equal(new Set(atlas.looks).size,13);assert.ok(new Set(atlas.poses).size>=12);await shot('home');
   // Sample the real CSS timeline: one readable, non-blended cel at every instant.
   for(const [time,expected] of [[0,'idle'],[4000,'breathe'],[7700,'blink'],[9500,'glance'],[11000,'wave']]){
    await page.locator('#pet-body svg').evaluate((el,t)=>{for(const a of el.getAnimations({subtree:true})){a.pause();a.currentTime=t;}},time);
    await page.waitForTimeout(40);assert.deepEqual(await poses(),[expected]);
   }
   await page.locator('#pet-body svg').evaluate(el=>el.getAnimations({subtree:true}).forEach(a=>a.play()));
   // Use visible developer controls to launch the same care action as the app.
   await page.locator('#lab-open').click();await page.locator('[data-tab="art"]').click();await page.locator('[data-lab="meal"]').click();
   await page.waitForFunction(()=>document.querySelector('#lcd').dataset.reaction==='ready');assert.deepEqual(await poses(),['ready']);await shot('meal-ready');
   await page.waitForFunction(()=>document.querySelector('#lcd').dataset.reaction==='eat');
   const chewing=new Set();for(let i=0;i<8;i++){(await poses()).forEach(p=>chewing.add(p));await page.waitForTimeout(95);}
   assert.ok(chewing.has('eat-a')&&chewing.has('eat-b'),JSON.stringify([...chewing]));await shot('meal');
   await page.waitForFunction(()=>document.querySelector('#lcd').dataset.reaction==='happy');assert.deepEqual(await poses(),['happy']);await shot('happy');
   await page.waitForFunction(()=>document.querySelector('#lcd').dataset.reaction==='bow');assert.deepEqual(await poses(),['bow']);await shot('bow');
   await run('sleep');assert.deepEqual(await poses(),['sleep']);assert.equal(await page.locator('#pet-body').evaluate(el=>getComputedStyle(el).transform),'none');await shot('sleep');
   await run('wake');assert.deepEqual(await poses(),['stretch']);
   await run('bad-5');await page.evaluate(()=>window.hitoikiLab.finish());await shot('bad5');assert.equal(await page.locator('#pet-body svg').getAttribute('data-kind'),'bad-5');
   await run('death');assert.equal(await page.locator('#pet-body svg').getAttribute('data-kind'),'departed');assert.ok((await poses()).length>0);await shot('farewell');
   await run('healthy');await run('evolutions');assert.equal(await page.locator('#evolution-content .pc-character').count(),10);await shot('evolutions');
   await run('healthy');await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(50);assert.deepEqual(await poses(),['idle']);
   await run('sleep');assert.deepEqual(await poses(),['sleep']);await page.emulateMedia({reducedMotion:'no-preference'});
   await run('healthy');await page.setViewportSize({width:320,height:568});await page.waitForTimeout(50);assert.equal((await page.locator('#pet-body svg').boundingBox()).width,120);await shot('small');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
   assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('pixel-art-fallback')),false);assert.deepEqual(errors,[]);
   results.push({browser:type.name(),atlas,distinctLooks:13,mealFourPhases:true,chewingFrames:2,unrotatedSleep:true,reducedMotion:true,smallLayout:true,errors});console.log('CHARACTER_CHECK_OK',type.name());await context.close();
  }catch(e){if(page)await shotFailure(page,out+'/'+type.name()+'-failure.png');throw e;}finally{await browser.close();}
 }
}finally{await writeFile(out+'/results.json',JSON.stringify({base,results},null,2));if(server)await new Promise(r=>server.close(r));}
async function shotFailure(p,path){await p.screenshot({path,fullPage:true}).catch(()=>{});}
