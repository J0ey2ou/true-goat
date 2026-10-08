import { DIMENSIONS } from './model.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number.isFinite(n)?n.toFixed(2):'缺失';
const signed=n=>(n>0?'+':'')+fmt(n);
/** Radar is descriptive: fixed base indices, not model weights or probabilities. */
export function radarMarkup(player) {
  const cx=180,cy=166,r=111,n=DIMENSIONS.length;
  const trigger=key=>' data-dimension="'+esc(key)+'" data-dimension-player="'+esc(player.player_id)+'"';
  const point=(i,value)=>{const a=-Math.PI/2+i*2*Math.PI/n;return [cx+Math.cos(a)*r*value/100,cy+Math.sin(a)*r*value/100];};
  const values=DIMENSIONS.map(d=>player?.components?.[d.key+'_score']);
  const observed=values.map(v=>typeof v==='number'&&Number.isFinite(v));
  const grid=[25,50,75,100].map(v=>'<polygon points="'+DIMENSIONS.map((_,i)=>point(i,v).join(',')).join(' ')+'" fill="none" stroke="currentColor" opacity=".2"/><text x="185" y="'+(cy-r*v/100+4)+'" class="radar-tick">'+v+'</text>').join('');
  const axes=DIMENSIONS.map((d,i)=>{const p=point(i,100),label=point(i,126),anchor=label[0]<cx-15?'end':label[0]>cx+15?'start':'middle';return '<g class="radar-interactive" role="button" tabindex="0" aria-label="查看'+esc(d.label)+'的计算组成与排名"'+trigger(d.key)+'><line x1="'+cx+'" y1="'+cy+'" x2="'+p[0]+'" y2="'+p[1]+'" stroke="currentColor" opacity=".17"/><line x1="'+cx+'" y1="'+cy+'" x2="'+p[0]+'" y2="'+p[1]+'" stroke="transparent" stroke-width="12"/><text x="'+label[0]+'" y="'+label[1]+'" text-anchor="'+anchor+'" dominant-baseline="middle" class="radar-label">'+esc(d.short||d.label)+(observed[i]?'':'（缺）')+'</text></g>';}).join('');
  let marks='';
  if(observed.every(Boolean))marks='<polygon class="radar-shape" points="'+values.map((v,i)=>point(i,Math.max(0,Math.min(100,v))).join(',')).join(' ')+'"/>';
  else for(let i=0;i<n;i++){const j=(i+1)%n;if(observed[i]&&observed[j]){const a=point(i,Math.max(0,Math.min(100,values[i]))),b=point(j,Math.max(0,Math.min(100,values[j])));marks+='<line class="radar-segment" x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'"/>';}}
  marks+=values.map((v,i)=>{if(!observed[i])return '';const p=point(i,Math.max(0,Math.min(100,v)));return '<g class="radar-interactive" role="button" tabindex="0" aria-label="查看'+esc(DIMENSIONS[i].label)+'的计算组成与排名"'+trigger(DIMENSIONS[i].key)+'><circle cx="'+p[0]+'" cy="'+p[1]+'" r="11" fill="transparent"/><circle cx="'+p[0]+'" cy="'+p[1]+'" r="4" class="radar-point"><title>'+esc(DIMENSIONS[i].label)+'：'+fmt(v)+'</title></circle></g>';}).join('');
  return '<div class="radar-wrap"><svg class="score-radar" role="group" aria-label="七维数据画像，点击维度查看组成与排名" viewBox="0 0 360 325">'+grid+marks+axes+'</svg></div><p class="hint">雷达图展示当前有效七维指数（0–100），不是得分占比，不随系数变化。点击轴、名称或圆点查看原始组成、对手修正和排名；缺失项留空。</p><details class="radar-values"><summary>展开七维指数表</summary><table><thead><tr><th>维度</th><th>指数</th></tr></thead><tbody>'+DIMENSIONS.map((d,i)=>'<tr><td><button class="dimension-trigger" type="button"'+trigger(d.key)+'>'+esc(d.label)+' ↗</button></td><td>'+fmt(values[i])+'</td></tr>').join('')+'</tbody></table></details>';
}
export function contributionMarkup(details) {
  const terms=details.termDetails||[],max=Math.max(1,...terms.map(t=>Math.abs(t.contribution)));
  const bars=terms.map(t=>{const width=Math.abs(t.contribution)/max*50;return '<div class="contribution-bar-row"><span>'+esc(t.label)+(t.missing?' · 缺失':'')+'</span><div class="signed-track" aria-hidden="true"><span class="signed-bar '+(t.contribution<0?'negative':'positive')+'" style="width:'+width+'%;'+(t.contribution<0?'right':'left')+':50%"></span></div><b>'+signed(t.contribution)+'</b></div>';}).join('');
  const rows=terms.map(t=>'<tr><td>'+esc(t.label)+(t.missing?'<small class="missing-label">缺失 → 中性贡献 0'+(t.reason?'：'+esc(t.reason):'')+'</small>':'')+'<small class="term-unit">'+esc(t.unitLabel)+'</small></td><td>'+(t.key==='rs_ts'&&t.raw!==null?(t.raw*100).toFixed(2)+'%':fmt(t.raw))+'</td><td>'+fmt(t.coefficient)+'</td><td>'+signed(t.contribution)+'</td></tr>').join('');
  return '<section class="score-contributions"><h3>当前模型：每项实际加分 / 扣分</h3><p>固定起点 50；横轴左负右正，同一分值尺度（两端 ±'+max.toFixed(2)+' 分）。只画当前启用项，不把加分归一为百分比。</p><div class="contribution-bars" role="img" aria-label="有符号得分贡献条形图，详细数值在下方表格">'+(bars||'<p class="hint">全部系数为 0：只有固定起点 50，所有球员并列。</p>')+'</div><div class="score-table-wrap"><table class="contribution-table score-values"><thead><tr><th>已启用模块</th><th>观测值</th><th>系数</th><th>贡献分</th></tr></thead><tbody><tr><td>固定起点</td><td>—</td><td>—</td><td>50.00</td></tr>'+rows+'<tr class="total-row"><td>最终模型分</td><td colspan="2">'+(details.missingModules?.length?details.missingModules.length+' 项中性填补':'')+'</td><td>'+fmt(details.score)+'</td></tr></tbody></table></div><p class="hint">全部已启用项都缺失时显示“未评分”；中性贡献不等于真实能力居中。不同模块的原始单位不能直接比较。</p></section>';
}
