import {METRICS,HONORS} from './custom-engine.mjs';

const averageMetrics=new Set(['points','rebounds','assists','steals','blocks','threes','minutes']);
const operators={gte:'≥',lte:'≤',gt:'>',lt:'<'};
const pools={'nba-history':['全部 NBA / BAA 球员','all NBA / BAA players'],'nba-active':['现役 NBA 球员','active NBA players'],'cba-history':['全部 CBA 球员','all CBA players'],'cba-active':['现役 CBA 国内球员','active CBA domestic players']};
const TEAM_NAMES={ATL:'亚特兰大老鹰',BOS:'波士顿凯尔特人',BRK:'布鲁克林篮网',CHO:'夏洛特黄蜂',CHI:'芝加哥公牛',CLE:'克利夫兰骑士',DAL:'达拉斯独行侠 小牛',DEN:'丹佛掘金',DET:'底特律活塞',GSW:'金州勇士',HOU:'休斯敦火箭',IND:'印第安纳步行者',LAC:'洛杉矶快船',LAL:'洛杉矶湖人',MEM:'孟菲斯灰熊',MIA:'迈阿密热火',MIL:'密尔沃基雄鹿',MIN:'明尼苏达森林狼',NOP:'新奥尔良鹈鹕',NYK:'纽约尼克斯',OKC:'俄克拉荷马城雷霆',ORL:'奥兰多魔术',PHI:'费城76人',PHO:'菲尼克斯太阳',POR:'波特兰开拓者',SAC:'萨克拉门托国王',SAS:'圣安东尼奥马刺',TOR:'多伦多猛龙',UTA:'犹他爵士',WAS:'华盛顿奇才',SEA:'西雅图超音速',NJN:'新泽西篮网',CHH:'夏洛特黄蜂',CHA:'夏洛特山猫',VAN:'温哥华灰熊',NOH:'新奥尔良黄蜂',NOK:'新奥尔良俄克拉荷马城黄蜂'};
export function teamName(id,data,language='zh-CN',translate=x=>x){const original=data.teams[id]||id;return language==='en'?original:translate(id.startsWith('NBA:')?(TEAM_NAMES[id.slice(4)]||original).replace(' 小牛',''):original);}
export function teamSearchText(id,data){return `${id} ${data.teams[id]||''} ${TEAM_NAMES[id.slice(4)]||''}`;}

