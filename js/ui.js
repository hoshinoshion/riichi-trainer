// Browser input and start-up: hand and action clicks, settings controls, static page text, then the first game.
// Not loaded by tests or tools/sim.js.
// ===================== Events =====================
function submit(v) {
  Object.assign(UI, { selected: null, riichiMode: false });
  give(v);
}
$('#hand').addEventListener('click', e => {
  const el = e.target.closest('.tile[data-id]');
  if (!el || UI.mode !== 'discard') return;
  const id = +el.dataset.id,
    t = tt(id);
  if (UI.opts.forbid.includes(t)) return;
  if (UI.riichiMode && !UI.opts.riichi.has(t)) return;
  if (UI.selected === id || S.oneTap) {
    UI.mode = 'idle';
    submit({ type: 'discard', id, riichi: UI.riichiMode });
  } else {
    UI.selected = id;
    renderMe();
    renderActions();
    renderCoach();
  }
});
$('#hand').addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    e.target.click();
    return;
  }
  // Arrow keys move focus along the hand.
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    const tiles = [...document.querySelectorAll('#hand .tile[data-id]')],
      i = tiles.indexOf(e.target);
    if (i < 0) return;
    e.preventDefault();
    const n = tiles[i + (e.key === 'ArrowRight' ? 1 : -1)];
    if (n) n.focus();
  }
});
$('#actions').addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const [a, i] = b.dataset.act.split(':');
  if (UI.mode === 'discard') {
    if (a === 'tsumo') {
      UI.mode = 'idle';
      submit({ type: 'tsumo' });
    } else if (a === 'riichi') {
      UI.riichiMode = true;
      UI.selected = null;
      render();
    } else if (a === 'riichi-cancel') {
      UI.riichiMode = false;
      UI.selected = null;
      render();
    } else if (a === 'kan') {
      const o = UI.opts.kans[+i];
      UI.mode = 'idle';
      submit({ type: 'kan', opt: o });
    } else if (a === 'kyuushu') {
      UI.mode = 'idle';
      submit({ type: 'kyuushu' });
    }
  } else if (UI.mode === 'riichiTsumo') {
    if (a === 'kan') submit({ type: 'kan', opt: UI.opts.kans[+i] });
    else submit({ type: a === 'tsumo' ? 'tsumo' : 'pass' });
  } else if (UI.mode === 'call') {
    if (a === 'chi') submit({ type: 'chi', useT: UI.call.chis[+i] });
    else submit({ type: a });
  }
});
const bind = (id, key, isBox) => {
  const el = $('#' + id);
  if (isBox) el.checked = S[key];
  else el.value = S[key];
  el.addEventListener('change', () => {
    S[key] = isBox ? el.checked : el.value;
    saveS();
    render();
  });
};
bind('optHint', 'hint', false);
bind('optOneTap', 'oneTap', true);
bind('optSkip', 'autoSkip', true);
bind('optSpeed', 'speed', false);
bind('optLen', 'len', false);
bind('optAI', 'ai', false);
bind('optTheme', 'theme', false);
bind('optLang', 'lang', false);
const aiHint = () => {
  $('#aiHint').textContent = L('aiHint')[S.ai] || L('aiHint').normal;
};
$('#optAI').addEventListener('change', aiHint);
$('#btnClearStats').addEventListener('click', () => {
  if (typeof confirm === 'function' && !confirm(t('stats.confirmClear'))) return;
  clearHistory();
  renderStats();
});
// Starting over throws the current game away, so ask first once anything has been played.
$('#btnNew').addEventListener('click', () => {
  if (G && G.players.some(p => p.river.length) && typeof confirm === 'function' && !confirm(t('confirmNew'))) return;
  newGame();
});

