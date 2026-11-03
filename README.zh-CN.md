# 立直麻将练习场 · riichi-trainer

[English](README.md) | 简体中文

**在线试玩：[riichi.hoshinoshion.com](https://riichi.hoshinoshion.com/)**

一个单机的网页版日本麻将（立直麻将）。你和三位电脑对局，边打边看牌效提示，适合入门学习，也可以自己打着玩。

纯 HTML / CSS / JavaScript，没有构建步骤，也不需要后端。可以直接在线玩，也可以在本地打开 `index.html`。

## 功能

- **完整对局**：摸打、吃、碰、杠（暗杠 / 加杠 / 明杠）、立直、自摸、荣和、荒牌流局，东风战或半庄战
- **算分**：全部常用役种和役满，符数、番数、满贯以上的点数档位，本场、供托、宝牌、红宝牌、里宝牌
- **规则判定**：振听（舍牌振听、同巡振听、立直振听）、一发、两立直、海底 / 河底、岭上开花、食替限制（现物和筋）、立直后暗杠（不改变听牌时）、明杠 / 加杠的杠宝牌打牌后翻
- **学习提示**
  - 出牌时列出每种打法的向听数和有效进张，并标出推荐打的牌
  - 听牌时显示听哪些牌、各剩几张、荣和大约几番几点，没有役时会提醒
  - 有人立直时显示手里的现物和较安全的牌
  - 内置规则速成和役种一览
- **多语言**：日语、英语、简体中文、繁体中文，按浏览器语言自动选择（都不匹配时用日语），可在「设置」里切换
- **主题**：现代浅色和深色（默认跟随系统），以及经典牌桌风格，可在「设置」里切换
- **可安装（PWA）**：添加到手机主屏幕后像 App 一样全屏打开，离线也能玩。
- **接着上次打**：每一巡自动保存进行中的对局，关掉页面或 App 再打开会继续同一局。iPhone 用 Safari 打开网站，点「分享」→「添加到主屏幕」；安卓 Chrome 点菜单 →「安装应用」或「添加到主屏幕」
- **电脑对手，三档难度**（在「设置」里切换，立即生效；对手名牌上会标出难度）
  - **入门**：只看大致牌效，经常打错，常无役乱鸣，几乎不弃和
  - **普通**：按有效进张出牌，会立直、碰役牌、走断幺路线鸣牌，有人立直且自己离听牌远时弃和
  - **困难**：多看两步、优先好形；听牌时选打点期望最高的听法；已有役且满贯以上时默听；按手牌价值决定押退；会防危险的副露；弃和时利用筋、壁、No Chance；有人立直时不乱杠
  - **混合**：下家入门、对家普通、上家困难，方便对比三种打法

## 规则说明

25000 点起，每色一张赤五，食断有。以下暂未实现：双响 / 三响（采用头跳）、抢杠、九种九牌等途中流局、流局满贯、包牌。

## 本地运行

直接用浏览器打开 `index.html` 即可。也可以起一个本地服务器：

```bash
npm start          # 等同于 npx serve .
```

## 测试

单元测试覆盖算分引擎、对局规则、翻译，以及对局的保存和恢复，需要 Node.js 18 及以上：

```bash
npm test
```

`tools/smoke.js` 用无界面的 Chromium 打开网站，在每套主题、手机和桌面宽度下检查报错和横向滚动，并确认刷新后会接着原来的对局。需要 `playwright` 包和它的 Chromium：

```bash
npm run smoke
```

每个 Pull Request 都会由 GitHub Actions 跑单元测试、一小段模拟和浏览器冒烟测试。

调整 AI 时可以用 `tools/sim.js` 在命令行里让电脑互打，统计各难度的平均点数、顺位、和了率和放铳率：

```bash
npm run sim                                    # 默认 30 场半庄，入门 / 普通 / 困难各一家
node tools/sim.js 60 normal,normal,hard east   # 自定场数、难度组合和长度
node tools/sim.js 60 easy,normal,hard south 7  # 换一组牌（第 g 场用种子 7 + g）
```

发牌由种子决定，同样的参数总是得到同样的结果。

## 项目结构

```
index.html          页面结构（含首屏前选择主题的内联脚本）
favicon.svg         网站图标
manifest*.webmanifest, sw.js  PWA 清单（每种语言一份）和离线用的 Service Worker
icons/              Logo 和 App 图标（PNG 由 tools/icons.js 生成）
css/style.css       样式和主题配色变量
js/i18n.js          四种语言的界面文字和 t() 查找函数
js/engine.js        与界面无关的规则引擎：向听数、和牌拆解、役种、符数、点数
js/state.js         设置、对局状态、带种子的随机数、存档与恢复
js/rules.js         基于对局状态的规则：听牌、振听、能否鸣牌、摸打和杠
js/ai.js            三档难度的电脑对手
js/flow.js          对局与每一局的流程：发牌、轮转、鸣牌、和牌与流局
js/render.js        牌面、牌桌、手牌、操作按钮、学习提示和结算画面
js/ui.js            点击、键盘和设置控件，页面文字，启动
js/shell.js         只在浏览器里运行的外壳：主题切换、注册 Service Worker
tests/              引擎、对局规则、存档恢复、页面结构和翻译测试
tools/load.js       把游戏脚本加载进 Node，供测试和模拟器使用
tools/sim.js        无界面的电脑互打模拟器，用来调难度
tools/smoke.js      浏览器冒烟测试（无界面 Chromium）
tools/icons.js      从 icons/logo.svg 生成 PNG 图标
```

## 部署

这是纯静态网站，不需要构建。

**Cloudflare Workers**（仓库已带 `wrangler.jsonc`）：Cloudflare 控制台 → Workers & Pages → Create application → GitHub，选择本仓库，构建命令留空，部署命令保持 `npx wrangler deploy`，点 Save and Deploy。Worker 名称要和 `wrangler.jsonc` 里的 `name` 一致。之后每次推送到 `main` 都会自动重新部署。本项目的线上版本部署在自定义域名 `riichi.hoshinoshion.com`。网站只以静态资源形式提供，访问不计入 Worker 请求用量；`.assetsignore` 会把测试、工具脚本和文档排除在上传之外。

**GitHub Pages**：仓库 Settings → Pages → Source 选 `Deploy from a branch`，分支选 `main`、目录选 `/ (root)`。几分钟后可以在 `https://hoshinoshion.github.io/riichi-trainer/` 访问。Vercel、Netlify 也都能直接部署，不需要构建命令。

## 开源协议

[MIT](LICENSE)
