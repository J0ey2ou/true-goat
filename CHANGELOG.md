# Changelog

## Website v0.13 — 2026-10-07

- 定制数据分为两个明确入口：「为球员找第一」选择球员、表现维度及第一类型；「为条件找球员」不需先选人，按定语或生涯荣誉反查全部已收录符合者，分页展示而非只保留前十。
- 新增仅此页面的三步动画演示，首次访问展示，可跳过、回退、重播；支持三语、手机布局和减少动态效果设置。
- 查询完成自动弹出完整自然语言结论，包含比较范围、所有条件、第一类型、证据和缺失说明；支持复制完整结论与来源。并列、未第一、空结果与单人样本分别表达，不把孤例包装成有竞争性的第一。
- 自动探索轮流覆盖所选表现维度，可选最早、最高及逐场连续类型；每次最多验证 128 组去重候选，展示全部已验证结果，可筛选有比较对象的第一。不声称穷尽无限定语；保留用户指定范围和筛选约束。
- 增加 NBA MVP、DPOY、FMVP 与已核实冠军球队赛季数筛选，使用截至 2025–26 的生涯快照，不表示当场或当年已经获奖；冠军球队赛季数不等于戒指名单。CBA 未开放荣誉条件，未知值不补零。
- 无数据库迁移，不更改既有账号、对战或球员数据；README 保持不变。

Customized Player now has two clear paths: find a player's firsts, or find all recorded players matching custom conditions. A replayable three-step animated tour explains the workflow. Results open as complete, evidence-backed claims with accurate ties, non-first outcomes and single-player caveats. Exploration checks up to 128 deduplicated combinations across selected dimensions and exposes every checked result, without claiming exhaustive coverage. NBA career-honors snapshot filters support MVP, DPOY, Finals MVP and verified champion-team seasons; missing is never zero. No database migration or README changes.

## Website v0.12 — 2026-10-07

- 新增「定制数据 / Customized Player」，四个 NBA/CBA 现役及历史已收录池；支持最早达成、最高表现、NBA 连续已收录出场，及年龄、效率、高阶指标、身高体重、院校、出生地、球队与同场对手条件。
- 以真实赛季和逐场事实计算，显示比较人数、未知排除数、并列与来源；不将孤例或覆盖不全包装成全史纪录。NBA 单场到 2023–24，赛季到 2025–26；CBA 为 2005–06 至 2023–24 全部赛段场均，缺失功能明确禁用。
- 自动搜索正向纪录；全员预探索生成 6,486 个有比较对象的分池候选与 405 个明确标记的单人样本，全部由查询引擎复算。NBA 历史有比较对象 4,794/5,105、另有单人样本 300；现役 484/620、单人样本 24。CBA 历史 1,067/1,487、单人样本 63；现役 141/328、单人样本 18。球员池有重合，不是去重人数；缺数据或尚未找到时明示，不保证人人第一。
- 四个页面右下角固定数据纠错入口，必填错误、建议更正和来源链接；生成 GitHub Issues 草稿，由用户登录并确认公开提交，不收集登录令牌。
- 猜球员在线人数通过 Realtime Presence 实时更新，按浏览器去重、含游客；显示估计而非匹配队列人数，断连不显示虚假零值。无需 SQL 升级。
- 新页面兼容三语与皮肤，按赛季加载压缩数据、后台线程计算，支持取消；修复静态打包保留二进制数据。

Customized Player explores earliest achievements, statistical leaders and recorded NBA appearance streaks across four NBA/CBA pools. Filters include performance, age, efficiency, advanced metrics, profile height/weight, college attended, birthplace and verified opposing-team appearances. Every claim states its snapshot scope, peers, ties, missing data and evidence. All 6,486 positive candidate claims with peers and 405 explicitly isolated one-player cases are independently reproduced; missing records are not invented. A fixed correction form on every page prepares a public GitHub Issue with a required evidence link. Live Presence estimates connected guessing browsers, deduplicates tabs and handles disconnects. No database migration is required.

