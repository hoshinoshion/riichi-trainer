// Practice screen (browser only): tabs for the tutorial, the daily puzzle, the five kinds from practice.js and
// the mistake book; the puzzle, feedback after answering, and the next puzzle. Opens from the header, or straight
// to the daily puzzle at #daily. The game keeps its place underneath; computer turns carry on until it is your turn.
const PR = { tab: 'daily', p: null, done: false, ans: null, sel: new Set(), daily: null, lesson: 0, bookAt: 0 };
const PR_TABS = ['learn', 'daily', ...PRACTICE_KINDS, 'book'];
const prDiff = () => (DIFFS.includes(S.prDiff) ? S.prDiff : 'normal');
// A puzzle's identity, so a saved daily answer is only reused for the same puzzle.
const pkey = p => (p.hand || []).join() + '|' + p.kind;

function openPractice(tab) {
  if (tab) PR.tab = tab;
  $('#practice').hidden = false;
  document.body.classList.add('noscroll');
  newPuzzle();
  $('#prClose').focus();
}
function closePractice() {
  $('#practice').hidden = true;
  document.body.classList.remove('noscroll');
  if (location.hash === '#daily') history.replaceState(null, '', location.pathname + location.search);
  $('#btnPractice').focus();
  renderCoach();
}
function newPuzzle() {
  Object.assign(PR, { done: false, ans: null, sel: new Set(), daily: null });
  if (PR.tab === 'daily') {
    const k = dailyKey(new Date()),
      prev = loadPractice().daily[k];
    PR.daily = k;
    PR.p = dailyPuzzle(k);
    if (prev && (!prev.key || prev.key === pkey(PR.p))) {
      PR.done = true;
      PR.ans = prev.ans;
      if (PR.p.kind === 'waits') PR.sel = new Set(prev.ans);
    }
  } else if (PR.tab === 'learn') PR.p = lessonPuzzle(PR.lesson);
  else if (PR.tab === 'book') {
    const b = loadBook();
    PR.p = b.length ? bookPuzzle(b[PR.bookAt % b.length]) : null;
  } else PR.p = makePuzzle(PR.tab, newSeed(), prDiff());
  renderPractice();
}
function answerPuzzle(ans) {
  if (PR.done || !PR.p) return;
  PR.done = true;
  PR.ans = ans;
  const ok = gradePuzzle(PR.p, ans);
  const tally = PR.tab === 'book' ? 'book' : PR.tab === 'learn' ? 'learn' : PR.p.kind;
  savePracticeResult(tally, ok, PR.daily, ans);
  if (PR.daily) {
    // remember which puzzle this answer belongs to
    const p = loadPractice();
    p.daily[PR.daily].key = pkey(PR.p);
    try {
      localStorage.setItem(PRACTICE_KEY, JSON.stringify(p));
    } catch (e) {}
  }
  if (PR.p.book) bookResult(PR.p.book, ok);
  if (PR.tab === 'learn') markLesson(PR.lesson);
  renderPractice();
  $('#prBody .pverdict')?.scrollIntoView({ block: 'nearest' });
}

// ---------- rendering ----------
const prList = types => types.map(TN).join(t('pr.sep'));
const payText = o =>
  o.ron != null
    ? t('pr.ron', { n: o.ron })
    : o.all != null
      ? t('pr.tsumoAll', { n: o.all })
      : t('pr.tsumo', { n: o.n, d: o.d });
// Hand tiles; pick: clickable before answering. mark(id) adds classes after answering.
function prTiles(ids, pick, mark) {
  return ids
    .map(id => {
      const cls = PR.done && mark ? mark(id) : '',
        attr = pick && !PR.done ? `data-pick="${tt(id)}" role="button" tabindex="0"` : '';
      return tileHTML(id, cls, attr);
    })
    .join('');
}
// Only the first tile of the answered type gets the frame, the way the review marks a discard.
const firstOf = (ids, type) => ids.find(id => tt(id) === type);
const pickMarks = p => id =>
  [
    id === firstOf(p.hand, PR.ans) ? 'mine' : '',
    p.best.includes(tt(id)) && id === firstOf(p.hand, tt(id)) ? 'recd' : ''
  ].join(' ');
function verdict() {
  const ok = gradePuzzle(PR.p, PR.ans);
  return `<p class="pverdict ${ok ? 'ok' : 'bad'}">${t(ok ? 'pr.right' : 'pr.wrong')}</p>`;
}
// Multiple choice: options are button labels; after answering the right one is green, a wrong pick red.
function optionsHTML(p, label) {
  return `<div class="popts">${p.options
    .map((o, i) => {
      const cls = !PR.done ? '' : i === p.answer ? ' ok' : i === PR.ans ? ' bad' : '';
      return `<button class="btn popt${cls}" type="button" data-opt="${i}"${PR.done ? ' disabled' : ''}>${label(o)}</button>`;
    })
    .join('')}</div>`;
}

