// Run with: npm test   (or: node --test)
const test = require('node:test');
const assert = require('node:assert');
const { tt, counts, shanten, evaluate } = require('../js/engine.js');

// Parse a hand like "234m456p678s34s88p". z: 1-7 = 东 南 西 北 白 发 中.
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
      ids.push(t * 4 + 3 - used[t]); // copies 3,2,1 first so the red five (copy 0) is only used on purpose
      used[t]++;
    }
    buf = [];
  }
  return ids;
}

// Score a 13-tile hand winning on `win`. Seat wind 南, round wind 东, non-dealer by default.
function score(hand, win, opt = {}) {
  const h = parse(hand);
  const t = tt(parse(win)[0]);
  const winId = opt.red ? t * 4 : [3, 2, 1, 0].map(k => t * 4 + k).find(id => !h.includes(id));
  const isTsumo = !!opt.tsumo;
  return evaluate({
    hand: isTsumo ? h.concat([winId]) : h,
    melds: opt.melds || [],
    winId,
    isTsumo,
    seat: opt.seat ?? 28,
    round: 27,
    isDealer: !!opt.dealer,
    sit: opt.sit || {},
    doraInd: [],
    uraInd: null
  });
}
const names = r => r.yaku.map(y => y[0]);

test('shanten', () => {
  assert.strictEqual(shanten(counts(parse('123m456p789s1122z')), 0), 0);
  assert.strictEqual(shanten(counts(parse('19m19p19s1234567z')), 0), 0);
  assert.strictEqual(shanten(counts(parse('1357m2468p159s13z')), 0), 4);
});

test('平和 断幺九 荣和 30符2番 2000', () => {
  const r = score('234m456p678s34s88p', '2s');
  assert.deepStrictEqual(names(r), ['平和', '断幺九']);
  assert.strictEqual(r.fu, 30);
  assert.strictEqual(r.ron, 2000);
});

test('平和自摸 20符', () => {
  const r = score('234m456p678s34s88p', '2s', { tsumo: true });
  assert.strictEqual(r.fu, 20);
  assert.strictEqual(r.han, 3);
});

test('七对子 25符', () => {
  const r = score('1199m1188p55s226z', '6z');
  assert.strictEqual(r.fu, 25);
  assert.strictEqual(r.ron, 1600);
});

test('没有役不能和', () => {
  assert.strictEqual(score('123m456p789s1133z', '3z'), null);
});

test('副露役牌 30符1番 1000', () => {
  const pon = parse('777z');
  const r = score('23m456p789s11p', '1m', { melds: [{ type: 'pon', ids: pon, called: pon[0], from: 3 }] });
  assert.deepStrictEqual(names(r), ['役牌 中']);
  assert.strictEqual(r.ron, 1000);
});

test('小三元 满贯', () => {
  const r = score('555z666z7z123m456p', '7z');
  assert.strictEqual(r.label, '满贯');
});

test('二杯口 单骑 40符3番 5200', () => {
  const r = score('112233m445566p7s', '7s');
  assert.strictEqual(r.fu, 40);
  assert.strictEqual(r.ron, 5200);
});

test('役满', () => {
  assert.ok(score('19m19p19s1234567z', '1m').yakuman); // 国士无双
  assert.ok(score('555z666z777z23m99p', '1m').yakuman); // 大三元
  assert.ok(score('111m222p333s444m5z', '5z', { tsumo: true }).yakuman); // 四暗刻
  assert.strictEqual(score('1112345678999m', '5m', { dealer: true }).ron, 48000); // 九莲宝灯（庄）
});

test('四暗刻形但双碰荣和：只算三暗刻', () => {
  const r = score('111m222p333s44m55z', '5z');
  assert.ok(!r.yakuman);
  assert.deepStrictEqual(names(r), ['役牌 白', '对对和', '三暗刻']);
});

test('七对子 + 混老头 25符4番', () => {
  const r = score('1199m1199p11s155z', '1z');
  assert.deepStrictEqual(names(r), ['七对子', '混老头']);
  assert.strictEqual(r.ron, 6400);
});

test('暗杠幺九 32符 + 单骑：70符', () => {
  const kan = parse('1111z');
  const r = score('234m456p678s8p', '8p', { seat: 27, melds: [{ type: 'ankan', ids: kan, called: null, from: 0 }] });
  assert.strictEqual(r.fu, 70);
  assert.strictEqual(r.ron, 4500);
});

test('连风雀头 +4符', () => {
  const r = score('234m456p678s23s11z', '1s', { seat: 27, dealer: true, sit: { riichi: true } });
  assert.strictEqual(r.fu, 40);
  assert.strictEqual(r.ron, 2000);
});

test('规则选项：无赤宝牌、无食断、抢杠', () => {
  const E = require('../js/engine.js');
  // 234m 5(赤)55p 678s 22m + 34m 中的 5p 是红五（id 52）
  const hand = [4, 8, 12, 52, 53, 54, 76, 80, 84, 5, 6, 13, 17];
  const base = {
    hand,
    melds: [],
    winId: 21,
    isTsumo: false,
    seat: 28,
    round: 27,
    isDealer: false,
    sit: { riichi: true },
    doraInd: [33],
    uraInd: null
  };
  const withAka = E.evaluate(base),
    noAka = E.evaluate({ ...base, aka: false });
  assert.strictEqual(withAka.aka, 1);
  assert.strictEqual(noAka.aka, 0);
  assert.strictEqual(withAka.han - noAka.han, 1);
  // 抢杠: +1 番, only on ron
  const robbed = E.evaluate({ ...base, sit: { riichi: true, chankan: true } });
  assert.ok(robbed.yaku.some(([n]) => n === '抢杠'));
  assert.strictEqual(robbed.han, withAka.han + 1);
  // 食断 off: an open all-simples hand has no yaku
  const open = {
    hand: [4, 8, 12, 5, 6, 13, 17, 76, 80, 84],
    melds: [{ type: 'pon', ids: [56, 57, 58], called: 58, from: 3 }],
    winId: 21,
    isTsumo: false,
    seat: 28,
    round: 27,
    isDealer: false,
    sit: {},
    doraInd: [33],
    uraInd: null
  };
  assert.ok(E.evaluate(open).yaku.some(([n]) => n === '断幺九'));
  assert.strictEqual(E.evaluate({ ...open, kuitan: false }), null);
});
