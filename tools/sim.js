// Headless AI-vs-AI simulator for tuning the computer difficulty levels.
//
//   node tools/sim.js [games] [levels] [east|south] [seed]
//   node tools/sim.js 60 easy,normal,hard south 1
//
// Seats 1–3 play the given levels, rotated across games so no level keeps the same seat.
// Seat 0 (the human seat) is a stand-in normal AI that takes ron but never calls.
// Game g is dealt from seed + g (default seed 1), so the same arguments always give the same table.
// Reports per level: average final score, average rank, share of 1st / 4th, win rate and deal-in rate per hand.
const { load } = require('./load.js');

const games = +process.argv[2] || 30;
const levels = (process.argv[3] || 'easy,normal,hard').split(',');
const len = process.argv[4] || 'south';
const seed = process.argv[5] === undefined ? 1 : +process.argv[5];
if (levels.length !== 3) throw new Error('give exactly three levels, e.g. easy,normal,hard');

let src = '';
src += `
var SIMLV = ['normal', 'normal', 'normal', 'normal'], DONE = null, EV = [], HANDS = 0;
function lvl(p) { return SIMLV[p]; }
async function pause() {}
function render() {}
function showModal() { return Promise.resolve(); }
async function humanTurn(p, info) { return aiTurn(p, info); }
async function input() { const c = UI.call; return { type: c && c.ron ? 'ron' : 'pass' }; }
function log(k, v) {
  G.log.push({ k, v });
  if (k === 'win') EV.push({ w: v.w, l: v.l == null ? -1 : v.l });
}
const _startRound = startRound;
startRound = function () { HANDS++; _startRound(); };
async function showFinal() {
  const order = [0, 1, 2, 3].sort((a, b) => G.players[b].score - G.players[a].score || a - b);
  G.players[order[0]].score += G.kyotaku * 1000; G.kyotaku = 0;
  DONE({ scores: G.players.map(p => p.score), order, hands: HANDS, events: EV });
}
function simGame(lv, seed) { SIMLV = ['normal', ...lv]; EV = []; HANDS = 0; return new Promise(r => { DONE = r; newGame(seed); }); }
S.len = '${len}';
`;
const { run } = load(src);

const rotations = [
  [0, 1, 2],
  [1, 2, 0],
  [2, 0, 1],
  [0, 2, 1],
  [2, 1, 0],
  [1, 0, 2]
];
const st = {};
for (const k of levels) st[k] = { n: 0, score: 0, rank: 0, first: 0, last: 0, hands: 0, win: 0, deal: 0 };

(async () => {
  const t0 = Date.now();
  for (let g = 0; g < games; g++) {
    const lv = rotations[g % rotations.length].map(i => levels[i]);
    const r = await run(`simGame(${JSON.stringify(lv)}, ${seed + g})`);
    for (let seat = 1; seat < 4; seat++) {
      const o = st[lv[seat - 1]],
        rank = r.order.indexOf(seat) + 1;
      o.n++;
      o.score += r.scores[seat];
      o.rank += rank;
      o.hands += r.hands;
      if (rank === 1) o.first++;
      if (rank === 4) o.last++;
      for (const e of r.events) {
        if (e.w === seat) o.win++;
        if (e.l === seat) o.deal++;
      }
    }
  }
  const pct = (a, b) => ((100 * a) / b).toFixed(1) + '%';
  console.table(
    Object.fromEntries(
      Object.entries(st).map(([k, o]) => [
        k,
        {
          平均终局点: Math.round(o.score / o.n),
          平均顺位: +(o.rank / o.n).toFixed(2),
          一位率: pct(o.first, o.n),
          四位率: pct(o.last, o.n),
          和了率: pct(o.win, o.hands),
          放铳率: pct(o.deal, o.hands)
        }
      ])
    )
  );
  console.log(`${games} games (${len}, seed ${seed}) in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
})();