function effHTML(p) {
  let h = `<p class="pq">${t(p.book ? 'pr.q.book' : 'pr.q.eff')}</p><div class="ptiles">${prTiles(p.hand, true, pickMarks(p))}</div>`;
  if (PR.done) {
    const b = p.rows[0];
    let rows = p.rows.slice(0, 4);
    const my = p.rows.find(r => r.d === PR.ans);
    if (my && !rows.includes(my)) rows.push(my);
    h +=
      verdict() +
      `<p class="note">${t('pr.effAns', { list: prList(p.best), s: b.s, n: b.n })}</p><div class="prows">` +
      rows
        .map(
          r =>
            `<div class="prow${p.best.includes(r.d) ? ' best' : ''}${r.d === PR.ans ? ' mine' : ''}">${tileT(r.d, 'chip')}<span>${t('pr.effRow', { t: r.d, s: r.s, n: r.n })}</span></div>`
        )
        .join('') +
      '</div>';
  }
  return h;
}
function waitsHTML(p) {
  const pal = [...Array(9).keys()]
    .map(i => {
      const ty = p.suit * 9 + i,
        on = PR.sel.has(ty),
        right = p.waits.includes(ty);
      const cls = !PR.done ? (on ? ' on' : '') : on && right ? ' ok' : on ? ' bad' : right ? ' miss' : '';
      return `<button class="pal${cls}" type="button" data-wait="${ty}" aria-pressed="${on}"${PR.done ? ' disabled' : ''}>${tileT(ty)}</button>`;
    })
    .join('');
  let h = `<p class="pq">${t('pr.q.waits')}</p><div class="ptiles">${prTiles(p.hand, false)}</div><div class="palette">${pal}</div>`;
  if (!PR.done)
    h += `<div class="pact"><button class="btn gold" type="button" data-act="confirm"${PR.sel.size ? '' : ' disabled'}>${t('pr.confirm')}</button></div>`;
  else h += verdict() + `<p class="note">${t('pr.waitsAns', { list: prList(p.waits), n: p.waits.length })}</p>`;
  return h;
}
// The winning hand of a score / fu puzzle: concealed tiles, open melds, the winning tile, dora indicator.
function winHandHTML(p) {
  const hand = p.isTsumo ? p.hand.filter(id => id !== p.winId) : p.hand;
  return `<div class="ptiles">${prTiles(hand, false)}${(p.melds || []).length ? '<span class="gap"></span>' + p.melds.map(m => meldHTML(m)).join('') : ''}<span class="gap"></span>${tileHTML(p.winId, 'agari')}</div>
  <div class="mdora"><div>${t('doraInd')} ${p.doraInd.map(x => tileT(x, 'xs')).join('')}</div></div>`;
}
const situation = p => ({ tsumo: p.isTsumo, seat: p.seat, dealer: p.isDealer, round: p.round, riichi: p.riichi });
function scoreHTML(p) {
  let h = `<p class="pq">${t('pr.q.score', situation(p))}</p>${winHandHTML(p)}${optionsHTML(p, payText)}`;
  if (PR.done) {
    const r = p.res,
      rows = r.yaku
        .map(([n, v]) => [YN(n), v])
        .concat(
          [
            [t('dora'), r.dora],
            [t('aka'), r.aka]
          ].filter(x => x[1])
        );
    h +=
      verdict() +
      `<ul class="myaku">${rows.map(([n, v]) => `<li><span>${n}</span><b>${t('han', { n: v })}</b></li>`).join('')}</ul>
    <p class="mtotal">${t('fuHan', { fu: r.fu, han: r.han, label: LBL(r.label) })}<small>${payText(p.options[p.answer])}</small></p>`;
  }
  return h;
}
// Fu: the breakdown from the engine (res.fuParts), then the total rounded up to ten.
function fuPartText(x) {
  const [kind, fu, a, b, c] = x;
  if (kind === 'set') return t('fu.set', { t: a, open: b, kan: c, yao: isYao(a) });
  if (kind === 'pair') return t('fu.pair', { t: a });
  if (kind === 'wait') return t('fu.wait', { w: a });
  return t('fu.' + kind);
}
function fuHTML(p) {
  let h = `<p class="pq">${t('pr.q.fu', situation(p))}</p>${winHandHTML(p)}${optionsHTML(p, f => t('pr.fuOpt', { n: f }))}`;
  if (PR.done) {
    const parts = p.res.fuParts,
      sum = parts.reduce((a, x) => a + x[1], 0);
    h +=
      verdict() +
      `<ul class="myaku fu">${parts.map(x => `<li><span>${fuPartText(x)}</span><b>${x[1]}</b></li>`).join('')}</ul>
      <p class="mtotal">${t('pr.fuTotal', { sum, fu: p.res.fu })}</p>`;
  }
  return h;
}
function defenseHTML(p) {
  const last = p.river.length - 1;
  let h = `<p class="pq">${t('pr.q.defense')}</p><div class="pcap">${t('pr.river')}</div>
  <div class="ptiles river">${p.river.map((id, i) => tileHTML(id, i === last ? 'yoko' : '')).join('')}</div>
  <div class="ptiles">${prTiles(p.hand, true, pickMarks(p))}</div>`;
  if (PR.done) {
    // One row per reason (safest first), listing the tiles in your hand it applies to.
    const types = Object.keys(p.risk)
        .map(Number)
        .sort((a, b) => p.risk[a].d - p.risk[b].d || a - b),
      groups = [];
    for (const ty of types) {
      const x = p.risk[ty],
        key = x.why + '|' + (x.vis ?? '');
      let g = groups.find(g => g.key === key);
      if (!g) groups.push((g = { key, x, tiles: [] }));
      g.tiles.push(ty);
    }
    h +=
      verdict() +
      `<p class="note">${t('pr.defAns', { list: prList(p.best) })}</p><div class="prisk">` +
      groups
        .map(g => {
          const lv = g.x.d === 0 ? 'g' : g.x.d <= 3 ? 'a' : 'r';
          return `<div class="prow${g.tiles.includes(PR.ans) ? ' mine' : ''}"><span class="rk ${lv}" aria-hidden="true"></span><span class="rwhy">${t('pr.why.' + g.x.why, { vis: g.x.vis })}</span><span class="chips">${g.tiles.map(ty => tileT(ty, 'xs' + (ty === PR.ans ? ' mine' : ''))).join('')}</span></div>`;
        })
        .join('') +
      '</div>';
  }
  return h;
}
// Tutorial choices: tiles (the dora lesson) or text options, with an optional hand to look at.
function choiceHTML(p) {
  const L = p.lesson;
  let h = `<p class="pq">${t('tut.q.' + L)}</p>`;
  if (p.doraInd)
    h += `<div class="mdora"><div>${t('doraInd')} ${p.doraInd.map(x => tileT(x, 'xs')).join('')}</div></div>`;
  if (p.hand)
    h += `<div class="ptiles">${prTiles(p.hand, false)}<span class="gap"></span>${p.melds.map(m => meldHTML(m)).join('')}<span class="gap"></span>${tileHTML(p.winId, 'agari')}</div>`;
  if (p.tiles) h += optionsHTML({ ...p, options: p.tiles }, ty => tileT(ty));
  else h += optionsHTML(p, k => t(k));
  if (PR.done) h += verdict();
  return h;
}

