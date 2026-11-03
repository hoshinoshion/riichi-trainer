// ===================== Tiles =====================
const RED_IDS = new Set([16, 52, 88]);
const tt = id => id >> 2;
const isTerm = t => t < 27 && (t % 9 === 0 || t % 9 === 8);
const isYao = t => t >= 27 || t % 9 === 0 || t % 9 === 8;
const isDragon = t => t >= 31;
const GREEN = new Set([19, 20, 21, 23, 25, 32]);
const WIND_CH = '東南西北';
const NUMK = '一二三四五六七八九';
function tName(t) {
  if (t < 27) return (t % 9) + 1 + ['万', '筒', '索'][Math.floor(t / 9)];
  return ['东', '南', '西', '北', '白', '发', '中'][t - 27];
}
function doraOf(i) {
  if (i < 27) return i % 9 === 8 ? i - 8 : i + 1;
  if (i < 31) return i === 30 ? 27 : i + 1;
  return i === 33 ? 31 : i + 1;
}
function counts(ids) {
  const c = new Array(34).fill(0);
  for (const id of ids) c[tt(id)]++;
  return c;
}

// ===================== Shanten =====================
const partCache = new Map();
function pareto(list) {
  return list.filter(([m, t]) => !list.some(([m2, t2]) => m2 >= m && m2 + t2 >= m + t && (m2 > m || m2 + t2 > m + t)));
}
function partOpts(arr, seq) {
  const key = (seq ? 's' : 'h') + arr.join('');
  let r = partCache.get(key);
  if (r) return r;
  const n = arr.length,
    b = arr.slice(),
    found = [new Map(), new Map()];
  const dfs = (i, m, t, p) => {
    while (i < n && b[i] === 0) i++;
    if (i >= n) {
      found[p].set(m * 10 + t, [m, t]);
      return;
    }
    if (b[i] >= 3) {
      b[i] -= 3;
      dfs(i, m + 1, t, p);
      b[i] += 3;
    }
    if (seq && i + 2 < n && b[i + 1] && b[i + 2]) {
      b[i]--;
      b[i + 1]--;
      b[i + 2]--;
      dfs(i, m + 1, t, p);
      b[i]++;
      b[i + 1]++;
      b[i + 2]++;
    }
    if (b[i] >= 2) {
      b[i] -= 2;
      if (!p) dfs(i, m, t, 1);
      if (m + t < 4) dfs(i, m, t + 1, p);
      b[i] += 2;
    }
    if (m + t < 4) {
      if (seq && i + 1 < n && b[i + 1]) {
        b[i]--;
        b[i + 1]--;
        dfs(i, m, t + 1, p);
        b[i]++;
        b[i + 1]++;
      }
      if (seq && i + 2 < n && b[i + 2]) {
        b[i]--;
        b[i + 2]--;
        dfs(i, m, t + 1, p);
        b[i]++;
        b[i + 2]++;
      }
    }
    b[i]--;
    dfs(i, m, t, p);
    b[i]++;
  };
  dfs(0, 0, 0, 0);
  r = found.map(mp => pareto([...mp.values()]));
  partCache.set(key, r);
  return r;
}
function shantenReg(c, mc) {
  const parts = [
    partOpts(c.slice(0, 9), 1),
    partOpts(c.slice(9, 18), 1),
    partOpts(c.slice(18, 27), 1),
    partOpts(c.slice(27, 34), 0)
  ];
  let best = 8;
  for (let pp = -1; pp < 4; pp++) {
    const L = parts.map((o, i) => o[i === pp ? 1 : 0]);
    if (L.some(l => !l.length)) continue;
    for (const a of L[0])
      for (const b of L[1])
        for (const d of L[2])
          for (const e of L[3]) {
            const M = mc + a[0] + b[0] + d[0] + e[0];
            if (M > 4) continue;
            const T = Math.min(a[1] + b[1] + d[1] + e[1], 4 - M);
            const s = 8 - 2 * M - T - (pp >= 0 ? 1 : 0);
            if (s < best) best = s;
          }
  }
  return best;
}
function chiitoiSh(c) {
  let p = 0,
    k = 0;
  for (const x of c) {
    if (x >= 2) p++;
    if (x >= 1) k++;
  }
  return 6 - p + Math.max(0, 7 - k);
}
function kokushiSh(c) {
  let k = 0,
    pair = 0;
  for (let t = 0; t < 34; t++)
    if (isYao(t) && c[t]) {
      k++;
      if (c[t] >= 2) pair = 1;
    }
  return 13 - k - pair;
}
function shanten(c, mc) {
  let s = shantenReg(c, mc);
  if (mc === 0) {
    s = Math.min(s, chiitoiSh(c), kokushiSh(c));
  }
  return s;
}

