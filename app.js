import { RELEASE, STAGES, fresh, normalize, hatch, advance, recompute, care, condition, attention, restReward, startRest, confirmRest } from './engine.js';
import { icon, pet } from './sprites.js';
import { DURATIONS, INTENTS, STORIES, setPromise, latestMemory } from './journey.js';
const DEV = new URLSearchParams(location.search).get('dev') === '1';
const KEY = DEV ? 'tamago2.care.v3.demo' : 'tamago2.care.v3';
const $ = selector => document.querySelector(selector);
const menus = [ ['food','meal','ごはん'], ['toilet','toilet','トイレ'], ['medicine','medicine','くすり'], ['light','light','でんき'], ['play','play','あそぶ'], ['status','status','ようす'], ['promise','promise','やくそく'], ['rest','rest','ひと休み'] ];
let s = load();
let visible = document.visibilityState === 'visible';
let lastSave = 0;
let ui = { selected: 7, panel: '', choice: 0, motion: '', until: 0, message: '', messageUntil: 0, event: '', gameTarget: 0 };
let spriteSignature = '', panelSignature = '', wasteSignature = '', propSignature = '';
function load() {
  try {
    let raw = localStorage.getItem(KEY);
    if (!raw && !DEV) raw = localStorage.getItem('tamago2.pet.v2') || localStorage.getItem('tamago2.pixel.v1');
    return normalize(raw ? JSON.parse(raw) : null);
  } catch { return fresh(); }
}
function save(force = true) {
  if (!force && Date.now() - lastSave < 5000) return;
  try { localStorage.setItem(KEY, JSON.stringify(s)); lastSave = Date.now(); $('#save-warning').hidden = true; }
  catch { $('#save-warning').hidden = false; }
}
function text(selector, value) { const el = $(selector); if (el && el.textContent !== String(value)) el.textContent = String(value); }
function say(message, duration = 4500) { ui.message = message; ui.messageUntil = Date.now() + duration; }
function animate(name, message = '') {
  ui.motion = name; ui.until = Date.now() + 1800;
  ui.event = name === 'evolve' ? 'しんか！' : name === 'decline' ? 'すこし たいか…' : '';
  if (message) say(message);
}
function busy() { return ui.motion && Date.now() < ui.until; }
function sync(now = Date.now(), initial = false) {
  const before = s.form;
  const elapsed = Math.max(0, now - s.lastAt) / 60000;
  if (s.hatched && !s.dead) {
    // A delayed/throttled callback is not proof the screen stayed on. Only charge
    // small observed foreground intervals, treating uncertain gaps as offline.
    if (!initial && visible && elapsed <= .17) advance(s, elapsed, { screen: true });
    else advance(s, elapsed, { offline: true });
  }
  s.lastAt = now;
  if (hatch(s, now)) animate('evolve', 'よろしくね。次はあなたの時間だよ。');
  else if (s.hatched && !s.dead && s.form !== before && !busy()) animate(s.form > before ? 'evolve' : 'decline');
  if (s.dead) { ui.motion = ''; ui.until = 0; if (ui.panel !== 'rebirth') ui.panel = ''; }
}
function menuMarkup(entries, offset) {
  return entries.map(([id, glyph, label], i) => `<button class="menu-button" data-menu="${id}" data-index="${i + offset}" aria-label="${label}">${icon(glyph)}<span>${label}</span></button>`).join('');
}
$('#menus-top').innerHTML = menuMarkup(menus.slice(0,4),0);
$('#menus-bottom').innerHTML = menuMarkup(menus.slice(4),4);
$('#illness-icon').innerHTML = icon('skull');
$('#demo-label').hidden = !DEV;
$('#dev-panel').hidden = !DEV;
text('#release', RELEASE);
$('#app').dataset.mode = DEV ? 'demo' : 'normal';

