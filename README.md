# True GOAT / 真正的山羊

> 同一份篮球事实，不同的伟大定义。<br>
> Same basketball facts. Different definitions of greatness.

[打开网站 / Open the site](https://j0ey2ou.github.io/true-goat/) · [中文介绍](#中文介绍) · [English](#english) · [开发与方法 / Development & methods](#development)

[玩法灵感与特别致谢](#inspiration-zh) · [Inspiration & acknowledgements](#inspiration-en)

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

### 全球球员库：先看覆盖，再谈排名

[球员库](https://j0ey2ou.github.io/true-goat/players.html)与排名实验室默认载入全部 **6,717** 份已收录档案，可按联赛、数据覆盖、中文名、英文名和绰号检索，并分页浏览。NBA / BAA、CBA 和 EuroLeague 按已核实身份去重；这是全球联赛目录的现有覆盖，不是全球所有篮球运动员的完备名单。

原 300 人保留原有七维基础指标及缺失状态，扩展 NBA 球员沿用固定参考标准；没有可比资料的国际球员保留档案，缺失指数不变成零或虚构评分。原来的自选名单继续作为浏览器内收藏，取消收藏不再将球员移出全库。

点击侧栏维度名称、说明、雷达图轴或数值表，可打开该维度的原始组成、固定参考百分位、权重、逐项贡献、计算公式与全库维度排名。排名支持搜索和分页。原始指数、对手调整后指数和本次模型贡献分别列出；不能把部分覆盖当成完整七维评价。

### 猜球员：按熟悉程度选择范围

[猜球员](https://j0ey2ou.github.io/true-goat/guess.html)与 GOAT 评级名单独立，不限制在 300 人。八次机会、逐项属性反馈；每日挑战和自由练习无需登录，也可注册账号参加在线 1v1。

默认保留 10 项线索。打开“自选线索 · 单人玩法”，可以增减项目，另外选择冠军赛季数、DPOY、场均助攻/篮板/抢断/盖帽、FMVP 和全明星入选，共 18 项可选。额外数据按需加载，不影响 GOAT 评分；资料不完整时显示未知，而不是零。冠军赛季数按来源赛季球队记录与冠军名单匹配，不等同于戒指授予人数；目前这项仅覆盖原已核实档案。

展开“在线 1v1 · 账号与天梯”，登录后可天梯匹配，或创建好友房分享房间码。双方同题、8 次机会、180 秒，在线固定默认 10 项线索，不采用单人自选模块或赛季/球队筛选。可以同时看到对方的尝试次数和颜色进度，但看不到对方猜过的名字。先猜中者胜；双方未猜中则平局。初始 1000 分、Elo K=24，仅天梯对局计分，好友房不计分；排行榜展示前 100 名已参赛玩家。答案、猜测判定和积分结算在 Supabase 云端处理。

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

点击猜测记录中的“效力球队”卡片，只展开该次已猜球员的全部已收录球队名称，不逐赛季罗列；不会泄露尚未猜中的答案。历史队名可能分列，名称条数不一定等于按球队沿革去重后的“效力球队数”。页面采用更大的说明字号与响应式线索卡布局，手机上也能点击查看完整信息。

每日题按北京时间 00:00 更新，同版本、日期、球员池和范围保持一致。各范围进度分别保存在浏览器；题目答案可从客户端数据读取，因此它是休闲练习，不是防作弊竞技服务。猜球员玩法受到 CS 猜选手游戏与社区的启发，完整引用见下方[玩法灵感与特别致谢](#inspiration-zh)。

<a id="inspiration-zh"></a>
### 玩法灵感与特别致谢

True GOAT 的猜球员并不是凭空诞生的。感谢 CS 社区把选手知识、逐项线索推理和一起猜答案的乐趣结合起来，让我们看到了把这种体验带到篮球领域的可能。以下分别说明玩法、社区与开源参考，避免把灵感来源藏在一句笼统的“参考”里：

- **[BLAST Counter-Strikle · 猜选手游戏](https://blast.tv/counter-strikle)**：感谢其将职业选手辨认做成易于上手的每日猜谜体验。它为“先猜一个人，再逐步缩小范围”的互动方向提供了启发。
- **[玩机器丶Machine · 斗鱼直播间 6657](https://www.douyu.com/6657)**：特别感谢玩机器与直播间观众共同营造的猜选手、聊选手的互动氛围。
- **[弗一把 · 在线体验](https://shnlfriberg.online/) / [GitHub：shnlfriberg/csgofriberg](https://github.com/shnlfriberg/csgofriberg)**：特别感谢原作者、维护者与贡献者公开项目和玩法说明。八次机会、属性逐项反馈、颜色提示与数值方向提示，为本项目的篮球版猜测规则提供了直接参考。也欢迎大家体验原作、关注仓库，并支持原项目的持续维护。

以上是对玩法启发、社区影响与开源分享的肯定，不是联合出品、官方授权或代码依赖声明。True GOAT 的篮球规则、代码与界面独立实现；未复制上述项目的代码或视觉素材，CS 选手数据也未混入篮球题库。实际使用的篮球数据来源及许可另见 [THIRD_PARTY_NOTICES.txt](THIRD_PARTY_NOTICES.txt)。感谢这些创作者和社区先把好玩的想法做出来、分享出来。

### 看得懂，也玩得舒服

每个页面只展示自己的动画导览，支持重看、键盘操作与减少动态效果设置。六套皮肤包含鲜艳深色、奶油浅色与经典森林，跨页同步，不改变分数或猜测颜色的含义。

排名、球员库和单人猜球员无需登录。模型、自选名单、皮肤及单人进度仍保存在本机浏览器，不随账号同步；账号档案、在线对局和天梯积分保存在 Supabase。当前采用邮箱＋密码直接注册，不验证邮箱归属；未配置发送邮件服务，暂不支持邮件找回密码。模型分享链接包含所分享的设置和球员 ID，不包含猜球员进度。

### 数据诚实比“什么都有”更重要

- 数据有快照日期。猜球员的常规赛、奖项及已核实季后赛/总决赛实际出场统计截至 2025–26；后两项于 2026-10-07 补齐 2025、2026 两季的逐场出场事实，排除附加赛。现役名单仍是 2026-10-04 快照，CBA/欧洲资料有缺漏。GOAT 评分和资料库的旧季后赛统计独立标记，不因猜球员更新而改变。
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

### A global directory with explicit coverage

The [player directory](https://j0ey2ou.github.io/true-goat/players.html) and ranking lab load all **6,717** collected profiles by default. Search names and aliases, filter leagues and scoring coverage, and browse paginated results. Verified NBA / BAA, CBA and EuroLeague identities are deduplicated; this is the available global coverage, not a complete census of every basketball player.

The original 300 retain their existing base indices, including any missing dimensions. Extended NBA profiles use frozen reference standards. International profiles without comparable inputs remain searchable without invented ratings. Previous custom selections become browser-local favorites; removing a favorite no longer removes the player from the directory.

Click a sidebar dimension, description, radar axis or index table to inspect its raw inputs, frozen percentiles, weights, component contributions, formulas and searchable dimension rankings. The base index, opposition-adjusted index and current model contribution appear separately. Partial data coverage is not a complete seven-dimensional assessment.

### Guess players at your own level

The [guessing game](https://j0ey2ou.github.io/true-goat/guess.html) has an independent player universe, not a 300-player cap. You get eight attempts and attribute feedback. Daily challenges and free practice need no login; registered accounts can also play online 1v1.

The default ten clues stay unchanged. Enable the single-player custom-clue switch to add or remove modules, with championship seasons, DPOY, career assists/rebounds/steals/blocks per game, Finals MVP and All-Star selections among 18 choices. Extra facts load on demand and never change GOAT ratings. Incomplete data stays unknown, not zero. Championship seasons match sourced team-season records to champion teams, not ring recipients; this field currently covers only the previously verified profiles.

Open the online panel to sign in, join ranked matchmaking, or share a friendly room code. Both players get the same answer, eight attempts and 180 seconds. Online games always use the default ten clues and their own pool, not single-player custom clues or season/team filters. Opponent attempts and colored progress are visible, but guessed names are not. The first correct answer wins; neither solving means a draw. Ranked ratings start at 1000 with Elo K=24; friendly rooms do not affect ratings. The leaderboard lists up to 100 ranked participants. Hidden answers, clue judgments and rating settlement are handled by Supabase.

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

Click a submitted player's team clue to open all recorded team names, without season-by-season listings; the hidden answer is not exposed. Historical names may be listed separately, so name entries can differ from the franchise-deduplicated career team count. Larger explanatory text and responsive clue cards make these details easier to read and tap on phones.

Daily answers change at midnight in Beijing (UTC+8), remaining deterministic for the same data version, date, pool and filters. Each range has separate browser progress. Answers are available in client-side data: this is a casual game, not an anti-cheat competition. The guessing experience draws inspiration from CS player-guessing games and their communities; see the explicit [credits below](#inspiration-en).

<a id="inspiration-en"></a>
### Inspiration & acknowledgements

True GOAT's guessing game did not emerge in isolation. We thank the CS community for turning player knowledge, attribute-based deduction and shared guessing into an engaging experience worth exploring in basketball. We distinguish game inspiration, community influence and open-source references below:

- **[BLAST Counter-Strikle](https://blast.tv/counter-strikle)**: Thank you for making professional-player identification an approachable daily guessing experience, inspiring the interaction of naming a player and progressively narrowing the possibilities. This is credited to BLAST, not described as an official HLTV game.
- **[HLTV](https://www.hltv.org/) / [player statistics database](https://www.hltv.org/stats/players)**: We appreciate its longstanding work documenting professional CS players, events and statistics, and its contribution to a community that discusses players through their careers and data. This credits the information platform and data culture; it does not imply HLTV supplies basketball data to True GOAT or owns other platforms' guessing games.
- **[玩机器 / Machine — Douyu channel 6657](https://www.douyu.com/6657)**: Special thanks to Machine and the viewers for the interactive atmosphere around guessing and discussing players. The enjoyment of a streamer and audience recalling careers and reasoning through clues together is an experience we hope to carry into basketball. This is a creative and community acknowledgement, not a claim of development involvement or endorsement.
- **[弗一把 / Friberg — play online](https://shnlfriberg.online/) / [GitHub: shnlfriberg/csgofriberg](https://github.com/shnlfriberg/csgofriberg)**: Special thanks to the original author, maintainers and contributors for publishing the project and its gameplay documentation. Its eight-attempt format, attribute feedback, color cues and numerical direction hints directly informed our basketball guessing rules. Please also try the original, explore the repository and support its continued maintenance.

These credits recognize inspiration, community influence and open-source sharing, not a partnership, official authorization or code dependency. True GOAT's basketball rules, code and interface are independently implemented; no code or visual assets from the projects above were copied, and CS player data is not included in the basketball pools. The basketball data actually used and its licensing notices are documented separately in [THIRD_PARTY_NOTICES.txt](THIRD_PARTY_NOTICES.txt). Thank you to the creators and communities who built and shared these ideas first.

### Clear explanations and comfortable interaction

Each page has its own replayable animated introduction, keyboard support and reduced-motion behavior. Six themes include vivid dark palettes, a light cream palette and the classic forest theme. Themes synchronize across pages without changing scores or clue semantics.

The lab, directory and single-player game need no login. Models, custom rosters, themes and single-player progress remain browser-local and are not synchronized through accounts; online profiles, matches and ranked ratings live in Supabase. Registration currently uses email and password without verifying email ownership. Email password recovery is unavailable until a mail service is configured. Shared model URLs contain the selected settings and player IDs, but not guessing-game progress.

### Honest boundaries

- Data is a snapshot, not a live feed. Guessing-game regular-season, awards and verified playoff/Finals appearances reach 2025–26. The latter were supplemented on 2026-10-07 with actual participants in 2025 and 2026 games, excluding play-ins. Current rosters remain the 2026-10-04 snapshot, with CBA/European gaps. Older playoff statistics in GOAT ratings and the directory retain independent cutoffs.
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

对手含金量默认开启，可关闭比较并保存/分享设置。依据 1947–2024 逐场实际出场和同季常规赛数据，为 4,895 名球员建立对手背景。个人同季基础实力 B 使用得分、助攻、篮板和 TS% 的百分位，权重为 50%、20%、15%、15%；缺失子项折算，少量出场向中性收缩。R = 0.8B + 0.2×实际对手平均 R，迭代收敛；对手 Q 则等权结合得分百分位与 R 排名百分位。比赛内按对手实际分钟加权，缺分钟时等权。以同赛季常规赛对手均值为基准，常规赛/季后赛指数调整为 8×强度差÷50×覆盖率，限制在 ±8；最终指数限制在 0–100。

夺冠路径只使用该球员为已核实冠军球队实际参加的季后赛。每季冠军系数为 clip(1 + 0.5×路径强度差÷100×覆盖率, 0.75, 1.25)，团队指数调整为 clip(4×Σ(系数−1), −8, 8)。这些权重是可检查的模型约定，并非官方标准或个人夺冠贡献。缺少对手资料的联赛/赛季保留原分，不伪造直接防守对位；对手排名不随用户 GOAT 系数循环变化。对手调整会改变评论员原拟合结果，关闭可恢复基础评分。

Opponent context is enabled by default and can be disabled, saved and shared. It covers 4,895 players using recorded appearances in 1947–2024. Same-season performance percentiles form B, and the contraction R = 0.8B + 0.2×opponents' mean R gives stable contemporaneous rankings. Opponent quality combines scoring and R-rank percentiles. Actual opponent minutes weight each game, with equal weights when minutes are unavailable. Regular-season/playoff indices receive bounded, coverage-weighted adjustments relative to their own season's opposition baseline. Verified championship paths also adjust team-success indices. The visible formulas are modeling choices; missing leagues or seasons remain unadjusted. These are same-game opponents, not identified individual defenders. Turning context off restores the base scores and original commentator fit.

“定制数据”提供按球员找亮点和按条件查表现两条路线，结果主句使用自然篮球表述；比较范围、并列、证据和缺失说明仍保留。中文姓名采用已有审校映射；没有可靠译名时保留原文并提示，避免凭空音译。

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

三个页面的前端均在浏览器运行，不需自建服务器；账号与在线对战使用 Supabase 托管后端。静态输出支持 GitHub Pages 仓库子路径；只发布 `dist/`，不要上传整个工作区。现有 [Pages workflow](.github/workflows/pages.yml) 在推送 main 后测试、构建并部署。其他静态托管可以使用同一输出；此仓库不宣称已部署 Cloudflare。

All three frontends run in the browser without a self-managed server; accounts and online games use a managed Supabase backend. The static output supports GitHub Pages repository subpaths. Publish only `dist/`, not the workspace. The existing [Pages workflow](.github/workflows/pages.yml) tests, builds and deploys pushes to main. Other static hosts can use the same output; this repository does not claim a Cloudflare deployment exists.

### 在线后端 / Online backend

部署步骤与权限边界见 [Supabase 配置说明 / Supabase setup](docs/supabase-setup.md)。网页配置只使用项目 URL 和 Publishable key，不能放 Secret key、数据库密码或 service_role。数据库通过受控 RPC 校验用户、判定线索和结算积分；对局表启用参与者 RLS，答案与猜测保存在禁止客户端直读的私有 schema。WebSocket 更新带权限过滤，断线时轮询补充同步。

See [Supabase setup](docs/supabase-setup.md) for deployment and access boundaries. Frontend configuration contains only the project URL and publishable key, never secret keys, database passwords or service_role. Controlled RPCs validate players, judge clues and settle scores. Participant RLS protects matches; private schemas hide answers and guesses from direct client access. Authorized WebSocket updates have a polling fallback.

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
python scripts/20_refresh_guess_metrics.py
node scripts/23_build_global_player_index.mjs
python scripts/23_build_opponent_context.py
python scripts/32_build_dimension_audit.py
node scripts/38_build_player_name_data.mjs
# Add --refresh to refresh public 2025/2026 postseason box scores before rebuilding.
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
