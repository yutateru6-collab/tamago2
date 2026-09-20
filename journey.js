// A local, fictional companion journal. No sensors, account, notifications or AI API.
export const DURATIONS = [15, 30, 60];
export const INTENTS = { rest: 'ひと休み', read: '本を読む', focus: '集中する', meal: '食事を楽しむ' };
export const STORIES = [
  { title: '窓をあけて、深呼吸。', text: 'ひとりで窓をあけて、風の音を聞いていた。あなたが自分の時間を過ごす間に、この子にも、小さな時間が流れていた。', prop: 'window' },
  { title: '葉っぱを、ひとつ。', text: '外で見つけた葉っぱを、そっと持ち帰っていた。机の上に置くと、部屋が少しだけ好きになったみたい。', prop: 'leaf' },
  { title: 'じぶんで、お茶の支度。', text: '小さなカップを運んで、お茶の時間をつくっていた。少しこぼしたけれど、最後はじぶんで拭けた。', prop: 'cup' },
  { title: 'おかたづけ、できた。', text: '散らかっていたところを、じぶんで片付けていた。あなたを呼ばなくても、できることが少しずつ増えていく。', prop: 'tidy' },
  { title: '小さな芽に、水を。', text: '窓辺の小さな芽に、水をあげていた。育つのを急がず、今日はここまで。また明日の楽しみができた。', prop: 'plant' },
  { title: 'はじめての、読書。', text: '好きな場所に座って、絵本を開いていた。あなたにもこの子にも、画面の外に、自分だけの時間がある。', prop: 'book' },
  { title: '今日も、自分のペースで。', text: '窓辺でのんびり過ごしていた。特別なことがない日も、それでいい。静かな時間も、この子の暮らしになっていく。', prop: 'quiet' },
  { title: 'ひとりで、ひと休み。', text: 'お茶を飲んで、少しうたた寝していた。ずっと見守らなくても大丈夫。また会えたときに、今日の続きを。', prop: 'nap' }
];
const finite = (v, fallback = 0) => typeof v === 'number' && Number.isFinite(v) ? v : fallback;
const limit = (v, max = 1e8) => Math.min(max, Math.max(0, Math.floor(finite(v))));
export function createJourney() { return { promise: { minutes: 30, intent: 'rest' }, completed: 0, unlocked: 0, seen: 0, memories: [] }; }
export function normalizeJourney(raw, now = Date.now()) {
  const j = createJourney();
  if (!raw || typeof raw !== 'object') return j;
  if (DURATIONS.includes(raw.promise?.minutes)) j.promise.minutes = raw.promise.minutes;
  if (Object.hasOwn(INTENTS, raw.promise?.intent)) j.promise.intent = raw.promise.intent;
  j.completed = limit(raw.completed);
  j.unlocked = limit(raw.unlocked, 6);
  j.seen = Math.min(j.completed, limit(raw.seen));
  if (Array.isArray(raw.memories)) {
    const ids = new Set();
    j.memories = raw.memories.filter(m => m && Number.isInteger(m.seq) && m.seq > 0 && m.seq <= j.completed &&
      Number.isInteger(m.story) && m.story >= 0 && m.story < STORIES.length &&
      DURATIONS.includes(m.minutes) && Object.hasOwn(INTENTS, m.intent) &&
      Number.isFinite(m.at) && m.at >= 0 && m.at <= now && !ids.has(m.seq) && ids.add(m.seq))
      .map(m => ({seq:m.seq,story:m.story,minutes:m.minutes,intent:m.intent,at:m.at}))
      .sort((a,b) => a.seq-b.seq).slice(-30);
  }
  return j;
}
export function setPromise(s, minutes, intent) {
  if (!DURATIONS.includes(minutes) || !Object.hasOwn(INTENTS,intent)) return false;
  s.journey.promise = { minutes, intent }; return true;
}
export function recordRest(s, session, now = Date.now()) {
  const j = s.journey;
  const seq = ++j.completed;
  const story = seq <= 6 ? seq - 1 : 6 + (seq % 2);
  const minutes = DURATIONS.includes(session.minutes) ? session.minutes : 30;
  const intent = Object.hasOwn(INTENTS,session.intent) ? session.intent : 'rest';
  j.unlocked = Math.min(6,seq);
  j.memories.push({ seq,story,minutes,intent,at:now });
  j.memories = j.memories.slice(-30);
  // These effects match the fictional event, not proof of an observed real activity.
  if (j.unlocked >= 3) s.hunger = Math.min(100,s.hunger + minutes * .4);
  if (j.unlocked >= 4) {
    s.poops = Math.max(0,s.poops - 1); s.clean = Math.max(0,100 - s.poops*24);
    if (s.poops <= 1 && s.health >= 55) s.sick = false;
  }
  return j.memories.at(-1);
}
export const latestMemory = s => s.journey.memories.at(-1) || null;
