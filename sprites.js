// Original monochrome sprites. Separate moving feet, ears and eyelids, not a warped still image.
const r = (x,y,w,h,c='ink') => `<rect class="${c}" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
const svg = (body,box='0 0 16 16',label='') => `<svg viewBox="${box}" shape-rendering="crispEdges" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${body}</svg>`;
const icons = {
 meal: r(3,7,10,2)+r(4,9,8,3)+r(6,12,4,1)+r(5,4,2,2)+r(8,2,2,3)+r(11,4,1,2),
 snack: r(3,6,10,7)+r(4,4,8,2)+r(7,2,2,2)+r(5,8,2,2,'cut')+r(9,10,2,2,'cut'),
 toilet: r(9,2,4,6)+r(3,7,10,2)+r(4,9,8,3)+r(8,12,3,2)+r(10,3,2,2,'cut'),
 medicine:r(3,6,10,4)+r(6,3,4,10)+r(7,6,2,4,'cut'),
 light:r(5,2,6,2)+r(3,4,10,5)+r(5,9,6,2)+r(6,12,4,1)+r(5,4,6,4,'cut'),
 play:r(2,6,12,7)+r(4,4,8,2)+r(4,8,4,1,'cut')+r(5,7,1,3,'cut')+r(10,8,2,2,'cut'),
 status:r(3,3,4,3)+r(9,3,4,3)+r(2,5,12,4)+r(4,9,8,2)+r(6,11,4,2)+r(7,13,2,1),
 discipline:r(7,2,2,7)+r(5,8,6,5)+r(3,9,2,2)+r(11,7,2,4),
 rest:r(3,3,7,2)+r(8,5,2,2)+r(5,7,3,2)+r(3,9,7,2)+r(10,11,4,1)+r(12,12,1,1)+r(10,13,4,1),
 poop:r(7,3,3,2)+r(5,5,6,3)+r(3,8,10,3)+r(2,11,12,2),
 heart:r(2,3,5,4)+r(9,3,5,4)+r(2,6,12,3)+r(4,9,8,2)+r(6,11,4,2),
 egg:r(6,2,4,2)+r(4,4,8,3)+r(3,7,10,5)+r(5,12,6,2)+r(7,7,2,3,'cut'),
 skull:r(4,3,8,2)+r(2,5,12,6)+r(5,11,6,3)+r(4,6,3,3,'cut')+r(9,6,3,3,'cut')+r(7,11,2,2,'cut')
};
export function icon(name) { return svg(icons[name] || icons.heart); }
export function pet(s) {
  if (s.dead) return svg(r(12,4,8,2)+r(10,6,12,2)+r(11,5,10,1,'cut')+'<g class="angel">'+r(10,14,12,12)+r(6,16,4,6)+r(22,16,4,6)+r(13,26,2,2)+r(18,26,2,2)+r(13,18,2,2,'cut')+r(17,18,2,2,'cut')+'</g>', '0 0 32 32','おわかれした子');
  if (!s.hatched) return svg('<g class="egg-motion">'+r(13,5,6,2)+r(10,7,12,3)+r(8,10,16,5)+r(7,15,18,10)+r(10,25,12,3)+r(10,11,12,13,'cut')+r(9,16,14,8,'cut')+r(14,13,3,3)+r(16,17,3,3)+r(12,20,3,2)+'</g>', '0 0 32 32','揺れるたまご');
  const f = s.form;
  let p = '';
  if (f >= 2) p += '<g class="ear ear-left">'+r(7,5,4,8)+r(8,6,2,4,'cut')+'</g><g class="ear ear-right">'+r(21,5,4,8)+r(22,6,2,4,'cut')+'</g>';
  if (f >= 3) p += '<g class="tail">'+r(25,21,4,3)+r(28,18,2,5)+'</g>';
  if (f === 4) p += r(13,4,2,6)+r(15,3,3,2)+r(18,5,2,4);
  p += r(11,10,10,2)+r(8,12,16,3)+r(6,15,20,9)+r(8,24,16,4);
  // Hollow face is essential: dark eyes on light LCD, NOT black-on-black.
  p += r(10,13,12,2,'cut')+r(8,15,16,8,'cut')+r(10,23,12,3,'cut');
  p += '<g class="eyes-open">'+r(11,16,3,4)+r(18,16,3,4)+r(11,16,1,1,'cut')+r(18,16,1,1,'cut')+'</g>';
  p += '<g class="eyes-shut">'+r(10,19,4,1)+r(18,19,4,1)+'</g>';
  p += '<g class="mouth-rest">'+r(15,22,3,1)+'</g><g class="mouth-eat">'+r(14,21,4,3)+'</g>';
  if (f >= 3) p += r(12,24,2,1)+r(18,24,2,1);
  p += '<g class="foot foot-left">'+r(7,28,6,2)+'</g><g class="foot foot-right">'+r(19,28,6,2)+'</g>';
  return svg(p, '0 0 32 32','まめ・'+['','あかちゃん','こども','わかもの','おとな'][f]);
}
