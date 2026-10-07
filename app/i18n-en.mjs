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
`.trim().split('\n').map(line=>{const i=line.indexOf('|');return [line.slice(0,i),line.slice(i+1)];})));
