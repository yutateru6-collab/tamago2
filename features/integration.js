// Appended to app.js by the explicit feature installer. Uses the existing app
// commands: test controls never substitute fake HTML for a gameplay operation.
dialogue = createDialogue({getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v)},KEY+'.dialogue');
function idleDialogue() {
 const allowed=visible&&!ui.panel&&!busy()&&!document.querySelector('dialog[open]');
 return dialogue.idle(s,allowed);
}
if(DEV){
 const copy=v=>JSON.parse(JSON.stringify(v));
 const closeOverlays=()=>{document.querySelectorAll('dialog[open]').forEach(d=>{if(d.id!=='lab-dialog')d.close();});ui=initialUI();};
 const ready=(patch={})=>{s.dead=false;s.hatched=true;s.sleeping=false;s.sick=false;s.health=90;s.hunger=54;s.happy=65;s.poops=0;s.clean=100;s.rest=null;s.pendingAway=null;s.awayAt=null;s.lastMeal=0;s.lastSnack=0;s.lastMedicine=0;s.lastPlay=0;s.lastAt=Date.now();Object.assign(s,patch);};
 const newScenario=(patch={})=>{s=fresh();ready(patch);};
 function timeReady(minutes=30,route=s.world.route,area=s.world.area){
  const now=Date.now(),ph=evolution(s);s.pendingAway=null;
  s.rest={startedAt:now-minutes*60000,readyAt:now,minutes,intent:s.journey.promise.intent,screenStart:s.screenMinutes,route,area,badStart:ph.branch==='bad'?ph.level:0};ui.panel='rest';
 }
 const api={
  snapshot:()=>copy(s),key:KEY, errors:labErrors,
  paused:()=>labPaused,
  replace(value){s=normalize(copy(value));closeOverlays();s.lastAt=Date.now();save();render();},
  finish(){ui.until=0;render();},
  next(){const line=dialogue.next(s);ui.message=line;ui.messageUntil=Date.now()+8000;render();return line;},
  dialogue:()=>({eligible:dialogue.all(s),...dialogue.info()}),
  run(id,value){
   const before=copy(s);closeOverlays();let note='検証データだけを変更しました。';
   if(id==='reset'){s=fresh();s.hatchAt=Date.now()+86400000;note='検証用のたまごに戻しました。通常データには触れていません。';}
   else if(id==='hatch'){s=fresh();hatch(s,Date.now(),true);animate('evolve','よろしくね。じぶんで、やってみたいな。');}
   else if(id==='healthy')ready();
   else if(/^(good|bad)-[1-5]$/.test(id)){ready();dev(id);animate(id.startsWith('good')?'evolve':'decline');}
   else if(id==='hungry')ready({hunger:8});
   else if(id==='full')ready({hunger:100});
   else if(id==='dirty')ready({poops:4,clean:4});
   else if(id==='sick')ready({sick:true,health:20});
   else if(id==='death'){ready();s.health=0;recompute(s);}
   else if(id==='rebirth'){ready();s.health=0;recompute(s);choose('new-egg');}
   else if(id==='meal'){ready({hunger:8});perform('meal');note='空腹を用意して、本物のごはん処理を実行しました。';}
   else if(id==='snack'){ready();s.snackCount=0;perform('snack');}
   else if(id==='over-snack'){ready();s.snackCount=3;s.snackWindow=Date.now();perform('snack');}
   else if(id==='refuse'){ready({hunger:100});perform('meal');}
   else if(id==='cooldown'){ready({hunger:8,lastMeal:Date.now()});perform('meal');}
   else if(id==='toilet'){ready({poops:2,clean:52});perform('toilet');}
   else if(id==='clean-empty'){ready();perform('toilet');}
   else if(id==='medicine'){ready({sick:true,health:20});perform('medicine');}
   else if(id==='medicine-dirty'){ready({sick:true,health:20,poops:4,clean:4});perform('medicine');}
   else if(id==='medicine-healthy'){ready();perform('medicine');}
   else if(id==='sleep'){ready();perform('light');}
   else if(id==='wake'){ready({sleeping:true});perform('light');}
   else if(id==='pet'){ready();animate('pet','えへへ。次は、じぶんでやってみるね。');}
   else if(id==='win'||id==='lose'){ready();ui.gameTarget=id==='win'?0:1;choose('left');}
   else if(id==='menu'){if(value==='rest'){ready();}activate(value);}
   else if(id==='rest-start'){ready();startRest(s,Date.now(),Number(value)||30);ui.panel='rest';}
   else if(id==='rest-ready'){ready();timeReady(Number(value)||30);note='時間だけを早送り。まだ報酬はありません。「置けた」で本処理を試せます。';}
   else if(id==='rest-complete'){ready();timeReady(Number(value)||30);choose('confirm-rest');note='タイマー完了→自己申告→報告の本処理を実行。';}
   else if(id==='rest-conflict'){ready();timeReady(30);s.screenMinutes+=10;ui.panel='rest';note='表示し続けた条件。報酬を受け取れないか確認してください。';}
   else if(id==='away'){ready();markAway(s,Date.now()-1800000);prepareReturn(s);ui.panel='return';note='未訪問だけでは報酬なし。帰宅時の自己確認を試せます。';}
   else if(id==='screen'){if(!s.hatched||s.dead)ready();advance(s,Number(value)||60,{screen:true});animate('decline');note='この画面の使用時間をシミュレーション。端末全体の実測ではありません。';}
   else if(id==='offline'){if(!s.hatched||s.dead)ready();advance(s,60,{offline:true});note='未訪問の1時間。報酬・使用時間・悪化を加算しません。';}
   else if(id==='event'){
    const a=activity(value);if(!a)throw new Error('不明なイベント');ready();applyActivity(s,a);
    const seq=++s.journey.completed;s.journey.unlocked=Math.min(6,seq);
    s.journey.memories.push({seq,story:0,minutes:15,intent:'rest',at:Date.now(),events:[a.id],encounter:null,limited:false});s.journey.memories=s.journey.memories.slice(-30);completed();note='指定した自立行動を検証データに実行し、作品・状態・報告へ反映しました。';
   }
   else if(id==='capture'){
    const c=species(value);if(!c)throw new Error('不明な生物');ready({growth:180});s.world.captures=[];s.world.visits[c.area]=0;
    const pool=CREATURES.filter(x=>x.area===c.area);if(pool[0].id!==c.id)s.world.captures.push({id:pool[0].id,count:1,firstAt:Date.now(),lastAt:Date.now()});
    timeReady(30,'explore',c.area);choose('confirm-rest');note='出会う条件を用意し、探索の本処理から捕獲・画像・図鑑を確認。';
   }
   else if(id==='footprints'||id==='no-find'||id==='blocked'){
    ready({growth:id==='blocked'?-120:30});s.world.visits[s.world.area]=id==='no-find'?2:0;
    timeReady(id==='footprints'?15:30,'explore');choose('confirm-rest');
   }
   else if(id==='catalog')openCatalog();
   else if(id==='journal')openJournal();
   else if(id==='evolutions')openEvolutions();
   else if(id==='dialogue'){note=api.next();}
   else if(id==='pause'){labPaused=!labPaused;note=labPaused?'表示による自動悪化を停止。手動の時間操作は使えます。':'実時間の表示による悪化を再開しました。';}
   else if(id==='save'){save();note='検証データをこのブラウザに保存しました。';}
   else if(id==='load'){s=load();note='保存した検証データを読み直しました。';}
   else if(id==='talk-reset'){dialogue.clear();note='検証モードのセリフ履歴だけを初期化しました。';}
   else throw new Error('未対応の操作: '+id);
   recompute(s);s.lastAt=Date.now();save();render();
   return {id,note,before,after:copy(s),motion:ui.motion,panel:ui.panel};
  }
 };
 window.hitoikiLab=api;
 mountLab(api,{activities:ACTIVITIES,creatures:CREATURES,good:GOOD,bad:BAD,bank:BANK});
}
render();
