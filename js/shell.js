// Browser shell: theme switching and the PWA service worker. Kept out of game.js so the game logic
// still loads in Node (tests, tools/sim.js) without window, matchMedia or navigator.
const THEME_COLOR = { light: '#f4f4f1', dark: '#111214', classic: '#0d1613', parlor: '#120f1c', tatami: '#efe6d2' };
const THEMES = Object.keys(THEME_COLOR);
const darkMQ = matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const t = THEMES.includes(S.theme) ? S.theme : darkMQ.matches ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', t);
  document.querySelector('meta[name=theme-color]').setAttribute('content', THEME_COLOR[t]);
}
$('#optTheme').addEventListener('change', applyTheme);
// "跟随系统" follows the OS switching between light and dark while the page is open.
darkMQ.addEventListener('change', () => {
  if (!THEMES.includes(S.theme)) applyTheme();
});
applyTheme();

// The system "reduce motion" setting, as a class the game scripts can read (count-up animations check it).
const motionMQ = matchMedia('(prefers-reduced-motion: reduce)');
const applyMotion = () => document.documentElement.classList.toggle('reduce-motion', motionMQ.matches);
motionMQ.addEventListener('change', applyMotion);
applyMotion();

// Sound (setting S.sound, off by default): short tones made with Web Audio, no audio files. The venue themes
// tune the tile click: lower on tatami, brighter in the late-night parlour.
let actx = null;
function tone(freq, start, dur, type = 'triangle', vol = 0.18) {
  const o = actx.createOscillator(),
    g = actx.createGain(),
    t0 = actx.currentTime + start;
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g).connect(actx.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}
function click(freq) {
  const n = actx.sampleRate * 0.05,
    buf = actx.createBuffer(1, n, actx.sampleRate),
    d = buf.getChannelData(0);
  // noise for the click from a tiny fixed generator (the game's seeded rand() is not touched by sound)
  let x = 1;
  for (let i = 0; i < n; i++) {
    x = (x * 16807) % 2147483647;
    d[i] = (x / 1073741823.5 - 1) * Math.pow(1 - i / n, 4);
  }
  const src = actx.createBufferSource(),
    f = actx.createBiquadFilter(),
    g = actx.createGain();
  src.buffer = buf;
  f.type = 'bandpass';
  f.frequency.value = freq;
  f.Q.value = 3;
  g.gain.value = 0.6;
  src.connect(f).connect(g).connect(actx.destination);
  src.start();
}
sfx = kind => {
  if (!S.sound) return;
  try {
    actx = actx || new (window.AudioContext || /** @type {any} */ (window).webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const pitch = { tatami: 0.7, parlor: 1.25 }[document.documentElement.dataset.theme] || 1;
    if (kind === 'discard') click(1800 * pitch);
    else if (kind === 'call') [660, 880].forEach((f, i) => tone(f * pitch, i * 0.08, 0.12, 'square', 0.08));
    else if (kind === 'riichi') [880, 1320].forEach((f, i) => tone(f * pitch, i * 0.12, 0.45));
    else if (kind === 'win') [523, 659, 784, 1046].forEach((f, i) => tone(f * pitch, i * 0.11, 0.35));
  } catch (e) {}
};

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
