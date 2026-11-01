// Game-flow rules that live in game.js (kuikae, kan after riichi, kan dora timing, ukeire cache).
// game.js expects a browser, so it is loaded into a VM with a stub document, like tools/sim.js does.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const el = () => ({ innerHTML: '', textContent: '', hidden: true, value: '', checked: false, addEventListener() {}, focus() {} });
const els = {};
const ctx = { console, Math, setTimeout, Promise, Set, Map, Array, JSON, Object, Infinity,
  document: { querySelector: s => els[s] || (els[s] = el()), querySelectorAll: () => [] } };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/engine.js'), 'utf8') + '\n' +
  fs.readFileSync(path.join(root, 'js/i18n.js'), 'utf8') + '\n' +
  fs.readFileSync(path.join(root, 'js/game.js'), 'utf8').replace(/\nnewGame\(\);\s*$/, '\n') +
  '\nthis.setG = g => { G = g; }; this.getG = () => G;', ctx);
const run = src => vm.runInContext(src, ctx);

// "234m55z" → tile ids, using copies 3,2,1,0 so red fives only appear when four copies are used.
function parse(str) {
  const ids = [], used = {};
  let buf = [];
  for (const ch of str) {
    if (/\d/.test(ch)) { buf.push(+ch); continue; }
    const base = { m: 0, p: 9, s: 18, z: 27 }[ch];
    for (const n of buf) { const t = base + n - 1; used[t] = used[t] || 0; ids.push(t * 4 + 3 - used[t]); used[t]++; }
    buf = [];
  }
  return ids;
}
const player = (hand, extra = {}) => ({ hand, melds: [], river: [], drawn: null, riichi: false, safe: new Set(), score: 25000, ...extra });
function table(p0) {
  ctx.setG({ players: [p0, player([]), player([]), player([])], dealer: 0, kyoku: 0, bakaze: 0, honba: 0, kyotaku: 0,
    log: [], turn: 0, wall: new Array(60).fill(0), dead: [...Array(14).keys()].map(i => 100 + i),
    kanCount: 0, doraCount: 1, pendingDora: 0, noCalls: true, last: null });
}
const cnt = str => { const c = new Array(34).fill(0); for (const id of parse(str)) c[id >> 2]++; return c; };
const plain = v => JSON.parse(JSON.stringify(v));

test('食替：现物和筋都不能打', () => {
  assert.deepStrictEqual(plain(ctx.kuikaeOf(1, [2, 3])), [1, 4]);   // 34m 吃 2m：不能打 2m、5m
  assert.deepStrictEqual(plain(ctx.kuikaeOf(4, [2, 3])), [4, 1]);   // 34m 吃 5m：不能打 5m、2m
  assert.deepStrictEqual(plain(ctx.kuikaeOf(2, [1, 3])), [2]);      // 嵌张吃：只禁现物
  assert.deepStrictEqual(plain(ctx.kuikaeOf(6, [7, 8])), [6]);      // 89m 吃 7m：没有筋
  assert.deepStrictEqual(plain(ctx.kuikaeOf(5, [5, 5])), [5]);      // 碰
});

test('吃完没有可打的牌时不能吃', () => {
  assert.deepStrictEqual(plain(ctx.chiPatterns(2, cnt('3345m'))), []);         // 45m 吃 3m 剩 33m：现物
  assert.deepStrictEqual(plain(ctx.chiPatterns(2, cnt('4566m'))), []);         // 45m 吃 3m 剩 66m：筋
  assert.deepStrictEqual(plain(ctx.chiPatterns(2, cnt('4567m'))), [[3, 4]]);   // 剩 67m：7m 可打
});

test('立直后暗杠：只能杠摸到的牌，且不改变听牌', () => {
  // 222m 456p 789s 11z 34s 听 2s5s，摸到第四张 2m：杠后仍听 2s5s，可以杠
  let hand = parse('222m456p789s11z34s'), drawn = parse('2222m')[3];
  table(player([...hand, drawn], { riichi: true, drawn }));
  assert.deepStrictEqual(plain(ctx.kanOptions(0)), [{ kind: 'ankan', t: 1 }]);
  // 2223m 456p 789s 11z 听 1m3m4m，杠 2m 后只听 3m：不能杠
  hand = parse('2223m456p789s11z');
  table(player([...hand, drawn], { riichi: true, drawn }));
  assert.deepStrictEqual(plain(ctx.kanOptions(0)), []);
  // 手里早有四张 2m，摸到别的牌：不能杠
  hand = parse('2222m456p789s11z3s'); drawn = parse('9m')[0];
  table(player([...hand, drawn], { riichi: true, drawn }));
  assert.deepStrictEqual(plain(ctx.kanOptions(0)), []);
});

test('明杠 / 加杠的新宝牌在打牌时才翻，暗杠立即翻', () => {
  table(player(parse('123m')));
  run('revealKan(true)');
  assert.strictEqual(ctx.getG().doraCount, 1);
  assert.strictEqual(ctx.getG().pendingDora, 1);
  run('revealKan(false)');                   // 下一次杠先翻出前一个
  assert.strictEqual(ctx.getG().doraCount, 3);
  run('revealKan(true)');
  const id = ctx.getG().players[0].hand[0];
  run(`doDiscard(0, ${id}, false)`);
  assert.strictEqual(ctx.getG().doraCount, 4);
  assert.strictEqual(ctx.getG().pendingDora, 0);
});

test('进张表缓存随场面更新', () => {
  table(player(parse('123m456p789s1122z')));
  const a = ctx.ukeireTable(0);
  assert.strictEqual(ctx.ukeireTable(0), a);                     // 同一场面命中缓存
  ctx.getG().players[2].river.push({ id: parse('1z')[0] });       // 对家打出一张东，东的剩余张数变了
  const b = ctx.ukeireTable(0);
  assert.notStrictEqual(b, a);
  assert.deepStrictEqual(plain(b), plain(ctx.ukeireCompute(0)));
});
