import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base='https://tamago2.itisnowornever271.workers.dev',files=['app.js','sprites.js','character.js','dialogue.js','lab.js','lab.css','index.html'];
const hash=b=>createHash('sha256').update(b).digest('hex');let last='';
for(let i=0;i<30;i++){
 try{
  const response=await fetch(base+'/version.json?t='+Date.now(),{signal:AbortSignal.timeout(12000)});const version=await response.json();if(version.features!=='lab-dialogue-20260921-01')throw Error('waiting for release '+version.features);
  const checks=[];for(const file of files){const r=await fetch(base+'/'+file+'?check='+Date.now(),{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error(file+' HTTP '+r.status);const remote=hash(Buffer.from(await r.arrayBuffer())),local=hash(await readFile('dist/'+file));if(remote!==local)throw Error(file+' SHA mismatch');checks.push({file,sha256:remote});}
  await mkdir('verification',{recursive:true});await writeFile('verification/live-hashes.json',JSON.stringify({base,version,checks},null,2));console.log('LIVE_LAB_FILES_VERIFIED',JSON.stringify(checks));process.exit(0);
 }catch(e){last=e.message;console.log('Waiting',i+1,last);await new Promise(r=>setTimeout(r,10000));}
}
throw Error('Live verification failed: '+last);
