import { DIMENSIONS, sanitizeCoefficients, setCoefficient, scorePlayer, rankPlayers, advisePlayer, searchImprovement } from './model.mjs';
import { MODULES, MODULE_VERSION, sanitizeAdvanced, scoreWithModules, rankWithModules, overlapWarnings } from './modules.mjs';
import { radarMarkup, contributionMarkup } from './score-charts.mjs';
import { createPlayerLibrary, mergeSelectedPlayers } from './player-library.mjs';
import { searchPlayers } from './player-search.mjs';
import { registerNames } from './i18n.mjs';

const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const chinese = {
  jordami01:'迈克尔·乔丹',jamesle01:'勒布朗·詹姆斯',abdulka01:'卡里姆·贾巴尔',johnsma02:'魔术师约翰逊',
  russebi01:'比尔·拉塞尔',birdla01:'拉里·伯德',onealsh01:'沙奎尔·奥尼尔',chambwi01:'威尔特·张伯伦',
  duncati01:'蒂姆·邓肯',bryanko01:'科比·布莱恩特',curryst01:'斯蒂芬·库里',duranke01:'凯文·杜兰特',
  olajuha01:'哈基姆·奥拉朱旺',jokicni01:'尼古拉·约基奇',roberos01:'奥斯卡·罗伯特森',westje01:'杰里·韦斯特',
  malonmo01:'摩西·马龙',garneke01:'凯文·加内特',antetgi01:'扬尼斯·阿德托昆博',nowitdi01:'德克·诺维茨基',
  malonka01:'卡尔·马龙',stockjo01:'约翰·斯托克顿',wadedw01:'德维恩·韦德',robinda01:'大卫·罗宾逊'
};
const name = p => chinese[p.player_id] || p.chineseName || p.player_name;
const shortName = p => name(p).replace('迈克尔·','').replace('卡里姆·','').replace('勒布朗·','').replace('魔术师约翰逊','魔术师');
const fmt = n => Number.isFinite(n) ? n.toFixed(2) : '—';
const coef = n => Number.isFinite(n) ? n.toFixed(3) : '—';
const signed = n => Number.isFinite(n) ? (n > 0 ? '+' : '') + n.toFixed(2) : '—';
const STORAGE = 'true-goat-v04';
let data, experts, players, coefficients, priorCoefficient = 0, preset, targetId = 'jordami01', baseline, ranking, dirty = false, all = false, result = null, suggestions = [], toastTimer;
let advanced=sanitizeAdvanced(),directory=new Map(),directoryAvailable=false;
let basePlayers=[],baseDirectory=new Map(),library,uiReady=false,pendingTarget=null;
const activeDetails=p=>scoreWithModules(p,coefficients,priorCoefficient,advanced,directory.get(p.player_id));
function rebuildPlayerChoices() {
  $('target-select').innerHTML=[...players].sort((a,b)=>(a.rankings?.posterior_rank||999)-(b.rankings?.posterior_rank||999)).map(p=>'<option value="'+esc(p.player_id)+'">'+esc(name(p))+' · '+esc(p.player_name)+(p.customPlayer?' · 自选':'')+'</option>').join('');
  document.querySelector('.hero-number').textContent=players.length;
  const navCount=document.querySelector('.page-nav a[href*="players"] span');if(navCount)navCount.textContent=players.length;
}
function updateCustomPlayers({profiles,models}) {
  players=mergeSelectedPlayers(basePlayers,models,'player_id');directory=new Map([...baseDirectory,...profiles.map(p=>[p.id,p])]);
  if(pendingTarget&&players.some(p=>p.player_id===pendingTarget)){targetId=pendingTarget;pendingTarget=null;}
  if(!players.some(p=>p.player_id===targetId))targetId='jordami01';
  if(uiReady){baselineRanking();rebuildPlayerChoices();renderAll();persist();}
}