function hearts(value) {
  const n = Math.ceil(Math.max(0, Math.min(100,value)) / 25);
  return `<span class="hearts" aria-label="4つ中${n}つ">${[0,1,2,3].map(i => `<span class="${i < n ? '' : 'empty'}">${icon('heart')}</span>`).join('')}</span>`;
}
function choice(id,label,glyph,index) {
  return `<button class="panel-choice ${ui.choice === index ? 'chosen' : ''}" data-choice="${id}">${glyph ? icon(glyph) : ''}${label}</button>`;
}
function panelHTML() {
  if (ui.panel === 'food') return '<h2 class="panel-title">なにを あげる？</h2><div class="panel-choices">' + choice('meal','ごはん','meal',0) + choice('snack','おやつ','snack',1) + '</div><p class="panel-small">A えらぶ / B あげる / C もどる</p>';
  if (ui.panel === 'status') {
    if (ui.choice === 1) return `<h2 class="panel-title">まめの きろく</h2><p class="panel-small">${s.generation}代目 / ${STAGES[s.form]}</p><p class="panel-small">休息（自己申告） ${Math.floor(s.restMinutes)}分</p><p class="panel-small">この画面の表示 ${Math.floor(s.screenMinutes)}分</p><p class="panel-small">休息の記録で、できることが増える。</p><p class="panel-small">A・B ハート / C とじる</p>`;
    return '<h2 class="panel-title">まめの ようす</h2>' + [['おなか',s.hunger],['ごきげん',s.happy],['けんこう',s.health],['じりつ',Math.min(100,s.restMinutes/3.6)]].map(([label,val]) => `<div class="status-row"><span>${label}</span>${hearts(val)}</div>`).join('') + '<p class="panel-small">A・B きろく / C とじる</p>';
  }
  if (ui.panel === 'play') return '<h2 class="panel-title">どっちを むくかな？</h2><p class="panel-subtitle">1回だけの あっちむいてホイ</p><div class="panel-choices">' + choice('left','← ひだり','',0) + choice('right','みぎ →','',1) + '</div><p class="panel-small">A えらぶ / B きめる / C もどる</p>';
  if (ui.panel === 'promise') {
    const promise = s.journey.promise;
    return '<h2 class="panel-title">あなたの時間を、ひとつ。</h2><p class="panel-subtitle">今日は、どんなひと休みにする？</p><div class="promise-durations" aria-label="休息の長さ">' + DURATIONS.map((m,i) => `<button class="panel-choice ${ui.choice === i ? 'chosen' : ''}" data-choice="duration-${m}" aria-pressed="${promise.minutes === m}">${m}分</button>`).join('') + '</div><div class="promise-intents" aria-label="休息の過ごし方">' + Object.entries(INTENTS).map(([id,label],i) => `<button class="panel-choice ${ui.choice === i+3 ? 'chosen' : ''}" data-choice="intent-${id}" aria-pressed="${promise.intent === id}">${label}</button>`).join('') + '</div><p class="panel-small">' + (s.rest ? '変更は次の休息から。いまのタイマーは変わりません。' : '選ぶと保存されます。A 選ぶ / B 決定 / C 戻る') + '</p>';
  }
  if (ui.panel === 'memory') {
    const memory = latestMemory(s); if (!memory) return '';
    const story = STORIES[memory.story];
    return `<div class="memory-card"><p class="memory-eyebrow">あなたが離れていた間に</p><h2 class="panel-title">${story.title}</h2><p class="memory-text">${story.text}</p><p class="memory-meta">${INTENTS[memory.intent]} · ${memory.minutes}分（自己申告）</p><p class="memory-fiction">休息の記録から生まれた、この子の物語。</p><button class="panel-choice" data-choice="memory-done">また、あなたの時間へ</button></div>`;
  }
  if (ui.panel === 'rest') {
    if (!s.rest) return '';
    if (Date.now() >= s.rest.readyAt) return `<h2 class="panel-title">${s.rest.minutes || 30}分、置けた？</h2>` + '<p class="panel-subtitle">スマホを使わず休めたか<br>自分で教えてください。</p><div class="panel-choices rest-options">' + choice('confirm-rest','置けた','',0) + choice('cancel-rest','置けなかった','',1) + '</div>';
    return `<h2 class="panel-title">画面を閉じて、あなたの時間へ。</h2><p class="panel-subtitle">${INTENTS[s.rest.intent] || INTENTS.rest} · ${s.rest.minutes || 30}分</p>` + '<div id="rest-clock" class="rest-time">30:00</div><p class="panel-subtitle">この子は、ここで自分の時間を過ごします。<br>戻ったら、休めたか教えてください。</p><p class="panel-small">Web版は他アプリの使用を判別しません。</p><button class="panel-choice cancel-rest" data-choice="cancel-rest">今回はやめる</button><p class="panel-small">Cは画面に戻るだけ。タイマーは継続します。</p>';
  }
  if (ui.panel === 'rebirth') return '<h2 class="panel-title">新しいたまごを迎える？</h2><p class="panel-subtitle">この子のお世話は終了し、<br>次の世代に進みます。</p><div class="panel-choices">' + choice('new-egg','迎える','egg',0) + choice('back','戻る','',1) + '</div>';
  return '';
}
function render() {
  if (ui.motion && Date.now() >= ui.until) { ui.motion = ''; ui.event = ''; }
  const lcd = $('#lcd');
  lcd.dataset.life = s.dead ? 'dead' : s.hatched ? 'pet' : 'egg';
  lcd.dataset.form = String(s.form);
  lcd.dataset.sleeping = String(s.sleeping);
  lcd.dataset.sick = String(s.sick);
  lcd.dataset.motion = ui.motion;
  const sig = `${s.form}:${s.dead}:${s.hatched}`;
  if (sig !== spriteSignature) { $('#pet-body').innerHTML = pet(s); spriteSignature = sig; }
  if (String(s.poops) !== wasteSignature) {
    $('#waste').innerHTML = Array.from({length:s.poops},() => `<span class="poop">${icon('poop')}</span>`).join('');
    $('#waste').setAttribute('aria-label', `うんち ${s.poops}個`);
    wasteSignature = String(s.poops);
  }
  $('#illness-icon').hidden = !s.sick || s.dead || s.sleeping;
  $('#attention-light').classList.toggle('on', attention(s));
  const prop = ['meal','snack','medicine'].includes(ui.motion) ? ui.motion : '';
  if (prop !== propSignature) { $('#action-prop').innerHTML = prop ? icon(prop) : ''; propSignature = prop; }
  text('#event-label',ui.event); $('#event-label').hidden = !ui.event;
  text('#pet-age', `${s.generation}代目 · ${Math.floor(s.ageMinutes / 1440)}日`);
  text('#pet-stage',s.dead ? 'おわかれ' : STAGES[s.form]);
  text('#selection-label',menus[ui.selected][2]);
  text('#lcd-message', Date.now() < ui.messageUntil ? ui.message : condition(s) === 'げんきいっぱい' ? 'ここはまかせて。あなたも、ひと休み。' : condition(s));
  $('#living-items').dataset.unlocked = String(s.journey.unlocked);
  $('#living-items').hidden = !s.journey.unlocked;
  const memory = latestMemory(s);
  text('#journal-count', s.journey.completed ? String(s.journey.completed) : '');
  $('#journal-button').setAttribute('aria-label', `暮らしの記録${s.journey.completed ? ' '+s.journey.completed+'件' : ''}`);
  $('#journal-button').classList.toggle('unread', !!memory && memory.seq > s.journey.seen);
  text('#rest-caption', `${INTENTS[s.journey.promise.intent]} · やくそくで時間を変更できます`);
  document.querySelectorAll('[data-menu]').forEach(b => {
    const selected = Number(b.dataset.index) === ui.selected;
    b.classList.toggle('selected', selected); b.setAttribute('aria-pressed', String(selected));
  });
  const html = panelHTML();
  if (html !== panelSignature) { $('#screen-panel').innerHTML = html; panelSignature = html; }
  $('#screen-panel').hidden = !html;
  $('#scene').dataset.panel = ui.panel;
  if ($('#rest-clock') && s.rest) {
    const seconds = Math.max(0, Math.ceil((s.rest.readyAt-Date.now()) / 1000));
    text('#rest-clock', `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`);
  }
  text('#rest-button strong',s.rest ? Date.now() >= s.rest.readyAt ? '休めたか確認する' : '休息のタイマーを見る' : `${s.journey.promise.minutes}分、スマホを置く`);
  $('#rest-button').disabled = s.dead;
  $('#rebirth').hidden = !s.dead;
  if (DEV) text('#dev-readout', `FORM ${s.form} / HP ${Math.round(s.health)} / おなか ${Math.round(s.hunger)} / 休息 ${Math.floor(s.restMinutes)}分 / 表示 ${Math.floor(s.screenMinutes)}分 / うんち ${s.poops}`);
}
function perform(kind) {
  if (busy()) { say('もう少し待ってね。',1500); render(); return; }
  sync();
  const result = care(s,kind);
  ui.panel = '';
  say(result.message);
  if (result.ok && result.animation) animate(result.animation);
  save(); render();
}
function openRest() {
  if (s.dead) return;
  if (!s.rest) { sync(); startRest(s); save(); }
  ui.selected = 7; ui.panel = 'rest'; ui.choice = 0;
  say('あなたにも、この子にも、自分の時間を。'); render();
}
function activate(id) {
  if (id === 'rest') { openRest(); return; }
  if (id === 'promise') { ui.panel = 'promise'; ui.choice = 0; render(); return; }
  if (id === 'status') { ui.panel = 'status'; ui.choice = 0; render(); return; }
  if (s.dead) { say('新しいたまごを迎えよう。'); render(); return; }
  if (!s.hatched) { say('もうすぐうまれるよ。'); render(); return; }
  if (s.sleeping && id !== 'light') { say('先に「でんき」をつけてね。'); render(); return; }
  if (busy()) { say('もう少し待ってね。',1500); render(); return; }
  if (id === 'food' || id === 'play') {
    ui.panel = id; ui.choice = 0;
    if (id === 'play') ui.gameTarget = Math.random() < .5 ? 0 : 1;
    render(); return;
  }
  perform(id);
}
function choose(id) {
  if (id.startsWith('duration-') || id.startsWith('intent-')) {
    const promise = s.journey.promise;
    const minutes = id.startsWith('duration-') ? Number(id.slice(9)) : promise.minutes;
    const intent = id.startsWith('intent-') ? id.slice(7) : promise.intent;
    if (setPromise(s,minutes,intent)) {
      ui.choice = id.startsWith('duration-') ? DURATIONS.indexOf(minutes) : 3+Object.keys(INTENTS).indexOf(intent);
      save(); render();
    }
    return;
  }
  if (id === 'memory-done') { acknowledgeMemory(); ui.panel = ''; ui.selected = 7; render(); return; }
  if (id === 'meal' || id === 'snack') perform(id);
  else if (id === 'left' || id === 'right') {
    const won = (id === 'left' ? 0 : 1) === ui.gameTarget;
    perform(won ? 'play-win' : 'play-lose');
  } else if (id === 'confirm-rest') {
    sync(); const before = s.form;
    if (confirmRest(s)) { ui.panel = 'memory'; animate(s.form > before ? 'evolve' : 'play','おかえり。この子にも、小さな一日がありました。'); save(); }
    else say('タイマーが終わったら教えてね。');
    render();
  } else if (id === 'cancel-rest') { s.rest = null; ui.panel = ''; say('また いつでも休もう。'); save(); render(); }
  else if (id === 'new-egg') { reset(false); }
  else if (id === 'back') { ui.panel = ''; render(); }
}
function hardware(button) {
  if (button === 'c') {
    if (ui.panel === 'memory') acknowledgeMemory();
    ui.panel = ''; render(); return;
  }
  if (button === 'a') {
    if (ui.panel) ui.choice = (ui.choice + 1) % (ui.panel === 'promise' ? 7 : 2);
    else ui.selected = (ui.selected + 1) % menus.length;
    render(); return;
  }
  if (button === 'b') {
    if (!ui.panel) activate(menus[ui.selected][0]);
    else if (ui.panel === 'promise') choose(ui.choice < 3 ? 'duration-'+DURATIONS[ui.choice] : 'intent-'+Object.keys(INTENTS)[ui.choice-3]);
    else if (ui.panel === 'memory') choose('memory-done');
    else if (ui.panel === 'food') choose(ui.choice ? 'snack' : 'meal');
    else if (ui.panel === 'play') choose(ui.choice ? 'right' : 'left');
    else if (ui.panel === 'status') { ui.choice = (ui.choice + 1) % 2; render(); }
    else if (ui.panel === 'rest' && s.rest && Date.now() >= s.rest.readyAt) choose(ui.choice ? 'cancel-rest' : 'confirm-rest');
    else if (ui.panel === 'rebirth') choose(ui.choice ? 'back' : 'new-egg');
  }
}
function reset(demo = false) {
  const generation = demo ? 1 : s.generation + 1;
  const journey = s.journey;
  s = fresh(Date.now(),generation);
  if (!demo) { s.journey = journey; s.journey.seen = s.journey.completed; }
  ui = { selected:7,panel:'',choice:0,motion:'',until:0,message:'たまごが うごいている…',messageUntil:Date.now()+5000,event:'',gameTarget:0 };
  save(); render();
}
function dev(action) {
  if (!DEV) return;
  ui.panel = ''; ui.motion = ''; ui.until = 0; ui.event = '';
  if (action === 'reset') { reset(true); return; }
  if (action === 'hatch') hatch(s,Date.now(),true);
  else if (action === 'rest') { hatch(s,Date.now(),true); const old = s.form; const now=Date.now(); s.rest={startedAt:now-1800000,readyAt:now,minutes:30,intent:s.journey.promise.intent,screenStart:s.screenMinutes}; confirmRest(s,now); animate(s.form > old ? 'evolve' : 'play','検証：30分休息'); ui.panel='memory'; }
  else if (action === 'screen') { hatch(s,Date.now(),true); const old = s.form; advance(s,60,{screen:true}); animate(s.form < old ? 'decline' : '','検証：60分使用'); }
  else if (action === 'hungry') { hatch(s,Date.now(),true); s.hunger = 8; say('検証：おなかを空かせました。'); }
  else if (action === 'poop') { hatch(s,Date.now(),true); s.poops = Math.min(4,s.poops+1); s.clean = 100-s.poops*24; say('検証：うんちを追加しました。'); }
  else if (action === 'sick') { hatch(s,Date.now(),true); s.sick = true; s.health = 20; say('検証：病気にしました。'); }
  else if (action === 'death') { hatch(s,Date.now(),true); s.health = 0; say('お世話してくれて ありがとう。'); }
  recompute(s); s.lastAt = Date.now(); save(); render();
}
document.addEventListener('click', event => {
  const b = event.target.closest('button'); if (!b || b.disabled) return;
  if (b.dataset.menu) { ui.selected = Number(b.dataset.index); activate(b.dataset.menu); }
  else if (b.dataset.choice) choose(b.dataset.choice);
  else if (b.dataset.hardware) hardware(b.dataset.hardware);
  else if (b.dataset.dev) dev(b.dataset.dev);
  else if (b.dataset.action === 'rest') openRest();
  else if (b.dataset.action === 'journal') openJournal();
  else if (b.dataset.action === 'close-journal') $('#journal-dialog').close();
  else if (b.dataset.action === 'help') $('#help-dialog').showModal();
  else if (b.dataset.action === 'close-help') $('#help-dialog').close();
  else if (b.dataset.action === 'rebirth') { ui.panel = 'rebirth'; ui.choice = 0; render(); $('#lcd').scrollIntoView({block:'center'}); }
});
document.addEventListener('keydown', e => {
  if ($('#help-dialog').open || $('#journal-dialog').open || e.ctrlKey || e.metaKey || e.altKey) return;
  const key = e.key.toLowerCase();
  let action = key === 'a' || key === 'arrowright' ? 'a' : key === 'b' ? 'b' : key === 'c' || key === 'escape' ? 'c' : '';
  if (key === 'enter' && e.target.tagName !== 'BUTTON') action = 'b';
  if (action) { e.preventDefault(); hardware(action); }
});
document.addEventListener('visibilitychange', () => {
  sync(); // Use the PREVIOUS visibility so the final foreground fraction is retained.
  visible = document.visibilityState === 'visible';
  s.lastAt = Date.now(); save(); render();
});
window.addEventListener('pagehide', () => { sync(); save(); });
window.addEventListener('pageshow', () => { sync(Date.now(),true); visible = document.visibilityState === 'visible'; render(); });
window.addEventListener('storage', e => {
  if (e.key === KEY && e.newValue) {
    try { s = normalize(JSON.parse(e.newValue)); render(); } catch {}
  }
});
if (DEV) {
  // No developer surface in normal mode. Demo state has its own storage key.
  window.tamagoTest = {
    snapshot: () => JSON.parse(JSON.stringify(s)),
    readyRest: () => { const now=Date.now(); const minutes=s.rest?.minutes || s.journey.promise.minutes; s.rest={startedAt:now-minutes*60000,readyAt:now,minutes,intent:s.rest?.intent || s.journey.promise.intent,screenStart:s.screenMinutes}; save(); render(); },
    advance: (minutes, mode) => { advance(s,minutes,{screen:mode==='screen',offline:mode==='offline'}); s.lastAt=Date.now(); save(); render(); }
  };
}
function acknowledgeMemory() {
  s.journey.seen = s.journey.completed; save();
}
function openJournal() {
  const memories = s.journey.memories;
  $('#journal-list').innerHTML = memories.length ? [...memories].reverse().map(m => {
    const d = new Intl.DateTimeFormat('ja-JP',{month:'numeric',day:'numeric'}).format(m.at);
    return `<li><p class="memory-meta">${d} · ${INTENTS[m.intent]} ${m.minutes}分（自己申告）</p><h3>${STORIES[m.story].title}</h3><p>${STORIES[m.story].text}</p></li>`;
  }).join('') : '<li class="journal-empty"><h3>まだ、白紙の一ページ。</h3><p>ひと休みを終えて「置けた」と教えると、この子の小さな物語がここに残ります。毎日続けなくても大丈夫。</p></li>';
  acknowledgeMemory(); render(); $('#journal-dialog').showModal();
}
sync(Date.now(),true);
if (latestMemory(s)?.seq > s.journey.seen) ui.panel = 'memory';
save(); render();
setInterval(() => { sync(); render(); save(false); },1000);
