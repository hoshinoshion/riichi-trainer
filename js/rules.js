// Table rules on the shared state G: waits, furiten, ukeire, legal riichi / kan / chi, and the actions
// that change the table (draw, discard, kan, calls). No DOM.
function ctxFor(p, winId, isTsumo, sit, withUra) {
  const pl = G.players[p];
  return {
    hand: pl.hand,
    melds: pl.melds,
    winId,
    isTsumo,
    seat: 27 + seatOf(p),
    round: 27 + G.bakaze,
    isDealer: p === G.dealer,
    sit,
    doraInd: doraInds(),
    uraInd: withUra ? uraInds() : null,
    aka: rule('aka'),
    kuitan: rule('kuitan')
  };
}
function sitFor(p, isTsumo, rinshan) {
  const pl = G.players[p],
    first = pl.river.length === 0 && G.noCalls && !rinshan;
  return {
    riichi: pl.riichi,
    double: pl.doubleRiichi,
    ippatsu: pl.ippatsu && rule('ippatsu'),
    rinshan,
    haitei: isTsumo && !rinshan && G.wall.length === 0,
    houtei: !isTsumo && G.wall.length === 0,
    tenhou: isTsumo && first && p === G.dealer,
    chiihou: isTsumo && first && p !== G.dealer
  };
}
function waitsFor(hand, mc) {
  const c = counts(hand),
    w = [];
  if (hand.length % 3 !== 1) return w;
  for (let t = 0; t < 34; t++) {
    if (c[t] >= 4) continue;
    c[t]++;
    if (shanten(c, mc) === -1) w.push(t);
    c[t]--;
  }
  return w;
}
function waitsOf(p) {
  const pl = G.players[p];
  return waitsFor(pl.hand, pl.melds.length);
}
function isFuriten(p, w) {
  const pl = G.players[p];
  w = w || waitsOf(p);
  return pl.tempFuriten || pl.riichiFuriten || pl.river.some(r => w.includes(tt(r.id)));
}
function markMissed(p) {
  const pl = G.players[p];
  pl.tempFuriten = true;
  if (pl.riichi) pl.riichiFuriten = true;
}
// rob: the tile is being added to a pon (chankan), not discarded.
function ronCheck(q, id, rob) {
  const w = waitsOf(q);
  if (!w.includes(tt(id))) return { inWait: false, res: null };
  if (isFuriten(q, w)) return { inWait: true, res: null, furiten: true };
  const sit = sitFor(q, false, false);
  if (rob) Object.assign(sit, { chankan: true, houtei: false });
  return { inWait: true, res: evaluate(ctxFor(q, id, false, sit, true)) };
}
// Players who declared ron on one tile, closest to the discarder first, filtered by the multiple-ron rule.
// Returns {rons:[{q,res}]}, {abort:'sancha'} (three rons when only two may win), or null.
function ronsFrom(list) {
  if (!list.length) return null;
  const mode = rule('ron');
  if (mode === 'head') return { rons: list.slice(0, 1) };
  if (mode === 'double' && list.length === 3) return rule('abort') ? { abort: 'sancha' } : { rons: list.slice(0, 1) };
  return { rons: list };
}
// Abortive draws (rule abort). Nine terminals: the player's first draw, no calls yet, nine or more different
// terminal and honour types in hand.
const kyuushuKinds = hand => new Set(hand.map(tt).filter(isYao)).size;
const canKyuushu = p =>
  rule('abort') && G.noCalls && G.players[p].river.length === 0 && kyuushuKinds(G.players[p].hand) >= 9;
// After a discard has gone round without a ron: four winds, four riichi, or four kans by more than one player.
function abortAfterDiscard() {
  if (!rule('abort')) return null;
  const P4 = G.players;
  if (G.noCalls && P4.every(x => x.river.length === 1)) {
    const t0 = tt(P4[0].river[0].id);
    if (t0 >= 27 && t0 <= 30 && P4.every(x => tt(x.river[0].id) === t0)) return 'winds';
  }
  if (P4.every(x => x.riichi)) return 'riichi4';
  if (G.kanCount >= 4 && new Set(G.kanBy || []).size > 1) return 'kan4';
  return null;
}
// Nagashi mangan at an exhaustive draw: every discard a terminal or honour, and none of them called.
const nagashiPlayers = () =>
  rule('nagashi')
    ? [0, 1, 2, 3].filter(p => G.players[p].river.length && G.players[p].river.every(r => isYao(tt(r.id)) && !r.called))
    : [];
