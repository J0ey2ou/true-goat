export const CUSTOM_ENGLISH=Object.freeze(Object.fromEntries(`
定制数据|Customized Player
得分|Points
篮板|Rebounds
助攻|Assists
抢断|Steals
盖帽|Blocks
查看并验证预探索纪录|Load and verify a discovered record
尚未找到非孤例的正向第一；可继续自由探索。|No non-isolated positive first found yet; keep exploring.
当前统计快照缺少该球员的可用表现，不生成虚构第一。|This snapshot has no usable performance data for this player; no first is invented.
预探索覆盖|Discovery coverage
仅单人样本|One-player comparisons only
有表现数据|With performance data
已找到正向候选纪录|Positive record candidates found
预探索会使用更多档案组合，载入后按相同引擎重新验证；不是全史认证。|Precomputed exploration uses more profile combinations. Loaded claims are rechecked by the same engine, not certified as all-time records.
定语够多，|Enough qualifiers,
人人都能第一|a first for everyone
选择球员，组合条件，检验一句“第一”究竟有多少含金量。|Pick a player, combine qualifiers, and see what a claim of “first” really means.
01 · 选球员|01 · Pick a player
02 · 加定语|02 · Add qualifiers
03 · 看证据|03 · Check the evidence
为谁寻找第一？|Who deserves a first?
比较球员池|Comparison pool
所有 NBA · 已收录|All recorded NBA players
所有 CBA · 已收录|All recorded CBA players
现役 NBA|Active NBA
现役 CBA|Active CBA
搜索球员|Find a player
姓名 / 中文名 / 绰号|Name / Chinese name / nickname
统计单位|Statistical unit
赛季场均|Season averages
单场 / 连续出场|Games / appearance streaks
第一的定义|Definition of first
最早达成|Earliest achievement
数值最高|Highest value
最长连续达成|Longest qualifying streak
赛季结束年 · 从|Season end year · From
赛段|Season phase
全部赛段|All phases
比较指标|Ranking metric
表现与身体条件|Performance & physical qualifiers
所有条件同时满足；空值不是零。|Every condition must hold; missing is not zero.
＋ 添加数值定语|+ Add a numeric qualifier
更多话题定语 · 身份与对手|More qualifiers · Background & opponents
就读院校|College attended
出生地|Birthplace
对手球队|Opponent team
对手球员（同场出战）|Opponent player (same game, opposite team)
搜索对手；空白表示不限|Search opponent; leave blank for any
验证这句第一 →|Test this claim →
✦ 一键找定语|✦ Find my qualifiers
取消计算|Cancel
先看比较范围，再看第一|Check the scope before the record
现役指阵容快照中的球员，不代表其他时代的球员不曾达成。所有结论只针对已收录数据，不等于全史认证。|Active means the roster snapshot, not that past players never achieved it. All claims are limited to recorded data, not certified all-time history.
先有证据，再有标题。|Evidence before headlines.
左侧设置条件，验证自己的说法；或让系统探索正向表现的组合。|Set your conditions to test a claim, or explore combinations of positive performances.
统计口径、算法与数据来源|Definitions, methodology & sources
最早达成按比赛日期或赛季结束年排序，同日或同赛季并列；不是某一指标数值最大。|Earliest means game date or season end year. Same-day or same-season achievements tie; this is not the highest statistical value.
连续指同一赛季、同一赛段内连续的已收录个人出场。未达标或未知会中断；不跳过不符合对手条件的场次；不跨赛季拼接。|Streaks count consecutive recorded appearances within one season and phase. Failures and missing values break the streak, as do games against non-qualifying opponents. Seasons are never joined.
NBA 赛季年龄沿用来源口径，通常为赛季中 2 月 1 日年龄；单场为比赛日周岁。CBA 缺少可靠赛季年龄，不开放该条件。|NBA season age follows the source, generally age on February 1. Game age is completed years on game day. Reliable CBA season ages are unavailable, so that filter is disabled.
身高、体重是档案快照，不是每场实测。院校代表就读而非毕业；出生地使用 Wikidata 明确身份匹配，未知不补齐。|Height and weight are profile snapshots, not game-day measurements. College means attended, not graduated. Birthplaces use exact Wikidata identity matches; missing values stay unknown.
转队赛季采用合计行；指定球队会排除无法将合计表现归到单队的赛季。CBA 使用来源的全部赛段场均，不能当作纯常规赛。|Traded seasons use combined totals; team filters exclude seasons that cannot be attributed to one team. CBA averages include all phases as reported, not regular season only.
命中率使用百分数；TS% = 100 × 得分 ÷ [2 × (出手 + 0.44 × 罚球出手)]。BPM、PER、USG 使用来源值，Game Score 按完整单场技术统计计算；缺字段不补零。|Percentages use a 0–100 scale. TS% = 100 × PTS / [2 × (FGA + 0.44 × FTA)]. BPM, PER and USG use source values. Game Score requires complete box-score inputs; missing is never zero.
自动探索优先正向表现，只在预设年龄档、5 cm / 5 kg 档及已知身份条件中寻找，最多验证 128 组；未找到不等于不存在。条件越多不代表成就越伟大。|Auto exploration prioritizes positive performance within preset age bands, 5 cm / 5 kg bands and known background groups, testing up to 128 combinations. No result does not prove impossibility. More qualifiers do not mean greater achievement.
仅剩本人时标记孤例；未知项排除会缩小样本。单人样本不能当成具有竞争性的第一；未找到或缺资料时明确标注。|A one-player comparison is labeled an isolated case, not a competitive first. Missing data reduce the sample. Unavailable and undiscovered claims are explicitly marked.
CBA：已收录 2005–06 至 2023–24 的全部赛段场均。逐场、年龄与高阶数据暂缺；不伪造连续纪录。|CBA: recorded season averages, all phases, 2005–06 to 2023–24. Game logs, ages and advanced metrics are unavailable; no streaks are invented.
NBA 逐场：1946–47 至 2023–24；按选定年份下载。早期资料和高阶字段存在缺失，连续纪录只针对已收录出场。|NBA games: 1946–47 to 2023–24, downloaded by selected year. Early and advanced data have gaps; streaks refer only to recorded appearances.
NBA 赛季：1946–47 至 2025–26 常规赛场均。转队用合计行，不重复统计。|NBA seasons: 1946–47 to 2025–26 regular-season averages. Traded seasons use one combined row, without double counting.
院校未知|College unknown
出生地未知|Birthplace unknown
定语指标|Qualifier metric
比较符号|Comparison operator
定语阈值|Qualifier threshold
移除定语|Remove qualifier
三分命中|Three-pointers made
出场分钟|Minutes
投篮命中率 %|Field goal %
真实命中率 TS%|True shooting %
有效命中率 eFG%|Effective field goal %
使用率 USG%|Usage %
新浪效率值|Sina efficiency
赛季出场数|Season appearances
档案身高 cm|Profile height (cm)
档案体重 kg|Profile weight (kg)
年龄|Age
没有符合条件的已知记录|No known qualifying record
孤例：条件下只剩一位可比较球员|Isolated case: only one comparable player remains
已收录范围内 · 并列第一|Tied first within recorded scope
已收录范围内 · 第一|First within recorded scope
未成为第一|Not first under these conditions
次连续出场|consecutive appearances
条件内比较球员|Comparable players
达成表现球员|Qualifying players
缺字段而排除的记录|Records excluded for missing fields
仅代表所选池和数据覆盖范围；筛选和缺失可能制造“第一”。|Applies only to this pool and snapshot. Filters and missing data can manufacture a “first”.
目标球员证据|Player evidence
转队合计|Combined traded season
核查数据来源 ↗|Verify source ↗
比较球员|Compared player
证据时间|Evidence date
目标名次|Player rank
同值人数|Players tied
条已收录记录|recorded appearances
复制带限定的结论|Copy claim with its qualifiers
请检查年份和定语；最早达成或连续纪录需要至少一个表现阈值。|Check the years and qualifiers. Earliest and streak claims require a performance threshold.
正在按条件核验；不会查询或编造缺失数据…|Checking the recorded data against your conditions…
正在读取赛季|Loading season
已验证条件组合|Combinations tested
计算失败，请缩小范围或重试。|Calculation failed. Narrow the scope or retry.
已取消计算|Calculation cancelled
赛季记录|season records
数据暂未载入，请刷新重试。|Data could not load. Please refresh to retry.
⚑ 上报数据错误|⚑ Report data error
关闭纠错窗口|Close correction form
帮助修正数据|Help correct the data
反馈将公开发布到 GitHub Issues，需登录 GitHub 并确认提交。不要填写邮箱、密码或其他私人信息。|Reports are public GitHub Issues. Sign in to GitHub and confirm submission there. Do not include email addresses, passwords or other private information.
球员 / 数据字段|Player / Data field
目前错误的数据|Current incorrect value
建议的正确数据|Suggested correct value
正确数据的依据链接|Link to supporting evidence
前往 GitHub 确认提交 ↗|Review and submit on GitHub ↗
打开 GitHub 纠错草稿 ↗|Open GitHub issue draft ↗
草稿已准备；请在 GitHub 点击提交。此处尚未上传成功。|Draft ready. Click Submit on GitHub to send it; it has not been submitted yet.
请填写完整内容，并提供有效的 http / https 来源链接。|Complete every field and provide a valid http / https source URL.
在线人数：连接中…|Online count: connecting…
猜球员页面在线浏览器去重估计，含游客；不是匹配队列人数。|Estimated connected browsers on Guess the Player, including guests; not the matchmaking queue.
在线人数暂不可用|Online count unavailable
实时在线约|Online now, approximately
人|people
`.trim().split('\n').map(line=>{const i=line.indexOf('|');return [line.slice(0,i),line.slice(i+1)];})));
