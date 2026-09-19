const KEY='tamago2.pixel.v1';
const GOALS=[
  '木のランプをつくる','宝物の棚をつくる','小さな植物を育てる',
  '葉っぱの額縁を飾る','やわらかな座布団を置く','お茶の時間をつくる','もっと暮らしを育てる'
];
const REWARDS=['木のランプ','宝物の棚','小さな植物','葉っぱの額縁','やわらかな座布団','お茶セット'];
const palette={outline:'#22332d',fur:'#5e8f82',fur2:'#7eb1a2',cream:'#f0dfb8',eye:'#182723',bag:'#9c684b',coral:'#c67663',hammer:'#d2b16f'};
let state=load();
let forcedFrame=null;
let reactionTimer=null;
const dev=new URLSearchParams(location.search).get('dev')==='1';

function fresh(){return{version:1,sessions:0,quietMinutes:0,vitality:70,overuse:0,quiet:null};}
function load(){try{const v=JSON.parse(localStorage.getItem(KEY));return v&&v.version===1?v:fresh();}catch{return fresh();}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));}
function stage(){return Math.min(6,state.sessions);}
function mood(){return state.vitality<40?'tired':'idle';}
function goal(){return GOALS[Math.min(state.sessions,GOALS.length-1)];}

function rect(x,y,w,h,fill){return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;}
function sprite(frame=mood()){
  const p=palette;let parts='';
  parts+=rect(6,6,5,8,p.outline)+rect(21,6,5,8,p.outline);
  parts+=rect(7,7,3,7,p.fur2)+rect(22,7,3,7,p.fur2);
  parts+=rect(8,9,16,15,p.outline)+rect(9,10,14,14,p.fur);
  parts+=rect(10,11,12,4,p.fur2);
  parts+=rect(11,19,10,5,p.cream);
  parts+=rect(7,22,5,5,p.outline)+rect(20,22,5,5,p.outline);
  parts+=rect(8,22,4,4,p.fur)+rect(20,22,4,4,p.fur);
  parts+=rect(21,18,5,7,p.bag);
  if(frame==='blink'){
    parts+=rect(11,14,3,1,p.eye)+rect(18,14,3,1,p.eye);
  }else if(frame==='happy'){
    parts+=rect(11,13,1,1,p.eye)+rect(13,14,1,1,p.eye)+rect(18,14,1,1,p.eye)+rect(20,13,1,1,p.eye);
    parts+=rect(15,17,2,1,p.coral);
  }else if(frame==='tired'){
    parts+=rect(11,14,3,1,p.eye)+rect(18,14,3,1,p.eye)+rect(14,18,4,1,p.eye);
    parts+=rect(5,5,5,3,p.fur)+rect(22,5,5,3,p.fur);
  }else{
    parts+=rect(11,13,3,3,p.eye)+rect(18,13,3,3,p.eye);
    parts+=rect(12,13,1,1,'#dce9df')+rect(19,13,1,1,'#dce9df');
    parts+=rect(15,17,2,1,p.eye);
  }
  if(frame==='craft'){
    parts+=rect(4,18,6,2,p.outline)+rect(3,17,4,4,p.hammer)+rect(6,20,2,7,p.hammer);
  }
  return `<svg viewBox="0 0 32 32" role="img" aria-label="Soft Pixelの青緑色の小さなキャラクター">${parts}</svg>`;
}

