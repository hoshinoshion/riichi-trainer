# riichi-trainer

Single-player riichi mahjong in the browser for learning. Static site: no build step, no framework, no backend. UI text comes in Japanese, English, Simplified and Traditional Chinese (`js/i18n.js`).

## Layout

- `js/engine.js` — pure rules engine, no DOM. Tile ids 0–135, tile type = `id >> 2` (0–8 man, 9–17 pin, 18–26 sou, 27–30 winds 东南西北, 31–33 白发中). Red fives are ids 16, 52, 88. Main entry: `evaluate(ctx)` returns the best scoring interpretation or `null` when the hand is not complete or has no yaku. Exports via `module.exports` for Node tests.
- Game scripts, loaded in this order after `engine.js` and `i18n.js` and sharing one global scope:
  - `js/state.js` — settings `S`, game state `G`, `UI`, the async primitives (`pause()`, `input()`, `ABORT`), the seeded `rand()` and save / resume (`saveGame`, `loadSave`, `clearSave`).
  - `js/rules.js` — table rules on `G` with no DOM: waits, furiten, ukeire, legal riichi / kan / chi, kuikae, and the actions (`drawTile`, `doDiscard`, `doSelfKan`, `applyCall`).
  - `js/ai.js` — AI (`aiTurn`, `aiPon`, `aiChi`, `aiChooseDiscard`, `aiWantsRiichi`); difficulty via `lvl(p)` → `easy` / `normal` / `hard`, setting `S.ai`, `mixed` = seats 1–3 easy/normal/hard.
  - `js/review.js` — post-round review with no DOM: `recordDiscard` judges each of your discards against the coach (`judgeDiscard`: match / defend / slow / back) into `G.review` (this round) and `G.stats` (this game, also hands, wins, riichi, calls); `dealInInfo` explains a deal-in. Also the history across games (`recordGame`, `loadHistory`, `historySummary`) in `localStorage['rmj-history']`.
  - `js/practice.js` — practice puzzles with no DOM: `makePuzzle(kind, seed)` for `eff` / `waits` / `score` / `defense`, `gradePuzzle`, the daily puzzle (`dailyKey`, `dailyPuzzle`) and progress in `localStorage['rmj-practice']`. Puzzles are checked against the engine and the AI's `tileRisk` in `tests/practice.test.js`.
  - `js/flow.js` — `newGame(seed)`, `resumeGame`, `startRound`, `humanTurn`, `resolveCalls`, `roundLoop`, wins, draws, `gameLoop`, `showFinal`.
  - `js/render.js` — tile faces and all `render*` functions, the coach panel (`renderCoach`), result modals and the review sections in them (`reviewHTML`, `dealInHTML`, `summaryHTML`).
  - `js/ui.js` — event binding, settings controls, `translatePage`, challenge links (`?seed=&len=&ai=`), and start-up (challenge link, else resume a saved game, else `newGame()`). Browser only.
  - `js/practice-ui.js` — the practice screen (header button, or `#daily` in the URL). Browser only.
- `js/i18n.js` — UI strings for `ja`, `en`, `zh-CN`, `zh-TW` and `t(key, vars)`. Never hard-code UI text in the game scripts or `index.html`: add a key to all four languages (`tests/i18n.test.js` fails if one is missing). Static page text uses `data-i18n` / `data-i18n-aria` attributes. The engine keeps returning Simplified Chinese yaku and limit names; display them through `YN()` / `LBL()`. Log entries are stored as `log(key, vars)` and translated when rendered. Language: `S.lang` (`auto` = first supported browser language, else Japanese).
- `js/shell.js` — browser-only code (theme switching, service worker registration, `copyText` for share buttons), loaded last and never by tests or `tools/sim.js`. Anything touching `window`, `matchMedia` or `navigator` belongs here, not in the game scripts.
- Themes: colours are CSS custom properties in `css/style.css`; `:root` is modern light, `:root[data-theme="dark"]` and `:root[data-theme="classic"]` override it. Use the tokens (`--panel`, `--gold` accent, `--tile-edge`, …), never hard-coded colours. An inline script in `index.html` sets `data-theme` before first paint; keep its theme-colour map in sync with `THEME_COLOR` in `shell.js`.
- PWA: `manifest.webmanifest`, `sw.js` (network-first, cache as offline fallback) and `icons/` (regenerate PNGs with `node tools/icons.js` after editing `icons/logo.svg`). Add new files the app needs offline to `SHELL` in `sw.js`.
- Player 0 is the human; turn order is 0 → 1 (下家) → 2 (对家) → 3 (上家).
- Async flow: `pause()` and `input()` throw `ABORT` when a new game starts (`GEN` changes).
- Rules: `G.rules` (copied from `RULE_PRESETS` / `S.rules` when a game starts) switches red fives, open tanyao, ippatsu, multiple ron, chankan, abortive draws, nagashi, pao, bust-out and west entry; read them with `rule(k)`. Helpers in `rules.js`: `ronsFrom`, `abortAfterDiscard`, `canKyuushu`, `nagashiPlayers`, `checkPao`, `winDeltas` (pure payment maths).
- Hints: `S.hint` is `full` (coach panel and recommended tiles), `mistakes` (warn only about a costly discard) or `off` (exam mode).
- Randomness: each round's wall is shuffled by `dealRng(G.seed, G.dealt)`, so the n-th hand of a seed is always the same deal (challenge links rely on this); AI noise uses `rand()`, whose state is `G.rng`; puzzles use their own `seeded(seed)`; only `newSeed()` calls `Math.random`, and `tests/layout.test.js` enforces this. A game is fully determined by `G.seed` and the human's choices.
- Saving: `roundLoop()` stores `G` (with `G.flow` = whose turn and how it starts) in `localStorage['rmj-game']` at the start of every turn; `showFinal()` clears it. Anything the flow needs after a reload must live in `G`, not in local variables or module state; Sets are serialised as `{$set:[…]}`. Bump `SAVE_V` in `state.js` when the shape of `G` changes.

## Conventions

- Keep engine logic in `engine.js` and free of DOM access so it stays testable.
- Add a test in `tests/engine.test.js` for any scoring or yaku change, and in `tests/game.test.js` for game-flow rules; run `npm test`.
- When changing AI behaviour, check the levels still rank easy < normal < hard with `npm run sim` (games are noisy: use 100+ games before trusting a difference of a few thousand points).
- Deployed to Cloudflare Workers as static assets only (`wrangler.jsonc`, assets dir `.`). Any new public file must not be excluded by `.assetsignore`; any new dev-only file or folder should be added to it.
- Plain scripts loaded in order (`engine.js`, `i18n.js`, `state.js`, `rules.js`, `ai.js`, `review.js`, `practice.js`, `flow.js`, `render.js`, `ui.js`, `practice-ui.js`, `shell.js`); no modules or bundler. `tools/load.js` holds the same list and loads all but the browser-only `ui.js`, `practice-ui.js` and `shell.js` into a VM for tests and `tools/sim.js`. A new script goes into `index.html`, `tools/load.js` and `SHELL` in `sw.js` (`tests/layout.test.js` checks all three).
- Formatting: JS is formatted with Prettier (`.prettierrc.json`, pinned in `npm run format`); run it before committing, CI runs `npm run format:check`. CSS and HTML are hand-formatted.
- Checks: `npm test` (unit tests), `npm run sim` (AI levels; seeded, so the same arguments give the same table), `npm run smoke` (headless Chromium: every theme at phone and desktop width, no errors or sideways scroll, reload resumes the game). CI (`.github/workflows/ci.yml`) runs all three on pull requests.
