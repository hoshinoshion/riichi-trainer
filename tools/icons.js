// Renders the PNG app icons from icons/logo.svg with the pre-installed Playwright Chromium.
//   node tools/icons.js
// Outputs icons/icon-192.png, icons/icon-512.png, icons/maskable-512.png and icons/apple-touch-icon.png.
// Full-bleed variants (maskable, Apple) drop the rounded corners because the OS applies its own mask;
// the maskable one also shrinks the artwork into the central safe zone.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const dir = path.join(__dirname, '..', 'icons');
const svg = fs.readFileSync(path.join(dir, 'logo.svg'), 'utf8');
const square = svg.replace('rx="15" ', '');
const maskable = square.replace(/(<rect width="64" height="64"[^>]*\/>)([\s\S]*)<\/svg>/, '$1<g transform="translate(32 32) scale(.78) translate(-32 -32)">$2</g></svg>');

const out = [
  ['icon-192.png', 192, svg],
  ['icon-512.png', 512, svg],
  ['maskable-512.png', 512, maskable],
  ['apple-touch-icon.png', 180, square],
];

(async () => {
  const browser = await chromium.launch();
  for (const [name, size, src] of out) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${src}`);
    await page.screenshot({ path: path.join(dir, name), omitBackground: true });
    await page.close();
    console.log('wrote icons/' + name);
  }
  await browser.close();
})();