## Website v0.11 — 2026-10-07

- 三个页面支持 English、简体中文与繁體中文。首次访问选择语言，右上角随时切换；当前浏览器记住选择，切换不重置模型、筛选或游戏进度。
- 翻译覆盖导航、页面导览、设置、账号对战、模型与得分图、球员档案、猜测反馈及结果弹窗。球员检索支持繁体姓名；保留来源中的专名，不臆造未核实译名；玩家昵称不参与翻译。
- 单人和在线猜测记录均按最新在前展示，保留原始提交顺序和分享记录。
- 新增小抄辅导，汇总自己已提交反馈中的数字上下界、精确集合、至少重合条件和已排除项；未知反馈不用于排除，不查询隐藏答案，也不读取对手猜测。
- 单人新增确认后放弃并揭晓答案。刷新保留已放弃状态；每日题不重置，下一局进入同范围练习。在线退出沿用原结算规则，答案只在整场结束后公开。
- 调整三语手机端导航布局。中文转换库随静态网站分发，不依赖外部翻译接口或 CDN；无需数据库升级。

All three pages now support English, Simplified Chinese and Traditional Chinese, with a first-visit language choice and a persistent top-right switch. Language changes preserve model and game state; Traditional Chinese searches work alongside existing aliases. Guesses appear newest first. A clue notebook combines only the player's revealed feedback into numeric bounds and set constraints, without consulting the hidden answer. Single players can give up, reveal the answer and continue in practice; forfeited daily rounds remain closed after reload. Online answers remain private until the match finishes. Mobile navigation has been adjusted for longer translated labels. No database migration is required.

## Website v0.10 — 2026-10-07

- 赛季/球队筛选、自选线索、账号/对战收进右上角设置抽屉，键盘和手机端均可使用；在线开局后回到主页面独立显示对局。
- 猜中或八次用完时用弹窗揭晓，可返回猜测记录或点击下一局刷新；保留池、范围和线索。每日题战绩不被清空，继续玩转入自由练习。
- 在线扩展为 2–5 人：天梯人数可多选，以共同人数交集匹配；好友房选择固定人数，凑齐后同时开局。默认 10 项线索、8 次机会、180 秒。
- 每位对手独立显示尝试次数和颜色进度，不公开猜测姓名；多人退出不立即终止其余人的游戏。
- 胜者与每位对手分摊 K=24 的 Elo，积分转移零和；无胜者时不改变积分，好友房不计分。在线结果同样使用弹窗，下一局刷新后重新匹配或创建好友房。
- 新增多人数据库升级 SQL，保留现有账号、积分、题库与旧 1v1 对局；未升级项目明确显示仅可两人，不假装已开放多人。
- 页面按实际 Supabase 注册设置开放入口；关闭邮箱确认属于项目管理设置，不由公开密钥修改。升级和注册设置完成后才能开放相应功能。

Settings move into a top-right drawer; completion dialogs reveal answers and offer a reload-based next game without erasing daily progress. Online rooms support 2–5 participants, multi-select ranked sizes, fixed friendly capacities, private per-opponent color progress and server-settled zero-sum Elo. The database upgrade preserves legacy games and accounts. Registration availability follows the actual Supabase configuration.

## Website v0.9 — 2026-10-07

- 增加 Supabase 账号、在线 1v1、好友房、对手颜色进度、Elo 天梯与排行榜；在线固定 10 项默认线索、8 次机会、180 秒。
- 服务端隐藏答案与猜测身份，验证池、限制重复猜测、处理超时及一次性积分结算；私有数据禁止客户端直读。
- 单人玩法增加可选线索开关，保留原默认组合，并提供冠军赛季、DPOY、场均助攻等共 18 项选择。
- 以逐场实际出场事实补齐猜球员 2025、2026 季后赛与总决赛赛季计数；名单快照、缺失指标和跨联赛口径继续单独说明。
- 球队弹窗仅展示完整已收录队名，移除逐赛季列表；更新双语说明、数据库权限与双浏览器对战测试。

