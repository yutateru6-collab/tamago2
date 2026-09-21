import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const base = 'https://tamago2.itisnowornever271.workers.dev/';
const files = ['index.html','app.js','sprites.js'];
const hash = data => createHash('sha256').update(data).digest('hex');
const expected = Object.fromEntries(await Promise.all(files.map(async file=>[file,hash(await readFile('dist/'+file))])));
let last = '';
for (let attempt=1; attempt<=30; attempt++) {
  try {
    const actual = await Promise.all(files.map(async file => {
      const response = await fetch(base+file+'?verify='+Date.now(), {cache:'no-store',signal:AbortSignal.timeout(12000)});
      if (!response.ok) throw new Error(file+': HTTP '+response.status);
      return [file,hash(Buffer.from(await response.arrayBuffer()))];
    }));
    const mismatch = actual.filter(([file,digest])=>digest!==expected[file]);
    if (!mismatch.length) {
      console.log('LIVE_RENDER_FILES_MATCH', JSON.stringify({base,sha256:expected}));
      process.exit(0);
    }
    last = 'Files still outdated: '+mismatch.map(([file])=>file).join(', ');
  } catch (error) { last=error.message; }
  console.log('Awaiting fixed public renderer',attempt+'/30',last);
  await new Promise(done=>setTimeout(done,10000));
}
throw new Error(last);
