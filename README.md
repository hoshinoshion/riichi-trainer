# riichi-trainer

English | [简体中文](README.zh-CN.md)

**Play online: [riichi.hoshinoshion.com](https://riichi.hoshinoshion.com/)**

A single-player riichi (Japanese) mahjong game for the browser. You play against three computer opponents while a coach panel explains tile efficiency as you go. It is built for beginners learning the game, and for playing just for fun.

Plain HTML, CSS and JavaScript: no build step and no backend. Play it online, or open `index.html` locally.

The interface is in Simplified Chinese.

## Features

- **Full games**: draw and discard, chi, pon, kan (closed, added and open), riichi, tsumo, ron and exhaustive draws, in East-only or East-South games
- **Scoring**: all standard yaku and yakuman, fu and han, mangan and higher limits, honba, riichi deposits, dora, red fives and ura-dora
- **Rules**: furiten (discard, temporary and riichi furiten), ippatsu, double riichi, haitei and houtei, rinshan kaihou, and a swap-calling (kuikae) restriction on the same tile
- **Learning aids**
  - Before each discard, lists every option with its shanten count and effective draws, and marks the recommended tile
  - When you are tenpai, shows your waits, how many of each are left, and roughly what a ron would score; warns you when the hand has no yaku
  - When someone declares riichi, shows which tiles in your hand are safe (genbutsu) and which are relatively safe
  - Built-in rules primer and yaku reference
- **Computer opponents with three difficulty levels** (set in Settings, takes effect immediately; each opponent's level is shown on its name plate)
  - **Easy (入门)**: plays roughly by tile efficiency with frequent slips, calls without a yaku plan, and almost never folds
  - **Normal (普通)**: discards by effective draws, declares riichi, calls pon on value tiles and toward open tanyao, and folds against riichi when far from tenpai
  - **Hard (困难)**: looks two draws ahead to prefer good shapes, picks the tenpai wait with the best expected score, stays damaten on hands already worth a mangan, decides push or fold from its hand value, treats dangerous open hands as threats, folds using suji, kabe and no-chance reads, and avoids kan into a riichi
  - **Mixed**: one opponent at each level (shimocha easy, toimen normal, kamicha hard), handy for comparing styles

## Rules

Each player starts with 25,000 points. One red five per suit, open tanyao allowed. Not implemented yet: double and triple ron (head bump is used instead), robbing a kan (chankan), closed kan after riichi, abortive draws such as nine terminals, nagashi mangan and pao.

## Running locally

Open `index.html` in a browser, or start a local server:

```bash
npm start          # same as npx serve .
```

## Tests

The scoring engine has unit tests. They need Node.js 18 or later:

```bash
npm test
```

To tune the AI, `tools/sim.js` plays computer-only games headlessly and reports average score, rank, win rate and deal-in rate per level:

```bash
npm run sim                                  # 30 East-South games, easy vs normal vs hard
node tools/sim.js 60 normal,normal,hard east # custom game count, levels and length
```

## Project layout

```
index.html          Page structure
favicon.svg         Site icon
css/style.css       Styles for tiles, table and panels
js/engine.js        UI-independent rules engine: shanten, hand decomposition, yaku, fu and points
js/game.js          Game flow, computer AI, player actions, rendering and coach panel
tests/              Engine tests
tools/sim.js        Headless AI-vs-AI simulator for tuning difficulty
```

## Deployment

This is a static site with no build step.

**Cloudflare Workers** (the repository includes `wrangler.jsonc`): in the Cloudflare dashboard go to Workers & Pages → Create application → GitHub, pick this repository, leave the build command empty and keep the deploy command `npx wrangler deploy`, then select Save and Deploy. The Worker name must match `name` in `wrangler.jsonc`. Every push to `main` redeploys. The official instance runs at `riichi.hoshinoshion.com` on a custom domain. The site is served as static assets only, so visits do not count toward Worker request usage. `.assetsignore` keeps tests, tools and docs out of the upload.

**GitHub Pages**: in the repository go to Settings → Pages, set the source to `Deploy from a branch`, and choose branch `main` with folder `/ (root)`. After a few minutes it is available at `https://hoshinoshion.github.io/riichi-trainer/`. Vercel and Netlify also work with no build command.

## License

[MIT](LICENSE)