Supabase-backed accounts and online games add friendly rooms, opponent color progress, server-settled Elo ratings and a ladder. Single-player clues are configurable, playoff appearances reach 2025–26, and team popups list names without season clutter. Browser-local preferences remain independent of accounts.

## Website v0.8 — 2026-10-04

- 猜球员与默认 300 人评级池分离：NBA/CBA 各提供现役、历史已收录、简单球星池，保留跨联赛池；跨联赛身份显式去重。
- 出题与搜索共同使用实际赛季/球队出场证据，当前注册不当作已出场；CBA 历史覆盖和国内现役注册范围明确标注。
- 排名实验室与球员库支持按需搜索、添加/移除扩展 NBA 球员，名单跨页同步并可随模型分享。
- 新增球员使用原 300 人固定参考标准，原分数不变；缺失维度保持未知，全缺失显示未评分。
- 双语 README 改为产品逻辑优先；补充七池、目录、子路径部署及数据覆盖测试。

The game now has seven source-scoped pools beyond the default 300. Both ranking and directory pages support a shared custom NBA roster, frozen-reference scores and explicit missing data. The bilingual README introduces the product before the calculations.

## Website v0.7 — 2026-10-04

- 可选高级加性模型、13 个统计/荣誉/协同模块、六个有出处的评论员起点。
- 点击分数查看雷达画像与实际加减分；六套跨页同步皮肤，按页面独立导览。

Optional advanced additive modules, six sourced commentator presets, score visualizations, themes and page-specific introductions.

## GOAT Model v0.2 — 2026-08-15

- 新增 MIT 许可的 Gonzalo Gigena 全历史数据集与 Brescou 常规赛文件；常规赛/季后赛共完成 8,898 条球员赛季级跨源核验。
- 从 1947–2024 逐场 box score 重建完整 BAA/NBA 季后赛：乔丹 179 场/119 胜、贾巴尔 237/154、詹姆斯 287/183，修复 v0.1 将局部覆盖误当生涯总计的问题。
- 四份有序榜单不再简单平均；按方法透明度、panel 规模和榜单范围配置可靠性权重，形成大众排名先验。NBA 50/75 继续保持“官方但未排序”，不伪造名次。
- 专家拟合改为非负约束 Ridge，使用 20×5 折重复 OOF 预测；消除 v0.1 中 Peak/Playoffs 因共线性出现负系数的解释性错误。
- 最终主排名改为来源先验与 OOF 模型证据的精度加权后验；无榜单先验的球员只使用模型证据，不因缺席榜单被记零。
- 敏感度、排名弹性和 Make Him GOAT 全部移到后验模型之后；新增留一来源、等权来源、单来源扰动、先验强度和 1,000 次来源权重不确定性分析。
- 基准后验：Michael Jordan #1、LeBron James #2、Kareem Abdul-Jabbar #3。该结果未设置球员名次约束；当先验总精度降至配置值的 50% 时 LeBron 回到 #1，作为明确方法边界保留。

## GOAT Model v0.1 — 2026-08-15

- 建立 Pool A（荣誉）、Pool B（表现/巅峰）、Pool C（历史认可/时代代表）与约 300 人主池。
- 建立跨赛季 z-score、Peak 1/3/5/7、有效巅峰年、有效高水平生涯等衍生指标。
- 引入 ESPN 2022、CBS 2017、HoopsHype 2021、Bleacher Report 2025 四份有序榜单。
- 建立透明人工权重、Ridge 专家拟合、纯数据三类模型。
- 建立单维权重敏感性、随机权重排名弹性和“最小改权成为 GOAT”的随机近似搜索。
- 2024–2026 逐球员季后赛明细仍为 NA；官方冠军和 Finals MVP 已补齐。
- 修复姓名身份解析：保留 `Jr./II/III` 后缀，并对同名球员只把官方荣誉/外部榜单映射到生涯规模最大的唯一球员 ID；因此 Gary Payton II、Patrick Ewing Jr. 等不再错误继承父辈记录。
