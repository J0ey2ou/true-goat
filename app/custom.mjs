import {describeClaim} from './custom-claim.mjs';
import {createClaimDialog,setupCustomTour} from './custom-ui.mjs';
import {METRICS,HONORS,validateQuery,supportsMetric} from './custom-engine.mjs';
import {searchPlayers} from './player-search.mjs';
import {t,registerNames,getLanguage} from './i18n.mjs';
const $=id=>document.getElementById(id),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=x=>Number.isFinite(x)?Number(x.toFixed(2)).toLocaleString():'—';
const symbols={gte:'≥',lte:'≤',gt:'>',lt:'<'};
let data,discoveries,selected=null,opponent=null,worker=null,results=[];
let direction='player',resultLimit=12,activeResult=null,reverseResult=null,reverseLimit=25,explored=false,onlyFirst=false;
const claimDialog=createClaimDialog({copy:b=>copyResult(activeResult,b),view:()=>$('custom-results').scrollIntoView({block:'start'})});
const pool=()=>$('custom-pool').value;
const scope=()=>({pool:pool(),unit:$('custom-unit').value});
const available=()=>data.players.filter(p=>p.pools.includes(pool()));
const name=p=>p?`${t(p.chineseName||p.name)}${p.chineseName&&t(p.chineseName)!==p.name?' / '+p.name:''}`:'—';
const option=(value,label)=>`<option value="${esc(value)}">${esc(label)}</option>`;
function fill(id,entries){$(id).innerHTML=option('','不限')+entries.map(([value,label])=>option(value,label)).join('');}
function selectedView(){const p=data.players[selected],record=discoveries?.pools[pool()]?.records[selected];$('custom-selected').innerHTML=p?`<strong>${esc(name(p))}</strong><p>${esc(p.id)} · ${p.heightCm??'—'} cm · ${p.weightKg??'—'} kg<br>${esc(p.college||t('院校未知'))} · ${esc(p.birthplace||t('出生地未知'))}</p>${['candidate','isolated'].includes(record?.status)?'<button class="button outline" type="button" id="custom-discovery">查看并验证预探索纪录</button>':'<p>'+esc(t(record?.status==='no-data'?'当前统计快照缺少该球员的可用表现，不生成虚构第一。':'尚未找到非孤例的正向第一；可继续自由探索。'))+'</p>'}`:'';
  if($('custom-discovery'))$('custom-discovery').onclick=()=>{const q=record.query;$('custom-unit').value=q.unit;configure();for(const key of ['mode','from','to','phase','metric','team','college','birthplace','position'])$('custom-'+key).value=q[key]??'';$('custom-filters').innerHTML='';for(const f of q.filters)addFilter(f.key,f.op,f.value);run(false);};
}
function choose(index){stop();results=[];reverseResult=null;claimDialog.close();selected=index;$('custom-options').innerHTML='';$('custom-search').value='';selectedView();$('custom-results').innerHTML='';}
function search(input,options,isOpponent=false){
  const text=$(input).value;if(isOpponent)opponent=null;
  const candidates=text.trim()?searchPlayers(isOpponent?data.players.filter(p=>p.pools.includes('nba-history')):available(),text,{limit:12}):[];
  $(options).innerHTML=candidates.map(p=>`<button type="button" data-player="${data.players.indexOf(p)}">${esc(name(p))}</button>`).join('');
  if(isOpponent)$('custom-opponent-selected').textContent='';
  $(options).querySelectorAll('button').forEach(button=>button.onclick=()=>{const i=Number(button.dataset.player);if(isOpponent){opponent=i;$(input).value=data.players[i].name;$(options).innerHTML='';$('custom-opponent-selected').textContent=name(data.players[i]);}else choose(i);});
}
function addFilter(key='points',op='gte',value=20){
  if($('custom-filters').children.length>=8)return;
  const row=document.createElement('div');row.className='custom-filter';
  row.innerHTML=`<select aria-label="定语指标">${Object.entries(METRICS).filter(([k])=>supportsMetric(k,scope())).map(([k,label])=>option(k,label)).join('')}</select><select aria-label="比较符号">${Object.entries(symbols).map(([k,v])=>option(k,v)).join('')}</select><input type="number" step="any" required aria-label="定语阈值"><button type="button" aria-label="移除定语">×</button>`;
  row.children[0].value=key;row.children[1].value=op;row.children[2].value=value;row.children[3].onclick=()=>row.remove();$('custom-filters').append(row);
}
function configure(reset=true){
  stop();const cba=pool().startsWith('cba');if(cba)$('custom-unit').value='season';
  $('custom-unit').querySelector('[value="game"]').disabled=cba;
  $('custom-honors-section').hidden=cba;$('custom-honors').innerHTML='';
  const game=$('custom-unit').value==='game';$('custom-mode').querySelector('[value="streak"]').disabled=!game;
  if(!game&&$('custom-mode').value==='streak')$('custom-mode').value='first';
  $('custom-phase').disabled=!game;$('custom-phase').value=cba?'all':'rs';
  for(const id of ['custom-opponent','custom-opponent-search'])$(id).disabled=!game;
  opponent=null;$('custom-opponent-search').value='';$('custom-opponent-selected').textContent='';
  $('custom-from').value=cba?'2006':game?'2024':'1947';$('custom-to').value=cba||game?'2024':'2026';
  $('custom-metric').innerHTML=Object.entries(METRICS).filter(([k])=>!['age','games','heightCm','weightKg'].includes(k)&&supportsMetric(k,scope())).map(([k,label])=>option(k,label)).join('');
  $('custom-focus').innerHTML=option('all','全部表现维度')+$('custom-metric').innerHTML;
  fill('custom-team',Object.entries(data.teams).filter(([id])=>id.startsWith(cba?'CBA:':'NBA:')));
  fill('custom-opponent',Object.entries(data.teams).filter(([id])=>id.startsWith('NBA:')));
  const persons=available();fill('custom-college',[...new Set(persons.map(p=>p.college).filter(Boolean))].sort().map(v=>[v,v]));
  fill('custom-birthplace',[...new Map(persons.filter(p=>p.birthplaceId).map(p=>[p.birthplaceId,p.birthplace])).entries()].sort((a,b)=>a[1].localeCompare(b[1])));
  if(reset){$('custom-filters').innerHTML='';addFilter('points','gte',game?30:20);}
  $('custom-coverage').textContent=cba?'CBA：已收录 2005–06 至 2023–24 的全部赛段场均。逐场、年龄与高阶数据暂缺；不伪造连续纪录。':game?'NBA 逐场：1946–47 至 2023–24；按选定年份下载。早期资料和高阶字段存在缺失，连续纪录只针对已收录出场。':'NBA 赛季：1946–47 至 2025–26 常规赛场均。转队用合计行，不重复统计。';
  if(selected===null||!data.players[selected].pools.includes(pool()))choose(data.players.indexOf(persons.find(p=>p.id==='jordami01')||persons[0]));
  else selectedView();
  if(pool().endsWith('active'))$('custom-coverage').textContent+=' '+t('现役名单是 2026-10-04 快照；CBA 仅含已核实的国内球员注册，不含全部外援。');
  const found=discoveries?.pools[pool()];if(found)$('custom-coverage').textContent+=' '+t('预探索覆盖')+`: ${found.players} · `+t('有表现数据')+`: ${found.withData} · `+t('已找到正向候选纪录')+`: ${found.found} · `+t('仅单人样本')+`: ${found.isolated||0}. `+t('预探索会使用更多档案组合，载入后按相同引擎重新验证；不是全史认证。');
  results=[];reverseResult=null;claimDialog.close();$('custom-results').innerHTML='';updatePath();
}
function query(){return validateQuery({pool:pool(),unit:$('custom-unit').value,mode:$('custom-mode').value,metric:$('custom-metric').value,
  from:Number($('custom-from').value),to:Number($('custom-to').value),phase:$('custom-phase').value,team:$('custom-team').value,
  position:$('custom-position').value,college:$('custom-college').value,birthplace:$('custom-birthplace').value,
  opponent:$('custom-opponent').disabled?'':$('custom-opponent').value,opponentPlayer:$('custom-opponent-search').disabled?null:opponent,
  honors:[...$('custom-honors').children].map(r=>({key:r.children[0].value,op:r.children[1].value,value:r.children[2].value===''?NaN:Number(r.children[2].value)})),
  filters:[...$('custom-filters').children].map(r=>({key:r.children[0].value,op:r.children[1].value,value:r.children[2].value===''?NaN:Number(r.children[2].value)}))});}
