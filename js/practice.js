// Practice puzzles, generated from a seed with no DOM (practice-ui.js shows them):
//   eff     — which tile to discard, by effective draws counted from your own hand
//   waits   — which tiles a tenpai hand is waiting on
//   score   — what a winning hand is worth
//   fu      — how many fu a winning hand has
//   defense — which tile is safest against a riichi
// Each generator takes a seeded() random function and a difficulty (easy / normal / hard), so a seed always gives
// the same puzzle; the daily puzzle seeds from the date (at normal), so everyone gets the same one.
// Also here: the mistake book (your costly discards from games) and the fixed tutorial lessons.
const PRACTICE_KINDS = ['eff', 'waits', 'score', 'fu', 'defense'];
const DIFFS = ['easy', 'normal', 'hard'];
const pickOf = (r, a) => a[Math.floor(r() * a.length)];

// Tile ids for a list of types, in the same order. Copies 3,2,1,0, so a red five only appears as a fourth copy.
function idsOf(types) {
  const used = {};
  return types.map(t => {
    used[t] = (used[t] || 0) + 1;
    return t * 4 + 4 - used[t];
  });
}
function fitsFour(types) {
  const c = new Array(34).fill(0);
  for (const t of types) if (++c[t] > 4) return false;
  return true;
}
// A run or a triplet in suit s (random suit if null); with honours allowed, sometimes an honour triplet.
function randGroup(r, s, honours) {
  if (honours && r() < 0.15) return Array(3).fill(27 + Math.floor(r() * 7));
  const b = (s ?? Math.floor(r() * 3)) * 9;
  if (r() < 0.7) {
    const n = Math.floor(r() * 7);
    return [b + n, b + n + 1, b + n + 2];
  }
  const t = b + Math.floor(r() * 9);
  return [t, t, t];
}
const randPair = (r, honours) => Array(2).fill(honours && r() < 0.2 ? 27 + Math.floor(r() * 7) : Math.floor(r() * 27));
function randTaatsu(r) {
  const b = Math.floor(r() * 3) * 9;
  if (r() < 0.6) {
    const n = Math.floor(r() * 8);
    return [b + n, b + n + 1];
  }
  const n = Math.floor(r() * 7);
  return [b + n, b + n + 2];
}
const randTile = r => Math.floor(r() * 34);

// Every discard of a 14-tile closed hand with the shanten after it and the effective draws, counting only the
// copies in your own hand as seen. Sorted best first, like the coach.
function discardOptions(ids) {
  const c = counts(ids),
    seen = c.slice(),
    rows = [];
  for (let d = 0; d < 34; d++) {
    if (!c[d]) continue;
    c[d]--;
    const s = shanten(c, 0);
    let n = 0;
    const tiles = [];
    for (let t = 0; t < 34; t++) {
      const rem = 4 - seen[t];
      if (rem <= 0) continue;
      c[t]++;
      if (shanten(c, 0) < s) {
        tiles.push([t, rem]);
        n += rem;
      }
      c[t]--;
    }
    c[d]++;
    rows.push({ d, s, n, tiles });
  }
  return rows.sort((a, b) => a.s - b.s || b.n - a.n);
}

// Keeps drawing candidates until one is a good puzzle; generators return null for a rejected candidate.
function untilGood(r, gen) {
  for (let i = 0; i < 5000; i++) {
    const p = gen(r);
    if (p) return p;
  }
  throw new Error('no puzzle found');
}

