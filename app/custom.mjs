import {describeClaim,teamName,teamSearchText} from './custom-claim.mjs';
import {createClaimDialog,setupCustomTour} from './custom-ui.mjs';
import {METRICS,HONORS,EXCLUSIONS,applyExclusions,validateQuery,supportsMetric} from './custom-engine.mjs';
import {searchPlayers,normalizeSearch} from './player-search.mjs';
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
const exclusions=()=>[...$('custom-exclusions').querySelectorAll('input:checked')].map(el=>el.value);
const teamLabel=id=>teamName(id,data,getLanguage(),t);
const option=(value,label)=>`<option value="${esc(value)}">${esc(label)}</option>`;
function fill(id,entries){$(id).innerHTML=option('','不限')+entries.map(([value,label])=>option(value,label)).join('');}
function selectedView(){const p=data.players[selected],record=discoveries?.pools[pool()]?.records[selected];$('custom-selected').innerHTML=p?`<strong>${esc(name(p))}</strong><p>${p.heightCm??'—'} cm · ${p.weightKg??'—'} kg<br>${esc(p.college||t('院校未知'))} · ${esc(p.birthplace||t('出生地未知'))}</p>${['candidate','isolated'].includes(record?.status)?'<button class="button outline" type="button" id="custom-discovery">看一条参考纪录</button>':'<p>'+esc(t(record?.status==='no-data'?'还没有足够的比赛资料，暂时无法为他找纪录。':'暂时没找到适合他的第一，试试换个比较项目。'))+'</p>'}`:'';
  if($('custom-discovery'))$('custom-discovery').onclick=()=>{const q=applyExclusions(record.query,exclusions());$('custom-unit').value=q.unit;configure();for(const key of ['mode','from','to','phase','metric','team','college','birthplace','position'])$('custom-'+key).value=q[key]??'';$('custom-filters').innerHTML='';for(const f of q.filters)addFilter(f.key,f.op,f.value);applyPreferences();run(false);};
}
function choose(index){stop();results=[];reverseResult=null;claimDialog.close();selected=index;$('custom-options').innerHTML='';$('custom-search').value='';selectedView();$('custom-results').innerHTML='';}
function search(input,options,isOpponent=false){
  const text=$(input).value;if(isOpponent){opponent=null;$(input).setCustomValidity(text.trim()?t('请点击候选球员，确认你要比较的对手。'):'');}
  const candidates=text.trim()?searchPlayers(isOpponent?data.players.filter(p=>p.pools.includes('nba-history')):available(),text,{limit:12}):[];
  $(options).innerHTML=candidates.map(p=>`<button type="button" data-player="${data.players.indexOf(p)}">${esc(name(p))}</button>`).join('');
  if(isOpponent)$('custom-opponent-selected').textContent=text.trim()?t(candidates.length?'请点击候选球员，确认你要比较的对手。':'没找到这位球员，试试英文名或其他称呼。'):'';
  $(options).querySelectorAll('button').forEach(button=>button.onclick=()=>{const i=Number(button.dataset.player);if(isOpponent){activateOpponents();opponent=i;$(input).setCustomValidity('');$(input).value=data.players[i].name;$(options).innerHTML='';$('custom-opponent-selected').textContent=name(data.players[i]);}else choose(i);});
}
function addFilter(key='points',op='gte',value=20){
  if($('custom-filters').children.length>=8)return;
  const row=document.createElement('div');row.className='custom-filter';
  row.innerHTML=`<select aria-label="定语指标">${Object.entries(METRICS).filter(([k])=>supportsMetric(k,scope())&&!exclusions().includes(k)).map(([k,label])=>option(k,label)).join('')}</select><select aria-label="比较符号">${Object.entries(symbols).map(([k,v])=>option(k,v)).join('')}</select><input type="number" step="any" required aria-label="定语阈值"><button type="button" aria-label="移除定语">×</button>`;
  row.children[0].value=key;row.children[1].value=op;row.children[2].value=value;row.children[3].onclick=()=>row.remove();$('custom-filters').append(row);
}
function configure(reset=true){
  stop();const cba=pool().startsWith('cba');if(cba)$('custom-unit').value='season';
  $('custom-unit').querySelector('[value="game"]').disabled=cba;
  $('custom-honors-section').hidden=cba;$('custom-honors').innerHTML='';
  const game=$('custom-unit').value==='game';$('custom-mode').querySelector('[value="streak"]').disabled=!game;
  if(!game&&$('custom-mode').value==='streak')$('custom-mode').value='first';
  $('custom-phase').disabled=!game;$('custom-phase').value=cba?'all':'rs';
  for(const id of ['custom-opponent','custom-opponent-search'])$(id).disabled=cba;
  opponent=null;$('custom-opponent-search').value='';$('custom-opponent-search').setCustomValidity('');$('custom-opponent-options').innerHTML='';$('custom-opponent-team-search').value='';$('custom-opponent-team-search').setCustomValidity('');$('custom-opponent-team-status').textContent='';$('custom-opponent-selected').textContent='';
  $('custom-from').value=cba?'2006':game?'2024':'1947';$('custom-to').value=cba||game?'2024':'2026';
  $('custom-metric').innerHTML=Object.entries(METRICS).filter(([k])=>!['age','games','heightCm','weightKg'].includes(k)&&supportsMetric(k,scope())).map(([k,label])=>option(k,label)).join('');
  $('custom-focus').innerHTML=option('all','所有项目')+$('custom-metric').innerHTML;
  fill('custom-team',Object.keys(data.teams).filter(id=>id.startsWith(cba?'CBA:':'NBA:')).map(id=>[id,teamLabel(id)]));
  fill('custom-opponent',Object.keys(data.teams).filter(id=>id.startsWith('NBA:')).map(id=>[id,teamLabel(id)]));
  const persons=available();fill('custom-college',[...new Set(persons.map(p=>p.college).filter(Boolean))].sort().map(v=>[v,v]));
  fill('custom-birthplace',[...new Map(persons.filter(p=>p.birthplaceId).map(p=>[p.birthplaceId,p.birthplace])).entries()].sort((a,b)=>a[1].localeCompare(b[1])));
  if(reset){$('custom-filters').innerHTML='';addFilter('points','gte',game?30:20);}
  renderCoverage();
  if(selected===null||!data.players[selected].pools.includes(pool()))choose(data.players.indexOf(persons.find(p=>p.id==='jordami01')||persons[0]));
  else selectedView();


  results=[];reverseResult=null;claimDialog.close();$('custom-results').innerHTML='';applyPreferences();updatePath();
}
function setupExclusions(){
  let saved=[];try{const value=JSON.parse(localStorage.getItem('true-goat-custom-exclusions:v1')||'[]');if(Array.isArray(value))saved=value.filter(k=>Object.hasOwn(EXCLUSIONS,k));}catch{}
  $('custom-exclusions').innerHTML=Object.entries(EXCLUSIONS).map(([key,label])=>`<label><input type="checkbox" value="${key}" ${saved.includes(key)?'checked':''}><span>${esc(t('不使用'+label))}</span></label>`).join('');
  $('custom-exclusions').onchange=()=>{stop();results=[];reverseResult=null;claimDialog.close();$('custom-results').innerHTML='';$('custom-progress').textContent=t('条件已更新，请重新查询。');applyPreferences();try{localStorage.setItem('true-goat-custom-exclusions:v1',JSON.stringify(exclusions()));}catch{}};
}
function applyPreferences(){
  const excluded=exclusions(),cba=pool().startsWith('cba');
  for(const key of ['team','position','college','birthplace','opponent']){const el=$('custom-'+key);el.disabled=excluded.includes(key)||(key==='opponent'&&cba);if(el.disabled)el.value='';}
  $('custom-opponent-team-search').disabled=cba||excluded.includes('opponent');
  if($('custom-opponent-team-search').disabled){$('custom-opponent-team-search').value='';$('custom-opponent-team-search').setCustomValidity('');$('custom-opponent-team-status').textContent='';}
  $('custom-opponent-search').disabled=cba||excluded.includes('opponentPlayer');
  if($('custom-opponent-search').disabled){opponent=null;$('custom-opponent-search').value='';$('custom-opponent-search').setCustomValidity('');$('custom-opponent-options').innerHTML='';$('custom-opponent-selected').textContent='';}
  const filters=[...$('custom-filters').children].map(r=>({key:r.children[0].value,op:r.children[1].value,value:r.children[2].value}));$('custom-filters').innerHTML='';
  for(const f of filters)if(!excluded.includes(f.key))addFilter(f.key,f.op,f.value);
  $('custom-add-honor').disabled=excluded.includes('honors');if(excluded.includes('honors'))$('custom-honors').innerHTML='';
  $('custom-exclusion-status').textContent=excluded.length?t('已排除的条件不会用于比较；取消勾选即可重新使用。'):t('目前允许使用所有限定，你可以勾选不想用的项目。');opponentHelp();
}
function renderCoverage(){const cba=pool().startsWith('cba'),game=$('custom-unit').value==='game';$('custom-coverage').textContent=t(cba?'可比较 CBA 2005–06 至 2023–24 赛季场均，包含各赛段。暂不支持按对手或连续比赛查询。':game?'可比较 NBA 1946–47 至 2023–24 的单场表现，也可以指定对手。更晚的比赛还未加入。':'可比较 NBA 1946–47 至 2025–26 的常规赛场均。想看面对某个对手的表现？在下方选对手，会改用单场比较。');if(pool().endsWith('active'))$('custom-coverage').textContent+=' '+t('现役名单更新于 2026-10-04；CBA 只包含已确认的国内球员，不含全部外援。');}
function opponentHelp(){const excluded=exclusions();$('custom-opponent-help').textContent=t(pool().startsWith('cba')?'CBA 暂无逐场比赛资料，不能按对手查找。请选择 NBA 球员池使用此功能。':excluded.includes('opponent')&&excluded.includes('opponentPlayer')?'你已排除对手条件；取消上方勾选后即可使用。':$('custom-unit').value==='season'?'可以直接选择对手球队或搜索对手球员。选中后改用单场比较，得分等条件也按单场计算；球员须从候选名单中点击确认。':'正在按单场比较。输入对手姓名后，请点击候选球员；同场作为对手不代表由他直接防守。');}
function activateOpponents(){
  if(pool().startsWith('cba')||$('custom-unit').value==='game')return;
  stop();results=[];reverseResult=null;claimDialog.close();$('custom-results').innerHTML='';
  $('custom-unit').value='game';$('custom-phase').disabled=false;$('custom-mode').querySelector('[value="streak"]').disabled=false;
  const dropped=[],filters=[...$('custom-filters').children].map(r=>({key:r.children[0].value,op:r.children[1].value,value:r.children[2].value}));$('custom-filters').innerHTML='';
  for(const f of filters)if(supportsMetric(f.key,scope()))addFilter(f.key,f.op,f.value);else dropped.push(t(METRICS[f.key]));
  const metric=$('custom-metric').value,focus=$('custom-focus').value;
  if(!supportsMetric(metric,scope())&&!dropped.includes(t(METRICS[metric])))dropped.push(t(METRICS[metric]));
  $('custom-metric').innerHTML=Object.entries(METRICS).filter(([k])=>!['age','games','heightCm','weightKg'].includes(k)&&supportsMetric(k,scope())).map(([k,label])=>option(k,t(label))).join('');
  if(supportsMetric(metric,scope()))$('custom-metric').value=metric;
  $('custom-focus').innerHTML=option('all',t('所有项目'))+$('custom-metric').innerHTML;$('custom-focus').value=focus==='all'||supportsMetric(focus,scope())?focus:'all';
  renderCoverage();opponentHelp();$('custom-progress').textContent=t('已切换为单场比较，年份保持不变，得分等条件现在按单场计算。单场资料截至 2023–24。')+(dropped.length?' '+t('已移除仅适用于赛季的条件：')+dropped.join('、'):'');
}
function searchOpponentTeams(){
  const text=normalizeSearch($('custom-opponent-team-search').value),matches=Object.keys(data.teams).filter(id=>id.startsWith('NBA:')&&(!text||normalizeSearch(teamSearchText(id,data)).includes(text)));
  fill('custom-opponent',matches.map(id=>[id,teamLabel(id)]));$('custom-opponent-team-search').setCustomValidity(text?t('请从下方列表选择对手球队。'):'');$('custom-opponent-team-status').textContent=text?t(matches.length?'请从下方列表选择对手球队。':'没有找到球队，试试英文名或球队简称。'):'';
}
function refreshTeamLabels(){for(const id of ['custom-team','custom-opponent'])for(const option of $(id).options)option.textContent=option.value?teamLabel(option.value):t('不限');if($('custom-opponent').value)$('custom-opponent-team-status').textContent=teamLabel($('custom-opponent').value);}
function query(){return validateQuery({excluded:exclusions(),pool:pool(),unit:$('custom-unit').value,mode:$('custom-mode').value,metric:$('custom-metric').value,
  from:Number($('custom-from').value),to:Number($('custom-to').value),phase:$('custom-phase').value,team:$('custom-team').value,
  position:$('custom-position').value,college:$('custom-college').value,birthplace:$('custom-birthplace').value,
  opponent:$('custom-opponent').disabled?'':$('custom-opponent').value,opponentPlayer:$('custom-opponent-search').disabled?null:opponent,
  honors:[...$('custom-honors').children].map(r=>({key:r.children[0].value,op:r.children[1].value,value:r.children[2].value===''?NaN:Number(r.children[2].value)})),
  filters:[...$('custom-filters').children].map(r=>({key:r.children[0].value,op:r.children[1].value,value:r.children[2].value===''?NaN:Number(r.children[2].value)}))});}