// ===================== Agari decomposition =====================
function decompositions(c) {
  const res = [],
    groups = [];
  const dfs = i => {
    while (i < 34 && c[i] === 0) i++;
    if (i >= 34) {
      res.push(groups.slice());
      return;
    }
    if (c[i] >= 3) {
      c[i] -= 3;
      groups.push({ k: 't', t: i });
      dfs(i);
      groups.pop();
      c[i] += 3;
    }
    if (i < 27 && i % 9 <= 6 && c[i + 1] && c[i + 2]) {
      c[i]--;
      c[i + 1]--;
      c[i + 2]--;
      groups.push({ k: 's', t: i });
      dfs(i);
      groups.pop();
      c[i]++;
      c[i + 1]++;
      c[i + 2]++;
    }
  };
  const out = [];
  for (let p = 0; p < 34; p++)
    if (c[p] >= 2) {
      c[p] -= 2;
      res.length = 0;
      dfs(0);
      for (const g of res) out.push({ pair: p, groups: g });
      c[p] += 2;
    }
  return out;
}

// ===================== Points =====================
const up100 = x => Math.ceil(x / 100) * 100;
function basePoints(han, fu, ym) {
  if (ym) return { base: 8000 * ym, label: ym > 1 ? ym + '倍役满' : '役满' };
  if (han >= 13) return { base: 8000, label: '累计役满' };
  if (han >= 11) return { base: 6000, label: '三倍满' };
  if (han >= 8) return { base: 4000, label: '倍满' };
  if (han >= 6) return { base: 3000, label: '跳满' };
  if (han >= 5) return { base: 2000, label: '满贯' };
  const b = fu * Math.pow(2, han + 2);
  return b >= 2000 ? { base: 2000, label: '满贯' } : { base: b, label: '' };
}

// ===================== Yaku evaluation =====================
// ctx: {hand, melds, winId, isTsumo, seat, round, isDealer, sit:{riichi,double,ippatsu,haitei,houtei,rinshan,chankan,tenhou,chiihou},
//       doraInd:[], uraInd:[]|null, aka (default true: red fives count as dora), kuitan (default true: open tanyao)}
/**
 * @typedef {Object} WinResult
 * @property {boolean} yakuman
 * @property {Array<[string, number|string]>} yaku  [name, han] (han is '役满' for yakuman)
 * @property {number} han
 * @property {number} fu
 * @property {number} base
 * @property {string} label  limit name (满贯 …) or ''
 * @property {number} dora
 * @property {number} aka
 * @property {number} ura
 * @property {number} [yakuHan]
 * @property {string} [wait]
 * @property {any[][]} [fuParts]
 * @property {boolean} [isDealer]
 * @property {number} [ron]
 * @property {number} [tsumoAll]
 * @property {number} [tsumoD]
 * @property {number} [tsumoN]
 */
