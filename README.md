# True GOAT / 真正的山羊 — 模块化排名实验台与猜球员 v0.7

> Facts are data. Greatness is a weighting problem.

## 本地运行

在本项目目录运行 `node app/server.mjs`，打开 http://127.0.0.1:8765 。也可双击 `app/start.cmd`。服务只监听本机，不公开原始数据目录。

## 静态网站与 GitHub Pages

本应用没有线上后端要求，三页的评分、检索与游戏均在浏览器计算。运行 `node scripts/16_build_static_site.mjs` 生成 `dist/`：首页 `index.html`、球员库 `players.html`、猜球员 `guess.html`。构建器只复制明确白名单中的资源和4份必要展示数据，并改写站内地址，支持 GitHub Pages 的仓库子路径。不要直接上传原始 `app/` 目录或整个本地工作区作为网站。

仓库的 `.github/workflows/pages.yml` 会在 `main` 更新时测试、构建并发布 `dist/`。首次需在 GitHub 仓库 `Settings → Pages → Build and deployment → Source` 选择 `GitHub Actions`。部署成功后，以 Actions 返回的实际网址为准；本文不预先声明网站已经上线。

`.gitignore` 使用发布白名单：保留源码、配置、测试及必要展示快照，排除原始下载、文章全文缓存、`node_modules`、Excel/PDF输出、截图、密钥和环境文件。数据更新脚本需要另外按来源说明取得原始快照；公开仓库本身不包含这些大体积输入。数据出处与第三方许可见 `THIRD_PARTY_NOTICES.txt`，不将所有混合数据或原创代码擅自声明为 MIT。

单元测试与静态构建不需安装 npm 依赖。浏览器测试另在 `app/` 执行 `npm install`；Windows默认使用已安装的Edge，其他系统可先 `npx playwright install chromium`。可通过 `GOAT_PLAYWRIGHT_MODULE`、`GOAT_BROWSER_EXECUTABLE` 指定本机运行时，不提交个人电脑路径。

## 新手导览

三个页面各自只展示对应的动画：实验室讲加性评分，球员库讲档案，猜球员页讲玩法。每页都保留「动画导览」重看入口和当前页面的操作引导，带用户定位到真实控件。示意动画不是球员真实评分，不修改系数、筛选或游戏进度。

关闭、跳过或完成后，分别在 `true-goat-onboarding-v2:lab`、`:directory`、`:guess` 记录已看状态，不上传行为记录。旧 v1 全站标记不会抑制新版按页导览。带 `#model` 或 `?player` 的分享链接不自动弹出导览；尊重系统减少动态效果设置，支持键盘与手机。浏览器禁止存储时仍可正常关闭和使用网站，但下次访问可能再次显示。

引导验收：`npm run test:onboarding`（在 `app/` 目录、先启动测试服务）；现有功能测试以已看过引导的用户为基准，独立引导测试覆盖首次访问。

账号注册尚未接入：GitHub Pages 仅托管静态网页，不能安全地充当账号数据库。真正注册需要另行配置云端认证服务；不会以本机昵称或本地密码存储伪装成在线账号。评分、球员库和游戏仍无需登录。

## 独立加性模型

公式：`S = 50 + Σ β[k] × (X[k]−50)/10 + γ × (P−50)/10`。例如巅峰指数80、系数2，贡献为 +6 分。各系数独立取值0–10，没有合计100%的约束；固定截距50不影响排名。分数不是百分制，可超过100或低于0。

- 六个公开历史观点拟合起点：Stephen A. Smith（2023）、Kendrick Perkins（2021）、Skip Bayless（2026）、Nick Wright（2022）、Chris Broussard（2022）、Shannon Sharpe（2022）。后面三位来自 FOX 节目语境，不冒充 ESPN 评论员或当前最新意见。Nick 的样本仅为“近 50 年榜单”前五；界面保留范围、原始出处、转录核实方式和拟合误差。
- 改变一个系数不会挤压其他项。排名、建议、有限搜索、模型解释、分享和导出使用同一公式。
- 模型弹窗展示完整公式、各维度中心化数值和逐项加分/扣分。显示数字舍入，排序按完整精度；并列明确标示。
- 大众榜单P作为独立加性项，不再是百分比混合，也不是重新估计的贝叶斯后验。

重建预设：`python scripts/13_build_expert_presets.py`。原排序配置为 `config/espn_expert_rankings.json`。采用短榜内成对约束、0.75分目标间隔、0.1倍系数正则和九个确定性起点；取消系数总和约束。未入榜不自动判为输家。样本内一致率不是置信度或样本外评测。

