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
    const res = run(
      `evaluate(${JSON.stringify({
        hand: p.hand,
        melds: [],
        winId: p.winId,
        isTsumo: p.isTsumo,
        seat: 27 + p.seat,
        round: 27 + p.round,
        isDealer: p.isDealer,
        sit: { riichi: p.riichi },
        doraInd: p.doraInd,
        uraInd: null
      })})`
    );
    assert.ok(res && !res.yakuman);
    const want = !p.isTsumo
      ? { ron: res.ron }
      : res.isDealer
        ? { all: res.tsumoAll }
        : { n: res.tsumoN, d: res.tsumoD };
    assert.deepStrictEqual(plain(p.options[p.answer]), want);
    assert.strictEqual(new Set(p.options.map(o => JSON.stringify(o))).size, 4);
    assert.strictEqual(p.hand.length, p.isTsumo ? 14 : 13);
  }
});

test('defence puzzles: the answer is the lowest-risk tile by the AI danger rules', () => {
  for (const seed of SEEDS) {
    const p = run(`makePuzzle('defense', ${seed})`);
    const riv = p.river.map(id => id >> 2);
    const risk = t =>
      run(`tileRisk(${t}, new Set(${JSON.stringify(riv)}), new Set(), ${riv.filter(x => x === t).length})`).d;
    const types = [...new Set(p.hand.map(id => id >> 2))],
      min = Math.min(...types.map(risk));
    assert.deepStrictEqual([...p.best].sort(), types.filter(t => risk(t) === min).sort());
    assert.ok(min <= 3);
  }
});

test('the same seed gives the same puzzle', () => {
  for (const k of ['eff', 'waits', 'score', 'defense'])
    assert.strictEqual(
      JSON.stringify(run(`makePuzzle('${k}', 4242)`)),
      JSON.stringify(run(`makePuzzle('${k}', 4242)`))
    );
});

test('daily puzzle rotates through the kinds by date and is fixed for a date', () => {
  const keys = [20261103, 20261104, 20261105, 20261106, 20261107];
  const kinds = keys.map(k => run(`dailyKind(${k})`));
  assert.strictEqual(new Set(kinds).size, 5);
  assert.strictEqual(run('dailyKind(20261108)'), kinds[0]);
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

test('difficulty levels shape the puzzles', () => {
  for (const seed of SEEDS.slice(0, 15)) {
    const e = run(`makePuzzle('eff', ${seed}, 'easy')`),
      h = run(`makePuzzle('eff', ${seed}, 'hard')`);
    assert.strictEqual(e.rows[0].s, 1);
    assert.strictEqual(e.best.length, 1);
    assert.strictEqual(h.rows[0].s, 2);
    assert.strictEqual(run(`makePuzzle('waits', ${seed}, 'easy')`).waits.length, 2);
    assert.ok(run(`makePuzzle('waits', ${seed}, 'hard')`).waits.length >= 3);
    const s = run(`makePuzzle('score', ${seed}, 'easy')`);
    assert.ok(!s.isTsumo && !s.isDealer && s.riichi && !s.melds.length);
    assert.strictEqual(
      run(`(p => Math.min(...Object.values(p.risk).map(x => x.d)))(makePuzzle('defense', ${seed}, 'easy'))`),
      0
    );
    assert.ok(
      run(`(p => Math.min(...Object.values(p.risk).map(x => x.d)))(makePuzzle('defense', ${seed}, 'hard'))`) >= 1
    );
  }
  // Hard scoring puzzles include open hands, and the engine agrees with their answers.
  let open = 0;
  for (const seed of SEEDS) {
    const p = run(`makePuzzle('score', ${seed}, 'hard')`);
    if (p.melds.length) open++;
    const res = run(
      `evaluate(${JSON.stringify({
        hand: p.hand,
        melds: p.melds,
        winId: p.winId,
        isTsumo: p.isTsumo,
        seat: 27 + p.seat,
        round: 27 + p.round,
        isDealer: p.isDealer,
        sit: { riichi: p.riichi },
        doraInd: p.doraInd,
        uraInd: null
      })})`
    );
    assert.strictEqual(res.han, p.res.han);
  }
  assert.ok(open > 10, `only ${open} open hands`);
});

test('fu puzzles: the answer is the engine fu, and the breakdown adds up to it', () => {
  for (const seed of SEEDS) {
    const p = run(`makePuzzle('fu', ${seed})`);
    assert.strictEqual(p.options[p.answer], p.res.fu);
    assert.strictEqual(new Set(p.options).size, 4);
    const sum = p.res.fuParts.reduce((a, x) => a + x[1], 0);
    assert.strictEqual(p.res.fu, sum === 25 ? 25 : Math.ceil(sum / 10) * 10, JSON.stringify(p.res.fuParts));
  }
});

test('mistake book: added once, cleared after two right answers in a row', () => {
  run(
    `addToBook([1,2,3], [{ d: 1, s: 1, n: 20, tiles: [] }, { d: 2, s: 1, n: 10 }], [1], 2); addToBook([1,2,3], [], [1], 2); addToBook([4,5,6], [], [4], 5);`
  );
  assert.strictEqual(run('loadBook().length'), 2);
  assert.deepStrictEqual(plain(run('loadBook()[0].rows')), [
    { d: 1, s: 1, n: 20 },
    { d: 2, s: 1, n: 10 }
  ]);
  run(`bookResult('1,2,3', true); bookResult('1,2,3', false); bookResult('1,2,3', true)`);
  assert.strictEqual(run('loadBook().length'), 2);
  run(`bookResult('1,2,3', true)`);
  assert.deepStrictEqual(plain(run('loadBook().map(e => e.key)')), ['4,5,6']);
});

test('tutorial lessons: each check has a right answer the grader accepts', () => {
  const answers = [[20], 0, null, 1, 0, null];
  for (let i = 0; i < 6; i++) {
    const p = run(`lessonPuzzle(${i})`);
    const ans = answers[i] ?? (p.kind === 'eff' || p.kind === 'defense' ? p.best[0] : p.answer);
    assert.ok(run(`gradePuzzle(lessonPuzzle(${i}), ${JSON.stringify(ans)})`), `lesson ${i}`);
  }
  // Lesson 1's hand really waits only on 3s, and lesson 4's open hand really has no yaku.
  assert.deepStrictEqual(plain(run('waitsFor(lessonPuzzle(0).hand, 0)')), [20]);
  const l = run('lessonPuzzle(3)');
  assert.strictEqual(
    run(`evaluate({ hand: ${JSON.stringify(l.hand)}, melds: ${JSON.stringify(l.melds)}, winId: ${l.winId}, isTsumo: false,
    seat: 28, round: 27, isDealer: false, sit: {}, doraInd: [33], uraInd: null })`),
    null
  );
});
