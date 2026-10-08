// Reviewed UI phrases; longest matches win so composed labels keep their meaning.
// Source data, entered nicknames and IDs remain unchanged.
export const ENGLISH = Object.fromEntries(`
年份和球队必须命中同一条实际出场证据。阵容、注册名单、优先续约权和档案页年份都不作为已出场证明。|Years and teams must match the same appearance record. Rosters, registrations, renewal rights and profile-page years do not prove an appearance.
仅核实已收录实际比赛证据；现役新人、早期或国际缺失记录可能无法进入限定题目。|Only recorded game appearances qualify. Rookies and players with incomplete early or international records may not qualify for filtered rounds.
历史池是数据快照内全部NBA/BAA常规赛正出场球员；不含ABA-only、季前赛-only或尚未出场新人。当前名单独立核实，不由末次出场年份推断。|The historical pool contains recorded NBA/BAA regular-season players, excluding ABA-only, preseason-only and unplayed rookies. Active rosters are verified independently, not inferred from a final appearance year.
跨联赛身份线索不足或档案有冲突，保留独立来源身份，未作为已验证映射。|Insufficient or conflicting cross-league identity evidence. Source identities remain separate, without a verified merge.
仅合并逐人核实的跨联赛身份；剩余候选因资料缺失或冲突暂保留，不承诺全部跨联赛身份彻底去重。未经核验的候选英文身份不公开为事实。|Only individually verified cross-league identities are merged. Missing or conflicting records remain separate; complete deduplication is not claimed. Unverified English identity candidates are not presented as fact.
不是已完成的普通注册记录|Not a completed standard registration
新浪公开统计为非官方事实资料，仅保存姓名、必要背景字段、赛季球队正出场数；不保存整篇文章、原网页或照片。|Sina’s public statistics are unofficial factual sources. Only names, necessary background and season/team appearance counts are retained, not full articles, pages or photos.
Basketball-Reference 派生公开数据；原始档案与队伍赛季表，非实时。|Public Basketball-Reference-derived profile and team-season data; not live.
用于确认姚明的历史 CBA 上海球队记录。|Confirms Yao Ming’s historical CBA record with Shanghai.
实际出场赛季、球队、总得分与总场次截至|Actual seasons, teams, points and games through 
同赛季转队合计只算一次。|Multi-team season totals are counted once.
按队伍代码、赛季区间归属 Current Abbr；新快照中沿用同代码且同全名才延展。不合并 ABA。|Maps team codes and season ranges to Current Abbr. New snapshots extend only matching codes and full names. ABA is excluded.
非官方资料；页面标注赛季|Unofficial source; page season label 
球队可能是历史记录，不当作实时名单。|team information may be historical, not a live roster.
新浪CBA档案：|Sina CBA profile: 
新浪CBA历史出场表：|Sina CBA historical appearances: 
新浪CBA赛季出场表：|Sina CBA season appearances: 
NBA/BAA 全历史球员档案|NBA/BAA historical player profiles
NBA.com 官方当前联盟名单|NBA.com official current league roster
公开统计表全部赛段；仅取正出场数、同一行球队和赛季。空表不代表该赛季无人出场。|Public tables across all stages; only positive appearances with team and season in the same row are used. Empty tables do not prove no appearances.
身高、出生年、位置为档案事实；只取历史表正出场数，不使用页头赛季推断现役。缺失资料保留未知。|Height, birth year and position are recorded facts. Only positive historical appearances qualify; header seasons do not establish active status. Missing data stays unknown.
逐名人工审查译名候选，公开新浪档案完整出生日期与精确NBA全名的出生日期一致；不是同姓模糊匹配。|Transliterated identity candidates were individually reviewed. The complete date of birth in the public Sina profile matches the exact NBA identity; this is not surname-based fuzzy matching.
跨联赛身份经过显式核对：|Cross-league identity explicitly verified: 
姓名和完整出生日期一致。|Full name and complete date of birth match.
只计入完成比赛中实际出场者；不含附加赛。|Only actual participants in completed games; play-ins excluded.
冠军赛季数沿用已核实原档案；不表示戒指授予或季后赛实际出场。|Championship seasons follow verified original profiles, not ring recipients or proof of playoff appearances.
NBA/BAA实赛快照；非实时球队；未知不推断。|NBA/BAA appearance snapshot, not live teams. Unknown facts are not inferred.
实赛franchise数，改名不重复。|Distinct franchises with appearances; renames counted once.
总得分/总场次，转队不重复。|Total points / total games, without duplicating traded seasons.
官方常规赛MVP；不含FMVP。|Official regular-season MVP awards; excludes Finals MVP.
只使用同一行的赛季、球队和正出场数/明确比赛表现。注册或阵容名单不算出场；跨联赛历史覆盖可能不完整。|Uses season, team and positive appearances or explicit game performance from the same record. Registrations and rosters do not count as appearances; cross-league history may be incomplete.
实际常规赛出场赛季的结束年；如|Season end year of an actual regular-season appearance; e.g. 
代表|represents 
生涯中断年份不自动补齐。|Career gaps are not automatically filled.
官网当日名单，可能包括训练营/双向合同或未出场新人；不是实际出场证据。|Dated official roster, potentially including camp, two-way or unplayed rookies; not appearance evidence.
历史池仅代表全部已收录、具有正出场证据的球员，不宣称全史完整。|Historical pool covers all recorded players with positive appearance evidence, not a claim of complete league history.
现役以|Active status uses the 
官方国内注册快照为准，不含尚未核实的外援；注册不等于已在该赛季出场。|official domestic-registration snapshot, excluding unverified foreign players. Registration does not prove an appearance that season.
不以最早存档赛季冒充职业首秀；CBA生涯指标无完整同口径核验时保留未知。|The earliest archived season is not assumed to be a career debut. CBA career metrics stay unknown without complete comparable verification.
身高体重为来源档案记录值（in/lb 转 cm/kg），不是实时测量。快照 active/retired 为按末个记录赛季生成的状态，不代表已核实当前在役/退役。|Height and weight are recorded source values converted from in/lb to cm/kg, not live measurements. Snapshot active/retired labels derive from the last recorded season, not verified current status.
早期部分统计未记录：累计只计有值赛季，场均以该项有记录赛季的出场数为分母；缺失不是 0。|Some early statistics were not recorded. Totals and averages use only seasons and games with recorded values. Missing is not zero.
常规赛与季后赛快照不同步；季后赛未更新至该球员末个常规赛记录年。|Regular-season and playoff snapshots differ; playoffs do not extend to the player’s last regular-season record.
学校字段未收录；不能据此推断未上大学。|College is unrecorded; this does not imply the player did not attend college.
原始首赛日期早于 NBA/BAA 首个赛季，可能为 ABA 首秀；不可当作 NBA 首秀日期。NBA/BAA 年代范围以本页赛季记录为准。|The source debut date predates the first NBA/BAA season and may refer to an ABA debut. It is not treated as an NBA debut. NBA/BAA coverage follows the season records here.
NBA/BAA 选秀表未匹配；不能据此推断为落选秀。|No match in the NBA/BAA draft table; this does not establish undrafted status.
项目配置明确列入的讨论案例；不是统计门槛或额外加分|Explicitly configured discussion case, not a statistical threshold or bonus points
选秀来源有多条记录，展示首条并在 draftRecords 中保留全部。|Multiple draft records: the first is displayed and all are retained in draftRecords.
未收录季后赛数据；这不等于已确认季后赛出场为 0。|Playoff data is unavailable; this does not establish zero playoff appearances.
入选NBA|Selected to NBA 
周年官方名单|official anniversary team
此人为Shavlik Randolph，不是Zach Randolph或Randolph Morris。|This is Shavlik Randolph, not Zach Randolph or Randolph Morris.
使用|Uses 
人的|players’ 
项已知成对顺序，模型复现|known pairwise orders; the model reproduces 
项。这是样本内一致情况，不是置信度；短榜内的成对约束并不独立。|orders. This is in-sample agreement, not confidence. Pairwise constraints within a short ranking are not independent.
在 0–10 内独立拟合，没有总和约束。目标是减小已知排序的间隔误差，并通过正则项避免系数无意义放大。固定截距无法由排序数据识别，所以约定为 50。未入榜者不被当作输家，也不强制某位球员第一。|is fitted independently within 0–10, without a sum constraint. The objective reduces ranking-margin errors while regularization discourages needless coefficient growth. The intercept cannot be identified from order alone, so it is fixed at 50. Unlisted players are not treated as losers, and no player is forced into first place.
拟合使用现有数据近似历史观点，不是历史时点回测，不代表任何媒体或评论员本人的真实公式。高级模式新增的模块也不属于这次基础拟合。|Current data approximates historical opinions; this is not a historical backtest or any analyst’s actual formula. Advanced-mode additions are outside this base fit.
逐名转录|player-by-player transcript
同期榜单转述|contemporary ranking report
完整前十与嵌入原帖|full Top 10 and embedded original post
同期前三名核对|contemporary top-three cross-check
一次性回访节目公告|one-off return episode announcement
完整榜单转录|full ranking transcript
年近 50 年榜单第 1 名揭晓|: No. 1 reveal in the last-50-years ranking
的 2022 年历史前十|’s 2022 all-time Top 10
与历史前十讨论|and the all-time Top 10 discussion
原始节目页面|original episode page
同期前十完整转录|contemporary full Top 10 transcript
距离上一位|Gap to the next player, 
还差|: 
提升|Move up 
你选择了|You selected 
个实际计分项。所有模块的贡献独立相加；基准与步长固定，不做百分比归一，不保证某位球员第一。|active scoring terms. Contributions add independently with fixed baselines and scales, without percentage normalization or a guaranteed winner.
基础评论员预设仅拟合七维系数，没有拟合这些新增模块。现在是你的自定义评价规则，不是评论员本人的完整公式；“较起点”依然对比基础预设。|Analyst presets fit only the seven base coefficients, not these added modules. This is your custom evaluation rule. “Change” still compares against the base preset.
原始场均统计未做时代校正。奖项设立年份不同，荣誉为 0 不代表该球员曾有同样的竞争机会。缺失项贡献为 0，不重新分配其他项；所有启用项都缺失时不评分。协同项只采用高于基准的正部乘积，低于基准不会“负负得正”。|Raw averages are not era-adjusted. Award opportunities vary by introduction date. Missing terms contribute zero without rescaling others; all enabled inputs missing means unscored. Interactions multiply only positive excess above baseline, avoiding a positive product from two negative inputs.
默认 300 人与七维指数沿用 v0.2，采集标记为|The default 300 players and seven indices come from v0.2, collected on 
现在可从扩展目录添加球员；新增球员使用固定的原 300 人参考标准，不会改变原有球员分数。|Additional players use the fixed original 300-player reference scale, without changing existing scores.
打开球员库|Open Player Library
每项使用 z=(指数−50)/10，独立系数乘以 z 后逐项相加。固定起点为 50；不是百分比分配，也不是百分制。|Each term uses z=(index−50)/10, multiplied by an independent coefficient and added to a fixed 50-point baseline. This is not percentage allocation or a 100-point scale.
缺失维度贡献为 0，不放大其他项；全部启用项缺失则未评分。这是明确的处理约定，不消除时代或覆盖偏差。|Missing dimensions contribute zero without enlarging other terms. If all enabled inputs are missing, the player is unscored. This convention does not eliminate era or coverage bias.
大众排名是独立加性项。未入榜贡献中性，不把数据分冒充公众先验。|Consensus rankings form an independent additive term. Unlisted players contribute neutrally; statistical scores are not substituted for consensus evidence.
高级模式可自行选择统计、荣誉与协同模块；内部定义固定可查，系数由用户决定。评论员预设只拟合基础七维，不代表本人公布的真实公式。|Advanced mode offers statistics, awards and interactions with inspectable fixed definitions and user-selected coefficients. Analyst presets fit only the base seven dimensions, not analysts’ published formulas.
单杆建议测试|Single-slider suggestions test 
系数；联合搜索只检验有限候选，不能证明全局最优。放大系数会扩大分差，不等于提高预测信心。|coefficient changes. Joint search examines finite candidates, not a proven global optimum. Larger gaps from larger coefficients do not imply greater predictive confidence.
默认名单的完整季后赛逐场基础数据覆盖至 2024；新增历史球员当前仅扩展六个基础维度，季后赛指数保持未知。其他字段以各来源截止期为准，当前阵容不是实际出场证据。早期防守和高级统计存在缺失；荣誉与冠军等模块可能重复强调同一信息。|The default sample’s full playoff game data runs through 2024. Added historical players currently have six base dimensions; playoff indices remain unknown. Other fields follow source cutoffs. Rosters are not appearance evidence. Early defensive/advanced data has gaps; awards and championship modules may overlap.
名单、模型及偏好只保存在本机浏览器，未接入账号或云同步。分享链接包含系数、模块和自选球员 ID，不包含游戏进度。旧 v0.3 设置按 β=10×(1−旧参考比例)×旧权重、γ=10×旧参考比例迁移，缺失情况可能因新策略改变。|Player selections, models and preferences are stored in this browser, without account/cloud sync. Shared links include coefficients, modules and selected player IDs, not game progress. Legacy v0.3 settings migrate as β=10×(1−old consensus share)×old weight and γ=10×old consensus share; missing-data treatment may change results.
北京时间|Beijing time
NBA.com 2026-10-04官方当前30队名单；含训练营/双向/未出场新人，不等于曾在2026赛季出场。|Official NBA.com rosters for all 30 teams on 2026-10-04, including camp, two-way and rookie players. Roster membership does not prove a 2026 appearance.
1946–47至2025–26快照内所有NBA/BAA常规赛实际出场球员；不含仅ABA球员或尚未正式出场新人。|All recorded NBA/BAA regular-season players from 1946–47 through 2025–26. Excludes ABA-only players and rookies without official appearances.
编辑主观挑选较熟悉的历史和现役球员；不表示实力或人气排名。|An editorial selection of familiar historical and active players, not a ranking of ability or popularity.
2026–27赛季20队国内球员已完成注册快照；不含未核实的外援、不把预注册当作正式注册。|Completed domestic registrations for 20 teams in 2026–27. Excludes unverified foreign players; pre-registration is not final registration.
全部已收录、具有CBA实际出场证据的历史球员；不是CBA全史完备名单。|All recorded historical players with evidence of CBA appearances, not a complete all-time CBA roster.
NBA/BAA、CBA 与 EuroLeague 已收录档案，按已核实身份映射合并；仍有跨源身份待核查，不凭同名强行合并，也不是全球全部运动员。NBA GOAT 评级独立于游戏题库。|Recorded NBA/BAA, CBA and EuroLeague profiles, merged only with verified identity links. Some identities still need verification; matching names alone do not trigger a merge. This is not every player worldwide. GOAT rankings use a separate dataset.
冠军球队赛季记录|champion-team season records
来源赛季球队记录与历届冠军匹配的赛季数；不等同于戒指授予名单，也不作为季后赛实际出场证明。当前仅已核实原档案有此项。|Seasons where source team records match the champion. Not ring recipients or proof of playoff appearances. Available only in verified original profiles.
常规赛最佳防守球员获奖次数；奖项始于1982–83。|Regular-season Defensive Player of the Year awards, introduced in 1982–83.
总决赛MVP获奖次数；奖项始于1969。|Finals MVP awards, introduced in 1969.
按届去重的入选次数，不等于实际出场次数。|Selections counted once per edition, not actual appearances.
生涯总量÷实际出场数；缺少年份保留未知。|Career totals divided by actual games; missing years remain unknown.
采用该次节目公开 Top 5；仅在这五人之间拟合顺序，未入榜球员不被视作低于第五。|Uses the Top 5 published in this episode. Only those five players are fitted; unlisted players are not assumed to rank below fifth.
ESPN原始视频链接；名单由同期媒体转录交叉核实。|Original ESPN video link; ranking cross-checked against contemporary media transcripts.
ESPN 评论员 · 个人公开榜单|ESPN analyst · Personal published list
采用 2021 年个人 Top 10，不宣称是他今天的最新观点。原帖图片未在本次直接复核，使用同期媒体转录交叉核对。|Uses his 2021 personal Top 10, not necessarily his current view. The original image was not directly rechecked; contemporary media transcripts were cross-referenced.
媒体转录交叉核实；保留原帖链接，不标作原图已复核。|Cross-checked media transcripts. Original post linked, without claiming the original image was reverified.
前 ESPN 主持人 · First Take 回访|Former ESPN host · First Take return appearance
前 ESPN 主持人在 2026-05-08 一次性回访中的 Top 10；并非 ESPN 现任主持人。此榜与七维统计可能存在较大冲突，界面如实展示拟合误差。|The former ESPN host’s Top 10 from a one-off return on 2026-05-08. He is not a current ESPN host. The list may conflict with the seven indices; fitting errors are shown.
ESPN原始节目链接；完整顺序经同期文字报道校对；身份由ESPN新闻稿核实。|Original ESPN episode; complete order checked against contemporary reporting, with role verified by an ESPN press release.
主持人（发表时）|host (at publication)
评论员（发表时）|analyst (at publication)
取 2022 年系列榜单已核实的前五，不是不限年代的完整历史榜，也不把 Russell、Chamberlain 等未录入球员置于第五之后。日期是第 1 名原始视频发布日；FOX 文字页后来的更新日期不表示重新公布榜单。|Uses the verified top five from the 2022 series, not a complete unrestricted all-time list. Unlisted players such as Russell and Chamberlain are not placed below fifth. The date is the original No. 1 video’s publication, not a later FOX page update.
原始节目官方频道确认第 1 名与发布日期，FOX 官方逐名页面确认 1—5 名。此次读取的是官方页面可检索正文和视频元数据，未声称观看了完整节目。|The official channel confirms No. 1 and publication date; FOX’s individual pages confirm ranks 1–5. Evidence is searchable page text and video metadata, not a claim of watching the full episode.
采用 2022 年总决赛后的这一次前十，未混入其后版本；只拟合十位明确列出的球员之间的顺序。模型拟合误差会保留，不强制复刻榜单。|Uses this post-2022-Finals Top 10 without mixing later versions. Only explicitly listed players’ order is fitted; errors are retained rather than forcing exact reproduction.
FOX Sports 官方报道可检索正文明确逐名列出完整顺序；不是把文章中的其他评论员观点归给 Broussard。|FOX Sports reporting explicitly lists the full order. Other analysts’ opinions in the article are not attributed to Broussard.
这是 Sharpe 在 FOX 节目中的 2022 年榜单，非 ESPN 官方榜或其最新观点。原始节目链接与日期已核对，完整顺序依据同期文字转录，未声称本次逐帧复核原视频。仅拟合榜内十人，不推断未入榜者名次。|Sharpe’s 2022 FOX list, not an official ESPN list or necessarily his latest view. Original link and date were checked; the order comes from contemporary transcripts, not a frame-by-frame video review. Only the listed ten are fitted.
FOX 官方原始视频及节目页面确认主题与日期；The SportsRush 同期逐名转录确认完整前十。|FOX’s original video and episode page confirm topic and date; a contemporary SportsRush transcript confirms the complete Top 10.
上海|Shanghai
东莞|Dongguan
云南红河|Yunnan Honghe
佛山|Foshan
八一|Bayi
北京|Beijing
北控|Beikong
南京军区|Nanjing Military Region
吉林|Jilin
同曦|Nanjing Tongxi
四川|Sichuan
天津|Tianjin
奥神|Aoshen
宁波|Ningbo
山东|Shandong
山西|Shanxi
广东|Guangdong
广厦|Guangsha
广州|Guangzhou
新浪狮|Sina Lions
新疆|Xinjiang
江苏|Jiangsu
沈部|Shenyang Army
河南|Henan
济部|Jinan Army
浙江|Zhejiang
深圳|Shenzhen
湖北|Hubei
福建|Fujian
空军|Air Force
辽宁|Liaoning
重庆|Chongqing
青岛|Qingdao
香港飞龙|Hong Kong Flying Dragons
我的已猜线索|My revealed clues
只根据自己的已提交反馈推导，不使用对手猜测或隐藏答案。|Uses only your submitted feedback, never opponents’ guesses or the hidden answer.
相同为绿，接近为黄；↑ 答案更大，↓ 答案更小。黄色范围：出生年 ±3、身高 ±3 cm、首赛年 ±2、次数类 ±1、场均得分 ±2 分。|Green means equal, yellow means close. ↑ means higher; ↓ means lower. Yellow tolerances: birth year ±3, height ±3 cm, debut year ±2, counts ±1, PPG ±2.
排名实验室 / 定义你的伟大|Ranking Lab / Define greatness
没有标准答案，只有你的标准。|Your criteria. Your answer.
从评论员观点出发，独立调整每个系数。你更看重巅峰、荣誉，还是漫长生涯？排名会随之重新计算。|Start with an analyst’s perspective and adjust each coefficient. Peak, awards or longevity—which matters most to you? The rankings recalculate as you choose.
这是加性模型，不是百分比分配：调大一项，不会挤掉其他项。|An additive model uses independent coefficients. Increasing one does not reduce another.
球员库 / 看懂排名背后|Player Library / Behind the rankings
先认识球员，再比较伟大。|Know the players before comparing greatness.
从默认 300 位候选开始，查看履历、荣誉与来源；也可点击「添加球员」扩展自己的名单，与排名实验室同步。|Explore the default 300 players, their careers, awards and sources. Add players to expand your list, shared with the Ranking Lab.
入选不等于高排名；不同年份与统计口径，会在档案中说明。|Selection does not imply a high rank. Profiles explain differences in coverage years and statistical definitions.
猜球员 / 换一种方式认识篮球|Guess the Player / A different kind of basketball IQ
八次机会，用线索找到他。|Eight guesses. Follow the clues.
NBA 与 CBA 各有现役、历史已收录、简单球星三种范围，也可挑战跨联赛池。支持中文、英文和已收录绰号搜索。|NBA and CBA each offer active, historical and familiar-star pools, plus a cross-league challenge. Search English, Chinese or recorded nicknames.
无需账号即可体验。可以限定实际出场赛季与球队；猜测进度保存在当前浏览器。|No account needed for single player. Filter by actual season/team appearances; progress stays in this browser.
开始调整模型|Start tuning
浏览球员档案|Explore player profiles
开始猜球员|Start guessing
选一个起点，不是选一个答案。|Choose your starting point.
先看看评论员观点。这里的系数是根据其公开排序拟合的解释性近似，并不是评论员亲自公布的评分公式。|Explore analyst perspectives. These coefficients are explanatory approximations fitted to published rankings, not the analysts’ own scoring formulas.
评论员观点选择器|Analyst perspective selector
你可以从一个预设开始，再形成自己的标准。|Start with a preset, then develop your own criteria.
拉一个系数，看看谁上升。|Move a slider. See who rises.
七个维度与大众参考系数彼此独立。系数 1 表示该项指数比基准高 10 分时，总分加 1 分；系数不是百分比，不需要凑成 100。|The seven dimensions and consensus coefficient are independent. A coefficient of 1 adds one point per 10 index points above baseline. Coefficients are not percentages.
独立系数滑杆|Independent coefficient sliders
先只改一项，最容易看懂排名为何变化。|Change one term first to see why the rankings move.
带着一个球星来做实验。|Experiment with your favorite player.
在「让谁更靠前？」中选择你关注的球员，查看哪些系数对他更有利。建议改变评价标准，不修改球员数据，也不保证任何人一定第一。|Choose a player under “Who should rank higher?” to see helpful coefficients. Suggestions change evaluation criteria, not data, and do not guarantee first place.
目标球员选择器|Target player selector
选择目标后，可对照排名、分差与建议理解模型。|Compare ranks, score gaps and suggestions to understand the model.
每一分，都有来处。|Every point has a source.
顶部「查看我的模型」会展示最终公式、逐项贡献和简明解释。模型分不是百分制，可以高于 100，也可以低于 0。|“View my model” shows the final formula, contributions and a short explanation. Scores can be above 100 or below 0; they are not percentages.
查看我的模型按钮|View my model button
点击后自行打开模型窗口；本导览不会替你更改任何设置。|Open the model window yourself; this guide does not change any settings.
从一个熟悉的名字开始。|Start with a familiar name.
输入中文名、英文名或球队，再按位置、主要年代与入选路径筛选。筛选只影响列表，不改变实验室的候选池。|Search a name or team, then filter by position, era or selection route. Filters affect this list, not the Lab’s candidate pool.
姓名与球队搜索|Name and team search
试试乔丹、Curry 或 BOS；也可以随时清除筛选。|Try Jordan, Curry or BOS. Clear filters anytime.
这份名单，不是实力榜。|Explore a directory, not a power ranking.
列表按英文姓名排列，展示生涯赛季、位置、年代与入选路径。荣誉、数据、共识三个入口允许重合，人数不能简单相加。|The list is alphabetical by English name, with career seasons, position, era and qualification routes. Awards, statistics and consensus pools overlap.
球员列表|Player list
浏览列表或翻页，找到想进一步了解的球员。|Browse or turn pages to find a player you want to explore.
打开档案，把结论对照数据。|Open a profile. Check the evidence.
点击任意球员可以查看履历、统计、荣誉和数据覆盖情况。档案中还可以跳到实验室，为这位球员调整你的评级模型。|Click a player for background, statistics, awards and coverage. Jump to the Lab to adjust your model for that player.
第一条球员档案入口|First player profile
本导览只定位入口，不替你打开档案或修改筛选。|The guide points to the control without opening profiles or changing filters.
先选范围，再选挑战方式。|Choose a pool and a challenge.
NBA、CBA 各有现役、历史已收录和简单球星池，另有跨联赛池。每日挑战在北京时间零点更新；自由练习可以换题。各池的来源和覆盖范围在下方说明。|Choose active, historical or familiar stars in NBA/CBA, or cross-league. Daily challenges reset at midnight Beijing time; practice can be replayed. Coverage is explained below.
球员池选择器|Player pool selector
首次体验推荐 NBA 简单球星池，从你熟悉的球员开始。|Try NBA familiar stars for your first game.
范围和线索，收在右上角设置里。|Filters and clues live in top-right settings.
点击右上角设置，可限定真实赛季与球队、选择单人线索，或登录在线对战。指定球队时，必须有相应赛季为该队实际出场的证据；资料不全者不会进入限定题池。|Open settings for season/team filters, custom single-player clues or online accounts. Team filters require actual appearances in the selected years; unverified records do not qualify.
右上角游戏设置|Top-right game settings
设置里分为赛季/球队、自选线索、账号/对战三栏。应用范围后返回猜题；搜索候选和答案遵守相同范围。|Settings has Season/Team, Custom clues and Account/Multiplayer tabs. Apply filters and return to play; search and answers share the same range.
中文、英文、绰号，都可以。|Names and nicknames both work.
在 NBA 池可试着搜索「哈登」或「大胡子」。输入不会扣次数，点击候选或回车提交才算一次有效猜测；重复或无效提交不扣次数。|Try “Harden” or “The Beard” in an NBA pool. Typing does not use an attempt; submitting a valid player does. Duplicates and invalid guesses are free.
猜球员搜索框|Player search box
若搜索不到熟悉的名字，检查他是否符合当前生效的赛季和球队范围。|If you cannot find a name, check the active season and team filters.
读懂颜色，也读懂箭头。|Read the colors and arrows.
绿色表示一致，黄色表示接近或集合重合。↑ 表示答案更大，↓ 表示更小；「未知」表示资料不足或不可比较，不代表 0。|Green means a match, yellow means close or overlapping. ↑ means higher; ↓ means lower. Unknown means insufficient or incomparable data, not zero.
线索图例|Clue legend
NBA 生涯指标有不同数据截止年，详情见右侧规则与口径。|Career metrics have different cutoff dates. See the rules and definitions.
逐步缩小范围，八次找到本人。|Narrow it down in eight guesses.
每次提交后，在猜测记录中比较基本资料与生涯指标。全部属性相同也不等于猜中，最终以球员身份为准。|Compare profile and career clues after each guess. Matching all attributes still requires the correct player identity.
猜测记录区域|Guess history area
这里的演示不会消耗机会、改变答案或写入任何猜测。|This demo does not use attempts, change the answer or submit guesses.
加性模型示意：基准 50 分，加巅峰贡献 6 分，加荣誉贡献 4 分，共 60 分。此处不是实际球员评分。|Additive model example: baseline 50 + peak 6 + awards 4 = 60. Not an actual player score.
加性计算 · 示意|Additive calculation · Example
基准分|Baseline
巅峰贡献|Peak contribution
荣誉贡献|Awards contribution
巅峰系数|Peak coefficient
荣誉系数|Awards coefficient
独立调整|Adjust independently
保持不变|Unchanged
贡献逐项相加，系数不合计为 100%。|Contributions add up; coefficients are not percentages.
球员档案结构示意，包括履历、入选路径、数据与来源。|Example player profile: career, selection route, statistics and sources.
认识你的候选池 · 示意|Meet your candidate pool · Example
不止一个名字|More than a name
每一位候选，都有可查看的背景|Every candidate has a profile to explore
数据来源|Data sources
统计口径|Statistical definitions
虚构线索示意：位置 G 一致，身高 201 厘米接近且答案更高，MVP 次数未知。不会提交猜测。|Fictional clues: guard matches; height 201 cm is close and the answer is taller; MVP count unknown. No guess is submitted.
读懂下一步 · 虚构线索示意|Your next move · Fictional clues
答案更高|Answer is taller
未知 ≠ 零|Unknown ≠ Zero
演示不会消耗机会，也不会改变本局答案。|The demo uses no attempts and does not change the answer.
步上手|steps to get started
现在去找|Find this control
点击「带我试试」后，将定位并高亮实际入口。|Select “Take me there” to highlight the actual control.
不会替你操作，也不会更改现有设置。|The guide does not operate controls or change settings.
带我试试|Take me there
查看第|View step 
步|step
NBA 简单·知名球星|NBA · Familiar stars
NBA 现役|NBA · Active
NBA 全历史|NBA · Historical
CBA 简单 · 知名球星|CBA · Familiar stars
CBA 现役 · 国内注册|CBA · Active domestic registrations
CBA 全部已收录|CBA · Recorded history
全球 · 跨联赛已收录|Global · Recorded cross-league
游戏独立于默认300人评级池。NBA历史涵盖快照内全部实际常规赛出场者；NBA现役为官网当日阵容，含训练营/双向/新人。CBA现役和历史覆盖按各池说明，不将未核实记录称为完整历史。已核实中文名/绰号保留，新增未核实译名者可用英文检索。|The game is separate from the 300-player ranking sample. NBA history covers recorded regular-season appearances; active NBA uses the dated official roster, including camp, two-way and rookie players. CBA coverage follows each pool’s notes. Chinese aliases are verified where available; English names remain searchable.
客观门槛：常规赛MVP≥1或NBA全明星入选≥5届；截至2025–26，历史与现役均可入选。|Eligibility: at least 1 regular-season MVP or 5 NBA All-Star selections, through 2025–26. Includes active and historical stars.
有常规赛实际出场的 NBA/BAA franchise 数；按球队沿革与赛季去重，同队改名/迁址不重复，同队回归不增加；不含 ABA/CBA/海外球队。|Distinct NBA/BAA franchises with regular-season appearances. Renames, relocations and return stints are consolidated. Excludes ABA, CBA and overseas teams.
实际至少出场一场的赛季数；不含附加赛，统一截至2025–26。|Seasons with at least one actual appearance, excluding play-ins, through 2025–26.
NBA/BAA 生涯常规赛总得分 ÷ 实际总出场数，保留一位小数（不是各赛季场均的简单平均）；截至 2025–26。|NBA/BAA career regular-season points divided by actual games, rounded to one decimal, through 2025–26. Not a simple average of season averages.
NBA 官方常规赛 MVP 获奖次数，奖项始于 1955–56；截至 2025–26；不含 FMVP、ABA 或其他联赛 MVP。|Official NBA regular-season MVP awards, introduced in 1955–56, through 2025–26. Excludes Finals MVP and other leagues.
球队集合仅为已收录 NBA/BAA 生涯，不包含海外生涯；首赛年指 NBA/BAA 首次正式出场年。|Teams cover the recorded NBA/BAA career only, excluding overseas careers. Debut is the first official NBA/BAA appearance year.
身高四舍五入至厘米，来自档案记录，不是实时测量；国家/地区未核实，保持空值。|Height is from recorded profiles, rounded to centimeters, not a current measurement. Unverified country/region remains empty.
NBA/BAA实际常规赛赛季与原始球队同行连接，g>0且排除合计行；不以生涯年份补齐中断。|NBA/BAA regular-season appearances are joined to the team in the same season row, requiring g>0 and excluding total rows. Career gaps are not interpolated.
NBA/BAA 背景快照（原球员库）|NBA/BAA background snapshot (original library)
NBA/BAA 常规赛逐赛季快照|NBA/BAA regular-season snapshots
NBA/BAA 历史球队沿革表|NBA/BAA historical franchise lineage
NBA/BAA 季后赛逐赛季实际出场记录|NBA/BAA playoff season appearances
NBA/BAA 总决赛赛程与逐场球员记录|NBA/BAA Finals schedules and player game records
NBA 官方历届常规赛 MVP|NBA official regular-season MVP history
NBA All-Star Selections逐届名单|NBA All-Star selections by year
ESPN 2025、2026季后赛赛程与逐场技术统计|ESPN 2025 & 2026 playoff schedules and box scores
球队记录未收录|Team records unavailable
控球后卫|Point guard
得分后卫|Shooting guard
小前锋|Small forward
大前锋|Power forward
中锋|Center
后卫|Guard
前锋|Forward
赛季未收录|Seasons unavailable
默认三池 + 用户自选|Three default pools + your selections
用户添加的档案来自扩展库，不代表通过 A/B/C 入选规则；添加不修改默认样本的指数。|User-added profiles come from the expanded library, not A/B/C qualification. Adding them does not change original sample indices.
这些是默认样本，可通过上方入口加入其他有据可查的球员。|This is the default sample. Add other sourced players using the control above.
同一位默认球员可以属于多个候选池，各池人数不可直接相加。|Default players can qualify through multiple pools, so pool counts cannot be added.
人单独标记，不计入 A/B/C。|user-added players are labeled separately, outside A/B/C.
入选不等于上榜，也不保证高分。|Qualification does not guarantee a high score or ranking.
查看筛选规则|View selection rules
的球员档案| player profile
入选候选池|Qualifying pools
没有匹配的球员。试试英文姓名，或清除筛选条件。|No matching players. Try an English name or clear filters.
位，共|of
没有匹配结果|No matches
未收录 / 未确认|Not recorded / Unverified
球员履历|Player background
首个赛季|First season
最近赛季|Latest season
记录赛季数|Recorded seasons
档案首赛|Recorded debut
联赛范围待核实|League scope unverified
体重|Weight
出生日期|Date of birth
学院 / 大学|College / University
选秀记录|Draft record
数据状态|Record status
快照末季仍有参赛记录|Active in the snapshot’s last season
生涯记录已结束（快照口径）|Career record ended in this snapshot
生涯起止按数据中的 NBA / BAA 赛季记录展示，不等同于正式宣布出道或退役的年份；身高体重为来源记录值，不代表实时测量。|Career dates reflect recorded NBA/BAA seasons, not official debut or retirement announcements. Height and weight are source values, not current measurements.
每支球队列出首次与最后一次记录赛季，不代表期间连续效力。|Each team shows the first and last recorded season, not necessarily an uninterrupted stint.
生涯数据|Career statistics
常规赛与季后赛数据|Regular-season and playoff statistics
指标|Metric
参赛赛季|Seasons played
出场场次|Games played
场均上场分钟|Minutes per game
累计得分|Total points
累计篮板|Total rebounds
累计助攻|Total assists
累计抢断|Total steals
累计盖帽|Total blocks
累计上场分钟|Total minutes
真实命中率 TS%|True shooting TS%
常规赛最后记录|Last regular-season record
季后赛最后记录|Last playoff record
仅涵盖有记录赛季，见表后说明|Recorded seasons only; see notes below
场有记录|games recorded
— 表示未收录或该项未有可用记录，不代表 0。季后赛合计未收录，不从已四舍五入的场均倒推累计。|— means unavailable, not zero. Missing playoff totals are not reconstructed from rounded averages.
累计仅涵盖已观测赛季，场均也以有记录场数为分母。|Totals cover observed seasons only; averages use corresponding recorded games.
总决赛 MVP|Finals MVP
最佳防守球员|Defensive Player of the Year
最佳阵容一阵|All-NBA First Team
最佳阵容总数|Total All-NBA selections
最佳阵容合计|All-NBA selections
最佳防守阵容|All-Defensive selections
最佳阵容|All-NBA selections
全明星次数|All-Star selections
生涯荣誉|Career awards
篮球名人堂|Basketball Hall of Fame
NBA 75 大|NBA 75th Anniversary Team
NBA 50 大|NBA 50th Anniversary Team
荣誉按当前数据快照统计；奖项的设立时间不同，早期球员的 0 次不等于不具备相应能力。|Awards follow the data snapshot. Introduction dates differ; zero awards for an early player does not imply zero ability.
为什么在当前比较池？|Why is this player in your pool?
你从扩展档案选择的球员|a player you selected from the expanded library
扩展档案预览，尚未加入当前比较池|an expanded profile preview, not yet added to your pool
并非 A/B/C 默认入选者。添加操作不会改变原|not an A/B/C default selection. Adding this player does not change the original 
位默认球员的指数或入选规则。|players’ indices or selection rules.
新增指标按档案明确的覆盖与固定参照计算；未计算项保持缺失，不以 50 冒充观测指数。可查看原始统计并选择高级模块。|Added metrics use stated coverage and fixed reference scales. Uncalculated indices stay missing, not 50. Inspect raw data and choose advanced modules.
查看入选参考榜单中的位置|View positions in source rankings
为什么入选比较池？|Why was this player selected?
已核实属于该候选池，具体条目尚未收录。|Pool membership verified; detailed criteria not yet recorded.
具体入选路径尚未收录。|Selection route not yet recorded.
入选依据是候选资格，不是模型权重，也不是预设排名。多条路径可以重叠，最终球员名单去重。|Selection establishes eligibility, not weights or predetermined ranks. Routes can overlap; the final player list is deduplicated.
球员背景|Player background
选秀|Draft
球队|Team
入选依据|Selection criteria
国家 / 地区|Country / Region
数据覆盖与缺失说明|Coverage and missing data
当前记录未提供额外覆盖说明；表格中的缺失值仍按“—”保留。|No additional coverage notes are available. Missing values remain “—”.
未收录字段：|Fields not recorded: 
数据出处|Sources
各字段的数据加工来源|Source processing by field
采集 / 核对日期：|Collected / Verified: 
来源链接尚未收录。|Source links unavailable.
扩展库预览|Expanded library preview
去实验室为他评分|Rate this player in the Lab
加入我的比较池|Add to my comparison pool
分享链接打开的是档案预览，不会自动修改你的名单。确认资料后，点击加入；该选择会在当前浏览器的两个页面共用。|Shared links open a preview without changing your selection. Review and add the player to share that choice between the Lab and Library in this browser.
球员数据为空|Player data is empty
自选档案暂不可用，已保存选择不删除；先显示默认球员，可打开添加窗口重试。|Custom profiles are unavailable. Saved selections are kept; default players are shown. Reopen player selection to retry.
球员档案暂时无法载入（|Player profiles could not load (
入选资格和评分分离：300 人为 A / B / C 三池并集，不是先定好的历史前 300 名。年份均指赛季结束年；球队为原始赛季表中的实际球队，不含 TOT 合计行。|Eligibility is separate from scoring: the 300 players are the union of pools A/B/C, not a predetermined top 300. Years are season end years; teams come from actual season rows, excluding TOT aggregate rows.
荣誉与官方认可|Awards and official recognition
达到一项荣誉门槛或官方周年名单，即可进入 A 池。|Qualify for pool A by meeting an award threshold or appearing on an official anniversary team.
或荣誉候选指数达到全集 96.5 分位；或 NBA 50 / 75 周年官方名单|Or an awards index at the 96.5th percentile, or selection to the official NBA 50th/75th anniversary team
统计表现与年代代表|Performance and era representatives
至少 100 场的候选人中，统计候选指数前 213，并补入每年代前 5。|Top 213 statistical candidates with at least 100 games, plus the top 5 from each era.
指数来自巅峰 1/3/5 年、累积表现、出场时间、WS、VORP 的可用项加权分位|Index uses available weighted percentiles for peak 1/3/5 years, accumulated performance, minutes, WS and VORP
前 N 的阈值自动校准，使三池并集接近 300；不使用最终 GOAT 分数挑人|The top-N threshold is calibrated to a union of about 300, without using the final GOAT score
媒体认可与讨论案例|Media recognition and discussion cases
媒体历史榜、官方名单、名人堂及全明星、年代代表和预设讨论案例。|Media all-time lists, official teams, Hall of Fame and All-Star selections, era representatives and discussion cases.
至少进入一份已收录外部有序榜；或 NBA 50 / 75；或名人堂且全明星 ≥ 3|At least one recorded external ranking, NBA 50/75 selection, or Hall of Fame membership with 3+ All-Star selections
或至少 100 场候选人中的每年代统计指数前 3；或配置列出的 24 个讨论案例|Or top 3 statistical candidates per era with 100+ games, or one of 24 configured discussion cases
NBA / BAA；不把 ABA 赛季混入生涯统计|NBA / BAA; ABA seasons excluded from career statistics
国家/地区未有可靠字段，暂不从姓名、出生地或学校推断。|Country/region lacks a reliable field and is not inferred from name, birthplace or school.
多来源合并，逐球员列出主来源|Merged sources; primary source listed per player
NBA 官方历史快照与候选原始源合并|Official NBA historical snapshots merged with original candidate sources
入选依据使用的公开历史榜或官方周年名单；不代表现行榜单。|Published historical rankings or official anniversary teams used for selection, not necessarily current rankings.
单项数据王|Statistical category leader
满足其一|any one criterion
荣誉候选指数处于历史候选全集前 3.5%|Awards candidate index in the top 3.5% of historical candidates
常规赛至少 100 场的候选人中，统计候选指数第|Among candidates with 100+ regular-season games, statistical index rank 
达到入选门槛|meets the selection threshold of 
年代统计候选指数前|era statistical index top 
纳入年代代表|included as an era representative
统计候选指数|Statistical candidate index
用于选人，不是 GOAT 最终得分|used for selection, not the final GOAT score
份已收录媒体历史排行榜|recorded media all-time lists
快照记载为名人堂成员，且至少 3 次全明星|Recorded Hall of Fame member with at least 3 All-Star selections
进入前|qualifies for the top 
进入|Included in 
全明星|All-Star
是|Yes
否|No
顺位|pick
轮|round
年代|Era
乔丹|Jordan
詹姆斯|James
贾巴尔|Abdul-Jabbar
库里|Curry
科比|Kobe
魔术师|Magic
查看|View 
将「|Include “
放入高级模型|in advanced mode
ESPN · First Take 主持人|ESPN · First Take host
与 team_success.csv|and team_success.csv
采用球员库荣誉快照，各来源更新截止不同，主要截至 2025–26。|Uses award snapshots with different source cutoffs, mostly through 2025–26.
不是联盟官方分值或拟合真理。5 项记录必须全部存在；最佳阵容按一二三阵合计。MVP 始于 1955–56、FMVP 始于 1969、DPOY 始于 1982–83、最佳防守阵容始于 1968–69，未校正不同年代的奖项机会。|Not official league values or a fitted truth. All 5 records are required. All-NBA includes all three teams. MVP began in 1955–56, FMVP in 1969, DPOY in 1982–83 and All-Defensive teams in 1968–69. Award opportunities are not era-adjusted.
只奖励两项均高于中性基准；任一低于 50 则协同为 0，避免负负得正。除以 5 使两项均为 100 时指数为 5。它是新增的显式偏好，不是因果关系或胜率。|Rewards only two above-baseline inputs; either below 50 makes the interaction zero. Dividing by 5 yields an index of 5 when both inputs are 100. This is an explicit preference, not a causal effect or win probability.
基础七维指数的确定性变换；沿用七维数据快照，季后赛截至 2024。|Deterministic transformation of the base indices. Same snapshot; playoffs through 2024.
任一源维度缺失，整个协同项中性贡献 0。|If either source dimension is missing, the interaction contributes zero neutrally.
常规赛 × 防守协同|Regular season × Defense interaction
只奖励两项同时高于中性基准；防守数据有时代缺失，不把数据可用性误作防守能力。它是可选偏好项，仍逐项加到总分。|Rewards both inputs being above baseline. Defensive coverage varies by era; availability is not ability. This optional preference adds independently to the score.
基础七维指数的确定性变换；沿用七维数据快照，早期防守覆盖不同。|Deterministic transformation of base indices using the same snapshot; early defensive coverage differs.
七维数据画像，指数范围零到一百；缺失项不连接，详细数值见下表|Seven-dimension profile, indices from 0 to 100. Missing axes are not connected; see values below.
雷达图展示固定的七维原始指数（0–100），不是得分占比，不随系数变化。缺失项留空，不画成零分。|The radar shows seven fixed indices (0–100), not score shares. Coefficients do not change it. Missing values are left blank, not drawn as zero.
展开七维指数表|Show seven-dimension index table
当前模型：每项实际加分 / 扣分|Current model: points added / deducted by term
固定起点 50；横轴左负右正，同一分值尺度（两端|Fixed starting score 50. Negative left, positive right on the same scale (limits 
只画当前启用项，不把加分归一为百分比。|Only enabled terms are shown. Contributions are not normalized to percentages.
有符号得分贡献条形图，详细数值在下方表格|Signed contribution bar chart; detailed values in the table below
全部系数为 0：只有固定起点 50，所有球员并列。|All coefficients are zero: every player ties at the 50-point baseline.
已启用模块|Enabled modules
观测值|Observed value
贡献分|Contribution
固定起点|Fixed baseline
七维指数（0–100）|Seven-dimension index (0–100)
最终模型分|Final model score
项中性填补|neutrally imputed terms
全部已启用项都缺失时显示“未评分”；中性贡献不等于真实能力居中。不同模块的原始单位不能直接比较。|If all enabled inputs are missing, the player is unscored. Neutral contribution does not imply average ability. Raw units differ between modules.
基础模型快照；季后赛截至 2024|Base model snapshot; playoffs through 2024
当前独占第一，领先|Currently sole leader, ahead of 
你的最大数据系数是「|Your largest data coefficient is “
该维度每提高 10 个指数点，总分增加|For every 10 index points in that dimension, the score increases by 
分；其他项不会被压低。|points; other terms are unaffected.
维度指数|Dimension index
维度|Dimension
指数|Index
独立取值 0–10，没有总和约束；固定截距 50 只改变分数起点，不改变名次。分数可以高于 100 或低于 0，不是百分比、胜率或概率。|ranges independently from 0 to 10 without a sum constraint. The fixed intercept 50 shifts scores without changing ranks. Scores can exceed 100 or fall below 0; they are not percentages or probabilities.
的逐项贡献| — contribution by term
项目|Term
中心化 z|Centered z
加分 / 扣分|Points added / deducted
固定截距|Fixed intercept
大众参考|Consensus
最终分|Final score
例如某项指数 80、系数 2：贡献 = 2 × (80−50) ÷ 10 = |For an index of 80 and coefficient 2, contribution = 2 × (80−50) / 10 = 
不是占总分的 2%，也不会改变其他项的系数。|This is not 2% of the total and does not change other coefficients.
缺失维度使用明确的中性基准 50，因此 z=0；它是建模填补，不是观测事实，也不说明球员真实水平居中。不会因缺失重新放大其他项。所有已启用项都没有观测时，显示“未评分”；全部系数为 0 则是有意设定的 50 分并列模型。|Missing dimensions use a neutral baseline of 50, giving z=0. This is imputation, not an observed fact or evidence of average ability. Other terms are not rescaled. All enabled inputs missing means unscored; all-zero coefficients deliberately produce a 50-point tie.
大众参考 P 沿用多媒体榜单先验，作为另一独立加性项 γ×(P−50)/10。未入榜使用中性 50、无额外贡献；它不是统计学贝叶斯后验。共同使用公众排名训练和先验项可能重复强调相似观点，需谨慎解释。|Consensus P comes from multiple media rankings and adds independently as γ×(P−50)/10. Unlisted players use a neutral 50. This is not a statistical Bayesian posterior. Using rankings for both fitting and a consensus term may double-count similar views.
起点：|Starting point: 
七维系数通过已知排序拟合并正则化，但不再要求系数和为 1。短榜无法唯一确定评论员公式，拟合误差仍如实展示。|Seven coefficients are fitted to known rankings with regularization, without summing to 1. A short list cannot uniquely identify an analyst’s formula; fitting errors remain visible.
弗一把|Friberg Guessing Game
快速上手|Quick start
关闭导览|Close guide
导览进度|Guide progress
上一步|Back
继续 →|Continue →
开始探索 →|Start exploring →
跳过，直接使用|Skip and explore
随时从页面「动画导览」重看|Reopen using “Animated guide” anytime
皮肤|Themes
为你的主场换个颜色。|Give your court a new look.
关闭皮肤选择|Close theme picker
即时预览，全站通用。只改变外观，不改变评分或游戏线索的含义。|Preview instantly across all pages. Appearance changes; scoring and clue meanings stay the same.
选择网站皮肤|Choose a theme
极光赛场|Aurora Arena
紫蓝极光 × 电光青|Violet aurora × electric cyan
日落球场|Sunset Court
热烈橙光 × 深红球场|Warm orange × deep crimson
碧海之上|Ocean Blue
明亮湖蓝 × 深海青|Bright blue × deep teal
玫瑰霓虹|Rose Neon
莓果粉红 × 浓郁紫夜|Berry pink × rich violet
奶油晴空|Ivory Sky
浅色暖白 × 鲜明钴蓝|Warm ivory × cobalt blue
经典森林|Classic Forest
原版深绿 × 青柠点缀|Original dark green × lime accents
偏好仅保存在此浏览器，无需账号；其他设备需另行选择。|Preferences are stored in this browser. No account needed; choose separately on other devices.
就用这个配色|Use this theme
切换皮肤，当前：|Change theme; current: 
已保存，三个页面同步生效。|Saved across all three pages.
浏览器限制了存储，本页仍可正常预览。|Storage is restricted. Preview still works on this page.
点击卡片即时切换。|Click a card to switch instantly.
True GOAT · 你的篮球价值观|True GOAT · Your basketball values
真正的山羊|The Greatest of All Time
排名实验室|Ranking Lab
球员库|Player Library
猜球员|Guess the Player
实验室|Lab
账号 / 对战|Account / Multiplayer
主导航|Main navigation
首页|Home
查看我的模型|View my model
GOAT，由你定义|Define your GOAT
同一份数据，不同的篮球价值观。独立调整每项系数，看看历史如何重新排序。|Same data. Different basketball values. Adjust each coefficient and watch the all-time rankings change.
位球员 · 7 个维度|players · 7 dimensions
没有预设的正确答案|No predetermined right answer
新手入门|Getting started
第一次来？从一个小实验开始。|New here? Start with a small experiment.
选一种观点 → 拉动一个系数 → 看看谁的排名变了。|Pick a perspective → Move a slider → See who rises.
动画导览|Animated guide
带我上手|Show me around
加性模型速览|The additive model at a glance
加性模型 04|ADDITIVE MODEL 04
50 + 常规赛贡献 + 巅峰贡献 + … + 大众参考贡献|50 + regular-season contribution + peak contribution + … + consensus contribution
系数独立，不合计为 100%；每一分都可以逐项追溯。|Coefficients are independent, not percentages. Every point has an explanation.
怎么计算？|How is it calculated?
正在载入球员数据与评论员模型…|Loading players and analyst models…
从一种观点出发|Start with a perspective
评论员观点 / 起始模型|Analyst perspective / Starting model
查看公开排序与拟合情况|View the source ranking and model fit
调出你的价值观|Tune your values
重置|Reset
每项系数独立，调整它不会改变其他项。系数 1 表示该维度每高出基准 10 分，总分加 1 分。|Each coefficient is independent. A coefficient of 1 adds one point for every 10 index points above the baseline.
高级模式 · 自选评价模块|Advanced mode · Choose scoring modules
保留基础加性模型，也可以自由组合原始统计、荣誉积分与协同项。默认关闭。|Combine raw statistics, awards and interaction terms with the base additive model. Off by default.
自定义评价模块|Custom scoring modules
勾选要放进模型的模块，再调整独立系数。模块不互相挤占权重；取消七维模块只在高级模式生效，退出后恢复原基础系数。|Select modules, then set their independent coefficients. Disabling a base dimension only affects advanced mode; leaving it restores your base coefficients.
以下基准和步长是透明的产品约定，不是联盟官方标准、样本均值或拟合结论。原始统计不含时代校正。MVP 始于 1955–56、FMVP 始于 1969、DPOY 始于 1982–83；早期球员没有同等奖项机会，零次数不表示同等竞争下能力为零。|Baselines and scales are product conventions, not official league standards or fitted estimates. Raw statistics are not era-adjusted. MVP began in 1955–56, Finals MVP in 1969, and DPOY in 1982–83. Earlier players had different award opportunities.
大众参考系数数值|Consensus coefficient value
大众参考系数|Consensus coefficient
独立加上|Independently add
大众指数 − 50）÷ 10。设为 0 则不启用；未入榜者中性处理。|consensus index − 50) ÷ 10. Set to 0 to disable; unlisted players receive a neutral contribution.
交锋数据可行性：同场对手双方的技术统计可以单独构建；当前档案不支持“谁直接防守谁”的真实攻防对位，因此尚未作为评分模块开放。|Head-to-head box scores could be added separately. Current records do not identify direct defensive matchups, so this is not yet a scoring module.
评论员拟合起点|Fitted analyst starting point
复制模型链接|Copy model link
你的历史排名|Your all-time rankings
实时计算|Live calculation
“较起点”始终对比评论员 / 均衡基础七维模型。点击分数查看多维图与实际贡献。|Change is measured against the original analyst / balanced seven-dimension model. Click a score for its charts and contributions.
搜索球员 / 中文名|Search player / Chinese name
搜索排行榜|Search rankings
前 20 位|Top 20
较起点|Change
展开全部 300 位球员|Show all 300 players
显示值已舍入，排序使用完整精度；模型分不是百分制，可超过 100。|Displayed scores are rounded; rankings use full precision. Scores are not percentages and can exceed 100.
让谁更靠前？|Who should rank higher?
选择目标球员|Choose a target player
背景数据与入选依据|Background and selection criteria
哪些滑杆最有帮助？|Which sliders help most?
探索更有利的系数|Explore favorable coefficients
建议只改变评分标准，不改球员数据；不保证每位球星都能成为第一。|Suggestions change your criteria, not player data. Not every player can reach first place.
数据画像|Data profile
此处为七维指数；原始统计与背景资料可在球员库查看。|These are seven dimension indices. Find raw statistics and background in the Player Library.
模型应当可解释。|A model should be explainable.
点击顶部「查看我的模型」，了解每一分从哪里来。|Open “View my model” to see where every point comes from.
数据出处与许可|Data sources and licenses
数据边界与方法说明|Data coverage and methodology
我的评级模型|My scoring model
关闭窗口|Close window
查看排名|View rankings
先认识球员，再定义伟大|Know the players. Define greatness
每一份排名，从谁有资格进入讨论开始。查看入选依据、球员履历，以及模型背后的数据。|Every ranking starts with its candidate pool. Explore selection criteria, player careers and the underlying data.
位球员 · 同一个比较池|players · one comparison pool
球员库入门|Player Library guide
排名背后，先看证据。|Look at the evidence behind the rankings.
搜索你熟悉的名字，打开履历，再把这位球员带入实验室。|Find a familiar name, open their profile, then take them to the Lab.
球员库怎么用|Explore the library
为什么是这 300 位？|Why these 300 players?
三个入口 · 去重合并|Three entry routes · unique players
依据荣誉、数据表现、外部共识与讨论价值筛选；并不是先选定一个排名，再反推球员名单。|Selection uses awards, performance, outside consensus and relevance to the debate, without working backwards from a preferred ranking.
候选池构成|Pool composition
同一位球员可以属于多个候选池，各池人数不可直接相加。入选不等于上榜，也不保证高分。|Players can qualify through more than one pool, so counts cannot be added. Selection does not guarantee a high ranking.
正在载入球员档案…|Loading player profiles…
找到你想了解的球员|Find a player to explore
姓名 / 中文名 / 球队|Name / Chinese name / Team
试试：乔丹、Curry、BOS|Try: Jordan, Curry, BOS
场上位置|Position
全部位置|All positions
主要年代|Primary era
全部年代|All eras
入选路径|Selection route
全部候选池|All pools
共识与讨论|Consensus and debate
用户添加|User-added
按英文姓名排列，非实力排名。点击球员查看完整档案。|Alphabetical by English name, not by ability. Click a player for their full profile.
清除筛选|Clear filters
生涯赛季|Career seasons
上一页|Previous
下一页|Next
带着你的判断，进入排名实验室|Take your perspective to the Ranking Lab
关闭球员档案|Close player profile
八次机会，找到答案|Eight guesses. One player
从一位你熟悉的球员开始。读懂线索，一步步缩小范围。|Start with someone you know. Read the clues and narrow it down.
猜球员入门|Guessing game guide
从你熟悉的名字或绰号开始。|Start with a familiar name or nickname.
选中候选后提交。绿色相同，黄色接近，箭头指向答案。|Choose a player to submit. Green means a match, yellow means close; arrows point toward the answer.
教我猜一局|Show me how to play
正在准备球员与线索…|Preparing players and clues…
挑战设置|Challenge settings
游戏模式|Game mode
每日挑战|Daily challenge
自由练习|Practice
联赛与球员池|League and player pool
从简单球星池开始，或挑战现役与历史名单。猜球员不受 GOAT 默认 300 人限制；现役按有出处的注册/阵容快照，历史池按已收录的正式出场，具体覆盖见下方说明。|Start with familiar stars or challenge yourself with active and historical pools. The game extends beyond the 300-player ranking sample. Active pools use sourced roster snapshots; historical pools use recorded official appearances.
选择球员池|Choose a player pool
所有球员池|All player pools
卡片人数为该池未筛选总数；本局人数还受右上角设置中的赛季与球队限制。各池有重合，不能相加。现役名单按核实快照，不是实时阵容。|Cards show pool totals before filters. Season and team settings can narrow your round. Pools overlap; active rosters are verified snapshots, not live updates.
题目范围：赛季与球队|Question range: season and team
先定范围，再开始猜|Set your range, then play
答案与搜索同时受限制|Filters apply to answers and search
赛季结束年 · 从|Season end year · From
不限球队|Any team
重置范围|Reset range
撤销修改|Discard changes
应用范围|Apply range
1995 指 1994–95 赛季。指定年份和球队时，球员必须在该年份范围内为该队正式出场过，不能将不同年代的球队经历拼在一起。仅使用已核实记录，不插补空档；CBA 与国际资料覆盖有限，未核实者不进入已筛选题目。|1995 means the 1994–95 season. A player must have an official appearance for the selected team within the selected years. Only verified records qualify. CBA and international coverage is incomplete.
自选单人线索|Custom single-player clues
自选线索 · 单人玩法|Custom clues · Single player
默认保留当前组合。打开后可增加冠军、DPOY、助攻等线索，也可取消某些项目；缺失数据仍显示未知。|Keep the default combination, or enable this to add championships, DPOY, assists and more. Missing data stays unknown.
额外线索怎么定义？|How are extra clues defined?
助攻、篮板、抢断、盖帽按 NBA/BAA 常规赛生涯总量 ÷ 总出场数；早期未记录的数据保留未知。黄色范围：助攻/篮板|Assists, rebounds, steals and blocks use NBA/BAA career regular-season totals divided by games played. Unrecorded early data stays unknown. Yellow tolerance: assists/rebounds
抢断/盖帽|steals/blocks
荣誉次数|award counts
DPOY 为常规赛最佳防守球员，FMVP 为总决赛 MVP，全明星按入选届数而非实际出场计数。|DPOY means Defensive Player of the Year; FMVP means Finals MVP. All-Star counts are selections, not appearances.
冠军赛季数匹配来源赛季球队记录与历届冠军，不等同于戒指授予名单，也不作为季后赛出场证明；目前仅已核实原档案有此项。CBA/欧洲联赛暂不套用 NBA 荣誉或统计口径。|Championship seasons match season-team records to the champion, not ring recipients or playoff appearances. Currently available only for verified original profiles. NBA definitions are not applied to CBA or European records.
当前在线对局|Current online match
今天，你能几次猜中？|How many guesses will you need?
搜索当前球员池中的球员|Search the current player pool
中文、英文或绰号，如哈登 / 大胡子…|Name or nickname, e.g. Harden / The Beard…
球员候选|Player suggestions
猜一下|Submit guess
切换候选，回车或点击候选提交；每次提交消耗一次机会。|Browse suggestions; press Enter or click a player to submit. Each valid guess uses one attempt.
提示颜色|Clue colors
接近 / 重合|Close / Overlap
接近/重合|Close / Overlap
答案更大 / 更小|Answer is higher / lower
你的猜测|Your guesses
基本资料 + 5 项生涯指标|Profile + 5 career statistics
点击「效力球队」卡片可查看完整队名。各指标按已核实数据比较，截止日期见下方说明。|Click the Teams card for full team names. Clues use verified records; see coverage dates below.
猜测记录|Guess history
查看本局结果|View round result
复制色块战绩|Copy color-grid result
换一位，再来一局|New player, new round
战绩文本，可手动复制|Result text — copy manually
线索怎么读？|How to read the clues
8 次猜中同一个人。|Find the player in 8 guesses.
属性全绿不等于猜中，最终以球员身份为准。重复或无效提交不扣次数。|Matching every attribute does not mean the player is correct. Duplicate or invalid guesses do not use an attempt.
数值看颜色，也看箭头。|Use the colors and arrows.
相同为绿，接近为黄；↑ 答案更大，↓ 答案更小。黄色范围：出生年|Green means equal, yellow means close. ↑ means higher, ↓ means lower. Yellow tolerance: birth year
位置与球队看集合。|Positions and teams are compared as sets.
位置集合完全相同为绿，有交集为黄。双方球队记录完整且集合相同才为绿；有交集为黄，无交集且记录完整为灰。|Identical positions are green; shared positions are yellow. Teams are green only when both complete sets match, yellow for overlap, and gray when complete records have no overlap.
未知不是零，也不是错误。|Unknown is not zero or wrong.
缺失、口径不一致或不完整记录不能排除时，显示未知，不给箭头。|Missing, incompatible or incomplete evidence produces an unknown clue without an arrow.
查看生涯指标口径|Career-stat definitions
新增指标只采用 NBA/BAA 生涯记录，不将 CBA、欧洲联赛计入同一尺度。缺乏完整来源时保留未知，不用 0 代替。|Career statistics use NBA/BAA records only; CBA and European numbers are not mixed into the same scale. Incomplete evidence remains unknown, never zero.
球队数按实际出场球队去重，同一球队更名或搬迁不重复计数；季后赛和总决赛次数均按实际出场赛季数计，不按场数或仅入选名单；场均得分 = 常规赛总得分 ÷ 总出场；MVP 为常规赛 MVP，不含总决赛 MVP。|Team count uses distinct franchises with actual appearances, consolidating renames and relocations. Playoffs and Finals count seasons actually played, not games or roster selections. PPG = regular-season points / games. MVP excludes Finals MVP.
筛选决定谁能成为答案，不截断下方的生涯统计。数据存在截止年份与覆盖差异，揭晓答案后可查看该球员的范围核验记录。|Filters decide who can be the answer; they do not truncate career statistics. Coverage and cutoff dates vary. After the reveal, you can inspect qualifying appearances.
首赛年是注明联赛首次正式出场的公历年份，如乔丹为 1984；题目范围使用赛季结束年，两者口径不同。|Debut year is the calendar year of the first official appearance in the stated league, e.g. 1984 for Jordan. Filters use season end years instead.
篮球版玩法|A basketball take on the game
参考|Reference
的有限次数、属性提示与每日猜选手机制，独立实现篮球版本。|inspired the limited guesses, attribute clues and daily format of this independently developed basketball game.
NBA 与 CBA 各有现役、历史已收录和简单球星池，另有全球跨联赛池。各范围每日一题，北京时间 00:00 更新；自由练习可换题。单人线索可自选，在线 1v1 固定默认 10 项。|NBA and CBA each offer active, historical and easy-star pools, plus one cross-league pool. Daily rounds reset at 00:00 Beijing time. Practice can be replayed. Single-player clues are customizable; online matches use the default 10.
国际与 CBA 比赛数据仅用于猜球员，不混入 NBA GOAT 评分。单人答案和搜索候选共同遵守当前池、赛季与球队限制；在线对战使用独立选择的球员池。|International and CBA records are used only in the guessing game. Single-player answers and search share the same filters; online matches use a separately selected pool.
查看参考规则来源|View the inspiration and rules
数据、隐私与公平性|Data, privacy and fairness
单人进度只保存在本机浏览器；单人答案在客户端，这是休闲练习。账号、在线对局与天梯存于 Supabase；在线答案由服务器保存，双方可看对手颜色进度，不公开对手猜测名字。产品尚非完整防作弊竞技平台。|Single-player progress stays in this browser, and its answer is client-side. Online accounts, matches and ratings use Supabase. Online answers stay on the server; opponents see color progress, not guessed names. This is not a fully cheat-proof competitive platform.
NBA 历史为快照内实际出场者；CBA 历史仍有来源空缺，现役 CBA 仅核实国内完成注册者。跨联赛池不是全球所有球员。所有名单按快照展示，并非实时信息。|NBA history includes recorded appearances within the snapshot. CBA historical coverage has gaps; active CBA coverage currently verifies domestic registrations. The global pool is not every player worldwide. Rosters are snapshots, not live information.
认识更多球员|Explore more players
游戏设置|Game settings
调整范围和线索，或登录后开始在线对战。|Adjust filters and clues, or sign in to play online.
关闭游戏设置|Close game settings
设置分类|Settings categories
赛季 / 球队|Season / Team
自选线索|Custom clues
本局结果|Round result
关闭本局结果|Close round result
开启下一局 · 刷新页面|Next round · Reload
返回查看猜测|Review guesses
球队经历|Team history
关闭球队经历|Close team history
显示已提交球员的全部已收录球队名称。按 Escape 或关闭按钮返回猜测记录。|All recorded teams for this guessed player. Press Escape or close to return to your guesses.
效力球队数|Teams played for
效力球队|Teams
出生年|Birth year
身高 cm|Height (cm)
首赛年|Debut year
季后赛次数|Playoff seasons
总决赛次数|Finals seasons
场均得分|Points per game
冠军赛季数|Championship seasons
场均助攻|Assists per game
场均篮板|Rebounds per game
场均抢断|Steals per game
场均盖帽|Blocks per game
全明星入选|All-Star selections
请输入 1850–2100 之间的四位年份。|Enter a four-digit year between 1850 and 2100.
开始年份不能晚于结束年份。|The start year cannot be later than the end year.
筛选条件格式不正确。|Invalid filter format.
筛选条件无效，请重新设置。|Invalid filters. Please set them again.
请选择有效的球队。|Please choose a valid team.
缺少可核实数据|No verifiable data
集合完全一致|Identical sets
有重合记录|Records overlap
记录不完整，不能排除|Incomplete records; cannot rule out
无重合记录|No overlapping records
缺少可核实的同口径生涯数据|Comparable verified career data unavailable
联赛统计口径不同或未注明|League definitions differ or are unspecified
统计覆盖不完整，不能准确比较|Incomplete coverage; cannot compare accurately
统计截止赛季不同或未注明|Cutoff seasons differ or are unspecified
首赛年口径不同或未注明|Debut definitions differ or are unspecified
当前范围没有已核实的可出题球员，请调整筛选条件。|No verified eligible players in this range. Adjust your filters.
本局已结束，请查看战绩。|The round is over. View your result.
本局筛选记录无效，请重新开始。|Invalid saved filters. Please start again.
本局记录无效，请重新开始。|Invalid saved round. Please start again.
请选择符合当前赛季和球队范围的有效球员。|Choose a player eligible for the current season and team filters.
已经猜过这位球员，不会扣除次数。|Already guessed. No attempt used.
全部赛季|All seasons
赛季结束年|Season end year
指定球队|Selected team
全部球队|All teams
暂无题目|No question available
进行中|In progress
猜中了|Correct
本局结束|Round complete
一致|Match
接近|Close
不同|No match
未知|Unknown
浏览器不能保存进度，已在当前页面开启下一局，避免刷新丢失题目。|Storage is unavailable. A new round started on this page without reloading.
额外线索数据暂时无法加载，请稍后重试。|Extra clues could not load. Try again later.
额外线索版本已更新，请刷新页面。|Extra clues were updated. Please reload.
最早|Earliest
最新|Latest
未收录球队|Unlisted team
此前球队暂无可核实出场记录|No verified appearances for the previously selected team
待应用|Pending
已应用|Applied
位可出题。|eligible players.
没有符合条件的已核实出场记录，不会从范围外抽取答案。|No verified appearances match. Answers will not be drawn from outside the range.
点击「应用范围」后开始或恢复对应题目。|Select “Apply range” to start or resume this range.
答案和搜索候选都来自这个范围。|Answers and search suggestions both use this range.
设置 · 待应用|Settings · Pending
范围有待应用的修改。请先应用或撤销，再继续猜测；原范围的进度会保留。|You have unapplied changes. Apply or discard them before guessing. Previous progress is preserved.
当前范围没有可出题球员，请调整年份或球队后应用。|No eligible players. Adjust the years or team and apply.
切换候选，回车或点击候选提交；重复猜测不扣次数。|Use suggestions, then press Enter or click to submit. Repeated guesses use no attempts.
本局已结束，可复制战绩，或前往自由练习。|Round complete. Copy your result or start practice.
当前范围没有可核实的出场记录，未生成题目。请调整范围；不会自动放宽条件。|No verified appearances match. Adjust the range; filters will not be relaxed automatically.
范围已应用，已开始或恢复该范围的题目；其他范围的进度仍保留。|Range applied. Your round is ready; progress in other ranges is preserved.
未收录可核实的 NBA/BAA 数据|Verified NBA/BAA data unavailable
截止赛季未收录|Cutoff season unavailable
统计口径未知|Statistical definition unknown
旧进度无法使用，已恢复当前范围的题目；相同日期与范围的每日答案固定。|Old progress could not be used. The current round has been restored; daily answers are fixed for each date and range.
浏览器不允许持久保存；本次打开期间仍可切换球员池，关闭后可能丢失进度。|Persistent storage is blocked. You can switch pools during this visit, but progress may be lost when you close the page.
北京时间已进入新的一天，每日题目已更新。|A new day has started in Beijing. The daily question has updated.
这个范围，暂时没有题目。|No question in this range yet.
漂亮，你找到了。|Nice work. You found the player.
八次用完，看看答案。|Eight guesses used. Here’s the answer.
选一位球员，开始推理。|Pick a player and start narrowing it down.
答案与猜测均来自当前收录球员池。|Answers and guesses use the current recorded pool.
本局范围：|Round range: 
位候选|candidates
本局已结束，输入已锁定。可复制战绩，或前往自由练习。|Round complete. Guessing is locked. Copy your result or start practice.
范围内不足两人，无法换题|At least two eligible players are needed for a new round
同日期、同范围一题 · 北京时间 00:00 更新|One daily question per range · Resets at 00:00 Beijing time
练习换题仍遵守当前范围，不影响每日进度|Practice respects your filters and preserves daily progress
显示全部已收录球队；部分球员履历仍有缺漏。|All recorded teams. Some player histories remain incomplete.
暂无已收录球队。|No teams recorded.
没有满足范围的已核实球员。|No verified players match this range.
可扩大年份或选择其他球队，再点击「应用范围」。|Widen the years or change the team, then apply the range.
资料缺失不等于从未效力；只使用已收录的正式出场证据。|Missing records do not mean a player never played there. Only recorded official appearances qualify.
在当前范围内，从你最熟悉的人开始。|Start with someone you know in this range.
支持中文、英文和常见绰号。|Search in Chinese, English or by a common nickname.
每次猜测留下|Each guess gives you 
项线索，帮你缩小范围。| clues to narrow it down.
的效力球队：| — teams: 
查看全部球队|View all teams
未知 / 不可比较|Unknown / Not comparable
答案数值|Answer value
更大|Higher
更小|Lower
基本资料|Profile
生涯指标|Career statistics
位置未知|Position unknown
首次正式出场）| first official appearance)
口径未收录）|definition unavailable)
已确认球队：|Verified teams: 
记录不完整）|incomplete records)
统计口径与覆盖范围|Definitions and coverage
查看球员档案|View player profile
八次机会已用完|All eight guesses used
当前范围不足两位球员，请返回右上角设置扩大范围。|Fewer than two players qualify. Widen the range in the top-right settings.
每日战绩会保留。下一局将刷新页面，进入同一范围的自由练习。|Your daily result is saved. Next round reloads into practice with the same filters.
刷新页面，保留球员池、赛季/球队范围和自选线索，抽取不同球员。|Reload and draw a different player, keeping your pool, filters and clues.
场已记录出场|recorded appearances
出场来源|Appearance source
为什么符合本局范围？|Why does this player qualify?
以下记录同时满足年份与球队条件。|These records satisfy both the year and team filters.
另外还有|Also 
条符合条件的已记录赛季。|other qualifying season records.
这里仅核验是否实际出场，不代表已收录完整生涯。|This verifies actual appearances, not complete career coverage.
匹配球员已猜过，不会扣除次数；试试其他球员。|Already guessed. Try another player; no attempt used.
这位球员没有符合本局年份与球队条件的已核实出场记录。更改范围后请点击应用。|No verified appearances match this round’s years and team. Apply any range changes before guessing.
当前范围没有匹配姓名。可试中文、英文、常见绰号或调整题目范围。|No matching name in this range. Try English, Chinese, a nickname, or adjust the filters.
请先应用或撤销范围修改，再继续猜测。|Apply or discard filter changes before guessing.
已记录第|Recorded guess 
次猜测，还剩|; remaining: 
本局结束，结果已在弹窗揭晓。|Round complete. The result is in the popup.
请至少保留一项线索。|Keep at least one clue.
先应用有效的题目范围，再输入姓名并选择候选球员。|Apply a valid range, then enter a name and select a player.
当前练习还没结束，确定换题并清空本局记录吗？每日进度不会改变。|This practice round is unfinished. Start a new question and clear this round? Daily progress is preserved.
当前范围内的新练习题已准备好。|A new practice round is ready within this range.
色块战绩已复制，不含答案姓名或球员 ID。|Color-grid result copied, without the answer’s name or ID.
浏览器未允许自动复制，可在下方手动复制战绩。|Clipboard access was blocked. Copy the result manually below.
游戏数据尚未准备好|Game data is not ready
没有可用球员池|No available player pools
按难度与范围选择|Choose difficulty and coverage
跨联赛|Cross-league
缺少可靠来源的字段保留未知；不会推测国籍、球队或职业首年。|Fields without reliable sources remain unknown. Nationality, teams and debut years are not guessed.
点击「效力球队」查看完整队名。常规赛与奖项截至 2025–26；季后赛和总决赛实际出场截至|Click Teams for full names. Regular-season statistics and awards through 2025–26; verified playoff and Finals appearances through 
阵容快照|Roster snapshot
统计补充|Statistics supplement
个球员池 · 点击切换|pools · Click to switch
猜球员题库共|Player database: 
份球员档案，独立于评级页面的默认 300 人名单。|profiles, separate from the 300-player default ranking sample.
题库 v|Database v
本地预览|Local preview
游戏暂时无法载入（|Game could not load (
请检查网络连接，稍后刷新重试。|Check your connection, then reload.
项线索 · 在线对战固定使用默认 10 项。|clues · Online matches use the default 10.
名单核实|Roster verified
多期快照 · 数据包|Multiple snapshots · Data package
见数据说明|See data notes
位 / 本局范围|players / In this round: 
NBA 现役球员|NBA active players
NBA 历史球员|NBA historical players
NBA 简单球星|NBA familiar stars
CBA 现役球员|CBA active players
CBA 历史球员|CBA historical players
CBA 简单球星|CBA familiar stars
全球篮球运动员|Global basketball players
现役 NBA|Active NBA
现役 CBA|Active CBA
历史已收录|Recorded history
简单球星|Familiar stars
语言 / Language|Language
设置|Settings
未收录|Not recorded
每日|Daily
不限|Any
指定|Selected
收录|Recorded
快照|Snapshot
默认|Default
自选|Custom
线索|Clues
范围：|Range: 
至|To
次数|Count
位置|Position
身高|Height
网站|Website
当前|Current
球员|Player
排名|Rank
模型分|Model score
荣誉|Awards
数据|Data
赛季|Season
截至|Through
全部|All
位| players
人| players
项| items
次| times
分| points
场| games
名| place
第|#
池| pool
年| years
秒|s
。|.
，|, 
：|: 
；|; 
？|?
！|!
（| (
）|)
「|“
」|”
、| / 
`.trim().split('\n').map(line => { const i = line.indexOf('|'); return [line.slice(0,i), line.slice(i+1)]; }));

