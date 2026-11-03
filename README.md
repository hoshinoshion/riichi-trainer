# riichi-trainer

English | [简体中文](README.zh-CN.md)

**Play online: [riichi.hoshinoshion.com](https://riichi.hoshinoshion.com/)**

A single-player riichi (Japanese) mahjong game for the browser. You play against three computer opponents while a coach panel explains tile efficiency as you go. It is built for beginners learning the game, and for playing just for fun.

Plain HTML, CSS and JavaScript: no build step and no backend. Play it online, or open `index.html` locally.

The interface is available in Japanese, English, Simplified Chinese and Traditional Chinese. It follows your browser language (Japanese if none of these match) and can be switched in Settings.

## Features

- **Full games**: draw and discard, chi, pon, kan (closed, added and open), riichi, tsumo, ron and exhaustive draws, in East-only or East-South games
- **Scoring**: all standard yaku and yakuman, fu and han, mangan and higher limits, honba, riichi deposits, dora, red fives and ura-dora
- **Rules**: furiten (discard, temporary and riichi furiten), ippatsu, double riichi, haitei and houtei, rinshan kaihou, swap-calling (kuikae) restriction on the called tile and its suji, closed kan after riichi when it keeps the same waits, and kan dora turned after the discard for open and added kans
- **Learning aids**
  - Before each discard, lists every option with its shanten count and effective draws, and marks the recommended tile; a one-line tip by your hand gives the gist
  - When you are tenpai, shows your waits, how many of each are left, and roughly what a ron would score; warns you when the hand has no yaku
  - When someone declares riichi, shows which tiles in your hand are safe (genbutsu) and which are relatively safe
  - Three hint levels in Settings: show everything, only warn when a discard gives up draws or steps back, or off (exam mode)
  - Terms such as shanten, genbutsu, suji and furiten have tooltips
  - Built-in rules primer and yaku reference
- **Review after each hand**
  - How many of your discards matched the coach, and the costliest ones, with your hand as it was, your discard and the coach's pick
  - Your riichi and call decisions compared with the hard AI in your seat, with the reason when they differ
  - What the opponents were thinking: who folded, pushed against riichi or stayed damaten, and when
  - A turn-by-turn replay of the whole table at each of your decisions
  - When you deal in: whether the tile was dangerous, which safe tiles you were holding, and whether folding was the better play
  - At the end of the game: how often you matched the coach, steps back, effective draws given up and deal-ins
- **Practice**: short puzzles beside the game, each with an explanation, at easy, normal or hard
  - A six-lesson tutorial for a first game
  - Which tile to discard, what a tenpai hand waits on, what a winning hand is worth (closed and open hands), how many fu it has (with the breakdown), and which tile is safest against a riichi
  - A mistake book: your costly discards from games, asked again until you get them right twice in a row
  - A daily puzzle that is the same for everyone that day, with a streak and a result to copy and share
- **My stats**: every finished game is kept on this device, with games played, average place, win, deal-in, riichi and call rates, how often you matched the coach, and a trend line of that over the last 20 games
- **Computer opponents with three difficulty levels** (set in Settings, takes effect immediately; each opponent's level is shown on its name plate)
  - **Easy (入门)**: plays roughly by tile efficiency with frequent slips, calls without a yaku plan, and almost never folds
  - **Normal (普通)**: discards by effective draws, declares riichi, calls pon on value tiles and toward open tanyao, and folds against riichi when far from tenpai
  - **Hard (困难)**: plays for effective draws like normal and reads the table better: picks the tenpai wait with the best expected score, stays damaten on hands already worth a mangan, treats dangerous open hands as threats, folds using suji, kabe and no-chance reads, avoids kan into a riichi, and tries kokushi with many terminals
  - **Mixed**: one opponent at each level (shimocha easy, toimen normal, kamicha hard), handy for comparing styles
- **Languages**: Japanese, English, Simplified Chinese and Traditional Chinese, picked from the browser language and switchable in Settings
- **Characters**: the three opponents can be characters (on by default): Dango the panda calls a lot, Mikan the cat folds early, Tsukiko the fox chases one-suit hands. Each has an avatar and a few lines
- **Look and feel**: the table fills the screen and everything else sits in a menu drawer (docked beside the table on wide screens); brush-style stamps for riichi, calls and wins; yaku revealed one by one with limit banners; optional sound
- **Themes**: modern light and dark (following the system setting by default), the classic felt table, and two venues, a late-night parlour and a tatami room
- **Keyboard**: arrows to choose a tile, Enter to discard, R riichi, T tsumo / ron, P / C / K calls, Esc to skip, ? for the full list. Screen readers hear each table event, and hand tiles are labelled
- **Installable app (PWA)**: add it to your phone's home screen and it opens full screen like an app, and keeps working offline. On iPhone, open the site in Safari, tap Share → Add to Home Screen; on Android Chrome, use the menu → Install app (or Add to Home screen)
- **Picks up where you left off**: the game in progress is saved at every turn, so closing the tab or the app and opening it again continues the same game
- **Challenge links**: the final screen copies a link that deals a friend the same tiles, hand by hand

## Rules

Each player starts with 25,000 points. Rules are chosen in Settings → Rules and apply from the next game:

| Rule | Standard | Basic | No red fives |
|---|---|---|---|
| Red fives (one per suit) | yes | yes | no |
| Open tanyao, ippatsu, robbing a kan (chankan) | yes | yes | yes |
| Several rons on one tile | double ron (a triple ron aborts) | head bump | head bump |
| Abortive draws: nine terminals, four winds, four kans, four riichi | yes | no | yes |
| Nagashi mangan, pao (big three dragons, big four winds) | yes | no | yes |
| Bust-out below zero | yes | yes | yes |
| West entry (play on until someone has 30,000) | no | no | yes |

Every rule can also be set on its own (Custom). With double or triple ron each winner is paid the honba and the riichi sticks go to the winner closest to the discarder. Nagashi mangan is paid like a mangan tsumo instead of the noten payments.

## Running locally

Open `index.html` in a browser, or start a local server:

```bash
npm start          # same as npx serve .
```

## Tests

Unit tests cover the scoring engine, game rules, translations, and saving and resuming a game. They need Node.js 18 or later:

```bash
npm test
```

`tools/smoke.js` opens the site in headless Chromium in every theme at phone and desktop width, checks for errors and sideways scrolling, and checks that a reload resumes the game. It needs the `playwright` package and its Chromium:

```bash
npm run smoke
```

The scripts are type-checked with TypeScript in checkJs mode (no build output) and formatted with Prettier; both are pinned and fetched by npx:

```bash
npm run typecheck
npm run format
```

GitHub Actions runs the formatting check, the type check, the unit tests, a short simulation and the browser smoke test on every pull request.

To tune the AI, `tools/sim.js` plays computer-only games headlessly and reports average score, rank, win rate and deal-in rate per level:

```bash
npm run sim                                    # 30 East-South games, easy vs normal vs hard
node tools/sim.js 60 normal,normal,hard east   # custom game count, levels and length
node tools/sim.js 60 easy,normal,hard south 7  # another set of deals (game g uses seed 7 + g)
```

Games are dealt from a seed, so the same arguments always give the same table.

## Project layout

```
index.html          Page structure (and the inline script that picks the theme before first paint)
favicon.svg         Site icon
manifest*.webmanifest, sw.js  PWA manifests (one per language) and offline service worker
icons/              Logo and app icons (PNGs rendered by tools/icons.js)
css/style.css       Styles and theme colour tokens
js/i18n.js          UI text in four languages and the t() lookup
js/engine.js        UI-independent rules engine: shanten, hand decomposition, yaku, fu and points
js/state.js         Settings, game state, seeded random numbers, save and resume
js/rules.js         Table rules on the game state: waits, furiten, legal calls, draw / discard / kan
js/ai.js            Computer opponents for the three difficulty levels
js/review.js        Post-hand review: judges your discards against the coach, explains deal-ins
js/flow.js          Game and round flow: dealing, turns, calls, wins and draws
js/render.js        Tiles, table, hand, action buttons, coach panel and result screens
js/practice.js      Practice puzzles and the daily puzzle: generated from a seed, graded, progress kept
js/ui.js            Clicks, keyboard and settings controls, page text, challenge links, start-up
js/practice-ui.js   The practice screen
js/shell.js         Browser-only shell: theme switching and service worker registration
tests/              Engine, game-rule, review, stats, practice, save / resume, page layout and translation tests
tools/load.js       Loads the game scripts into Node for tests and the simulator
tools/sim.js        Headless AI-vs-AI simulator for tuning difficulty
tools/smoke.js      Browser smoke test (headless Chromium)
tools/icons.js      Renders the PNG app icons from icons/logo.svg
```

## Deployment

This is a static site with no build step.

**Cloudflare Workers** (the repository includes `wrangler.jsonc`): in the Cloudflare dashboard go to Workers & Pages → Create application → GitHub, pick this repository, leave the build command empty and keep the deploy command `npx wrangler deploy`, then select Save and Deploy. The Worker name must match `name` in `wrangler.jsonc`. Every push to `main` redeploys. The official instance runs at `riichi.hoshinoshion.com` on a custom domain. The site is served as static assets only, so visits do not count toward Worker request usage. `.assetsignore` keeps tests, tools and docs out of the upload.

**GitHub Pages**: in the repository go to Settings → Pages, set the source to `Deploy from a branch`, and choose branch `main` with folder `/ (root)`. After a few minutes it is available at `https://hoshinoshion.github.io/riichi-trainer/`. Vercel and Netlify also work with no build command.

## License

[MIT](LICENSE)
