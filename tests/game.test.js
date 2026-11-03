// Game-flow rules that live in rules.js (kuikae, kan after riichi, kan dora timing, ukeire cache).
// The game scripts are loaded into a VM with a stub document (tools/load.js), like tools/sim.js does.
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('../tools/load.js');

const { ctx, run } = load('this.setG = g => { G = g; }; this.getG = () => G;');

// "234m55z" → tile ids, using copies 3,2,1,0 so red fives only appear when four copies are used.
function parse(str) {
  const ids = [],
    used = {};
  let buf = [];
  for (const ch of str) {
    if (/\d/.test(ch)) {
      buf.push(+ch);
      continue;
    }
    const base = { m: 0, p: 9, s: 18, z: 27 }[ch];
    for (const n of buf) {
      const t = base + n - 1;
      used[t] = used[t] || 0;
      ids.push(t * 4 + 3 - used[t]);
      used[t]++;
    }
    buf = [];
  }
  return ids;
}
const player = (hand, extra = {}) => ({
  hand,
  melds: [],
  river: [],
  drawn: null,
  riichi: false,
  safe: new Set(),
  score: 25000,
  ...extra
});
function table(p0) {
  ctx.setG({
    players: [p0, player([]), player([]), player([])],
    dealer: 0,
    kyoku: 0,
    bakaze: 0,
    honba: 0,
    kyotaku: 0,
    log: [],
    turn: 0,
    wall: new Array(60).fill(0),
    dead: [...Array(14).keys()].map(i => 100 + i),
    kanCount: 0,
    doraCount: 1,
    pendingDora: 0,
    noCalls: true,
    last: null
  });
}
const cnt = str => {
  const c = new Array(34).fill(0);
  for (const id of parse(str)) c[id >> 2]++;
  return c;
};
const plain = v => JSON.parse(JSON.stringify(v));

test('食替：现物和筋都不能打', () => {
  assert.deepStrictEqual(plain(ctx.kuikaeOf(1, [2, 3])), [1, 4]); // 34m 吃 2m：不能打 2m、5m
  assert.deepStrictEqual(plain(ctx.kuikaeOf(4, [2, 3])), [4, 1]); // 34m 吃 5m：不能打 5m、2m
  assert.deepStrictEqual(plain(ctx.kuikaeOf(2, [1, 3])), [2]); // 嵌张吃：只禁现物
  assert.deepStrictEqual(plain(ctx.kuikaeOf(6, [7, 8])), [6]); // 89m 吃 7m：没有筋
  assert.deepStrictEqual(plain(ctx.kuikaeOf(5, [5, 5])), [5]); // 碰
});

test('吃完没有可打的牌时不能吃', () => {
  assert.deepStrictEqual(plain(ctx.chiPatterns(2, cnt('3345m'))), []); // 45m 吃 3m 剩 33m：现物
  assert.deepStrictEqual(plain(ctx.chiPatterns(2, cnt('4566m'))), []); // 45m 吃 3m 剩 66m：筋
  assert.deepStrictEqual(plain(ctx.chiPatterns(2, cnt('4567m'))), [[3, 4]]); // 剩 67m：7m 可打
});

test('立直后暗杠：只能杠摸到的牌，且不改变听牌', () => {
  // 222m 456p 789s 11z 34s 听 2s5s，摸到第四张 2m：杠后仍听 2s5s，可以杠
  let hand = parse('222m456p789s11z34s'),
    drawn = parse('2222m')[3];
  table(player([...hand, drawn], { riichi: true, drawn }));
  assert.deepStrictEqual(plain(ctx.kanOptions(0)), [{ kind: 'ankan', t: 1 }]);
  // 2223m 456p 789s 11z 听 1m3m4m，杠 2m 后只听 3m：不能杠
  hand = parse('2223m456p789s11z');
  table(player([...hand, drawn], { riichi: true, drawn }));
  assert.deepStrictEqual(plain(ctx.kanOptions(0)), []);
  // 手里早有四张 2m，摸到别的牌：不能杠
  hand = parse('2222m456p789s11z3s');
  drawn = parse('9m')[0];
  table(player([...hand, drawn], { riichi: true, drawn }));
  assert.deepStrictEqual(plain(ctx.kanOptions(0)), []);
});

test('明杠 / 加杠的新宝牌在打牌时才翻，暗杠立即翻', () => {
  table(player(parse('123m')));
  run('revealKan(true)');
  assert.strictEqual(ctx.getG().doraCount, 1);
  assert.strictEqual(ctx.getG().pendingDora, 1);
  run('revealKan(false)'); // 下一次杠先翻出前一个
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
  assert.strictEqual(ctx.ukeireTable(0), a); // 同一场面命中缓存
  ctx.getG().players[2].river.push({ id: parse('1z')[0] }); // 对家打出一张东，东的剩余张数变了
  const b = ctx.ukeireTable(0);
  assert.notStrictEqual(b, a);
  assert.deepStrictEqual(plain(b), plain(ctx.ukeireCompute(0)));
});