// Pure wording only: never changes the engine's rank, ties, sample or evidence.
const naturalJoin=values=>values.length<2?(values[0]||''):values.slice(0,-1).join('、')+'和'+values.at(-1);
const chineseDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)?value.replace(/^(\d{4})-(\d{2})-(\d{2})$/,(_,y,m,d)=>`${y}年${Number(m)}月${Number(d)}日`):value;
const seasonLabel=value=>/^\d{4}$/.test(String(value))?`${Number(value)-1}–${String(value).slice(-2)}`:String(value);
const unitNames={points:'分',rebounds:'个篮板',assists:'次助攻',steals:'次抢断',blocks:'次盖帽',threes:'记三分',minutes:'分钟',games:'场'};
const comparisons={gte:'至少',lte:'不超过',gt:'超过',lt:'不到'};
export function describeClaim(result,player,data,{language='zh-CN',translate=x=>x}={}){
  const q=result.query,en=language==='en',say=(zh,eng)=>en?eng:zh;
  const playerName=p=>en?(p?.englishName||p?.name):(p?.chineseName||p?.name);
  const metric=key=>{const label=translate(METRICS[key]);if(en){const natural=label.replace(/^[A-Z](?=[a-z])/,first=>first.toLowerCase());return natural+(q.unit==='season'&&averageMetrics.has(key)?' per game':'');}return(q.unit==='season'&&averageMetrics.has(key)?'赛季场均':'')+label;};
  const phase=({rs:['常规赛','regular season'],po:['季后赛','playoffs'],all:['全部赛段','all phases']})[q.phase][en?1:0];
  const conditions=q.filters.map(f=>`${metric(f.key)} ${operators[f.op]} ${f.value}${/Pct$/.test(f.key)?'%':f.key==='heightCm'?' cm':f.key==='weightKg'?' kg':f.key==='age'?say(' 岁',' years'):''}`);
  for(const f of q.honors||[])conditions.push(`${translate(HONORS[f.key])} ${operators[f.op]} ${f.value}`+say('（截至 2025–26 生涯快照）',' (career snapshot through 2025–26)'));
  const team=id=>teamName(id,data,language,translate);
  if(q.team)conditions.push(say('效力于','playing for ')+team(q.team));
  if(q.position)conditions.push(say('位置为 ','position ')+q.position);
  if(q.college)conditions.push(say('曾就读于','attended ')+q.college);
  if(q.birthplace)conditions.push(say('出生于','born in ')+(data.players.find(p=>p.birthplaceId===q.birthplace)?.birthplace||q.birthplace));
  if(q.opponent)conditions.push(say('面对','against ')+team(q.opponent));
  if(q.opponentPlayer!==null&&q.opponentPlayer!==undefined)conditions.push(say('与','appearing against ')+playerName(data.players[q.opponentPlayer])+say('同场交手（不代表直接防守对位）',' in the same game (not necessarily a direct defensive matchup)'));
  const scope=say(`比较范围：${pools[q.pool][0]}，${q.from}–${q.to} 赛季结束年的${phase}${q.unit==='game'?'单场记录':'赛季数据'}。`,
    `Comparison: recorded ${q.unit==='game'?'games':'seasons'} for ${pools[q.pool][1]}, season-ending years ${q.from}–${q.to}, ${phase}. `)+
    (conditions.length?say(`筛选条件：${conditions.join('；')}。`,` Filters: ${conditions.join('; ')}.`):say('没有其他筛选条件。',' No additional filters.'));
  const naturalFilter=f=>{
    const label=METRICS[f.key],op=comparisons[f.op],amount=`${op} ${f.value}`;
    if(averageMetrics.has(f.key))return `${q.unit==='season'?'场均':'单场'}${f.key==='minutes'?'出场':f.key==='threes'?'命中':''}${amount}${unitNames[f.key]}`;
    if(f.key==='age')return `年龄${amount}岁`;
    return `${label}${amount}${/Pct$/.test(f.key)?'%':f.key==='heightCm'?' cm':f.key==='weightKg'?' kg':f.key==='games'?'场':''}`;
  };
  const performance=q.filters.filter(f=>!['age','heightCm','weightKg'].includes(f.key));
  const who=playerName(player),target=result.target;
  const tied=result.ties>1,others=result.ties-1;
  const rankText=result.first?(tied?say(`与另外 ${others} 人并列第一`,`ties for first among ${result.ties} players`):say('排在第一','ranks first')):say(`排在第 ${result.rank}`,`ranks ${result.rank}`);
  let sentence;
  if(!target)sentence=say(`这次没查到${who}符合条件的表现，暂时排不了名。`,`No qualifying performance was found for ${who}, so there is no rank to report.`);
  else if(result.isolated)sentence=say(`${who}有符合条件的表现，不过这组条件下只有他一人可比较，还不能据此认定第一。`,`${who} has a qualifying performance, but is the only comparable player. A one-player sample cannot establish a competitive first place.`);
  else if(q.mode==='first'){
    const achievement=performance.length?naturalJoin(performance.map(naturalFilter)):'符合条件的表现';
    const when=q.unit==='season'?say(seasonLabel(target.evidence.date)+'赛季','in the '+seasonLabel(target.evidence.date)+' season'):say(chineseDate(target.evidence.date),'on '+target.evidence.date);
    sentence=say(`${who}在${when}就做到${achievement}，在这组比较里${rankText}。`,`${who} first met these conditions ${when} and ${rankText} in this comparison.`);
  }else if(q.mode==='streak'){
    const achievement=performance.length?naturalJoin(performance.map(f=>naturalFilter(f).replace(/^单场/,''))):'达到筛选条件';
    sentence=say(`${who}曾连续 ${target.value} 场${achievement}，在这组比较里${rankText}。`,`${who} met the conditions in ${target.value} consecutive recorded appearances and ${rankText} in this comparison.`);
  }else{
    const amount=Number.isFinite(target.value)?Number(target.value.toFixed(1)):target.value,unit=q.unit==='season'?'场均':'单场';
    const achievement=unitNames[q.metric]?`${unit}${q.metric==='points'?'拿到':q.metric==='rebounds'?'抢下':q.metric==='assists'?'送出':q.metric==='threes'?'命中':q.metric==='minutes'?'出场':''} ${amount} ${unitNames[q.metric]}`:`${metric(q.metric)}达到 ${amount}${/Pct$/.test(q.metric)?'%':''}`;
    const nouns={points:'points',rebounds:'rebounds',assists:'assists',steals:'steals',blocks:'blocks',threes:'made threes',minutes:'minutes'};
    const verbs={points:'scored',rebounds:'grabbed',assists:'had',steals:'had',blocks:'had',threes:'made',minutes:'played'};
    const englishAchievement=nouns[q.metric]?(q.unit==='season'?`averaged ${amount} ${nouns[q.metric]}`:`${verbs[q.metric]} ${amount} ${q.metric==='threes'?'threes':nouns[q.metric]} in a game`):`posted ${translate(METRICS[q.metric])} of ${amount}${/Pct$/.test(q.metric)?'%':''}`;
    sentence=say(`${who}${achievement}，在这组比较里${rankText}。`,`${who} ${englishAchievement} and ${rankText} in this comparison.`);
  }
  const evidence=target?say(`对应${q.unit==='game'?'比赛':'赛季'}：${q.mode==='streak'?`${target.evidence.start} 至 ${target.evidence.end}`:target.evidence.date}${target.evidence.team?'，'+team(target.evidence.team):''}${q.mode==='first'?'':q.mode==='streak'?`，连续 ${target.value} 次已收录出场达标`:`，${metric(q.metric)} ${target.value}${/Pct$/.test(q.metric)?'%':''}`}。`,
    `Evidence: ${q.mode==='streak'?`${target.evidence.start} to ${target.evidence.end}`:target.evidence.date}${target.evidence.team?', '+team(target.evidence.team):''}${q.mode==='first'?'':q.mode==='streak'?`, ${target.value} consecutive recorded appearances`:`; ${metric(q.metric)}: ${target.value}${/Pct$/.test(q.metric)?'%':''}`}.`):'';
  let caveat=say(`这次比较了 ${result.eligible} 位球员；${result.unknown} 条资料不全的记录没有算进去。这里的名次只对应上面的范围，不直接等于历史纪录。`,`${result.eligible} players compared; ${result.unknown} records were excluded because information is missing. This rank applies to the comparison above, not necessarily all of basketball history.`);
  if(q.mode==='streak')caveat+=say(' 连续场次只算同一赛季、同一赛段内已收录的个人出场；未达标或资料未知都会中断。',' Streaks use recorded personal appearances within one season and phase; a failed or unknown record ends the streak.');
  if(q.pool.endsWith('active'))caveat+=say(' 现役名单更新于 2026-10-04。',' Active rosters were updated on 2026-10-04.');
  if(q.filters.some(f=>['heightCm','weightKg'].includes(f.key)))caveat+=say(' 身高、体重采用档案快照，并非历史实测。',' Height and weight are profile snapshots, not historical measurements.');
  if(q.filters.some(f=>f.key==='age'))caveat+=say(q.unit==='game'?' 年龄为比赛日周岁。':' NBA 赛季年龄沿用来源口径，通常为赛季中 2 月 1 日年龄。',q.unit==='game'?' Age is completed years on game day.':' NBA season age follows the source convention, usually age on February 1.');
  if(q.honors?.length)caveat+=say(' 荣誉按生涯快照筛选，不表示打出这场表现时已经获奖；冠军球队赛季数不等于戒指授予名单。',' Honors filter the career snapshot, not awards already held at the time; champion-team seasons are not a ring-recipient list.');
  const localize=text=>language==='zh-TW'?translate(text):text;
  return {sentence:localize(sentence),scope:localize(scope),evidence:localize(evidence),caveat:localize(caveat),honors:!!q.honors?.length};
}
