/** Frozen, same-season opponent evidence. User roster changes cannot alter it. */
export const OPPONENT_VERSION = 1;
const finite = Number.isFinite;
const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
const esc = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = (value,digits=2) => finite(value)?value.toFixed(digits):'—';

export function summarizePhase(seasons,phase) {
  const rows=seasons.filter(s=>s.phase===phase&&finite(s.strength)&&finite(s.reference)&&s.coveredGames>0);
  const games=seasons.filter(s=>s.phase===phase).reduce((sum,s)=>sum+(s.games||0),0),coveredGames=rows.reduce((sum,s)=>sum+s.coveredGames,0);
  if(!coveredGames)return null;
  const average=key=>rows.reduce((sum,s)=>sum+s[key]*s.coveredGames,0)/coveredGames;
  return {games,coveredGames,strength:average('strength'),reference:average('reference'),opponentPpg:average('opponentPpg'),coverage:coveredGames/games,
    equalWeightGames:rows.reduce((sum,s)=>sum+s.equalWeightGames,0),firstSeason:Math.min(...rows.map(s=>s.year)),lastSeason:Math.max(...rows.map(s=>s.year)),
    topOpponents:rows.flatMap(s=>(s.topOpponents||[]).map(o=>({...o,year:s.year}))).sort((a,b)=>b.exposure-a.exposure||b.quality-a.quality).slice(0,12)};
}

export function applyOpponentContext(players,payload,{enabled=true,strength=1}={}) {
  const scale=finite(strength)?clamp(strength,0,2):1;
  return players.map(player=>{
    const rawComponents={...(player.rawComponents||player.components)};
    const source=payload?.players?.[player.player_id];
    const components={...rawComponents};
    const context={available:!!source,enabled,strength:scale,throughSeason:payload?.throughSeason??2024,adjustments:{},championships:source?.championships||[],regular_season:null,playoffs:null};
    if(source){
      context.regular_season=source.phases?.rs||summarizePhase(source.seasons||[],'rs');
      context.playoffs=source.phases?.po||summarizePhase(source.seasons||[],'po');
      for(const key of ['regular_season','playoffs','team_success']){
        const base=rawComponents[key+'_score'];
        const phase=context[key];
        const proposed=key==='team_success'
          ? clamp(4*context.championships.reduce((sum,s)=>sum+s.factor-1,0),-8,8)
          : phase?clamp(8*(phase.strength-phase.reference)/50*phase.coverage,-8,8):0;
        const applied=enabled&&finite(base)?clamp(base+proposed*scale,0,100)-base:0;
        if(finite(base))components[key+'_score']=base+applied;
        context.adjustments[key]={base:finite(base)?base:null,proposed,applied,adjusted:finite(base)?base+applied:null};
      }
    }
    return {...player,rawComponents,components,opponentContext:context};
  });
}

