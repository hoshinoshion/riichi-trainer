# riichi-trainer

Single-player riichi mahjong in the browser for learning. Static site: no build step, no framework, no backend. UI text is Simplified Chinese.

## Layout

- `js/engine.js` — pure rules engine, no DOM. Tile ids 0–135, tile type = `id >> 2` (0–8 man, 9–17 pin, 18–26 sou, 27–30 winds 东南西北, 31–33 白发中). Red fives are ids 16, 52, 88. Main entry: `evaluate(ctx)` returns the best scoring interpretation or `null` when the hand is not complete or has no yaku. Exports via `module.exports` for Node tests.
- `js/game.js` — game state `G`, round flow (`roundLoop`, `resolveCalls`), AI (`aiTurn`, `aiPon`, `aiChi`, `aiChooseDiscard`, `aiWantsRiichi`; difficulty via `lvl(p)` → `easy` / `normal` / `hard`, setting `S.ai`, `mixed` = seats 1–3 easy/normal/hard), human input (`humanTurn`, `input()`), rendering (`render*`), coach panel (`renderCoach`).
- `js/shell.js` — browser-only code (theme switching, service worker registration), loaded after `game.js` and never by tests or `tools/sim.js`. Anything touching `window`, `matchMedia` or `navigator` belongs here, not in `game.js`.
- Themes: colours are CSS custom properties in `css/style.css`; `:root` is modern light, `:root[data-theme="dark"]` and `:root[data-theme="classic"]` override it. Use the tokens (`--panel`, `--gold` accent, `--tile-edge`, …), never hard-coded colours. An inline script in `index.html` sets `data-theme` before first paint; keep its theme-colour map in sync with `THEME_COLOR` in `shell.js`.
- PWA: `manifest.webmanifest`, `sw.js` (network-first, cache as offline fallback) and `icons/` (regenerate PNGs with `node tools/icons.js` after editing `icons/logo.svg`). Add new files the app needs offline to `SHELL` in `sw.js`.
- Player 0 is the human; turn order is 0 → 1 (下家) → 2 (对家) → 3 (上家).
- Async flow: `pause()` and `input()` throw `ABORT` when a new game starts (`GEN` changes).

## Conventions

- Keep engine logic in `engine.js` and free of DOM access so it stays testable.
- Add a test in `tests/engine.test.js` for any scoring or yaku change; run `npm test`.
- When changing AI behaviour, check the levels still rank easy < normal < hard with `npm run sim` (games are noisy: use 100+ games before trusting a difference of a few thousand points).
- Deployed to Cloudflare Workers as static assets only (`wrangler.jsonc`, assets dir `.`). Any new public file must not be excluded by `.assetsignore`; any new dev-only file or folder should be added to it.
- Plain scripts loaded in order (`engine.js`, `game.js`, `shell.js`); no modules or bundler.
