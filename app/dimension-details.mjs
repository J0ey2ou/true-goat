import { DIMENSIONS } from './model.mjs';
import { searchPlayers } from './player-search.mjs';

const finite = value => typeof value === 'number' && Number.isFinite(value);
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = (value,digits=4) => finite(value) ? value.toFixed(digits) : '缺失';
const labels = {
  career_ppg:['生涯场均得分','分 / 场','常规赛总得分 ÷ 常规赛总场次'], career_rpg:['生涯场均篮板','篮板 / 场','常规赛总篮板 ÷ 常规赛总场次'],
  career_apg:['生涯场均助攻','助攻 / 场','常规赛总助攻 ÷ 常规赛总场次'], career_ts:['生涯真实命中率','比率','总得分 ÷ [2 × (总出手 + 0.44 × 总罚球出手)]'],
  career_era_quality:['时代内生涯质量','标准分','Σ(赛季可用表现 × 场次) ÷ 生涯总场次'],
  peak_1:['最佳 1 季','标准分','最好的 1 个有效赛季可用表现的均值'], peak_3:['最佳 3 季','标准分','最好的 3 个有效赛季可用表现的均值；不足 3 季则缺失'],
  peak_5:['最佳 5 季','标准分','最好的 5 个有效赛季可用表现的均值；不足 5 季则缺失'], peak_7:['最佳 7 季','标准分','最好的 7 个有效赛季可用表现的均值；不足 7 季则缺失'],
  career_games:['生涯场次','场','Σ 常规赛出场'], career_minutes:['生涯时间','分钟','Σ 常规赛出场分钟'],
  elite_seasons:['精英赛季','季','赛季可用表现 ≥ 1.0 的赛季数'], positive_value_seasons:['正价值赛季','季','赛季可用表现 ≥ 0.5 的赛季数'],
  cumulative_performance:['累计表现','标准分累计','Σ max(赛季可用表现 + 0.5, 0)'], career_ws:['生涯胜利贡献值','WS','Σ 赛季 WS'], career_vorp:['生涯替代价值','VORP','Σ 赛季 VORP'],
  mean_games_share:['平均出勤比例','比率','各季 (个人出场 ÷ 该季联盟最高个人出场) 的均值'],
  playoff_games:['季后赛出场','场','Σ 有记录的季后赛出场'], playoff_peak_3:['季后赛最佳 3 季','标准分','最好的至多 3 个有效季后赛赛季综合分的均值'],
  playoff_era_mean:['季后赛时代内表现','标准分','有效季后赛赛季综合分按出场数加权平均'], playoff_wins_known:['已知季后赛胜场','胜','Σ 有记录的季后赛胜场'],
  playoff_ts_pct:['季后赛真实命中率','比率','有记录的季后赛 TS% 按场次加权平均'],
  mvp:['常规赛 MVP','次','官方 MVP 获奖数'], mvp_shares:['MVP 得票份额','份额累计','Σ MVP 得票份额'], mvp_top3:['MVP 前三','季','MVP 投票排名 ≤ 3 的赛季数'],
  finals_mvp:['总决赛 MVP','次','官方总决赛 MVP 获奖数'], all_nba_first:['最佳阵容一阵','次','NBA / BAA 最佳阵容一阵入选数'], all_nba_total:['最佳阵容合计','次','一阵 + 二阵 + 三阵'],
  all_star:['全明星','季','不同全明星入选赛季数'], leader_titles:['数据王合计','次','得分王 + 篮板王 + 助攻王 + 抢断王 + 盖帽王'],
  career_dws:['防守胜利贡献值','DWS','Σ 赛季 DWS'], career_era_defense:['时代内防守','标准分','各有效赛季防守标准分的均值'], dpoy:['最佳防守球员','次','官方 DPOY 获奖数'],
  all_defense_first:['防守一阵','次','最佳防守阵容一阵入选数'], all_defense_second:['防守二阵','次','最佳防守阵容二阵入选数'],
  career_spg:['生涯场均抢断','抢断 / 场','常规赛总抢断 ÷ 常规赛总场次'], career_bpg:['生涯场均盖帽','盖帽 / 场','常规赛总盖帽 ÷ 常规赛总场次'],
  championships:['冠军球队赛季','次','被记录在 NBA / BAA 冠军球队的赛季数'], finals_appearances:['总决赛球队赛季','次','被记录在 NBA / BAA 总决赛球队的赛季数'],
};

