// Seeded games and save / resume: a game is determined by its seed, and a game cut off at any turn and
// resumed from its save finishes exactly like the one that was never interrupted.
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('../tools/load.js');

// Computer-only games, as in tools/sim.js: seat 0 plays as an AI, no delays, no modals.
// STOP_AFTER cuts the game off right after that many saves, the way closing the page would.
const harness = `
var DONE = null, STOP_AFTER = Infinity, SAVES = 0, SNAP = null;
function lvl(p) { return ['normal', 'easy', 'normal', 'hard'][p]; }
async function pause() { const g = GEN; await null; if (g !== GEN) throw ABORT; }
function render() {}
function showModal() { return Promise.resolve(); }
async function humanTurn(p, info) { return aiTurn(p, info); }
async function input() { const c = UI.call; return { type: c && c.ron ? 'ron' : 'pass' }; }
const _saveGame = saveGame;
saveGame = function () { _saveGame(); SAVES++; if (SAVES === STOP_AFTER) { SNAP = localStorage.getItem(SAVE_KEY); GEN++; } };
async function showFinal() { clearSave(); DONE(G.players.map(p => p.score)); }
function play(seed) { return new Promise(r => { DONE = r; newGame(seed); }); }
function resume() { return new Promise(r => { DONE = r; resumeGame(loadSave()); }); }
S.len = 'east';
this.getG = () => G;
`;
const settle = () => new Promise(r => setTimeout(r, 0));

test('the same seed deals the same hands, another seed does not', () => {
  const deal = seed => {
    const { run } = load(harness);
    run(
      `GEN++; G = { seed: ${seed}, rng: ${seed}, dealt: 0, players: [0,1,2,3].map(() => ({})), dealer: 0, bakaze: 0, kyoku: 0, honba: 0 }; startRound();`
    );
    return JSON.stringify(run('G.players.map(p => p.hand)'));
  };
  assert.strictEqual(deal(42), deal(42));
  assert.notStrictEqual(deal(42), deal(43));
});

test('a round is dealt the same whatever randomness was used before it', () => {
  const deal = (rng, dealt) => {
    const { run } = load(harness);
    run(
      `GEN++; G = { seed: 99, rng: ${rng}, dealt: ${dealt}, players: [0,1,2,3].map(() => ({})), dealer: 0, bakaze: 0, kyoku: 0, honba: 0 }; startRound();`
    );
    return JSON.stringify(run('[G.wall, G.dead]'));
  };
  assert.strictEqual(deal(1, 3), deal(123456, 3)); // the AI drew different amounts of rand() before hand 4
  assert.notStrictEqual(deal(1, 3), deal(1, 4));
});

test('a save keeps Sets and round state', () => {
  const { run } = load(harness);
  run(`GEN++; G = { seed: 7, rng: 7, dealt: 0, players: [0,1,2,3].map(() => ({ score: 25000 })), dealer: 0, bakaze: 0, kyoku: 0, honba: 0, kyotaku: 0 };
    startRound(); G.players[1].safe.add(5); G.players[1].safe.add(30); G.flow = { p: 2, mode: 'call', forbid: [4, 7] }; saveGame();`);
  const back = run('loadSave()');
  assert.ok(back.players[1].safe instanceof run('Set'));
  assert.deepStrictEqual([...back.players[1].safe], [5, 30]);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(back.flow)), { p: 2, mode: 'call', forbid: [4, 7] });
  assert.strictEqual(JSON.stringify(back.wall), JSON.stringify(run('G.wall')));
  assert.strictEqual(back.rng, run('G.rng'));
});

test('a save is ignored when it has no turn in progress or an old version', () => {
  const storage = { 'rmj-game': JSON.stringify({ v: 0, G: { flow: {} } }) };
  const { run } = load(harness, { storage });
  assert.strictEqual(run('loadSave()'), null);
  storage['rmj-game'] = '{not json';
  assert.strictEqual(run('loadSave()'), null);
});

test('a game resumed from its save finishes exactly like the uninterrupted game', async () => {
  const seed = 2024;
  const full = JSON.stringify(await load(harness).run(`play(${seed})`));
  assert.strictEqual(
    JSON.parse(full).reduce((a, b) => a + b, 0),
    100000
  );

  for (const stopAfter of [1, 23, 90, 200]) {
    const first = load(harness);
    first.run(`STOP_AFTER = ${stopAfter}; play(${seed});`);
    await settle();
    const snap = first.run('SNAP');
    assert.ok(snap, `game ended before save ${stopAfter}`);

    const second = load(harness, { storage: { 'rmj-game': snap } });
    const scores = await second.run('resume()');
    assert.strictEqual(JSON.stringify(scores), full, `resumed after save ${stopAfter}`);
    assert.strictEqual(second.storage['rmj-game'], undefined, 'finished game clears its save');
  }
});
