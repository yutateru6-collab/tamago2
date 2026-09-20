const KEY = 'tamago2.pet.v2';
const LEGACY_KEY = 'tamago2.pixel.v1';
const REST_BLOCK_MINUTES = 30;
const FORM_THRESHOLDS = [0, 30, 90, 180, 300];
const MENUS = [
  { id: 'status', label: 'STATUS', icon: '♡' },
  { id: 'clean', label: 'CLEAN', icon: '✦' },
  { id: 'rest', label: 'REST', icon: 'Z' },
  { id: 'info', label: 'INFO', icon: '?' },
];

const dev = new URLSearchParams(location.search).get('dev') === '1';
let state = load();
let pose = 'idle';
let effectTimer = null;
let poseTimer = null;
let visibleSince = Date.now();

function fresh() {
  const now = Date.now();
  return {
    version: 2,
    createdAt: now,
    hatchAt: now + 5500,
    hatched: false,
    restMinutes: 0,
    screenMinutes: 0,
    wasteMeter: 0,
    health: 84,
    mood: 78,
    clean: 92,
    poops: 0,
    sick: false,
    dead: false,
    form: 1,
    selectedMenu: 2,
    restSession: null,
    message: 'なにかが うごいている…',
    effect: '',
    effectTone: 'good',
  };
}

function migrateLegacy(v) {
  const next = fresh();
  next.hatched = true;
  next.hatchAt = Date.now();
  next.restMinutes = Number(v.quietMinutes || 0);
  next.screenMinutes = Number(v.overuse || 0) * 30;
  next.health = clamp(Number(v.vitality ?? 70), 0, 100);
  next.mood = clamp(60 + Number(v.sessions || 0) * 5, 0, 100);
  next.clean = 88;
  next.form = computeForm(next);
  next.message = 'おかえり。ここから育てなおそう。';
  return next;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.version === 2) return { ...fresh(), ...parsed };
    }
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const parsedLegacy = JSON.parse(legacy);
      if (parsedLegacy?.version === 1) return migrateLegacy(parsedLegacy);
    }
  } catch {}
  return fresh();
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function score(s = state) {
  return s.restMinutes - s.screenMinutes * 0.9 - s.poops * 12;
}

function computeForm(s = state) {
  if (!s.hatched) return 0;
  let level = 1;
  const currentScore = score(s);
  for (let i = 1; i < FORM_THRESHOLDS.length; i += 1) {
    if (currentScore >= FORM_THRESHOLDS[i]) level = i + 1;
  }
  if (s.sick || s.health < 28) level -= 1;
  return clamp(level, 1, 5);
}

function dayNumber() {
  return Math.max(1, Math.floor((Date.now() - state.createdAt) / 86400000) + 1);
}

function conditionLabel() {
  if (state.dead) return 'おわかれ';
  if (!state.hatched) return 'たまご';
  if (state.sick) return 'びょうき';
  if (state.poops >= 3 || state.clean < 35) return 'よごれてる';
  if (state.health < 42) return 'ぐったり';
  if (state.mood < 40) return 'さみしい';
  return 'げんき';
}

function growthLabel() {
  if (state.dead) return '止まっている';
  if (!state.hatched) return 'もうすぐ誕生';
  const s = score();
  if (s >= 180) return 'ぐんぐん進化中';
  if (s >= 60) return 'ちゃんと育ってる';
  if (s >= 0) return 'ゆっくり成長';
  if (s > -60) return '少し退化ぎみ';
  return 'かなり弱ってる';
}

function stateMessage() {
  if (state.dead) return 'しずかに うごかなくなった…';
  if (!state.hatched) return state.message || 'なにかが うごいている…';
  if (state.sick) return 'ぐったりしている。休ませて、きれいにしよう。';
  if (state.poops >= 3) return 'よごれが たまっている…';
  return state.message || 'スマホを おくほど そだつよ。';
}

