// Run after install-lab. Keep the existing interface/game rules/storage untouched.
import {readFile,writeFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const release='character-polish-20260921-01';
await copyFile('assets/mame-sheet.png','dist/mame-sheet.png');
await copyFile('features/character.css','dist/character.css');
const meta=JSON.parse(await readFile('assets/mame-sheet.json','utf8'));
const hash=createHash('sha256').update(await readFile('dist/mame-sheet.png')).digest('hex');
if(hash!==meta.sha256||meta.cell.width!==40||meta.cell.height!==44||meta.looks.length!==13||meta.poses.length!==16)throw Error('Invalid character atlas');
for(const name of ['app.js','sprites.js','engine.js','journey.js','world.js','activities.js','dialogue.js','character.js','lab.js']){
 let code=await readFile('dist/'+name,'utf8');
 if(name==='app.js')code+='\n{const atlas=new Image();atlas.onerror=()=>document.documentElement.classList.add("pixel-art-fallback");atlas.src="./mame-sheet.png?v='+release+'";document.addEventListener("visibilitychange",()=>document.documentElement.classList.toggle("pixel-away",document.hidden));}\n';
 if(name==='lab.js'){
  if(!code.includes("const tabs={care:")||!code.includes('const common={'))throw Error('Lab character tab anchor missing');
  code=code.replace('const tabs={care:',"const tabs={art:'キャラの表情',care:");
  code=code.replace('const common={',"const common={art:[['healthy','いつもの姿'],['pet','こちらを見て手を振る'],['meal','気づく→もぐもぐ→満足→おじぎ'],['refuse','おなかいっぱいで断る'],['sleep','丸くなって眠る'],['wake','両手で背伸び'],['sick','弱っている顔'],['death','おわかれの姿'],['evolutions','良い5・悪い5の姿を比べる']],");
 }
 code=code.replace(/from\s+(['"])(\.\/[^'"?]+\.js)(?:\?[^'"]*)?\1/g,(_,q,p)=>'from '+q+p+'?v='+release+q);
 await writeFile('dist/'+name,code);
}
let html=await readFile('dist/index.html','utf8');
if(!html.includes('<html lang="ja">'))throw Error('HTML root anchor missing');
html=html.replace('<html lang="ja">','<html lang="ja" class="pixel-polish">').replace('</head>','<link rel="stylesheet" href="./character.css?v='+release+'"></head>').replaceAll('lab-dialogue-20260921-01',release);
await writeFile('dist/index.html',html);
const v=JSON.parse(await readFile('dist/version.json','utf8'));v.features=release;v.artSha256=hash;await writeFile('dist/version.json',JSON.stringify(v));
console.log('CHARACTER_ART_INSTALLED',release,hash,meta.looks.length+' appearances / '+meta.poses.length+' cels each');
