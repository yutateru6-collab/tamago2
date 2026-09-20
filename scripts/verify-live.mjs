import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { RELEASE } from '../engine.js';
const origin=process.env.PUBLIC_URL || 'https://tamago2.itisnowornever271.workers.dev';
const hash=b=>createHash('sha256').update(b).digest('hex');
let last='';
await mkdir('test-results',{recursive:true});
for(let attempt=1;attempt<=24;attempt++){
  try{
    const v=await fetch(`${origin}/version.json?check=${Date.now()}`,{signal:AbortSignal.timeout(7000),headers:{'Cache-Control':'no-cache'}});
    if(!v.ok)throw new Error(`version HTTP ${v.status}`);
    const version=await v.json();if(version.app!=='tamago2'||version.release!==RELEASE)throw new Error(`stale release: ${JSON.stringify(version)}`);
    const results=[];
    for(const name of ['index.html','app.js','engine.js','sprites.js','styles.css','fullscreen.css','journey.js','manifest.webmanifest','icon.svg']){
      const response=await fetch(`${origin}/${name}?check=${Date.now()}`,{signal:AbortSignal.timeout(10000),headers:{'Cache-Control':'no-cache'}});
      if(!response.ok)throw new Error(`${name} HTTP ${response.status}`);
      const actual=Buffer.from(await response.arrayBuffer());const expected=await readFile(`dist/${name}`);
      if(hash(actual)!==hash(expected))throw new Error(`${name}: deployed bytes do not match the tested commit`);
      results.push({name,sha256:hash(actual),status:response.status});
    }
    const result={verified:true,app:'tamago2',release:RELEASE,url:origin,checkedAt:new Date().toISOString(),files:results};
    await writeFile('test-results/live.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));process.exit(0);
  }catch(e){last=e.message;console.log(`Live verification ${attempt}/24: ${last}`);if(attempt<24)await new Promise(r=>setTimeout(r,7000));}
}
await writeFile('test-results/live.json',JSON.stringify({verified:false,url:origin,release:RELEASE,error:last},null,2));
throw new Error(`Cloudflare release NOT verified: ${last}`);
