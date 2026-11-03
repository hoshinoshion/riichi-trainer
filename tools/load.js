// Loads the game scripts into a Node VM, the way index.html loads them in the browser, minus the browser-only
// ones (ui.js binds the page and starts a game, shell.js needs window). Used by tests and tools/sim.js.
//
//   const { ctx, run } = load(extraSource);   // extraSource is appended, so it can override functions
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
// Same order as the <script> tags in index.html (tests/layout.test.js checks this).
const CORE = [
  'engine.js',
  'i18n.js',
  'state.js',
  'rules.js',
  'ai.js',
  'review.js',
  'practice.js',
  'flow.js',
  'render.js'
];
const BROWSER = ['ui.js', 'practice-ui.js', 'shell.js'];

function load(extra = '', { storage = {} } = {}) {
  const el = () => ({
    innerHTML: '',
    textContent: '',
    hidden: true,
    value: '',
    checked: false,
    addEventListener() {},
    focus() {},
    classList: { toggle() {} }
  });
  const els = {};
  const localStorage = {
    getItem: k => (k in storage ? storage[k] : null),
    setItem: (k, v) => {
      storage[k] = String(v);
    },
    removeItem: k => {
      delete storage[k];
    }
  };
  const ctx = {
    console,
    Math,
    setTimeout,
    Promise,
    Set,
    Map,
    Array,
    JSON,
    Object,
    Infinity,
    localStorage,
    document: { querySelector: s => els[s] || (els[s] = el()), querySelectorAll: () => [] }
  };
  vm.createContext(ctx);
  const src = CORE.map(f => fs.readFileSync(path.join(root, 'js', f), 'utf8')).join('\n') + '\n' + extra;
  vm.runInContext(src, ctx);
  return { ctx, run: s => vm.runInContext(s, ctx), storage };
}

module.exports = { load, CORE, BROWSER, root };
