// Browser smoke test: serves the site locally and opens it in headless Chromium.
//
//   node tools/smoke.js            (needs the playwright package and its Chromium; CI installs both)
//
// Checks, at phone and desktop width in each theme: the page starts a game with no errors and nothing
// scrolls sideways. Then checks that reloading the page resumes the game instead of dealing a new one.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.webmanifest': 'application/manifest+json' };

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
  const file = path.join(root, rel);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

const failures = [];
const check = (ok, msg) => { if (!ok) failures.push(msg); console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`); };

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch();
  // Fonts come from Google; the page must not depend on them, so block outside requests.
  const open = async (viewport, settings) => {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
    await page.route(u => !u.href.startsWith(url), r => r.abort());
    await page.addInitScript(s => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('rmj-settings', s); sessionStorage.setItem('seeded', '1'); } }, JSON.stringify(settings));
    await page.goto(url);
    await page.waitForSelector('#hand .tile');
    return { page, errors };
  };

  for (const theme of ['light', 'dark', 'classic']) {
    for (const [name, viewport] of [['phone', { width: 390, height: 844 }], ['desktop', { width: 1440, height: 900 }]]) {
      const { page, errors } = await open(viewport, { theme, speed: 'fast' });
      const tiles = await page.locator('#hand .tile').count();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      check(tiles >= 13 && errors.length === 0 && overflow <= 0,
        `${theme} ${name}: ${tiles} tiles in hand, ${overflow > 0 ? overflow + 'px sideways scroll' : 'no sideways scroll'}${errors.length ? ', errors: ' + errors.join(' | ') : ''}`);
      await page.close();
    }
  }

  // You are dealer in the first round, so the game waits for your first discard. The save holds the turn
  // start; reloading must deal nothing new and show the same 14 tiles.
  const { page, errors } = await open({ width: 1280, height: 900 }, { speed: 'fast', lang: 'en' });
  const hand = () => page.$$eval('#hand .tile[data-id]', els => els.map(e => +e.dataset.id).sort((a, b) => a - b).join());
  const before = await hand();
  await page.reload();
  await page.waitForSelector('#hand .tile');
  const after = await hand();
  const logText = await page.locator('#log').innerText();
  check(before === after && /Resumed/.test(logText) && errors.length === 0,
    `reload resumes the game: hand ${before === after ? 'unchanged' : 'changed'}, log ${/Resumed/.test(logText) ? 'says resumed' : 'has no resume line'}`);

  await browser.close();
  server.close();
  if (failures.length) { console.error(`\n${failures.length} check(s) failed`); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
