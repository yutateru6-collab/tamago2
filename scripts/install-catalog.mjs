// Last build stage. Patch the actual files emitted by the legacy archive builder.
import {readFile,writeFile,copyFile,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const release='catalog-face-20260921-01';
const manifest=JSON.parse(await readFile('assets/catalog/manifest.json','utf8'));
await mkdir('dist/catalog',{recursive:true});
for(const c of manifest)for(const f of c.files){const b=await readFile('assets/catalog/'+f.name);if(createHash('sha256').update(b).digest('hex')!==f.sha256)throw Error('Catalog asset hash mismatch '+f.name);await copyFile('assets/catalog/'+f.name,'dist/catalog/'+f.name);}
for(const file of ['catalog.js','catalog.css'])await copyFile('features/'+file,'dist/'+file);
let app=await readFile('dist/app.js','utf8');
const replace=(before,after)=>{if(!app.includes(before))throw Error('Catalog patch anchor missing: '+before.slice(0,70));app=app.replace(before,after);};
app="import { createCatalog, catalogPicture, observeCatalogImages } from './catalog.js';\n"+app;
replace("let ui=initialUI();", "const catalog=createCatalog({state:()=>s,dev:DEV});observeCatalogImages();\nlet ui=initialUI();");
const from=app.indexOf('function openCatalog(id){'),to=app.indexOf('function openEvolutions(){',from);
if(from<0||to<0)throw Error('Catalog boundary missing');
app=app.slice(0,from)+"function openCatalog(id){catalog.open(id);}\n"+app.slice(to);
replace('<img src="${creatureImage(capture.id)}" alt="${capture.name}の図鑑画像" width="512" height="512">','${catalogPicture(capture.id)}');
replace("else if(id==='catalog')openCatalog();", "else if(id==='catalog-preview')catalog.preview();\n   else if(id==='catalog-check'){catalog.preview();catalog.check();}\n   else if(id==='catalog')openCatalog();");
// Targeted dev captures must not erase already discovered creatures. Temporary
// prerequisite records are removed before completing/saving the real encounter.
replace("const c=species(value);if(!c)throw new Error('不明な生物');ready({growth:180});s.world.captures=[];s.world.visits[c.area]=0;", "const c=species(value);if(!c)throw new Error('不明な生物');ready({growth:180});const kept=copy(s.world.captures);s.world.captures=[];s.world.visits[c.area]=0;");
replace("timeReady(30,'explore',c.area);choose('confirm-rest');note='出会う条件を用意し、探索の本処理から捕獲・画像・図鑑を確認。';", "timeReady(30,'explore',c.area);if(!confirmRest(s))throw Error('検証の探索に失敗');const caught=s.world.captures.find(x=>x.id===c.id);s.world.captures=kept;if(!caught)throw Error('指定の生物に出会えませんでした');const old=s.world.captures.find(x=>x.id===c.id);if(old){old.count++;old.lastAt=caught.lastAt;}else s.world.captures.push(caught);completed();note='探索の本処理から捕獲。これまでの図鑑登録は保持しました。';");
await writeFile('dist/app.js',app);
let lab=await readFile('dist/lab.js','utf8');
lab=lab.replace('explore:[...data.creatures.map',"explore:[['catalog-preview','図鑑の全画像を見る（捕獲記録は変更しない）'],['catalog-check','6種類の画像読込チェック'],...data.creatures.map");
await writeFile('dist/lab.js',lab);
for(const name of await readdir('dist')){
 if(!name.endsWith('.js'))continue;
 let code=await readFile('dist/'+name,'utf8');
 code=code.replace(/from\s+(['"])(\.\/[^'"?]+\.js)(?:\?[^'"]*)?\1/g,(_,q,p)=>'from '+q+p+'?v='+release+q);
 if(name==='character.js')code=code.replace(/(ART_VERSION=')[^']+(';)/,`$1${release}$2`);
 code=code.replaceAll('./mame-sheet.png?v=character-polish-20260921-01','./mame-sheet.png?v='+release);
 await writeFile('dist/'+name,code);
}
let html=await readFile('dist/index.html','utf8');
html=html.replaceAll('character-polish-20260921-01',release).replace('</head>','<link rel="stylesheet" href="./catalog.css?v='+release+'"></head>');
await writeFile('dist/index.html',html);
const v=JSON.parse(await readFile('dist/version.json','utf8'));v.features=release;v.catalogImages=manifest.length;v.artSha256=createHash('sha256').update(await readFile('dist/mame-sheet.png')).digest('hex');await writeFile('dist/version.json',JSON.stringify(v));
console.log('CATALOG_AND_FACE_INSTALLED',release,manifest.length);
