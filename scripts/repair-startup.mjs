// Apply after the legacy archive build, which overwrites sprites.js.
// Restore only the two renderer exports already requested by the shipped app.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const fix = 'render-startup-20260921-01';
const additions = `
// Required by the existing room and return-report UI.
export function projectSvg(name) {
  let p = '';
  switch (name) {
    case 'shelf': p = r(1,2,2,13)+r(13,2,2,13)+r(3,6,10,2)+r(3,12,10,2)+r(4,2,2,4)+r(8,3,3,3); break;
    case 'stool': p = r(2,6,12,3)+r(3,9,2,6)+r(11,9,2,6); break;
    case 'drawing': p = r(1,1,14,14)+r(3,3,10,10,'cut')+r(5,5,3,3)+r(5,10,7,1)+r(9,8,2,2); break;
    case 'garland': p = r(0,3,16,1)+r(1,4,3,4)+r(6,4,3,6)+r(11,4,3,4); break;
    case 'house': p = r(6,1,4,2)+r(3,3,10,3)+r(1,6,14,9)+r(7,9,4,6,'cut')+r(3,8,2,3,'cut'); break;
    case 'map': p = r(2,1,12,14)+r(4,3,8,10,'cut')+r(5,4,2,2)+r(7,6,2,2)+r(8,9,3,2); break;
    case 'nest': p = r(1,9,14,2)+r(3,11,10,2)+r(5,13,6,1)+r(5,5,3,4)+r(9,6,3,3); break;
    case 'window': p = r(1,1,14,14)+r(3,3,10,10,'cut')+r(7,3,2,10)+r(3,7,10,2); break;
    case 'leaf': p = r(7,2,5,2)+r(4,4,9,5)+r(5,9,6,3)+r(7,12,2,3)+r(7,6,2,4,'cut'); break;
    case 'cup': p = r(2,5,9,8)+r(4,7,5,4,'cut')+r(11,6,4,5)+r(11,8,2,1,'cut')+r(4,2,2,2); break;
    case 'plant': p = r(4,10,8,4)+r(7,4,2,6)+r(3,3,4,3)+r(9,2,4,3); break;
    case 'book': p = r(1,3,6,10)+r(9,3,6,10)+r(7,5,2,9)+r(3,5,3,1,'cut')+r(10,5,3,1,'cut'); break;
    default: p = r(3,5,10,8)+r(5,3,6,2);
  }
  return svg(p);
}
export function vignette(state, motion = 'read') {
  const kinds = ['read','build','draw','tidy','water','wash','explore','stretch','nap','meal'];
  const kind = kinds.includes(motion) ? motion : 'read';
  const props = {read:'book',build:'shelf',draw:'drawing',tidy:'shelf',water:'plant',wash:'cup',explore:'map',stretch:'leaf',nap:'stool',meal:'cup'};
  return '<div class="event-vignette" data-activity="'+kind+'" aria-hidden="true"><div class="vignette-pet">'+pet(state)+'</div><div class="vignette-prop">'+projectSvg(props[kind])+'</div><span class="vignette-spark">*</span></div>';
}
`;
let sprites = await readFile('dist/sprites.js', 'utf8');
const hasProject = /export function projectSvg\(/.test(sprites);
const hasVignette = /export function vignette\(/.test(sprites);
if (hasProject !== hasVignette) throw new Error('Unexpected partial renderer patch');
if (!hasProject) sprites += additions;
await writeFile('dist/sprites.js', sprites);
await writeFile('sprites.js', sprites);
const app = await readFile('dist/app.js', 'utf8');
const patchedApp = app.replace(/from (['"])\.\/sprites\.js(?:\?[^'"]*)?\1/g, 'from "./sprites.js?fix='+fix+'"');
if (!patchedApp.includes('./sprites.js?fix='+fix)) throw new Error('Renderer import not found');
await writeFile('dist/app.js', patchedApp);
const html = await readFile('dist/index.html', 'utf8');
const patchedHTML = html.replace(/src="\.\/app\.js[^\"]*"/, 'src="./app.js?fix='+fix+'"');
if (!patchedHTML.includes('src="./app.js?fix='+fix+'"')) throw new Error('Entry script not found');
await writeFile('dist/index.html', patchedHTML);
const version = JSON.parse(await readFile('dist/version.json', 'utf8'));
version.fix = fix;
version.rendererSha256 = createHash('sha256').update(sprites).digest('hex');
await writeFile('dist/version.json', JSON.stringify(version));
console.log('Renderer startup repaired:', fix, version.rendererSha256);