function renderPractice() {
  if ($('#practice').hidden) return;
  $('#prTabs').innerHTML = PR_TABS.map(
    k =>
      `<button class="ptab${k === PR.tab ? ' on' : ''}" type="button" data-tab="${k}" aria-pressed="${k === PR.tab}">${t(k === 'daily' ? 'pr.daily' : 'pr.k.' + k)}</button>`
  ).join('');
  const p = PR.p,
    prog = loadPractice();
  let head = '',
    foot = '',
    body = '';
  if (PR.tab === 'book' && !p) body = `<p class="note">${t('pr.bookEmpty')}</p>`;
  else
    body = { eff: effHTML, waits: waitsHTML, score: scoreHTML, fu: fuHTML, defense: defenseHTML, choice: choiceHTML }[
      p.kind
    ](p);
  if (PR.tab === 'daily') {
    const k = PR.daily,
      date = t('pr.date', { m: Math.floor(k / 100) % 100, d: k % 100 }),
      streak = dailyStreak(prog, k);
    head = `<div class="phead"><b>${t('pr.dailyHead', { date, kind: t('pr.k.' + p.kind) })}</b>${streak ? `<span>${t('pr.streak', { n: streak })}</span>` : ''}</div>`;
    if (PR.done) {
      const text =
        t('pr.shareText', { app: t('title'), date, kind: t('pr.k.' + p.kind), ok: gradePuzzle(p, PR.ans), streak }) +
        '\n' +
        location.origin +
        location.pathname +
        '#daily';
      foot = `<p class="note">${t('pr.dailyDone')}</p><div class="share"><button class="btn" type="button" data-share="daily" data-text="${text.replace(/"/g, '&quot;')}">${t('pr.shareDaily')}</button></div>`;
    }
  } else if (PR.tab === 'learn') {
    const done = tutDone(),
      n = LESSONS.length,
      L = PR.lesson;
    head = `<div class="phead"><b>${t('tut.progress', { i: L + 1, n })} · ${L_('tut.titles')[L]}</b><span class="tdots" aria-hidden="true">${LESSONS.map((_, i) => `<i class="${done.includes(i) ? 'on' : ''}${i === L ? ' cur' : ''}"></i>`).join('')}</span></div><p class="tut">${L_('tut.texts')[L]}</p>`;
    if (PR.done)
      foot =
        `<p class="note">${L_('tut.answers')[L]}</p>` +
        (L + 1 < n
          ? `<div class="pfoot"><span></span><button class="btn gold" type="button" data-act="lesson">${t('tut.next')}</button></div>`
          : `<p class="pverdict ok">${t('tut.done')}</p>`);
  } else {
    const k = prog.kinds[PR.tab === 'book' ? 'book' : p ? p.kind : PR.tab];
    if (PR.tab === 'book')
      head = `<div class="phead"><b>${t('pr.bookCount', { n: loadBook().length })}</b><span>${t('pr.bookNote')}</span></div>`;
    else
      head = `<div class="phead"><span></span><label class="pdiff">${t('pr.diff')} <select id="prDiff">${DIFFS.map(d => `<option value="${d}"${d === prDiff() ? ' selected' : ''}>${t('pr.d.' + d)}</option>`).join('')}</select></label></div>`;
    if (p)
      foot = `<div class="pfoot"><span class="note">${k ? t('pr.tally', k) : ''}</span>${PR.done ? `<button class="btn gold" type="button" data-act="next">${t('pr.next')}</button>` : ''}</div>`;
  }
  $('#prBody').innerHTML = gloss(head + body + foot);
  if (PR.done) $('#prBody [data-act="next"],#prBody [data-act="lesson"],#prBody [data-share]')?.focus();
}
const L_ = k => L(k);

