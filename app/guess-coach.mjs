// Only submitted values and their public feedback enter this module. No answer,
// roster lookup or answer ID is accepted, including in online matches.
const EPSILON = 0.00001;
// Heights in the game are stored as rounded whole centimeters.
const integerKeys = new Set(['birthYear','heightCm','firstSeasonYear','teamCount','playoffAppearances','finalsAppearances','mvpCount','championshipCount','dpoyCount','finalsMvpCount','allStarCount']);
export function summarizeClues(rows, attributes) {
  return attributes.map(attribute => {
    const result = {key:attribute.key,label:attribute.label,used:0,unknown:0,lower:null,upper:null,exact:null,overlap:[],excluded:[],integer:integerKeys.has(attribute.key)};
    function bound(side,value,exclusive) {
      const old=result[side];
      if(!old || (side==='lower'?value>old.value:value<old.value)) result[side]={value,exclusive};
      else if(value===old.value) old.exclusive ||= exclusive;
    }
    for(const row of rows){
      const cell=row.feedback.find(item=>item.key===attribute.key);
      if(!cell)continue;
      if(cell.status==='unknown'){result.unknown++;continue;}
      const value=row.values[attribute.key];
      if(attribute.key==='teams'||attribute.key==='positions'){
        if(!Array.isArray(value)||!value.length)continue;
        const values=[...new Set(value)];
        if(cell.status==='correct')result.exact=values;
        else if(cell.status==='close')result.overlap.push(values);
        else if(cell.status==='wrong')result.excluded.push(...values);
        else continue;
        result.used++;continue;
      }
      if(!Number.isFinite(value))continue;
      if(cell.status==='correct'){
        result.exact=value;bound('lower',value-EPSILON,true);bound('upper',value+EPSILON,true);
      }else if(['up','down'].includes(cell.direction)&&['close','wrong'].includes(cell.status)){
        const tolerance=attribute.tolerance+EPSILON;
        if(cell.status==='close'){
          if(cell.direction==='up'){bound('lower',value+EPSILON,false);bound('upper',value+tolerance,false);}
          else{bound('lower',value-tolerance,false);bound('upper',value-EPSILON,false);}
        }else if(cell.direction==='up')bound('lower',value+tolerance,true);
        else bound('upper',value-tolerance,true);
      }else continue;
      result.used++;
    }
    result.excluded=[...new Set(result.excluded)];
    result.overlap=result.overlap.map(group=>group.filter(value=>!result.excluded.includes(value)));
    result.overlap=result.overlap.filter((group,index,all)=>all.findIndex(other=>JSON.stringify([...other].sort())===JSON.stringify([...group].sort()))===index);
    if(result.integer){
      if(result.lower)result.lower={value:result.lower.exclusive?Math.floor(result.lower.value)+1:Math.ceil(result.lower.value),exclusive:false};
      if(result.upper)result.upper={value:result.upper.exclusive?Math.ceil(result.upper.value)-1:Math.floor(result.upper.value),exclusive:false};
    }
    return result;
  });
}
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=value=>Number(value.toFixed(5)).toString();
export function coachMarkup(rows,attributes,teamNames={}){
  if(!rows.length)return '<p class="guess-empty">先猜一位球员，小抄会自动整理可用的约束。</p>';
  return '<p>已汇总 '+rows.length+' 次猜测。数值范围同时结合颜色、箭头和接近阈值。</p><div class="guess-coach-grid">'+summarizeClues(rows,attributes).map(item=>{
    const lines=[],label=value=>esc(item.key==='teams'?teamNames[value]||value:value);
    if(Array.isArray(item.exact))lines.push('完整集合：'+item.exact.map(label).join(' / '));
    else if(typeof item.exact==='number')lines.push('已匹配：'+number(item.exact));
    else if(item.lower&&item.upper&&!item.lower.exclusive&&!item.upper.exclusive&&item.lower.value===item.upper.value)lines.push('范围已收敛：'+number(item.lower.value));
    else if(item.lower||item.upper)lines.push((item.lower?(item.lower.exclusive?'&gt; ':'≥ ')+number(item.lower.value):'')+(item.lower&&item.upper?' · ':'')+(item.upper?(item.upper.exclusive?'&lt; ':'≤ ')+number(item.upper.value):''));
    for(const group of item.overlap)lines.push('至少一项来自：'+group.map(label).join(' / '));
    if(item.excluded.length)lines.push('已排除：'+item.excluded.map(label).join(' / '));
    if(!lines.length)lines.push('尚无可用约束');
    return '<article data-coach-key="'+item.key+'"><h3>'+esc(item.label.replace('*',''))+'</h3>'+lines.map(line=>'<p>'+line+'</p>').join('')+'<small>'+item.used+' 条有效反馈'+(item.unknown?' · '+item.unknown+' 条未知，未用于排除':'')+'</small></article>';
  }).join('')+'</div><p class="guess-small">不同集合条件需要分别满足。数值按游戏的浮点容差计算，显示最多五位小数；这不是候选球员名单，也不额外透露答案。</p>';
}
