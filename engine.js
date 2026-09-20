import { DURATIONS, INTENTS, createJourney, normalizeJourney, recordRest } from './journey.js';
// Pure, deterministic pet rules. No DOM, timers, network, or phone-usage claims.
export const RELEASE = 'hitoiki-20260921-01';
export const STAGES = ['たまご', 'あかちゃん', 'こども', 'わかもの', 'おとな'];
export const clamp = (n, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n));
const number = (v, fallback) => typeof v === 'number' && Number.isFinite(v) ? v : fallback;
export function fresh(now = Date.now(), generation = 1) {
  return { version: 4, createdAt: now, lastAt: now, hatchAt: now + 6000, generation,
    hatched: false, dead: false, sleeping: false, sick: false, form: 0,
    hunger: 54, happy: 65, health: 90, clean: 100, discipline: 50,
    poops: 0, bowel: 0, ageMinutes: 0, growth: 0, screenMinutes: 0,
    restMinutes: 0, snackCount: 0, snackWindow: now, lastMeal: 0,
    lastSnack: 0, lastMedicine: 0, lastPlay: 0, lastDiscipline: 0, journey: createJourney(), rest: null };
}
export function normalize(raw, now = Date.now()) {
  const s = fresh(now);
  if (!raw || typeof raw !== 'object') return s;
  if (raw.version === 1 || raw.version === 2) {
    s.hatched = true;
    s.restMinutes = Math.max(0, number(raw.restMinutes ?? raw.quietMinutes, 0));
    s.screenMinutes = Math.max(0, number(raw.screenMinutes, number(raw.overuse, 0) * 30));
    s.growth = clamp(s.restMinutes - s.screenMinutes * .8, -120, 320);
    s.health = clamp(number(raw.health ?? raw.vitality, 90));
    s.happy = clamp(number(raw.mood, 65));
    s.poops = clamp(Math.floor(number(raw.poops, 0)), 0, 4);
    s.dead = raw.dead === true;
    s.sick = raw.sick === true;
    recompute(s);
    return s;
  }
  if (raw.version !== 3 && raw.version !== 4) return s;
  for (const k of ['hunger','happy','health','clean','discipline']) s[k] = clamp(number(raw[k], s[k]));
  for (const k of ['createdAt','lastAt','hatchAt','snackWindow','lastMeal','lastSnack','lastMedicine','lastPlay','lastDiscipline'])
    s[k] = clamp(number(raw[k], s[k]), 0, now + 6000);
  for (const k of ['ageMinutes','screenMinutes','restMinutes']) s[k] = clamp(number(raw[k], 0), 0, 1e8);
  s.generation = clamp(Math.floor(number(raw.generation, 1)), 1, 9999);
  s.poops = clamp(Math.floor(number(raw.poops, 0)), 0, 4);
  s.bowel = clamp(number(raw.bowel, 0), 0, 89.999);
  s.growth = clamp(number(raw.growth, 0), -120, 320);
  s.snackCount = clamp(Math.floor(number(raw.snackCount, 0)), 0, 99);
  for (const k of ['hatched','dead','sleeping','sick']) s[k] = raw[k] === true;
  s.journey = normalizeJourney(raw.journey, now);
  const duration = raw.rest ? (raw.rest.readyAt - raw.rest.startedAt) / 60000 : 0;
  if (raw.rest && Number.isFinite(raw.rest.startedAt) && raw.rest.startedAt >= 0 &&
      Number.isFinite(raw.rest.readyAt) && DURATIONS.includes(duration) && raw.rest.startedAt <= now) {
    s.rest = { startedAt: raw.rest.startedAt, readyAt: raw.rest.readyAt, minutes: duration,
      intent: Object.hasOwn(INTENTS,raw.rest.intent) ? raw.rest.intent : 'rest',
      screenStart: clamp(number(raw.rest.screenStart,s.screenMinutes),0,s.screenMinutes) };
  }
  recompute(s);
  return s;
}
export function recompute(s) {
  if (!s.hatched) { s.form = 0; return; }
  if (s.health <= 0) { s.dead = true; s.rest = null; s.sleeping = false; }
  if (s.health < 25 || s.poops >= 3 || s.clean < 18) s.sick = true;
  let f = 1 + [30, 90, 180].filter(x => s.growth + 1e-7 >= x).length;
  if (s.sick) f = Math.max(1, f - 1);
  s.form = f;
}
export function hatch(s, now = Date.now(), force = false) {
  if (s.hatched || s.dead || (!force && now < s.hatchAt)) return false;
  s.hatched = true; s.form = 1; s.lastAt = now; return true;
}
export function condition(s) {
  if (s.dead) return 'おわかれ';
  if (!s.hatched) return 'もうすぐ うまれる';
  if (s.sleeping) return 'すやすや';
  if (s.sick) return 'びょうき';
  if (s.poops) return 'おそうじしてね';
  if (s.hunger < 30) return 'おなか ぺこぺこ';
  if (s.happy < 35) return 'いっしょに ひと休みしよう';
  return 'げんきいっぱい';
}
export function attention(s) {
  return s.hatched && !s.dead && !s.sleeping && (s.sick || s.poops > 0 || s.hunger < 30 || s.happy < 35);
}
// Page visibility is only a proxy for THIS page. Offline time never counts as phone use.
// Offline catch-up is capped at eight hours; absence alone cannot kill the pet.
export function advance(s, minutes, { screen = false, offline = false } = {}) {
  if (!s.hatched || s.dead || !Number.isFinite(minutes) || minutes <= 0) return;
  // Unobserved absence is not evidence of phone use or failed care. No need decay,
  // new sickness, or rewards accrue merely because the person stayed away.
  if (offline) { s.ageMinutes += Math.min(minutes,480); return; }
  let left = Math.min(minutes,1440);
  while (left > 1e-8 && !s.dead) {
    const m = Math.min(left, 1); left -= m;
    s.ageMinutes += m;
    s.hunger = clamp(s.hunger - m * (s.sleeping ? .008 : .025));
    s.happy = clamp(s.happy - m * (s.sleeping ? .004 : .012));
    s.bowel += m * (s.sleeping ? .2 : 1);
    if (s.bowel >= 90) { s.bowel %= 90; s.poops = Math.min(4, s.poops + 1); }
    s.clean = clamp(100 - s.poops * 24);
    if (screen) {
      const before = Math.max(0, s.screenMinutes - 10); // First ten minutes of care are free.
      s.screenMinutes += m;
      const harmful = Math.max(0, s.screenMinutes - 10) - before;
      s.growth = clamp(s.growth - harmful * .8, -120, 320);
      s.health = clamp(s.health - harmful * .18);
      s.happy = clamp(s.happy - harmful * .08);
    }
    if (!offline && (s.hunger <= 0 || s.poops >= 3)) s.health = clamp(s.health - m * .1);
    recompute(s);
  }
}
export function restReward(s, minutes = 30) {
  if (s.dead || !s.hatched || !Number.isFinite(minutes) || minutes <= 0) return;
  minutes = Math.min(minutes, 480);
  s.restMinutes += minutes;
  s.growth = clamp(s.growth + minutes, -120, 320);
  s.health = clamp(s.health + minutes * .5);
  s.happy = clamp(s.happy + minutes * .3);
  s.discipline = clamp(s.discipline + minutes * .05);
  recompute(s); // An illness still needs medicine; rest alone is not an instant cure.
}
export function startRest(s, now = Date.now(), minutes = s.journey.promise.minutes, intent = s.journey.promise.intent) {
  if (s.dead || s.rest || !DURATIONS.includes(minutes) || !Object.hasOwn(INTENTS,intent)) return false;
  s.rest = { startedAt: now, readyAt: now + minutes*60000, minutes, intent, screenStart: s.screenMinutes }; return true;
}
export function confirmRest(s, now = Date.now()) {
  if (!s.rest || now < s.rest.readyAt || s.dead || !s.hatched) return false;
  const session = s.rest;
  s.rest = null;
  restReward(s, session.minutes || 30);
  recordRest(s,session,now);
  recompute(s);
  return true;
}
export function care(s, kind, now = Date.now()) {
  const no = message => ({ ok: false, message, animation: '' });
  if (s.dead) return no('新しいたまごを迎えよう。');
  if (!s.hatched) return no('もうすぐうまれるよ。');
  if (kind !== 'light' && s.sleeping) return no('先に「でんき」をつけてね。');
  let message = '', animation = kind;
  if (kind === 'meal') {
    if (s.hunger >= 90) return no('もう おなかいっぱい！');
    if (s.lastMeal && now - s.lastMeal < 8000) return no('まだ もぐもぐしてるよ。');
    s.lastMeal = now; s.hunger = clamp(s.hunger + 28); s.happy = clamp(s.happy + 3); s.bowel += 15;
    message = 'ごちそうさま。次はあなたの時間だよ。';
  } else if (kind === 'snack') {
    if (s.lastSnack && now - s.lastSnack < 8000) return no('おやつは ゆっくりね。');
    if (now - s.snackWindow >= 3600000) { s.snackCount = 0; s.snackWindow = now; }
    s.lastSnack = now; s.snackCount++; s.happy = clamp(s.happy + 16); s.hunger = clamp(s.hunger + 5);
    if (s.snackCount > 3) { s.health = clamp(s.health - 12); message = '食べすぎ。おやつはひと休み。'; }
    else message = 'あまくて おいしい！';
  } else if (kind === 'toilet') {
    if (!s.poops) return no('まだ うんちはないよ。');
    s.poops = 0; s.clean = 100; s.happy = clamp(s.happy + 5); message = 'すっきり。あとは、のんびりしてるね。';
  } else if (kind === 'medicine') {
    if (!s.sick) return no('げんきだから おくすりは不要。');
    if (s.lastMedicine && now - s.lastMedicine < 60000) return no('おくすりが効くのを待とう。');
    s.lastMedicine = now; s.health = clamp(s.health + 30);
    s.sick = s.poops >= 3 || s.health < 25;
    message = s.sick ? 'おそうじも してあげよう。' : 'おくすりが効いた。もう大丈夫！';
  } else if (kind === 'light') {
    s.sleeping = !s.sleeping; animation = '';
    message = s.sleeping ? 'おやすみ。スマホもひと休み。' : 'おはよう！';
  } else if (kind === 'play-win' || kind === 'play-lose') {
    if (s.lastPlay && now - s.lastPlay < 20000) return no('あそんだ後は ひと休みしよう。');
    s.lastPlay = now; s.happy = clamp(s.happy + (kind === 'play-win' ? 14 : 7)); animation = 'play';
    message = kind === 'play-win' ? 'あたり！ うれしそう。' : 'はずれ。でも楽しかった！';
  } else if (kind === 'discipline') {
    if (s.sick || s.poops || s.hunger < 30) return no('先にごはん・そうじ・治療を。');
    if (s.happy >= 35) return no('いまは おりこうにしているよ。');
    if (s.lastDiscipline && now - s.lastDiscipline < 60000) return no('もう伝わったよ。');
    s.lastDiscipline = now; s.discipline = clamp(s.discipline + 12); s.happy = clamp(s.happy + 10);
    message = 'ちゃんと伝わったみたい。';
  } else return no('そのお世話はまだないよ。');
  if (s.bowel >= 90) { s.bowel %= 90; s.poops = Math.min(4, s.poops + 1); }
  recompute(s);
  return { ok: true, message, animation };
}
