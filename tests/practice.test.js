// Practice puzzles: every generator gives a valid, gradable puzzle, the same seed gives the same puzzle,
// and the daily puzzle depends only on the date.
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('../tools/load.js');

const { run } = load('', { storage: {} });
const plain = v => JSON.parse(JSON.stringify(v));
const SEEDS = Array.from({ length: 40 }, (_, i) => i * 101 + 7);

test('discard puzzles: one or two from tenpai, at most two best tiles, best matches the option table', () => {
  for (const seed of SEEDS) {
    const p = run(`makePuzzle('eff', ${seed})`);
    assert.strictEqual(p.hand.length, 14);
    const rows = run(`discardOptions(${JSON.stringify(p.hand)})`);
    assert.ok(rows[0].s >= 1 && rows[0].s <= 2, `seed ${seed}: shanten ${rows[0].s}`);
    assert.ok(p.best.length >= 1 && p.best.length <= 2);
    for (const d of p.best) assert.ok(run(`gradePuzzle(makePuzzle('eff', ${seed}), ${d})`));
    const worst = rows[rows.length - 1].d;
    assert.ok(!p.best.includes(worst) && !run(`gradePuzzle(makePuzzle('eff', ${seed}), ${worst})`));
  }
});

test('wait puzzles: 13-tile tenpai, two or more waits, all in the shown suit, as the rules compute them', () => {
  for (const seed of SEEDS) {
    const p = run(`makePuzzle('waits', ${seed})`);
    assert.strictEqual(p.hand.length, 13);
    assert.deepStrictEqual(plain(p.waits), plain(run(`waitsFor(${JSON.stringify(p.hand)}, 0)`)));
    assert.ok(p.waits.length >= 2);
    for (const t of p.waits) assert.strictEqual(Math.floor(t / 9), p.suit);
    assert.ok(run(`gradePuzzle(makePuzzle('waits', ${seed}), ${JSON.stringify([...p.waits].reverse())})`));
    assert.ok(!run(`gradePuzzle(makePuzzle('waits', ${seed}), ${JSON.stringify(p.waits.slice(1))})`));
  }
});

test('scoring puzzles: the marked option is what the engine pays, the other three differ', () => {
  for (const seed of SEEDS) {
    const p = run(`makePuzzle('score', ${seed})`);
    const res = run(`evaluate(${JSON.stringify({ hand: p.hand, melds: [], winId: p.winId, isTsumo: p.isTsumo, seat: 27 + p.seat, round: 27 + p.round,
      isDealer: p.isDealer, sit: { riichi: p.riichi }, doraInd: p.doraInd, uraInd: null })})`);
    assert.ok(res && !res.yakuman);
    const want = !p.isTsumo ? { ron: res.ron } : res.isDealer ? { all: res.tsumoAll } : { n: res.tsumoN, d: res.tsumoD };
    assert.deepStrictEqual(plain(p.options[p.answer]), want);
    assert.strictEqual(new Set(p.options.map(o => JSON.stringify(o))).size, 4);
    assert.strictEqual(p.hand.length, p.isTsumo ? 14 : 13);
  }
});

test('defence puzzles: the answer is the lowest-risk tile by the AI danger rules', () => {
  for (const seed of SEEDS) {
    const p = run(`makePuzzle('defense', ${seed})`);
    const riv = p.river.map(id => id >> 2);
    const risk = t => run(`tileRisk(${t}, new Set(${JSON.stringify(riv)}), new Set(), ${riv.filter(x => x === t).length})`).d;
    const types = [...new Set(p.hand.map(id => id >> 2))], min = Math.min(...types.map(risk));
    assert.deepStrictEqual([...p.best].sort(), types.filter(t => risk(t) === min).sort());
    assert.ok(min <= 3);
  }
});

test('the same seed gives the same puzzle', () => {
  for (const k of ['eff', 'waits', 'score', 'defense'])
    assert.strictEqual(JSON.stringify(run(`makePuzzle('${k}', 4242)`)), JSON.stringify(run(`makePuzzle('${k}', 4242)`)));
});

test('daily puzzle rotates through the kinds by date and is fixed for a date', () => {
  const kinds = [20261103, 20261104, 20261105, 20261106].map(k => run(`dailyKind(${k})`));
  assert.deepStrictEqual(new Set(kinds).size, 4);
  assert.strictEqual(run('dailyKind(20261107)'), kinds[0]);
  assert.strictEqual(JSON.stringify(run('dailyPuzzle(20261103)')), JSON.stringify(run('dailyPuzzle(20261103)')));
  assert.strictEqual(run('dailyKey(new Date(2026, 10, 3))'), 20261103);
});

test('practice progress counts results and the daily streak', () => {
  run(`savePracticeResult('eff', true); savePracticeResult('eff', false);
       savePracticeResult('waits', true, 20261101, [1]); savePracticeResult('waits', true, 20261102, [1]); savePracticeResult('eff', false, 20261103, 5);`);
  const p = run('loadPractice()');
  assert.deepStrictEqual(plain(p.kinds.eff), { n: 3, ok: 1 });
  assert.strictEqual(run('dailyStreak(loadPractice(), 20261103)'), 3);
  assert.strictEqual(run('dailyStreak(loadPractice(), 20261105)'), 0);
  assert.strictEqual(run('dailyStreak(loadPractice(), 20261102)'), 2);
});
