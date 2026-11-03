// Practice puzzles, generated from a seed with no DOM (practice-ui.js shows them):
//   eff     — which tile to discard, by effective draws counted from your own hand
//   waits   — which tiles a tenpai hand is waiting on
//   score   — what a winning hand is worth
//   defense — which tile is safest against a riichi
// Each generator takes a seeded() random function, so a seed always gives the same puzzle; the daily puzzle
// seeds from the date, so everyone gets the same one.
const PRACTICE_KINDS = ['eff', 'waits', 'score', 'defense'];
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
function genEff(r) {
  return untilGood(r, r => {
    let types;
    if (r() < 0.5)
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
    const best = rows.filter(x => x.s === b.s && x.n === b.n).map(x => x.d);
    if (best.length > 2 || new Set(rows.map(x => x.s + '/' + x.n)).size < 4) return null;
    return { kind: 'eff', hand, rows, best };
  });
}

// A 13-tile tenpai hand with at least two waits, all in one suit (the suit the answer palette shows).
// Half are pure one-suit hands, half have two groups from elsewhere.
function genWaits(r) {
  return untilGood(r, r => {
    const s = Math.floor(r() * 3),
      pure = r() < 0.5;
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

// A closed winning hand with its situation, and four payments to choose from (one right).
function genScore(r) {
  return untilGood(r, r => {
    const types = [
      ...randGroup(r, null, true),
      ...randGroup(r, null, true),
      ...randGroup(r, null, true),
      ...randGroup(r, null, true),
      ...randPair(r, true)
    ];
    if (!fitsFour(types)) return null;
    const ids = idsOf(types),
      winId = pickOf(r, ids),
      isTsumo = r() < 0.4,
      riichi = r() < 0.6;
    const seat = Math.floor(r() * 4),
      round = r() < 0.75 ? 0 : 1,
      doraInd = [randTile(r)];
    const hand = (isTsumo ? ids : ids.filter(id => id !== winId)).sort((a, b) => a - b);
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
    const ctx = {
      hand,
      melds: [],
      winId,
      isTsumo,
      seat: 27 + seat,
      round: 27 + round,
      isDealer: seat === 0,
      sit,
      doraInd,
      uraInd: null
    };
    const res = evaluate(ctx);
    if (!res || res.yakuman) return null;
    const answer = payOf(res, isTsumo),
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
    return {
      kind: 'score',
      hand,
      winId,
      isTsumo,
      riichi,
      seat,
      round,
      isDealer: seat === 0,
      doraInd,
      res,
      options,
      answer: options.findIndex(p => samePay(p, answer))
    };
  });
}

// A riichi player's river and your 14 tiles. Risk follows tileRisk (the AI's rules), counting copies in the
// river as visible. Good puzzles have one or two safest tiles that are reasonably safe, and some dangerous ones.
function genDefense(r) {
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
    return { kind: 'defense', hand: handIds, river: riverIds, risk, best };
  });
}

const PRACTICE_GEN = { eff: genEff, waits: genWaits, score: genScore, defense: genDefense };
function makePuzzle(kind, seed) {
  return PRACTICE_GEN[kind](seeded(seed));
}

// Grading. eff / defense: a tile type; waits: a list of tile types; score: an option index.
function gradePuzzle(p, ans) {
  if (p.kind === 'eff' || p.kind === 'defense') return p.best.includes(ans);
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