function conditions(q){const texts=[`${t(({'nba-history':'所有 NBA','nba-active':'现役 NBA','cba-history':'所有 CBA','cba-active':'现役 CBA'})[q.pool])} · ${q.from}–${q.to}`,t(q.unit==='game'?'单场 / 连续出场':'赛季场均'),t(({all:'全部赛段',rs:'常规赛',po:'季后赛'})[q.phase])];
  for(const f of q.filters)texts.push(`${t(METRICS[f.key])} ${symbols[f.op]} ${f.value}`);
  if(q.team)texts.push(t('效力球队')+': '+teamLabel(q.team));if(q.position)texts.push(t('位置')+': '+q.position);
  if(q.college)texts.push(t('就读院校')+': '+q.college);if(q.birthplace)texts.push(t('出生地')+': '+(data.players.find(p=>p.birthplaceId===q.birthplace)?.birthplace||q.birthplace));
  if(q.opponent)texts.push(t('对手球队')+': '+teamLabel(q.opponent));if(q.opponentPlayer!==null)texts.push(t('对手球员（同场出战）')+': '+name(data.players[q.opponentPlayer]));return texts;
}
function source(e,q){return e.game?`https://www.basketball-reference.com/boxscores/${encodeURIComponent(e.game)}.html`:q.pool.startsWith('cba')?data.cbaSources[e.year]:`https://www.basketball-reference.com/leagues/${e.year<=1949?'BAA':'NBA'}_${e.year}_per_game.html`;}
function headline(r){return !r.target?'没有符合条件的已知记录':r.isolated?'只有一位球员可比较，不算竞争中的第一':r.first?(r.ties>1?'已收录范围内 · 并列第一':'已收录范围内 · 第一'):'未成为第一';}
function render(){
  if(direction==='reverse'&&reverseResult){renderReverse();return;}
  const shown=results.map((r,i)=>({r,i})).filter(({r})=>!onlyFirst||(r.first&&!r.isolated));
  $('custom-results').innerHTML=shown.slice(0,resultLimit).map(({r,i})=>{
    const q=r.query,target=r.target,e=target?.evidence,mode=t(({first:'最早达成',highest:'数值最高',streak:'最长连续达成'})[q.mode]);
    return `<article class="panel custom-card" data-first="${r.first&&!r.isolated}"><span class="custom-badge">${esc(t(headline(r)))}</span><h2 translate="no">${esc(claim(r).sentence)}</h2><div class="custom-qualifiers">${conditions(q).map(s=>'<span>'+esc(s)+'</span>').join('')}</div>
    <div class="custom-counts"><div><strong>${r.eligible}</strong><span>参与比较的球员</span></div><div><strong>${r.qualified}</strong><span>达到条件的球员</span></div><div><strong>${r.unknown}</strong><span>资料不全的记录</span></div></div>
    <p class="custom-warning">${esc(t('结论只适用于当前比较范围；资料不全，不能直接当作历史纪录。'))}</p>
    ${e?`<p class="custom-evidence">${esc(t('目标球员证据'))}：${esc(e.start?e.start+' → '+e.end:e.date)} · ${esc(e.team?teamLabel(e.team):t('转队合计'))}<br>${['points','rebounds','assists'].map(k=>esc(t(METRICS[k]))+' '+fmt(e.values[k])).join(' · ')}<br><a href="${esc(source(e,q))}" target="_blank" rel="noopener noreferrer">核查数据来源 ↗</a></p>`:''}
    <div class="custom-table-wrap"><table class="custom-table"><thead><tr><th>比较球员</th><th>${esc(mode)}</th><th>证据时间</th></tr></thead><tbody>${r.leaders.map(x=>`<tr data-target="${x.p===selected}"><td>${esc(name(data.players[x.p]))}</td><td>${q.mode==='first'?esc(x.evidence.date):fmt(x.value)}</td><td>${esc(x.evidence.date)}</td></tr>`).join('')}</tbody></table></div><p class="custom-small">${esc(t('目标名次'))}：${r.rank??'—'} · ${esc(t('同值人数'))}：${r.ties} · ${r.rows.toLocaleString()} ${esc(t('条已收录记录'))}</p><button class="button outline" type="button" data-open="${i}">查看完整结论</button><button class="button outline" type="button" data-copy="${i}">复制带限定的结论</button></article>`;
  }).join('');
  if(explored){const summary=document.createElement('div');summary.className='panel custom-result-summary';summary.innerHTML='<strong>'+esc(t('已尝试的组合'))+': '+results.length+' · '+esc(t('与其他球员比较后领先'))+': '+results.filter(r=>r.first&&!r.isolated).length+'</strong><label><input type="checkbox" id="custom-only-first" '+(onlyFirst?'checked':'')+'> '+esc(t('只看与其他球员比较后领先的结果'))+'</label><p class="custom-small">'+esc(t('这里列出这次找到的结果。没找到满意的？换个项目或条件再试试。'))+'</p>';$('custom-results').prepend(summary);$('custom-only-first').onchange=e=>{onlyFirst=e.target.checked;resultLimit=12;render();};}
  if(!shown.length)$('custom-results').insertAdjacentHTML('beforeend','<p>'+esc(t('这次没有找到领先的结果。取消“只看领先”可以查看其他名次。'))+'</p>');
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
  const r=reverseResult;$('custom-results').innerHTML='<article class="panel custom-card"><span class="custom-badge">'+esc(t('符合条件的球员'))+' · '+r.qualified+'</span><h2>'+esc(t('先看谁符合，再看谁领先'))+'</h2><p class="custom-small">'+esc(t('按你选择的方式排序，成绩相同就并列。点击球员查看完整结论，向下可加载更多。'))+'</p><div id="custom-reverse-list" class="custom-reverse-list"></div><p>'+esc(t('资料不全的记录'))+': '+r.unknown+'</p></article>';
  if(!r.leaders.length){$('custom-reverse-list').textContent=t('没有符合条件的已知记录');return;}
  for(const row of r.leaders.slice(0,reverseLimit)){const result=forLeader(row),button=document.createElement('button');button.type='button';button.className='custom-person-result';button.innerHTML='<span>#'+result.rank+'</span><strong>'+esc(name(data.players[row.p]))+'</strong><small>'+esc(r.query.mode==='first'?row.evidence.date:fmt(row.value))+' · '+esc(t('查看完整结论'))+'</small>';button.onclick=()=>openResult(result);$('custom-reverse-list').append(button);}
  if(r.leaders.length>reverseLimit){const button=document.createElement('button');button.type='button';button.className='button outline';button.textContent=t('加载更多结果')+' ('+reverseLimit+' / '+r.leaders.length+')';button.onclick=()=>{reverseLimit+=25;renderReverse();};$('custom-reverse-list').append(button);}
}
function updatePath(){const reverse=direction==='reverse';$('custom-run').className='button '+(reverse?'primary':'outline');$('custom-explore').className='button primary';$('custom-player-controls').hidden=reverse;$('custom-explore').hidden=reverse;$('custom-controls-title').textContent=t(reverse?'哪些球员符合这些条件？':'为谁寻找第一？');$('custom-run').textContent=t(reverse?'按条件寻找球员 →':'验证这句第一 →');$('custom-path-help').textContent=t(reverse?'填条件 → 点「按条件寻找球员」→ 查看符合者。不需要先选一位球员。':'选球员 → 选得分或助攻等项目 → 点「一键找定语」。不想靠球队等条件缩小比较范围？可以在下方排除。');document.querySelectorAll('[data-path]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.path===direction)));}
function addHonor(){if($('custom-honors').children.length>=4)return;const row=document.createElement('div');row.className='custom-filter';row.innerHTML='<select aria-label="荣誉指标">'+Object.entries(HONORS).map(([k,v])=>option(k,t(v))).join('')+'</select><select aria-label="比较符号">'+Object.entries(symbols).map(([k,v])=>option(k,v)).join('')+'</select><input aria-label="荣誉次数" type="number" min="0" step="1" value="1" required><button type="button" aria-label="移除定语">×</button>';row.lastElementChild.onclick=()=>row.remove();$('custom-honors').append(row);}
function stop(){worker?.terminate();worker=null;for(const id of ['custom-run','custom-explore'])$(id).disabled=false;$('custom-cancel').hidden=true;}
function run(explore){
  if(!$('custom-form').reportValidity())return;let q;try{q=query();}catch{$('custom-progress').textContent='请检查年份和定语；最早达成或连续纪录需要至少一个表现阈值。';return;}
  if(selected===null&&direction==='player')return;stop();claimDialog.close();reverseResult=null;results=[];resultLimit=12;reverseLimit=25;onlyFirst=false;explored=explore;$('custom-results').innerHTML='';$('custom-progress').textContent='正在查找符合条件的表现，请稍候…';
  for(const id of ['custom-run','custom-explore'])$(id).disabled=true;$('custom-cancel').hidden=false;
  worker=new Worker(new URL('./custom-worker.mjs',import.meta.url),{type:'module'});
  worker.onmessage=({data:message})=>{if(message.type==='progress')$('custom-progress').textContent=t('正在读取赛季')+` ${message.year} (${message.current}/${message.total})`;else if(message.type==='result'){results=message.results;stop();if(direction==='reverse')reverseResult=results[0];render();const first=direction==='reverse'?reverseResult.leaders[0]&&forLeader(reverseResult.leaders[0]):results[0];if(first)openResult(first);$('custom-progress').textContent=t('已验证条件组合')+': '+message.tested;}else{stop();$('custom-progress').textContent=t('计算失败，请缩小范围或重试。');}};
  worker.onerror=()=>{stop();$('custom-progress').textContent=t('计算失败，请缩小范围或重试。');};worker.postMessage({query:explore&&$('custom-focus').value!=='all'?{...q,metric:$('custom-focus').value}:q,target:selected,explore,reverse:direction==='reverse',focus:$('custom-focus').value,definitions:$('custom-definitions').value});
}
try{
  const response=await fetch('/data/custom-manifest.json');if(!response.ok)throw Error();data=await response.json();registerNames(data.players);
  const precomputed=await fetch('/data/custom-discoveries.json');if(precomputed.ok)discoveries=await precomputed.json();
  $('custom-loading').hidden=true;$('custom-app').hidden=false;setupExclusions();configure();
  $('custom-search').oninput=()=>search('custom-search','custom-options');$('custom-opponent-search').oninput=()=>search('custom-opponent-search','custom-opponent-options',true);
  $('custom-opponent-team-search').oninput=searchOpponentTeams;$('custom-opponent').onchange=()=>{if($('custom-opponent').value)activateOpponents();else{$('custom-opponent-team-search').value='';searchOpponentTeams();}$('custom-opponent-team-search').setCustomValidity('');$('custom-opponent-team-status').textContent=$('custom-opponent').value?teamLabel($('custom-opponent').value):'';};
  $('custom-pool').onchange=$('custom-unit').onchange=()=>configure();$('custom-add').onclick=()=>addFilter();$('custom-form').onsubmit=e=>{e.preventDefault();run(false);};$('custom-explore').onclick=()=>run(true);$('custom-cancel').onclick=()=>{stop();$('custom-progress').textContent='已取消计算';};
  document.querySelectorAll('[data-path]').forEach(b=>b.onclick=()=>{stop();direction=b.dataset.path;results=[];reverseResult=null;claimDialog.close();$('custom-results').innerHTML='';$('custom-progress').textContent='';updatePath();});$('custom-add-honor').onclick=()=>addHonor();setupCustomTour();
  $('custom-sources').innerHTML=data.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.name)} ↗</a>`).join('')+'<a href="https://www.wikidata.org/" target="_blank" rel="noopener noreferrer">Wikidata · CC0 · birthplace</a>';
  $('custom-dataset-summary').textContent=`${data.coverage.nbaGameRows.toLocaleString()} NBA ${t('条已收录记录')} · ${data.coverage.nbaSeasonRows.toLocaleString()} NBA / ${data.coverage.cbaSeasonRows.toLocaleString()} CBA ${t('赛季记录')} · ${data.asOf}`;
  document.addEventListener('goat:language-change',()=>{selectedView();updatePath();renderCoverage();opponentHelp();refreshTeamLabels();if(results.length)render();if(claimDialog.open&&activeResult)claimDialog.show(claim(activeResult),activeResult.target?source(activeResult.target.evidence,activeResult.query):null,{open:false});});
}catch{$('custom-loading').textContent='数据暂未载入，请刷新重试。';}