// One or two from tenpai, with a clear best choice (at most two equally good tiles) among several outcomes.
// easy: one from tenpai, one right answer; hard: two from tenpai, and the runner-up is close.
function genEff(r, diff = 'normal') {
  return untilGood(r, r => {
    let types;
    if (diff === 'hard')
      // two sets, a pair, one partial set and four loose tiles: two from tenpai unless the loose tiles connect
      types = [
        ...randGroup(r, null, true),
        ...randGroup(r, null, true),
        ...randPair(r, true),
        ...randTaatsu(r),
        randTile(r),
        randTile(r),
        randTile(r),
        randTile(r)
      ];
    else if (diff === 'easy' || r() < 0.5)
      types = [
        ...randGroup(r, null, true),
        ...randGroup(r, null, true),
        ...randGroup(r, null, true),
        ...randPair(r, true),
        randTile(r),
        randTile(r),
        randTile(r)
      ];
    else
      types = [
        ...randGroup(r, null, true),
        ...randGroup(r, null, true),
        ...randPair(r, true),
        ...randTaatsu(r),
        ...randTaatsu(r),
        randTile(r),
        randTile(r)
      ];
    if (!fitsFour(types)) return null;
    const hand = idsOf(types).sort((a, b) => a - b),
      rows = discardOptions(hand),
      b = rows[0];
    if (b.s < 1 || b.s > 2) return null;
    const best = rows.filter(x => x.s === b.s && x.n === b.n).map(x => x.d),
      kinds = new Set(rows.map(x => x.s + '/' + x.n)).size;
    if (best.length > 2 || kinds < 4) return null;
    if (diff === 'easy' && (b.s !== 1 || best.length !== 1)) return null;
    if (diff === 'hard') {
      const second = rows.find(x => x.s === b.s && x.n < b.n);
      if (b.s !== 2 || kinds < 5 || !second || second.n < b.n * 0.85) return null;
    }
    return { kind: 'eff', hand, rows, best };
  });
}

// A 13-tile tenpai hand with at least two waits, all in one suit (the suit the answer palette shows).
// Half are pure one-suit hands, half have two groups from elsewhere. easy: mixed hands with two waits;
// hard: pure one-suit hands with three or more.
function genWaits(r, diff = 'normal') {
  return untilGood(r, r => {
    const s = Math.floor(r() * 3),
      coin = r() < 0.5,
      pure = diff === 'hard' ? true : diff === 'easy' ? false : coin;
    const main = pure
      ? [
          ...randGroup(r, s),
          ...randGroup(r, s),
          ...randGroup(r, s),
          ...randGroup(r, s),
          ...randPair(r).map(t => s * 9 + (t % 9))
        ]
      : [...randGroup(r, s), ...randGroup(r, s), ...randPair(r).map(t => s * 9 + (t % 9))];
    let side = [];
    if (!pure) {
      do side = [...randGroup(r, null, true), ...randGroup(r, null, true)];
      while (side.some(t => t >= s * 9 && t < s * 9 + 9));
    }
    main.splice(Math.floor(r() * main.length), 1);
    const types = [...main, ...side];
    if (!fitsFour(types)) return null;
    const hand = idsOf(types).sort((a, b) => a - b),
      waits = waitsFor(hand, 0);
    if (waits.length < 2 || waits.some(t => t < s * 9 || t >= s * 9 + 9)) return null;
    if ((diff === 'easy' && waits.length !== 2) || (diff === 'hard' && waits.length < 3)) return null;
    return { kind: 'waits', hand, suit: s, waits };
  });
}

// What a payment looks like for han / fu: {ron} or, for tsumo, {all} (dealer) or {n,d} (non-dealer: n each, d dealer).
function payFor(han, fu, isTsumo, isDealer) {
  const base = basePoints(han, fu, 0).base;
  if (!isTsumo) return { ron: up100(base * (isDealer ? 6 : 4)) };
  return isDealer ? { all: up100(base * 2) } : { n: up100(base), d: up100(base * 2) };
}
const payOf = (res, isTsumo) =>
  !isTsumo ? { ron: res.ron } : res.isDealer ? { all: res.tsumoAll } : { n: res.tsumoN, d: res.tsumoD };
const samePay = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const payTotal = p => p.ron ?? (p.all != null ? p.all * 3 : p.n * 2 + p.d);