// ---------- events ----------
$('#btnPractice').addEventListener('click', () => openPractice());
$('#prClose').addEventListener('click', closePractice);
$('#practice').addEventListener('click', e => {
  if (e.target === e.currentTarget) {
    closePractice();
    return;
  }
  const el = e.target.closest('[data-tab],[data-pick],[data-wait],[data-opt],[data-act],[data-share]');
  if (!el) return;
  const d = el.dataset;
  if (d.tab) {
    PR.tab = d.tab;
    if (d.tab === 'learn') PR.lesson = Math.min(LESSONS.length - 1, tutDone().length);
    newPuzzle();
  } else if (d.pick != null) answerPuzzle(+d.pick);
  else if (d.wait != null && !PR.done) {
    const ty = +d.wait;
    PR.sel.has(ty) ? PR.sel.delete(ty) : PR.sel.add(ty);
    renderPractice();
    $(`#prBody [data-wait="${ty}"]`)?.focus();
  } else if (d.opt != null) answerPuzzle(+d.opt);
  else if (d.act === 'confirm') answerPuzzle([...PR.sel].sort((a, b) => a - b));
  else if (d.act === 'next') {
    PR.bookAt++;
    newPuzzle();
  } else if (d.act === 'lesson') {
    PR.lesson++;
    newPuzzle();
  } else if (d.share)
    copyText(d.text).then(ok => {
      el.textContent = t(ok ? 'copied' : 'copyFailed');
      if (!ok && !el.nextElementSibling?.matches('input')) {
        const i = document.createElement('input');
        i.className = 'copybox';
        i.readOnly = true;
        i.value = d.text;
        el.after(i);
        i.select();
      }
    });
});
$('#practice').addEventListener('change', e => {
  if (e.target.id !== 'prDiff') return;
  S.prDiff = e.target.value;
  saveS();
  newPuzzle();
  $('#prDiff')?.focus();
});
$('#practice').addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closePractice();
    return;
  }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-pick]')) {
    e.preventDefault();
    e.target.click();
  }
});
// The coach panel offers the tutorial to a first-time player (see renderCoach).
$('#coachBody').addEventListener('click', e => {
  if (!e.target.closest('[data-tutorial]')) return;
  PR.lesson = Math.min(LESSONS.length - 1, tutDone().length);
  openPractice('learn');
});
$('#optLang').addEventListener('change', renderPractice);
if (location.hash === '#daily') openPractice('daily');