function conditions(q){const texts=[`${q.pool} · ${q.from}–${q.to}`,t(q.unit==='game'?'单场 / 连续出场':'赛季场均'),t(({all:'全部赛段',rs:'常规赛',po:'季后赛'})[q.phase])];
  for(const f of q.filters)texts.push(`${t(METRICS[f.key])} ${symbols[f.op]} ${f.value}`);
  if(q.team)texts.push(t('效力球队')+': '+t(data.teams[q.team]||q.team));if(q.position)texts.push(t('位置')+': '+q.position);
  if(q.college)texts.push(t('就读院校')+': '+q.college);if(q.birthplace)texts.push(t('出生地')+': '+(data.players.find(p=>p.birthplaceId===q.birthplace)?.birthplace||q.birthplace));
  if(q.opponent)texts.push(t('对手球队')+': '+t(data.teams[q.opponent]||q.opponent));if(q.opponentPlayer!==null)texts.push(t('对手球员（同场出战）')+': '+name(data.players[q.opponentPlayer]));return texts;
}
function source(e,q){return e.game?`https://www.basketball-reference.com/boxscores/${encodeURIComponent(e.game)}.html`:q.pool.startsWith('cba')?data.cbaSources[e.year]:`https://www.basketball-reference.com/leagues/${e.year<=1949?'BAA':'NBA'}_${e.year}_per_game.html`;}
function headline(r){return !r.target?'没有符合条件的已知记录':r.isolated?'孤例：条件下只剩一位可比较球员':r.first?(r.ties>1?'已收录范围内 · 并列第一':'已收录范围内 · 第一'):'未成为第一';}
function render(){
  if(direction==='reverse'&&reverseResult){renderReverse();return;}
  const shown=results.map((r,i)=>({r,i})).filter(({r})=>!onlyFirst||(r.first&&!r.isolated));
  $('custom-results').innerHTML=shown.slice(0,resultLimit).map(({r,i})=>{
    const q=r.query,target=r.target,e=target?.evidence,mode=t(({first:'最早达成',highest:'数值最高',streak:'最长连续达成'})[q.mode]);
    return `<article class="panel custom-card" data-first="${r.first&&!r.isolated}"><span class="custom-badge">${esc(t(headline(r)))}</span><h2 translate="no">${esc(claim(r).sentence)}</h2><div class="custom-qualifiers">${conditions(q).map(s=>'<span>'+esc(s)+'</span>').join('')}</div>
    <div class="custom-counts"><div><strong>${r.eligible}</strong><span>条件内比较球员</span></div><div><strong>${r.qualified}</strong><span>达成表现球员</span></div><div><strong>${r.unknown}</strong><span>缺字段而排除的记录</span></div></div>
    <p class="custom-warning">${esc(t('仅代表所选池和数据覆盖范围；筛选和缺失可能制造“第一”。'))}</p>
    ${e?`<p class="custom-evidence">${esc(t('目标球员证据'))}：${esc(e.start?e.start+' → '+e.end:e.date)} · ${esc(t(data.teams[e.team]||e.team||'转队合计'))}<br>${['points','rebounds','assists'].map(k=>esc(t(METRICS[k]))+' '+fmt(e.values[k])).join(' · ')}<br><a href="${esc(source(e,q))}" target="_blank" rel="noopener noreferrer">核查数据来源 ↗</a></p>`:''}
    <div class="custom-table-wrap"><table class="custom-table"><thead><tr><th>比较球员</th><th>${esc(mode)}</th><th>证据时间</th></tr></thead><tbody>${r.leaders.map(x=>`<tr data-target="${x.p===selected}"><td>${esc(name(data.players[x.p]))}</td><td>${q.mode==='first'?esc(x.evidence.date):fmt(x.value)}</td><td>${esc(x.evidence.date)}</td></tr>`).join('')}</tbody></table></div><p class="custom-small">${esc(t('目标名次'))}：${r.rank??'—'} · ${esc(t('同值人数'))}：${r.ties} · ${r.rows.toLocaleString()} ${esc(t('条已收录记录'))}</p><button class="button outline" type="button" data-open="${i}">查看完整结论</button><button class="button outline" type="button" data-copy="${i}">复制带限定的结论</button></article>`;
  }).join('');
  if(explored){const summary=document.createElement('div');summary.className='panel custom-result-summary';summary.innerHTML='<strong>'+esc(t('已验证候选'))+': '+results.length+' · '+esc(t('有比较对象的第一'))+': '+results.filter(r=>r.first&&!r.isolated).length+'</strong><label><input type="checkbox" id="custom-only-first" '+(onlyFirst?'checked':'')+'> '+esc(t('只看有比较对象的第一'))+'</label><p class="custom-small">'+esc(t('展示全部已验证组合，可继续修改条件探索；不保证覆盖所有可能。'))+'</p>';$('custom-results').prepend(summary);$('custom-only-first').onchange=e=>{onlyFirst=e.target.checked;resultLimit=12;render();};}
  if(!shown.length)$('custom-results').insertAdjacentHTML('beforeend','<p>'+esc(t('本次范围内未找到有比较对象的第一；可取消筛选查看其他结果。'))+'</p>');
  if(shown.length>resultLimit){const more=document.createElement('button');more.className='button outline';more.textContent=t('加载更多结果')+' ('+Math.min(resultLimit,shown.length)+' / '+shown.length+')';more.onclick=()=>{resultLimit+=12;render();};$('custom-results').append(more);}
  $('custom-results').querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>copyResult(results[Number(b.dataset.copy)],b));
  $('custom-results').querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openResult(results[Number(b.dataset.open)]));
}
function claim(r){return describeClaim(r,data.players[r.target?.p??selected],data,{language:getLanguage(),translate:t});}
function openResult(r){activeResult=r;claimDialog.show(claim(r),r.target?source(r.target.evidence,r.query):null);}
async function copyResult(r,button){
  if(!r)return;const c=claim(r),text=[c.sentence,c.evidence,c.caveat,r.target?source(r.target.evidence,r.query):'',...(r.query.honors?.length?['https://www.nba.com/history/awards']:[]),'https://j0ey2ou.github.io/true-goat/custom.html'].filter(Boolean).join('\n');
  try{await navigator.clipboard.writeText(text);button.textContent=t('已复制');}catch{button.parentElement.querySelector('.custom-copy-fallback')?.remove();const area=document.createElement('textarea');area.className='custom-copy-fallback';area.setAttribute('translate','no');area.setAttribute('aria-label',t('复制完整结论与依据'));area.readOnly=true;area.value=text;button.after(area);area.focus();area.select();}
}
function forLeader(row){const r=reverseResult,ahead=r.leaders.filter(x=>r.query.mode==='first'?x.value<row.value:x.value>row.value).length,ties=r.leaders.filter(x=>x.value===row.value).length;return {...r,target:row,rank:ahead+1,ties,first:ahead===0,unique:ahead===0&&ties===1};}
function renderReverse(){
  const r=reverseResult;$('custom-results').innerHTML='<article class="panel custom-card"><span class="custom-badge">'+esc(t('符合条件的球员'))+' · '+r.qualified+'</span><h2>'+esc(t('先看谁符合，再看谁领先'))+'</h2><p class="custom-small">'+esc(t('按所选第一类型排序；并列共享名次，名单没有截断为前十。'))+'</p><div id="custom-reverse-list" class="custom-reverse-list"></div><p>'+esc(t('缺字段而排除的记录'))+': '+r.unknown+'</p></article>';
  if(!r.leaders.length){$('custom-reverse-list').textContent=t('没有符合条件的已知记录');return;}
  for(const row of r.leaders.slice(0,reverseLimit)){const result=forLeader(row),button=document.createElement('button');button.type='button';button.className='custom-person-result';button.innerHTML='<span>#'+result.rank+'</span><strong>'+esc(name(data.players[row.p]))+'</strong><small>'+esc(r.query.mode==='first'?row.evidence.date:fmt(row.value))+' · '+esc(t('查看完整结论'))+'</small>';button.onclick=()=>openResult(result);$('custom-reverse-list').append(button);}
  if(r.leaders.length>reverseLimit){const button=document.createElement('button');button.type='button';button.className='button outline';button.textContent=t('加载更多结果')+' ('+reverseLimit+' / '+r.leaders.length+')';button.onclick=()=>{reverseLimit+=25;renderReverse();};$('custom-reverse-list').append(button);}
}
function updatePath(){const reverse=direction==='reverse';$('custom-run').className='button '+(reverse?'primary':'outline');$('custom-explore').className='button primary';$('custom-player-controls').hidden=reverse;$('custom-explore').hidden=reverse;$('custom-controls-title').textContent=t(reverse?'哪些球员符合这些条件？':'为谁寻找第一？');$('custom-run').textContent=t(reverse?'按条件寻找球员 →':'验证这句第一 →');$('custom-path-help').textContent=t(reverse?'条件 → 全部符合者 → 排序与证据。不需要预先选择球员。':'球员 → 选择维度 → 一键找定语。也可手动设置条件验证一句第一。');document.querySelectorAll('[data-path]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.path===direction)));}
function addHonor(){if($('custom-honors').children.length>=4)return;const row=document.createElement('div');row.className='custom-filter';row.innerHTML='<select aria-label="荣誉指标">'+Object.entries(HONORS).map(([k,v])=>option(k,t(v))).join('')+'</select><select aria-label="比较符号">'+Object.entries(symbols).map(([k,v])=>option(k,v)).join('')+'</select><input aria-label="荣誉次数" type="number" min="0" step="1" value="1" required><button type="button" aria-label="移除定语">×</button>';row.lastElementChild.onclick=()=>row.remove();$('custom-honors').append(row);}
function stop(){worker?.terminate();worker=null;for(const id of ['custom-run','custom-explore'])$(id).disabled=false;$('custom-cancel').hidden=true;}
function run(explore){
  if(!$('custom-form').reportValidity())return;let q;try{q=query();}catch{$('custom-progress').textContent='请检查年份和定语；最早达成或连续纪录需要至少一个表现阈值。';return;}
  if(selected===null&&direction==='player')return;stop();claimDialog.close();reverseResult=null;results=[];resultLimit=12;reverseLimit=25;onlyFirst=false;explored=explore;$('custom-results').innerHTML='';$('custom-progress').textContent='正在按条件核验；不会查询或编造缺失数据…';
  for(const id of ['custom-run','custom-explore'])$(id).disabled=true;$('custom-cancel').hidden=false;
  worker=new Worker(new URL('./custom-worker.mjs',import.meta.url),{type:'module'});
  worker.onmessage=({data:message})=>{if(message.type==='progress')$('custom-progress').textContent=t('正在读取赛季')+` ${message.year} (${message.current}/${message.total})`;else if(message.type==='result'){results=message.results;stop();if(direction==='reverse')reverseResult=results[0];render();const first=direction==='reverse'?reverseResult.leaders[0]&&forLeader(reverseResult.leaders[0]):results[0];if(first)openResult(first);$('custom-progress').textContent=t('已验证条件组合')+': '+message.tested;}else{stop();$('custom-progress').textContent=t('计算失败，请缩小范围或重试。');}};
  worker.onerror=()=>{stop();$('custom-progress').textContent=t('计算失败，请缩小范围或重试。');};worker.postMessage({query:explore&&$('custom-focus').value!=='all'?{...q,metric:$('custom-focus').value}:q,target:selected,explore,reverse:direction==='reverse',focus:$('custom-focus').value,definitions:$('custom-definitions').value});
}
try{
  const response=await fetch('/data/custom-manifest.json');if(!response.ok)throw Error();data=await response.json();registerNames(data.players);
  const precomputed=await fetch('/data/custom-discoveries.json');if(precomputed.ok)discoveries=await precomputed.json();
  $('custom-loading').hidden=true;$('custom-app').hidden=false;configure();
  $('custom-search').oninput=()=>search('custom-search','custom-options');$('custom-opponent-search').oninput=()=>search('custom-opponent-search','custom-opponent-options',true);
  $('custom-pool').onchange=$('custom-unit').onchange=()=>configure();$('custom-add').onclick=()=>addFilter();$('custom-form').onsubmit=e=>{e.preventDefault();run(false);};$('custom-explore').onclick=()=>run(true);$('custom-cancel').onclick=()=>{stop();$('custom-progress').textContent='已取消计算';};
  document.querySelectorAll('[data-path]').forEach(b=>b.onclick=()=>{stop();direction=b.dataset.path;results=[];reverseResult=null;claimDialog.close();$('custom-results').innerHTML='';$('custom-progress').textContent='';updatePath();});$('custom-add-honor').onclick=()=>addHonor();setupCustomTour();
  $('custom-sources').innerHTML=data.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.name)} ↗</a>`).join('')+'<a href="https://www.wikidata.org/" target="_blank" rel="noopener noreferrer">Wikidata · CC0 · birthplace</a>';
  $('custom-dataset-summary').textContent=`${data.coverage.nbaGameRows.toLocaleString()} NBA ${t('条已收录记录')} · ${data.coverage.nbaSeasonRows.toLocaleString()} NBA / ${data.coverage.cbaSeasonRows.toLocaleString()} CBA ${t('赛季记录')} · ${data.asOf}`;
  document.addEventListener('goat:language-change',()=>{selectedView();updatePath();if(results.length)render();if(claimDialog.open&&activeResult)claimDialog.show(claim(activeResult),activeResult.target?source(activeResult.target.evidence,activeResult.query):null,{open:false});});
}catch{$('custom-loading').textContent='数据暂未载入，请刷新重试。';}
