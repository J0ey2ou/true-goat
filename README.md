# True GOAT / 真正的山羊

> 同一份篮球事实，不同的伟大定义。<br>
> Same basketball facts. Different definitions of greatness.

[打开网站 / Open the site](https://j0ey2ou.github.io/true-goat/) · [中文介绍](#中文介绍) · [English](#english) · [开发与方法 / Development & methods](#development)

## 中文介绍

### 这是什么网站？

True GOAT 是一个可以亲手调整的篮球排名实验室，也有球员资料库和猜球员小游戏。

它不替你宣布唯一正确的“历史第一人”，而是让你看清自己的判断：你更重视巅峰、长期稳定、季后赛，还是荣誉？改变一项偏好，哪些球员会上升？这个变化具体来自哪些数据？

网站把两件事分开：**球员做过什么是数据；这些表现有多重要是你的评价选择。** 评论员榜单提供讨论起点，不是最终答案，也没有强制某位球员第一的规则。

### 从一个小实验开始

1. 在[排名实验室](https://j0ey2ou.github.io/true-goat/)选一位评论员的历史观点，或选择均衡起点。
2. 调整一个独立系数，观察排名变化。系数不用凑成 100%，增加一项不会挤压另一项。
3. 打开高级模式，自选场均得分、荣誉次数、荣誉积分、协同项等评价模块；每项都有定义、来源与缺失说明。
4. 点击球员分数，看七维画像和当前模型每项实际加分、扣分。打开“查看我的模型”可阅读公式、解释并导出。
5. 复制模型链接，把你的系数、模块和自选球员分享给别人讨论。

目前提供 Stephen A. Smith、Kendrick Perkins、Skip Bayless、Nick Wright、Chris Broussard、Shannon Sharpe 六个有出处的历史观点。日期与适用范围单独展示；Nick Wright 的样本只是“近 50 年”榜单前五。模型近似这些已知排序，不声称还原评论员心中的真实公式。

### 300 人是默认名单，不是上限

[球员库](https://j0ey2ou.github.io/true-goat/players.html)展示入选理由、背景、球队经历、统计、荣誉和来源。默认 300 人来自荣誉、数据表现与外部讨论等候选入口的去重并集，并非预先指定的历史前 300 名。

实验室和球员库都有“添加球员”入口，可以从扩展 NBA 目录加入自己关心的人，两页共用你的自选名单。默认球员保留；自选球员可以移除。添加操作只影响自己的浏览器，不修改公共数据库。

新增球员沿用固定参考标准，不会因你加人而重新计算原有 300 人的指数。资料不足的维度会明确缺失；尚无实际比赛记录的新人不会获得虚构的生涯评级。当前新增历史球员可计算六个基础维度，季后赛维度尚未扩展，不能把部分覆盖当成完整七维评价。

### 猜球员：按熟悉程度选择范围

[猜球员](https://j0ey2ou.github.io/true-goat/guess.html)与 GOAT 评级名单独立，不限制在 300 人。八次机会、逐项属性反馈；支持每日挑战和自由练习，暂不做对战。

七个池以可点击卡片直接展示，人数取自实际加载的题库；也保留下拉切换。可[直接进入 NBA 现役池](https://j0ey2ou.github.io/true-goat/guess.html?pool=nba-active)。页面显示题库与网站版本，发布时自动为脚本、样式及数据附加内容版本号，避免沿用旧资源缓存；这不会清除本机进度。

2026-10-04 快照：NBA 现役 **620**、历史 **5,105**、简单 **152**；CBA 现役 **328**、历史已收录 **1,487**、简单 **47**。按已核实身份映射合并后共有 **6,717** 份档案，各池有重合，不能直接相加。仍有 63 项跨源身份候选待核实，不凭同名强行合并。前两页的扩展 NBA 目录有 **5,217** 人。

- NBA 现役：NBA.com 当日 30 队阵容快照，包含训练营、双向和可能尚未出场的新人；不是仅凭最近赛季推断现役。
- NBA 全历史：1946–47 至 2025–26 数据快照内所有 NBA/BAA 常规赛实际出场者，不含仅 ABA 或仅季前赛球员。
- NBA 简单球星：常规赛 MVP 至少一次，或至少五届 NBA 全明星入选；历史和现役均可入选。
- CBA 现役：2026–27 赛季官方国内球员已完成注册快照；不包含尚未核实的外援，不把预注册当作完成注册。
- CBA 全部已收录：不再局限于原 30 人精选，使用全部已核实的历史出场档案；来源存在空缺，不冒充 CBA 全史完备名单。
- CBA 简单球星：有来源的历史与现役名将编辑精选，不是官方知名度或实力榜。
- 全球跨联赛池：上述球员与已收录欧洲球员的去重并集，并非全球所有运动员。

可以再限制赛季和球队：答案与搜索候选必须同时满足条件，年份和球队要出现在**同一条实际出场记录**里。注册、当前阵容和档案页年份不算出场证据；零候选时不从范围外出题。NBA/CBA/跨联赛的球队选项随池变化。

输入中文、英文或已收录绰号都可检索，例如“哈登”“大胡子”“James Harden”。新扩展球员尚无核实中文译名时保留英文。提示中的未知不是零，不同联赛或截止期的统计不直接比较。筛选决定谁能入题，不将生涯线索截断为所选年份。

点击猜测记录中的“效力球队”卡片，可以展开该次已猜球员的完整已收录队名、逐项核实赛季与来源；不会泄露尚未猜中的答案。历史队名可能分列，名称条数不一定等于按球队沿革去重后的“效力球队数”。页面采用更大的说明字号与响应式线索卡布局，手机上也能点击查看完整信息。

每日题按北京时间 00:00 更新，同版本、日期、球员池和范围保持一致。各范围进度分别保存在浏览器；题目答案可从客户端数据读取，因此它是休闲练习，不是防作弊竞技服务。玩法参考[弗一把](https://shnlfriberg.online/)，篮球规则、代码和界面独立实现。

### 看得懂，也玩得舒服

每个页面只展示自己的动画导览，支持重看、键盘操作与减少动态效果设置。六套皮肤包含鲜艳深色、奶油浅色与经典森林，跨页同步，不改变分数或猜测颜色的含义。

无需登录即可使用。账号注册和云端同步尚未接入；模型、自选名单、皮肤及游戏进度保存在本机浏览器，不是在线账户。模型分享链接包含所分享的设置和球员 ID，不包含猜球员进度。

### 数据诚实比“什么都有”更重要

- 数据有快照日期。常规赛主要截至 2025–26；已核实季后赛/总决赛实际出场统计截至 2023–24，其他字段以来源标记为准。
- 早期防守、奖项机会和跨联赛背景覆盖不同；缺失与结构性时代差异不会因为画成图就消失。
- “同场对手交锋”有逐场数据基础，但当前没有逐回合防守者信息。直接防守对位分尚未开放，也不把同场得分冒充对另一人的单独进攻表现。
- 网站不是 NBA、CBA、EuroLeague 或任何评论员的官方产品。来源和许可边界见 [THIRD_PARTY_NOTICES.txt](THIRD_PARTY_NOTICES.txt)。

## English

### What is True GOAT?

True GOAT is a hands-on basketball ranking lab, a player directory, and a player-guessing game.

It does not declare one objectively correct greatest player. Instead, it makes your preferences visible: do you value peak dominance, sustained excellence, the playoffs, or honors? Which players rise when you change a preference, and which facts explain that change?

The project separates **what a player did** from **how much you value it**. Published commentator rankings are starting points for discussion, not ground truth. No rule forces a particular player to finish first.

### Start with one experiment

1. Open the [ranking lab](https://j0ey2ou.github.io/true-goat/) and choose a historical commentator preset or a balanced starting point.
2. Move one independent coefficient and watch the rankings change. Coefficients do not have to total 100%; increasing one does not reduce another.
3. Enable advanced mode to choose statistical, award, honors-composite and interaction modules. Each exposes its definition, source and missing-data policy.
4. Click a player's score for a seven-dimensional profile and the actual signed contributions to your model. “My model” explains the formula and supports export.
5. Share a model link containing your coefficients, modules and custom player selections.

Six sourced historical viewpoints are available: Stephen A. Smith, Kendrick Perkins, Skip Bayless, Nick Wright, Chris Broussard and Shannon Sharpe. Dates and scope are explicit; Nick Wright's sample is only the top five of a “last 50 years” list. The fitted models approximate known ordering constraints, not the commentators' undisclosed personal formulas.

### 300 is the default, not a limit

The [player directory](https://j0ey2ou.github.io/true-goat/players.html) explains selection, biographies, teams, statistics, honors and sources. The default 300 are the deduplicated union of honors, statistical and public-discussion candidate pools—not a predetermined all-time top 300.

Both the lab and directory let you add players from an expanded NBA catalog. They share your custom roster; the default players remain, and custom additions can be removed. Your selection changes only your browser, not the public database.

New players use frozen reference standards. Adding someone never recalculates the original 300 players' indices. Missing dimensions stay explicit, and newcomers without verified playing records do not receive invented career ratings. Six base dimensions are currently available for newly added historical players; their playoff dimension is not yet extended, so partial coverage must not be mistaken for a complete seven-dimensional assessment.

### Guess players at your own level

The [guessing game](https://j0ey2ou.github.io/true-goat/guess.html) has an independent player universe, not a 300-player cap. You get eight attempts and attribute feedback, with daily challenges and free practice. Multiplayer is not implemented.

The 2026-10-04 snapshot has **620** active, **5,105** historical and **152** easy NBA players; **328** active, **1,487** recorded historical and **47** easy CBA players. The cross-league union contains **6,717** records after verified identity merges. Pools overlap, so their counts are not additive. There are still 63 unresolved cross-source identity candidates; a shared name is not enough to merge people. The first two pages offer an expanded NBA catalog of **5,217** people.

All seven pools appear as clickable cards with counts from the loaded dataset, alongside the dropdown. [Open the active NBA pool directly](https://j0ey2ou.github.io/true-goat/guess.html?pool=nba-active). The page shows dataset and website versions. Published scripts, styles and datasets receive content-derived version URLs to avoid reusing old cached resources, without clearing local progress.

- Active NBA: a dated NBA.com roster snapshot across all 30 teams, including camp, two-way and potentially unplayed newcomers—not an inference from a recent season.
- All historical NBA: every recorded NBA/BAA regular-season player in the 1946–47 through 2025–26 snapshot; ABA-only and preseason-only players are excluded.
- Easy NBA stars: at least one regular-season MVP or five NBA All-Star selections, including historical and active players.
- Active CBA: completed domestic registrations in the official 2026–27 snapshot; unverified foreign players and preliminary registrations are excluded.
- All recorded CBA: expanded beyond the old 30-player selection using verified historical appearances. Source gaps remain; this is not a claim of a complete all-time CBA census.
- Easy CBA stars: a sourced editorial selection of familiar historical and active players, not an official popularity or performance ranking.
- Cross-league: the deduplicated union plus the collected European sample—not every basketball player worldwide.

Season and team filters constrain both the answer and search results. The year and team must match **the same actual appearance record**. Registration, a current roster, or a profile-page heading does not prove that a player played. Empty ranges never silently fall back to unrelated answers, and available teams change with the league pool.

Search accepts English names, verified Chinese labels and collected nicknames, such as “哈登”, “大胡子” and “James Harden”. Newly added players without reviewed translations remain searchable in English. Unknown is not zero; incompatible statistical scopes or cutoffs are not directly compared. Filtering selects eligible people rather than truncating the career statistics used as clues.

Click a submitted player's team clue to open the full recorded team names, individually verified seasons and sources; the hidden answer is not exposed. Historical names may be listed separately, so name entries can differ from the franchise-deduplicated career team count. Larger explanatory text and responsive clue cards make these details easier to read and tap on phones.

Daily answers change at midnight in Beijing (UTC+8), remaining deterministic for the same data version, date, pool and filters. Each range has separate browser progress. Answers are available in client-side data: this is a casual game, not an anti-cheat competition. [Friberg](https://shnlfriberg.online/) inspired the limited-attempt feedback mechanic; the basketball rules, implementation and interface are independent.

### Clear explanations and comfortable interaction

Each page has its own replayable animated introduction, keyboard support and reduced-motion behavior. Six themes include vivid dark palettes, a light cream palette and the classic forest theme. Themes synchronize across pages without changing scores or clue semantics.

No login is required. Registration and cloud synchronization are not connected yet. Models, custom rosters, themes and game progress are browser-local, not online accounts. Shared model URLs contain the selected settings and player IDs, but not guessing-game progress.

### Honest boundaries

- Data is a snapshot, not a live feed. Regular-season data generally reaches 2025–26; verified playoff/Finals appearance counts reach 2023–24. Other fields carry their own cutoffs.
- Early defensive coverage, award availability and cross-league biographies differ. Visualizations do not remove those limitations.
- Existing box scores can support a future same-game opponent comparison, but do not identify possession-level defenders. Direct defensive-matchup scoring is not available.
- This is not an official NBA, CBA, EuroLeague or commentator product. See [THIRD_PARTY_NOTICES.txt](THIRD_PARTY_NOTICES.txt) for attribution and licensing boundaries.

<a id="development"></a>
## 开发与方法 / Development & methods

### 评分概要 / Scoring summary

基础模型 / Base model:

`S = 50 + Σ β[k] × (X[k] − 50) / 10 + γ × (P − 50) / 10`

七项为常规赛、巅峰、生涯长度、季后赛、荣誉、防守和团队成就。系数独立取 0–10；指数 80、系数 2 的贡献是 +6。总分不是百分制，可以超过 100 或低于 0。大众排名 P 是独立加性项，不是贝叶斯后验。

The seven dimensions are regular season, peak, longevity, playoffs, awards, defense and team success. Independent coefficients range from 0 to 10; an index of 80 with coefficient 2 adds 6 points. Scores are not percentages and may exceed 100 or fall below zero. Public consensus P is another additive term, not a Bayesian posterior.

高级模式可移除基础项，并添加 13 个原始统计、荣誉及协同模块。标准见 [app/modules.mjs](app/modules.mjs)；荣誉综合积分的内部配方固定，产品约定不是官方标准。协同只乘两项高于中性基准的非负部分。重叠信息会提示重复强调。

Advanced mode can remove base dimensions and add 13 statistical, honors and interaction modules. Definitions live in [app/modules.mjs](app/modules.mjs). The honors composite uses fixed inner weights: product conventions, not official standards. Interactions multiply only positive excesses above neutral baselines. Overlapping information is flagged.

缺失项贡献为 0，不重新放大其他项；全部启用项均缺失则未评分，全部系数为 0 则所有人并列 50。七维雷达图展示固定指数，不是当前模型的得分占比；有符号贡献图才解释当前加分扣分。

Missing terms contribute zero without rescaling other terms. A player with no observed active terms is unscored; an all-zero model intentionally ties everyone at 50. The radar shows fixed indices, not score percentages; signed contribution bars explain the active model.

### 运行与发布 / Run and deploy

在仓库根目录运行 / From the repository root:

```sh
node app/server.mjs
# Local preview: http://127.0.0.1:8765
node scripts/16_build_static_site.mjs
# Public-only static output: dist/
```

三个页面均在浏览器运行，不需自建服务器。静态输出支持 GitHub Pages 仓库子路径；只发布 `dist/`，不要上传整个工作区。现有 [Pages workflow](.github/workflows/pages.yml) 在推送 main 后测试、构建并部署。其他静态托管可以使用同一输出；此仓库不宣称已部署 Cloudflare。

All three pages run in the browser without a self-managed backend. The static output supports GitHub Pages repository subpaths. Publish only `dist/`, not the workspace. The existing [Pages workflow](.github/workflows/pages.yml) tests, builds and deploys pushes to main. Other static hosts can use the same output; this repository does not claim a Cloudflare deployment exists.

### 测试 / Tests

```sh
cd app
npm test
npm run test:static
# Start the local server before browser/server tests:
npm run test:server
npm run test:browser
npm run test:onboarding
npm run test:filters
npm run test:modules
npm run test:themes
npm run test:library
```

单元与静态构建无需 npm 依赖。浏览器测试需 Playwright；运行 `npm install`，使用已安装 Edge，或在其他系统安装 Playwright Chromium。可用 `GOAT_PLAYWRIGHT_MODULE`、`GOAT_BROWSER_EXECUTABLE` 和测试脚本支持的 URL 环境变量指定运行时。

Unit tests and static builds need no npm dependencies. Browser tests require Playwright: run `npm install`, use installed Edge, or install Playwright Chromium on other platforms. Runtime paths can be supplied through `GOAT_PLAYWRIGHT_MODULE` and `GOAT_BROWSER_EXECUTABLE`; test scripts also support configurable base URLs.

### 数据重建 / Rebuild data

```sh
python scripts/13_build_expert_presets.py
python scripts/14_build_player_directory.py
python scripts/15_build_guess_players.py
python scripts/17_build_guess_pool_variants.py --catalog
python scripts/18_build_cba_pool_variants.py
python scripts/19_integrate_player_library.py
```

数据构建需要来源说明中列出的原始快照；公开仓库不包含大体积原始数据或完整网页缓存。17/18 使用有出处的事实快照，网络刷新仅在明确请求时运行。19 合并核实过的跨联赛身份、输出扩展题库和添加球员目录；不要只运行旧的 15 后就发布，以免覆盖扩展题库。生成结果与源数据均不应包含个人路径或凭据。

Builders require the original snapshots documented by their sources; large raw datasets and full-page caches are not published. Scripts 17/18 use sourced factual snapshots, with network refreshes only when explicitly requested. Script 19 merges reviewed cross-league identities and exports the expanded game and player catalog. Do not publish after running only legacy script 15, which replaces the expanded game data. Published files must not contain personal paths or credentials.

<details>
<summary>历史 v0.2 离线研究流水线 / Historical v0.2 research pipeline</summary>

早期离线版本研究了候选池、多源核验、大众先验、拟合与敏感度；它不等于当前交互式加性模型。旧版特定配置产生的名次不是网站强制规则。

The earlier offline study explored candidate selection, reconciliation, public priors, fitting and sensitivity. It is distinct from the current interactive additive model; its configured ordering is not a forced website rule.

```sh
python scripts/00_download_sources.py
python scripts/05_collect_external_rankings.py
python scripts/01_build_candidate_pool.py
python scripts/02_collect_player_data.py
python scripts/03_validate_sources.py
python scripts/04_build_indicators.py
python scripts/06_fit_ranking_models.py
python scripts/07_sensitivity_analysis.py
python scripts/08_export_results.py
node scripts/09_build_workbooks.mjs
python scripts/12_final_audit.py
```

历史报告见 `docs/`；原始数据、研究导出与本地诊断不随静态网站发布。

Historical reports live in `docs/`; raw data, research exports and local diagnostics are not part of the public website.

</details>
