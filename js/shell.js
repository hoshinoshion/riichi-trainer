// Browser shell: theme switching and the PWA service worker. Kept out of game.js so the game logic
// still loads in Node (tests, tools/sim.js) without window, matchMedia or navigator.
const THEME_COLOR = { light: '#f4f4f1', dark: '#111214', classic: '#0d1613' };
const darkMQ = matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const t = ['light', 'dark', 'classic'].includes(S.theme) ? S.theme : darkMQ.matches ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', t);
  document.querySelector('meta[name=theme-color]').setAttribute('content', THEME_COLOR[t]);
}
$('#optTheme').addEventListener('change', applyTheme);
// "跟随系统" follows the OS switching between light and dark while the page is open.
darkMQ.addEventListener('change', () => {
  if (!['light', 'dark', 'classic'].includes(S.theme)) applyTheme();
});
applyTheme();

// Copy text for the share buttons; resolves false when the clipboard is not available or refused.
function copyText(s) {
  try {
    return navigator.clipboard.writeText(s).then(
      () => true,
      () => false
    );
  } catch (e) {
    return Promise.resolve(false);
  }
}

// Offline support and "add to home screen". Service workers need http(s), so skip file:// previews.
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