// A winning hand with its situation. easy: closed, ron, not the dealer, in riichi; normal: closed; hard: may have
// one or two open melds (then without riichi), and may be the dealer or a tsumo.
function genWinHand(r, diff) {
  const groups = [
    randGroup(r, null, true),
    randGroup(r, null, true),
    randGroup(r, null, true),
    randGroup(r, null, true)
  ];
  const pair = randPair(r, true),
    types = [...groups.flat(), ...pair];
  if (!fitsFour(types)) return null;
  const ids = idsOf(types),
    nOpen = diff === 'hard' && r() < 0.6 ? 1 + Math.floor(r() * 2) : 0,
    melds = [];
  for (let g = 0; g < nOpen; g++) {
    const gi = ids.slice(g * 3, g * 3 + 3),
      run = groups[g][0] !== groups[g][1];
    melds.push({ type: run ? 'chi' : 'pon', ids: gi, called: gi[2], from: run ? 3 : 1 + Math.floor(r() * 3) });
  }
  const closed = ids.slice(nOpen * 3),
    winId = pickOf(r, closed),
    isTsumo = diff === 'easy' ? false : r() < 0.4,
    riichi = nOpen ? false : diff === 'easy' ? true : r() < 0.6;
  const seat = diff === 'easy' ? 1 + Math.floor(r() * 3) : Math.floor(r() * 4),
    round = r() < 0.75 ? 0 : 1,
    doraInd = [randTile(r)];
  const hand = (isTsumo ? closed : closed.filter(id => id !== winId)).sort((a, b) => a - b);
  const sit = {
    riichi,
    double: false,
    ippatsu: false,
    rinshan: false,
    haitei: false,
    houtei: false,
    tenhou: false,
    chiihou: false
  };
  const res = evaluate({
    hand,
    melds,
    winId,
    isTsumo,
    seat: 27 + seat,
    round: 27 + round,
    isDealer: seat === 0,
    sit,
    doraInd,
    uraInd: null
  });
  if (!res || res.yakuman) return null;
  return { hand, melds, winId, isTsumo, riichi, seat, round, isDealer: seat === 0, doraInd, res };
}
// Four payments to choose from (one right).
function genScore(r, diff = 'normal') {
  return untilGood(r, r => {
    const w = genWinHand(r, diff);
    if (!w) return null;
    const { res, isTsumo, seat } = w,
      answer = payOf(res, isTsumo),
      pool = [];
    for (const [dh, df] of [
      [1, 0],
      [-1, 0],
      [0, 10],
      [0, -10],
      [2, 0],
      [0, 20],
      [1, 10],
      [-1, 10]
    ]) {
      const h = res.han + dh,
        f = res.fu + df;
      if (h < 1 || f < 20) continue;
      const p = payFor(h, f, isTsumo, seat === 0);
      if (!samePay(p, answer) && !pool.some(x => samePay(x, p))) pool.push(p);
    }
    for (const h of [5, 6, 8, 11]) {
      const p = payFor(h, 30, isTsumo, seat === 0);
      if (!samePay(p, answer) && !pool.some(x => samePay(x, p))) pool.push(p);
    }
    if (pool.length < 3) return null;
    const wrong = [];
    while (wrong.length < 3) {
      const i = Math.floor(r() * pool.length);
      wrong.push(pool.splice(i, 1)[0]);
    }
    const options = [answer, ...wrong].sort((a, b) => payTotal(a) - payTotal(b));
    return { kind: 'score', ...w, options, answer: options.findIndex(p => samePay(p, answer)) };
  });
}
// How many fu: four values to choose from, answered with the breakdown (res.fuParts). Hands below a mangan, where
// the fu decide the points.
const FU_STEPS = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110];
function genFu(r, diff = 'normal') {
  return untilGood(r, r => {
    const w = genWinHand(r, diff);
    if (!w || w.res.han >= 5) return null;
    const fu = w.res.fu,
      near = FU_STEPS.filter(f => f !== fu && Math.abs(f - fu) <= 30 && (f !== 25 || fu < 40));
    if (near.length < 3) return null;
    const wrong = [];
    while (wrong.length < 3) wrong.push(near.splice(Math.floor(r() * near.length), 1)[0]);
    const options = [fu, ...wrong].sort((a, b) => a - b);
    return { kind: 'fu', ...w, options, answer: options.indexOf(fu) };
  });
}

