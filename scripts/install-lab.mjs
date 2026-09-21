// Transparent, repeatable additions after the existing build and renderer repair.
import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const release='lab-dialogue-20260921-01';
for(const name of ['dialogue.js','character.js','lab.js','lab.css'])await copyFile('features/'+name,'dist/'+name);
let app=await readFile('dist/app.js','utf8');
if(app.includes('function idleDialogue()'))throw new Error('Run the base build before installing features');
function replaceOnce(from,to){if(!app.includes(from))throw new Error('App integration anchor not found: '+from.slice(0,60));app=app.replace(from,to);}
replaceOnce("import { activity } from './activities.js';","import { activity, ACTIVITIES, applyActivity } from './activities.js';");
replaceOnce("const KEY = DEV ? 'tamago2.care.v3.demo' : 'tamago2.care.v3';", "const checkToken=new URLSearchParams(location.search).get('selftest');\nconst KEY = DEV ? (checkToken && /^[a-z0-9-]{1,60}$/.test(checkToken) ? 'tamago2.lab.check.'+checkToken : 'tamago2.care.v3.demo') : 'tamago2.care.v3';\nlet dialogue=null,labPaused=true;\nconst labErrors=[];\nif(DEV){window.addEventListener('error',e=>labErrors.push(String(e.message)));window.addEventListener('unhandledrejection',e=>labErrors.push(String(e.reason)));}");
replaceOnce('function say(message,duration=4500){ui.message=message;', 'function say(message,duration=4500){if(dialogue){message=dialogue.reaction(message,s);dialogue.hold(duration);}ui.message=message;');
replaceOnce('if(s.hatched&&!s.dead){if(!initial&&visible&&elapsed<=.17)', 'if(s.hatched&&!s.dead&&!(DEV&&labPaused)){if(!initial&&visible&&elapsed<=.17)');
replaceOnce("Date.now()<ui.messageUntil?ui.message:condition(s)==='げんきいっぱい'?'じぶんで、やってみたいな。あなたもひと休み。':condition(s)","Date.now()<ui.messageUntil?ui.message:dialogue?idleDialogue():condition(s)");
app="import { createDialogue, BANK } from './dialogue.js';\nimport { mountLab } from './lab.js';\n"+app+'\n'+await readFile('features/integration.js','utf8');
let sprites=await readFile('dist/sprites.js','utf8');const start=sprites.indexOf('export function pet(s) {'),end=sprites.indexOf('\n}\n',start);
if(start<0||end<0)throw new Error('Pet renderer integration anchor not found');
sprites="import { pet as renderPet } from './character.js';\n"+sprites.slice(0,start)+'export const pet = renderPet;'+sprites.slice(end+2);
// One version for every module prevents mixing a stale entry point with new exports.
for(const name of ['app.js','sprites.js','engine.js','journey.js','world.js','activities.js','dialogue.js','character.js','lab.js']){
 let code=name==='app.js'?app:name==='sprites.js'?sprites:await readFile('dist/'+name,'utf8');
 code=code.replace(/from\s+(['"])(\.\/[^'"?]+\.js)(?:\?[^'"]*)?\1/g,(_,q,p)=>'from '+q+p+'?v='+release+q);
 await writeFile('dist/'+name,code);
}
let html=await readFile('dist/index.html','utf8');
html=html.replace('</head>',`<link rel="stylesheet" href="./lab.css?v=${release}"></head>`);
html=html.replace('<noscript>', '<noscript>');
html=html.replace('<button class="dialog-done" data-action="close-help">', '<p><a class="developer-link" href="?dev=1">開発者モードで全機能を試す</a></p><button class="dialog-done" data-action="close-help">');
const script=/<script type="module" src="\.\/app\.js[^\"]*"><\/script>/;
if(!script.test(html))throw new Error('Boot script not found');
html=html.replace(script,`<section id="startup-error" class="boot-failure" role="alert" hidden>読み込み中に問題が起きました。保存データは消さずに、再読み込みしてください。<br><button onclick="location.reload()">再読み込み</button></section><script type="module">import('./app.js?v=${release}').catch(error=>{document.querySelector('#startup-error').hidden=false;console.error(error);});</script>`);
html=html.replace('data-release="hitoiki-life-20260921-02"',`data-release="${release}"`);
await writeFile('dist/index.html',html);
const v=JSON.parse(await readFile('dist/version.json','utf8'));v.features=release;await writeFile('dist/version.json',JSON.stringify(v));
const exports=await import(pathToFileURL(resolve('dist/sprites.js')).href+'?check='+Date.now());
for(const f of ['pet','projectSvg','vignette','icon'])if(typeof exports[f]!=='function')throw new Error('Missing renderer '+f);
console.log('Developer lab and varied dialogue installed:',release);
