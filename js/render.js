// Rendering: tile faces, the table, your hand, action buttons, coach panel, log and result modals.
const ROT = [0, -90, 180, 90];

// ===================== Tile rendering =====================
const C = { B: '#22479a', G: '#16704a', R: '#c3302a', I: '#fcf8ee' };
const PIN_POS = {
  2: [
    [15, 10.5],
    [15, 29.5]
  ],
  3: [
    [7.5, 8],
    [15, 20],
    [22.5, 32]
  ],
  4: [
    [9, 11],
    [21, 11],
    [9, 29],
    [21, 29]
  ],
  5: [
    [8.5, 9],
    [21.5, 9],
    [15, 20],
    [8.5, 31],
    [21.5, 31]
  ],
  6: [
    [9, 8],
    [21, 8],
    [9, 22],
    [21, 22],
    [9, 33],
    [21, 33]
  ],
  7: [
    [7, 6],
    [15, 10],
    [23, 14],
    [9, 24],
    [21, 24],
    [9, 34],
    [21, 34]
  ],
  8: [
    [9, 5.5],
    [21, 5.5],
    [9, 15.2],
    [21, 15.2],
    [9, 24.8],
    [21, 24.8],
    [9, 34.5],
    [21, 34.5]
  ],
  9: [
    [7, 8],
    [15, 8],
    [23, 8],
    [7, 20],
    [15, 20],
    [23, 20],
    [7, 32],
    [15, 32],
    [23, 32]
  ]
};
const PIN_R = { 2: 7, 3: 5.6, 4: 5.4, 5: 5, 6: 4.7, 7: 4.2, 8: 4.2, 9: 4 };
const PIN_COL = { 2: 'GB', 3: 'BRG', 4: 'BGGB', 5: 'BGRGB', 6: 'GGRRRR', 7: 'GGGRRRR', 8: 'BBBBBBBB', 9: 'BBBRRRGGG' };
const SOU = {
  2: {
    p: [
      [15, 10.5],
      [15, 29.5]
    ],
    h: 15
  },
  3: {
    p: [
      [15, 10.5],
      [9, 29.5],
      [21, 29.5]
    ],
    h: 15
  },
  4: {
    p: [
      [9, 10.5],
      [21, 10.5],
      [9, 29.5],
      [21, 29.5]
    ],
    h: 15
  },
  5: {
    p: [
      [8, 10.5],
      [22, 10.5],
      [15, 20],
      [8, 29.5],
      [22, 29.5]
    ],
    h: 15,
    red: [2]
  },
  6: {
    p: [
      [7, 10.5],
      [15, 10.5],
      [23, 10.5],
      [7, 29.5],
      [15, 29.5],
      [23, 29.5]
    ],
    h: 15
  },
  7: {
    p: [
      [15, 7],
      [7, 20.5],
      [15, 20.5],
      [23, 20.5],
      [7, 33],
      [15, 33],
      [23, 33]
    ],
    h: 10.5,
    red: [0]
  },
  8: {
    p: [
      [6, 10.5],
      [12, 10.5],
      [18, 10.5],
      [24, 10.5],
      [6, 29.5],
      [12, 29.5],
      [18, 29.5],
      [24, 29.5]
    ],
    h: 15,
    w: 3.6
  },
  9: {
    p: [
      [7, 7],
      [15, 7],
      [23, 7],
      [7, 20],
      [15, 20],
      [23, 20],
      [7, 33],
      [15, 33],
      [23, 33]
    ],
    h: 11,
    red: [1, 4, 7]
  }
};
function stick(x, y, w, h, c) {
  return `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="${w / 2}" fill="${c}"/><rect x="${x - w / 2 - 0.4}" y="${y - 0.5}" width="${w + 0.8}" height="1" rx=".5" fill="${c}"/><line x1="${x}" y1="${y - h / 2 + 1.8}" x2="${x}" y2="${y + h / 2 - 1.8}" stroke="${C.I}" class="hs" stroke-width=".6" opacity=".6"/>`;
}
function pinSVG(n, red) {
  let s = '';
  if (n === 1)
    s = `<circle cx="15" cy="20" r="11.5" fill="${C.G}"/><circle cx="15" cy="20" r="9" fill="${C.I}" class="h"/><circle cx="15" cy="20" r="7" fill="${C.B}"/><circle cx="15" cy="20" r="3.8" fill="${C.I}" class="h"/><circle cx="15" cy="20" r="2.2" fill="${C.R}"/>`;
  else
    PIN_POS[n].forEach(([x, y], i) => {
      const c = C[red ? 'R' : PIN_COL[n][i]],
        r = PIN_R[n];
      s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/><circle cx="${x}" cy="${y}" r="${(r * 0.6).toFixed(2)}" fill="${C.I}" class="h"/><circle cx="${x}" cy="${y}" r="${(r * 0.3).toFixed(2)}" fill="${c}"/>`;
    });
  return `<svg viewBox="0 0 30 40" aria-hidden="true">${s}</svg>`;
}
function souSVG(n, red) {
  let s = '';
  if (n === 1)
    s =
      stick(15, 22, 7, 30, C.G) +
      `<circle cx="15" cy="8" r="4.2" fill="${C.R}"/><circle cx="15" cy="8" r="1.6" fill="${C.I}" class="h"/>`;
  else {
    const L = SOU[n];
    L.p.forEach(([x, y], i) => {
      s += stick(x, y, L.w || 4, L.h, red || (L.red && L.red.includes(i)) ? C.R : C.G);
    });
  }
  return `<svg viewBox="0 0 30 40" aria-hidden="true">${s}</svg>`;
}
// A character from GLYPHS (js/glyphs.js) drawn in a size × size box at (x, y) of the 30 × 40 face; cls picks its ink.
function glyph(ch, x, y, size, cls) {
  return `<path class="${cls}" transform="translate(${x} ${y}) scale(${size / GLYPH_EM})" d="${GLYPHS[ch]}"/>`;
}
// Every face is an SVG in the same 30 × 40 box, so tiles look the same on every device and need no web font.
const faceCache = {};
function face(t, red) {
  const k = t + (red ? 'r' : '');
  if (faceCache[k]) return faceCache[k];
  let h;
  if (t < 9)
    h = `<svg viewBox="0 0 30 40" aria-hidden="true">${glyph(NUMK[t], 6, 0.5, 18, red ? 'gr' : 'gi')}${glyph('萬', 4.5, 19, 21, 'gr')}</svg>`;
  else if (t < 18) h = pinSVG(t - 8, red);
  else if (t < 27) h = souSVG(t - 17, red);
  else if (t === 31)
    h = `<svg viewBox="0 0 30 40" aria-hidden="true"><rect class="gb" x="6.5" y="8" width="17" height="24" rx="2" fill="none" stroke-width="2"/></svg>`;
  else
    h = `<svg viewBox="0 0 30 40" aria-hidden="true">${glyph('東南西北白發中'[t - 27], 2, 7, 26, t === 32 ? 'gg' : t === 33 ? 'gr' : 'gi')}</svg>`;
  return (faceCache[k] = h);
}
function tileHTML(id, cls = '', attr = '') {
  const red = isAka(id); // with red fives off (rule aka) they are drawn as ordinary fives
  return `<div class="tile ${cls}" ${attr} title="${TN(tt(id))}${red ? t('red') : ''}"><div class="face">${face(tt(id), red)}</div></div>`;
}
function tileT(t, cls = '') {
  return tileHTML(t * 4 + 3, cls);
}
function backHTML(cls = '') {
  return `<div class="tile back ${cls}"></div>`;
}
function meldHTML(m, cls = '') {
  if (m.type === 'ankan')
    return `<div class="meld">${backHTML(cls)}${tileHTML(m.ids[1], cls)}${tileHTML(m.ids[2], cls)}${backHTML(cls)}</div>`;
  const others = m.ids
    .filter(id => id !== m.called)
    .sort((a, b) => a - b)
    .map(id => tileHTML(id, cls));
  const side = tileHTML(m.called, cls + ' yoko');
  const seq =
    m.from === 3 ? [side, ...others] : m.from === 2 ? [others[0], side, ...others.slice(1)] : [...others, side];
  return `<div class="meld">${seq.join('')}</div>`;
}

// ===================== Modals =====================
function showModal(html, btn) {
  const g = GEN;
  return new Promise((res, rej) => {
    const m = $('#modal');
    m.innerHTML = `<div class="mbox${S.fx ? ' fx' : ''}" role="dialog" aria-modal="true">${html}<div><button class="btn gold" id="mclose" type="button">${btn}</button></div></div>`;
    m.hidden = false;
    countUp(m);
    const b = $('#mclose');
    b.focus();
    b.onclick = () => {
      m.hidden = true;
      if (g !== GEN) rej(ABORT);
      else res();
    };
  });
}
function deltasHTML(deltas, before) {
  return `<div class="deltas">${[0, 1, 2, 3].map(i => `<div class="${deltas[i] > 0 ? 'gain' : deltas[i] < 0 ? 'loss' : ''}"><small>${charName(i)} · ${W4(seatOf(i))}</small><span data-count="${before[i] + deltas[i]}" data-from="${before[i]}">${before[i] + deltas[i]}</span><small class="${deltas[i] > 0 ? 'up' : deltas[i] < 0 ? 'dn' : ''}">${deltas[i] > 0 ? '+' : ''}${deltas[i] || '±0'}</small></div>`).join('')}</div>`;
}
function winModal(w, l, winId, res, deltas, before) {
  const pl = G.players[w];
  const hand = (l === null ? pl.hand.filter(x => x !== winId) : pl.hand.slice()).sort((a, b) => a - b);
  // With effects on, the tiles turn over one by one (--i), then the winning tile rises.
  let k = 0;
  const handH =
    hand.map(id => tileHTML(id, '', `style="--i:${k++}"`)).join('') +
    '<span class="gap"></span>' +
    tileHTML(winId, 'win', `style="--i:${k++}"`) +
    (pl.melds.length ? '<span class="gap"></span>' : '') +
    pl.melds.map(m => meldHTML(m)).join('');
  // With effects on, the rows come in one by one (--i), the ura dora turns over, and a limit hand gets a banner.
  let i = 0;
  let rows = res.yaku
    .map(
      ([n, h]) =>
        `<li style="--i:${i++}"><span>${YN(n)}</span><b>${typeof h === 'number' ? t('han', { n: h }) : t('yakuman')}</b></li>`
    )
    .join('');
  if (!res.yakuman)
    rows += [
      [t('dora'), res.dora],
      [t('aka'), res.aka],
      [t('ura'), res.ura]
    ]
      .filter(x => x[1])
      .map(([n, h]) => `<li style="--i:${i++}"><span>${n}</span><b>${t('han', { n: h })}</b></li>`)
      .join('');
  const total = res.yakuman ? LBL(res.label) : t('fuHan', { fu: res.fu, han: res.han, label: LBL(res.label) });
  const pay =
    l === null
      ? res.isDealer
        ? t('payAll', { n: res.tsumoAll })
        : t('payTsumo', { d: res.tsumoD, n: res.tsumoN })
      : t('payRon', { p: P(l), n: res.ron });
  const extra = G.honba
    ? l === null
      ? t('honbaTsumo', { n: G.honba * 100 })
      : t('honbaRon', { n: G.honba * 300 })
    : '';
  const ura = pl.riichi
    ? `<div class="ura">${t('uraInd')} ${uraInds()
        .map(x => tileT(x, 'xs'))
        .join('')}</div>`
    : '';
  // A banner (tsumo / ron seal, who won, the points they gain counting up), the hand, the yaku sheet, then the
  // total with its limit banner, and everyone's score change.
  return `<div class="mhero${w === 0 ? ' mine' : ''}"><span class="mkind seal">${l === null ? t('tsumo') : t('ron')}</span><div class="mwho">${charOn(w) ? `<span class="ava">${AVATARS[w]}</span>` : ''}<h2>${w === 0 ? t('youWon') : t('playerWon', { p: P(w) })}${l === 0 ? t('youDealt') : ''}</h2></div><b class="mgain" data-count="${deltas[w]}" data-from="0" data-prefix="+">+${deltas[w]}</b></div>
  <div class="mhand" style="--n:${k}">${handH}</div>
  <div class="mdora"><div>${t('doraInd')} ${doraInds()
    .map(x => tileT(x, 'xs'))
    .join('')}</div>${ura}</div>
  <div class="msheet" style="--n:${k}"><ul class="myaku">${rows}</ul>
  <div class="mfinal" style="--i:${i}">${limitLevel(res) ? `<div class="limit l${limitLevel(res)}">${LBL(res.label)}</div>` : ''}
  <div class="mtotal">${total}<small>${pay}${extra}</small></div></div></div>
  ${deltasHTML(deltas, before)}`;
}
// 1 mangan … 4 sanbaiman, 5 yakuman: the banner grows with the hand.
const limitLevel = res => (res.yakuman ? 5 : { 满贯: 1, 跳满: 2, 倍满: 3, 三倍满: 4, 累计役满: 5 }[res.label] || 0);
// Numbers marked data-count roll up from zero when the result screen opens (effects on, motion allowed).
function countUp(root) {
  if (
    !S.fx ||
    document.documentElement.classList.contains('reduce-motion') ||
    typeof requestAnimationFrame !== 'function'
  )
    return;
  root.querySelectorAll('[data-count]').forEach(el => {
    const to = +el.dataset.count,
      from = +el.dataset.from || 0,
      t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / 700);
      el.textContent = (el.dataset.prefix || '') + Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}
// A brush-style stamp over the table for big moments: riichi, calls, wins. p: who; key: stamp.* text.
function stamp(key, p) {
  if (!S.fx || typeof document.createElement !== 'function') return;
  const host = $('.table');
  if (!host) return;
  const el = document.createElement('div');
  el.className = 'stamp' + (p === 0 ? ' mine' : '');
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<span>${t('stamp.' + key)}</span><small>${charName(p)}</small>`;
  host.appendChild(el);
  setTimeout(() => el.remove(), 1300);
}
// Seat characters (S.styles): a name, an avatar and short lines in a speech bubble on their plate.
const charOn = p => p > 0 && S.styles !== false;
const charName = p => (charOn(p) ? L('chars')[p - 1] : P(p));
const AVATARS = [
  null,
  // 下家: a round panda who calls a lot
  `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="9" cy="9" r="6" fill="#1c1c20"/><circle cx="31" cy="9" r="6" fill="#1c1c20"/><circle cx="20" cy="22" r="15" fill="#fbfaf5" stroke="#1c1c20" stroke-width="1.2"/><ellipse cx="13.5" cy="21" rx="4" ry="5" fill="#1c1c20" transform="rotate(-20 13.5 21)"/><ellipse cx="26.5" cy="21" rx="4" ry="5" fill="#1c1c20" transform="rotate(20 26.5 21)"/><circle cx="14" cy="20.5" r="1.4" fill="#fff"/><circle cx="26" cy="20.5" r="1.4" fill="#fff"/><ellipse cx="20" cy="27" rx="2" ry="1.4" fill="#1c1c20"/><path d="M17.5 30q2.5 2 5 0" stroke="#1c1c20" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>`,
  // 对家: a careful orange cat
  `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M6 16 8 3l10 8zM34 16 32 3l-10 8z" fill="#f0a14a"/><circle cx="20" cy="23" r="15" fill="#f0a14a"/><path d="M14 10q6-3 12 0" stroke="#c97a26" stroke-width="2" fill="none"/><ellipse cx="20" cy="29" rx="7" ry="5" fill="#fff4e6"/><path d="M11 21q3-3 6 0M23 21q3-3 6 0" stroke="#1c1c20" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M18.5 27h3l-1.5 1.6z" fill="#e5636a"/></svg>`,
  // 上家: a fox who chases one-suit hands
  `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M5 18 7 2l11 10zM35 18 33 2 22 12z" fill="#e0622c"/><path d="M8 7l1 7 4-3zM32 7l-1 7-4-3z" fill="#3a2418"/><path d="M5 18q2-10 15-10t15 10q-2 14-15 19Q7 32 5 18z" fill="#e0622c"/><path d="M8 22q5 1 12 15 7-14 12-15-6 7-12 15Q14 29 8 22z" fill="#fff6ee"/><path d="M12 19l5 1.5M28 19l-5 1.5" stroke="#1c1c20" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="31" r="1.6" fill="#1c1c20"/></svg>`
];
// Speech bubbles never use rand(), so they cannot change a seeded game. Each player says each kind of line at
// most once per hand.
const BUBBLES = {};
function say(p, kind) {
  if (!charOn(p) || typeof document.createElement !== 'function' || !G) return;
  const said = G.said || (G.said = []);
  if (said.includes(p + kind)) return;
  said.push(p + kind);
  BUBBLES[p] = { text: L('lines.' + kind)[p - 1], until: Date.now() + 2400 };
  renderOpps();
  setTimeout(renderOpps, 2500);
}

// Post-round review (review.js): agreement with the coach, then the costliest discards with the hand as it was.
const DISCARD_KINDS = ['match', 'defend', 'slow', 'back'];
// One line explaining a recorded decision (review.js), for the review list and the replay.
function reviewText(r) {
  if (r.kind === 'slow' || r.kind === 'back')
    return t(r.kind === 'back' ? 'rv.back' : 'rv.slow', {
      t: tt(r.id),
      s: r.mine.s,
      n: r.mine.n,
      b: r.best.d,
      bs: r.best.s,
      bn: r.best.n
    });
  if (r.kind === 'match' || r.kind === 'defend') return t('rv.' + r.kind, { t: tt(r.id) });
  if (r.kind.startsWith('riichi')) return t('rv.' + r.kind, { t: tt(r.id), why: r.why });
  return t('rv.' + r.kind, { t: tt(r.id), p: r.from, chose: r.chose, coach: r.coach });
}
// Your hand at a decision: the tile you discarded framed, the coach's picks dotted.
function reviewHand(r) {
  return r.hand
    .map(id =>
      tileHTML(id, [id === r.id ? 'mine' : '', (r.recs || []).includes(tt(id)) && id !== r.id ? 'recd' : ''].join(' '))
    )
    .join('');
}
function reviewHTML() {
  const R = G.review || [];
  if (!R.length) return '';
  const disc = R.filter(r => DISCARD_KINDS.includes(r.kind)),
    a = disc.filter(r => r.kind === 'match').length,
    d = disc.filter(r => r.kind === 'defend').length,
    list = reviewMistakes(),
    choices = reviewChoices(),
    notes = G.notes || [];
  const item = r =>
    `<div class="rv"><div class="rvh"><b>${t('rv.turn', { n: r.turn })}</b> ${reviewText(r)}</div><div class="rvhand">${reviewHand(r)}${
      r.kind.startsWith('call') ? `<span class="gap"></span>${tileHTML(r.id, 'agari')}` : ''
    }</div><button class="linkbtn" type="button" data-replay="${R.indexOf(r)}">${t('rp.here')}</button></div>`;
  let body = list.length
    ? `<p class="note">${t('rv.legend')}</p>${list.map(item).join('')}`
    : `<p class="note">${t('rv.none')}</p>`;
  if (choices.length) body += `<h4 class="rvsub">${t('rv.choicesTitle')}</h4>${choices.map(item).join('')}`;
  if (notes.length)
    body += `<h4 class="rvsub">${t('rv.notesTitle')}</h4><ul class="rvnotes">${notes
      .map(n => `<li>${t('ai.' + n.why, { p: n.p, n: n.turn, t: n.t })}</li>`)
      .join('')}</ul>`;
  body += `<div class="rpbar"><button class="btn" type="button" data-replay="0">${t('rp.open')}</button></div><div class="replay" id="replayBox"></div>`;
  return `<details class="review"${list.length || choices.length ? ' open' : ''}><summary>${t('rv.title')} · ${t('rv.agree', { a, n: disc.length, d })}</summary>${gloss(body)}</details>`;
}
// Replay: the table at your i-th recorded decision, from its snapshot, with buttons to step through them.
function replayHTML(i) {
  const R = G.review || [],
    r = R[i];
  if (!r || !r.snap) return '';
  const s = r.snap;
  const rows = [3, 2, 1, 0]
    .map(
      p =>
        `<div class="rprow${p === 0 ? ' me' : ''}"><span class="rpname">${P(p)}${s.ri[p] ? ` <span class="rtag">${t('riichiTag')}</span>` : ''}</span><div class="rpriver">${s.r[
          p
        ]
          .map(([id, ri, c]) => tileHTML(id, [ri ? 'yoko' : '', c ? 'gone' : ''].join(' ')))
          .join(
            ''
          )}${s.m[p].length ? '<span class="gap"></span>' + s.m[p].map(m => meldHTML(m)).join('') : ''}</div></div>`
    )
    .join('');
  const offered = r.kind.startsWith('call') ? `<span class="gap"></span>${tileHTML(r.id, 'agari')}` : '';
  return `<div class="rphead"><b>${t('rv.turn', { n: r.turn })}</b><span>${t('rp.count', { i: i + 1, n: R.length })} · ${t('wallLeft', { n: s.w })}</span></div>
  <div class="mdora"><div>${t('doraInd')} ${s.d.map(x => tileT(x, 'xs')).join('')}</div></div>
  <div class="rptable">${rows}</div><div class="rvhand">${reviewHand(r)}${offered}</div><p class="note">${reviewText(r)}</p>
  <div class="rpnav"><button class="btn" type="button" data-replay="${i - 1}"${i ? '' : ' disabled'}>${t('rp.prev')}</button><button class="btn" type="button" data-replay="${i + 1}"${i < R.length - 1 ? '' : ' disabled'}>${t('rp.next')}</button></div>`;
}
// Deal-in analysis from dealInInfo(): what you could have known when the tile went out.
function dealInHTML(x) {
  let h;
  if (x.locked) h = `<p>${t('di.locked')}</p>`;
  else if (!x.riichi || x.dg == null) h = `<p>${t('di.dama', { p: x.w, m: x.melds })}</p>`;
  else {
    h = `<p>${t(x.dg <= 3 ? 'di.semi' : 'di.danger', { t: x.t, p: x.w })}</p>`;
    h += x.safe.length
      ? `<div class="dirow">${t('di.hadSafe')}<span class="chips">${x.safe.map(k => tileT(k, 'xs')).join('')}</span></div>`
      : `<p>${t('di.noSafe')}</p>`;
    if (x.safe.length) h += `<p>${t(x.s >= 1 ? 'di.fold' : 'di.push', { s: x.s })}</p>`;
  }
  return gloss(`<div class="dealin"><h3>${t('di.title')}</h3>${h}</div>`);
}
// Challenge link: a friend opening it plays the same deals.
function challengeHTML() {
  return `<div class="share"><button class="btn" type="button" data-share="challenge">${t('shareChallenge')}</button><small>${t('shareNote', { seed: G.seed })}</small></div>`;
}
// Stats card: totals over finished games (review.js history) and a sparkline of the coach match rate.
function renderStats() {
  const h = loadHistory(),
    x = historySummary(h);
  $('#btnClearStats').hidden = !h.length;
  if (!h.length) {
    $('#statsBody').innerHTML = `<p class="note">${t('stats.empty')}</p>`;
    return;
  }
  const pct = v => (v == null ? '–' : Math.round(100 * v) + '%');
  const cells = [
    [t('stats.games'), x.games],
    [t('stats.avgRank'), x.avgRank.toFixed(2)],
    [t('stats.first'), pct(x.first)],
    [t('stats.win'), pct(x.win)],
    [t('stats.dealIn'), pct(x.dealIn)],
    [t('stats.riichi'), pct(x.riichi)],
    [t('stats.calls'), pct(x.calls)],
    [t('stats.match'), pct(x.match)]
  ];
  let spark = '';
  if (x.trend.length) {
    const n = x.trend.length,
      X = i => (n === 1 ? 100 : 4 + (i * 192) / (n - 1)),
      Y = v => 36 - v * 0.32,
      pts = x.trend.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`);
    const last = x.trend[n - 1];
    spark = `<figure class="spark"><svg viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true">
      <line x1="0" y1="${Y(50)}" x2="200" y2="${Y(50)}" class="grid"/><polygon points="${X(0)},36 ${pts.join(' ')} ${X(n - 1)},36" class="area"/>
      <polyline points="${pts.join(' ')}" class="line"/><circle cx="${X(n - 1)}" cy="${Y(last)}" r="2.6" class="dot"/></svg>
      <figcaption>${t('stats.trend', { n, last })}</figcaption></figure>`;
  }
  $('#statsBody').innerHTML =
    `<dl class="sgrid">${cells.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>${spark}`;
}
// End-of-game summary from G.stats.
function summaryHTML() {
  const st = G.stats;
  if (!st || !st.decisions) return '';
  const ok = st.match + st.defend,
    pct = Math.round((100 * ok) / st.decisions);
  const li = [t('sum.agree', { pct, a: ok, n: st.decisions })];
  if (st.defend) li.push(t('sum.defend', { n: st.defend }));
  li.push(t('sum.back', { n: st.back }), t('sum.lost', { n: st.lost }), t('sum.dealIn', { n: st.dealIn }));
  return `<div class="summary"><h3>${t('sum.title')}</h3><ul>${li.map(x => `<li>${x}</li>`).join('')}</ul></div>`;
}

// ===================== Rendering =====================
function render() {
  if (!G) return;
  updateTools();
  renderOpps();
  renderSquare();
  renderMe();
  renderActions();
  renderCoach();
  renderTip();
  renderLog();
}
// Opponents sit around the discard area: 下家 (1) right, 对家 (2) top, 上家 (3) left.
function renderOpps() {
  if (!G) return;
  for (const p of [1, 2, 3]) {
    const pl = G.players[p],
      sw = seatOf(p),
      ch = charOn(p),
      bub = BUBBLES[p] && BUBBLES[p].until > Date.now() ? BUBBLES[p].text : '';
    $('#opp' + p).innerHTML = `<div class="plate${G.turn === p ? ' on' : ''}${pl.riichi ? ' riichi' : ''}">
    ${bub ? `<div class="bubble" role="status">${bub}</div>` : ''}
    <div class="ph">${ch ? `<span class="ava">${AVATARS[p]}</span>` : ''}<span class="wb${sw === 0 ? ' dealer' : ''}">${WIND_CH[sw]}</span><span class="nm">${ch ? `${charName(p)} <small>${P(p)}</small>` : P(p)}</span><span class="lv lv-${lvl(p)}" title="${t('lvTitle')}">${L('lv')[lvl(p)]}</span><b class="sc">${pl.score}</b>${pl.riichi ? `<span class="rtag">${t('riichiTag')}</span>` : ''}</div>
    <div class="pb"><div class="backs">${'<i></i>'.repeat(pl.hand.length)}</div><div class="pm">${meldsHTML(p, 'mini')}</div></div></div>`;
  }
}
// ===================== Motion =====================
// Cosmetic motion (setting fx): a discard flies from the hand or seat that played it into its pond, a riichi stick
// drops onto the table, a new meld slides in. The table is re-rendered often, so each movement is keyed and
// remembered with its start time: a re-render picks the movement up where it was instead of restarting or cutting it.
const MOTION = new Map(); // key → { t0, x, y, s } (x, y, s: a discard's starting offset and scale)
const DISCARD_MS = 340,
  DROP_MS = 520;
const motionOn = () =>
  !!S.fx &&
  typeof document.createElement === 'function' &&
  !document.documentElement.classList.contains('reduce-motion') &&
  typeof Element === 'function' &&
  'animate' in Element.prototype;
const motionKey = k => `${G.seed}:${G.dealt}:${k}`;
// Milliseconds since the movement for key started (starting it now if new), or -1 once it is over.
function motionAge(key, ms) {
  if (MOTION.size > 64) MOTION.clear();
  const m = MOTION.get(key);
  if (!m) {
    MOTION.set(key, { t0: performance.now(), x: 0, y: 0, s: 1 });
    return 0;
  }
  const age = performance.now() - m.t0;
  return age < ms ? age : -1;
}
// CSS-animated pieces (riichi stick, new meld): a class, with a negative delay when resumed after a re-render.
function motionAttr(cls, k, ms) {
  if (!motionOn()) return '';
  const age = motionAge(motionKey(k), ms);
  return age < 0 ? '' : ` ${cls}" style="animation-delay:-${Math.round(age)}ms`;
}
// Before the table is redrawn: where each new discard comes from (your tile still in the hand, or the seat).
function discardSources() {
  const out = [];
  if (!motionOn()) return out;
  for (let p = 0; p < 4; p++) {
    const rv = G.players[p].river,
      r = rv[rv.length - 1];
    if (!r || !r.fresh) continue;
    const key = motionKey(`d${p}:${rv.length}`);
    if (MOTION.has(key)) {
      out[p] = { key };
      continue;
    }
    const src = p === 0 ? $(`#hand [data-id="${r.id}"]`) : $(`#opp${p} .backs`);
    if (src) out[p] = { key, rect: src.getBoundingClientRect() };
  }
  return out;
}
// After: start (or resume) each discard's flight. The pond is rotated toward its player, so the screen offset is
// turned into the pond's own frame; the individual translate / scale properties leave the tile's transform alone.
function flyDiscards(src) {
  src.forEach((d, p) => {
    if (!d) return;
    const tile = /** @type {HTMLElement|null} */ ($(`#square .pond:nth-child(${p + 1}) .tile:last-child`));
    if (!tile) return;
    let m = MOTION.get(d.key);
    if (!m && d.rect) {
      const to = tile.getBoundingClientRect(),
        dx = d.rect.left + d.rect.width / 2 - (to.left + to.width / 2),
        dy = d.rect.top + d.rect.height / 2 - (to.top + to.height / 2),
        a = (ROT[p] * Math.PI) / 180;
      m = {
        t0: performance.now(),
        x: dx * Math.cos(a) + dy * Math.sin(a),
        y: -dx * Math.sin(a) + dy * Math.cos(a),
        s: p === 0 ? Math.max(1, d.rect.width / Math.max(1, to.width)) : 0.8
      };
      MOTION.set(d.key, m);
    }
    if (!m) return;
    const age = performance.now() - m.t0;
    if (age >= DISCARD_MS) return;
    const anim = tile.animate(
      [
        { translate: `${m.x}px ${m.y}px`, scale: String(m.s), opacity: p === 0 ? 1 : 0.2 },
        { translate: '0 0', scale: '1', opacity: 1 }
      ],
      { duration: DISCARD_MS, easing: 'cubic-bezier(.2,.8,.25,1)', fill: 'backwards' }
    );
    anim.currentTime = age;
  });
}
function renderSquare() {
  let h = '';
  const src = discardSources(),
    moving = motionOn();
  for (let p = 0; p < 4; p++) {
    const pl = G.players[p];
    // Without motion the newest discard gets the simple CSS drop-in (class fresh) on its first draw only.
    const fresh = (r, i) =>
      r.fresh && i === pl.river.length - 1 && !moving && motionAge(motionKey(`f${p}:${i}`), 1e9) === 0;
    h += `<div class="pond" style="--r:${ROT[p]}deg">${pl.river.map((r, i) => tileHTML(r.id, [r.riichi ? 'yoko' : '', r.called ? 'gone' : '', fresh(r, i) ? 'fresh' : '', G.last && G.last.p === p && i === pl.river.length - 1 && !r.called && G.turn !== -1 ? 'last' : ''].join(' '))).join('')}</div>`;
  }
  // Centre: each seat's wind on its edge (highlighted on that player's turn, riichi stick when declared);
  // round, honba, riichi deposits, dora indicators and the wall count in the middle.
  h += '<div class="center">';
  for (let p = 0; p < 4; p++) {
    const pl = G.players[p];
    h += `<div class="seat${G.turn === p ? ' on' : ''}${seatOf(p) === 0 ? ' dealer' : ''}" style="--r:${ROT[p]}deg"><b>${WIND_CH[seatOf(p)]}</b>${pl.riichi ? `<i class="stick${motionAttr('drop', 'r' + p, DROP_MS)}"></i>` : ''}</div>`;
  }
  const inds = doraInds();
  h += `<div class="mid"><b>${roundName()}</b><span>${t('honba', { n: G.honba })} · <i class="stick" title="${t('stat.kyotaku')}"></i>×${G.kyotaku}</span>
    <div class="cdora" title="${t('stat.dora')}">${[0, 1, 2, 3, 4].map(i => (i < inds.length ? tileT(inds[i]) : backHTML())).join('')}</div>
    <span>${t('wallLeft', { n: G.wall.length })}</span></div></div>`;
  $('#square').innerHTML = h;
  flyDiscards(src);
}
// Melds, the newest one sliding in when it was just called.
function meldsHTML(p, cls = '') {
  const ms = G.players[p].melds;
  return ms
    .map((m, i) => {
      const h = meldHTML(m, cls);
      return i === ms.length - 1
        ? h.replace('class="meld"', `class="meld${motionAttr('mnew', `m${p}:${ms.length}`, DROP_MS)}"`)
        : h;
    })
    .join('');
}
function renderMe() {
  const pl = G.players[0],
    sw = seatOf(0);
  const w0 = pl.hand.length % 3 === 1 ? waitsOf(0) : [],
    fur = w0.length && isFuriten(0, w0);
  $('#mebar').classList.toggle('on', G.turn === 0);
  $('#mebar').innerHTML =
    `<span>${t('seat', { w: sw, dealer: sw === 0 })}</span><span>${t('points')} <b>${pl.score}</b></span>${pl.riichi ? `<span class="rtag">${t('riichiOn')}</span>` : ''}${fur ? `<span class="ftag">${t('furiten')}</span>` : ''}`;
  const ids = pl.hand.filter(x => x !== pl.drawn).sort((a, b) => a - b);
  if (pl.drawn != null) ids.push(pl.drawn);
  const dset = new Set(doraInds().map(doraOf));
  let rec = new Set();
  if (S.hint === 'full' && UI.mode === 'discard' && !UI.riichiMode) {
    const rows = ukeireTable(0).filter(r => !UI.opts.forbid.includes(r.d));
    if (rows.length) {
      const b = rows[0];
      rec = new Set(rows.filter(r => r.s === b.s && r.n === b.n).map(r => r.d));
    }
  }
  // Re-rendering replaces the tiles, so put keyboard focus back on the same tile (or the first one).
  const ae = /** @type {HTMLElement} */ (document.activeElement),
    fid = ae && ae.closest && ae.closest('#hand') ? ae.dataset.id : null;
  $('#hand').innerHTML = ids
    .map(id => {
      const ty = tt(id),
        cls = [];
      if (id === pl.drawn && pl.hand.length % 3 === 2) cls.push('drawn');
      if (UI.selected === id) cls.push('sel');
      if (UI.mode === 'discard' && (UI.opts.forbid.includes(ty) || (UI.riichiMode && !UI.opts.riichi.has(ty))))
        cls.push('dim');
      if (rec.has(ty) && (id === pl.drawn || ids.filter(x => tt(x) === ty)[0] === id)) cls.push('rec');
      if (dset.has(ty)) cls.push('dora');
      // Spoken label: the tile, then what the marks show (recommended, drawn, dora, not allowed).
      const label = [TN(ty) + (isAka(id) ? t('red') : '')]
        .concat(cls.includes('rec') ? t('a11y.rec') : [], cls.includes('drawn') ? t('a11y.drawn') : [])
        .concat(cls.includes('dora') ? t('a11y.dora') : [], cls.includes('dim') ? t('a11y.blocked') : [])
        .join(t('pr.sep'));
      return tileHTML(id, cls.join(' '), `data-id="${id}" role="button" tabindex="0" aria-label="${label}"`);
    })
    .join('');
  if (fid != null) {
    const el = $(`#hand [data-id="${fid}"]`) || $('#hand .tile[data-id]');
    if (el) el.focus();
  }
  $('#mymelds').innerHTML = meldsHTML(0);
}
function renderActions() {
  const el = $('#actions');
  let h = '';
  const ae = /** @type {HTMLElement} */ (document.activeElement),
    act = ae && ae.closest && ae.closest('#actions') ? ae.dataset.act : null;
  if (UI.mode === 'discard') {
    const o = UI.opts;
    if (UI.riichiMode)
      h += `<span class="amsg">${t('pickRiichi')}</span><button class="btn ghost" data-act="riichi-cancel" type="button">${t('cancel')}</button>`;
    else {
      h += `<span class="amsg">${UI.selected != null ? t('tapAgain', { t: TN(tt(UI.selected)) }) : t('yourTurn', { one: S.oneTap })}</span>`;
      if (UI.selected != null && S.hint === 'mistakes') {
        const w = discardWarning(UI.selected);
        if (w) h += `<span class="amsg warn">${w}</span>`;
      }
      if (o.tsumo) h += `<button class="btn win" data-act="tsumo" type="button">${t('tsumo')}</button>`;
      if (o.riichi.size) h += `<button class="btn gold" data-act="riichi" type="button">${t('riichi')}</button>`;
      o.kans.forEach(
        (k, i) =>
          (h += `<button class="btn" data-act="kan:${i}" type="button">${k.kind === 'ankan' ? t('ankan') : t('kakan')} ${tileT(k.t)}</button>`)
      );
      if (o.kyuushu) h += `<button class="btn ghost" data-act="kyuushu" type="button">${t('kyuushu')}</button>`;
    }
  } else if (UI.mode === 'riichiTsumo') {
    const o = UI.opts;
    h = `<span class="amsg">${o.tsumo ? t('gotWin') : t('riichiKanOK')}</span>`;
    if (o.tsumo) h += `<button class="btn win" data-act="tsumo" type="button">${t('tsumo')}</button>`;
    o.kans.forEach(
      (k, i) => (h += `<button class="btn" data-act="kan:${i}" type="button">${t('ankan')} ${tileT(k.t)}</button>`)
    );
    h += `<button class="btn ghost" data-act="pass" type="button">${o.tsumo ? t('passNoWin') : t('passNoKan')}</button>`;
  } else if (UI.mode === 'call') {
    const c = UI.call;
    h = `<span class="amsg">${t(c.rob ? 'kakanBy' : 'discardedBy', { p: P(c.d) })} ${tileHTML(c.id, 'chip')}</span>`;
    if (c.ron) h += `<button class="btn win" data-act="ron" type="button">${t('ron')}</button>`;
    if (c.pon) h += `<button class="btn gold" data-act="pon" type="button">${t('pon')}</button>`;
    if (c.kan) h += `<button class="btn" data-act="kan" type="button">${t('kan')}</button>`;
    c.chis.forEach(
      (p, i) =>
        (h += `<button class="btn" data-act="chi:${i}" type="button">${t('chi')} ${tileT(p[0])}${tileT(p[1])}</button>`)
    );
    h += `<button class="btn ghost" data-act="pass" type="button">${t('skip')}</button>`;
  } else if (G.turn >= 1) {
    h = `<span class="amsg">${t('thinking', { p: P(G.turn) })}</span>`;
  } else if (G.turn === 0 && G.players[0].riichi) {
    h = `<span class="amsg">${t('riichiAuto')}</span>`;
  }
  el.innerHTML = h;
  if (act) {
    const b = el.querySelector(`[data-act="${act}"]`);
    if (b) b.focus();
  }
}
function waitLine(x, rem) {
  const res = evaluate(
    ctxFor(0, x * 4 + 3, false, { riichi: G.players[0].riichi, double: G.players[0].doubleRiichi }, false)
  );
  const txt = res
    ? t('ronValue', { v: res.yakuman ? LBL(res.label) : t('han', { n: res.han }), pts: res.ron })
    : `<span class="noyaku">${isMenzen(G.players[0]) ? t('noYakuClosed') : t('noYakuOpen')}</span>`;
  return `<div class="wait">${tileT(x, 'chip')}<div class="wl">${TN(x)} <small>${t('left', { n: rem })}</small><br>${txt}</div></div>`;
}
// "Only warn on mistakes" mode: a warning while a costly tile is selected, and the last costly discard afterwards.
function discardWarning(id) {
  const rows = ukeireTable(0).filter(r => !UI.opts.forbid.includes(r.d)),
    j = judgeDiscard(
      rows,
      tt(id),
      [1, 2, 3].filter(i => G.players[i].riichi)
    );
  return j.kind === 'slow' ? t('warnSlow', { n: j.loss }) : j.kind === 'back' ? t('warnBack') : '';
}
function lastMistakeHTML() {
  const r = (G.review || []).slice(-1)[0];
  if (!r || (r.kind !== 'slow' && r.kind !== 'back')) return `<p class="note">${t('mistakesNone')}</p>`;
  const v = { t: tt(r.id), s: r.mine.s, n: r.mine.n, b: r.best.d, bs: r.best.s, bn: r.best.n };
  return `<h3>${t('lastMove')}</h3><p class="note">${t(r.kind === 'back' ? 'rv.back' : 'rv.slow', v)}</p>`;
}
// Terms in the coach, review and practice text get a tooltip (i18n 'gloss'): the first use of each term in a piece
// of HTML, outside tags. English terms match whole words, any case.
let glossRe = null,
  glossFor = null;
function gloss(html) {
  const raw = L('gloss');
  if (!raw) return html;
  // [term, explanation] pairs (an object also works); English terms are matched in lower case
  const g = Object.fromEntries(
    (Array.isArray(raw) ? raw : Object.entries(raw)).map(([k, v]) => [LANG === 'en' ? k.toLowerCase() : k, v])
  );
  if (glossFor !== LANG) {
    const keys = Object.keys(g)
      .sort((a, b) => b.length - a.length)
      .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    glossRe = new RegExp(
      LANG === 'en' ? `\\b(${keys.join('|')})\\b` : `(${keys.join('|')})`,
      LANG === 'en' ? 'gi' : 'g'
    );
    glossFor = LANG;
  }
  const used = new Set(),
    esc = x => x.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  return html
    .split(/(<[^>]*>)/)
    .map(seg =>
      seg.startsWith('<')
        ? seg
        : seg.replace(glossRe, m => {
            const k = LANG === 'en' ? m.toLowerCase() : m;
            if (used.has(k) || !g[k]) return m;
            used.add(k);
            return `<span class="term" tabindex="0" data-tip="${esc(g[k])}">${m}</span>`;
          })
    )
    .join('');
}
// First-time players (no finished game, no tutorial lesson done) are offered the tutorial in the coach panel.
function tutorialPrompt() {
  if (tutDone().length || loadHistory().length) return '';
  return `<p class="tutnote">${t('tut.prompt')} <button class="linkbtn" type="button" data-tutorial>${t('tut.open')}</button></p>`;
}
function renderCoach() {
  const body = $('#coachBody'),
    tag = $('#coachTag');
  if (S.hint === 'off') {
    body.innerHTML = tutorialPrompt() + `<p class="note">${t('hintsOff')}</p>`;
    tag.textContent = '';
    return;
  }
  if (S.hint === 'mistakes') {
    body.innerHTML = tutorialPrompt() + gloss(lastMistakeHTML());
    tag.textContent = t('opt.hintMistakes');
    return;
  }
  const pl = G.players[0];
  let h = '';
  if (!pl.hand.length) {
    body.innerHTML = '';
    return;
  }
  const vis = visibleTo(0);
  if (pl.hand.length % 3 === 2) {
    const c = counts(pl.hand);
    const cur = shanten(c, pl.melds.length);
    let rows = ukeireTable(0);
    if (UI.opts && UI.opts.forbid) rows = rows.filter(r => !UI.opts.forbid.includes(r.d));
    if (UI.riichiMode) rows = rows.filter(r => UI.opts.riichi.has(r.d));
    tag.textContent = t('tag14');
    h += `<div class="big${cur <= 0 ? ' tenpai' : ''}">${cur === -1 ? t('won') : t('now', { s: shName(cur) })}</div>`;
    h += `<p class="note">${t('sortNote')}</p>`;
    const selT = UI.selected != null ? tt(UI.selected) : -1;
    let show = rows.slice(0, 5);
    const sr = rows.find(r => r.d === selT);
    if (sr && !show.includes(sr)) show.push(sr);
    h += show
      .map(
        (r, i) =>
          `<div class="crow${i === 0 ? ' best' : ''}${r.d === selT ? ' sel' : ''}">${tileT(r.d, 'chip')}<div><div class="cl">${t('crow', { t: TN(r.d), s: r.s, kinds: r.tiles.length, n: r.n, best: i === 0 })}</div><div class="ct">${r.tiles.map(([x, n]) => tileT(x, 'xs') + `<span class="cnt">${n}</span>`).join('')}</div></div></div>`
      )
      .join('');
  } else {
    const c = counts(pl.hand),
      s = shanten(c, pl.melds.length);
    tag.textContent = t('tag13');
    h += `<div class="big${s === 0 ? ' tenpai' : ''}">${shName(s)}</div>`;
    if (s === 0) {
      const w = waitsOf(0),
        fur = isFuriten(0, w);
      h += `<p class="note">${fur ? `<span class="noyaku">${t('furitenNote')}</span>` : t('tenpaiNote')}</p>`;
      h += w.map(x => waitLine(x, 4 - vis[x])).join('');
    } else {
      const acc = [];
      let n = 0;
      for (let x = 0; x < 34; x++) {
        const rem = 4 - vis[x];
        if (rem <= 0) continue;
        c[x]++;
        if (shanten(c, pl.melds.length) < s) {
          acc.push([x, rem]);
          n += rem;
        }
        c[x]--;
      }
      h += `<p class="note">${t('advance', { kinds: acc.length, n })}</p><div class="chips">${acc.map(([x, r]) => tileT(x, 'xs') + `<span class="cnt" style="font-size:11px;color:var(--muted);align-self:flex-end;margin:0 4px 0 1px">${r}</span>`).join('')}</div>`;
    }
  }
  const threats = [1, 2, 3].filter(i => G.players[i].riichi);
  if (threats.length && !pl.riichi) {
    const mine = [...new Set(pl.hand.map(tt))];
    const safe = mine.filter(x => threats.every(r => danger(x, r) === 0));
    const semi = mine.filter(x => !safe.includes(x) && threats.every(r => danger(x, r) <= 3));
    const none = `<span class="note" style="margin:0">${t('none')}</span>`;
    h += `<div class="safe"><h3>${t('safeHead', { names: threats.map(P) })}</h3>
    <div class="note" style="margin:0 0 4px">${t('genbutsu')}</div><div class="chips">${safe.map(x => tileT(x, 'xs')).join('') || none}</div>
    <div class="note" style="margin:8px 0 4px">${t('semiSafe')}</div><div class="chips">${semi.map(x => tileT(x, 'xs')).join('') || none}</div></div>`;
  }
  body.innerHTML = tutorialPrompt() + gloss(h);
}
function renderLog() {
  $('#log').innerHTML = G.log
    .slice(-12)
    .reverse()
    .map(e => `<li>${t('log.' + e.k, e.v)}</li>`)
    .join('');
  const last = G.log[G.log.length - 1];
  $('#ticker').textContent = last ? t('log.' + last.k, last.v) : '';
}
// The one-line coach by your hand: the best discard (hints on), a warning for a costly selected tile (mistakes
// only), your waits when tenpai, and how many safe tiles you hold against a riichi. "More" opens the full coach.
function renderTip() {
  const el = $('#coachTip'),
    pl = G.players[0],
    parts = [];
  if (S.hint !== 'off' && pl.hand.length) {
    if (pl.hand.length % 3 === 2 && UI.mode === 'discard' && !UI.riichiMode) {
      if (S.hint === 'full') {
        const b = ukeireTable(0).filter(r => !UI.opts.forbid.includes(r.d))[0];
        if (b) parts.push(t('tip.best', { t: b.d, s: b.s, n: b.n }));
      } else if (UI.selected != null) {
        const w = discardWarning(UI.selected);
        if (w) parts.push(`<span class="warn">${w}</span>`);
      }
    } else if (pl.hand.length % 3 === 1) {
      const w = waitsOf(0);
      if (w.length) parts.push(t('tip.waits', { list: w.map(TN).join(t('pr.sep')), fur: isFuriten(0, w) }));
    }
    const th = [1, 2, 3].filter(i => G.players[i].riichi);
    if (S.hint === 'full' && th.length && !pl.riichi && pl.hand.length % 3 === 2) {
      const safe = [...new Set(pl.hand.map(tt))].filter(x => th.every(r => danger(x, r) === 0));
      parts.push(t('tip.safe', { n: safe.length }));
    }
  }
  el.innerHTML = parts.length
    ? `<span class="ctxt">${gloss(parts.join(' · '))}</span><button class="linkbtn" type="button" data-open-coach>${t('tip.more')}</button>`
    : '';
}
