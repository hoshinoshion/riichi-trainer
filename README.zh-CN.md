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

算分引擎有单元测试，需要 Node.js 18 及以上：

```bash
npm test
```

调整 AI 时可以用 `tools/sim.js` 在命令行里让电脑互打，统计各难度的平均点数、顺位、和了率和放铳率：

```bash
npm run sim                                  # 默认 30 场半庄，入门 / 普通 / 困难各一家
node tools/sim.js 60 normal,normal,hard east # 自定场数、难度组合和长度
```

## 项目结构

```
index.html          页面结构
favicon.svg         网站图标
css/style.css       样式（牌面、牌桌、面板）
js/engine.js        与界面无关的规则引擎：向听数、和牌拆解、役种、符数、点数
js/game.js          对局流程、电脑 AI、玩家操作、界面渲染、学习提示
tests/              引擎测试
tools/sim.js        无界面的电脑互打模拟器，用来调难度
```

## 部署

这是纯静态网站，不需要构建。

**Cloudflare Workers**（仓库已带 `wrangler.jsonc`）：Cloudflare 控制台 → Workers & Pages → Create application → GitHub，选择本仓库，构建命令留空，部署命令保持 `npx wrangler deploy`，点 Save and Deploy。Worker 名称要和 `wrangler.jsonc` 里的 `name` 一致。之后每次推送到 `main` 都会自动重新部署。本项目的线上版本部署在自定义域名 `riichi.hoshinoshion.com`。网站只以静态资源形式提供，访问不计入 Worker 请求用量；`.assetsignore` 会把测试、工具脚本和文档排除在上传之外。

**GitHub Pages**：仓库 Settings → Pages → Source 选 `Deploy from a branch`，分支选 `main`、目录选 `/ (root)`。几分钟后可以在 `https://hoshinoshion.github.io/riichi-trainer/` 访问。Vercel、Netlify 也都能直接部署，不需要构建命令。

## 开源协议

[MIT](LICENSE)