// A riichi player's river and your 14 tiles. Risk follows tileRisk (the AI's rules), counting copies in the
// river as visible. Good puzzles have one or two safest tiles that are reasonably safe, and some dangerous ones.
// easy: a genbutsu is in hand; hard: no genbutsu, the answer is a suji or honour read.
function genDefense(r, diff = 'normal') {
  return untilGood(r, r => {
    const nRiver = 7 + Math.floor(r() * 6),
      river = [],
      hand = [];
    for (let i = 0; i < nRiver; i++) river.push(randTile(r));
    for (let i = 0; i < 14; i++) hand.push(r() < 0.12 ? pickOf(r, river) : randTile(r));
    if (!fitsFour([...hand, ...river])) return null;
    const ids = idsOf([...hand, ...river]),
      handIds = ids.slice(0, 14).sort((a, b) => a - b),
      riverIds = ids.slice(14);
    const riv = new Set(river),
      risk = {};
    for (const t of new Set(hand)) risk[t] = tileRisk(t, riv, new Set(), river.filter(x => x === t).length);
    const ds = Object.values(risk).map(x => x.d),
      min = Math.min(...ds);
    const best = Object.keys(risk)
      .map(Number)
      .filter(t => risk[t].d === min);
    if (best.length > 2 || min > 3 || !ds.some(d => d >= 6)) return null;
    if ((diff === 'easy' && min !== 0) || (diff === 'hard' && min < 1)) return null;
    return { kind: 'defense', hand: handIds, river: riverIds, risk, best };
  });
}

const PRACTICE_GEN = { eff: genEff, waits: genWaits, score: genScore, fu: genFu, defense: genDefense };
function makePuzzle(kind, seed, diff = 'normal') {
  return PRACTICE_GEN[kind](seeded(seed), diff);
}

// Grading. eff / defense: a tile type; waits: a list of tile types; score / fu / choice: an option index.
function gradePuzzle(p, ans) {
  if (p.kind === 'eff' || p.kind === 'defense') return p.best.includes(ans);
  if (p.kind === 'waits' && !Array.isArray(ans)) return false;
  if (p.kind === 'waits') return ans.length === p.waits.length && p.waits.every(t => ans.includes(t));
  return ans === p.answer;
}

// Daily puzzle: the date picks the kind (rotating) and the seed. key is a local date as YYYYMMDD.
const dailyKey = d => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
const dayNumber = key =>
  Math.round(Date.UTC(Math.floor(key / 10000), (Math.floor(key / 100) % 100) - 1, key % 100) / 864e5);
const dailyKind = key => PRACTICE_KINDS[dayNumber(key) % PRACTICE_KINDS.length];
const dailyPuzzle = key => makePuzzle(dailyKind(key), Math.imul(key, 7919) + 13);

// Progress in localStorage['rmj-practice']: per kind {n, ok}, and daily results by date {ok, ans, kind}.
const PRACTICE_KEY = 'rmj-practice';
function loadPractice() {
  try {
    const p = JSON.parse(localStorage.getItem(PRACTICE_KEY) || '{}');
    return { kinds: p.kinds || {}, daily: p.daily || {} };
  } catch (e) {
    return { kinds: {}, daily: {} };
  }
}
function savePracticeResult(kind, ok, daily, ans) {
  const p = loadPractice(),
    k = p.kinds[kind] || (p.kinds[kind] = { n: 0, ok: 0 });
  k.n++;
  if (ok) k.ok++;
  if (daily) p.daily[daily] = { ok, ans, kind };
  try {
    localStorage.setItem(PRACTICE_KEY, JSON.stringify(p));
  } catch (e) {}
  return p;
}
// Days in a row, ending today, with the daily puzzle done (right or wrong).
function dailyStreak(p, today) {
  let n = 0,
    d = dayNumber(today);
  const keys = new Set(Object.keys(p.daily).map(k => dayNumber(+k)));
  while (keys.has(d - n)) n++;
  return n;
}

