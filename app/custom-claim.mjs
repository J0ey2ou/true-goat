import {METRICS,HONORS} from './custom-engine.mjs';

const averageMetrics=new Set(['points','rebounds','assists','steals','blocks','threes','minutes']);
const operators={gte:'≥',lte:'≤',gt:'>',lt:'<'};
const pools={'nba-history':['全部 NBA / BAA 球员','all NBA / BAA players'],'nba-active':['现役 NBA 球员名单快照','the active NBA roster snapshot'],'cba-history':['全部 CBA 球员','all CBA players'],'cba-active':['现役 CBA 国内球员注册快照','the active CBA domestic registration snapshot']};

// Pure wording only: never changes the engine's rank, ties, sample or evidence.
export function describeClaim(result,player,data,{language='zh-CN',translate=x=>x}={}){
  const q=result.query,en=language==='en',say=(zh,eng)=>en?eng:zh;
  const playerName=p=>en?p?.name:(p?.chineseName||p?.name);
  const metric=key=>(q.unit==='season'&&averageMetrics.has(key)?say('赛季场均','season per-game '):'')+translate(METRICS[key]);
  const phase=({rs:['常规赛','regular season'],po:['季后赛','playoffs'],all:['全部赛段','all phases']})[q.phase][en?1:0];
  const scope=say(`在已收录的${pools[q.pool][0]}、赛季结束年 ${q.from}–${q.to} 的${phase}${q.unit==='game'?'逐场':'赛季'}数据中`,
    `Within the recorded ${q.unit==='game'?'game':'season'} data for ${pools[q.pool][1]}, season-ending years ${q.from}–${q.to}, ${phase}`);
  const conditions=q.filters.map(f=>`${metric(f.key)} ${operators[f.op]} ${f.value}${/Pct$/.test(f.key)?'%':f.key==='heightCm'?' cm':f.key==='weightKg'?' kg':f.key==='age'?say(' 岁',' years'):''}`);
  for(const f of q.honors||[])conditions.push(`${translate(HONORS[f.key])} ${operators[f.op]} ${f.value}`+say('（截至 2025–26 生涯快照）',' (career snapshot through 2025–26)'));
  const team=id=>translate(data.teams[id]||id);
  if(q.team)conditions.push(say('效力于','playing for ')+team(q.team));
  if(q.position)conditions.push(say('位置为 ','position ')+q.position);
  if(q.college)conditions.push(say('曾就读于','attended ')+q.college);
  if(q.birthplace)conditions.push(say('出生于','born in ')+(data.players.find(p=>p.birthplaceId===q.birthplace)?.birthplace||q.birthplace));
  if(q.opponent)conditions.push(say('面对','against ')+team(q.opponent));
  if(q.opponentPlayer!==null&&q.opponentPlayer!==undefined)conditions.push(say('与','appearing against ')+playerName(data.players[q.opponentPlayer])+say('作为对手同场出战（不代表直接防守对位）',' in the same game (not necessarily a direct defensive matchup)'));
  const qualifiers=conditions.length?say(`，同时满足「${conditions.join('；')}」条件`,`, meeting all conditions (${conditions.join('; ')})`):say('，不附加其他筛选条件',', with no additional filters');
  const objective=({first:[`最早达成上述条件`,`earliest achievement of these conditions`],highest:[`${metric(q.metric)}最高`,`highest ${metric(q.metric)}`],streak:['同一赛季及赛段内连续已收录个人出场达标次数最多','longest qualifying streak of recorded personal appearances within one season and phase']})[q.mode][en?1:0];
  const who=playerName(player),target=result.target;
  let outcome;
  if(!target)outcome=say(`${who}没有符合条件的已知记录，不能认定为第一名球员。`,`${who} has no known qualifying record and cannot be declared first.`);
  else if(result.isolated)outcome=say(`${who}是唯一可比较的球员，只能标记为单人样本，不能据此认定为具有竞争性的第一名。`,`${who} is the only comparable player: this is a one-player sample, not a competitive first-place claim.`);
  else if(result.first)outcome=say(`${who}是${objective}的${result.ties>1?`并列第一名球员（共 ${result.ties} 人并列）`:'第一名球员'}。`,`${who} ${result.ties>1?`ties for first among ${result.ties} players`:'ranks first'} for the ${objective}.`);
  else outcome=say(`${who}在「${objective}」的比较中排名第 ${result.rank}，不是第一名球员。`,`${who} ranks ${result.rank}, not first, for the ${objective}.`);
  const evidence=target?say(`依据：${q.mode==='streak'?`${target.evidence.start} 至 ${target.evidence.end}`:target.evidence.date}${q.mode==='first'?'':q.mode==='streak'?`，连续 ${target.value} 次已收录出场达标`:`，${metric(q.metric)}为 ${target.value}${/Pct$/.test(q.metric)?'%':''}`}。`,
    `Evidence: ${q.mode==='streak'?`${target.evidence.start} to ${target.evidence.end}`:target.evidence.date}${q.mode==='first'?'':q.mode==='streak'?`, ${target.value} consecutive recorded appearances`:`; ${metric(q.metric)}: ${target.value}${/Pct$/.test(q.metric)?'%':''}`}.`):'';
  let caveat=say(`比较样本 ${result.eligible} 位球员；${result.unknown} 条记录因缺少字段而排除。结论仅限所选球员池和已收录数据，不是全史认证。`,`${result.eligible} comparable players; ${result.unknown} records excluded for missing fields. This conclusion is limited to the selected pool and recorded data, not a certified all-time record.`);
  if(q.filters.some(f=>['heightCm','weightKg'].includes(f.key)))caveat+=say(' 身高、体重采用档案快照，并非历史实测。',' Height and weight are profile snapshots, not historical measurements.');
  if(q.filters.some(f=>f.key==='age'))caveat+=say(q.unit==='game'?' 年龄为比赛日周岁。':' NBA 赛季年龄沿用来源口径，通常为赛季中 2 月 1 日年龄。',q.unit==='game'?' Age is completed years on game day.':' NBA season age follows the source convention, usually age on February 1.');
  if(q.honors?.length)caveat+=say(' 荣誉是生涯快照筛选，不表示当场或当年已经获奖；冠军球队赛季数不等于戒指授予名单。',' Honors filter the career snapshot, not awards already held at the time of the performance; champion-team seasons are not a ring-recipient list.');
  const localize=text=>language==='zh-TW'?translate(text):text;
  return {sentence:localize(`${scope}${qualifiers}${say('，',', ')}${outcome}`),evidence:localize(evidence),caveat:localize(caveat),honors:!!q.honors?.length};
}