export function opponentContextMarkup(player,key) {
  if(!['regular_season','playoffs','team_success'].includes(key))return '';
  const c=player?.opponentContext;
  if(!c?.available)return '<section class="opponent-detail"><h3>对手含金量</h3><p>这位球员还没有可核实的同赛季对手资料，本项不作调整。</p></section>';
  const a=c.adjustments[key],p=c[key];
  let html='<section class="opponent-detail"><h3>对手含金量</h3><p>原始指数 '+fmt(a?.base)+' → 调整后 '+fmt(a?.adjusted)+'；本项实际调整 '+(a?.applied>=0?'+':'')+fmt(a?.applied)+'。'+(c.enabled?'已计入当前模型。':'当前已关闭；保留原始指数。')+'</p>';
  html+='<details><summary>对手实力和排名怎么算？</summary><p>B = 50% × 得分百分位 + 20% × 助攻百分位 + 15% × 篮板百分位 + 15% × TS% 百分位。均在同赛季比较；缺失子项按已知权重折算。出场少于该季最多出场数的 25%（至少 10 场）时向 50 收缩。</p><p>R = 0.8 × B + 0.2 × 实际对手 R 的加权平均，反复计算至变化小于 0.00000001。再按 R 得到同赛季排名百分位。Q = 50% × 对手场均得分百分位 + 50% × 对手 R 排名百分位。</p><p>对手在该场的出场时间决定权重；早期分钟数不全时等权。只统计实际在对面球队出场的人，同场不代表直接防守对位。排名固定于数据快照，不随你添加球员或改变 GOAT 系数循环变化。</p></details>';
  if(key==='team_success'){
    html+='<p>每个已核实夺冠赛季：冠军系数 = 限制在 0.75–1.25 内的 [1 + 0.5 × (该球员季后赛路径 Q − 同季常规赛对手基准) ÷ 100 × 覆盖率]。团队成就指数调整 = 4 × Σ(冠军系数 − 1)，限制在 ±8 内；最终指数限制在 0–100。系数为模型约定。</p>';
    html+=c.championships.length?'<div class="dimension-table-wrap"><table><thead><tr><th>冠军赛季</th><th>球队</th><th>路径强度</th><th>同代基准</th><th>冠军系数</th><th>已核实对手</th></tr></thead><tbody>'+c.championships.map(s=>'<tr><td>'+s.year+'</td><td>'+esc(s.team)+'</td><td>'+fmt(s.strength)+'</td><td>'+fmt(s.reference)+'</td><td>×'+fmt(s.factor,3)+'</td><td>'+s.opponentTeams.map(t=>esc(t.team)+' ('+t.games+')').join(' / ')+'</td></tr>').join('')+'</tbody></table></div>':'<p>没有可核实的夺冠季后赛路径，本项不作调整；这不等于零次总冠军。</p>';
    html+='<p>只调整已证实为冠军球队参加季后赛的赛季；缺少路径的冠军保留原值。该权重衡量已遇到的对手，不代表个人夺冠贡献。</p>';
  }else if(p){
    html+='<p>指数调整 = 8 × (对手强度 − 同代基准) ÷ 50 × 覆盖率，限制在 ±8 内；最终指数限制在 0–100。</p><p>已记录 '+p.firstSeason+'–'+p.lastSeason+'：对手强度 '+fmt(p.strength)+'，同代基准 '+fmt(p.reference)+'；对手赛季场均得分加权平均 '+fmt(p.opponentPpg)+'；可计算 '+p.coveredGames+' / '+p.games+' 场。其中 '+p.equalWeightGames+' 场因分钟资料不足使用等权。</p>';
    html+='<div class="dimension-table-wrap"><table><thead><tr><th>对手</th><th>赛季</th><th>赛季场均得分</th><th>同代实力排名</th><th>相遇场次</th><th>实力 Q</th></tr></thead><tbody>'+p.topOpponents.map(o=>'<tr><td>'+esc(o.name)+'</td><td>'+o.year+'</td><td>'+fmt(o.ppg)+'</td><td>'+o.rank+' / '+o.poolSize+'</td><td>'+o.meetings+'</td><td>'+fmt(o.quality)+'</td></tr>').join('')+'</tbody></table></div><p>下表列出接触权重较高的对手赛季记录；计算使用全部已核实对手。</p>';
  }else html+='<p>该赛段缺少可核实对手，本项不作调整。</p>';
  html+='<p>对手资料截至 2023–24，排除附加赛和 2023 年季中锦标赛决赛；覆盖率只针对已收录比赛，不代表整个生涯完整覆盖。CBA、欧洲及尚未收录赛季不套用 NBA 对手系数。</p><p><a href="https://github.com/gonzalo-gigena/nba-datasets" target="_blank" rel="noopener noreferrer">逐场数据来源 ↗</a> · <a href="https://www.nba.com/news/history-nba-champions" target="_blank" rel="noopener noreferrer">NBA 历届冠军 ↗</a></p></section>';
  return html;
}
