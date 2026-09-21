import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium,webkit} from '@playwright/test';
const root=resolve('dist'),out=process.env.BASE_URL?'verification/catalog-live':'verification/catalog-local';
await mkdir(out,{recursive:true});let server,base=process.env.BASE_URL;const results=[];
if(!base){server=createServer(async(req,res)=>{try{const u=new URL(req.url,'http://localhost'),f=resolve(root,'.'+(u.pathname==='/'?'/index.html':decodeURIComponent(u.pathname)));if(!f.startsWith(root+sep))return res.writeHead(403).end();const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};res.writeHead(200,{'Content-Type':types[extname(f)]||'application/octet-stream','Cache-Control':'no-store'}).end(await readFile(f));}catch{res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;}
const ids=['002','003','005','007','010','012'];
try{
 for(const type of [chromium,webkit]){
  const browser=await type.launch();let page;const checks=[];
  const check=(name)=>{checks.push(name);console.log('PASS',type.name(),name);};
  try{
   const context=await browser.newContext({viewport:{width:390,height:664},isMobile:true,hasTouch:true,locale:'ja-JP'});
   page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/?dev=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>!!window.hitoikiLab);
   const run=async(id,value)=>page.evaluate(([id,v])=>window.hitoikiLab.run(id,v),[id,value]);
   const shot=async name=>page.screenshot({path:out+'/'+type.name()+'-'+name+'.png',fullPage:true});
   const allDecoded=async selector=>{await page.waitForFunction(s=>{const images=[...document.querySelectorAll(s)];return images.length>0&&images.every(x=>x.complete&&x.naturalWidth>0&&x.closest('.catalog-picture').dataset.imageState==='ready');},selector);};
   await run('reset');const normalSeed='{"catalog-sentinel":true}';await page.evaluate(s=>localStorage.setItem('tamago2.care.v3',s),normalSeed);
   await page.locator('#lab-open').click();await page.locator('[data-tab="explore"]').click();await page.locator('[data-lab="catalog-preview"]').click();
   assert.equal(await page.locator('#catalog-dialog img').count(),6);await allDecoded('#catalog-dialog img');
   assert.equal(await page.evaluate(()=>hitoikiLab.snapshot().world.captures.length),0);check('developer preview shows all six without registering captures');await shot('all-six');
   for(const id of ids){
    await page.locator('[data-catalog-open="'+id+'"]').click();await allDecoded('.creature-portrait');
    assert.equal(await page.locator('.creature-portrait').getAttribute('data-catalog-id'),id);
    assert.equal(await page.locator('.creature-portrait').evaluate(x=>x.naturalWidth),800);
    const box=await page.locator('.creature-portrait').boundingBox();assert.ok(box.width>100&&box.height>100);
    if(id==='002')await shot('detail');
    await page.locator('[data-catalog-action="list"]').click();
   }check('six full illustrations decode in their actual detail views');
   await page.locator('[data-catalog-action="preview"]').click();assert.equal(await page.locator('#catalog-dialog img').count(),0);check('unearned images clearly hidden in captured-only view');
   await page.locator('[data-catalog-action="preview"]').click();
   await page.locator('[data-catalog-action="check"]').click();await page.waitForFunction(()=>document.querySelector('#catalog-check-result').textContent.startsWith('完了：6/6'));check('18 image variants pass the actual UI image checker');await shot('image-check');
   for(let i=0;i<ids.length;i++){
    await run('capture',ids[i]);await allDecoded('.capture-peek img');
    assert.equal(await page.evaluate(()=>hitoikiLab.snapshot().world.captures.length),i+1,'earlier captures must not vanish');
    await page.locator('.capture-peek').click();await allDecoded('.creature-portrait');await page.locator('[data-action="close-catalog"]').first().click();
   }check('six sequential real capture commands preserve every previous record');
   await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>!!window.hitoikiLab);assert.equal(await page.evaluate(()=>hitoikiLab.snapshot().world.captures.length),6);check('catalog survives page reload');
   assert.equal(await page.evaluate(()=>localStorage.getItem('tamago2.care.v3')),normalSeed);check('developer operations do not alter normal save');
   // Detect an actual HTTP-success-but-nonimage body; fallback must decode a real PNG.
   await page.route('**/catalog/002*.webp*',route=>route.fulfill({status:200,contentType:'text/html',body:'<h1>Not an image</h1>'}));
   await run('catalog-preview');await page.locator('[data-catalog-open="002"]').click();await allDecoded('.creature-portrait');
   assert.ok((await page.locator('.creature-portrait').getAttribute('src')).includes('/creatures/2.png'));check('invalid webp response falls back to the original PNG');
   await page.route('**/creatures/2.png*',route=>route.abort());await page.locator('[data-catalog-action="retry"]').click();
   await page.waitForFunction(()=>document.querySelector('.catalog-full').dataset.imageState==='error');assert.ok(await page.locator('.catalog-image-status').first().isVisible());await shot('error');check('both image sources failing shows a visible error instead of blank');
   await page.unroute('**/catalog/002*.webp*');await page.unroute('**/creatures/2.png*');await page.locator('[data-catalog-action="retry"]').click();await allDecoded('.creature-portrait');check('retry recovers after connectivity returns');
   await run('healthy');await page.evaluate(()=>hitoikiLab.finish());
   const paired=await page.evaluate(async()=>{
    const im=new Image();im.src='./mame-sheet.png?v=catalog-face-20260921-01';await im.decode();const canvas=document.createElement('canvas');canvas.width=im.width;canvas.height=im.height;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0);
    const poses=['idle','breathe','blink','glance','happy','ready','eat-a','eat-b','bow','sleep','sick','refuse','stretch','wave','step-a','step-b'];let total=0;const failures=[];
    for(let row=0;row<11;row++)for(let col=0;col<16;col++){
     const pose=poses[col];if(pose==='sleep')continue;const bad=row>=6,n=bad?row-5:0;
     const bob=(bad&&n===5?3:bad&&n===2?1:0)+(pose==='breathe'?1:['ready','happy','stretch'].includes(pose)?-1:0),ey=20+bob+(pose==='bow'?2:0),dx=!bad&&pose==='glance'?-1:!bad&&pose==='refuse'?1:0;
     const a=ctx.getImageData(col*40+13+dx,row*44+ey,4,5).data,b=ctx.getImageData(col*40+23+dx,row*44+ey,4,5).data;if(!a.every((v,i)=>v===b[i]))failures.push([row,pose]);total++;
    }return {total,failures};
   });assert.equal(paired.total,165);assert.deepEqual(paired.failures,[]);check('165 actual atlas eye pairs have identical pixels, sizes and height');await shot('balanced-face');
   await page.setViewportSize({width:320,height:568});await run('catalog-preview');await allDecoded('#catalog-dialog img');await shot('small-catalog');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);check('320x568 catalog remains usable');
   // Real user mode must reveal only legitimately saved discoveries.
   const normal=await browser.newContext({viewport:{width:390,height:664},isMobile:true,hasTouch:true});const p=await normal.newPage();await p.goto(base+'/',{waitUntil:'networkidle'});await p.locator('[data-action="catalog"]').first().click();assert.equal(await p.locator('#catalog-dialog img').count(),0);check('normal new game does not unlock unseen creatures');
   const captured=await page.evaluate(()=>hitoikiLab.snapshot());
   // Seed before app startup, not before reload: a running page correctly saves its
   // own state on pagehide and would overwrite a test's foreign localStorage value.
   await p.close();await normal.addInitScript(v=>localStorage.setItem('tamago2.care.v3',JSON.stringify(v)),captured);
   const p2=await normal.newPage();p2.on('pageerror',e=>errors.push(e.message));await p2.goto(base+'/',{waitUntil:'networkidle'});await p2.locator('[data-action="catalog"]').first().click();await p2.waitForFunction(()=>{const images=[...document.querySelectorAll('#catalog-dialog img')];return images.length===6&&images.every(x=>x.complete&&x.naturalWidth>0);});check('normal save with discoveries displays all six');await p2.screenshot({path:out+'/'+type.name()+'-normal-catalog.png',fullPage:true});await normal.close();
   assert.deepEqual(errors,[]);results.push({browser:type.name(),checks,paired,errors});console.log('CATALOG_FACE_CHECK_OK',type.name(),checks.length);await context.close();
  }catch(e){results.push({browser:type.name(),checks,error:e.message});if(page)await page.screenshot({path:out+'/'+type.name()+'-failure.png',fullPage:true}).catch(()=>{});throw e;}finally{await browser.close();}
 }
}finally{await writeFile(out+'/results.json',JSON.stringify({base,results},null,2));if(server)await new Promise(r=>server.close(r));}