/** Match the production extension percentile including its tolerance on ties. */
export function referencePercentile(value,reference,{extension=false}={}) {
  if(!finite(value))return null;
  const values=(reference||[]).filter(finite);if(!values.length)return null;
  let less=0,equal=0;
  for(const ref of values){const same=extension?Math.abs(ref-value)<=1e-12+1e-12*Math.abs(value):ref===value;if(same)equal++;else if(ref<value)less++;}
  return equal?(less+(equal+1)/2)/values.length:less/values.length;
}

export function auditDimension(player,key,audit) {
  const original=audit?.players?.[player.player_id],extension=player.extension;
  const raw=original?.raw||extension?.rawFeatures||{},spec=audit?.specifications?.[key]||{};
  const items=Object.entries(spec).map(([field,weight])=>{const value=finite(raw[field])?raw[field]:null;return {field,label:labels[field]?.[0]||field,unit:labels[field]?.[1]||'',definition:labels[field]?.[2]||field,raw:value,weight,percentile:referencePercentile(value,audit?.references?.[field],{extension:!original}),referenceCount:(audit?.references?.[field]||[]).length};});
  const observedWeight=items.reduce((sum,item)=>sum+(item.percentile===null?0:item.weight),0);
  for(const item of items){item.effectiveWeight=item.percentile===null||!observedWeight?0:item.weight/observedWeight;item.points=item.percentile===null?null:100*item.percentile*item.effectiveWeight;}
  return {items,observedWeight,reconstructed:observedWeight?items.reduce((sum,item)=>sum+(item.points||0),0):null,source:original?'original':extension?.rawFeatures?'extension':'missing',seasons:original?.seasons||[]};
}

export function rankDimension(players,key,{query='',page=1,pageSize=25}={}) {
  const rows=players.map(player=>({...player,dimensionScore:player.components?.[key+'_score']}));
  rows.sort((a,b)=>finite(a.dimensionScore)!==finite(b.dimensionScore)?finite(a.dimensionScore)?-1:1:finite(a.dimensionScore)&&Math.round(a.dimensionScore*1e9)!==Math.round(b.dimensionScore*1e9)?b.dimensionScore-a.dimensionScore:String(a.player_name).localeCompare(String(b.player_name),'en'));
  let last=null,lastRank=null;
  rows.forEach((row,index)=>{if(!finite(row.dimensionScore)){row.dimensionRank=null;return;}const score=Math.round(row.dimensionScore*1e9);row.dimensionRank=score===last?lastRank:index+1;last=score;lastRank=row.dimensionRank;});
  const matches=query?new Set(searchPlayers(rows.map(p=>({...p,id:p.player_id,name:p.player_name})),query).map(p=>p.id)):null;
  const filtered=matches?rows.filter(p=>matches.has(p.player_id)):rows,total=filtered.length,pages=Math.max(1,Math.ceil(total/pageSize));
  const activePage=Math.min(pages,Math.max(1,page));
  return {rows:filtered.slice((activePage-1)*pageSize,activePage*pageSize),total,pages,page:activePage,scored:rows.filter(p=>finite(p.dimensionScore)).length,allRows:rows};
}

