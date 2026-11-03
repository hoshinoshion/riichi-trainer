// Computer opponents: discard choice, calls, riichi and kan decisions per difficulty level. No DOM.
// ===================== AI =====================
// Difficulty levels. 入门: noisy efficiency with slips, calls without a yaku plan, folds only when hopeless.
// 普通: pure tile efficiency, folds against riichi when far from tenpai.
// 困难: like normal, plus: picks the tenpai wait with the best expected score, damaten on big hands, reads
// dangerous open hands as threats, uses suji / kabe / no-chance when folding, avoids kan into a riichi, tries kokushi.
// The decision functions take an optional level, so the review can ask what the hard AI would do in your seat.
const MIXED = [null, 'easy', 'normal', 'hard'];
const LEVELS = ['easy', 'normal', 'hard'];
function lvl(p) {
  return S.ai === 'mixed' ? MIXED[p] : LEVELS.includes(S.ai) ? S.ai : 'normal';
}
const hardish = L => L === 'hard';
// Seat characters (setting S.styles, on unless turned off), layered on any level: 下家 (1) calls a lot,
// 对家 (2) folds early, 上家 (3) chases one-suit hands. Seat 0 (you, or the stand-in in the simulator) has none.
const STYLES = [null, 'caller', 'guard', 'flush'];
const style = p => (S.styles === false ? null : STYLES[p]);
// The suit a flush-chasing player is building: 10+ of their tiles in one suit plus honours.
function flushSuit(p) {
  if (style(p) !== 'flush') return -1;
  const pl = G.players[p],
    ids = [...pl.hand, ...pl.melds.flatMap(m => m.ids)],
    hon = ids.filter(id => tt(id) >= 27).length;
  for (let s = 0; s < 3; s++)
    if (ids.filter(id => Math.floor(tt(id) / 9) === s && tt(id) < 27).length + hon >= 10) return s;
  return -1;
}
const rnd = rand;
function keepValue(t, p) {
  const pl = G.players[p],
    c = counts(pl.hand);
  let v;
  const seat = 27 + seatOf(p),
    round = 27 + G.bakaze;
  if (t >= 27) {
    v = isDragon(t) || t === seat || t === round ? (c[t] >= 2 ? 9 : 2) : 0;
  } else {
    const n = t % 9;
    v = n === 0 || n === 8 ? 1 : n === 1 || n === 7 ? 2 : 3;
  }
  for (const i of doraInds()) if (doraOf(i) === t) v += 5;
  const fs = flushSuit(p);
  if (fs >= 0) v += t >= 27 ? 2 : Math.floor(t / 9) === fs ? 2 : -4;
  return v;
}
// Danger of tile type t against one riichi player, from what is on the table: riv = types in their river,
// safe = types discarded by others after their riichi, vis = copies of t visible (called tiles counted once).
// why: genbutsu, honor (with vis), suji (both sides, or the one side an edge tile needs), half (one side of a
// middle tile), or none. Shared by the AI, the coach panel and the defence practice puzzles.
function tileRisk(t, riv, safe, vis) {
  if (riv.has(t) || safe.has(t)) return { d: 0, why: 'genbutsu' };
  if (t >= 27) return { d: vis >= 3 ? 1 : vis === 2 ? 3 : 5, why: 'honor', vis };
  const n = t % 9,
    b = t - n,
    inR = k => riv.has(b + k);
  if (n <= 2 ? inR(n + 3) : n >= 6 ? inR(n - 3) : inR(n - 3) && inR(n + 3))
    return { d: isTerm(t) ? 2 : 3, why: 'suji' };
  if (n >= 3 && n <= 5 && (inR(n - 3) || inR(n + 3))) return { d: 6, why: 'half' };
  return { d: isTerm(t) ? 6 : n === 1 || n === 7 ? 7 : 9, why: 'none' };
}
function danger(t, r) {
  const rp = G.players[r];
  // Called river tiles are counted once, in the caller's meld.
  let vis = 0;
  for (const q of G.players) {
    for (const x of q.river) if (!x.called && tt(x.id) === t) vis++;
    for (const m of q.melds) for (const id of m.ids) if (tt(id) === t) vis++;
  }
  return tileRisk(t, new Set(rp.river.map(x => tt(x.id))), rp.safe, vis).d;
}
// Hard-level danger: adds kabe / no-chance (a ryanmen shape that needs a tile whose 4 copies are all visible to us
// cannot exist) and a tanki-only reading for honours and terminals with three copies out.
function dangerHard(t, r, vis) {
  let d = danger(t, r);
  if (d === 0) return 0;
  if (vis[t] >= 3) return Math.min(d, 1);
  if (t < 27) {
    const n = t % 9,
      gone = k => vis[k] >= 4;
    const lowOK = n < 2 || gone(t - 1) || gone(t - 2),
      highOK = n > 6 || gone(t + 1) || gone(t + 2);
    if (lowOK && highOK) d = Math.min(d, isTerm(t) ? 2 : 3);
    else if (n >= 3 && n <= 5 && (lowOK || highOK)) d = Math.min(d, 5);
  }
  const rp = G.players[r];
  if (rp.melds.length && !rp.riichi) d = Math.max(0, d - 1);
  return d;
}
function chooseId(pl, t) {
  const ids = pl.hand.filter(x => tt(x) === t);
  if (pl.drawn != null && tt(pl.drawn) === t) return pl.drawn;
  return ids.find(x => !RED_IDS.has(x)) ?? ids[0];
}
// Who p should be afraid of. Easy/normal only see riichi; hard also sees dangerous open hands.
function threatsFor(p, L = lvl(p)) {
  return [0, 1, 2, 3].filter(i => {
    if (i === p) return false;
    const q = G.players[i];
    if (q.riichi) return true;
    if (!hardish(L)) return false;
    // Hard also respects open hands: three melds, or two melds showing a yakuhai pon or dora.
    const di = doraInds().map(doraOf),
      yh = t => isDragon(t) || t === 27 + seatOf(i) || t === 27 + G.bakaze;
    return (
      q.melds.length >= 3 ||
      (q.melds.length >= 2 &&
        q.melds.some(m => (m.type !== 'chi' && yh(tt(m.ids[0]))) || m.ids.some(id => isAka(id) || di.includes(tt(id)))))
    );
  });
}
// Expected ron value of being tenpai after discarding type d: sum over waits of (copies left × points).
function tenpaiEV(p, d, vis, asRiichi) {
  const pl = G.players[p],
    idx = pl.hand.findIndex(x => tt(x) === d),
    hand = pl.hand.filter((_, i) => i !== idx);
  const c = counts(hand),
    mc = pl.melds.length;
  let ev = 0,
    left = 0,
    minRon = Infinity,
    allYaku = true;
  const riv = new Set([...pl.river.map(r => tt(r.id)), d]);
  const waits = [];
  for (let t = 0; t < 34; t++) {
    if (c[t] >= 4) continue;
    c[t]++;
    if (shanten(c, mc) === -1) waits.push(t);
    c[t]--;
  }
  const furiten = waits.some(t => riv.has(t));
  for (const t of waits) {
    const rem = Math.max(0, 4 - vis[t]);
    left += rem;
    // Use a copy not in hand, and not the red five unless it is the only one left, so aka is not overcounted.
    const wid = [3, 2, 1, 0]
      .map(k => t * 4 + k)
      .filter(id => !hand.includes(id))
      .sort((a, b) => RED_IDS.has(a) - RED_IDS.has(b))[0];
    const sit = {
      riichi: asRiichi,
      double: false,
      ippatsu: false,
      rinshan: false,
      haitei: false,
      houtei: false,
      tenhou: false,
      chiihou: false
    };
    const res = evaluate({
      hand,
      melds: pl.melds,
      winId: wid,
      isTsumo: false,
      seat: 27 + seatOf(p),
      round: 27 + G.bakaze,
      isDealer: p === G.dealer,
      sit,
      doraInd: doraInds(),
      uraInd: null,
      aka: rule('aka'),
      kuitan: rule('kuitan')
    });
    if (!res) {
      allYaku = false;
      if (!asRiichi && isMenzen(pl)) ev += rem * 1000 * 0.35;
      continue;
    }
    minRon = Math.min(minRon, res.ron);
    ev += rem * res.ron * (furiten ? 0.3 : 1);
  }
  return { ev, left, waits, furiten, minRon: waits.length ? minRon : 0, allYaku: allYaku && waits.length > 0 };
}
function aiChooseDiscard(p, forbid = [], L = lvl(p)) {
  const pl = G.players[p];
  let rows = ukeireTable(p).filter(r => !forbid.includes(r.d));
  if (!rows.length) rows = ukeireTable(p);
  const bestS = Math.min(...rows.map(r => r.s));
  const atk = r => r.s * 1000 - r.n * 10 + keepValue(r.d, p);
  let pick;
  const guard = style(p) === 'guard';
  let why = 'eff';
  if (L === 'easy') {
    // Beginner: folds only when hopeless, otherwise plays roughly by efficiency with plenty of noise,
    // and about one discard in ten is a slip that may even step backwards.
    const threats = threatsFor(p, L);
    if (threats.length && bestS >= (guard ? 2 : 3) && rnd() < (guard ? 0.7 : 0.5)) {
      const dg = r => Math.max(...threats.map(q => danger(r.d, q)));
      pick = rows.slice().sort((a, b) => dg(a) - dg(b))[0];
      why = 'fold';
    } else {
      const pool = rnd() < 0.1 ? rows.filter(r => r.s <= bestS + 1) : rows.filter(r => r.s === bestS);
      pick = pool.map(r => ({ r, k: atk(r) + rnd() * 60 })).sort((a, b) => a.k - b.k)[0].r;
    }
  } else if (hardish(L)) {
    const vis = visibleTo(p),
      threats = threatsFor(p, L),
      riichis = threats.filter(q => G.players[q].riichi);
    const dg = r =>
      threats.length
        ? Math.max(
            ...threats.map(q => dangerHard(r.d, q, vis) * (G.players[q].riichi ? 1 : 0.6) * (q === G.dealer ? 1.3 : 1))
          )
        : 0;
    // Against riichi: fold from two away, or from one away once the wall is short (a guard folds from one away).
    // Open threats: fold from two away in the second half. Simulations showed that pushing harder than normal
    // here, and the two-step shape look-ahead below, cost the hard level more than they won.
    let fold = false;
    if (riichis.length) fold = bestS >= 2 || (bestS === 1 && (guard || G.wall.length < 40));
    else if (threats.length) fold = bestS >= (guard ? 1 : 2) && G.wall.length < 45;
    if (fold) {
      pick = rows.slice().sort((a, b) => dg(a) - dg(b) || atk(a) - atk(b))[0];
      why = 'fold';
    } else if (bestS === 0) {
      const cand = rows.filter(r => r.s === 0).map(r => ({ r, e: tenpaiEV(p, r.d, vis, isMenzen(pl)) }));
      cand.sort((a, b) => (b.e.furiten ? 0 : 1) - (a.e.furiten ? 0 : 1) || b.e.ev - a.e.ev || dg(a.r) - dg(b.r));
      pick = cand[0].r;
      why = 'wait';
    } else pick = rows.filter(r => r.s === bestS).sort((a, b) => atk(a) - atk(b) || dg(a) - dg(b))[0];
  } else {
    const threats = threatsFor(p, L);
    if (threats.length && (bestS >= 2 || (bestS === 1 && (guard || G.wall.length < 40)))) {
      const dg = r => Math.max(...threats.map(q => danger(r.d, q)));
      pick = rows.slice().sort((a, b) => dg(a) - dg(b) || atk(a) - atk(b))[0];
      why = 'fold';
    } else pick = rows.slice().sort((a, b) => atk(a) - atk(b))[0];
  }
  return { id: chooseId(pl, pick.d), s: pick.s, d: pick.d, why };
}
function yakuPathOpen(q, newT) {
  const pl = G.players[q],
    seat = 27 + seatOf(q),
    round = 27 + G.bakaze,
    yh = t => isDragon(t) || t === seat || t === round;
  if (pl.melds.some(m => m.type !== 'chi' && yh(tt(m.ids[0])))) return true;
  if (newT.every(x => x === newT[0]) && yh(newT[0])) return true;
  const c = counts(pl.hand);
  if ([31, 32, 33, seat, round].some(t => c[t] >= 3)) return true;
  const simple = pl.melds.every(m => m.ids.every(id => !isYao(tt(id)))) && newT.every(t => !isYao(t));
  if (rule('kuitan') && simple && pl.hand.filter(id => isYao(tt(id))).length <= 1) return true;
  // A flush-chaser counts an open half flush as a yaku plan when the call stays in its suit or honours.
  const fs = flushSuit(q),
    inSuit = t => t >= 27 || Math.floor(t / 9) === fs;
  return fs >= 0 && newT.every(inSuit) && pl.melds.every(m => inSuit(tt(m.ids[0])));
}
function aiPon(q, id, L = lvl(q)) {
  const pl = G.players[q];
  if (pl.riichi || G.wall.length === 0) return null;
  const t = tt(id),
    c = counts(pl.hand),
    mc = pl.melds.length;
  if (c[t] < 2) return null;
  const s0 = shanten(c, mc);
  c[t] -= 2;
  const s1 = shanten(c, mc + 1);
  c[t] += 2;
  const yh = isDragon(t) || t === 27 + seatOf(q) || t === 27 + G.bakaze;
  if (L === 'easy') {
    // Beginners love calling: any yakuhai, and now and then a pon that does not hurt, yaku or not.
    if (yh || (s1 < s0 && rnd() < (style(q) === 'caller' ? 0.5 : 0.3)) || (s1 < s0 && yakuPathOpen(q, [t, t, t])))
      return { q, type: 'pon', useT: [t, t] };
    return null;
  }
  const threat = G.players.some((x, i) => i !== q && x.riichi);
  if (threat && s0 >= 2) return null;
  if ((yh && s1 <= s0) || (s1 < s0 && s0 <= (style(q) === 'caller' ? 4 : 3) && yakuPathOpen(q, [t, t, t])))
    return { q, type: 'pon', useT: [t, t] };
  return null;
}
function aiChi(q, id, L = lvl(q)) {
  const pl = G.players[q];
  if (pl.riichi || G.wall.length === 0) return null;
  const t = tt(id),
    c = counts(pl.hand),
    mc = pl.melds.length,
    s0 = shanten(c, mc);
  if (L === 'easy') {
    if (rnd() >= 0.5) return null;
    for (const [a, b] of chiPatterns(t, c)) {
      c[a]--;
      c[b]--;
      const s1 = shanten(c, mc + 1);
      c[a]++;
      c[b]++;
      if (s1 < s0 && (rnd() < 0.3 || yakuPathOpen(q, [a, b, t]))) return { q, type: 'chi', useT: [a, b] };
    }
    return null;
  }
  const caller = style(q) === 'caller';
  if (s0 > (caller ? 4 : 3) || G.players.some((x, i) => i !== q && x.riichi)) return null;
  for (const [a, b] of chiPatterns(t, c)) {
    c[a]--;
    c[b]--;
    const s1 = shanten(c, mc + 1);
    c[a]++;
    c[b]++;
    if (s1 < s0 && yakuPathOpen(q, [a, b, t])) return { q, type: 'chi', useT: [a, b] };
  }
  return null;
}
// Should the AI declare riichi with this tenpai discard? Easy and normal always do.
// Hard stays damaten when the hand already has a yaku and is worth a mangan, or when every wait is dead.
function aiWantsRiichi(p, d, L = lvl(p)) {
  if (!hardish(L)) return true;
  const e = tenpaiEV(p, d, visibleTo(p), false);
  if (e.left === 0) return false;
  if (e.allYaku && !e.furiten && e.minRon >= 7700) return false;
  return true;
}
async function aiTurn(p, info) {
  await pause(delay());
  const pl = G.players[p],
    L = lvl(p);
  if (!info.afterCall) {
    const res = evaluate(ctxFor(p, pl.drawn, true, sitFor(p, true, info.rinshan), true));
    if (res) return { type: 'tsumo', res };
  }
  // Nine terminals: easy and normal take the abortive draw; hard keeps a hand with 11+ kinds for kokushi.
  if (!info.afterCall && canKyuushu(p) && !(hardish(L) && kyuushuKinds(pl.hand) >= 11)) return { type: 'kyuushu' };
  if (pl.riichi) {
    const k = kanOptions(p);
    if (k.length) return { type: 'kan', opt: k[0] };
    return { type: 'discard', id: pl.drawn };
  }
  if (!info.afterCall) {
    const c = counts(pl.hand),
      mc = pl.melds.length,
      s0 = shanten(c, mc);
    const riichiNear = G.players.some((x, i) => i !== p && x.riichi);
    for (const o of kanOptions(p)) {
      if (hardish(L) && riichiNear && s0 >= 1) break;
      if (o.kind === 'ankan') {
        c[o.t] -= 4;
        const s = shanten(c, mc + 1);
        c[o.t] += 4;
        if (s <= s0) return { type: 'kan', opt: o };
      } else {
        c[o.t]--;
        const s = shanten(c, mc);
        c[o.t]++;
        if (s <= s0) return { type: 'kan', opt: o };
      }
    }
  }
  const ch = aiChooseDiscard(p, info.forbid);
  const canRiichi = !info.afterCall && ch.s === 0 && riichiTypes(p).has(ch.d),
    riichi = canRiichi && aiWantsRiichi(p, ch.d);
  return { type: 'discard', id: ch.id, riichi };
}
