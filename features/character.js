import { evolution } from './world.js';
export const ART_VERSION='character-polish-20260921-01';
export const ART_URL='./mame-sheet.png?v='+ART_VERSION;
export const POSES=['idle','breathe','blink','glance','happy','ready','eat-a','eat-b','bow','sleep','sick','refuse','stretch','wave','step-a','step-b'];
export const LOOKS=['neutral-0',...Array.from({length:5},(_,i)=>'good-'+(i+1)),...Array.from({length:5},(_,i)=>'bad-'+(i+1)),'egg','departed'];
// Preserve the existing pet renderer contract. One SVG viewport clips an indexed
// native-resolution atlas. Each state is an authored cel, never a stretched limb.
export function pet(s,preview){
 const ph=preview&&/^(good|bad)-[1-5]$/.test(preview)?{key:preview,name:preview}:evolution(s);
 const kind=s.dead?'departed':!s.hatched?'egg':ph.key;
 const row=Math.max(0,LOOKS.indexOf(kind));
 const label=s.dead?'おわかれしたまめ':!s.hatched?'まめのたまご':'まめ・'+ph.name;
 const frames=POSES.map((name,i)=>`<g class="pc-frame pc-frame-${i}" data-pose="${name}" aria-hidden="true"><image href="${ART_URL}" x="${-40*i}" y="${-44*row}" width="640" height="572" preserveAspectRatio="none"/></g>`).join('');
 return `<svg class="pc-character" viewBox="0 0 40 44" width="40" height="44" overflow="hidden" shape-rendering="crispEdges" role="img" aria-label="${label}" data-art="${ART_VERSION}" data-kind="${kind}" data-look="${ph.key}">${frames}<g class="pc-fallback" aria-hidden="true"><path fill="#edf2ce" stroke="#33432b" stroke-width="2" d="M14 14h12v2h4v4h2v14h-4v4H12v-4H8V20h2v-4h4z"/><path fill="#33432b" d="M13 22h3v4h-3zm11 0h3v4h-3zm-6 8h5v1h-5z"/></g></svg>`;
}