Object.assign(ENGLISH,Object.fromEntries(`
最新猜测在最上方|Newest guesses first
小抄辅导|Clue notebook
关闭小抄|Close clue notebook
只汇总你已猜出的线索，不读取隐藏答案。未知数据不用于排除；黄色集合表示至少重合一项，不代表全部拥有。|Summarizes only your revealed clues, without looking up the answer. Unknown data excludes nothing. Yellow sets mean at least one shared item, not every item.
先猜一位球员，小抄会自动整理可用的约束。|Make a guess to start collecting constraints here.
已汇总|Summarized: 
次猜测。数值范围同时结合颜色、箭头和接近阈值。| guesses. Numeric ranges combine colors, arrows and closeness thresholds.
完整集合：|Exact set: 
已匹配：|Matched: 
范围已收敛：|Inferred value: 
至少一项来自：|At least one of: 
已排除：|Excluded: 
尚无可用约束|No usable constraint yet
条有效反馈|usable clues
条未知，未用于排除|unknown clues, not used to exclude
不同集合条件需要分别满足。数值按游戏的浮点容差计算，显示最多五位小数；这不是候选球员名单，也不额外透露答案。|Each set condition must be satisfied separately. Ranges use the game’s floating-point tolerance and show up to five decimal places. No candidate list or extra answer information is revealed.
放弃本局 · 揭晓答案|Give up · Reveal answer
放弃本局并揭晓答案？|Give up and reveal the answer?
本局会记为已放弃，不能继续猜测。每日题目不会重置，你可以在揭晓后开始自由练习。|This round will be recorded as given up and guessing will end. The daily question will not reset. You can start practice after the reveal.
继续猜测|Keep guessing
确认放弃 · 查看答案|Give up · Show answer
已放弃 · 答案揭晓|Given up · Answer revealed
已放弃本局，答案已揭晓。|You gave up. The answer has been revealed.
已放弃|Given up
在线对战 · 2–5 人 · 账号与天梯|Multiplayer · 2–5 players · Accounts & ladder
正在连接…|Connecting…
2–5 人同题，默认 10 项线索、8 次机会、180 秒。先猜中者获胜；无人猜中则平局。若其余人退出，最后留场者获胜。可看每位对手的次数和颜色进度，不公开猜过的名字。好友房不计积分。|2–5 players, one answer, 10 clues, 8 guesses and 180 seconds. First correct guess wins; no correct answer is a draw. The last player remaining wins if everyone else leaves. See opponents’ attempts and colors, not guessed names. Friend rooms are unrated.
注册账号|Create account
注册 · 实时对战 · 天梯|Registration · Live matches · Ladder
登录已过期，请重新登录。|Session expired. Please sign in again.
邮箱仅用于账号认证；昵称、积分和天梯战绩会在排行榜展示。单人玩法继续无需登录。|Email is used for authentication. Display names, ratings and ranked results appear on the leaderboard. Single player needs no account.
当前不验证邮箱归属，暂未开通邮件找回，请妥善保存密码。昵称、积分和天梯战绩会公开展示。单人玩法无需登录。|Email ownership is not verified and email password recovery is unavailable. Keep your password safe. Display names, ratings and ranked results are public. Single player needs no account.
邮箱仅用于账号登录；暂未开通邮件找回，请妥善保存密码。昵称、积分和天梯战绩会公开展示。单人玩法无需登录。|Email is used to sign in. Email password recovery is unavailable; keep your password safe. Display names, ratings and ranked results are public. Single player needs no account.
邮件找回暂未开通，请妥善保存密码|Email recovery is unavailable. Keep your password safe.
初始 1000 分，胜者与每位对手结算，K=24 按对手数分摊；积分转移零和，无人获胜时本局积分不变。仅统计已结算天梯对局。|Start at 1000. The winner is rated against each opponent, with K=24 divided across opponents. Transfers are zero-sum; no winner means no rating change. Only settled ranked matches count.
匹配采用所有成员勾选人数的交集，优先凑齐最小共同人数。只勾选 5 人会等待满 5 人。|Matching uses the sizes everyone accepts, starting at the smallest shared size. Select only 5 to wait for five players.
天梯匹配人数 · 可多选|Ranked match size · Select one or more
浏览器不能保存下一局设置，请返回大厅重新匹配。|Next-round preferences could not be saved. Return to the lobby to match again.
下一局将刷新页面，并按相同球员池和人数选择重新匹配。|Next round reloads and queues with the same pool and accepted sizes.
下一局将刷新页面并创建同人数好友房，需要重新分享房间码。|Next round reloads and creates a friend room of the same size. Share the new room code.
网页与对战题库版本不同，请刷新网页；仍不一致时请等待题库更新。|The page and online database versions differ. Reload, or wait for the database update.
先猜中获胜；八次用完需等待其他玩家或倒计时结束；刷新可恢复本局。|First correct guess wins. After eight guesses, wait for others or the timer. Reloading resumes this match.
退出后不能继续猜测；其他玩家可继续，天梯按最终赛果结算。确定退出？|Leaving ends your guesses; other players continue, and ranked results still count. Leave this match?
退出后不能继续猜测，天梯仍按最终赛果结算，确定退出？|You cannot guess after leaving, and ranked results still count. Leave?
请至少选择一种对战人数。|Select at least one match size.
服务暂时无法连接|The service is temporarily unavailable
已登录，可以匹配或创建好友房。|Signed in. Join a match or create a friend room.
注册已提交，请打开邮箱中的确认链接，再登录。|Registration submitted. Open the email confirmation link, then sign in.
昵称需为2–24个可显示字符|Use 2–24 visible characters for your display name
项目仍要求邮箱确认，但公开注册邮件服务尚未开通。已有账号可登录，单人玩法无需账号。|Email confirmation is required, but public registration emails are not configured. Existing accounts can sign in; single player needs no account.
云端多人升级尚未完成，当前只开放 2 人对战。|The cloud multiplayer upgrade is pending. Only two-player matches are available.
连接暂不可用|Connection unavailable
在线服务暂未连通：|Online service unavailable: 
单人玩法不受影响。|Single player is unaffected.
对战已连接 · 注册待配置|Matches connected · Registration pending
注册待开放|Registration pending
人可用 · 多人待升级|players available · Upgrade pending
还没有已结算的天梯战绩。|No settled ranked results yet.
进度暂未同步：|Progress sync delayed: 
等待凑齐人数|Waiting for players
等待凑齐|Waiting for 
人，同一账号可刷新恢复等待。|players. Reloading with the same account resumes the queue.
推理中|Thinking
次数已用完|No guesses left
已猜中|Found the answer
等待已取消。|Waiting cancelled.
对手获胜|Opponent won
你赢了！|You won!
本局平局|This round is a draw
好友房不计积分|Friend room · Unrated
积分变化|Rating change
已退出。|You left the match.
昵称已保存。|Display name saved.
请先输入有效邮箱|Enter a valid email first
重置邮件已申请，请查看邮箱。|Reset email requested. Check your inbox.
密码已更新。|Password updated.
在线对战正在开通|Online play is being configured
对局结束|Match complete
关闭对局结果|Close match result
下一局 · 刷新页面|Next round · Reload
查看对局记录|Review match history
查看对局结果|View match result
天梯排行榜|Ranked leaderboard
刷新排行榜|Refresh leaderboard
对战球员池|Match player pool
天梯匹配|Find ranked match
好友房人数|Friend room size
创建好友房|Create friend room
好友房间码|Friend room code
6 位房间码|6-character room code
加入房间|Join room
猜哪位球员？|Who is your guess?
中文、英文或绰号|English / Chinese name or nickname
提交猜测|Submit guess
取消 / 退出本局|Cancel / Leave match
返回大厅|Back to lobby
取消等待|Cancel queue
退出本局|Leave match
登录|Sign in
邮箱|Email
密码|Password
昵称|Display name
忘记密码|Forgot password
退出登录|Sign out
保存昵称|Save display name
设置新密码|Set new password
更新密码|Update password
已登录|Signed in
已退出|Left
房间码|Room code
好友房|Friend room
天梯|Ranked
平局|Draw
答案：|Answer: 
默认 10 项线索|Default 10 clues
名次|Rank
玩家|Player
积分|Rating
胜 / 负 / 平|W / L / D
大师|Master
钻石|Diamond
黄金|Gold
白银|Silver
青铜|Bronze
你 · |You · 
常规赛表现|Regular-season performance
职业生涯常规赛的得分、组织、篮板、效率和时代内表现。|Career scoring, playmaking, rebounding, efficiency and era-relative performance.
巅峰统治力|Peak dominance
最强 1、3、5、7 个赛季的综合表现；更看重最高水平。|Performance over the best 1, 3, 5 and 7 seasons, emphasizing the highest level reached.
生涯长度|Longevity
出场、时间、精英赛季和累计贡献；更看重长期积累。|Games, minutes, elite seasons and accumulated contributions over a career.
季后赛表现|Playoff performance
季后赛出场、巅峰、时代内表现、胜场与效率；资料覆盖截至 2024 年。|Playoff appearances, peak performance, era-relative results, wins and efficiency. Coverage through 2024.
个人荣誉|Individual awards
最佳阵容和其他个人荣誉。|All-NBA selections and other individual awards.
防守贡献|Defensive contribution
防守贡献指标、防守奖项与防守最佳阵容；历史记录覆盖不同。|Defensive metrics, awards and All-Defensive selections. Historical coverage varies.
团队成就|Team achievements
总冠军与总决赛经历；不是个人能力的直接因果指标。|Championships and Finals experience; not a direct causal measure of individual ability.
常规赛|Regular season
季后赛|Playoffs
巅峰|Peak
长青|Longevity
防守|Defense
冠军|Championships
上升|Rise
下降|Fall
名次不变|Rank unchanged
提高|Increase
降低|Decrease
系数数值|Coefficient value
系数|Coefficient
其他系数保持不变：|Other coefficients unchanged: 
相对|relative to 
的分差| score gap
改善|Improve
恶化|Worsen
季后赛数据源截至 2023–24，现役者不是完整生涯|Playoff source through 2023–24; active players have incomplete career coverage
常规赛数据源截至 2025–26；按球员实际记录末赛季展示|Regular-season source through 2025–26; each player’s last recorded season is shown
荣誉/球队快照，来源更新截止不同，主要截至 2025–26；不是实时统计|Awards/team snapshots have different cutoffs, mostly through 2025–26; not live statistics
球员库 / 常规赛汇总（Sumitrodatta NBA / BAA 数据）|Player Library / Regular-season aggregate (Sumitrodatta NBA/BAA data)
球员库 / 季后赛生涯汇总（多来源，截止 2024）|Player Library / Career playoff aggregates (multiple sources, through 2024)
汇总|aggregate
逐场累计总量 ÷ 对应出场数；拒绝指标场次覆盖不完整的数据。|Recorded totals divided by corresponding games. Metrics with incomplete game coverage are excluded.
按该项有记录赛季的出场数加权汇总；部分来源为重建/舍入的场均数，因此是近似值，不视为完整生涯。|Weighted by games in recorded seasons. Some source averages are reconstructed or rounded; these are approximate, not necessarily full-career figures.
真实命中率：PTS ÷|True shooting: PTS /
未做时代或角色调整。|Not adjusted for era or role.
直接使用档案中的次数；次数 0 是已记录值，不把缺失改为 0。|Uses recorded counts directly. Zero is a recorded value; missing data is not replaced with zero.
始于 1955–56，早期球员没有相同获奖机会。|Introduced in 1955–56; earlier players had different award opportunities.
始于 1969，之前的总决赛没有该奖项；未做奖项机会校正。|Introduced in 1969. Earlier Finals had no such award; award opportunities are not adjusted.
始于 1982–83，早期球员没有相同获奖机会。|Introduced in 1982–83; earlier players had different award opportunities.
缺失时贡献为 0（中性填补），不是原始统计为 0；所有已启用项均缺失则不评分。|Missing data contributes zero neutrally; the underlying statistic is not zero. No score is assigned if every enabled input is missing.
常规赛场均得分|Regular-season PPG
常规赛场均助攻|Regular-season APG
常规赛场均篮板|Regular-season RPG
常规赛真实命中率|Regular-season TS%
季后赛场均得分|Playoff PPG
分 / 场|points / game
次 / 场|assists / game
个 / 场|rebounds / game
比例（显示为百分比）|ratio (displayed as a percentage)
常规赛 MVP 次数|Regular-season MVP awards
总决赛 MVP 次数|Finals MVP awards
最佳防守球员次数|DPOY awards
最佳阵容次数|All-NBA selections
总冠军次数|Championships
不推断队内贡献|does not infer contribution within the team
各阵合计|all teams combined
荣誉综合积分（固定子权重）|Combined awards score (fixed internal weights)
约定荣誉点|conventional award points
子权重为固定产品约定，用户只调整外部系数|internal weights are fixed conventions; users adjust the outer coefficient
任一组成次数缺失，整个模块中性贡献 0。|If any component is missing, the entire module contributes zero neutrally.
巅峰 × 季后赛协同|Peak × Playoff interaction
协同指数点|interaction index points
常规赛 × 生涯长度协同|Regular season × Longevity interaction
巅峰与季后赛|Peak and playoffs
基础统计与荣誉 · 自由组合|Statistics & awards · Build your model
可选协同项 · 明确的非线性偏好|Optional interactions · Nonlinear preferences
模块定义、标准与来源|Module definition, scale and sources
实际参与计分：|Active scoring terms: 
球员库未载入，原始统计模块将显示缺失|Player Library unavailable; raw-stat modules will show missing data
信息重叠提醒|Overlapping information
多维得分图|Score breakdown charts
高级自选模块模型|Advanced custom-module model
基础七维加性模型|Base seven-dimension additive model
未评分|Unscored
七维数据画像|Seven-dimension profile
本次模块的公式与数据截止|Module formulas and data cutoffs
查看原始统计和球员背景|View raw statistics and player background
我的高级模块模型|My advanced model
计算公式|Formula
定义 / 原始单位|Definition / Raw unit
单位：|Unit: 
来源与截止|Sources and cutoffs
缺失处理|Missing-data treatment
已选择的新模块标准|Definitions of selected modules
下载完整模型 JSON|Download full model JSON
的得分图| score chart
的多维得分图| multidimensional score chart
人公开排序|players in published ranking
项已知顺序 · 非本人公式|known pairwise orders · Not the analyst’s own formula
复现|Reproduces 
不使用个人榜单拟合，以七维人工均衡权重为起点。你可以自由调整。|Starts with balanced, manually chosen coefficients across seven dimensions, without fitting a personal ranking.
加性模型分 · 查看图解|Additive score · View charts
位匹配|matches
没有找到球员，试试英文姓名。|No player found. Try an English name.
收起为前 20 位|Show top 20
展开全部|Show all 
不足 0.01|less than 0.01
已启用的项都没有观测数据，暂不评分。|No observed data for the enabled terms. This player is unscored.
可以切换维度系数，或查看球员的数据覆盖。|Change the dimensions or inspect this player’s data coverage.
并列不代表独占领先；全零系数只得到相同基准分。|A tie is not an outright lead; zero coefficients give everyone the same baseline.
显示分数已舍入，按完整精度排序。|Scores shown are rounded; ranks use full precision.
建议按同一套公式重新计算。|Suggestions recalculate using the same formula.
用户添加档案：部分指数可能未计算；可在高级模式使用有记录的原始统计。|User-added profile: some indices are not calculated. Verified raw statistics are available in advanced mode.
项使用中性填补，建议结合背景数据解读。|terms use neutral imputation. Interpret them alongside the background data.
已启用的数据维度均有观测值。|All enabled dimensions have observed data.
当前启用项都没有可评分数据，不为缺失值生成优化建议。可查看原始档案，并在高级模式启用有记录的统计模块。|No enabled terms have usable data, so optimization advice is unavailable. Inspect the profile and enable recorded statistics in advanced mode.
高级模式已启用：排名、分数与图表使用当前模块组合实时重算。基础七维的自动建议 / 联合搜索在此模式暂停，避免用另一套公式给出建议；请手动调节模块，或关闭高级模式恢复。|Advanced mode recalculates rankings and charts using your selected modules. Base-model automatic suggestions are paused. Adjust modules manually or leave advanced mode to restore suggestions.
改善相对分差|Improve relative score gap
其他系数不变 · 预计第|Other coefficients unchanged · Estimated rank 
单项系数调整|Single-coefficient change
尚未找到改善，可尝试联合搜索。缺失数据下的改善需谨慎解读。|No improvement found yet. Try a joint search. Interpret improvements cautiously when data is missing.
全部数据系数为 0；|All data coefficients are zero; 
只启用大众参考项。|only the consensus term is enabled.
所有球员得到相同的 50 分基准。|all players receive the same 50-point baseline.
我的加性评级模型|My additive scoring model
一条可逐项相加的公式|A formula with independent additive terms
缺失 → 中性填补|Missing → Neutral imputation
未入榜 → 中性填补|Unlisted → Neutral imputation
缺失值与大众参考|Missing data and consensus
拟合起点与当前结果|Fitted starting point and current results
均衡加性模型|Balanced additive model
已个人化修改。|Customized.
未修改。|Unchanged.
当前前三：|Current top three: 
查看该球员背景与入选依据|View this player’s background and selection criteria
查看拟合依据|View fitting evidence
加性拟合依据|Additive fitting evidence
公开名次|Published rank
样本内名次|Rank within sample
全池名次|Rank in full pool
新模型怎么拟合|How the model is fitted
查看数据覆盖与入选范围|View data coverage and selection scope
证据与出处|Evidence and sources
独立加性模型|Independent additive model
覆盖范围|Coverage
本地保存与分享|Local saving and sharing
已导出加性系数、公式与来源。|Exported coefficients, formulas and sources.
这是本地预览链接，需运行本地服务；对外分享请使用线上网站生成链接。|This is a local preview link. Use the public website to generate a link for others.
分享此链接，对方即可还原这组系数；不包含你的猜球员进度。|Share this link to restore these coefficients. It does not include your game progress.
已复制。|Copied.
高级模式下请手动调整模块；基础自动搜索已暂停。|Adjust modules manually in advanced mode; base automatic search is paused.
正在检验候选系数…|Checking candidate coefficients…
本次有限搜索未找到改进。你可以降低大众参考系数或继续手动探索。|This finite search found no improvement. Lower the consensus coefficient or keep exploring manually.
名次未变，领先优势扩大。|Rank unchanged; lead increased.
名次未变，相对分差改善。|Rank unchanged; relative gap improved.
这是一组可行方案，并非已证明的最小改动。|This is a feasible option, not a proven minimum change.
应用这组系数|Apply these coefficients
已应用搜索系数，可在「我的模型」查看。|Coefficients applied. View them in “My model”.
均衡起点 · 自由探索|Balanced starting point · Explore freely
已迁移旧设置为独立系数；缺失项改用中性填补，结果可能变化。|Old settings migrated to independent coefficients. Neutral missing-data treatment may change results.
无法读取模型链接，已保留当前起点。|Could not read the model link. Your current starting point is preserved.
高级模块 · 独立加性模型|Advanced modules · Additive model
独立系数 · 个人模型|Independent coefficients · Custom model
评论员加性拟合|Fitted analyst model
均衡加性起点|Balanced additive starting point
原始统计|Raw statistics
默认评级样本|Default ranking sample
七维可用|Dimensions available
七维未计算；可用原始模块|Indices not calculated; raw-stat modules available
把你想讨论的球员加入进来|Add the players you want to compare
添加 / 管理球员|Add / Manage players
添加你想比较的球员|Add players to your comparison
关闭添加球员|Close player selection
默认样本保留不动；加入的球员会同步到排名实验室和球员库。未计算的七维指数保持缺失，可在高级模式使用已核实的原始统计模块。|Your selections are shared between the Lab and Library. Uncalculated indices remain missing; verified raw-stat modules are available in advanced mode.
位不变；从有出处的扩展档案中自选，不手填虚构数据。|original players retained. Add from sourced profiles rather than entering invented data.
中文名 / 英文名 / 绰号 / 球队|Chinese / English name / Nickname / Team
从扩展档案中找一位球员|Find a player in the expanded library
只看我添加的球员|Show only my added players
浏览器存储不可用，仅本次页面有效。|Browser storage unavailable. Changes last for this page only.
只在当前浏览器保存；两个页面共用同一份选择。|Saved in this browser and shared between the two pages.
扩展球员档案载入失败，请稍后重试（HTTP|Expanded profiles could not load. Try again later (HTTP
扩展档案没有可用球员。|No usable players in the expanded library.
这是一位扩展档案球员，请确认资料后点击「加入比较」。|This is an expanded profile. Review it, then select “Add to comparison”.
档案与来源|Profile and sources
默认保留|Included by default
加入比较|Add to comparison
移除|Remove
没有匹配的档案。试试英文姓名；没有可靠档案的球员不能自行编造添加。|No matching profile. Try the English name. Players without reliable records cannot be invented.
正在按需载入扩展档案…|Loading expanded profiles…
这个球员 ID 不在已核实扩展档案中；没有添加或伪造资料。|This ID is not in the verified library. No profile was added or invented.
默认球员仍可使用。关闭后重新打开可重试。|Default players remain available. Close and reopen to retry.
其他标签的球员选择暂未载入；请打开添加球员重试。|Selections from another tab could not load. Open player selection to retry.
保存不可用，仅本页有效。|Saving unavailable; changes apply to this page only.
中文译名未核实，保留原文姓名。|Chinese translation unverified; original name retained.
英文姓名未核实，保留原文姓名。|English name unverified; original name retained.
用户可添加的扩展球员；原300人的分数与媒体模型不改变。|Expanded player profile. The original 300-player scores and fitted analyst models are unchanged.
扩展基础分沿用原七维定义和原300人固定分位参照；这里尚未计算季后赛维度，显示未知，不是0。|Expanded indices use the original seven definitions and fixed 300-player reference distribution. The playoff dimension has not been calculated here and remains unknown, not zero.
团队成就沿用既有模型的冠军/总决赛球队赛季归属定义，不等同于球员实际在总决赛出场；猜球员次数则另用实际出场证据。|Team achievement uses the existing champion/finalist team-season definition. This does not prove a player appeared in the Finals. Guess the Player counts use separate appearance evidence.
部分历史基础数据缺失：场均展示有记录比赛口径，指标覆盖场次可查；覆盖不足的原始场均模块不会评分。|Some historical statistics are missing. Averages use recorded games, with coverage available for inspection. Raw-average modules remain unscored when coverage is insufficient.
官方当前名单登记，但没有可核实NBA/BAA常规赛历史出场记录；不以注册名单制造统计，基础评分暂为未知。|Listed on an official current roster, with no verified NBA/BAA regular-season appearances. Roster membership does not create statistics; base scores remain unknown.
未核实|Unverified
已核实的跨联赛实际出场|Verified cross-league appearances
实际出场赛季数；不含附加赛。|Seasons with actual appearances; play-ins excluded.
Finals实赛赛季数，不计DNP。|Finals seasons with actual appearances; DNPs excluded.
EuroLeague 官方比赛资料中的两队精选；出生年、身高、位置及球队按 2025-09-30 登记。|A selection from two teams in official EuroLeague game records. Birth year, height, position and team were recorded on 2025-09-30.
不是完整履历；首个职业赛季、国家/地区未收录。部分球员曾打 NBA，但不在原 GOAT 300 人目录中。|This is not a complete career record. Professional debut and country/region are unrecorded. Some players have NBA experience but were outside the original 300-player GOAT sample.
球队数、季后赛/总决赛次数、常规赛场均分及MVP缺少同联赛完整生涯记录，均保留未知；单队档案不能当作只效力过一队。|Team counts, playoff/Finals seasons, regular-season scoring average and MVP totals remain unknown without complete same-league career records. A single-team profile does not prove a one-team career.
仅有明确赛季、球队及正出场数/比赛表现的记录才能筛选；登记名单和档案年份不算出场。资料为部分历史记录，未收录不等于未效力。|Filters use records with an explicit season, team and positive appearances or game performance. Registrations and profile-page years do not prove appearances. Historical coverage is partial; missing records do not prove a player never played there.
原始首秀日期与 NBA/BAA 首个赛季不一致或缺失（可能是 ABA 首秀），因此本游戏首赛年暂置未知。|The recorded debut date conflicts with or is missing from the first NBA/BAA season and may refer to the ABA. The game's debut-year field remains unknown.
官方国内注册名单已核实，尚无匹配的生涯档案；未知资料不编造。|Official domestic registration is verified, but no matching career profile is available. Missing information is not invented.
注册记录不转换为出场证据，因此限定实际出场年份/球队的题目不会抽到无出场资料者。|Registration is not converted into appearance evidence. Players without appearance records are excluded from questions filtered by actual years or teams played.
未取得完整同口径生涯统计；未知不是零。|Complete career statistics using a comparable definition are unavailable. Unknown does not mean zero.
公开赛季索引与个人历史表，不以注册或生涯连续区间补齐出场。|Public season indexes and individual history tables; registrations or uninterrupted career ranges are not used to fill appearance gaps.
两个新浪档案经完整姓名与完整出生日期|Two Sina profiles were matched using the full name and complete date of birth,\u0020
核对为同一人，显式合并。|, and explicitly merged as the same person.
非官方新浪档案；页面赛季：|Unofficial Sina profile; page season:\u0020
。球队记录不完整，不代表当前注册名单。|. Team records are incomplete and do not represent current registrations.
首个职业赛季未核实，保持未知；不以最早收录赛季冒充首秀。|The professional debut season is unverified and remains unknown. The earliest recorded season is not assumed to be the debut.
重复档案身高冲突，未选边或取平均，保留未知。|Duplicate profiles disagree on height. Neither value is selected or averaged; height remains unknown.
未取得完整可比生涯资料，未知不是 0。|Complete comparable career records are unavailable. Unknown does not mean zero.
NBA/BAA 生涯球队另补已核实的 CBA 上海；首赛年仍只指 NBA/BAA 首次正式出场年。|The NBA/BAA team history also includes verified CBA Shanghai appearances. Debut year still refers to the first official NBA/BAA appearance.
CBA 上海记录来自 NBA 官方回顾；跨联赛球队集合不宣称完整。|CBA Shanghai evidence comes from an official NBA retrospective. The cross-league team list is not claimed to be complete.
NBA/BAA实际常规赛赛季与原始球队同行连接，g>0且排除合计行；不以生涯年份补齐中断。 姚明CBA目前只逐条核实2001–02上海赛季，其他CBA年份不推断。|NBA/BAA regular-season appearances link season and team on the same row, with g>0 and total rows excluded. Career gaps are not filled. Yao Ming's CBA evidence currently verifies only Shanghai in 2001–02; other CBA years are not inferred.
NBA.com当前名单登记；未与历史正出场快照核实连接，不能据名单推断已出场赛季、首秀或生涯累计数据。|Listed on NBA.com's current roster without a verified link to historical positive-appearance records. Roster membership cannot establish seasons played, debut or career totals.
CNTV2011东莞报道在同场称约什与阿克格农，补足档案简称；完整DOB1986-02-10吻合。|A 2011 CNTV Dongguan report links the short and full names in the same game. The complete date of birth, 1986-02-10, also matches.
新浪身高183cm与NBA档案180cm存在差异，未平均或据此另造身份。|Sina records 183 cm while the NBA profile records 180 cm. These are not averaged or treated as separate identities.
新浪身高203cm与NBA档案198cm存在差异，未平均或据此另造身份。|Sina records 203 cm while the NBA profile records 198 cm. These are not averaged or treated as separate identities.
新浪身高203cm与NBA档案206cm存在差异，未平均或据此另造身份。|Sina records 203 cm while the NBA profile records 206 cm. These are not averaged or treated as separate identities.
新浪身高211cm与NBA档案208cm存在差异，未平均或据此另造身份。|Sina records 211 cm while the NBA profile records 208 cm. These are not averaged or treated as separate identities.
杭州日报采访浙江俱乐部总经理确认前篮网中锋约什·布恩2010年签约，报道1984年出生、208cm和2006年第23顺位，与NBA身份及新浪浙江2011–13出场履历吻合。新浪生日1984-11-18与NBA1984-11-21冲突，未采用新浪生日。|A Hangzhou Daily interview with Zhejiang's general manager confirms former Nets center Josh Boone signed in 2010. His reported birth year (1984), height (208 cm) and 2006 draft pick (23) match the NBA identity and Sina's Zhejiang appearances in 2011–13. Sina's birth date of 1984-11-18 conflicts with the NBA's 1984-11-21 and is not used.
ESPN确认Carlos Boozer加盟广东，匹配新浪广东出场、1981出生年和206cm；新浪未提供完整生日。|ESPN confirms Carlos Boozer joined Guangdong, matching Sina's team appearances, 1981 birth year and 206 cm height. Sina does not provide a full birth date.
与1989年出生的MarShon Brooks是不同球员。|A different player from MarShon Brooks, who was born in 1989.
与1985年出生的Aaron Brooks是不同球员。|A different player from Aaron Brooks, who was born in 1985.
新浪生日缺失；掘金官方报道的2011–12广厦履历与新浪档案对应，不与Tyson Chandler合并。|Sina has no birth date. An official Nuggets report of the 2011–12 Guangsha stint matches the profile. This identity is not merged with Tyson Chandler.
新浪仅有出生年；太阳官方签约公告明确Jimmer Fredette曾效力上海，与上海个人档案对应。|Sina lists only the birth year. An official Suns signing announcement confirms Jimmer Fredette's Shanghai stint, matching the individual profile.
阿奇-古德温旧档案缺生日；与新档案7628完整译名对应，后者经完整生日确认NBA Archie Goodwin。没有基于Goodwin姓氏泛化合并。|The older Archie Goodwin profile has no birth date. Its full translated name matches profile 7628, whose complete birth date verifies the NBA identity. The merge is not based on the surname alone.
新浪仅有出生年；快船官方签约公告确认Lester Hudson的辽宁CBA履历。|Sina lists only the birth year. An official Clippers signing announcement confirms Lester Hudson's CBA career with Liaoning.
公开报道确认Al Jefferson效力新疆，匹配新浪完整译名、1985出生年和208cm，不与Cory Jefferson合并。|Published reporting confirms Al Jefferson played for Xinjiang, matching Sina's full translated name, 1985 birth year and 208 cm height. He is not merged with Cory Jefferson.
原候选Joe Alexander错误，已纠正为Alexander Johnson。辽宁日报报道明确亚历山大·约翰逊2012年加盟辽宁、身高206cm，匹配新浪1983-02和辽宁2012–13履历；另有2009年加盟东莞报道对应其东莞首段记录。新浪具体生日缺失保持不补造。|The incorrect Joe Alexander candidate was corrected to Alexander Johnson. Liaoning Daily confirms Johnson joined Liaoning in 2012 at 206 cm, matching Sina's February 1983 birth record and 2012–13 appearances. Separate 2009 reporting confirms the earlier Dongguan stint. Sina's missing birth-day value remains missing.
奇才官方公告确认Ty Lawson山东履历，匹配新浪完整译名、1987出生年及山东出场。|An official Wizards announcement confirms Ty Lawson's Shandong stint, matching Sina's full translated name, 1987 birth year and team appearances.
新浪仅有出生年；NBA官方报道明确Jeremy Lin加盟北京首钢，与中文姓名及北京出场档案交叉核验。|Sina lists only the birth year. Official NBA reporting confirms Jeremy Lin joined Beijing, cross-checked against his Chinese name and Beijing appearance records.
FIBA明确OJ Mayo效力辽宁，匹配新浪辽宁出场及1987出生年，不根据Mayo姓氏单独推断。|FIBA confirms O.J. Mayo played for Liaoning, matching Sina's appearances and 1987 birth year. The identity is not inferred from the surname alone.
格雷格·门罗与旧档案7487完整译名、出生年及208cm一致；新档案生日为6月3日，旧档案与NBA为6月4日。显式合并同人但保留生日冲突。|Greg Monroe matches profile 7487 by full translated name, birth year and 208 cm height. The newer profile lists June 3; the older profile and NBA list June 4. The identity is merged while the birth-date conflict is retained.
湖人官方选秀介绍确认Emmanuel Mudiay在广东出战12场，匹配新浪穆迪埃2014–15广东12场记录。新浪生日缺失，保持缺失；NBA生日采用本地身份档案。新浪196cm与NBA档案190cm有差异，不将身高作为决定性证据。|An official Lakers draft profile confirms Emmanuel Mudiay played 12 games for Guangdong, matching Sina's 2014–15 record. Sina's missing birth date remains missing; the NBA birth date uses the existing identity profile. Sina's 196 cm height conflicts with the NBA profile's 190 cm and is not decisive identity evidence.
NBA官方报道确认Greg Oden在中国打球；新浪完整译名、1988年1月出生与NBA身份对应。|Official NBA reporting confirms Greg Oden played in China. Sina's full translated name and January 1988 birth record match the NBA identity.
鹈鹕官方签约公告确认Josh Smith的四川履历，匹配新浪完整译名、1985出生年和206cm。|An official Pelicans signing announcement confirms Josh Smith's Sichuan stint, matching Sina's full translated name, 1985 birth year and 206 cm height.
独立签约报道确认掘金后卫J.R. Smith在2011–12赛季加盟浙江；与该档案32场浙江出场记录相符。新浪生日1985-11-09与NBA档案1985-09-09冲突，身份核验依靠明确全名和球队履历，不将新浪日期当作生日证据。|Independent signing coverage confirms Nuggets guard J.R. Smith joined Zhejiang in 2011–12, matching the 32-game record. Sina's birth date of 1985-11-09 conflicts with the NBA's 1985-09-09. Identity uses the explicit full name and team history; Sina's date is not treated as birth-date evidence.
中新网报道确认2002年NBA第9顺位斯塔德迈尔在2019年11月为福建完成CBA首秀，与档案完整中文姓名及2019–20赛季索引福建记录对应。新浪生日缺失，不补造源字段；NBA身份档案生日1982-11-16。|China News Service confirms the 2002 NBA No. 9 pick Stoudemire made his CBA debut for Fujian in November 2019, matching the full Chinese name and 2019–20 index. Sina's missing birth date is not filled; the NBA identity profile records 1982-11-16.
新浪新档案将生日记为7月7日，旧档案7002与NBA均为7月8日；完整姓名别名、1986出生年、198cm及广东履历对应同人，保留冲突，不覆盖生日。|The newer Sina profile gives July 7; profile 7002 and the NBA give July 8. Full-name aliases, 1986 birth year, 198 cm height and Guangdong history identify the same player. The conflict is retained without overwriting the birth date.
新华社现场报道明确邦奇·威尔斯为前NBA火箭球员并在山西队，匹配新浪2008–09山西履历和完整中文姓名。NBA官方球员档案确认1976-09-28；新浪1976-09-20有冲突，未以该日期证明身份。|Xinhua's on-site reporting identifies former Rockets player Bonzi Wells at Shanxi, matching the 2008–09 record and full Chinese name. His official NBA profile gives 1976-09-28; Sina's conflicting 1976-09-20 date is not used to establish identity.
原候选Terrence Williams错误，已明确纠正为Marcus Williams。新浪别名含马库斯，完整生日1986-11-18匹配NBA willima04，且报道确认其2009–10浙江及2010年重返浙江履历。排除1985年出生的同名后卫willima03。新浪198cm与NBA201cm有差异。|The incorrect Terrence Williams candidate was corrected to Marcus Williams. Sina's alias and complete birth date, 1986-11-18, match NBA ID willima04; reporting confirms his 2009–10 Zhejiang stint and 2010 return. The namesake guard born in 1985 (willima03) is excluded. Sina gives 198 cm and the NBA gives 201 cm.
原候选Shawne Williams错误，已纠正为Sean Williams。海峡都市报报道确认前篮网球员肖恩·威廉姆斯2010年加盟福建；新浪1986-09及福建2010出场记录匹配该身份，不是同姓直接合并。新浪缺具体日保持不补造。|The incorrect Shawne Williams candidate was corrected to Sean Williams. Haixia Metropolis Daily confirms the former Nets player joined Fujian in 2010, matching Sina's September 1986 birth record and 2010 appearances. This is not a surname-only merge. Sina's missing birth-day value remains missing.
独立转会报道明确前NBA五号秀谢尔顿·威廉姆斯加盟天津，补足档案仅姓氏的歧义。|Independent transfer reporting identifies former NBA No. 5 pick Shelden Williams joining Tianjin, resolving the profile's surname-only ambiguity.
摩西·赖特与已核实7470为同一完整译名；新档案生日1970-01-01是明显占位值，身高206cm与NBA对应，不把占位日期写入背景字段。|Moses Wright matches verified profile 7470 by full translated name. The newer birth date, 1970-01-01, is a placeholder; the 206 cm height matches the NBA record. The placeholder is not used in the background fields.
凯尔特人官方公告确认Guerschon Yabusele上海履历，匹配新浪亚布塞莱身份和出生年。|An official Celtics announcement confirms Guerschon Yabusele's Shanghai stint, matching Sina's identity and birth year.
新浪生日月份与NBA档案冲突；中国国家队、北京奥神与湖人履历交叉确认同一孙悦，不因月份冲突拆成两个人，不覆盖生日。|Sina's birth month conflicts with the NBA profile. China national team, Beijing Aoshen and Lakers history confirm the same Sun Yue. The month conflict does not create a separate person or overwrite the birth date.
对手含金量|Opponent strength
这位球员还没有可核实的同赛季对手资料，本项不作调整。|No verified same-season opponent records are available for this player; no adjustment is applied.
原始指数|Original index
调整后|Adjusted
本项实际调整|Applied adjustment
已计入当前模型。|Included in the current model.
当前已关闭；保留原始指数。|Currently disabled; the original index is retained.
对手实力和排名怎么算？|How are opponent strength and rankings calculated?
B = 50% × 得分百分位 + 20% × 助攻百分位 + 15% × 篮板百分位 + 15% × TS% 百分位。均在同赛季比较；缺失子项按已知权重折算。出场少于该季最多出场数的 25%（至少 10 场）时向 50 收缩。|B = 50% × scoring percentile + 20% × assist percentile + 15% × rebound percentile + 15% × TS% percentile. All comparisons use the same season. Missing inputs use the available weights. Players below 25% of that season's maximum appearances (at least 10 games) are shrunk toward 50.
R = 0.8 × B + 0.2 × 实际对手 R 的加权平均，反复计算至变化小于 0.00000001。再按 R 得到同赛季排名百分位。Q = 50% × 对手场均得分百分位 + 50% × 对手 R 排名百分位。|R = 0.8 × B + 0.2 × the weighted mean R of actual opponents, iterated until the change is below 0.00000001. R determines each player's same-season rank percentile. Q = 50% × opponent scoring-average percentile + 50% × opponent R rank percentile.
对手在该场的出场时间决定权重；早期分钟数不全时等权。只统计实际在对面球队出场的人，同场不代表直接防守对位。排名固定于数据快照，不随你添加球员或改变 GOAT 系数循环变化。|Opponents are weighted by their minutes in that game; equal weights are used when historical minutes are incomplete. Only opponents who played count. Sharing a game does not imply a direct defensive matchup. Rankings are fixed to the data snapshot and do not change when you add players or adjust GOAT coefficients.
每个已核实夺冠赛季：冠军系数 = 限制在 0.75–1.25 内的 [1 + 0.5 × (该球员季后赛路径 Q − 同季常规赛对手基准) ÷ 100 × 覆盖率]。团队成就指数调整 = 4 × Σ(冠军系数 − 1)，限制在 ±8 内；最终指数限制在 0–100。系数为模型约定。|For each verified championship season: title factor = clamp [1 + 0.5 × (the player's playoff-path Q − same-season regular-season opponent baseline) ÷ 100 × coverage] to 0.75–1.25. Team-achievement adjustment = 4 × Σ(title factor − 1), capped at ±8; the final index is limited to 0–100. These coefficients are model conventions.
冠军赛季|Championship season
路径强度|Path strength
同代基准|Same-era baseline
冠军系数|Title factor
已核实对手|Verified opponents
没有可核实的夺冠季后赛路径，本项不作调整；这不等于零次总冠军。|No verified championship playoff path is available, so no adjustment is applied. This does not mean zero championships.
只调整已证实为冠军球队参加季后赛的赛季；缺少路径的冠军保留原值。该权重衡量已遇到的对手，不代表个人夺冠贡献。|Only verified playoff appearances for a championship team are adjusted. Titles without path evidence retain their original value. This weight measures the opponents faced, not individual credit for winning.
指数调整 = 8 × (对手强度 − 同代基准) ÷ 50 × 覆盖率，限制在 ±8 内；最终指数限制在 0–100。|Index adjustment = 8 × (opponent strength − same-era baseline) ÷ 50 × coverage, capped at ±8; the final index is limited to 0–100.
已记录|Recorded
对手强度|Opponent strength
对手赛季场均得分加权平均|Weighted mean of opponents' season scoring averages
可计算|Computable
场因分钟资料不足使用等权。|games used equal weights because minute records were incomplete.
场。其中|games. Of these,\u0020
赛季场均得分|Season points per game
同代实力排名|Same-era strength rank
相遇场次|Games faced
实力 Q|Strength Q
列出接触权重最高的 12 条对手赛季记录；计算使用全部已核实对手。|The 12 opponent-season records with the highest exposure weights are shown. Calculations use all verified opponents.
下表列出接触权重较高的对手赛季记录；计算使用全部已核实对手。|The table shows opponent-season records with higher exposure weights. Calculations use all verified opponents.
该赛段缺少可核实对手，本项不作调整。|No verified opponents are available for this phase; no adjustment is applied.
对手资料截至 2023–24；覆盖率只针对已收录比赛，不代表整个生涯完整覆盖。CBA、欧洲及尚未收录赛季不套用 NBA 对手系数。|Opponent data runs through 2023–24. Coverage refers to recorded games, not necessarily the full career. NBA opponent factors are not applied to CBA, Europe or unrecorded seasons.
逐场数据来源|Game-level data source
NBA 历届冠军|NBA championship history
生涯场均得分|Career points per game
生涯场均篮板|Career rebounds per game
生涯场均助攻|Career assists per game
生涯真实命中率|Career true shooting percentage
常规赛总得分 ÷ 常规赛总场次|Regular-season points ÷ regular-season games
常规赛总篮板 ÷ 常规赛总场次|Regular-season rebounds ÷ regular-season games
常规赛总助攻 ÷ 常规赛总场次|Regular-season assists ÷ regular-season games
总得分 ÷ [2 × (总出手 + 0.44 × 总罚球出手)]|Points ÷ [2 × (field-goal attempts + 0.44 × free-throw attempts)]
时代内生涯质量|Era-relative career quality
Σ(赛季可用表现 × 场次) ÷ 生涯总场次|Σ(availability-adjusted season performance × games) ÷ career games
最佳 1 季|Best season
最佳 3 季|Best three seasons
最佳 5 季|Best five seasons
最佳 7 季|Best seven seasons
最好的 1 个有效赛季可用表现的均值|Availability-adjusted performance in the best eligible season
最好的 3 个有效赛季可用表现的均值；不足 3 季则缺失|Mean availability-adjusted performance in the best three eligible seasons; missing with fewer than three seasons
最好的 5 个有效赛季可用表现的均值；不足 5 季则缺失|Mean availability-adjusted performance in the best five eligible seasons; missing with fewer than five seasons
最好的 7 个有效赛季可用表现的均值；不足 7 季则缺失|Mean availability-adjusted performance in the best seven eligible seasons; missing with fewer than seven seasons
生涯场次|Career games
生涯时间|Career minutes
Σ 常规赛出场分钟|Σ regular-season minutes played
Σ 常规赛出场|Σ regular-season games played
精英赛季|Elite seasons
正价值赛季|Positive-value seasons
赛季可用表现 ≥ 1.0 的赛季数|Seasons with availability-adjusted performance ≥ 1.0
赛季可用表现 ≥ 0.5 的赛季数|Seasons with availability-adjusted performance ≥ 0.5
累计表现|Cumulative performance
标准分累计|Cumulative standardized score
Σ max(赛季可用表现 + 0.5, 0)|Σ max(availability-adjusted season performance + 0.5, 0)
生涯胜利贡献值|Career Win Shares
生涯替代价值|Career Value over Replacement Player
平均出勤比例|Mean participation rate
各季 (个人出场 ÷ 该季联盟最高个人出场) 的均值|Mean across seasons of player games ÷ the league's highest player game count that season
Σ 有记录的季后赛出场|Σ recorded playoff appearances
季后赛最佳 3 季|Best three playoff seasons
最好的至多 3 个有效季后赛赛季综合分的均值|Mean composite score from up to three best eligible playoff seasons
季后赛时代内表现|Era-relative playoff performance
有效季后赛赛季综合分按出场数加权平均|Game-weighted mean of eligible playoff-season composite scores
已知季后赛胜场|Recorded playoff wins
Σ 有记录的季后赛胜场|Σ recorded playoff wins
季后赛真实命中率|Playoff true shooting percentage
有记录的季后赛 TS% 按场次加权平均|Game-weighted mean of recorded playoff TS%
官方 MVP 获奖数|Official MVP awards
MVP 得票份额|MVP vote shares
份额累计|Cumulative shares
MVP 前三|MVP top-three finishes
MVP 投票排名 ≤ 3 的赛季数|Seasons with MVP voting rank ≤ 3
官方总决赛 MVP 获奖数|Official Finals MVP awards
NBA / BAA 最佳阵容一阵入选数|All-NBA / All-BAA First Team selections
一阵 + 二阵 + 三阵|First + Second + Third Team selections
不同全明星入选赛季数|Distinct seasons selected as an All-Star
数据王合计|Statistical titles
得分王 + 篮板王 + 助攻王 + 抢断王 + 盖帽王|Scoring + rebounding + assist + steal + block titles
防守胜利贡献值|Defensive Win Shares
时代内防守|Era-relative defense
各有效赛季防守标准分的均值|Mean standardized defensive score across eligible seasons
官方 DPOY 获奖数|Official DPOY awards
防守一阵|All-Defensive First Team
防守二阵|All-Defensive Second Team
最佳防守阵容一阵入选数|All-Defensive First Team selections
最佳防守阵容二阵入选数|All-Defensive Second Team selections
生涯场均抢断|Career steals per game
生涯场均盖帽|Career blocks per game
常规赛总抢断 ÷ 常规赛总场次|Regular-season steals ÷ regular-season games
常规赛总盖帽 ÷ 常规赛总场次|Regular-season blocks ÷ regular-season games
冠军球队赛季|Championship team seasons
被记录在 NBA / BAA 冠军球队的赛季数|Recorded seasons on an NBA / BAA championship team
总决赛球队赛季|Finalist team seasons
被记录在 NBA / BAA 总决赛球队的赛季数|Recorded seasons on an NBA / BAA finalist team
返回球员多维图|Back to player charts
球员完整档案|Full player profile
基础维度指数|Base dimension index
当前有效指数|Current effective index
本次模型贡献|Contribution to this model
这个维度怎样算出来|How this dimension is calculated
先将每项原始值转成固定参考样本内的百分位，再按可用项权重求加权平均。下表的贡献相加，得到基础维度指数。|Each raw value becomes a percentile within the fixed reference sample. Available inputs are combined using their relative weights. The contributions below add up to the base dimension index.
百分位 × 100 × 原始权重|percentile × 100 × original weight
可用项原始权重|available original weights
模型贡献|Model contribution
此维度已从高级模型移除|This dimension is excluded from the advanced model
系数为 0，本次不参与计分|Coefficient is zero; this term contributes nothing
原始数据组成与逐项贡献|Raw inputs and individual contributions
有观测组成：|Observed inputs:\u0020
可用原始权重合计：|Total available original weight:\u0020
此档案没有可审计的基础维度输入；缺失不等于 0，也不代表球员能力居中。|No auditable inputs are available for this profile's base dimension. Missing does not mean zero or average ability.
扩展球员使用原 300 人固定参照；新增球员不会改变参考分布。|Additional players use the fixed original 300-player reference. Adding players does not change the distribution.
参考分布来自原始|The reference distribution comes from the original\u0020
人指标快照；不是全球人口百分位。|player snapshot; it is not a percentile of all players worldwide.
组成 / 定义|Input / Definition
原始值|Raw value
百分位|Percentile
原始权重|Original weight
有效权重|Effective weight
指数贡献|Index contribution
参考 n|Reference n
重算|Recalculated
发布基础指数|Published base index
没有足够输入，无法重算基础指数。|Insufficient inputs to recalculate the base index.
展示值已舍入，计算使用完整精度。缺失输入在维度内部不计入分母；整个维度缺失时，在最终模型里贡献为 0，不放大其他维度。|Displayed values are rounded; calculations use full precision. Missing inputs are excluded from the dimension's denominator. A completely missing dimension contributes zero to the final model without enlarging other dimensions.
百分位、时代调整与统计边界|Percentiles, era adjustments and statistical scope
原样本百分位 = 升序平均名次 ÷ 该项有效样本数；相同值取并列平均名次。扩展样本：相同参考值沿用上述百分位，无相同值则用严格低于该值的参考样本占比，范围 0–100。|Original-sample percentile = ascending average rank ÷ valid sample count; ties share their average rank. Additional players inherit the percentile of matching reference values. Without a match, the share of reference values strictly below the input is used, ranging from 0–100.
赛季标准分 z = clip((x − 同季有效球员均值) ÷ 同季总体标准差, −3, 3)。常规赛资格要求至少 20 场且出场比例至少 35%；无变化或没有观测时记缺失。|Season z-score = clip((x − same-season eligible-player mean) ÷ same-season population standard deviation, −3, 3). Regular-season eligibility requires at least 20 games and 35% participation. Zero variance or absent observations produce a missing value.
赛季防守 = 可用项加权均值 {抢断 z: 25%, 盖帽 z: 30%, DBPM z: 45%}。赛季综合 = 可用项加权均值 {得分 z: 24%, 篮板 z: 13%, 助攻 z: 14%, TS z: 14%, PER z: 11%, BPM z: 12%, WS/48 z: 8%, 赛季防守: 4%}。赛季可用表现 = 赛季综合 − 0.45 × (1 − 出场比例)。|Season defense = available-input weighted mean {steals z: 25%, blocks z: 30%, DBPM z: 45%}. Season composite = available-input weighted mean {points z: 24%, rebounds z: 13%, assists z: 14%, TS z: 14%, PER z: 11%, BPM z: 12%, WS/48 z: 8%, season defense: 4%}. Availability-adjusted performance = season composite − 0.45 × (1 − participation rate).
季后赛综合 = 可用项加权均值 {得分 z: 40%, 篮板 z: 18%, 助攻 z: 22%, TS z: 20%}；同季至少 5 场才计算 z，球员逐场资料截至 2024。扩展档案的季后赛指数仍可能缺失。|Playoff composite = available-input weighted mean {points z: 40%, rebounds z: 18%, assists z: 22%, TS z: 20%}. Z-scores require at least five games in the season. Player game data runs through 2024. Additional profiles may still lack playoff indices.
冠军与总决赛的基础输入使用球队赛季归属，不保证球员实际参加每轮或总决赛。早期缺少防守和高级统计；原快照的一些累计项曾由求和或荣誉汇总生成 0，不能把这些 0 解读为该年代完整观测。当前页面忠实展开已发布输入，不补造历史数据。|Base championship and Finals inputs use team-season membership, not proof that a player appeared in every round or the Finals. Early defensive and advanced statistics are incomplete. Some original totals became zero through aggregation; those zeros do not establish complete historical observation. This page displays the published inputs without inventing missing history.
计算来源：scripts/04_build_indicators.py · scripts/data_utils.py · data/processed/model_features_full.csv。公开基础来源为 Kaggle NBA/ABA/BAA 历史数据、NBA 官方荣誉与球队历史；季后赛来自留存逐场数据。具体档案出处可打开球员完整档案。|Calculation sources: scripts/04_build_indicators.py · scripts/data_utils.py · data/processed/model_features_full.csv. Public inputs use historical Kaggle NBA/ABA/BAA data, official NBA awards and team history, plus archived playoff game data. Open the full player profile for specific sources.
查看最佳赛季的原始场均与时代调整结果|Inspect top seasons' raw averages and era adjustments
TS 比率|TS ratio
可用表现|Availability-adjusted performance
该维度的全库排名|Full-library ranking for this dimension
按当前有效维度指数排序，与用户设置的 β 系数无关；缺失档案列在末尾且不授予名次。只代表本库已收录球员，不是全球所有运动员的完整排名。|Sorted by the current effective dimension index, independent of your β coefficient. Missing values appear last without a rank. This covers recorded players in this library, not every player worldwide.
搜索中文名 / 英文名 / 绰号|Search Chinese / English name / Nickname
搜索该维度排名|Search this dimension's ranking
维度指数|Dimension index
没有匹配的球员。|No matching players.
全库|Full library
有此维度|With this dimension
缺失|Missing
比率|Ratio
标准分|Standardized score
对手|Opponent
分钟|Minutes
季|seasons
胜|wins
季后赛出场|Playoff appearances
已收录 NBA / BAA、CBA 与 EuroLeague 档案；不是全球全部篮球运动员。跨联赛仅按已核实身份映射合并，未核实身份保留独立。不同联赛的统计口径与覆盖不相同，缺失资料不评分。|Recorded NBA/BAA, CBA and EuroLeague profiles; not every basketball player worldwide. Cross-league records merge only through verified identity links. Other identities remain separate. Definitions and coverage differ across leagues; missing data is not scored.
全球球员 · 全部已收录档案|Global players · All recorded profiles
正在载入跨联赛球员档案…|Loading cross-league player profiles…
浏览全球球员 / 收藏|Browse global players / Favorites
浏览全球已收录球员|Browse all recorded global players
关闭球员库|Close Player Library
搜索全部已收录球员|Search all recorded players
跨联赛人数可重叠|League counts can overlap
档案尚未载入|Profiles not loaded yet
浏览器存储不可用，收藏仅本页有效。|Browser storage is unavailable; favorites last for this page only.
已保存的自选名单继续作为收藏；全部档案均可检索。|Previous selections remain as favorites. Every recorded profile is searchable.
全球球员档案载入失败，请稍后重试（HTTP|Global player profiles could not load. Try again later (HTTP
所有已收录球员都可直接查看与比较；无可用评分数据者不参与得分排名。|All recorded players can be viewed and compared. Profiles without usable scoring data receive no score rank.
没有匹配的已收录档案。试试其他姓名或清除筛选条件。|No matching recorded profiles. Try another name or clear the filters.
正在载入全球球员档案…|Loading global player profiles…
其他标签的收藏暂未载入；请打开球员库重试。|Favorites from another tab could not load. Open Player Library to retry.
计算组成与排名|Calculation breakdown and ranking
正在载入原始输入与固定参考分布…|Loading raw inputs and the fixed reference distribution…
全球目录档案：部分指数可能未计算；可在高级模式使用有记录的原始统计。|Global-library profile: some indices may be uncalculated. Recorded raw statistics are available in advanced mode.
已启用对手强度修正：下列七维指数使用修正后的值。对手修正会改变评论员起点的原拟合结果；关闭可查看原始评分。|Opponent adjustments are enabled: the seven indices below use adjusted values. This changes the analyst preset's original fitted result; disable it to inspect the base scores.
对手强度修正已关闭：下列七维指数使用原始基础值。|Opponent adjustments are disabled: the seven indices below use their original values.
点击侧栏维度可查原始组成、修正量与实际贡献。|Click a sidebar dimension to inspect its inputs, adjustment and actual contribution.
排名实验室自动载入本库全部|The Ranking Lab automatically loads all\u0020
位球员，包括 NBA / BAA、CBA 与 EuroLeague 已收录档案；不是全球所有篮球运动员的完整名单。可以按联赛和数据覆盖筛选。|recorded NBA/BAA, CBA and EuroLeague players. This is not a complete worldwide roster. Filter by league or data coverage.
基础指标与参考分布|Base indices and reference distribution
原始 300 人七维指数沿用已发布快照，采集标记为|The original 300-player indices follow the published snapshot, recorded on\u0020
。扩展 NBA 档案使用同一原始定义和原 300 人固定百分位参照，新增球员不会改变基础分布。未计算的维度保持缺失，不能把不同联赛的资料缺口当作真实能力差距。点击任一维度可查看原始输入、权重、百分位和逐项贡献。|. Additional NBA profiles use the same definitions and fixed original 300-player percentile reference. Adding players does not change the base distribution. Uncalculated dimensions remain missing; differences in league coverage are not differences in ability. Click any dimension to inspect inputs, weights, percentiles and contributions.
S = 50 + Σ β × (当前有效指数 − 50) ÷ 10 + 大众参考贡献。系数独立，分数不是百分比。缺失维度贡献为 0；全部启用项缺失时不评分。高级模式的原始统计、荣誉与协同模块是可选的用户规则，未纳入原评论员拟合。|S = 50 + Σ β × (current effective index − 50) ÷ 10 + consensus contribution. Coefficients are independent; scores are not percentages. Missing dimensions contribute zero; a player is unscored when all enabled inputs are missing. Advanced statistics, awards and interactions are optional user rules outside the original analyst fit.
对手强度修正|Opponent-strength adjustment
对手的同赛季场均表现和递归排名构成对手强度，按实际同场出场及分钟数汇总；冠军按已核实夺冠路径修正。排名由冻结资料计算，不随用户系数循环变化。修正只用于有基础指数和对手证据的维度，缺少资料时保留原始指数。|Opponent strength combines same-season averages and recursive rankings, aggregated using actual appearances and minutes. Championships use verified playoff paths. Rankings come from frozen data and do not feed back from user coefficients. Adjustments require both a base index and opponent evidence; missing evidence leaves the original index intact.
对手修正会改变评论员起点的原拟合结果；关闭可查看原始评分。对手与球员季后赛逐场资料覆盖至 2024，其他资料以来源截止期为准；同场不代表直接防守对位，冠军球队归属不等于个人夺冠贡献。|Opponent adjustments change the analyst preset's original fitted result; disable them to inspect base scores. Opponent and player playoff game data runs through 2024; other fields follow their source cutoffs. Sharing a game does not establish direct defensive matchups; championship-team membership does not measure individual championship contribution.
系数、模块、对手开关和收藏保存在本机浏览器。分享链接与 JSON 导出保留当前模型设置；不包含游戏进度。单杆建议和联合搜索只探索评分规则，不更改球员数据，也不保证某位球员能排名第一。|Coefficients, modules, the opponent toggle and favorites are saved in this browser. Share links and JSON exports preserve current model settings, excluding game progress. Slider suggestions and joint searches explore scoring rules without changing player data or guaranteeing any player first place.
对手强度数据暂不可用，当前保留基础指数。|Opponent-strength data is unavailable; base indices are retained.
全球目录暂不可用，当前先显示已载入球员。|The global library is unavailable; loaded players are shown for now.
考虑对手强度|Consider opponent strength
结合同时代对手表现、对手排名和夺冠路径，修正常规赛、季后赛与团队成就。点击维度查看原始组成和修正依据。|Use same-era opponent performance, opponent rankings and championship paths to adjust regular-season, playoff and team-achievement indices. Click a dimension to inspect its inputs and adjustment evidence.
对手修正会改变评论员起点的原拟合结果；关闭可查看原始评分。|Opponent adjustments change the analyst preset's original fitted result; disable them to inspect base scores.
对手强度依据球队和赛季层面的交锋背景；不是“谁直接防守谁”的个人对位效果。缺少证据的球员保留基础指数。|Opponent strength uses game and season context, not direct individual defensive matchups. Players without evidence retain their base indices.
“较起点”对比未加对手修正的评论员 / 均衡基础模型。点击分数查看多维图，点击维度查看计算组成。|“Change” compares with the analyst/balanced base model before opponent adjustments. Click a score for charts or a dimension for its calculation.
按联赛筛选|Filter by league
按数据覆盖筛选|Filter by data coverage
全球球员 · 已收录范围|Global players · Recorded coverage
跨联赛档案 · 身份去重|Cross-league profiles · Verified identity merging
筛选范围|Filter scope
全部已收录|All recorded players
我的收藏|My favorites
全球已收录|Global recorded players:\u0020
同一球员可能有多个联赛经历，各联赛人数不能直接相加。只有具备可用数据的维度参与评分；未收录的数据不会编造。原 A/B/C 入选路径保留供核查。|Players can have experience in multiple leagues, so league counts cannot be added directly. Only dimensions with usable data are scored; missing facts are not invented. Original A/B/C selection paths remain available for inspection.
历史实际常规赛出场档案与现役阵容快照；评分数据依来源覆盖。|Historical regular-season appearance records and active-roster snapshots. Scoring depends on source coverage.
已核实历史出场档案与国内球员注册快照；并非 CBA 全史完备名单。|Verified historical appearances and domestic-registration snapshots, not a complete all-time CBA roster.
官方比赛资料中的已收录球员；目前仅覆盖部分球队。|Recorded players from official game data; only some teams are currently covered.
生涯起止按已收录联赛的实际赛季记录展示，不等同于正式宣布出道或退役的年份；仅有注册或阵容资料时，赛季起止保持未知。身高体重为来源记录值，不代表实时测量。|Career dates use actual season records in the covered leagues, not formally announced debuts or retirements. Registration-only or roster-only profiles retain unknown season dates. Height and weight are recorded source values, not live measurements.
尚未取得可比较的完整联赛荣誉记录，未知不代表 0。|Complete comparable league-award records are unavailable. Unknown does not mean zero.
这是有来源的全球已收录档案，自动进入球员库与排名实验室，并非 A/B/C 原始入选者。|This sourced global profile automatically appears in the Library and Lab. It is outside the original A/B/C selection.
可用指标按明确的数据覆盖与固定参照计算；未计算项保持缺失。仅有基础档案者不参与得分排名。数据覆盖：|Available indices use stated coverage and fixed references; uncalculated values remain missing. Basic profiles receive no score rank. Coverage:\u0020
全球档案暂不可用，已保存收藏保留；先显示基础球员，可打开球员库重试。|Global profiles are unavailable. Saved favorites are retained and base players are shown; open Player Library to retry.
NBA 官方档案：|Official NBA profile: \u0020
（背景抽查）| (background spot check)
仅抽查生日字段与本地快照一致；不是 300 人逐项官方核验|Only the birth date was spot-checked against the local snapshot; this is not official verification of every field for all 300 players
NBA 官方：姚明由上海鲨鱼进入 NBA|Official NBA: Yao Ming's move from the Shanghai Sharks to the NBA
schedule.csv季后赛赛程与逐场球员boxscore连接，核对所有赛程场次，排除DNP，去重实际出场赛季；截至2023–24。|Playoff games in schedule.csv are joined to player box scores. Scheduled games are checked, DNPs excluded and actual appearance seasons deduplicated through 2023–24.
schedule.csv 的 Series=Finals 与逐场 boxscore 连接；排除DNP，按球员与赛季去重，非球队名单归属；截至2023–24。|Schedule rows with Series=Finals are joined to box scores. DNPs are excluded and player-seasons deduplicated through 2023–24; roster membership alone does not qualify.
；2024–25与2025–26另用ESPN逐场记录补齐。| ESPN game records supplement 2024–25 and 2025–26.
保留的官方历届获奖快照1955–56至2025–26，采用已匹配球员ID的awards.csv；不含FMVP。|Retained official MVP snapshots from 1955–56 through 2025–26 use awards.csv with matched player IDs. Finals MVP is excluded.
FIBA：姚明上海最后一季的实际场均表现与2002年转入NBA|FIBA: Yao Ming's final Shanghai season averages and 2002 NBA move
官方回顾明确上海最后一季场均表现及同年2002转入NBA，仅证明2001–02上海实际出场；不据1997–2002履历区间补齐其他赛季。|The official retrospective gives final-season Shanghai averages and the 2002 NBA move. It verifies only 2001–02 Shanghai appearances; other seasons are not inferred from the 1997–2002 career range.
Player Career Info.csv基础事实；Player Totals.csv筛出实际NBA/BAA出场者；不是GOAT300精选。|Profile facts come from Player Career Info.csv; Player Totals.csv identifies actual NBA/BAA participants. This is not the selected 300-player GOAT sample.
NBA全明星入选按球员/赛季去重，保留受伤被替换的入选者；不含ABA，不等于实际全明星出场次数。|NBA All-Star selections are deduplicated by player and season, retaining injured players who were replaced. ABA is excluded. Selections do not equal actual All-Star appearances.
完整30队JSON：ROSTER_STATUS=1、HISTORIC=false、TEAM_ID>0；含训练营/双向/新人，不宣称常规赛15人正式名单或已出场。|JSON covers all 30 teams with ROSTER_STATUS=1, HISTORIC=false and TEAM_ID>0, including camp, two-way and rookie players. It does not establish a final 15-player roster or appearances.
EuroLeague 官方：2025-26 首轮 BKN–OLY 比赛资料，PDF 第3–4页|Official EuroLeague: 2025–26 Round 1 BKN–OLY game notes, PDF pages 3–4
只选两队18人，球队只代表该日登记，不代表完整履历或现效力球队。|A selection of 18 players from two teams. Team labels reflect that day's registrations, not complete careers or current teams.
EuroLeague官方：霍华德2023–24得分王，巴斯克尼亚38场|Official EuroLeague: Howard's 2023–24 scoring title, 38 Baskonia games
官方新闻明确2023–24巴斯克尼亚、38场与实际总得分；仅作实际出场证据，不当作完整生涯统计。|Official news confirms 38 Baskonia games and total points in 2023–24. This is appearance evidence, not complete career statistics.
EuroLeague官方：2024–25季后赛OLY–RMB赛前统计|Official EuroLeague: 2024–25 playoff OLY–RMB pregame statistics
第7页奥林匹亚科斯当季场均、投篮表现与第11页当季已完成比赛实际表现；只取赛季明确的正统计，不用注册名单或可能延续自受伤前的跨季连续表现。|Page 7 gives Olympiacos season averages and shooting; page 11 gives completed games that season. Only positive statistics tied to an explicit season qualify, not registrations or cross-season streaks that may predate injury.
EuroLeague 官方：2025-26首轮BKN–OLY资料第11页历史比赛表现|Official EuroLeague: historical game performances on page 11 of the 2025–26 Round 1 BKN–OLY notes
只取有年份、所属球队及球员实际得分/篮板/投篮表现的已发生比赛；另以第9页2024–25霍尔场均盖帽与第11页明确上季巴斯克尼亚归属交叉核实。第3–4页注册名单不作为出场证据。|Only completed games with a year, team and actual player scoring, rebounding or shooting qualify. Page 9's 2024–25 Hall block average is cross-checked with page 11's Baskonia history. Registrations on pages 3–4 are not appearance evidence.
非官方公开统计表：仅采集 CBA个人历史数据 中场次大于0的赛季、球队、场次；不采用页面标题赛季、近期比赛与档案球队的推断连接，也不插值。|Unofficial public tables: only seasons, teams and positive game counts in individual CBA history are used. Page-heading seasons, recent games and profile teams are not joined by inference; no interpolation is used.
显式逐人核对，不使用同姓模糊匹配。NBA ID、英文全名与出生日期来自本地 Player Career Info.csv；新浪完整生日另行读取公开个人档案。生日缺失或冲突时必须有独特姓名、球队履历与独立来源支持；冲突保留在说明中，不覆盖背景字段。|Identities are checked individually, never by surname-only fuzzy matching. NBA IDs, full English names and birth dates come from the local Player Career Info.csv; Sina birth dates come from public profiles. Missing or conflicting dates require a distinctive name, team history and independent sources. Conflicts remain in notes without overwriting background fields.
新浪CBA球员公开档案：|Public Sina CBA profile: \u0020
NBA/CBA身份履历交叉核验：|NBA/CBA identity and career cross-check: \u0020
NBA历届冠军与原档案冠军赛季统计|NBA championship history and original-profile championship seasons
NBA历届DPOY|NBA DPOY award history
NBA历届FMVP|NBA Finals MVP award history
NBA/BAA赛季球队记录与官方冠军名单匹配|NBA/BAA team-season records matched to official champions
赛季CBA联赛国内球员注册信息| CBA domestic-player registration
官网公开名单更新时间：|Official roster update: \u0020
；注册和实际出场是两种独立证据。|; registrations and actual appearances are separate evidence.
北京控股|Beijing Royal Fighters
北京首钢|Beijing Ducks
福建浔兴|Fujian Xunxing
广东宏远|Guangdong Hongyuan
广州龙狮|Guangzhou Loong Lions
吉林东北虎|Jilin Northeast Tigers
江苏肯帝亚|Jiangsu Dragons
辽宁沈阳三生|Liaoning Flying Leopards
南京同曦|Nanjing Tongxi
宁波富邦|Ningbo Fubon
青岛国信海天|Qingdao Guoxin Haitian
山东山高|Shandong Hi-Speed
山西汾酒|Shanxi Fenjiu
上海久事|Shanghai Jiushi
深圳新世纪|Shenzhen New Century
四川锦城|Sichuan Jincheng
天津荣钢|Tianjin Ronggang
新疆广汇|Xinjiang Guanghui
浙江稠州|Zhejiang Chouzhou
浙江广厦|Zhejiang Guangsha
直接搜索全球已收录球员，按联赛和资料覆盖筛选。履历、荣誉和来源都在档案里，收藏会与排名实验室同步。|Search recorded players across leagues and filter by league or data coverage. Profiles include careers, awards and sources; favorites sync with the Ranking Lab.
输入中文名、英文名或球队，再按联赛、位置、年代和数据覆盖筛选。筛选只影响你看到的列表。|Enter a Chinese or English name or team, then filter by league, position, era and data coverage. Filters only change the displayed list.
这里汇集不同联赛的已收录档案，按英文姓名排列。有人七维完整，有人只有基础履历；资料少不等于球技差。|Recorded profiles from multiple leagues are sorted by English name. Some have all seven dimensions; others only have basic profiles. Less data does not mean less ability.
从熟悉的球星开始，也可以挑战现役、历史或跨联赛球员。现役按已核实的注册与阵容快照，历史按已收录的正式出场；具体名单与数据覆盖见下方说明。|Start with familiar stars or try active, historical and cross-league players. Active pools use verified registration and roster snapshots; historical pools use recorded official appearances. See the coverage notes below.
雷达图展示当前有效七维指数（0–100），不是得分占比，不随系数变化。点击轴、名称或圆点查看原始组成、对手修正和排名；缺失项留空。|The radar shows current effective dimension indices (0–100), not shares of the score. Coefficient changes do not alter these indices. Click an axis, label or dot to inspect raw inputs, opponent adjustments and rankings. Missing values remain blank.
已收录联赛|Recorded leagues
统计口径|Statistical scope
统计口径：未取得可比较的生涯统计。多联赛履历不代表数据已跨联赛合计。|Statistical scope: comparable career statistics are unavailable. A multi-league career does not imply that statistics have been combined across leagues.
多联赛履历不代表数据已跨联赛合计。|A multi-league career does not imply that statistics have been combined across leagues.
出生年份|Birth year
七维数据画像，点击维度查看组成与排名|Seven-dimension profile; click a dimension for its inputs and ranking
对手资料截至 2023–24，排除附加赛和 2023 年季中锦标赛决赛；覆盖率只针对已收录比赛，不代表整个生涯完整覆盖。|Opponent data runs through 2023–24, excluding play-ins and the 2023 In-Season Tournament final. Coverage refers to recorded games, not necessarily the full career.
CBA、欧洲及尚未收录赛季不套用 NBA 对手系数。| NBA opponent factors are not applied to CBA, Europe or unrecorded seasons.
七维完整|All seven dimensions
部分评分数据|Partial scoring data
仅基础档案|Basic profile only
全部联赛|All leagues
全部数据覆盖|All coverage levels
只看我的收藏|My favorites only
取消收藏|Remove from favorites
收藏|Favorite
已收录档案自动进入球员库与排名实验室。仅有基础档案者可以检索，缺失评分保持未知。当前覆盖 NBA / BAA、CBA 与 EuroLeague 的已核实来源，尚非全球完整名单。|All recorded profiles appear in the Library and Lab. Basic profiles are searchable, while missing scores remain unknown. Verified sources currently cover NBA/BAA, CBA and EuroLeague; this is not a complete worldwide roster.
`.trim().split('\n').map(line=>{const i=line.indexOf('|');return [line.slice(0,i),line.slice(i+1)];})));