test('复盘：判断出牌是一致、少进张、退向听', () => {
  const rows = [
    { d: 1, s: 1, n: 20 },
    { d: 2, s: 1, n: 20 },
    { d: 3, s: 1, n: 12 },
    { d: 4, s: 2, n: 30 }
  ];
  assert.deepStrictEqual(plain(ctx.judgeDiscard(rows, 2, [])), { kind: 'match', loss: 0 });
  assert.deepStrictEqual(plain(ctx.judgeDiscard(rows, 3, [])), { kind: 'slow', loss: 8 });
  assert.deepStrictEqual(plain(ctx.judgeDiscard(rows, 4, [])), { kind: 'back', loss: 0 });
});

test('复盘：对立直打现物算防守，不算失误；记录手牌、推荐和现物', () => {
  // 123m 456p 789s 东东 + 孤张 4m 9p 1s：牌效上 4m 最该留，但下家立直后 4m 是现物。
  const hand = parse('1234m4569p789s1s11z');
  table(player(hand));
  const G = ctx.getG();
  G.players[1] = player([], { riichi: true, river: [{ id: parse('4m')[0] }] });
  G.review = [];
  G.stats = run('newStats()');
  const four = hand.find(id => id >> 2 === 3);
  run(`recordDiscard(${four}, [])`);
  const r = G.review[0];
  assert.strictEqual(r.kind, 'defend');
  assert.strictEqual(r.hand.length, 14);
  assert.ok(!r.recs.includes(3), 'recommended tiles are the efficient ones, not 4m');
  assert.deepStrictEqual(plain(r.th), [{ p: 1, dg: 0, safe: [3] }]);
  assert.deepStrictEqual(plain(G.stats), {
    decisions: 1,
    match: 0,
    defend: 1,
    slow: 0,
    back: 0,
    lost: 0,
    dealIn: 0,
    hands: 0,
    wins: 0,
    riichi: 0,
    calls: 0
  });
  // Without the riichi the same discard is just less efficient.
  table(player(hand));
  const G2 = ctx.getG();
  G2.review = [];
  G2.stats = run('newStats()');
  run(`recordDiscard(${four}, [])`);
  assert.strictEqual(G2.review[0].kind, 'slow');
  assert.ok(G2.review[0].loss > 0);
});

test('放铳分析：立直后摸切没有可选的出牌', () => {
  table(player(parse('123m456p789s11z23s'), { riichi: true }));
  const G = ctx.getG();
  G.players[1] = player([], { riichi: true });
  G.review = [{ id: 999, mine: { s: 0 }, th: [] }];
  const info = run(`dealInInfo(1, ${parse('4s')[0]})`);
  assert.strictEqual(info.locked, true);
  assert.strictEqual(info.riichi, true);
});

test('统计：对局记录最多保留 200 场，汇总和了率、放铳率和一致率', () => {
  const { run } = require('../tools/load.js').load('this.getG = () => G;', { storage: {} });
  run(
    `G = { lastWind: 0, stats: Object.assign(newStats(), { hands: 5, wins: 1, dealIn: 1, riichi: 2, calls: 1, decisions: 40, match: 30, defend: 2 }) };`
  );
  for (let i = 0; i < 202; i++) run(`recordGame(${(i % 4) + 1}, 25000)`);
  const h = run('loadHistory()');
  assert.strictEqual(h.length, 200);
  const x = run('historySummary(loadHistory())');
  assert.strictEqual(x.games, 200);
  assert.strictEqual(x.hands, 1000);
  assert.strictEqual(x.win, 0.2);
  assert.strictEqual(x.dealIn, 0.2);
  assert.strictEqual(x.match, 0.8);
  assert.strictEqual(x.avgRank, 2.5);
  assert.strictEqual(x.first, 0.25);
  assert.deepStrictEqual(plain(x.trend), new Array(20).fill(80));
  assert.strictEqual(run('historySummary([])').avgRank, null);
});

test('规则：一张牌多家荣和按设定处理', () => {
  const list = n => [1, 2, 3].slice(0, n).map(q => ({ q, res: {} }));
  const withRules = (r, n) => {
    table(player([]));
    ctx.getG().rules = { ...run('RULE_PRESETS.standard'), ...r };
    return plain(run(`ronsFrom(${JSON.stringify(list(n))})`));
  };
  assert.deepStrictEqual(
    withRules({ ron: 'head' }, 2).rons.map(x => x.q),
    [1]
  );
  assert.deepStrictEqual(
    withRules({ ron: 'double' }, 2).rons.map(x => x.q),
    [1, 2]
  );
  assert.deepStrictEqual(withRules({ ron: 'double' }, 3), { abort: 'sancha' });
  assert.deepStrictEqual(
    withRules({ ron: 'double', abort: false }, 3).rons.map(x => x.q),
    [1]
  );
  assert.deepStrictEqual(
    withRules({ ron: 'triple' }, 3).rons.map(x => x.q),
    [1, 2, 3]
  );
  assert.strictEqual(withRules({}, 0), null);
});