缺失项以中性基准50填补（中心化贡献0），不再放大其他项；这是明确的假设，不是观测事实。所有启用项均无数据时显示未评分；全部系数为0时所有人并列50分。旧v0.3设置保留并迁移：完整数据且有先验时等价，缺失情况下结果可能改变。

## 可选高级模式：模块定义先于评分

基础模式保留原有七维算法。高级模式可以移除基础维度、添加独立模块并调整各自系数：常规赛场均得分/助攻/篮板、真实命中率、季后赛场均得分、MVP/FMVP/DPOY/最佳阵容/冠军次数、透明荣誉积分，以及巅峰×季后赛、常规赛×防守两项协同。所有贡献直接相加，不是百分比。

每个模块在 `app/modules.mjs` 封装定义、原始字段、单位、基准/步长、计算公式、来源与截止、缺失处理、重叠提示。固定基准和荣誉配方属于产品约定，不是官方标准或拟合真理；荣誉设立年代、球队成就非个人因果、TS 未时代校正等限制应结合定义阅读。组合项只使用双方高于基准的非负部分，避免负负得正。缺失中性贡献不等于真实统计为零。

点击领奖台、排行榜或目标球员的得分，可以打开固定七维雷达图与当前模型的正负贡献图、数值表。雷达图不是得分占比，缺失项不画成零；高级模式下的排行榜、解释、分享与 JSON 导出使用相同模型。高级模式不运行仅适用于基础七维的自动系数搜索。

## 全站皮肤

顶部「皮肤」可即时切换极光赛场、日落球场、碧海之上、玫瑰霓虹、奶油晴空和经典森林六套配色。默认使用紫蓝极光；浅色与深色方案覆盖三个页面、评分图表与弹窗，猜球员的反馈颜色语义保持不变。

偏好只保存在当前浏览器的 `true-goat-theme:v1`，跨页、刷新和同源多标签同步；不修改模型、筛选或游戏进度。浏览器限制存储时仍可在当前页预览。验收：`npm run test:themes`。

## 两两球员数据：可行性边界

本次已审计原有逐场缓存，尚未把交锋加入评分。现有 `schedule.csv` 与年度 `boxscores_by_year` 覆盖 1946–47 至 2023–24，可通过比赛 ID、球员 ID、不同球队、实际出场状态联结“同场对手交锋”，区分常规赛/季后赛并显示场次与年份。早期篮板、助攻、分钟等覆盖不完整，抢断/盖帽更晚才有，不可将缺失当零。

现有字段没有逐回合防守者、匹配回合或实际防守对位关系，因此不能声称某球员的得分都是在另一人防守下取得。下一步若实现，应命名为“同场交锋”，构建精简且按需加载的索引，展示小样本与覆盖范围；原始约 657 MB 文件不直接发布，也不把交锋胜负当成因果评级。本版不提供虚构的“直接对位分”。

## 球员库

打开 `/players` 查看300人背景与入选情况。三池A203/B219/C162重叠去重并集为300，不是先指定好的历史前300名。支持中英文/球队检索、位置/年代/池筛选、25人分页和详情。

背景包含300人的生日、身高体重、真实首赛日期、赛季范围与球队记录；271人院校、281人选秀、298人季后赛资料。附原始生涯统计、荣誉、逐项入选原因、缺失与部分覆盖说明、来源。国家资料未确认则保留缺失，不猜测。

重建：`python scripts/14_build_player_directory.py`。使用既有原始履历和多源缓存，不修改原数据。快照标记2026-08-15；常规赛至2025–26、完整季后赛至2023–24。身高体重为档案值，快照生涯状态不代表当前退役核实。

## 验证

在 `app` 目录运行 `npm test` 检查评分、猜球员、检索和真实题库数据；`npm run test:server` 检查服务（需先启动服务）。三个构建脚本均支持 `--self-test`。

浏览器验收：`node app/tests/browser-smoke.mjs` 和 `node app/tests/player-directory-smoke.mjs`，使用已安装的Playwright与Edge；不额外下载浏览器。主界面检查360/390/768/1024/1440宽度的溢出、卡片分数基线和表格列边界。

## 猜球员（单人）

