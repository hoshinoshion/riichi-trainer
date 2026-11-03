// Translations: every language has every key, array tables line up, and language detection picks the right one.
const test = require('node:test');
const assert = require('node:assert');
const { STR, t, setLang, detectLang, YAKU_REF } = require('../js/i18n.js');

const langs = ['ja', 'en', 'zh-CN', 'zh-TW'];
const base = STR['zh-CN'];

test('every language has every key, with the same kind of value', () => {
  for (const l of langs)
    for (const k of Object.keys(base)) {
      if (k === 'yaku') continue; // Simplified Chinese uses the engine names as they are
      assert.ok(k in STR[l], `${l} is missing ${k}`);
      const kind = x => (typeof x === 'function' ? 'string' : Array.isArray(x) ? 'array' : typeof x); // a function and a string both produce text
      assert.strictEqual(kind(STR[l][k]), kind(base[k]), `${l}.${k} has the wrong type`);
      if (Array.isArray(base[k])) assert.strictEqual(STR[l][k].length, base[k].length, `${l}.${k} length`);
      if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]))
        for (const kk of Object.keys(base[k])) assert.ok(kk in STR[l][k], `${l}.${k}.${kk} missing`);
    }
});

test('yaku reference descriptions match the table rows', () => {
  const rows = YAKU_REF.reduce((n, g) => n + g.length, 0);
  for (const l of langs) assert.strictEqual(STR[l].yakuDesc.length, rows, l);
});

test('every engine yaku name is translated', () => {
  const names = [
    '立直',
    '两立直',
    '一发',
    '门前清自摸和',
    '平和',
    '断幺九',
    '一杯口',
    '役牌 白',
    '役牌 发',
    '役牌 中',
    '役牌 自风',
    '役牌 场风',
    '海底摸月',
    '河底捞鱼',
    '岭上开花',
    '七对子',
    '三色同顺',
    '一气通贯',
    '混全带幺九',
    '对对和',
    '三暗刻',
    '三色同刻',
    '三杠子',
    '混老头',
    '小三元',
    '混一色',
    '纯全带幺九',
    '二杯口',
    '清一色',
    '国士无双',
    '四暗刻',
    '大三元',
    '小四喜',
    '大四喜',
    '字一色',
    '绿一色',
    '清老头',
    '九莲宝灯',
    '四杠子',
    '天和',
    '地和'
  ];
  for (const l of ['ja', 'en', 'zh-TW']) for (const n of names) assert.ok(STR[l].yaku[n], `${l} has no name for ${n}`);
  for (const l of langs)
    for (const k of ['满贯', '跳满', '倍满', '三倍满', '累计役满', '役满'])
      assert.ok(STR[l].limits[k], `${l} limit ${k}`);
});

test('placeholders are filled and nested keys resolve', () => {
  setLang('en');
  assert.strictEqual(t('payRon', { p: 'Left', n: 8000 }), 'Left pays 8000');
  assert.strictEqual(t('lv.hard'), 'Hard');
  setLang('ja');
  assert.strictEqual(t('han', { n: 3 }), '3翻');
  assert.strictEqual(t('log.win', { w: 0, l: 2, ym: false, han: 2 }), 'あなた ロン（対面の放銃） 2翻');
});

test('language detection: first supported browser language wins, otherwise Japanese', () => {
  const nav = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const as = languages =>
    Object.defineProperty(globalThis, 'navigator', {
      value: { languages, language: languages[0] },
      configurable: true
    });
  try {
    as(['zh-TW', 'en']);
    assert.strictEqual(detectLang(), 'zh-TW');
    as(['zh-HK']);
    assert.strictEqual(detectLang(), 'zh-TW');
    as(['zh-Hant-TW']);
    assert.strictEqual(detectLang(), 'zh-TW');
    as(['zh-CN']);
    assert.strictEqual(detectLang(), 'zh-CN');
    as(['zh']);
    assert.strictEqual(detectLang(), 'zh-CN');
    as(['fr-FR', 'en-GB']);
    assert.strictEqual(detectLang(), 'en');
    as(['ja-JP']);
    assert.strictEqual(detectLang(), 'ja');
    as(['fr-FR', 'de']);
    assert.strictEqual(detectLang(), 'ja');
    as([]);
    assert.strictEqual(detectLang(), 'ja');
    assert.strictEqual(setLang('en'), 'en'); // an explicit choice wins over the browser
    as(['ko']);
    assert.strictEqual(setLang('auto'), 'ja');
  } finally {
    if (nav) Object.defineProperty(globalThis, 'navigator', nav);
    else delete globalThis.navigator;
  }
});