test('规则：途中流局（四风连打、四家立直、四杠散了、九种九牌）', () => {
  const east = parse('1111z');
  table(player([]));
  const G = ctx.getG();
  G.rules = run('({ ...RULE_PRESETS.standard })');
  G.players.forEach((p, i) => {
    p.river = [{ id: east[i] }];
  });
  assert.strictEqual(run('abortAfterDiscard()'), 'winds');
  G.rules.abort = false;
  assert.strictEqual(run('abortAfterDiscard()'), null);
  G.rules.abort = true;
  G.players[3].river = [{ id: parse('2z')[0] }];
  assert.strictEqual(run('abortAfterDiscard()'), null);
  G.players.forEach(p => {
    p.riichi = true;
  });
  assert.strictEqual(run('abortAfterDiscard()'), 'riichi4');
  G.players.forEach(p => {
    p.riichi = false;
  });
  G.kanCount = 4;
  G.kanBy = [1, 1, 1, 1];
  assert.strictEqual(run('abortAfterDiscard()'), null); // one player's four kans: play on (suukantsu chance)
  G.kanBy = [1, 2, 1, 1];
  assert.strictEqual(run('abortAfterDiscard()'), 'kan4');
  // Nine terminals: first draw, no calls, nine kinds
  table(player(parse('19m19p19s1234z5m5p5s')));
  ctx.getG().rules = run('({ ...RULE_PRESETS.standard })');
  assert.strictEqual(run('kyuushuKinds(G.players[0].hand)'), 10);
  assert.strictEqual(run('canKyuushu(0)'), true);
  ctx.getG().players[0].river = [{ id: 0 }];
  assert.strictEqual(run('canKyuushu(0)'), false);
});

test('规则：流局满贯只看全幺九且没被鸣走的牌河', () => {
  table(player([]));
  const G = ctx.getG();
  G.rules = run('({ ...RULE_PRESETS.standard })');
  G.players[1].river = parse('19m1z7z').map(id => ({ id }));
  G.players[2].river = parse('19m5z').map(id => ({ id }));
  G.players[2].river[1].called = true;
  G.players[3].river = parse('19m5p').map(id => ({ id }));
  assert.deepStrictEqual(plain(run('nagashiPlayers()')), [1]);
  G.rules.nagashi = false;
  assert.deepStrictEqual(plain(run('nagashiPlayers()')), []);
});

test('规则：包牌的支付', () => {
  const ym = { tsumoAll: 16000, tsumoD: 16000, tsumoN: 8000, ron: 32000 };
  const d = (w, l, o) => plain(run(`winDeltas(${w}, ${l}, ${JSON.stringify(ym)}, ${JSON.stringify(o)})`));
  // Non-dealer tsumo, player 3 liable: pays the whole 32000 (and the honba)
  assert.deepStrictEqual(d(1, null, { dealer: 0, pao: 3, honba: 1 }), [0, 32300, 0, -32300]);
  // Ron off player 2, player 3 liable: they split the 32000
  assert.deepStrictEqual(d(1, 2, { dealer: 0, pao: 3 }), [0, 32000, -16000, -16000]);
  // Ron off the liable player: they pay it all
  assert.deepStrictEqual(d(1, 3, { dealer: 0, pao: 3 }), [0, 32000, 0, -32000]);
  // Without pao: an ordinary tsumo
  assert.deepStrictEqual(d(1, null, { dealer: 0, pao: null }), [-16000, 32000, -8000, -8000]);
  // Pao for one of two yakuman: the liable player pays half the tsumo, the rest is paid as usual at half
  const two = { tsumoAll: 32000, tsumoD: 32000, tsumoN: 16000 };
  assert.deepStrictEqual(
    plain(run(`winDeltas(1, null, ${JSON.stringify(two)}, { dealer: 0, pao: 3, share: 0.5 })`)),
    [-16000, 64000, -8000, -40000]
  );
  // checkPao: the call that completes the third dragon set
  table(player([]));
  const G = ctx.getG();
  G.rules = run('({ ...RULE_PRESETS.standard })');
  const q = G.players[1];
  q.melds = [
    { type: 'pon', ids: parse('555z') },
    { type: 'pon', ids: parse('666z') },
    { type: 'pon', ids: parse('777z') }
  ];
  run('checkPao(1, 2)');
  assert.strictEqual(q.pao, 2);
  assert.strictEqual(q.paoYaku, '大三元');
});

test('规则：挑战链接里的规则编码可以还原', () => {
  for (const k of ['standard', 'basic', 'noaka']) {
    const r = run(`RULE_PRESETS.${k}`);
    assert.deepStrictEqual(plain(run(`decodeRules(encodeRules(RULE_PRESETS.${k}))`)), plain(r));
  }
  assert.strictEqual(run(`decodeRules('11d')`), null);
  assert.strictEqual(run(`decodeRules('1111x11111')`), null);
});
