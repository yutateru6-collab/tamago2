import { CREATURES, AREAS, species } from './world.js';
export const CATALOG_FIX = 'catalog-face-20260921-01';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function imageURL(id, variant = 'full') {
  const c = species(id);
  if (!c) return '';
  const path = variant === 'original' ? './creatures/' + c.file : './catalog/' + c.id + (variant === 'thumb' ? '-thumb' : '') + '.webp';
  return new URL(path + '?v=' + CATALOG_FIX, import.meta.url).href;
}
export function catalogPicture(id, variant = 'thumb') {
  const c = species(id); if (!c) return '';
  return `<span class="catalog-picture ${variant === 'full' ? 'catalog-full' : ''}" data-image-state="loading"><img class="${variant === 'full' ? 'creature-portrait' : 'catalog-thumbnail'}" data-catalog-id="${c.id}" data-variant="${variant}" src="${esc(imageURL(c.id,variant))}" alt="${esc(c.name)}の図鑑画像" decoding="async" loading="eager"><span class="catalog-image-status" role="status">画像を読み込み中…</span></span>`;
}
const watching = new WeakMap();
function watchImage(img) {
  if (watching.has(img)) return;
  let timer, fallback = false;
  const box = img.closest('.catalog-picture'); if (!box) return;
  const label = box.querySelector('.catalog-image-status');
  const set = (state,message) => {box.dataset.imageState = state; label.textContent = message;};
  const loaded = () => {if(img.naturalWidth > 0){clearTimeout(timer);set('ready','');img.dataset.decoded='true';}};
  const delayed = () => {clearTimeout(timer);timer=setTimeout(()=>{if(img.isConnected && !img.naturalWidth)set('slow','読み込みに時間がかかっています。詳細画面で再試行できます。');},8000);};
  const failed = () => {
    clearTimeout(timer);
    if(!fallback){fallback=true;set('loading','元の画像を読み込んでいます…');img.src=imageURL(img.dataset.catalogId,'original');delayed();}
    else {img.dataset.decoded='false';set('error','画像を読み込めませんでした。再試行してください。');}
  };
  watching.set(img, {retry(){fallback=false;delete img.dataset.decoded;set('loading','画像を再読み込み中…');img.src=imageURL(img.dataset.catalogId,img.dataset.variant)+'&retry='+Date.now();delayed();}});
  img.addEventListener('load',loaded);img.addEventListener('error',failed);delayed();
  if(img.complete){if(img.naturalWidth)loaded();else failed();}
}
export function observeCatalogImages(root=document) {
  const scan=node=>{if(node.nodeType!==1&&node.nodeType!==9)return;if(node.matches?.('img[data-catalog-id]'))watchImage(node);node.querySelectorAll?.('img[data-catalog-id]').forEach(watchImage);};
  scan(root);
  const observer=new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(scan)));
  observer.observe(root,{childList:true,subtree:true});return ()=>observer.disconnect();
}
export function retryCatalogImage(img) { if(img)watching.get(img)?.retry(); }
export async function checkCatalogImages({timeout=12000,onResult=()=>{}}={}) {
  const results=[];
  for(const c of CREATURES){
    const row={id:c.id,name:c.name};
    await Promise.all(['thumb','full','original'].map(variant=>new Promise(resolve=>{
      const image=new Image();const started=performance.now();let done=false;
      const finish=(ok,reason)=>{if(done)return;done=true;clearTimeout(timer);image.onload=null;image.onerror=null;row[variant]={ok,width:image.naturalWidth,height:image.naturalHeight,ms:Math.round(performance.now()-started),reason,url:imageURL(c.id,variant)};resolve();};
      const timer=setTimeout(()=>finish(false,'timeout'),timeout);
      image.onload=()=>finish(image.naturalWidth>0,'loaded');image.onerror=()=>finish(false,'load-error');image.src=imageURL(c.id,variant)+'&check='+Date.now();
    })));
    row.ok=['thumb','full','original'].every(v=>row[v].ok);results.push(row);onResult(row);
  }
  return results;
}
export function createCatalog({state,dev=false}) {
  const dialog=document.querySelector('#catalog-dialog'),body=document.querySelector('#catalog-content'),heading=document.querySelector('#catalog-heading');
  let preview=dev,checking=false,lastCheck=null;
  function open(id) {
    const s=state(),c=species(id),owned=c&&s.world.captures.find(v=>v.id===c.id);
    const showAll=dev&&preview;
    heading.textContent=c&&(owned||showAll)?c.name:'異世界の生き物図鑑';
    if(c&&(owned||showAll)){
      body.innerHTML=`<div class="creature-detail">${catalogPicture(c.id,'full')}<button class="catalog-retry" data-catalog-action="retry">画像を再読み込み</button><p class="creature-number">No.${c.id} · ${esc(AREAS[c.area])} · ${owned?owned.count+'回出会った':'未捕獲・開発用プレビュー'}</p><p>${esc(c.note)}</p><p class="panel-small">ゲーム内の架空の生き物です。${owned?'捕獲して観察したあと、元の場所へ帰しています。':'これは画像の見本です。捕獲記録は追加しません。'}</p><button class="dialog-done" data-catalog-action="list">図鑑の一覧に戻る</button></div>`;
    }else{
      body.innerHTML=`${dev?`<div class="catalog-dev-tools"><p>開発用：画像の見本と、実際の捕獲記録は別です。</p><button data-catalog-action="preview" aria-pressed="${preview}">${preview?'全画像を表示中':'捕獲済みのみ表示中'}</button><button data-catalog-action="check">6種類の画像をチェック</button><output id="catalog-check-result" aria-live="polite">${lastCheck?`${lastCheck.filter(r=>r.ok).length}/6種類 読み込み成功`:''}</output></div>`:''}<p>${s.world.captures.length} / ${CREATURES.length}種類を発見${showAll?' · 未発見の画像も検証表示':''}</p><div class="creature-grid">${CREATURES.map(c=>{const found=s.world.captures.some(v=>v.id===c.id),shown=found||showAll;return `<button class="creature-card ${found?'':'undiscovered'}" ${shown?`data-catalog-open="${c.id}"`:'disabled'} aria-label="${shown?esc(c.name):'未発見 '+esc(AREAS[c.area])}">${shown?catalogPicture(c.id):'<span class="unknown-creature">?</span>'}<strong>${shown?esc(c.name):'まだ見ぬ生き物'}</strong><small>${found?'発見済み':showAll?'未捕獲・見本':'未発見・探索で画像が開きます'}</small><small>${esc(AREAS[c.area])}</small></button>`;}).join('')}</div><p class="panel-small">「たんけん」で行き先を選んでひと休み。帰宅時の確認後、出会えた生き物の画像が図鑑に残ります。</p>`;
    }
    if(!dialog.open)dialog.showModal();
    // A long list must not leave a newly opened portrait scrolled past its title.
    dialog.scrollTop=0;body.scrollTop=0;
    dialog.querySelector('[data-action="close-catalog"]')?.focus({preventScroll:true});
  }
  async function check() {
    if(!dev||checking)return;checking=true;
    open();let output=body.querySelector('#catalog-check-result');if(output)output.textContent='0/6種類 確認中…';
    let n=0;
    try {lastCheck=await checkCatalogImages({onResult:r=>{n++;output=body.querySelector('#catalog-check-result');if(output)output.textContent=`${n}/6種類確認 · ${r.name} ${r.ok?'成功':'失敗'}`;}});
      output=body.querySelector('#catalog-check-result');if(output)output.textContent=`完了：${lastCheck.filter(r=>r.ok).length}/6種類 成功（各サムネイル・詳細・原画像）`;
    } finally {checking=false;}
    return lastCheck;
  }
  dialog.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.catalogOpen){open(b.dataset.catalogOpen);return;}
    switch(b.dataset.catalogAction){case 'retry':retryCatalogImage(body.querySelector('img[data-catalog-id]'));break;case 'list':open();break;case 'preview':preview=!preview;open();break;case 'check':check();break;}
  });
  return {open,check,preview(){preview=true;open();},results:()=>lastCheck};
}