export function dimensionDetailsMarkup({player,key,audit,coefficient=0,disabled=false,name=p=>p.chineseName||p.player_name,opponentMarkup=''}) {
  const dimension=DIMENSIONS.find(d=>d.key===key);if(!dimension)return '';
  const detail=auditDimension(player,key,audit),rawScore=(player.rawComponents||player.components)?.[key+'_score'],score=player.components?.[key+'_score'];
  const beta=disabled?0:coefficient,contribution=finite(score)?beta*(score-50)/10:0;
  const available=detail.items.filter(item=>item.percentile!==null).length;
  const formula=detail.items.filter(item=>item.points!==null).map(item=>fmt(item.percentile*100)+' × '+fmt(item.weight)).join(' + ');
  const seasons=[...detail.seasons].filter(s=>finite(s.season_performance_available)).sort((a,b)=>b.season_performance_available-a.season_performance_available).slice(0,7);
  const seasonTable=['peak','longevity','regular_season','defense'].includes(key)&&seasons.length?'<details class="dimension-season-evidence"><summary>查看最佳赛季的原始场均与时代调整结果</summary><div class="dimension-table-scroll"><table><thead><tr><th>赛季</th><th>场次</th><th>场均得分</th><th>场均篮板</th><th>场均助攻</th><th>TS 比率</th><th>可用表现</th></tr></thead><tbody>'+seasons.map(s=>'<tr><td>'+s.season+'</td><td>'+s.g+'</td><td>'+fmt(s.ppg)+'</td><td>'+fmt(s.rpg)+'</td><td>'+fmt(s.apg)+'</td><td>'+fmt(s.ts_percent)+'</td><td>'+fmt(s.season_performance_available,6)+'</td></tr>').join('')+'</tbody></table></div></details>':'';
  return '<div class="dimension-detail" data-active-dimension="'+esc(key)+'" data-active-player="'+esc(player.player_id)+'"><div class="dimension-toolbar"><button class="text-button" type="button" data-dimension-back="'+esc(player.player_id)+'">← 返回球员多维图</button><a href="/players?player='+encodeURIComponent(player.player_id)+'">球员完整档案 ↗</a></div><p>'+esc(name(player))+' · '+esc(player.player_name)+'</p><div class="dimension-metrics"><div><span>基础维度指数</span><strong>'+fmt(rawScore)+'</strong></div><div><span>当前有效指数</span><strong>'+fmt(score)+'</strong></div><div><span>本次模型贡献</span><strong>'+(contribution>0?'+':'')+fmt(contribution)+' 分</strong></div></div><h3>这个维度怎样算出来</h3><p>先将每项原始值转成固定参考样本内的百分位，再按可用项权重求加权平均。下表的贡献相加，得到基础维度指数。</p><pre class="dimension-equation">D = Σ(百分位 × 100 × 原始权重) ÷ Σ(可用项原始权重)\n模型贡献 = β × (当前有效指数 − 50) ÷ 10</pre><p class="dimension-beta">'+fmt(beta)+' × ('+fmt(score)+' − 50) ÷ 10 = '+fmt(contribution)+' 分'+(disabled?' · 此维度已从高级模型移除':!beta?' · 系数为 0，本次不参与计分':'')+'</p><h3>原始数据组成与逐项贡献</h3><p>有观测组成：'+available+' / '+detail.items.length+'；可用原始权重合计：'+fmt(detail.observedWeight)+'。'+(detail.source==='missing'?'此档案没有可审计的基础维度输入；缺失不等于 0，也不代表球员能力居中。':detail.source==='extension'?'扩展球员使用原 300 人固定参照；新增球员不会改变参考分布。':'参考分布来自原始 '+audit.referenceCount+' 人指标快照；不是全球人口百分位。')+'</p><div class="dimension-table-scroll"><table class="dimension-inputs"><thead><tr><th>组成 / 定义</th><th>原始值</th><th>百分位</th><th>原始权重</th><th>有效权重</th><th>指数贡献</th></tr></thead><tbody>'+detail.items.map(item=>'<tr><td><strong>'+esc(item.label)+'</strong><small>'+esc(item.definition)+'</small><code>'+esc(item.field)+'</code></td><td title="'+esc(item.raw)+'">'+fmt(item.raw,6)+'<small>'+esc(item.unit)+'</small></td><td>'+fmt(item.percentile===null?null:item.percentile*100)+'<small>参考 n = '+item.referenceCount+'</small></td><td>'+fmt(item.weight*100,2)+'%</td><td>'+fmt(item.effectiveWeight*100,2)+'%</td><td title="'+esc(item.points)+'">'+fmt(item.points,6)+'</td></tr>').join('')+'</tbody></table></div><pre class="dimension-equation">'+esc(formula?'D = ('+formula+') ÷ '+fmt(detail.observedWeight)+'\n重算 = '+fmt(detail.reconstructed,8)+'；发布基础指数 = '+fmt(rawScore,8):'没有足够输入，无法重算基础指数。')+'</pre><p class="hint">展示值已舍入，计算使用完整精度。缺失输入在维度内部不计入分母；整个维度缺失时，在最终模型里贡献为 0，不放大其他维度。</p><details><summary>百分位、时代调整与统计边界</summary><p>原样本百分位 = 升序平均名次 ÷ 该项有效样本数；相同值取并列平均名次。扩展样本：相同参考值沿用上述百分位，无相同值则用严格低于该值的参考样本占比，范围 0–100。</p><p>赛季标准分 z = clip((x − 同季有效球员均值) ÷ 同季总体标准差, −3, 3)。常规赛资格要求至少 20 场且出场比例至少 35%；无变化或没有观测时记缺失。</p><p>赛季防守 = 可用项加权均值 {抢断 z: 25%, 盖帽 z: 30%, DBPM z: 45%}。赛季综合 = 可用项加权均值 {得分 z: 24%, 篮板 z: 13%, 助攻 z: 14%, TS z: 14%, PER z: 11%, BPM z: 12%, WS/48 z: 8%, 赛季防守: 4%}。赛季可用表现 = 赛季综合 − 0.45 × (1 − 出场比例)。</p><p>季后赛综合 = 可用项加权均值 {得分 z: 40%, 篮板 z: 18%, 助攻 z: 22%, TS z: 20%}；同季至少 5 场才计算 z，球员逐场资料截至 2024。扩展档案的季后赛指数仍可能缺失。</p><p>冠军与总决赛的基础输入使用球队赛季归属，不保证球员实际参加每轮或总决赛。早期缺少防守和高级统计；原快照的一些累计项曾由求和或荣誉汇总生成 0，不能把这些 0 解读为该年代完整观测。当前页面忠实展开已发布输入，不补造历史数据。</p><p>计算来源：scripts/04_build_indicators.py · scripts/data_utils.py · data/processed/model_features_full.csv。公开基础来源为 Kaggle NBA/ABA/BAA 历史数据、NBA 官方荣誉与球队历史；季后赛来自留存逐场数据。具体档案出处可打开球员完整档案。</p></details>'+seasonTable+opponentMarkup+'<h3>该维度的全库排名</h3><p>按当前有效维度指数排序，与用户设置的 β 系数无关；缺失档案列在末尾且不授予名次。只代表本库已收录球员，不是全球所有运动员的完整排名。</p><label class="dimension-search-label" for="dimension-ranking-search">搜索中文名 / 英文名 / 绰号</label><input type="search" id="dimension-ranking-search" autocomplete="off" placeholder="搜索该维度排名"><p id="dimension-ranking-status" role="status"></p><div class="dimension-table-scroll"><table class="dimension-ranking"><thead><tr><th>名次</th><th>球员</th><th>维度指数</th><th>模型贡献</th></tr></thead><tbody id="dimension-ranking-rows"></tbody></table></div><div class="dimension-pagination"><button type="button" class="button outline" id="dimension-prev">上一页</button><span id="dimension-page"></span><button type="button" class="button outline" id="dimension-next">下一页</button></div></div>';
}