打开 `/guess`。参考[弗一把](https://shnlfriberg.online/)的8次猜测与逐属性反馈机制；篮球规则独立实现，没有复制原作代码或视觉素材，也不声称完整复刻。

- 每日挑战：北京时间00:00更新，同一题库版本、同日同池同范围的答案固定；不同年份/球队组合的进度分别保存在本机。
- 自由练习：可换新目标，八次机会；猜中本人获胜，属性全绿不能替代身份判断。重复或无效猜测不消耗次数。
- 姓名词典覆盖当前347人：中文名、英文名、常见绰号与CBA英文拼音。输入“哈登”“大胡子”“James Harden”或“jame harden”均可匹配；大小写、空格、重音与分隔标点统一处理。中文不做模糊猜字，英文长词允许有限拼写容错；同姓/同绰号可保留多位候选，不视为同一个人。词典在 `config/player-aliases.json`，人工音译不声称是官方唯一译名。
- 题目范围限制赛季结束年与球队，例如2020代表2019–20；点击「应用范围」后，答案与搜索候选同时被限制。年份和球队必须命中同一条实际出场证据，不可拼接球员不同年代的球队经历，不插补退役空档。NBA/CBA/全球池分别给出对应联赛已核实球队，全球为所收录联赛并集。范围修改未应用时暂停猜测；其他范围进度保留，切回可恢复。零候选时明确无题，不自动放宽范围；练习换题同样受约束。
- 十项线索分两组：基本资料（效力球队、位置、出生年、身高、首次出场年）；生涯指标（效力球队数、季后赛次数、总决赛次数、生涯常规赛场均得分、常规赛MVP次数）。手机分行排列。数字箭头指向答案更大/更小；缺失或口径不同提示未知。
- 球队数按NBA/BAA实际效力的球队沿革去重，同队改名、迁址和回归不增加；季后赛/总决赛次数按球员实际出场赛季计，总决赛排除DNP、仅名单成员和分区决赛；PPG为常规赛总得分除以出场数，保留一位小数；MVP不含FMVP或其他联赛奖项。
- 新增五项指标已覆盖300位NBA候选。常规赛、球队数、MVP截至2025–26；季后赛/总决赛截至2023–24，不冒充实时全生涯。同一指标只有统计口径和截止期一致才比较。球队/季后赛/总决赛/MVP相差1以内为接近，场均得分相差2.0以内为接近；相等为一致。
- 池规模：NBA历史精选300；CBA精选30；全球男子精选347（去重并集，另含18位EuroLeague球员）。CBA/国际球员仅用于游戏，不加入NBA GOAT评分。
- NBA档案沿用2026-08-15快照；身份资料包含CBA29份新浪公开档案（非官方）加姚明及EuroLeague两队登记表。v1.2新增338人的4,397条实际出场证据：NBA300人用正出场数的赛季球队行；CBA29人用历史比赛场次表、姚明另核实2002上海；欧洲9人使用官方明确日期的比赛表现，另外9人因未核实而不参与限定题目。登记名单、档案页当前年份不算出场证据，不代表实时完整覆盖。
- 首次出场年份用可核实的NBA/BAA实际日期；13位ABA首秀不可与NBA首秀混同，已标未知。球队履历不完整时不会把无交集武断判错。
- 战绩可复制不含答案的色块；答案仍可从客户端查看，因此这不是防作弊竞技服务。按用户选择暂不实现对战。

生成数据：`python scripts/15_build_guess_players.py`，默认只使用离线数据；`--self-test`检查字段、唯一性、跨池、来源、球队沿革、历年总决赛覆盖与基准球员。实际出场补充证据在 `config/guess-appearance-evidence.json`。共享搜索模块为 `app/player-search.mjs`。题库1.2配合游戏 schema 2，使用 `true-goat-guess:v2:<版本>:<模式>:<池>:<规范化范围>` 隔离进度；旧版进度不删除、不误恢复。额外验收 `npm run test:filters` 检查真实答案而不只是搜索候选。

## 历史 v0.2 数据与离线管道


This repository contains a 300-player NBA historical pool, multi-source fact reconciliation, a source-weighted public-ranking prior, three alternative score views, an empirical-Bayes-style posterior, post-posterior sensitivity analysis and a Web-ready JSON payload.

## Reproduce

```powershell
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

Raw downloads are immutable caches with atomic `.part` writes. New full-history boxes are frozen under `data/raw/kaggle_nba_all_time/`; cross-source differences are kept in diagnostics.

## Main outputs

- `outputs/01a00459-396c-7300-99ff-9d81d32d3b8e/` — final Excel workbooks.
- `docs/` — candidate, indicator, source, completeness, overlap, model and results reports.
- `data/processed/goat_model_v0_2_web.json` — Web-product payload.
- `output/diagnostics/` — source reconciliation, hashes, CV, bootstrap, source sensitivity and validation.

## Result and caveat

The configured posterior ranks Michael Jordan #1, LeBron James #2 and Kareem Abdul-Jabbar #3. The transparent Human and Pure Data views remain separate. This is a reproducible value model, not proof that one GOAT definition is uniquely correct.