/** @returns {WinResult|null} */
function evaluate(ctx) {
  const { melds, winId, isTsumo, seat, round, isDealer } = ctx,
    sit = ctx.sit || {};
  const conc = isTsumo ? ctx.hand.slice() : ctx.hand.concat([winId]);
  const c = counts(conc),
    winT = tt(winId),
    mc = melds.length;
  if (shanten(c, mc) !== -1) return null;
  const menzen = melds.every(m => m.type === 'ankan');
  const allIds = conc.concat(...melds.map(m => m.ids));
  const allC = counts(allIds);
  const sitY = [],
    sitYM = [];
  if (sit.double) sitY.push(['两立直', 2]);
  else if (sit.riichi) sitY.push(['立直', 1]);
  if (sit.ippatsu) sitY.push(['一发', 1]);
  if (menzen && isTsumo) sitY.push(['门前清自摸和', 1]);
  if (sit.rinshan) sitY.push(['岭上开花', 1]);
  else if (sit.haitei && isTsumo) sitY.push(['海底摸月', 1]);
  if (sit.houtei && !isTsumo) sitY.push(['河底捞鱼', 1]);
  if (sit.chankan && !isTsumo) sitY.push(['抢杠', 1]);
  if (sit.tenhou) sitYM.push('天和');
  if (sit.chiihou) sitYM.push('地和');
  const types = [];
  for (let t = 0; t < 34; t++) if (allC[t]) types.push(t);
  const suits = new Set(types.filter(t => t < 27).map(t => Math.floor(t / 9)));
  const hasHon = types.some(t => t >= 27);
  const colorY = [],
    colorYM = [];
  if (types.every(t => !isYao(t)) && (menzen || ctx.kuitan !== false)) colorY.push(['断幺九', 1]);
  if (suits.size === 1) {
    if (hasHon) colorY.push(['混一色', menzen ? 3 : 2]);
    else colorY.push(['清一色', menzen ? 6 : 5]);
  }
  if (suits.size === 0) colorYM.push('字一色');
  if (types.every(t => GREEN.has(t))) colorYM.push('绿一色');
  if (!hasHon && types.every(isTerm)) colorYM.push('清老头');
  if (types.every(isYao) && hasHon && suits.size > 0) colorY.push(['混老头', 2]);
  const yh = t => isDragon(t) || t === seat || t === round;

  /** @type {any[]} */
  const forms = [];
  if (mc === 0 && kokushiSh(c) === -1) forms.push({ ym: ['国士无双'], fu: 0 });
  if (mc === 0 && c.filter(x => x === 2).length === 7)
    forms.push({ y: [['七对子', 2]], fu: 25, fuParts: [['chiitoi', 25]] });
  const mg = melds.map(m => ({
    k: m.type === 'chi' ? 's' : 't',
    t: Math.min(...m.ids.map(tt)),
    open: m.type !== 'ankan',
    kan: /kan/.test(m.type)
  }));
  for (const d of decompositions(c)) {
    const base = d.groups.map(g => ({ k: g.k, t: g.t, open: false, kan: false }));
    const places = [];
    base.forEach((g, i) => {
      if (g.k === 's' && winT >= g.t && winT <= g.t + 2) places.push(i);
      if (g.k === 't' && g.t === winT) places.push(i);
    });
    if (d.pair === winT) places.push(-1);
    for (const pi of places) {
      const gs = base.map(g => ({ ...g }));
      let wait;
      if (pi === -1) wait = 'tanki';
      else {
        const g = gs[pi];
        if (g.k === 't') {
          wait = 'shanpon';
          if (!isTsumo) g.open = true;
        } else {
          const n = g.t % 9,
            off = winT - g.t;
          wait = off === 1 ? 'kanchan' : (off === 0 && n === 6) || (off === 2 && n === 0) ? 'penchan' : 'ryanmen';
        }
      }
      forms.push(regularForm(gs.concat(mg), d.pair, wait));
    }
  }
  function regularForm(groups, pair, wait) {
    const y = [],
      ym = [];
    const seqs = groups.filter(g => g.k === 's'),
      trips = groups.filter(g => g.k === 't');
    const pinfu = menzen && seqs.length === 4 && !yh(pair) && wait === 'ryanmen';
    if (pinfu) y.push(['平和', 1]);
    if (menzen) {
      const cnt = {};
      seqs.forEach(g => (cnt[g.t] = (cnt[g.t] || 0) + 1));
      let pk = 0;
      for (const k in cnt) pk += Math.floor(cnt[k] / 2);
      if (pk === 2) y.push(['二杯口', 3]);
      else if (pk === 1) y.push(['一杯口', 1]);
    }
    for (const g of trips) {
      if (isDragon(g.t)) y.push(['役牌 ' + '白发中'[g.t - 31], 1]);
      if (g.t === seat) y.push(['役牌 自风', 1]);
      if (g.t === round) y.push(['役牌 场风', 1]);
    }
    const hasSeq = t => seqs.some(g => g.t === t),
      hasTrip = t => trips.some(g => g.t === t);
    for (let n = 0; n < 7; n++)
      if (hasSeq(n) && hasSeq(n + 9) && hasSeq(n + 18)) {
        y.push(['三色同顺', menzen ? 2 : 1]);
        break;
      }
    for (let s = 0; s < 3; s++)
      if (hasSeq(s * 9) && hasSeq(s * 9 + 3) && hasSeq(s * 9 + 6)) {
        y.push(['一气通贯', menzen ? 2 : 1]);
        break;
      }
    const gYao = g => (g.k === 's' ? g.t % 9 === 0 || g.t % 9 === 6 : isYao(g.t));
    if (seqs.length && groups.every(gYao) && isYao(pair)) {
      if (groups.some(g => g.t >= 27) || pair >= 27) y.push(['混全带幺九', menzen ? 2 : 1]);
      else y.push(['纯全带幺九', menzen ? 3 : 2]);
    }
    if (trips.length === 4) y.push(['对对和', 2]);
    const ankou = trips.filter(g => !g.open).length;
    if (ankou === 4) ym.push('四暗刻');
    else if (ankou === 3) y.push(['三暗刻', 2]);
    for (let n = 0; n < 9; n++)
      if (hasTrip(n) && hasTrip(n + 9) && hasTrip(n + 18)) {
        y.push(['三色同刻', 2]);
        break;
      }
    const kans = groups.filter(g => g.kan).length;
    if (kans === 4) ym.push('四杠子');
    else if (kans === 3) y.push(['三杠子', 2]);
    const dT = trips.filter(g => isDragon(g.t)).length;
    if (dT === 3) ym.push('大三元');
    else if (dT === 2 && isDragon(pair)) y.push(['小三元', 2]);
    const wT = trips.filter(g => g.t >= 27 && g.t <= 30).length;
    if (wT === 4) ym.push('大四喜');
    else if (wT === 3 && pair >= 27 && pair <= 30) ym.push('小四喜');
    if (mc === 0 && suits.size === 1 && !hasHon) {
      const s = [...suits][0],
        a = c.slice(s * 9, s * 9 + 9),
        need = [3, 1, 1, 1, 1, 1, 1, 1, 3];
      if (need.every((v, i) => a[i] >= v)) ym.push('九莲宝灯');
    }
    // fuParts explains the fu: [kind, fu] pairs (sets as ['set', fu, tile, open, kan]), before rounding up.
    let fu;
    /** @type {any[][]} */
    const fuParts = [];
    if (pinfu) {
      fu = isTsumo ? 20 : 30;
      fuParts.push([isTsumo ? 'pinfuTsumo' : 'pinfuRon', fu]);
    } else {
      fu = 20;
      fuParts.push(['base', 20]);
      if (menzen && !isTsumo) fuParts.push(['menzenRon', 10]);
      if (isTsumo) fuParts.push(['tsumo', 2]);
      for (const g of trips) {
        let f = isYao(g.t) ? 4 : 2;
        if (!g.open) f *= 2;
        if (g.kan) f *= 4;
        fuParts.push(['set', f, g.t, !!g.open, !!g.kan]);
      }
      if (isDragon(pair) || pair === seat || pair === round)
        fuParts.push(['pair', (isDragon(pair) ? 2 : 0) + (pair === seat ? 2 : 0) + (pair === round ? 2 : 0), pair]);
      if (wait === 'kanchan' || wait === 'penchan' || wait === 'tanki') fuParts.push(['wait', 2, wait]);
      fu = fuParts.reduce((a, p) => a + p[1], 0);
      if (fu === 20) {
        fu = 30;
        fuParts.push(['openMin', 10]);
      }
      fu = Math.ceil(fu / 10) * 10;
    }
    return { y, ym, fu, wait, fuParts };
  }
  let dora = 0;
  for (const i of ctx.doraInd) dora += allC[doraOf(i)];
  const aka = ctx.aka === false ? 0 : allIds.filter(id => RED_IDS.has(id)).length;
  let ura = 0;
  if (ctx.uraInd && (sit.riichi || sit.double)) for (const i of ctx.uraInd) ura += allC[doraOf(i)];
  /** @type {WinResult|null} */
  let best = null;
  for (const f of forms) {
    const ym = [...sitYM, ...(f.ym || []), ...colorYM];
    /** @type {WinResult} */
    let r;
    if (ym.length) {
      const bp = basePoints(0, 0, ym.length);
      r = {
        yakuman: true,
        yaku: ym.map(n => [n, '役满']),
        han: 0,
        fu: 0,
        base: bp.base,
        label: bp.label,
        dora: 0,
        aka: 0,
        ura: 0
      };
    } else {
      const y = [...sitY, ...(f.y || []), ...colorY];
      if (!y.length) continue;
      const yakuHan = y.reduce((a, b) => a + b[1], 0),
        han = yakuHan + dora + aka + ura,
        bp = basePoints(han, f.fu, 0);
      r = {
        yakuman: false,
        yaku: y,
        yakuHan,
        han,
        fu: f.fu,
        base: bp.base,
        label: bp.label,
        dora,
        aka,
        ura,
        wait: f.wait,
        fuParts: f.fuParts || []
      };
    }
    if (!best || r.base > best.base || (r.base === best.base && r.han > best.han)) best = r;
  }
  if (best) {
    best.isDealer = isDealer;
    best.ron = up100(best.base * (isDealer ? 6 : 4));
    if (isDealer) best.tsumoAll = up100(best.base * 2);
    else {
      best.tsumoD = up100(best.base * 2);
      best.tsumoN = up100(best.base);
    }
  }
  return best;
}

// Allow the engine to be loaded by Node for tests.
// Node (tests, tools) loads this file as a module. The alias keeps type checkers treating it as a plain script.
const engineModule = typeof module !== 'undefined' ? module : null;
if (engineModule && engineModule.exports)
  engineModule.exports = { tt, isTerm, isYao, doraOf, counts, shanten, decompositions, basePoints, evaluate, tName };