function render(){
  const current=forcedFrame||mood();
  const app=document.querySelector('#app');
  if(!app.innerHTML){
    app.innerHTML=`
      <div class="app">
        <header class="topbar"><div class="brand"><small>SOFT PIXEL TAMAGO</small><strong>こもれびの巣</strong></div><div class="level"></div></header>
        <div class="room-wrap"><section class="room" data-stage="0" data-state="idle" aria-label="キャラクターの住処">
          <div class="window"><span class="moon"></span></div><div class="floor-grid"></div>
          <div class="decor lamp" aria-label="木のランプ"></div><div class="decor shelf" aria-label="宝物の棚"></div><div class="decor plant" aria-label="小さな植物"></div><div class="decor frame" aria-label="葉っぱの額縁"></div><div class="decor cushion" aria-label="座布団"></div><div class="decor tea" aria-label="お茶セット"></div>
          <span class="state-chip"></span><div class="shadow"></div><div class="sprite-stage"></div><div class="growth-pop" hidden><span>✦</span></div>
        </section></div>
        <section class="stats"><div class="stat"><small>休んだ時間</small><strong data-stat="minutes"></strong></div><div class="stat"><small>暮らし</small><strong data-stat="stage"></strong></div><div class="stat"><small>元気</small><strong data-stat="vitality"></strong></div></section>
        <section class="goal"><small>つぎの楽しみ</small><strong data-goal></strong></section>
        <section class="actions"><button class="primary" data-action="rest">30分、スマホを置く</button><button class="secondary" data-action="overuse">今日は見すぎた（自己申告）</button><p class="note">Web版は他アプリの使用を検知しません。休めた時間も、使いすぎも自己申告です。</p></section>
        <section class="dev"><h3>DEV · 少数フレームで状態を試す</h3><div class="dev-grid"><button data-frame="idle">idle</button><button data-frame="blink">blink</button><button data-frame="happy">happy</button><button data-frame="tired">tired</button><button data-frame="craft">craft</button><button class="advance" data-action="advance">30分経過させる</button></div></section>
        <section class="rest-overlay" hidden><div class="rest-sprite"></div><h2>画面を閉じて、大丈夫。</h2><p>この子はここで待っています。<br>戻ったら「休めた」と教えてください。</p><div class="timer">30:00</div><button class="primary" data-action="complete" hidden>30分、休めた</button><button class="secondary" data-action="cancel">今回はやめる</button></section>
        <div class="toast" hidden></div>
      </div>`;
    bind();
  }
  document.querySelector('.level').textContent=`暮らし Lv.${stage()+1}`;
  const room=document.querySelector('.room');room.dataset.stage=String(stage());room.dataset.state=current;
  document.querySelector('.state-chip').textContent=state.vitality<40?'ちょっと疲れぎみ':current==='happy'?'うれしそう':'のんびり';
  document.querySelector('.sprite-stage').innerHTML=sprite(current);
  document.querySelector('[data-stat="minutes"]').textContent=`${state.quietMinutes}分`;
  document.querySelector('[data-stat="stage"]').textContent=`${stage()}/6`;
  document.querySelector('[data-stat="vitality"]').textContent=`${state.vitality}/100`;
  document.querySelector('[data-goal]').textContent=goal();
  document.querySelector('.dev').classList.toggle('on',dev);
  document.querySelector('.rest-overlay').hidden=!state.quiet;
  if(state.quiet) document.querySelector('.rest-sprite').innerHTML=sprite('idle');
  updateTimer();
}
function bind(){
  document.querySelector('[data-action="rest"]').onclick=startRest;
  document.querySelector('[data-action="complete"]').onclick=completeRest;
  document.querySelector('[data-action="cancel"]').onclick=cancelRest;
  document.querySelector('[data-action="overuse"]').onclick=reportOveruse;
  document.querySelector('[data-action="advance"]').onclick=()=>{if(!state.quiet)startRest();state.quiet.endsAt=Date.now()-1;save();updateTimer();};
  document.querySelectorAll('[data-frame]').forEach(b=>b.onclick=()=>{forcedFrame=b.dataset.frame;render();setTimeout(()=>{forcedFrame=null;render();},1800);});
}
function startRest(){
  if(!state.quiet){state.quiet={startedAt:Date.now(),endsAt:Date.now()+30*60*1000};save();}
  render();
}
function cancelRest(){state.quiet=null;save();render();}
function completeRest(){
  if(!state.quiet||Date.now()<state.quiet.endsAt)return;
  const before=stage();state.sessions++;state.quietMinutes+=30;state.vitality=Math.min(100,state.vitality+12);state.quiet=null;save();
  forcedFrame='happy';render();showGrowth(before<stage()?REWARDS[stage()-1]:'この子が元気になった');
  clearTimeout(reactionTimer);reactionTimer=setTimeout(()=>{forcedFrame=null;render();},2200);
}
function reportOveruse(){
  if(!confirm('30分ぶん見すぎた、と自己申告しますか？'))return;
  state.overuse++;state.vitality=Math.max(0,state.vitality-18);save();forcedFrame='tired';render();showToast('少し疲れたみたい。次の休息で戻せます。');
  setTimeout(()=>{forcedFrame=null;render();},2200);
}
function updateTimer(){
  if(!state.quiet)return;
  const left=Math.max(0,Math.ceil((state.quiet.endsAt-Date.now())/1000));
  const timer=document.querySelector('.timer');if(timer)timer.textContent=`${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}`;
  const complete=document.querySelector('[data-action="complete"]');if(complete)complete.hidden=left>0;
}
function showGrowth(name){const pop=document.querySelector('.growth-pop');pop.hidden=false;showToast(`${name} が暮らしに増えました。`);setTimeout(()=>pop.hidden=true,1800);}
function showToast(text){const t=document.querySelector('.toast');t.textContent=text;t.hidden=false;setTimeout(()=>t.hidden=true,2600);}
function blinkLoop(){if(!forcedFrame&&!state.quiet&&mood()==='idle'){forcedFrame='blink';render();setTimeout(()=>{forcedFrame=null;render();},150);}setTimeout(blinkLoop,2600+Math.random()*3800);}
setInterval(updateTimer,1000);render();setTimeout(blinkLoop,3200);
