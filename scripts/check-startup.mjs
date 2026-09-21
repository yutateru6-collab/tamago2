// Regression tests for the blank screen; run against dist and the real public URL.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium, webkit } from '@playwright/test';
const root = resolve('dist');
const out = process.env.BASE_URL ? 'verification/live' : 'verification/local';
await mkdir(out, { recursive: true });
let server;
let base = process.env.BASE_URL;
if (!base) {
  const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css', '.svg':'image/svg+xml', '.png':'image/png', '.json':'application/json' };
  server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const file = resolve(root, '.' + (url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname)));
      if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
      const data = await readFile(file);
      res.writeHead(200, { 'Content-Type':types[extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store' }).end(data);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  base = 'http://127.0.0.1:' + server.address().port;
}
const results = [];
try {
  for (const browserType of [chromium, webkit]) {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport:{width:390,height:664}, isMobile:true, hasTouch:true, locale:'ja-JP' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const visible = async () => {
        await page.locator('#pet-body svg').waitFor({ state:'visible' });
        assert.equal(await page.locator('[data-menu]').count(), 9);
        for (const b of await page.locator('[data-menu]').all()) assert.ok(await b.isVisible());
        const box = await page.locator('#pet-body svg').boundingBox();
        assert.ok(box && box.width > 20 && box.height > 20, 'Pet must occupy visible space');
      };
      await page.goto(base + '/?fix=render-startup-20260921-01', {waitUntil:'networkidle'});
      await visible();
      await page.screenshot({path:out+'/'+browserType.name()+'-home.png',fullPage:true});
      await page.waitForFunction(() => document.querySelector('#lcd').dataset.life === 'pet');
      await page.waitForFunction(() => !document.querySelector('#lcd').dataset.motion);
      await page.locator('[data-menu="food"]').click();
      await page.locator('[data-choice="meal"]').click();
      await page.waitForFunction(() => document.querySelector('#lcd').dataset.motion === 'meal');
      await page.waitForTimeout(900);
      await page.screenshot({path:out+'/'+browserType.name()+'-meal.png',fullPage:true});
      await page.waitForFunction(() => !document.querySelector('#lcd').dataset.motion);
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('tamago2.care.v3')));
      assert.ok(saved.hatched && saved.lastMeal > 0);
      await page.reload({waitUntil:'networkidle'});
      await visible();
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('tamago2.care.v3')).lastMeal), saved.lastMeal);
      assert.deepEqual(errors, []);
      results.push({browser:browserType.name(),case:'startup, hatch, meals and save/reload',passed:true});
      await page.goto(base + '/?dev=1&fix=render-startup-20260921-01', {waitUntil:'networkidle'});
      await page.locator('[data-dev="rest"]').click();
      await page.locator('.event-vignette svg').first().waitFor({state:'visible'});
      await page.screenshot({path:out+'/'+browserType.name()+'-report.png',fullPage:true});
      await page.locator('[data-choice="memory-done"]').click();
      assert.deepEqual(errors, []);
      results.push({browser:browserType.name(),case:'return report',passed:true});
      await page.locator('[data-dev="exploration"]').click();
      await page.locator('.capture-peek img').waitFor({state:'visible'});
      await page.waitForFunction(() => document.querySelector('.capture-peek img').naturalWidth > 0);
      await page.locator('.capture-peek').click();
      await page.locator('#catalog-dialog[open] .creature-portrait').waitFor({state:'visible'});
      await page.waitForFunction(() => document.querySelector('.creature-portrait').naturalWidth > 0);
      await page.screenshot({path:out+'/'+browserType.name()+'-catalog.png',fullPage:true});
      await page.locator('[data-action="close-catalog"]').first().click();
      await page.locator('[data-choice="memory-done"]').click();
      assert.ok(await page.locator('#made-items svg').count() > 0, 'Created map must render');
      assert.deepEqual(errors, []);
      results.push({browser:browserType.name(),case:'exploration, captured creature image and created map',passed:true});
      await page.close();
      const small = await context.newPage();
      const smallErrors=[];
      small.on('pageerror',e=>smallErrors.push(e.message));
      await small.setViewportSize({width:320,height:568});
      await small.goto(base+'/',{waitUntil:'networkidle'});
      await small.locator('#pet-body svg').waitFor({state:'visible'});
      assert.equal(await small.locator('[data-menu]').count(),9);
      await small.screenshot({path:out+'/'+browserType.name()+'-small.png',fullPage:true});
      assert.deepEqual(smallErrors,[]);
      results.push({browser:browserType.name(),case:'320x568 startup with existing saved data',passed:true});
      await context.close();
    } finally { await browser.close(); }
  }
  console.log('STARTUP_CHECK_OK', JSON.stringify({base,results}));
} finally {
  await writeFile(out+'/results.json', JSON.stringify({base,results},null,2));
  if (server) await new Promise(done=>server.close(done));
}
