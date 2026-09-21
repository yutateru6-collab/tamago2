const escapeHTML=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export function mountLab(api,data){
 const old=document.querySelector('#dev-panel');if(old)old.hidden=true;
 document.documentElement.classList.add('lab-mode');
 const launcher=document.createElement('button');launcher.id='lab-open';launcher.type='button';launcher.textContent='開発室';launcher.setAttribute('aria-label','開発者モードを開く');document.querySelector('#demo-label').append(launcher);
 const d=document.createElement('dialog');d.id='lab-dialog';d.setAttribute('aria-labelledby','lab-title');
 d.innerHTML=`<header class="lab-header"><div><h2 id="lab-title">開発室</h2><p>通常データには触れません。すべて検証用。</p></div><button id="lab-close" aria-label="開発室を閉じる">×</button></header><div class="lab-tools"><input id="lab-search" type="search" aria-label="確認する機能を検索" placeholder="食事・探索・セリフなどを検索"><label><input id="lab-follow" type="checkbox" checked> 操作したら実画面を見る</label></div><nav class="lab-tabs" aria-label="検証カテゴリー"></nav><div id="lab-actions"></div><section class="lab-result"><h3>直前の操作</h3><output id="lab-operation">まだ操作していません。</output><p id="lab-delta"></p></section><details class="lab-inspector"><summary>現在の値・保存データを見る</summary><button id="lab-refresh">値を更新</button><button id="lab-export">検証データを書き出す</button><pre id="lab-state"></pre></details><section class="lab-diagnostics"><h3>機能チェック</h3><p>別の検証画面で本処理を動かします。今の検証データも変更しません。端末全体の使用時間や実機固有の動作を保証するものではありません。</p><button id="lab-check-all">全機能を自動チェック</button><button id="lab-check-stop" hidden>中止する</button><output id="lab-check-status">未実施</output><ol id="lab-check-results"></ol></section>`;
 document.body.append(d);let tab='care',last=null,checking=false,stop=false;
 const tabs={care:'世話と演出',states:'状態と10段階',time:'時間と休息',events:'自立32種',explore:'探索と図鑑',talk:'会話',save:'保存と画面'};
 const button=(id,label,value='')=>`<button data-lab="${id}" data-value="${escapeHTML(value)}">${escapeHTML(label)}</button>`;
 const common={
 care:[['meal','ごはんを食べる'],['snack','おやつを食べる'],['over-snack','おやつの食べすぎ'],['refuse','満腹でごはんを断る'],['cooldown','食事の連打を断る'],['toilet','うんちを流す'],['clean-empty','掃除不要の反応'],['medicine','病気を治療する'],['medicine-dirty','汚れが残ったまま治療'],['medicine-healthy','健康時の薬は断る'],['sleep','消灯して眠る'],['wake','点灯して起きる'],['win','ミニゲームで当たる'],['lose','ミニゲームではずれる'],['pet','なでる反応']],
 states:[['reset','たまごに戻す'],['hatch','孵化の演出'],['healthy','健康にする'],['hungry','空腹にする'],['full','満腹にする'],['dirty','うんち4個'],['sick','病気にする'],['death','お別れの状態'],['rebirth','次の世代を迎える'],...data.good.map(x=>['good-'+x.level,'良い '+x.level+'/5 · '+x.name]),...data.bad.map(x=>['bad-'+x.level,'悪い '+x.level+'/5 · '+x.name]),['evolutions','10の姿を一覧で見る']],
 time:[...['15','30','60'].flatMap(n=>[['rest-start',n+'分タイマーを開始',n],['rest-ready',n+'分経過・確認待ち',n],['rest-complete',n+'分休息→報告まで',n]]),['rest-conflict','画面を見続けた休息'],['away','タイマーなしで帰宅'],['screen','表示1分を進める','1'],['screen','表示10分を進める','10'],['screen','表示60分を進める','60'],['offline','未訪問1時間を進める'],['pause','自動悪化の停止／再開']],
 events:data.activities.map(x=>['event',x.title,x.id]),
 explore:[...data.creatures.map(x=>['capture',x.name+'を捕獲',x.id]),['footprints','15分の足あと探し'],['no-find','探索したが見つからない'],['blocked','悪化して支度で止まる'],['catalog','図鑑を開く'],['journal','帰宅報告の記録を見る']],
 talk:[['dialogue','次のセリフ'],['talk-reset','検証用セリフ履歴を初期化']],
 save:[['save','検証データを保存'],['load','検証データを読み直す'],...['food','toilet','medicine','light','play','explore','status','promise','rest'].map((id,i)=>['menu',['ごはん','トイレ','くすり','でんき','あそぶ','たんけん','ようす','やくそく','ひと休み'][i]+'を開く',id]),['journal','暮らしの記録'],['catalog','図鑑'],['evolutions','進化一覧']]
 };
 function refresh(){document.querySelector('#lab-state').textContent=JSON.stringify({paused:api.paused(),state:api.snapshot(),dialogue:api.dialogue(),errors:api.errors},null,2);}
 function draw(){
  d.querySelector('.lab-tabs').innerHTML=Object.entries(tabs).map(([id,name])=>`<button data-tab="${id}" aria-pressed="${id===tab}">${name}</button>`).join('');
  const q=d.querySelector('#lab-search').value.trim();let sections=q?Object.entries(common):[[tab,common[tab]]];
  d.querySelector('#lab-actions').innerHTML=sections.map(([id,entries])=>{const rows=entries.filter(row=>!q||row.join(' ').includes(q));return rows.length?`<section><h3>${tabs[id]}</h3><div class="lab-grid">${rows.map(row=>button(...row)).join('')}</div></section>`:'';}).join('')||'<p>一致する操作がありません。</p>';
  if(tab==='talk'&&!q){const t=api.dialogue();d.querySelector('#lab-actions').insertAdjacentHTML('beforeend',`<p class="lab-note">現在の状態で選ばれるセリフ：${t.eligible.length}種類。候補を一巡するまで使っていないものを優先し、再読込後も履歴を保持します。病気・眠り・悪化段階は「状態」で切替。</p><details><summary>現在の候補を全部見る</summary><ol class="lab-lines">${t.eligible.map(line=>`<li>${escapeHTML(line)}</li>`).join('')}</ol></details>`);}
  refresh();
 }
 const show=()=>{draw();if(!d.open)d.showModal();};launcher.onclick=show;d.querySelector('#lab-close').onclick=()=>d.close();d.querySelector('#lab-search').oninput=draw;d.querySelector('#lab-refresh').onclick=refresh;
 d.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.tab){tab=b.dataset.tab;draw();return;}if(!b.dataset.lab)return;
  try{last=api.run(b.dataset.lab,b.dataset.value);d.querySelector('#lab-operation').textContent=b.textContent+'：'+last.note;
   const changes=['hunger','happy','health','poops','growth','restMinutes','screenMinutes'].filter(k=>last.before[k]!==last.after[k]).map(k=>`${({hunger:'おなか',happy:'ごきげん',health:'健康',poops:'うんち',growth:'成長値',restMinutes:'休息分',screenMinutes:'表示分'})[k]} ${Number(last.before[k]).toFixed(1)} → ${Number(last.after[k]).toFixed(1)}`);
   d.querySelector('#lab-delta').textContent=changes.join(' ／ ')||'数値変化なし（画面・反応・拒否の確認）';refresh();
   if(d.querySelector('#lab-follow').checked&&b.dataset.lab!=='pause'&&b.dataset.lab!=='save')d.close();
  }catch(err){d.querySelector('#lab-operation').textContent='失敗：'+err.message;}
 });
 d.querySelector('#lab-export').onclick=()=>{const blob=new Blob([JSON.stringify({kind:'hitoiki-lab',state:api.snapshot(),dialogue:api.dialogue(),last},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='hitoiki-lab.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
 d.querySelector('#lab-check-stop').onclick=()=>{stop=true;};
 async function checkAll(){
  if(checking)return;checking=true;stop=false;
  const button=d.querySelector('#lab-check-all'),status=d.querySelector('#lab-check-status'),list=d.querySelector('#lab-check-results');button.disabled=true;list.replaceChildren();d.querySelector('#lab-check-stop').hidden=false;
  const frame=document.createElement('iframe');frame.title='独立した機能検証画面';frame.className='lab-test-frame';frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;
  const url=new URL(location.href);const token='run-'+Date.now().toString(36);url.search='?dev=1&selftest='+token;frame.src=url.href;document.body.append(frame);let count=0,failed=0;
  const assert=(ok,message)=>{if(!ok)throw new Error(message);};
  async function check(name,fn){if(stop)throw new Error('中止しました');const li=document.createElement('li');li.textContent=name+' …確認中';list.append(li);try{await fn();li.textContent='✓ '+name;li.dataset.result='pass';}catch(e){failed++;li.textContent='× '+name+'：'+e.message;li.dataset.result='fail';}count++;status.textContent=`${count}項目実施 / ${failed}項目失敗`;}
  try{
   const until=Date.now()+20000;while(!frame.contentWindow?.hitoikiLab&&Date.now()<until)await sleep(100);
   const a=frame.contentWindow?.hitoikiLab,doc=frame.contentDocument;assert(a,'検証画面が起動しませんでした');
   await check('起動・9メニュー・キャラ描画',()=>{a.run('healthy');assert(doc.querySelectorAll('[data-menu]').length===9,'メニュー不足');assert(doc.querySelector('#pet-body svg'),'キャラ不足');assert(a.errors.length===0,'実行エラーあり');});
   await check('たまご→孵化',()=>{a.run('reset');assert(!a.snapshot().hatched,'卵ではない');a.run('hatch');assert(a.snapshot().hatched,'孵化しない');});
   await check('良い5段階・悪い5段階の描き分け',()=>{const looks=new Set();for(const branch of ['good','bad'])for(let n=1;n<=5;n++){a.run(branch+'-'+n);const svg=doc.querySelector('#pet-body svg');assert(svg.dataset.look===branch+'-'+n,'段階不一致');looks.add(svg.innerHTML);}assert(looks.size===10,'見た目が重複');});
   for(const [id,expected] of [['meal','hunger'],['snack','happy'],['toilet','poops'],['medicine','sick']])await check('世話：'+id,()=>{a.run(id);const s=a.snapshot();assert(expected==='poops'?s.poops===0:expected==='sick'?!s.sick:expected==='hunger'?s.hunger>8:s.happy>65,'状態が変わらない');assert(doc.querySelector('#lcd').dataset.motion===id,'演出なし');});
   await check('満腹・連打・不要な薬の拒否',()=>{for(const id of ['refuse','cooldown','medicine-healthy']){a.run(id);assert(doc.querySelector('#lcd').dataset.motion==='refuse',id+'が拒否されない');}});
   await check('おやつの食べすぎで健康が下がる',()=>{a.run('over-snack');assert(a.snapshot().health<90,'健康が変わらない');});
   await check('睡眠→起床',()=>{a.run('sleep');assert(a.snapshot().sleeping,'眠らない');a.run('wake');assert(!a.snapshot().sleeping,'起きない');});
   await check('ミニゲームの当たり／はずれ',()=>{a.run('win');const win=a.snapshot().happy;a.run('lose');assert(win>a.snapshot().happy,'結果に差がない');});
   await check('15/30/60分・自己申告前は報酬なし・二重加算防止',()=>{for(const n of [15,30,60]){a.run('rest-ready',n);const before=a.snapshot().restMinutes;assert(doc.querySelector('[data-choice="confirm-rest"]'),'確認ボタンなし');doc.querySelector('[data-choice="confirm-rest"]').click();assert(a.snapshot().restMinutes===before+n,'加算不一致');const after=a.snapshot().restMinutes;doc.querySelector('[data-choice="confirm-rest"]')?.click();assert(a.snapshot().restMinutes===after,'二重加算');}});
   await check('見続けたタイマーを拒否',()=>{a.run('rest-conflict');assert(!doc.querySelector('[data-choice="confirm-rest"]'),'報酬を受け取れる');});
   await check('タイマーなしの帰宅・申告で確定',()=>{a.run('away');const n=a.snapshot().restMinutes;doc.querySelector('[data-choice="confirm-away"]').click();assert(a.snapshot().restMinutes===n+30,'帰宅処理不一致');});
   await check('未訪問だけでは悪化も報酬もなし',()=>{a.run('healthy');const b=a.snapshot();a.run('offline');const c=a.snapshot();assert(b.health===c.health&&b.growth===c.growth&&b.restMinutes===c.restMinutes,'未訪問が報酬・悪化になった');});
   await check('長時間表示で悪化',()=>{a.run('good-3');const b=a.snapshot().growth;a.run('screen',60);assert(a.snapshot().growth<b,'悪化しない');});
   for(const ev of data.activities)await check('自立：'+ev.title,()=>{a.run('event',ev.id);assert(a.snapshot().world.counts[ev.id]>0,'記録なし');assert(doc.querySelector('.memory-card'),'報告なし');});
   for(const c of data.creatures)await check('捕獲・画像：'+c.name,async()=>{a.run('capture',c.id);assert(a.snapshot().world.captures.some(v=>v.id===c.id),'図鑑登録なし');const img=doc.querySelector('.capture-peek img');assert(img,'画像なし');await Promise.race([img.decode(),sleep(10000).then(()=>{throw new Error('画像読込タイムアウト');})]);assert(img.naturalWidth>0,'画像破損');});
   for(const [id,kind] of [['footprints','footprints'],['no-find','footprints'],['blocked','preparation']])await check('探索：'+id,()=>{a.run(id);assert(a.snapshot().journey.memories.at(-1).encounter.kind===kind,'探索結果不一致');});
   await check('会話の連続重複なし・24種類の出し分け',()=>{a.run('healthy');a.run('good-1');a.run('talk-reset');const lines=Array.from({length:24},()=>a.next());assert(new Set(lines).size===24,'セリフが重複');});
   await check('悪化5段階で口調を切り替える',()=>{const lines=[];for(let i=1;i<=5;i++){a.run('bad-'+i);lines.push(a.next());}assert(new Set(lines).size===5,'口調不一致');});
   await check('保存→読み込み',()=>{a.run('healthy');const n=a.snapshot().world.captures.length;a.run('save');a.run('load');assert(a.snapshot().world.captures.length===n,'保存が復元されない');});
   await check('お別れ→次の世代',()=>{a.run('death');assert(a.snapshot().dead,'お別れにならない');const n=a.snapshot().generation;a.run('rebirth');assert(!a.snapshot().dead&&a.snapshot().generation===n+1,'再スタート失敗');});
   await check('テスト中の実行エラーなし',()=>assert(a.errors.length===0,JSON.stringify(a.errors)));
   status.textContent=`完了：${count-failed}/${count}成功${failed?' · 失敗項目を確認してください':' · このブラウザで確認できる範囲'}`;
  }catch(e){status.textContent=e.message;}finally{const key=frame.contentWindow?.hitoikiLab?.key;frame.remove();if(key&&key.startsWith('tamago2.lab.check.')){try{localStorage.removeItem(key);localStorage.removeItem(key+'.dialogue');}catch{}}checking=false;button.disabled=false;d.querySelector('#lab-check-stop').hidden=true;refresh();}
 }
 d.querySelector('#lab-check-all').onclick=checkAll;
 api.open=show;api.checkAll=checkAll;draw();
}