function rect(x, y, w, h, cls = 'ink') {
  return `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
}

function eggSvg() {
  return `<svg class="pixel-svg" viewBox="0 0 48 44" role="img" aria-label="揺れている卵">
    <g>${rect(18,4,12,3)}${rect(13,7,22,4)}${rect(10,11,28,7)}${rect(8,18,32,14)}${rect(11,32,26,5)}${rect(16,37,16,3)}</g>
    <g class="lcd-cut">${rect(20,16,4,3,'cut')}${rect(24,19,4,3,'cut')}${rect(19,22,5,3,'cut')}</g>
  </svg>`;
}

function petSvg(form = state.form, currentPose = pose) {
  const blink = currentPose === 'blink';
  const happy = currentPose === 'happy';
  const sick = state.sick || currentPose === 'sick';
  let px = '';

  if (form === 1) {
    px += rect(15,13,18,4) + rect(11,17,26,14) + rect(14,31,20,5);
    px += rect(9,20,4,8) + rect(35,20,4,8);
  } else if (form === 2) {
    px += rect(12,10,5,8) + rect(31,10,5,8);
    px += rect(15,13,18,4) + rect(10,17,28,16) + rect(14,33,20,5);
    px += rect(7,20,4,9) + rect(37,20,4,9) + rect(36,29,7,3);
  } else if (form === 3) {
    px += rect(8,8,6,10) + rect(34,8,6,10);
    px += rect(13,12,22,4) + rect(9,16,30,17) + rect(12,33,24,6);
    px += rect(5,19,5,11) + rect(38,19,5,11) + rect(39,29,6,3);
    px += rect(21,7,6,5);
  } else if (form === 4) {
    px += rect(7,8,6,10) + rect(35,8,6,10);
    px += rect(11,11,26,5) + rect(8,16,32,18) + rect(12,34,24,6);
    px += rect(3,18,6,13) + rect(39,18,6,13);
    px += rect(18,6,4,5) + rect(23,4,4,7) + rect(28,6,4,5);
    px += rect(40,28,6,3) + rect(43,25,3,3);
  } else {
    px += rect(6,9,6,10) + rect(36,9,6,10);
    px += rect(10,11,28,5) + rect(7,16,34,18) + rect(11,34,26,6);
    px += rect(2,18,6,13) + rect(40,18,6,13);
    px += rect(15,7,4,5) + rect(20,4,4,7) + rect(25,2,4,9) + rect(30,4,4,7) + rect(35,7,4,5);
    px += rect(41,27,5,3) + rect(44,23,3,4);
  }

  const eyeY = 22;
  if (blink || sick) {
    px += rect(16, eyeY + 2, 5, 2) + rect(27, eyeY + 2, 5, 2);
  } else {
    px += rect(17, eyeY, 4, 5) + rect(27, eyeY, 4, 5);
    px += rect(18, eyeY, 1, 1, 'cut') + rect(28, eyeY, 1, 1, 'cut');
  }
  if (happy) px += rect(22,29,5,2);
  else if (sick) px += rect(21,29,7,2);
  else px += rect(23,28,3,3);

  return `<svg class="pixel-svg" viewBox="0 0 48 44" role="img" aria-label="tamago2の育成キャラクター"><g>${px}</g></svg>`;
}

function poopSvg(index) {
  return `<svg class="poop-svg poop-${index + 1}" viewBox="0 0 16 16" aria-hidden="true">
    ${rect(6,2,4,3)}${rect(4,5,8,3)}${rect(2,8,12,4)}${rect(1,12,14,2)}
  </svg>`;
}

function graveSvg() {
  return `<svg class="pixel-svg grave-svg" viewBox="0 0 48 44" role="img" aria-label="動かなくなったキャラクター">
    ${rect(15,10,18,4)}${rect(11,14,26,20)}${rect(8,34,32,4)}${rect(22,17,4,11)}${rect(18,21,12,4)}
  </svg>`;
}

function render() {
  const app = document.querySelector('#app');
  const selected = MENUS[state.selectedMenu] || MENUS[0];
  const life = state.dead ? 'dead' : state.hatched ? 'pet' : 'egg';
  const waste = Array.from({ length: Math.min(state.poops, 4) }, (_, i) => poopSvg(i)).join('');
  const character = state.dead ? graveSvg() : state.hatched ? petSvg() : eggSvg();

  app.innerHTML = `
    <div class="page-shell">
      <header class="hero-copy">
        <div class="brand-line"><span class="brand-dot"></span><strong>TAMAGO2</strong><span>prototype 01</span></div>
        <h1>スマホを置くほど、<br><em>この子は育つ。</em></h1>
        <p>触りすぎると弱る、汚れる、病気になる。<br>放っておきすぎれば、いつかお別れもくる。</p>
      </header>

      <section class="toy-shell" aria-label="育成端末">
        <div class="toy-speaker" aria-hidden="true"><span></span><span></span><span></span></div>
        <div class="toy-title">TAMAGO2</div>
        <div class="lcd" data-life="${life}" data-condition="${conditionLabel()}">
          <div class="lcd-top"><span>DAY ${String(dayNumber()).padStart(2, '0')}</span><span>${state.hatched ? `FORM ${state.form}` : 'EGG'}</span></div>
          <div class="menu-strip" aria-label="メニュー">
            ${MENUS.map((m, i) => `<button class="menu-icon ${i === state.selectedMenu ? 'selected' : ''}" data-menu-index="${i}" aria-label="${m.label}"><span>${m.icon}</span><small>${m.label}</small></button>`).join('')}
          </div>
          <div class="screen-scene">
            <div class="pixel-cloud cloud-a"></div><div class="pixel-cloud cloud-b"></div>
            <div class="waste-layer">${waste}</div>
            <div class="pet-wander ${state.sick ? 'is-sick' : ''} ${state.dead ? 'is-dead' : ''}"><div class="pet-sprite ${life}">${character}</div></div>
            <div class="ground-line"></div>
            ${state.effect ? `<div class="screen-effect ${state.effectTone}">${state.effect}</div>` : ''}
          </div>
          <div class="lcd-message">${stateMessage()}</div>
        </div>
        <div class="hardware-buttons" aria-label="端末ボタン">
          <button data-hardware="a" aria-label="Aボタン メニューを移動"><span>A</span></button>
          <button data-hardware="b" aria-label="Bボタン 決定"><span>B</span></button>
          <button data-hardware="c" aria-label="Cボタン 戻る"><span>C</span></button>
        </div>
        <div class="hardware-hints"><span>SELECT</span><span>OK</span><span>BACK</span></div>
        <div class="selected-action">${selected.icon} ${selected.label}</div>
      </section>

      <section class="meaning-card" aria-label="成長ルール">
        <div><small>離れる時間</small><strong>↑ 進化</strong></div>
        <div class="meaning-divider"></div>
        <div><small>触りすぎ</small><strong>↓ 退化</strong></div>
      </section>

      <button class="rest-cta" data-action="rest" ${state.dead ? 'disabled' : ''}>
        <span class="rest-icon">Z</span><span><strong>30分、スマホを置く</strong><small>閉じてOK。戻ったら自動で判定</small></span>
      </button>

      <section class="soft-status" aria-label="今の状態">
        <div><small>成長</small><strong>${growthLabel()}</strong></div>
        <div><small>体調</small><strong>${conditionLabel()}</strong></div>
        <div><small>よごれ</small><strong>${state.poops === 0 ? 'c��れい' : state.poops >= 3 ? 'c��なり汚い' : '少しある'}</strong></div>
      </section>

      ${state.dead ? `<button class="new-egg" data-action="reset">新しいたまごから始める</button>` : ''}

      <details class="prototype-note">
        <summary>この試作で計測できる範囲</summary>
        <p><strong>Web版はiPhone全体のスクリーンタイムを読み取れません。</strong> 今は「30分スマホを置く」タイマーと、このページを開いている時間、開発用シミュレーションで成長ロジックを検証します。正式に端末全体の使用時間と連動するには、Webではなくネイティブ実装側の連携が必要です。</p>
      </details>

      ${dev ? renderDev() : ''}
    </div>

    ${state.restSession ? renderRestOverlay() : ''}
  `;
  bind();
}

function renderDev() {
  return `<section class="dev-panel">
    <h2>DEV · 生命ループ検証</h2>
    <div class="dev-readout">REST ${Math.round(state.restMinutes)}m / SCREEN ${Math.round(state.screenMinutes)}m / HP ${Math.round(state.health)} / FORM ${state.form}</div>
    <div class="dev-grid">
      <button data-dev="hatch">孵化</button>
      <button data-dev="rest30">+30分休息</button>
      <button data-dev="screen30">+30分使用</button>
      <button data-dev="poop">うんち+1</button>
      <button data-dev="clean">全部きれい</button>
      <button data-dev="sick">病気</button>
      <button data-dev="dead">力尽きる</button>
      <button data-dev="reset">RESET</button>
    </div>
  </section>`;
}

function renderRestOverlay() {
  return `<section class="rest-overlay" aria-modal="true" role="dialog" aria-label="休息タイマー">
    <div class="rest-card">
      <div class="rest-mini">${state.hatched && !state.dead ? petSvg(state.form, 'sleep') : eggSvg()}</div>
      <small>REST MODE</small>
      <h2>画面は閉じて大丈夫。</h2>
      <p>この子はここで待っています。<br>30分たったら、少し育ちます。</p>
      <div class="rest-timer" data-rest-timer>30:00</div>
      ${dev ? '<button class="dev-fast" data-action="fast-rest">DEV: 30分経過</button>' : ''}
      <button class="cancel-rest" data-action="cancel-rest">今回はやめる</button>
    </div>
  </section>`;
}

function bind() {
  document.querySelectorAll('[data-menu-index]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedMenu = Number(button.dataset.menuIndex);
      save();
      render();
    });
  });

  document.querySelector('[data-hardware="a"]')?.addEventListener('click', cycleMenu);
  document.querySelector('[data-hardware="b"]')?.addEventListener('click', activateSelected);
  document.querySelector('[data-hardware="c"]')?.addEventListener('click', goBack);
  document.querySelector('[data-action="rest"]')?.addEventListener('click', startRest);
  document.querySelector('[data-action="cancel-rest"]')?.addEventListener('click', cancelRest);
  document.querySelector('[data-action="fast-rest"]')?.addEventListener('click', fastRest);
  document.querySelector('[data-action="reset"]')?.addEventListener('click', resetPet);

  document.querySelectorAll('[data-dev]').forEach((button) => {
    button.addEventListener('click', () => runDev(button.dataset.dev));
  });
}

function cycleMenu() {
  state.selectedMenu = (state.selectedMenu + 1) % MENUS.length;
  state.message = MENUS[state.selectedMenu].label;
  save();
  render();
}

function activateSelected() {
  if (state.dead) return;
  const action = MENUS[state.selectedMenu]?.id;
  if (action === 'status') {
    state.message = `${growthLabel()} / ${conditionLabel()}`;
    pulsePose('happy', 800);
  } else if (action === 'clean') {
    cleanWaste();
  } else if (action === 'rest') {
    startRest();
  } else if (action === 'info') {
    state.message = '置くほど進化。触りすぎると退化。';
    save();
    render();
  }
}

function goBack() {
  if (state.restSession) {
    cancelRest();
    return;
  }
  state.selectedMenu = 2;
  state.message = 'スマホを おくほど そだつよ。';
  save();
  render();
}

function cleanWaste() {
  if (!state.hatched) {
    state.message = 'まだ たまごだ。';
  } else if (state.poops <= 0) {
    state.message = 'もう きれい！';
    pulsePose('happy', 700);
  } else {
    state.poops = 0;
    state.clean = clamp(state.clean + 34, 0, 100);
    if (state.health > 45) state.sick = false;
    state.message = 'きれいになった！';
    setEffect('CLEAN!', 'good');
    pulsePose('happy', 1100);
  }
  save();
  render();
}

function hatch() {
  if (state.hatched || state.dead) return;
  state.hatched = true;
  state.form = 1;
  state.message = 'c��まれた！ よろしくね。';
  setEffect('HATCH!', 'good');
  save();
  pulsePose('happy', 1400);
  render();
}

function startRest() {
  if (state.dead || state.restSession) return;
  accrueVisibleTime();
  const now = Date.now();
  state.restSession = { startedAt: now, endsAt: now + REST_BLOCK_MINUTES * 60000 };
  state.message = 'おやすみ中…';
  save();
  render();
  updateRestTimer();
}

function cancelRest() {
  if (!state.restSession) return;
  state.restSession = null;
  visibleSince = Date.now();
  state.message = 'また いつでも休めるよ。';
  save();
  render();
}

function fastRest() {
  if (!state.restSession) startRest();
  if (state.restSession) {
    state.restSession.endsAt = Date.now() - 1;
    save();
    finishRest();
  }
}

function finishRest() {
  if (!state.restSession) return;
  const before = state.form;
  state.restSession = null;
  applyRest(REST_BLOCK_MINUTES, true);
  state.message = 'c��ゃんと休めた。少し育った！';
  visibleSince = Date.now();
  if (state.form > before) setEffect('EVOLVE!', 'good');
  else setEffect('+ REST', 'good');
  pulsePose('happy', 1500);
  save();
  render();
}

function applyRest(minutes, silent = false) {
  if (state.dead) return;
  const before = state.form;
  state.restMinutes += minutes;
  state.health = clamp(state.health + minutes * 0.55, 0, 100);
  state.mood = clamp(state.mood + minutes * 0.4, 0, 100);
  state.clean = clamp(state.clean + minutes * 0.05, 0, 100);
  if (state.sick && state.health > 55 && state.poops <= 1) state.sick = false;
  state.form = computeForm();
  if (!silent && state.form > before) setEffect('EVOLVE!', 'good');
  save();
}

function applyScreen(minutes, silent = false) {
  if (!state.hatched || state.dead || minutes <= 0) return;
  const before = state.form;
  state.screenMinutes += minutes;
  state.health = clamp(state.health - minutes * 0.45, 0, 100);
  state.mood = clamp(state.mood - minutes * 0.25, 0, 100);
  state.clean = clamp(state.clean - minutes * 0.30, 0, 100);
  state.wasteMeter += minutes;

  while (state.wasteMeter >= 45 && state.poops < 4) {
    state.wasteMeter -= 45;
    state.poops += 1;
    state.clean = clamp(state.clean - 8, 0, 100);
  }

  if (state.poops >= 3 || state.health < 28 || state.clean < 22) state.sick = true;
  if (state.sick && state.health <= 0) state.dead = true;
  state.form = computeForm();

  if (!silent) {
    if (state.dead) setEffect('…', 'bad');
    else if (state.form < before) setEffect('DOWN…', 'bad');
    else if (state.poops >= 3) setEffect('SICK…', 'bad');
  }
  save();
}

function accrueVisibleTime() {
  if (document.visibilityState !== 'visible' || state.restSession || state.dead || !state.hatched) {
    visibleSince = Date.now();
    return;
  }
  const now = Date.now();
  const minutes = (now - visibleSince) / 60000;
  if (minutes >= 0.25) applyScreen(minutes, true);
  visibleSince = now;
}

function setEffect(text, tone = 'good') {
  state.effect = text;
  state.effectTone = tone;
  clearTimeout(effectTimer);
  effectTimer = setTimeout(() => {
    state.effect = '';
    save();
    render();
  }, 1500);
}

function pulsePose(nextPose, duration = 900) {
  pose = nextPose;
  clearTimeout(poseTimer);
  poseTimer = setTimeout(() => {
    pose = 'idle';
    render();
  }, duration);
}

function randomBlink() {
  if (state.hatched && !state.dead && !state.sick && !state.restSession && pose === 'idle') {
    pose = 'blink';
    render();
    setTimeout(() => {
      pose = 'idle';
      render();
    }, 160);
  }
  setTimeout(randomBlink, 2400 + Math.random() * 2800);
}

function updateRestTimer() {
  if (!state.restSession) return;
  const left = Math.max(0, state.restSession.endsAt - Date.now());
  if (left <= 0) {
    finishRest();
    return;
  }
  const totalSeconds = Math.ceil(left / 1000);
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const ss = String(totalSeconds % 60).padStart(2, '0');
  const timer = document.querySelector('[data-rest-timer]');
  if (timer) timer.textContent = `${mm}:${ss}`;
}

function runDev(action) {
  if (action === 'hatch') {
    hatch();
    return;
  }
  if (action === 'rest30') {
    if (!state.hatched) hatch();
    const before = state.form;
    applyRest(30);
    state.message = '30分休んだ。';
    if (state.form > before) setEffect('EVOLVE!', 'good');
  } else if (action === 'screen30') {
    if (!state.hatched) hatch();
    const before = state.form;
    applyScreen(30);
    state.message = '30分ぶん触った。';
    if (state.form < before) setEffect('DOWN…', 'bad');
  } else if (action === 'poop') {
    if (!state.hatched) hatch();
    state.poops = clamp(state.poops + 1, 0, 4);
    state.clean = clamp(state.clean - 18, 0, 100);
    if (state.poops >= 3) state.sick = true;
    state.message = 'よごれが増えた…';
    setEffect('POOP!', 'bad');
  } else if (action === 'clean') {
    state.poops = 0;
    state.clean = 100;
    if (state.health > 45) state.sick = false;
    state.message = '全部きれい！';
    setEffect('CLEAN!', 'good');
  } else if (action === 'sick') {
    if (!state.hatched) hatch();
    state.sick = true;
    state.health = Math.min(state.health, 24);
    state.form = computeForm();
    state.message = 'びょうきになった…';
    setEffect('SICK…', 'bad');
  } else if (action === 'dead') {
    if (!state.hatched) state.hatched = true;
    state.dead = true;
    state.health = 0;
    state.message = 'c��ずかに うごかなくなった…';
    setEffect('…', 'bad');
  } else if (action === 'reset') {
    resetPet();
    return;
  }
  save();
  render();
}

function resetPet() {
  state = fresh();
  pose = 'idle';
  visibleSince = Date.now();
  save();
  render();
}

function maybeHatch() {
  if (!state.hatched && !state.dead && Date.now() >= state.hatchAt) hatch();
}

function lifecycleTick() {
  maybeHatch();
  if (!state.restSession) accrueVisibleTime();
  updateRestTimer();
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') accrueVisibleTime();
  else {
    visibleSince = Date.now();
    maybeHatch();
    updateRestTimer();
  }
});
window.addEventListener('pagehide', accrueVisibleTime);

render();
maybeHatch();
setInterval(updateRestTimer, 500);
setInterval(lifecycleTick, 15000);
setTimeout(randomBlink, 2200);