// Header buttons show the current language and theme next to their icons.
function updateTools() {
  $('#langCur').textContent = LANG_NAMES[LANG];
  $('#themeCur').textContent = t('opt.' + (['light', 'dark', 'classic'].includes(S.theme) ? S.theme : 'auto'));
}
function renderYakuTable() {
  const desc = L('yakuDesc'),
    head = L('yakuHead');
  let i = 0;
  $('#yakuTable').innerHTML =
    `<tr>${head.map(h => `<th>${h}</th>`).join('')}</tr>` +
    YAKU_REF.map(
      (rows, g) =>
        `<tr class="grp"><td colspan="3">${L('yakuGroups')[g]}</td></tr>` +
        rows
          .map(
            ([names, han]) =>
              `<tr><td>${names.split('|').map(YN).join(' / ')}</td><td>${han || t('yakuman')}</td><td>${desc[i++]}</td></tr>`
          )
          .join('')
    ).join('');
}
// Static page text: elements carry data-i18n (text) or data-i18n-html (markup) keys.
function translatePage() {
  document.querySelectorAll('[data-i18n]').forEach(e => {
    e.textContent = t(e.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(e => {
    e.setAttribute('aria-label', t(e.dataset.i18nAria));
  });
  document.querySelectorAll('[data-i18n-title]').forEach(e => {
    e.setAttribute('title', t(e.dataset.i18nTitle));
  });
  updateTools();
  $('#rulesList').innerHTML = L('rules')
    .map(r => `<li>${r}</li>`)
    .join('');
  renderYakuTable();
  renderRules();
  aiHint();
  renderStats();
  const root = document.documentElement;
  if (!root) return;
  root.lang = LANG;
  document.title = t('title');
  const meta = (sel, v) => {
    const m = document.querySelector(sel);
    if (m) m.setAttribute('content', v);
  };
  meta('meta[name=description]', t('desc'));
  meta('meta[name=apple-mobile-web-app-title]', t('short'));
  const man = document.querySelector('link[rel=manifest]');
  if (man) man.setAttribute('href', LANG === 'zh-CN' ? 'manifest.webmanifest' : `manifest.${LANG}.webmanifest`);
}
$('#optLang').addEventListener('change', () => {
  setLang(S.lang);
  translatePage();
  render();
});
translatePage();

// Rules: a preset, or custom values; changing any single rule switches to custom with the others kept.
function shownRules() {
  return S.rules.preset === 'custom' ? S.rules.custom : RULE_PRESETS[S.rules.preset];
}
function renderRules() {
  const r = shownRules();
  $('#optRules').value = S.rules.preset;
  $('#ruleList').innerHTML = RULE_KEYS.map(k =>
    k === 'ron'
      ? `<label class="srow" for="rule-ron"><span>${t('rule.ron')}</span><select id="rule-ron" data-rule="ron">${[
          'head',
          'double',
          'triple'
        ]
          .map(
            v =>
              `<option value="${v}"${r.ron === v ? ' selected' : ''}>${t('opt.ron' + v[0].toUpperCase() + v.slice(1))}</option>`
          )
          .join('')}</select></label>`
      : `<label class="srow" for="rule-${k}"><span>${t('rule.' + k)}</span><input type="checkbox" id="rule-${k}" data-rule="${k}"${r[k] ? ' checked' : ''}></label>`
  ).join('');
}
$('#optRules').addEventListener('change', e => {
  S.rules.preset = e.target.value;
  saveS();
  renderRules();
});
$('#ruleList').addEventListener('change', e => {
  const el = e.target,
    k = el.dataset.rule;
  if (!k) return;
  const r = { ...shownRules(), [k]: el.type === 'checkbox' ? el.checked : el.value };
  S.rules = { preset: 'custom', custom: r };
  saveS();
  renderRules();
  $('#rule-' + k).focus();
});

// Challenge links: ?seed=…&len=…&ai=… starts a game with the same deals as the one that was shared.
function challengeFromURL() {
  const q = new URLSearchParams(location.search),
    seed = q.get('seed');
  if (seed === null || !/^\d{1,10}$/.test(seed)) return null;
  history.replaceState(null, '', location.pathname + location.hash); // so a reload resumes instead of restarting
  const pick = (k, ok) => (ok.includes(q.get(k)) ? q.get(k) : null);
  return {
    seed: +seed >>> 0,
    len: pick('len', ['east', 'south']),
    ai: pick('ai', ['easy', 'normal', 'hard', 'mixed']),
    rules: decodeRules(q.get('r'))
  };
}
function challengeURL() {
  const u = new URL(location.pathname, location.href);
  u.search = new URLSearchParams({
    seed: G.seed,
    len: G.lastWind ? 'south' : 'east',
    ai: S.ai,
    r: encodeRules(G.rules)
  }).toString();
  return u.href;
}
// Share buttons in the result screens copy a link or a result line; if the clipboard is refused, show the text.
$('#modal').addEventListener('click', e => {
  const b = e.target.closest('[data-share]');
  if (!b) return;
  const text = b.dataset.share === 'challenge' ? challengeURL() : b.dataset.text;
  copyText(text).then(ok => {
    b.textContent = t(ok ? 'copied' : 'copyFailed');
    if (!ok && !b.nextElementSibling?.matches('input')) {
      const i = document.createElement('input');
      i.className = 'copybox';
      i.readOnly = true;
      i.value = text;
      b.after(i);
      i.select();
    }
  });
});

// Start-up: a challenge link starts its game (asking first if it would replace an unfinished one); otherwise
// pick up an unfinished game if there is one, else deal a new one.
{
  const ch = challengeFromURL(),
    saved = loadSave();
  if (ch && (!saved || typeof confirm !== 'function' || confirm(t('confirmChallenge')))) {
    if (ch.len) S.len = ch.len;
    if (ch.ai) S.ai = ch.ai;
    saveS();
    $('#optLen').value = S.len;
    $('#optAI').value = S.ai;
    aiHint();
    newGame(ch.seed, ch.rules);
    log('challenge', { seed: ch.seed });
    render();
  } else if (saved) resumeGame(saved);
  else newGame();
}
