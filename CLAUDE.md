# riichi-trainer

Single-player riichi mahjong in the browser for learning. Static site: no build step, no framework, no backend. UI text is Simplified Chinese.

## Layout

- `js/engine.js` — pure rules engine, no DOM. Tile ids 0–135, tile type = `id >> 2` (0–8 man, 9–17 pin, 18–26 sou, 27–30 winds 东南西北, 31–33 白发中). Red fives are ids 16, 52, 88. Main entry: `evaluate(ctx)` returns the best scoring interpretation or `null` when the hand is not complete or has no yaku. Exports via `module.exports` for Node tests.
- `js/game.js` — game state `G`, round flow (`roundLoop`, `resolveCalls`), AI (`aiTurn`, `aiPon`, `aiChi`, `aiChooseDiscard`), human input (`humanTurn`, `input()`), rendering (`render*`), coach panel (`renderCoach`).
- Player 0 is the human; turn order is 0 → 1 (下家) → 2 (对家) → 3 (上家).
- Async flow: `pause()` and `input()` throw `ABORT` when a new game starts (`GEN` changes).

## Conventions

- Keep engine logic in `engine.js` and free of DOM access so it stays testable.
- Add a test in `tests/engine.test.js` for any scoring or yaku change; run `npm test`.
- Plain scripts loaded in order (`engine.js` then `game.js`); no modules or bundler.