// Pao: calling the tile that completes your third dragon set or fourth wind set makes its discarder liable.
function checkPao(q, d) {
  if (!rule('pao')) return;
  const pl = G.players[q],
    sets = pl.melds.filter(m => m.type !== 'chi').map(m => tt(m.ids[0]));
  if (sets.filter(t => t >= 31).length === 3) Object.assign(pl, { pao: d, paoYaku: '大三元' });
  else if (sets.filter(t => t >= 27 && t <= 30).length === 4) Object.assign(pl, { pao: d, paoYaku: '大四喜' });
}
function visibleTo(p) {
  const v = new Array(34).fill(0);
  for (const id of G.players[p].hand) v[tt(id)]++;
  for (const q of G.players) {
    for (const r of q.river) if (!r.called) v[tt(r.id)]++;
    for (const m of q.melds) for (const id of m.ids) v[tt(id)]++;
  }
  for (const i of doraInds()) v[i]++;
  return v;
}
// Memoised per seat: render() and the AI ask for the same table several times per turn.
// The key covers everything visibleTo() reads. Callers must not mutate the returned rows.
const ukCache = new Map();
function ukeireTable(p) {
  const pl = G.players[p];
  const key =
    pl.hand.join() +
    '|' +
    G.players.map(q => q.river.length + '.' + q.melds.map(m => m.ids.length).join('')).join() +
    '|' +
    G.doraCount;
  const hit = ukCache.get(p);
  if (hit && hit.g === G && hit.key === key) return hit.rows;
  const rows = ukeireCompute(p);
  ukCache.set(p, { g: G, key, rows });
  return rows;
}
function ukeireCompute(p) {
  const pl = G.players[p],
    c = counts(pl.hand),
    mc = pl.melds.length,
    vis = visibleTo(p),
    rows = [];
  for (let d = 0; d < 34; d++) {
    if (!c[d]) continue;
    c[d]--;
    const s = shanten(c, mc);
    let n = 0;
    const tiles = [];
    for (let t = 0; t < 34; t++) {
      const rem = 4 - vis[t];
      if (rem <= 0) continue;
      c[t]++;
      if (shanten(c, mc) < s) {
        tiles.push([t, rem]);
        n += rem;
      }
      c[t]--;
    }
    c[d]++;
    rows.push({ d, s, n, tiles });
  }
  rows.sort((a, b) => a.s - b.s || b.n - a.n);
  return rows;
}
function riichiTypes(p) {
  const pl = G.players[p],
    set = new Set();
  if (!isMenzen(pl) || pl.riichi || pl.score < 1000 || G.wall.length < 4) return set;
  const c = counts(pl.hand),
    mc = pl.melds.length;
  for (let d = 0; d < 34; d++) {
    if (!c[d]) continue;
    c[d]--;
    if (shanten(c, mc) === 0) set.add(d);
    c[d]++;
  }
  return set;
}
function kanOptions(p) {
  const pl = G.players[p];
  if (G.wall.length === 0 || G.kanCount >= 4) return [];
  const c = counts(pl.hand),
    o = [];
  if (pl.riichi) {
    // After riichi: only a closed kan of the tile just drawn, and only if it leaves the waits unchanged.
    if (pl.drawn == null) return o;
    const t = tt(pl.drawn);
    if (c[t] !== 4) return o;
    const before = waitsFor(
      pl.hand.filter(id => id !== pl.drawn),
      pl.melds.length
    );
    const after = waitsFor(
      pl.hand.filter(id => tt(id) !== t),
      pl.melds.length + 1
    );
    if (before.length && before.join() === after.join()) o.push({ kind: 'ankan', t });
    return o;
  }
  for (let t = 0; t < 34; t++) if (c[t] === 4) o.push({ kind: 'ankan', t });
  pl.melds.forEach((m, i) => {
    if (m.type === 'pon' && c[tt(m.ids[0])]) o.push({ kind: 'kakan', t: tt(m.ids[0]), i });
  });
  return o;
}
// Kuikae: after a call the called tile type may not be discarded, nor, after a chi on the end of a
// ryanmen (e.g. 34 + 2), the tile at the other end (5).
function kuikaeOf(t, useT) {
  const f = [t];
  if (!useT || useT[0] === useT[1]) return f;
  const lo = Math.min(...useT),
    hi = Math.max(...useT);
  if (lo === t + 1 && t % 9 <= 5) f.push(t + 3);
  if (hi === t - 1 && t % 9 >= 3) f.push(t - 3);
  return f;
}
// A call is only allowed if the caller still has a legal discard afterwards.
function leavesDiscard(c, useT, t) {
  const r = c.slice();
  for (const u of useT) r[u]--;
  for (const f of kuikaeOf(t, useT)) r[f] = 0;
  return r.some(x => x > 0);
}
function chiPatterns(t, c) {
  if (t >= 27) return [];
  const n = t % 9,
    o = [];
  if (n >= 2 && c[t - 2] && c[t - 1]) o.push([t - 2, t - 1]);
  if (n >= 1 && n <= 7 && c[t - 1] && c[t + 1]) o.push([t - 1, t + 1]);
  if (n <= 6 && c[t + 1] && c[t + 2]) o.push([t + 1, t + 2]);
  return o.filter(u => leavesDiscard(c, u, t));
}

