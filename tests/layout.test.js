// Keeps the script list in one shape everywhere: index.html, tools/load.js (tests and simulator) and the
// service worker's offline cache. Also keeps randomness seeded.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { CORE, BROWSER, root } = require('../tools/load.js');

const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const pageScripts = [...read('index.html').matchAll(/<script src="js\/([^"]+)"><\/script>/g)].map(m => m[1]);

test('index.html loads the game scripts in the order tools/load.js uses', () => {
  assert.deepStrictEqual(pageScripts, [...CORE, ...BROWSER]);
});

test('every script is in the service worker offline cache', () => {
  const sw = read('sw.js');
  for (const f of pageScripts) assert.ok(sw.includes(`'js/${f}'`), `sw.js SHELL is missing js/${f}`);
  for (const f of fs.readdirSync(path.join(root, 'js')))
    assert.ok(pageScripts.includes(f), `js/${f} is not loaded by index.html`);
});

test('game code draws random numbers from the seeded rand(), not Math.random', () => {
  for (const f of pageScripts) {
    const lines = read('js/' + f)
      .split('\n')
      .filter(l => l.includes('Math.random') && !l.trim().startsWith('//'));
    const allowed = f === 'state.js' ? lines.filter(l => /^const newSeed\s*=/.test(l)) : [];
    assert.deepStrictEqual(lines, allowed, `${f} uses Math.random`);
  }
});