// ===================== Mistake book =====================
// Your costly discards from games (review.js adds them), in localStorage['rmj-mistakes'], the newest 60. Each is
// asked again as a discard puzzle, graded with the coach's view from the game; two right answers in a row clear it.
const BOOK_KEY = 'rmj-mistakes',
  BOOK_MAX = 60;
function loadBook() {
  try {
    const b = JSON.parse(localStorage.getItem(BOOK_KEY) || '[]');
    return Array.isArray(b) ? b : [];
  } catch (e) {
    return [];
  }
}
function saveBook(b) {
  try {
    localStorage.setItem(BOOK_KEY, JSON.stringify(b.slice(-BOOK_MAX)));
  } catch (e) {}
}
function addToBook(hand, rows, best, chose) {
  const b = loadBook(),
    key = hand.join();
  if (b.some(x => x.key === key)) return;
  b.push({ key, hand, rows: rows.map(({ d, s, n }) => ({ d, s, n })), best, chose, ok: 0 });
  saveBook(b);
}
const bookPuzzle = e => e && { kind: 'eff', hand: e.hand, rows: e.rows, best: e.best, book: e.key };
function bookResult(key, ok) {
  const b = loadBook(),
    e = b.find(x => x.key === key);
  if (!e) return;
  e.ok = ok ? e.ok + 1 : 0;
  saveBook(e.ok >= 2 ? b.filter(x => x !== e) : b);
}

// ===================== Tutorial =====================
// Six short lessons for a first game, each with a check. Hands are written like '123m456p789s11z' (z = honours
// 1–7: 东南西北白发中). Texts are in i18n ('tut.*'); a lesson's check is one of the puzzle kinds or a choice.
function parseHand(str) {
  const types = [];
  let buf = [];
  for (const ch of str) {
    if (/\d/.test(ch)) buf.push(+ch);
    else {
      const b = { m: 0, p: 9, s: 18, z: 27 }[ch];
      for (const n of buf) types.push(b + n - 1);
      buf = [];
    }
  }
  return idsOf(types).sort((a, b) => a - b);
}
const LESSONS = [
  // A winning hand is four sets and a pair: which tile completes this one?
  () => ({ kind: 'waits', hand: parseHand('123m456p789s11z24s'), suit: 2, waits: [20], lesson: 0 }),
  // The dora is the tile after the indicator, wrapping 9 → 1.
  () => ({ kind: 'choice', lesson: 1, doraInd: [8], tiles: [0, 7, 8, 27], answer: 0 }),
  // Shanten and effective draws: an easy discard puzzle.
  () => ({ ...makePuzzle('eff', 4101, 'easy'), lesson: 2 }),
  // No yaku, no win: an open hand without a yaku cannot ron.
  () => ({
    kind: 'choice',
    lesson: 3,
    hand: parseHand('345m789m567s9p'),
    melds: [{ type: 'chi', ids: parseHand('234p'), called: parseHand('234p')[0], from: 3 }],
    winId: parseHand('9p')[0] - 1,
    options: ['tut.opt.yes', 'tut.opt.no'],
    answer: 1
  }),
  // What riichi gives you.
  () => ({ kind: 'choice', lesson: 4, options: ['tut.opt.r0', 'tut.opt.r1', 'tut.opt.r2'], answer: 0 }),
  // Defence: discard a genbutsu.
  () => ({ ...makePuzzle('defense', 4106, 'easy'), lesson: 5 })
];
const lessonPuzzle = i => LESSONS[i] && LESSONS[i]();
// Lessons done, in localStorage['rmj-tutorial'].
const TUT_KEY = 'rmj-tutorial';
function tutDone() {
  try {
    return JSON.parse(localStorage.getItem(TUT_KEY) || '[]');
  } catch (e) {
    return [];
  }
}
function markLesson(i) {
  const d = tutDone();
  if (!d.includes(i)) d.push(i);
  try {
    localStorage.setItem(TUT_KEY, JSON.stringify(d));
  } catch (e) {}
}