// ===================== Actions =====================
function drawTile(p, id) {
  const pl = G.players[p];
  pl.hand.push(id);
  pl.drawn = id;
}
function doDiscard(p, id, riichi) {
  flushDora();
  const pl = G.players[p];
  pl.hand.splice(pl.hand.indexOf(id), 1);
  const tsumogiri = id === pl.drawn;
  pl.drawn = null;
  pl.hand.sort((a, b) => a - b);
  if (riichi) {
    if (p === 0 && G.stats) G.stats.riichi++;
    pl.doubleRiichi = G.noCalls && pl.river.length === 0;
    pl.riichi = true;
    pl.ippatsu = true;
    pl.riichiPending = true;
    log('riichi', { p, dbl: pl.doubleRiichi, t: tt(id) });
  } else {
    pl.ippatsu = false;
    log('discard', { p, t: tt(id), tg: tsumogiri });
  }
  pl.river.push({ id, riichi, tsumogiri, fresh: true });
  pl.tempFuriten = false;
  G.players.forEach((q, i) => {
    if (i !== p && q.riichi) q.safe.add(tt(id));
  });
  G.last = { p, id };
}
function brokeFlow() {
  G.noCalls = false;
  G.players.forEach(x => (x.ippatsu = false));
}
// Closed kan: the new dora indicator is turned at once. Open or added kan: it is turned when the next
// tile is discarded (or at the next kan), so a rinshan win on an open kan does not see it.
function flushDora() {
  G.doraCount += G.pendingDora;
  G.pendingDora = 0;
}
function revealKan(open) {
  G.kanCount++;
  G.wall.shift();
  flushDora();
  if (open) G.pendingDora++;
  else G.doraCount++;
}
function doSelfKan(p, o) {
  const pl = G.players[p];
  if (o.kind === 'ankan') {
    const ids = pl.hand.filter(id => tt(id) === o.t);
    pl.hand = pl.hand.filter(id => tt(id) !== o.t);
    pl.melds.push({ type: 'ankan', ids, called: null, from: 0 });
    log('ankan', { p, t: o.t });
  } else {
    const id = pl.hand.find(x => tt(x) === o.t);
    pl.hand.splice(pl.hand.indexOf(id), 1);
    const m = pl.melds[o.i];
    m.type = 'kakan';
    m.ids.push(id);
    log('kakan', { p, t: o.t });
  }
  pl.drawn = null;
  pl.hand.sort((a, b) => a - b);
  brokeFlow();
  (G.kanBy || (G.kanBy = [])).push(p);
  revealKan(o.kind !== 'ankan');
}
function applyCall(call, d, id) {
  const pl = G.players[call.q],
    use = [];
  if (call.q === 0 && G.stats && !pl.melds.some(m => m.type !== 'ankan')) G.stats.calls++; // hands in which you called
  for (const t of call.useT) {
    const x = pl.hand.find(h => tt(h) === t && !use.includes(h));
    use.push(x);
  }
  pl.hand = pl.hand.filter(h => !use.includes(h));
  const dr = G.players[d].river;
  dr[dr.length - 1].called = true;
  pl.melds.push({
    type: call.type === 'kan' ? 'minkan' : call.type,
    ids: [...use, id],
    called: id,
    from: (d - call.q + 4) % 4
  });
  brokeFlow();
  if (call.type === 'kan') {
    (G.kanBy || (G.kanBy = [])).push(call.q);
    revealKan(true);
  }
  if (call.type !== 'chi') checkPao(call.q, d);
  log('call', { p: call.q, type: call.type, t: tt(id) });
}

// Score changes for one win. l: who dealt in (null for tsumo). pao: the liable player or null; share: the part of
// the hand's value that is the pao yakuman (1 when it is the only yakuman). On tsumo the liable player pays that
// part, and the honba; on ron by someone else the two split that part. Kyotaku are added by the caller.
function winDeltas(w, l, res, { honba = 0, dealer, pao = null, share = 1 }) {
  const d = [0, 0, 0, 0],
    pay = (q, n) => {
      d[q] -= n;
      d[w] += n;
    },
    r100 = x => Math.round(x / 100) * 100;
  if (l === null) {
    const normal = q => (w === dealer ? res.tsumoAll : q === dealer ? res.tsumoD : res.tsumoN),
      others = [0, 1, 2, 3].filter(q => q !== w);
    if (pao !== null && pao !== w) {
      pay(pao, r100(others.reduce((a, q) => a + normal(q), 0) * share) + 300 * honba);
      if (share < 1) others.forEach(q => pay(q, r100(normal(q) * (1 - share))));
    } else others.forEach(q => pay(q, normal(q) + 100 * honba));
  } else {
    const total = res.ron + 300 * honba;
    if (pao !== null && pao !== l && pao !== w) {
      const half = r100((res.ron * share) / 2);
      pay(pao, half);
      pay(l, total - half);
    } else pay(l, total);
  }
  return d;
}
