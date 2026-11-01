// Service worker: lets the installed app open offline.
// Same-origin files are network-first, so a new deploy shows up on the next load and the cache is only
// the offline fallback. Google Fonts are cache-first (the page has local fallback fonts anyway).
// When adding a public file the app needs offline, add it to SHELL; bump CACHE to drop old entries.
const CACHE = 'riichi-v1';
const SHELL = ['./', 'css/style.css', 'js/engine.js', 'js/game.js', 'js/shell.js', 'favicon.svg',
  'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const put = (req, res) => { if (res.ok && !res.redirected) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; };

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(res => put(req, res)).catch(() =>
      caches.match(req, { ignoreSearch: true }).then(hit => hit || (req.mode === 'navigate' ? caches.match('./') : Response.error()))));
  } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => put(req, res))));
  }
});