function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').hidden = true, 4000); }
function expert() { return experts.find(e => e.id === preset); }
function presetCoefficients() { return expert()?.coefficients || Object.fromEntries(DIMENSIONS.map(d=>[d.key,data.default_user_weights[d.key]*10])); }
function baselineRanking() { baseline = new Map(rankPlayers(players,presetCoefficients(),0).map(p=>[p.player_id,p.rank])); }
function reset(id = preset) {
  preset=id; coefficients=sanitizeCoefficients(presetCoefficients()); priorCoefficient=0; advanced=sanitizeAdvanced(); dirty=false; result=null;
  baselineRanking(); $('expert-select').value=preset; renderAll(); persist();
}
function stateObject() { return {v:4,preset,coefficients,priorCoefficient,intercept:50,targetId,advanced,customPlayerIds:library?.ids() || []}; }
function persist() {
  const serialized=JSON.stringify(stateObject());
  try { localStorage.setItem(STORAGE,serialized); } catch {}
  if(location.hash.startsWith('#model=')) try { history.replaceState(null,'','#model='+encodeURIComponent(serialized)); } catch {}
}
async function restore() {
  try {
    const hash=location.hash.startsWith('#model=')?JSON.parse(decodeURIComponent(location.hash.slice(7))):null;
    const saved=hash || JSON.parse(localStorage.getItem(STORAGE)||localStorage.getItem('true-goat-v03')||'null');
    if(!saved || ![3,4].includes(saved.v) || !experts.some(e=>e.id===saved.preset) && saved.preset!=='balanced') return;
    const incoming=saved.v===4?saved.coefficients:saved.weights;
    if(!DIMENSIONS.every(d=>typeof incoming?.[d.key]==='number' && Number.isFinite(incoming[d.key]) && incoming[d.key]>=0))return;
    if(hash&&Array.isArray(saved.customPlayerIds))await library.replaceIds(saved.customPlayerIds);
    preset=saved.preset;
    if(saved.v===3){
      const a=Math.max(0,Math.min(1,Number(saved.anchor)||0));
      const total=DIMENSIONS.reduce((sum,d)=>sum+incoming[d.key],0);
      coefficients=sanitizeCoefficients(Object.fromEntries(DIMENSIONS.map(d=>[d.key,total?incoming[d.key]/total*10*(1-a):0])));
      priorCoefficient=a*10;
      toast('已迁移旧设置为独立系数；缺失项改用中性填补，结果可能变化。');
    }else{
      coefficients=sanitizeCoefficients(incoming);
      priorCoefficient=Math.max(0,Math.min(10,Number(saved.priorCoefficient)||0));
    }
    if(players.some(p=>p.player_id===saved.targetId))targetId=saved.targetId;
    advanced=sanitizeAdvanced(saved.advanced);
    dirty=advanced.enabled || priorCoefficient!==0 || DIMENSIONS.some(d=>Math.abs(coefficients[d.key]-presetCoefficients()[d.key])>1e-7);
  } catch { toast('无法读取模型链接，已保留当前起点。'); }
}
function updateSliders() {
  for(const d of DIMENSIONS){
    const input=$('coef-'+d.key);
    input.value=coefficients[d.key]; input.style.setProperty('--fill',coefficients[d.key]*10+'%');
    $('coef-number-'+d.key).value=coef(coefficients[d.key]);
    const removed=advanced.enabled&&advanced.disabledBase.includes(d.key);
    input.disabled=removed;$('coef-number-'+d.key).disabled=removed;
    input.closest('.slider-row').classList.toggle('module-disabled',removed);
    $('base-enabled-'+d.key).checked=!advanced.disabledBase.includes(d.key);
    $('base-enabled-'+d.key).closest('label').hidden=!advanced.enabled;
  }
  $('prior-coef').value=priorCoefficient; $('prior-coef').style.setProperty('--fill',priorCoefficient*10+'%');
  $('prior-number').value=coef(priorCoefficient);
  $('model-state').textContent=advanced.enabled?'高级模块 · 独立加性模型':dirty?'独立系数 · 个人模型':expert()?'评论员加性拟合':'均衡加性起点';
  updateModuleControls();
}
function moduleDefinition(m) {
  return '<dl><dt>计算公式</dt><dd class="module-formula">'+esc(m.formula)+'</dd><dt>定义 / 原始单位</dt><dd>'+esc(m.definition)+' 单位：'+esc(m.unitLabel)+'。</dd><dt>来源与截止</dt><dd>'+esc(m.source)+'；'+esc(m.cutoff)+'</dd><dt>缺失处理</dt><dd>'+esc(m.missing)+'</dd></dl>';
}
function buildModuleCards() {
  $('module-cards').innerHTML=MODULES.map((m,i)=>(i===0?'<h3 class="module-group-heading">基础统计与荣誉 · 自由组合</h3>':m.kind==='interaction'&&MODULES[i-1].kind!=='interaction'?'<h3 class="module-group-heading">可选协同项 · 明确的非线性偏好</h3>':'')+'<article class="module-card" id="module-card-'+m.key+'"><label class="module-check" for="module-enabled-'+m.key+'"><input type="checkbox" id="module-enabled-'+m.key+'" data-module-toggle="'+m.key+'"><span>'+esc(m.label)+'</span></label><div class="module-controls"><input type="range" min="0" max="10" step="0.01" id="module-range-'+m.key+'" data-module-range="'+m.key+'" aria-label="'+esc(m.label)+'系数"><input type="number" min="0" max="10" step="0.01" class="coef-number" id="module-number-'+m.key+'" data-module-number="'+m.key+'" aria-label="'+esc(m.label)+'系数数值"></div><details><summary>模块定义、标准与来源</summary>'+moduleDefinition(m)+'</details></article>').join('');
}
function updateModuleControls() {
  $('advanced-enabled').checked=advanced.enabled;$('module-builder').hidden=!advanced.enabled;
  for(const m of MODULES){const s=advanced.modules[m.key];$('module-enabled-'+m.key).checked=s.enabled;$('module-range-'+m.key).value=s.coefficient;$('module-number-'+m.key).value=s.coefficient;$('module-range-'+m.key).disabled=!s.enabled;$('module-number-'+m.key).disabled=!s.enabled;$('module-range-'+m.key).style.setProperty('--fill',s.coefficient*10+'%');$('module-card-'+m.key).classList.toggle('is-selected',s.enabled);}
  const count=MODULES.filter(m=>advanced.modules[m.key].enabled&&advanced.modules[m.key].coefficient>0).length+DIMENSIONS.filter(d=>!advanced.disabledBase.includes(d.key)&&coefficients[d.key]>0).length+(priorCoefficient>0?1:0);
  $('module-count').textContent='实际参与计分：'+count+' 项'+(!directoryAvailable?' · 球员库未载入，原始统计模块将显示缺失':'');
  const warnings=overlapWarnings(coefficients,advanced);$('module-warnings').hidden=!warnings.length;$('module-warnings').innerHTML='<strong>信息重叠提醒</strong><ul>'+warnings.map(w=>'<li>'+esc(w)+'</li>').join('')+'</ul>';
}
function changeAdvanced(next) {
  advanced=sanitizeAdvanced(next);dirty=true;result=null;updateSliders();renderRanking();renderTarget();$('search-result').innerHTML='';persist();
}
function showScore(id) {
  const p=ranking.find(p=>p.player_id===id);if(!p)return;
  const details=activeDetails(p);
  showDialog(name(p)+' · 多维得分图','<div class="score-modal-summary"><div>'+esc(p.player_name)+'<br><small>'+(advanced.enabled?'高级自选模块模型':'基础七维加性模型')+' · '+(p.rank===null?'未评分':'第 '+p.rank+' 名')+'</small></div><strong>'+(details.score===null?'未评分':fmt(details.score)+' 分')+'</strong></div><h3>七维数据画像</h3>'+radarMarkup(p)+contributionMarkup(details)+'<h3>本次模块的公式与数据截止</h3><div class="module-definition-list">'+details.termDetails.map(t=>'<details><summary>'+esc(t.label)+'</summary><p>'+esc(t.formula)+'</p><p>'+esc(t.cutoff)+'</p></details>').join('')+'</div><p><a href="/players?player='+esc(p.player_id)+'">查看原始统计和球员背景 ↗</a></p>');
}
function showAdvancedModel() {
  const p=currentTarget(),details=activeDetails(p),warnings=overlapWarnings(coefficients,advanced);
  const equations=details.termDetails.map(t=>'+ '+coef(t.coefficient)+' × '+(t.key==='public_prior'?'(大众参考 − 50) ÷ 10':DIMENSIONS.some(d=>d.key===t.key)?'('+t.label+' − 50) ÷ 10':MODULES.find(m=>m.key===t.key).formula.replace(/^β × /,'')));
  showDialog('我的高级模块模型','<p class="model-summary">你选择了 '+details.termDetails.length+' 个实际计分项。所有模块的贡献独立相加；基准与步长固定，不做百分比归一，不保证某位球员第一。</p><pre class="model-active-formula">'+esc('S = 50\n'+equations.join('\n'))+'</pre><p>基础评论员预设仅拟合七维系数，没有拟合这些新增模块。现在是你的自定义评价规则，不是评论员本人的完整公式；“较起点”依然对比基础预设。</p>'+contributionMarkup(details)+(warnings.length?'<div class="module-warnings">'+warnings.map(esc).join('<br>')+'</div>':'')+'<h3>已选择的新模块标准</h3><div class="module-definition-list">'+MODULES.filter(m=>advanced.modules[m.key].enabled).map(m=>'<details><summary>'+esc(m.label)+'</summary>'+moduleDefinition(m)+'</details>').join('')+'</div><p>原始场均统计未做时代校正。奖项设立年份不同，荣誉为 0 不代表该球员曾有同样的竞争机会。缺失项贡献为 0，不重新分配其他项；所有启用项都缺失时不评分。协同项只采用高于基准的正部乘积，低于基准不会“负负得正”。</p><div class="model-actions"><button id="export-model" class="button primary">下载完整模型 JSON ↓</button><button id="modal-score" class="button outline">查看'+esc(shortName(p))+'的得分图 ↗</button></div>');
  $('export-model').onclick=exportModel;$('modal-score').onclick=()=>showScore(p.player_id);
}
function renderExpert() {
  const e = expert();
  $('expert-info').innerHTML = e ? '<strong>'+esc(e.role)+'</strong><br>'+esc(e.date)+' · '+e.ranking.length+' 人公开排序<br><span>复现 '+e.fit.satisfiedPairs+'/'+e.fit.pairCount+' 项已知顺序 · 非本人公式</span>' : '不使用个人榜单拟合，以七维人工均衡权重为起点。你可以自由调整。';
  $('open-source').disabled = !e;
}
function renderRanking() {
  ranking=rankWithModules(players,coefficients,priorCoefficient,advanced,directory);
  $('podium').innerHTML=ranking.slice(0,3).map(p=>'<div class="podium-card"><div class="podium-num">NO. '+String(p.rank??'—').padStart(2,'0')+'</div><div class="podium-monogram">'+esc(p.player_name.split(' ').map(s=>s[0]).slice(0,2).join(''))+'</div><div class="podium-name">'+esc(shortName(p))+'</div><div class="podium-en">'+esc(p.player_name)+'</div><button type="button" class="podium-score score-trigger" data-score-player="'+esc(p.player_id)+'" aria-label="查看'+esc(name(p))+'的多维得分图">'+fmt(p.score)+'<small>加性模型分 · 查看图解 ↗</small></button></div>').join('');
  renderRows();
}
function renderRows() {
  const q = $('search').value.trim().toLowerCase();
  const matches=q?new Set(searchPlayers(ranking.map(p=>({...p,id:p.player_id,name:p.player_name,chineseName:name(p)})),q).map(p=>p.id)):null;
  const filtered = ranking.filter(p => !matches || matches.has(p.player_id));
  const visible = q || all ? filtered : filtered.slice(0,20);
  $('result-count').textContent = q ? filtered.length+' 位匹配' : all ? '全部 '+players.length+' 位' : '前 20 位 / '+players.length;
  $('rank-rows').innerHTML = visible.map(p => {
    const baseRank = baseline.get(p.player_id);
    const delta = Number.isFinite(baseRank) && Number.isFinite(p.rank) ? baseRank-p.rank : null;
    return '<tr data-player="'+esc(p.player_id)+'" class="'+(p.player_id===targetId?'selected':'')+'"><td class="rank-number">'+(p.rank ?? '—')+'</td><td><button class="text-button player-main" data-player="'+esc(p.player_id)+'" style="color:inherit">'+esc(name(p))+'</button><div class="player-sub">'+esc((chinese[p.player_id] || p.chineseName ? p.player_name : p.era+' · '+p.position)+(p.customPlayer?' · 用户添加':''))+'</div></td><td class="numeric"><button type="button" class="score-trigger" data-score-player="'+esc(p.player_id)+'" aria-label="查看'+esc(name(p))+'的多维得分图">'+fmt(p.score)+'</button></td><td class="delta '+(delta>0?'up':delta<0?'down':'flat')+'">'+(Number.isFinite(delta) && delta !== 0 ? (delta>0?'↑ ':'↓ ')+Math.abs(delta) : '—')+'</td></tr>';
  }).join('') || '<tr><td colspan="4">没有找到球员，试试英文姓名。</td></tr>';
  $('show-all').hidden = !!q;
  $('show-all').textContent = all ? '收起为前 20 位 ↑' : '展开全部 '+players.length+' 位球员 ↓';
}
function currentTarget() { return ranking.find(p => p.player_id === targetId); }
function measure(p, list = ranking) {
  if(!Number.isFinite(p.score))return {ahead:null,gap:null,unavailable:true};
  const ahead = list.filter(x=>Number.isFinite(x.score) && x.score>p.score+1e-9).at(-1);
  return {ahead,gap:ahead ? ahead.score-p.score : 0,unavailable:false};
}
function renderTarget() {
  const p = currentTarget(); const m = measure(p);
  const tieCount=p.rank===null?0:ranking.filter(row=>row.rank===p.rank).length;
  const runnerUp=ranking.find(row=>row.player_id!==p.player_id && Number.isFinite(row.score));
  const gapText=n=>n<0.005?'不足 0.01':fmt(n);
  const comparison=m.unavailable?'已启用的项都没有观测数据，暂不评分。<br>可以切换维度系数，或查看球员的数据覆盖。':tieCount>1?'当前有 '+tieCount+' 位球员并列第 '+p.rank+' 名。<br>并列不代表独占领先；全零系数只得到相同基准分。':m.ahead?'距离上一位 '+esc(shortName(m.ahead))+' 还差 <span class="up">'+gapText(m.gap)+'</span> 分。<br>建议按同一套公式重新计算。':'当前独占第一，领先 '+esc(shortName(runnerUp))+' <span class="up">'+gapText(p.score-runnerUp.score)+'</span> 分。<br>显示分数已舍入，按完整精度排序。';
  $('mobile-player').textContent=shortName(p);
  $('mobile-rank').textContent=m.unavailable?'未评分':(tieCount>1?'并列':'')+'第 '+p.rank+' 名 · '+fmt(p.score)+' 分';
  $('target-select').value = targetId;
  $('target-profile-link').href='/players?player='+encodeURIComponent(targetId);
  document.querySelectorAll('[data-quick]').forEach(b=>b.classList.toggle('active',b.dataset.quick===targetId));
  $('target-summary').innerHTML = '<div class="target-stats"><div class="target-rank">'+(m.unavailable?'<span style="font-size:24px">未评分</span>':'<small>#</small>'+p.rank)+'</div><button type="button" class="target-score score-trigger" data-score-player="'+esc(p.player_id)+'" title="'+(Number.isFinite(p.score)?p.score.toFixed(8):'缺失')+'" aria-label="查看'+esc(name(p))+'的多维得分图">'+fmt(p.score)+' 分 ↗</button></div><div class="target-gap">'+comparison+'</div>';
  $('profile').innerHTML = DIMENSIONS.map(d => {const v=p.components[d.key+'_score'];return '<div class="profile-row"><span>'+esc(d.short||d.label)+'</span><div class="profile-track"><span style="width:'+(Number.isFinite(v)?Math.max(0,Math.min(100,v)):0)+'%"></span></div><b>'+(Number.isFinite(v)?v.toFixed(1):'缺失')+'</b></div>';}).join('');
  const missing=activeDetails(p).missingModules||[];
  $('target-data-note').textContent=(p.customPlayer?'用户添加档案：部分指数可能未计算；可在高级模式使用有记录的原始统计。 ':'')+(missing.length?'本次计算有 '+missing.length+' 项使用中性填补，建议结合背景数据解读。':'已启用的数据维度均有观测值。');
  renderAdvice();
}
function renderAdvice() {
  if(!Number.isFinite(currentTarget()?.score)){$('find-weights').disabled=true;suggestions=[];$('suggestions').innerHTML='<p class="hint">当前启用项都没有可评分数据，不为缺失值生成优化建议。可查看原始档案，并在高级模式启用有记录的统计模块。</p>';return;}
  $('find-weights').disabled=advanced.enabled;
  if(advanced.enabled){suggestions=[];$('suggestions').innerHTML='<p class="hint">高级模式已启用：排名、分数与图表使用当前模块组合实时重算。基础七维的自动建议 / 联合搜索在此模式暂停，避免用另一套公式给出建议；请手动调节模块，或关闭高级模式恢复。</p>';return;}
  suggestions=advisePlayer(players,targetId,coefficients,priorCoefficient).filter(s=>s.rankGain>0 || s.rankGain===0 && s.gapGain>0.00001).sort((a,b)=>b.rankGain-a.rankGain || b.gapGain-a.gapGain).slice(0,3);
  $('suggestions').innerHTML=suggestions.map((s,i)=>{
    const d=DIMENSIONS.find(d=>d.key===s.key),change=s.coefficients[s.key]-coefficients[s.key];
    return '<button class="suggestion" data-suggestion="'+i+'"><span class="suggestion-main"><span>'+(change>0?'↑ ':'↓ ')+esc(d.label)+'</span><strong>'+(s.rankGain>0?'提升 '+s.rankGain+' 位':'改善相对分差')+'</strong></span><span class="suggestion-sub">系数 '+coef(coefficients[s.key])+' → '+coef(s.coefficients[s.key])+'<br>其他系数不变 · 预计第 '+s.rank+' 名</span></button>';
  }).join('') || '<p class="hint">单项系数调整 ±0.5 尚未找到改善，可尝试联合搜索。缺失数据下的改善需谨慎解读。</p>';
}
function renderAll() { renderExpert();updateSliders();renderRanking();renderTarget();$('search-result').innerHTML=''; }
function changeModel(nextCoefficients,nextPriorCoefficient=priorCoefficient) {
  coefficients=sanitizeCoefficients(nextCoefficients);
  priorCoefficient=Math.max(0,Math.min(10,Number(nextPriorCoefficient)||0));
  dirty=true;result=null;
  updateSliders();renderRanking();renderTarget();$('search-result').innerHTML='';persist();
}
function chooseTarget(id) { targetId=id;result=null;renderRows();renderTarget();$('search-result').innerHTML='';persist(); }
function showDialog(title,html) { $('dialog-title').textContent=title;$('dialog-body').innerHTML=html;if(!$('model-dialog').open)$('model-dialog').showModal(); }
function showModel() {
  if(advanced.enabled){showAdvancedModel();return;}
  const p=currentTarget(),details=scorePlayer(p,coefficients,priorCoefficient),e=expert();
  const ordered=[...DIMENSIONS].sort((a,b)=>coefficients[b.key]-coefficients[a.key]);
  const active=ordered.filter(d=>coefficients[d.key]>0);
  const summary=active.length?'你的最大数据系数是「'+active[0].label+'」：'+coef(coefficients[active[0].key])+'。该维度每提高 10 个指数点，总分增加 '+coef(coefficients[active[0].key])+' 分；其他项不会被压低。':'全部数据系数为 0；'+(priorCoefficient>0?'只启用大众参考项。':'所有球员得到相同的 50 分基准。');
  const equation='S = 50\n'+DIMENSIONS.map(d=>'+ '+coef(coefficients[d.key])+' × z（'+d.label+'）').join('\n')+'\n+ '+coef(priorCoefficient)+' × z（大众参考）';
  const contributions=DIMENSIONS.map(d=>{
    const missing=!Number.isFinite(p.components[d.key+'_score']);
    const z=missing?0:(p.components[d.key+'_score']-50)/10;
    return '<tr><td>'+esc(d.label)+(missing?'<small class="missing-label">缺失 → 中性填补</small>':'')+'</td><td>'+coef(coefficients[d.key])+'</td><td>'+fmt(z)+'</td><td class="'+(details.contributions[d.key]>=0?'up':'down')+'">'+signed(details.contributions[d.key])+'</td></tr>';
  }).join('');
  showDialog('我的加性评级模型','<p class="model-summary">'+esc(summary)+'</p><h3>1. 一条可逐项相加的公式</h3><div class="formula">'+equation+'</div><p><strong>z =（维度指数 − 50）÷ 10</strong>。系数 β 独立取值 0–10，没有总和约束；固定截距 50 只改变分数起点，不改变名次。分数可以高于 100 或低于 0，不是百分比、胜率或概率。</p><h3>2. '+esc(name(p))+' 的逐项贡献</h3><table class="contribution-table"><thead><tr><th>项目</th><th>系数 β</th><th>中心化 z</th><th>加分 / 扣分</th></tr></thead><tbody><tr><td>固定截距</td><td>—</td><td>—</td><td>50.00</td></tr>'+contributions+'<tr><td>大众参考'+(details.priorMissing?'<small class="missing-label">未入榜 → 中性填补</small>':'')+'</td><td>'+coef(priorCoefficient)+'</td><td>'+fmt(Number.isFinite(details.priorScore)?(details.priorScore-50)/10:0)+'</td><td>'+signed(details.priorContribution)+'</td></tr><tr class="total-row"><td>最终分</td><td></td><td></td><td>'+fmt(details.score)+'</td></tr></tbody></table><p>例如某项指数 80、系数 2：贡献 = 2 × (80−50) ÷ 10 = <strong>+6 分</strong>。不是占总分的 2%，也不会改变其他项的系数。</p><h3>3. 缺失值与大众参考</h3><p>缺失维度使用明确的中性基准 50，因此 z=0；它是建模填补，不是观测事实，也不说明球员真实水平居中。不会因缺失重新放大其他项。所有已启用项都没有观测时，显示“未评分”；全部系数为 0 则是有意设定的 50 分并列模型。</p><p>大众参考 P 沿用多媒体榜单先验，作为另一独立加性项 γ×(P−50)/10。未入榜使用中性 50、无额外贡献；它不是统计学贝叶斯后验。共同使用公众排名训练和先验项可能重复强调相似观点，需谨慎解释。</p><h3>4. 拟合起点与当前结果</h3><p>起点：'+esc(e?e.name+' · '+e.date:'均衡加性模型')+'；'+(dirty?'已个人化修改。':'未修改。')+'<br>当前前三：'+ranking.slice(0,3).map(p=>esc(shortName(p))).join(' / ')+'。</p><p>七维系数通过已知排序拟合并正则化，但不再要求系数和为 1。短榜无法唯一确定评论员公式，拟合误差仍如实展示。<a href="/players?player='+esc(targetId)+'">查看该球员背景与入选依据 ↗</a></p><div class="model-actions"><button id="export-model" class="button primary">下载完整模型 JSON ↓</button><button id="modal-sources" class="button outline">查看拟合依据 ↗</button></div>');
  $('export-model').onclick=exportModel;$('modal-sources').onclick=showSources;
}
function sourceLinks(e) { return [e.source,...(e.supporting_sources||[])].map(s=>'<a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.title)+'</a>').join('<br>'); }
function showSources() {
  const e=expert();if(!e){showNotes();return;}
  const own=rankPlayers(players,sanitizeCoefficients(e.coefficients),0),ownMap=new Map(own.map(p=>[p.player_id,p]));
  const subset=[...e.ranking].sort((a,b)=>ownMap.get(b).score-ownMap.get(a).score);
  const pairs=e.ranking.length*(e.ranking.length-1)/2;let correct=0;
  for(let i=0;i<e.ranking.length;i++)for(let j=i+1;j<e.ranking.length;j++)if(ownMap.get(e.ranking[i]).score>ownMap.get(e.ranking[j]).score+1e-8)correct++;
  const rows=e.ranking.map((id,i)=>{const p=ownMap.get(id);return '<tr><td>'+(i+1)+'</td><td>'+esc(name(p))+'</td><td>'+(subset.indexOf(id)+1)+'</td><td>'+p.rank+'</td></tr>';}).join('');
  showDialog(e.name+' · 加性拟合依据','<p>'+esc(e.role)+' · '+esc(e.date)+'</p><p>'+esc(e.note)+'</p><p class="model-summary">使用 '+e.ranking.length+' 人的 '+pairs+' 项已知成对顺序，模型复现 '+correct+' 项。这是样本内一致情况，不是置信度；短榜内的成对约束并不独立。</p><table class="source-table"><thead><tr><th>公开名次</th><th>球员</th><th>样本内名次</th><th>全池名次</th></tr></thead><tbody>'+rows+'</tbody></table><h3>新模型怎么拟合</h3><p>S = 50 + Σ β×(指数−50)/10；β 在 0–10 内独立拟合，没有总和约束。目标是减小已知排序的间隔误差，并通过正则项避免系数无意义放大。固定截距无法由排序数据识别，所以约定为 50。未入榜者不被当作输家，也不强制某位球员第一。</p><p>拟合使用现有数据近似历史观点，不是历史时点回测，不代表任何媒体或评论员本人的真实公式。高级模式新增的模块也不属于这次基础拟合。<a href="/players">查看数据覆盖与入选范围 ↗</a></p><h3>证据与出处</h3><p>'+esc(e.evidence)+'</p><p>'+sourceLinks(e)+'</p>');
}
function showNotes() {
  showDialog('数据边界与方法说明','<p>默认 300 人与七维指数沿用 v0.2，采集标记为 <strong>'+esc(data.data_access_date)+'</strong>。现在可从扩展目录添加球员；新增球员使用固定的原 300 人参考标准，不会改变原有球员分数。<a href="/players">打开球员库 ↗</a></p><h3>独立加性模型</h3><ul><li>每项使用 z=(指数−50)/10，独立系数乘以 z 后逐项相加。固定起点为 50；不是百分比分配，也不是百分制。</li><li>缺失维度贡献为 0，不放大其他项；全部启用项缺失则未评分。这是明确的处理约定，不消除时代或覆盖偏差。</li><li>大众排名是独立加性项。未入榜贡献中性，不把数据分冒充公众先验。</li><li>高级模式可自行选择统计、荣誉与协同模块；内部定义固定可查，系数由用户决定。评论员预设只拟合基础七维，不代表本人公布的真实公式。</li><li>单杆建议测试 ±0.5 系数；联合搜索只检验有限候选，不能证明全局最优。放大系数会扩大分差，不等于提高预测信心。</li></ul><h3>覆盖范围</h3><p>默认名单的完整季后赛逐场基础数据覆盖至 2024；新增历史球员当前仅扩展六个基础维度，季后赛指数保持未知。其他字段以各来源截止期为准，当前阵容不是实际出场证据。早期防守和高级统计存在缺失；荣誉与冠军等模块可能重复强调同一信息。</p><h3>本地保存与分享</h3><p>名单、模型及偏好只保存在本机浏览器，未接入账号或云同步。分享链接包含系数、模块和自选球员 ID，不包含游戏进度。旧 v0.3 设置按 β=10×(1−旧参考比例)×旧权重、γ=10×旧参考比例迁移，缺失情况可能因新策略改变。</p>');
}
function exportModel() {
  const payload={...stateObject(),app_version:'0.8.0',data_version:data.model_version,data_access_date:data.data_access_date,method:advanced.enabled?'S=50+sum(selected independent terms); see module_definitions and target_details for exact transforms; no percentage normalization; all active observations missing => null':'S=50+sum(beta[k]*(X[k]-50)/10)+gamma*(P-50)/10; independent coefficients; missing values use neutral 50; all active observations missing => null',module_registry_version:MODULE_VERSION,module_definitions:MODULES,target_details:activeDetails(currentTarget()),starting_expert:expert()||null,baseline_note:'Basic seven-dimension preset; additional modules are user rules, not fitted commentator claims.',dimensions:DIMENSIONS,top20:ranking.slice(0,20).map(p=>({player_id:p.player_id,player_name:p.player_name,rank:p.rank,score:p.score})),created_at:new Date().toISOString()};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='true-goat-additive-model.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('已导出加性系数、公式与来源。');
}
async function share() {
  const url=location.origin+location.pathname+'#model='+encodeURIComponent(JSON.stringify(stateObject()));
  const local=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  const note=local?'这是本地预览链接，需运行本地服务；对外分享请使用线上网站生成链接。':'分享此链接，对方即可还原这组系数；不包含你的猜球员进度。';
  try {await navigator.clipboard.writeText(url);toast('已复制。'+note);}
  catch {showDialog('复制模型链接','<p>'+esc(note)+'</p><textarea readonly style="width:100%;height:140px">'+esc(url)+'</textarea>');}
}
async function explore() {
  if(advanced.enabled){toast('高级模式下请手动调整模块；基础自动搜索已暂停。');return;}
  $('find-weights').disabled=true;$('search-result').textContent='正在检验候选系数…';
  await new Promise(resolve=>setTimeout(resolve,25));
  try {
    const before=currentTarget(); const found=searchImprovement(players,targetId,coefficients,priorCoefficient);
    if(!found?.coefficients){$('search-result').textContent='本次有限搜索未找到改进。你可以降低大众参考系数或继续手动探索。';return;}
    const next=rankPlayers(players,found.coefficients,priorCoefficient);const after=next.find(p=>p.player_id===targetId);
    const nextTieCount=next.filter(p=>p.rank===after.rank).length;
    const signedGap=(p,list)=>Number.isFinite(p.score)?p.score-Math.max(...list.filter(x=>x.player_id!==p.player_id && Number.isFinite(x.score)).map(x=>x.score)):-Infinity;
    const beforeGap=signedGap(before,ranking); const afterGap=signedGap(after,next);
    if(Number.isFinite(after.rank) && (!Number.isFinite(before.rank) || after.rank<before.rank || after.rank===before.rank && afterGap>beforeGap+1e-6)){
      result=found;
      $('search-result').innerHTML='已检验 '+Number(found.draws||0).toLocaleString()+' 组候选：'+(before.rank===null?'未评分':'第 '+before.rank+' 名')+' → <span class="up">第 '+after.rank+' 名'+(nextTieCount>1?'（并列 '+nextTieCount+' 人）':'')+'</span>。'+(after.rank===before.rank?(after.rank===1 && nextTieCount===1?'名次未变，领先优势扩大。':'名次未变，相对分差改善。'):'')+'这是一组可行方案，并非已证明的最小改动。<button id="apply-search" class="text-button">应用这组系数 →</button>';
      $('apply-search').onclick=()=>{const selected=result;changeModel(selected.coefficients);toast('已应用搜索系数，可在「我的模型」查看。');};
    }else{$('search-result').textContent='检验 '+Number(found.draws||0).toLocaleString()+' 组候选后，未找到更高名次或更小榜首分差。不是数学上“不可能”的证明。';}
  } finally {$('find-weights').disabled=false;}
}

async function init() {
  const responses=await Promise.all([fetch('/data/players.json'),fetch('/data/experts.json')]);
  if(responses.some(r=>!r.ok))throw new Error('模型文件未准备好，请先运行拟合脚本。');
  [data,{experts}]=await Promise.all(responses.map(r=>r.json()));basePlayers=data.players;players=[...basePlayers];
  registerNames(players.map(p=>({...p,chineseName:chinese[p.player_id]||p.chineseName})));
  try {const response=await fetch('/data/player-directory.json');if(!response.ok)throw new Error('球员库未准备好');const payload=await response.json();directory=new Map((payload.players||[]).map(p=>[p.id,p]));directoryAvailable=directory.size>0;}catch{toast('球员库暂不可用：基础模型仍可用，原始统计模块将明确显示缺失。');}
  if(!experts.length || !experts[0].coefficients)throw new Error('请先运行 scripts/13_build_expert_presets.py 生成 v0.4 加性预设。');
  baseDirectory=new Map(directory);
  library=createPlayerLibrary({baseIds:basePlayers.map(p=>p.player_id),onChange:updateCustomPlayers});
  try{await library.initialize();}catch{toast('自选球员档案暂不可用；保留已保存的选择，先显示默认球员。');}
  preset=experts[0].id;coefficients=sanitizeCoefficients(presetCoefficients());await restore();
  const requested=new URLSearchParams(location.search).get('player');
  if(players.some(p=>p.player_id===requested))targetId=requested;
  else if(requested)pendingTarget=requested;
  baselineRanking();
  $('expert-select').innerHTML=experts.map(e=>'<option value="'+esc(e.id)+'">'+esc(e.name)+'</option>').join('')+'<option value="balanced">均衡起点 · 自由探索</option>';$('expert-select').value=preset;
  rebuildPlayerChoices();
  $('quick-targets').innerHTML=[['jordami01','乔丹'],['jamesle01','詹姆斯'],['curryst01','库里'],['bryanko01','科比']].map(([id,label])=>'<button data-quick="'+id+'">'+label+'</button>').join('');
  $('sliders').innerHTML=DIMENSIONS.map((d,i)=>'<div class="slider-row"><label class="base-module-toggle" hidden><input type="checkbox" id="base-enabled-'+d.key+'" data-base-toggle="'+d.key+'" checked>将「'+esc(d.label)+'」放入高级模型</label><label class="slider-label" for="coef-'+d.key+'"><span class="coef-symbol">β'+(i+1)+'</span><span>'+esc(d.label)+'</span></label><input id="coef-number-'+d.key+'" class="coef-number" type="number" min="0" max="10" step="0.001" aria-label="'+esc(d.label)+'系数数值"><input id="coef-'+d.key+'" type="range" min="0" max="10" step="0.01" data-coefficient="'+d.key+'" aria-describedby="desc-'+d.key+'"><div class="slider-desc" id="desc-'+d.key+'">'+esc(d.description)+'</div></div>').join('');
  buildModuleCards();
  $('advanced-enabled').onchange=e=>changeAdvanced({...advanced,enabled:e.target.checked});
  $('sliders').addEventListener('change',e=>{const key=e.target.dataset.baseToggle;if(key)changeAdvanced({...advanced,disabledBase:e.target.checked?advanced.disabledBase.filter(k=>k!==key):[...advanced.disabledBase,key]});});
  $('module-cards').addEventListener('change',e=>{const toggle=e.target.dataset.moduleToggle,key=toggle||e.target.dataset.moduleNumber;if(key)changeAdvanced({...advanced,modules:{...advanced.modules,[key]:{...advanced.modules[key],...(toggle?{enabled:e.target.checked}:{coefficient:Number(e.target.value)})}}});});
  $('module-cards').addEventListener('input',e=>{const key=e.target.dataset.moduleRange;if(key)changeAdvanced({...advanced,modules:{...advanced.modules,[key]:{...advanced.modules[key],coefficient:Number(e.target.value)}}});});
  for(const d of DIMENSIONS){
    $('coef-'+d.key).addEventListener('input',e=>changeModel(setCoefficient(coefficients,d.key,Number(e.target.value))));
    $('coef-number-'+d.key).addEventListener('change',e=>changeModel(setCoefficient(coefficients,d.key,Number(e.target.value))));
  }
  $('prior-coef').addEventListener('input',e=>changeModel(coefficients,Number(e.target.value)));
  $('prior-number').addEventListener('change',e=>changeModel(coefficients,Number(e.target.value)));
  $('expert-select').addEventListener('change',e=>reset(e.target.value));$('reset').onclick=()=>reset();
  $('target-select').onchange=e=>chooseTarget(e.target.value);
  $('quick-targets').onclick=e=>{const b=e.target.closest('[data-quick]');if(b)chooseTarget(b.dataset.quick);};
  $('rank-rows').onclick=e=>{if(e.target.closest('[data-score-player]'))return;const row=e.target.closest('[data-player]');if(row)chooseTarget(row.dataset.player);};
  $('workspace').addEventListener('click',e=>{const b=e.target.closest('[data-score-player]');if(b)showScore(b.dataset.scorePlayer);});
  $('suggestions').onclick=e=>{const b=e.target.closest('[data-suggestion]');if(b){const s=suggestions[Number(b.dataset.suggestion)];changeModel(s.coefficients);toast('只调整了这一项系数，其他项保持不变。');}};
  $('search').oninput=renderRows;$('show-all').onclick=()=>{all=!all;renderRows();};
  $('open-model').onclick=showModel;$('formula-help').onclick=showModel;$('open-source').onclick=showSources;$('data-notes').onclick=showNotes;
  $('close-dialog').onclick=()=>$('model-dialog').close();
  $('model-dialog').onclick=e=>{if(e.target===$('model-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}};
  $('share').onclick=share;$('find-weights').onclick=explore;
  $('jump-ranking').onclick=()=>document.querySelector('.ranking').scrollIntoView({behavior:'smooth'});
  window.addEventListener('hashchange',async()=>{if(!location.hash.startsWith('#model='))return;await restore();baselineRanking();rebuildPlayerChoices();result=null;$('expert-select').value=preset;renderAll();persist();});
  uiReady=true;renderAll();persist();$('loading').hidden=true;$('workspace').hidden=false;$('open-model').disabled=false;$('mobile-live').hidden=false;
  if(pendingTarget)await library.open({playerId:pendingTarget});
}
init().catch(error=>{$('loading').textContent='载入失败：'+error.message;console.error(error);});