export function bindDimensionRanking({root,players,key,coefficient=0,disabled=false,selectedId,name=p=>p.chineseName||p.player_name}) {
  let page=1;
  const el=id=>root.querySelector('#'+id);
  const render=()=>{const result=rankDimension(players,key,{query:el('dimension-ranking-search').value,page});page=result.page;
    el('dimension-ranking-status').textContent='全库 '+players.length+' 位 · 有此维度 '+result.scored+' 位 · 匹配 '+result.total+' 位';
    el('dimension-ranking-rows').innerHTML=result.rows.map(p=>'<tr'+(p.player_id===selectedId?' class="selected"':'')+'><td>'+(p.dimensionRank??'—')+'</td><td><button class="text-button" data-dimension="'+esc(key)+'" data-dimension-player="'+esc(p.player_id)+'">'+esc(name(p))+'</button><small>'+esc(p.player_name)+'</small></td><td>'+fmt(p.dimensionScore)+'</td><td>'+(!finite(p.dimensionScore)?'缺失 → 0':fmt((disabled?0:coefficient)*(p.dimensionScore-50)/10))+'</td></tr>').join('')||'<tr><td colspan="4">没有匹配的球员。</td></tr>';
    el('dimension-page').textContent=page+' / '+result.pages;el('dimension-prev').disabled=page===1;el('dimension-next').disabled=page===result.pages;
  };
  el('dimension-ranking-search').oninput=()=>{page=1;render();};el('dimension-prev').onclick=()=>{page--;render();};el('dimension-next').onclick=()=>{page++;render();};render();
}
