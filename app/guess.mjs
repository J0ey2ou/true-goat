import { MAX_GUESSES, ATTRIBUTES, ALL_ATTRIBUTES, selectedAttributes, playersInPool, poolFamily, normalizeFilters, filterKey, eligiblePlayers, teamsForPool, matchingAppearances, shanghaiDate, comparePlayers, newRound, restoreRound, submitGuess, shareText } from './guess-engine.mjs';
import { initOnline } from './online.mjs';
import { normalizeSearch, searchPlayers } from './player-search.mjs';

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const list = value => Array.isArray(value) ? value : [];
const chinese = {jordami01:'迈克尔·乔丹',jamesle01:'勒布朗·詹姆斯',abdulka01:'卡里姆·贾巴尔',johnsma02:'魔术师约翰逊',russebi01:'比尔·拉塞尔',birdla01:'拉里·伯德',onealsh01:'沙奎尔·奥尼尔',chambwi01:'威尔特·张伯伦',duncati01:'蒂姆·邓肯',bryanko01:'科比·布莱恩特',curryst01:'斯蒂芬·库里',duranke01:'凯文·杜兰特',olajuha01:'哈基姆·奥拉朱旺',jokicni01:'尼古拉·约基奇',roberos01:'奥斯卡·罗伯特森',westje01:'杰里·韦斯特',malonmo01:'摩西·马龙',garneke01:'凯文·加内特',antetgi01:'扬尼斯·阿德托昆博',nowitdi01:'德克·诺维茨基',malonka01:'卡尔·马龙',stockjo01:'约翰·斯托克顿',wadedw01:'德维恩·韦德',robinda01:'大卫·罗宾逊'};
const name = player => player.chineseName || chinese[player.id] || player.name;
const numeric = value => typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString('zh-CN',{maximumFractionDigits:1,useGrouping:false}) : '未知';
const statusNames = {correct:'一致',close:'接近 / 重合',wrong:'不同',unknown:'未知'};
const stateCache = new Map();
const PREF_KEY = 'true-goat-guess:preferences:v2';
let data,players = [],mode = 'daily',pool = 'nba-easy',round,matches = [],activeIndex = 0,storageWarning = false,isComposing = false;
let filters = {from:null,to:null,teamId:''}, filtersByPool = {};
let teamDialogTrigger = null;
let customClues = false, clueKeys = ATTRIBUTES.map(item=>item.key);
const activeClueKeys = () => customClues ? clueKeys : undefined;
let extraLoaded=false;
let resultShownFor=null;

function settingsTab(tab='range') {
  if(!['range','clues','online'].includes(tab))tab='range';
  for(const item of ['range','clues','online']){
    const active=item===tab;
    $(`guess-setting-${item}`).hidden=!active;
    $(`guess-tab-${item}`).setAttribute('aria-selected',String(active));
    $(`guess-tab-${item}`).tabIndex=active?0:-1;
  }
}
function openSettings(tab='range') {
  if(!['range','clues','online'].includes(tab))tab='range';
  settingsTab(tab);
  const dialog=$('guess-settings-dialog');
  if(!dialog.open)dialog.showModal();
  $(`guess-tab-${tab}`).focus();
}
function initSettings() {
  for(const [selector,target]of [['.guess-year-filter','range'],['.guess-clues','clues'],['#online-mount','online']])$('guess-setting-'+target).append(document.querySelector(selector));
  $('guess-open-settings').disabled=false;
  $('guess-open-settings').onclick=()=>openSettings();
  $('guess-settings-close').onclick=()=>$('guess-settings-dialog').close();
  $('guess-settings-dialog').addEventListener('close',()=>{resetDraft();updateFilterStatus();$('guess-open-settings').focus({preventScroll:true});});
  for(const button of document.querySelectorAll('[data-settings-tab]')){
    button.onclick=()=>settingsTab(button.dataset.settingsTab);
    button.onkeydown=event=>{
      const keys=['ArrowLeft','ArrowRight','Home','End'];if(!keys.includes(event.key))return;
      event.preventDefault();const tabs=['range','clues','online'],index=tabs.indexOf(button.dataset.settingsTab);
      const next=event.key==='Home'?0:event.key==='End'?2:(index+(event.key==='ArrowRight'?1:2))%3;
      settingsTab(tabs[next]);$(`guess-tab-${tabs[next]}`).focus();
    };
  }
  document.addEventListener('goat:open-settings',event=>openSettings(event.detail?.tab||'online'));
  $('guess-show-result').onclick=()=>showResult();
  for(const id of ['guess-result-close','guess-result-review'])$(id).onclick=()=>$('guess-result-dialog').close();
  $('guess-result-dialog').addEventListener('close',()=>{if(!$('guess-show-result').hidden)$('guess-show-result').focus({preventScroll:true});});
  $('guess-result-next').onclick=startNextRound;
}
function showResult() {
  if(!['won','lost'].includes(round?.status))return;
  if($('guess-settings-dialog').open)$('guess-settings-dialog').close();
  if(!$('guess-result-dialog').open)$('guess-result-dialog').showModal();
  $('guess-result-dialog').scrollTop=0;
  ($('guess-result-next').disabled?$('guess-result-close'):$('guess-result-next')).focus();
}
function startNextRound() {
  if(!['won','lost'].includes(round?.status)||currentCandidates().length<2)return;
  const previous=round.answerId;
  // Keep daily completion under its existing key; the next game is practice.
  if(mode==='daily'){save();mode='practice';}
  round=newRound({mode,pool,date:shanghaiDate(),version:data.version,filters,answerId:practiceAnswer(previous)});
  save();
  if(!storageWarning){
    const url=new URL(location.href);url.searchParams.set('mode','practice');url.searchParams.set('pool',pool);url.hash='';
    history.replaceState(null,'',url);location.reload();
  }else{
    $('guess-result-dialog').close();render();message('浏览器不能保存进度，已在当前页面开启下一局，避免刷新丢失题目。');$('guess-search').focus();
  }
}
async function loadExtraMetrics() {
  if(extraLoaded)return;
  const response=await fetch('/data/guess-extra-metrics.json');
  if(!response.ok)throw Error('额外线索数据暂时无法加载，请稍后重试。');
  const extra=await response.json();
  if(extra.version!==data.version)throw Error('额外线索版本已更新，请刷新页面。');
  for(const player of players){
    const facts=extra.players[player.id];if(!facts)continue;
    for(const [key,definition] of Object.entries(extra.definitions)){
      player[key]=facts[key]??null;
      player.metricCoverage[key]={...definition,complete:facts.completeFields.includes(key)};
      player.fieldSources[key]=definition.sourceIds;
    }
  }
  extraLoaded=true;
}

function storageKey() { return `true-goat-guess:v2:${data.version}:${mode}:${pool}:${encodeURIComponent(filterKey(filters))}`; }
function safeUrl(value) { try { const url = new URL(value); return ['http:','https:'].includes(url.protocol) ? url.href : null; } catch { return null; } }
function poolInfo() { return data.pools.find(item => item.id === pool); }
function message(text) { $('guess-message').textContent = text; }
function canonical(value) { const result = normalizeFilters(value); return {from:result.from,to:result.to,teamId:result.teamId}; }
function draftFilters() { return normalizeFilters({from:$('guess-year-from').value,to:$('guess-year-to').value,teamId:$('guess-team').value}); }
function hasPendingFilters() { const draft = draftFilters(); return !draft.valid || filterKey(draft) !== filterKey(filters); }
function currentCandidates() { return eligiblePlayers(players,pool,filters); }
function describeFilters(value) {
  const f = normalizeFilters(value);
  const years = f.from === null && f.to === null ? '全部赛季' : `${f.from ?? '最早'}–${f.to ?? '最新'} 赛季结束年`;
  const team = teamsForPool(players,pool).find(item => item.id === f.teamId);
  return `${years} · ${f.teamId ? team?.name || '未收录球队' : '全部球队'}`;
}
function renderTeamOptions() {
  const teams = teamsForPool(players,pool);
  $('guess-team').innerHTML = '<option value="">不限球队</option>' + teams.map(team => `<option value="${esc(team.id)}">${esc(team.name)} · ${team.count} 人</option>`).join('');
  if (filters.teamId && !teams.some(team => team.id === filters.teamId)) {
    const missing = document.createElement('option'); missing.value = filters.teamId; missing.textContent = '此前球队暂无可核实出场记录'; $('guess-team').append(missing);
  }
}
function resetDraft() {
  renderTeamOptions();
  $('guess-year-from').value = filters.from ?? ''; $('guess-year-to').value = filters.to ?? ''; $('guess-team').value = filters.teamId;
}
function updateFilterStatus() {
  const draft = draftFilters(), pending = hasPendingFilters();
  const total = playersInPool(players,pool).length, count = draft.valid ? eligiblePlayers(players,pool,draft).length : 0;
  for (const id of ['guess-year-from','guess-year-to']) $(id).setAttribute('aria-invalid',String(!draft.valid));
  $('guess-year-status').classList.toggle('invalid',!draft.valid || count === 0);
  $('guess-year-status').textContent = !draft.valid ? draft.error
    : `${pending ? '待应用' : '已应用'}：${count} / ${total} 位可出题。${count === 0 ? '没有符合条件的已核实出场记录，不会从范围外抽取答案。' : pending ? '点击「应用范围」后开始或恢复对应题目。' : '答案和搜索候选都来自这个范围。'}`;
  $('guess-filter-apply').disabled = !draft.valid || !pending;
  $('guess-filter-cancel').hidden = !pending;
  $('guess-year-clear').disabled = !draft.active && draft.valid;
  $('guess-search').disabled = round?.status !== 'playing' || pending;
  $('guess-open-settings').textContent=pending?'⚙ 设置 · 待应用':'⚙ 设置';
  if (pending) { closeOptions(); $('guess-search-hint').textContent = '范围有待应用的修改。请先应用或撤销，再继续猜测；原范围的进度会保留。'; }
  else $('guess-search-hint').textContent = round?.status === 'empty' ? '当前范围没有可出题球员，请调整年份或球队后应用。' : round?.status === 'playing' ? '↑ ↓ 切换候选，回车或点击候选提交；重复猜测不扣次数。' : '本局已结束，可复制战绩，或前往自由练习。';
  return draft;
}
function applyFilters() {
  const draft = draftFilters();
  if (!draft.valid) { updateFilterStatus(); return; }
  if (!hasPendingFilters()) return;
  save(); filters = canonical(draft); filtersByPool[pool] = {...filters}; resetDraft(); loadRound();
  message(round.status === 'empty' ? '当前范围没有可核实的出场记录，未生成题目。请调整范围；不会自动放宽条件。' : '范围已应用，已开始或恢复该范围的题目；其他范围的进度仍保留。');
}
function metricDescription(player,key) {
  const coverage = player.metricCoverage?.[key];
  if (!coverage) return '未收录可核实的 NBA/BAA 数据';
  const season = coverage.throughSeason;
  const cutoff = Number.isInteger(season) ? `截至 ${season - 1}–${String(season).slice(-2)} 赛季` : '截止赛季未收录';
  return [coverage.scope || '统计口径未知',cutoff,coverage.note].filter(Boolean).join(' · ');
}
function save() {
  stateCache.set(storageKey(),round);
  try { localStorage.setItem(storageKey(),JSON.stringify(round)); localStorage.setItem(PREF_KEY,JSON.stringify({mode,pool,filtersByPool,customClues,clueKeys})); }
  catch { storageWarning = true; }
}

function practiceAnswer(previous) {
  let options = currentCandidates().filter(player => player.id !== previous);
  if (!options.length) options = currentCandidates();
  if (!options.length) return null;
  const entropy = new Uint32Array(1); crypto.getRandomValues(entropy);
  return options[entropy[0] % options.length]?.id || null;
}

function loadRound() {
  let saved = stateCache.get(storageKey()),parseError = false;
  if (!saved) try { const raw = localStorage.getItem(storageKey()); saved = raw ? JSON.parse(raw) : null; } catch { parseError = true; }
  const restored = restoreRound(saved,{mode,pool,date:shanghaiDate(),version:data.version,players,filters,fallbackAnswerId:practiceAnswer()});
  round = restored.round; save(); render();
  if (parseError || restored.recovered) message('旧进度无法使用，已恢复当前范围的题目；相同日期与范围的每日答案固定。');
  else if (storageWarning) message('浏览器不允许持久保存；本次打开期间仍可切换球员池，关闭后可能丢失进度。');
}

function ensureDate() {
  if (!round) return false;
  if (mode === 'daily' && round.date !== shanghaiDate()) { loadRound(); message('北京时间已进入新的一天，每日题目已更新。'); return true; }
  return false;
}

function switchGame(nextMode,nextPool) {
  if (!['daily','practice'].includes(nextMode) || !data.pools.some(item => item.id === nextPool)) return;
  save(); mode = nextMode; pool = nextPool; filters = canonical(filtersByPool[pool] || {}); filtersByPool[pool] = {...filters}; resetDraft(); loadRound();
}

function render() {
  const currentPool = poolInfo(), count = playersInPool(players,pool).length, eligibleCount = currentCandidates().length;
  $('guess-pool').value = pool;
  document.querySelectorAll('[data-pool-card]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.poolCard === pool)));
  document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.mode === mode)));
  $('guess-pool-count').textContent = `${currentPool.name} · 收录 ${count} 位 / 本局范围 ${eligibleCount} 位`;
  const dates = [...new Set(playersInPool(players,pool).map(player => player.asOf).filter(Boolean))].sort();
  $('guess-snapshot').textContent = currentPool.asOf ? `名单核实 ${currentPool.asOf}` : dates.length === 1 ? `快照 ${dates[0]}` : `多期快照 · 数据包 ${data.meta.snapshotDate || data.meta.dataAsOf || '见数据说明'}`;
  $('guess-round-label').textContent = mode === 'daily' ? `DAILY / ${round.date} / UTC+8` : 'PRACTICE / YOUR OWN PACE';
  $('guess-board-title').textContent = round.status === 'empty' ? '这个范围，暂时没有题目。' : round.status === 'won' ? '漂亮，你找到了。' : round.status === 'lost' ? '八次用完，看看答案。' : mode === 'daily' ? '今天，你能几次猜中？' : '选一位球员，开始推理。';
  $('guess-attempts').textContent = round.guesses.length;
  $('guess-round-note').textContent = currentPool.description || '答案与猜测均来自当前收录球员池。';
  $('guess-active-filter').textContent = `本局范围：${describeFilters(filters)} · ${eligibleCount} 位候选`;
  $('guess-search').value = ''; $('guess-search').disabled = round.status !== 'playing';
  $('guess-submit').disabled = true; closeOptions(); message('');
  $('guess-search-hint').textContent = round.status === 'playing' ? '↑ ↓ 切换候选，回车或点击候选提交；重复猜测不扣次数。' : '本局已结束，输入已锁定。可复制战绩，或前往自由练习。';
  $('guess-new').hidden = mode !== 'practice';
  $('guess-new').disabled = eligibleCount < 2;
  $('guess-new').textContent = eligibleCount < 2 ? '范围内不足两人，无法换题' : '换一位，再来一局 ↻';
  $('guess-share').disabled = round.guesses.length === 0;
  $('guess-next-day').textContent = mode === 'daily' ? '同日期、同范围一题 · 北京时间 00:00 更新' : '练习换题仍遵守当前范围，不影响每日进度';
  $('guess-share-text').hidden = true;
  updateFilterStatus();
  renderHistory(); renderResult(); renderEligibilityProof();
}

function cellValue(player,key) {
  if (key === 'teams') return list(player.teams).map(team => team.name || team.id).join(' / ') || '未知';
  if (key === 'positions') return list(player.positions).join(' / ') || '未知';
  return numeric(player[key]);
}

// This detail view receives only the submitted player, never the hidden answer.
export function teamDetailsMarkup(player,sources = []) {
  const teams = list(player.teams);
  return teams.length ? `<ul class="guess-team-records">${teams.map(team=>`<li class="guess-team-record" data-team-id="${esc(team.id)}"><h3>${esc(team.name || team.id)}</h3></li>`).join('')}</ul>${player.teamsComplete === true ? '' : '<p class="guess-team-footnote">显示全部已收录球队；部分球员履历仍有缺漏。</p>'}` : '<p class="guess-team-empty">暂无已收录球队。</p>';
}

function openTeamDetails(id,trigger) {
  if (!round?.guesses.includes(id)) return;
  const player = players.find(item => item.id === id);
  if (!player) return;
  const dialog = $('guess-team-dialog');
  $('guess-team-dialog-title').textContent = `${name(player)} · 球队经历`;
  $('guess-team-dialog-player').textContent = player.name;
  $('guess-team-dialog-body').innerHTML = teamDetailsMarkup(player,data.sources);
  teamDialogTrigger = trigger;
  dialog.showModal();
  dialog.scrollTop = 0;
  $('guess-team-dialog-close').focus();
}

function renderHistory() {
  if (round.status === 'empty') { $('guess-history').innerHTML = '<div class="guess-empty"><strong>没有满足范围的已核实球员。</strong><p>可扩大年份或选择其他球队，再点击「应用范围」。<br>资料缺失不等于从未效力；只使用已收录的正式出场证据。</p></div>'; return; }
  if (!round.guesses.length) {
    $('guess-history').innerHTML = `<div class="guess-empty"><strong>在当前范围内，从你最熟悉的人开始。</strong><p>支持中文、英文和常见绰号。<br>每次猜测留下 ${selectedAttributes(activeClueKeys()).length} 项线索，帮你缩小范围。</p></div>`;
    return;
  }
  const answer = players.find(player => player.id === round.answerId);
  $('guess-history').innerHTML = round.guesses.map((id,index) => {
    const guessed = players.find(player => player.id === id);
    const cells = comparePlayers(guessed,answer,activeClueKeys());
    const renderCells = group => cells.filter(cell => (cell.group === 'career') === (group === 'career')).map(cell => {
      const value = cellValue(guessed,cell.key),arrow = cell.direction === 'up' ? '↑' : cell.direction === 'down' ? '↓' : '';
      const note = [cell.note,cell.group === 'career' ? metricDescription(guessed,cell.key) : ''].filter(Boolean).join(' · ');
      if (cell.key === 'teams') return `<button type="button" class="guess-cell guess-team-cell ${cell.status}" data-key="teams" data-label="${esc(cell.label)}" data-team-details="${esc(guessed.id)}" aria-haspopup="dialog" aria-controls="guess-team-dialog" aria-label="${esc(name(guessed))}的效力球队：${statusNames[cell.status]}。查看全部球队"><span class="cell-label">${esc(cell.label)}</span><span class="cell-value">${esc(value)}</span><small>${cell.status === 'unknown' ? '未知 / 不可比较' : statusNames[cell.status]}</small><span class="guess-cell-action">查看全部球队 <span aria-hidden="true">↗</span></span></button>`;
      return `<div class="guess-cell ${cell.status}" data-key="${cell.key}" data-label="${esc(cell.label)}" aria-label="${esc(cell.label)}：${esc(value)}，${statusNames[cell.status]}${arrow ? '，答案数值' + (cell.direction === 'up' ? '更大' : '更小') : ''}" title="${esc(value)}${note ? ' · ' + esc(note) : ''}"><span class="cell-label">${esc(cell.label)}</span><span class="cell-value">${esc(value)}${arrow ? `<b class="cell-arrow" aria-hidden="true">${arrow}</b>` : ''}</span><small>${cell.status === 'unknown' ? '未知 / 不可比较' : statusNames[cell.status]}</small></div>`;
    }).join('');
    const basic=renderCells('basic'),career=renderCells('career');
    return `<article class="guess-row" data-guessed="${esc(id)}"><div class="guess-player"><div><strong>${esc(name(guessed))}</strong>${name(guessed) !== guessed.name ? `<small>${esc(guessed.name)}</small>` : ''}</div><span class="guess-order">${String(index + 1).padStart(2,'0')} / 08</span></div>${basic?`<section class="guess-clue-group" aria-label="基本资料"><h3>基本资料</h3><div class="guess-clue-grid">${basic}</div></section>`:''}${career?`<section class="guess-clue-group" aria-label="NBA/BAA 生涯指标"><h3>NBA / BAA 生涯指标</h3><div class="guess-clue-grid">${career}</div></section>`:''}</article>`;
  }).join('');
}

function renderResult() {
  const completed=['won','lost'].includes(round.status);
  $('guess-result').hidden = !completed;$('guess-show-result').hidden=!completed;
  if (!completed) { $('guess-result').innerHTML = '';if($('guess-result-dialog').open)$('guess-result-dialog').close();return; }
  const answer = players.find(player => player.id === round.answerId);
  const sourceIds = new Set(list(answer.sourceIds));
  const sources = list(data.sources).filter(source => sourceIds.has(source.id));
  const directoryId = answer.directoryId || null;
  const careerAttributes = selectedAttributes(activeClueKeys()).filter(item => item.group === 'career');
  const metrics = careerAttributes.map(item => `<div data-result-key="${item.key}" title="${esc(metricDescription(answer,item.key))}"><dt>${esc(item.label.replace('*',''))}</dt><dd>${numeric(answer[item.key])}</dd></div>`).join('');
  const coverage = careerAttributes.map(item => `<li><strong>${esc(item.label.replace('*',''))}</strong>：${esc(metricDescription(answer,item.key))}</li>`).join('');
  $('guess-result').innerHTML = `<div class="eyebrow">${round.status === 'won' ? `FOUND IN ${round.guesses.length} / ${MAX_GUESSES}` : 'ANSWER REVEALED'}</div><h3>${esc(name(answer))}</h3><p>${esc(answer.name)} · ${esc(list(answer.positions).join(' / ') || '位置未知')} · 出生年 ${numeric(answer.birthYear)} · 身高 ${numeric(answer.heightCm)} cm</p><p>首赛年：${numeric(answer.firstSeasonYear)}${answer.firstSeasonScope ? `（${esc(answer.firstSeasonScope)}首次正式出场）` : '（口径未收录）'}<br>已确认球队：${esc(cellValue(answer,'teams'))}${answer.teamsComplete ? '' : '（记录不完整）'}</p><dl class="guess-result-metrics">${metrics}</dl><details class="guess-result-coverage"><summary>统计口径与覆盖范围</summary><ul>${coverage}</ul></details>${list(answer.notes).map(note => `<p>${esc(note)}</p>`).join('')}<div class="guess-result-links">${directoryId ? `<a href="/players?player=${encodeURIComponent(directoryId)}">查看球员档案 ↗</a>` : ''}${sources.map(source => { const url = safeUrl(source.url); return url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(source.title || source.id)} ↗</a>` : ''; }).join('')}</div>`;
  $('guess-result-title').textContent=round.status==='won'?'猜中了！':'八次机会已用完';
  $('guess-result-summary').textContent=`${poolInfo().name} · ${round.guesses.length} / ${MAX_GUESSES} 次 · ${mode==='daily'?'每日挑战':'自由练习'}`;
  $('guess-result-next').disabled=currentCandidates().length<2;
  $('guess-result-next-note').textContent=currentCandidates().length<2?'当前范围不足两位球员，请返回右上角设置扩大范围。':mode==='daily'?'每日战绩会保留。下一局将刷新页面，进入同一范围的自由练习。':'刷新页面，保留球员池、赛季/球队范围和自选线索，抽取不同球员。';
  const signature=`${storageKey()}:${round.answerId}:${round.status}:${round.guesses.length}`;
  if(resultShownFor!==signature){resultShownFor=signature;queueMicrotask(showResult);}
}

function renderEligibilityProof() {
  if (!['won','lost'].includes(round.status) || !normalizeFilters(filters).active) return;
  const answer = players.find(player => player.id === round.answerId);
  const evidence = matchingAppearances(answer,pool,filters).sort((a,b) => a.season - b.season || a.teamId.localeCompare(b.teamId));
  const records = evidence.slice(0,8).map(row => {
    const team = list(answer.teams).find(item => item.id === row.teamId)?.name || row.teamId;
    const source = list(data.sources).find(item => item.id === row.sourceId),url = source && safeUrl(source.url);
    return `<li>${row.season - 1}–${String(row.season).slice(-2)} · ${esc(team)} · ${esc(row.league)}${Number.isFinite(row.games) ? ` · ${row.games} 场已记录出场` : ''}${url ? ` · <a href="${esc(url)}" target="_blank" rel="noopener noreferrer">出场来源 ↗</a>` : ''}</li>`;
  }).join('');
  $('guess-result').insertAdjacentHTML('beforeend',`<section class="guess-proof"><strong>为什么符合本局范围？</strong><p>${esc(describeFilters(filters))}：以下记录同时满足年份与球队条件。</p><ul>${records}</ul>${evidence.length > 8 ? `<p>另外还有 ${evidence.length - 8} 条符合条件的已记录赛季。</p>` : ''}<p>这里仅核验是否实际出场，不代表已收录完整生涯。</p></section>`);
}

function closeOptions() {
  $('guess-options').hidden = true; $('guess-search').setAttribute('aria-expanded','false');
  $('guess-submit').disabled = true;
  $('guess-search').removeAttribute('aria-activedescendant'); matches = []; activeIndex = 0;
}

function updateOptions(resetIndex = true) {
  updateFilterStatus();
  if (round.status !== 'playing' || isComposing || hasPendingFilters()) { closeOptions(); return; }
  const query = normalizeSearch($('guess-search').value);
  if (!query) { closeOptions(); $('guess-submit').disabled = true; message(''); return; }
  const inPool = playersInPool(players,pool);
  const found = searchPlayers(currentCandidates(),query);
  const notGuessed = found.filter(player => !round.guesses.includes(player.id));
  matches = notGuessed.slice(0,10);
  if (resetIndex) activeIndex = 0;
  activeIndex = Math.max(0,Math.min(activeIndex,matches.length - 1));
  $('guess-submit').disabled = !matches.length || !query;
  if (!query || !matches.length) {
    $('guess-options').hidden = true; $('guess-search').setAttribute('aria-expanded','false'); $('guess-search').removeAttribute('aria-activedescendant');
    if (query) message(found.length ? '匹配球员已猜过，不会扣除次数；试试其他球员。' : normalizeFilters(filters).active && searchPlayers(inPool,query).length ? '这位球员没有符合本局年份与球队条件的已核实出场记录。更改范围后请点击应用。' : '当前范围没有匹配姓名。可试中文、英文、常见绰号或调整题目范围。');
    return;
  }
  message(''); $('guess-options').hidden = false; $('guess-search').setAttribute('aria-expanded','true');
  $('guess-options').innerHTML = matches.map((player,index) => `<div class="guess-option" id="guess-option-${index}" role="option" aria-selected="${index === activeIndex}" data-id="${esc(player.id)}"><span><strong>${esc(name(player))}</strong>${name(player) !== player.name ? `<small>${esc(player.name)}</small>` : ''}</span><span>${esc(list(player.positions).join(' / '))}</span></div>`).join('');
  $('guess-search').setAttribute('aria-activedescendant',`guess-option-${activeIndex}`);
}

function guess(id) {
  if (hasPendingFilters()) { message('请先应用或撤销范围修改，再继续猜测。'); return; }
  if (ensureDate()) return;
  const result = submitGuess(round,id,players);
  if (result.error) { message(result.error); return; }
  round = result.round; save(); render();
  if (round.status === 'playing') { message(`已记录第 ${round.guesses.length} 次猜测，还剩 ${MAX_GUESSES - round.guesses.length} 次。`); $('guess-search').focus(); }
  else { message('本局结束，结果已在弹窗揭晓。'); }
}

function bind() {
  $('guess-clues-enabled').addEventListener('change',async()=>{customClues=$('guess-clues-enabled').checked; $('guess-clues-options').hidden=!customClues; save();try{if(customClues)await loadExtraMetrics();renderHistory();renderResult();updateClueSummary();}catch(error){$('guess-clues-status').textContent=error.message;}});
  $('guess-clues-options').addEventListener('change',event=>{
    const next=[...document.querySelectorAll('[data-guess-clue]:checked')].map(input=>input.value);
    if (!next.length) { event.target.checked=true; $('guess-clues-status').textContent='请至少保留一项线索。'; return; }
    clueKeys=next; save(); renderHistory(); renderResult(); updateClueSummary();
  });
  $('guess-history').addEventListener('click',event => {
    const trigger = event.target.closest('[data-team-details]');
    if (trigger) openTeamDetails(trigger.dataset.teamDetails,trigger);
  });
  const teamDialog = $('guess-team-dialog');
  $('guess-team-dialog-close').addEventListener('click',() => teamDialog.close());
  let backdropPointerDown = false;
  const outsideDialog = event => {
    const rect = teamDialog.getBoundingClientRect();
    return event.target === teamDialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom);
  };
  teamDialog.addEventListener('pointerdown',event => { backdropPointerDown = outsideDialog(event); });
  teamDialog.addEventListener('click',event => { if (backdropPointerDown && outsideDialog(event)) teamDialog.close(); backdropPointerDown = false; });
  teamDialog.addEventListener('close',() => { if (teamDialogTrigger?.isConnected) teamDialogTrigger.focus(); teamDialogTrigger = null; });
  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click',() => switchGame(button.dataset.mode,pool)));
  $('guess-pool').addEventListener('change',() => switchGame(mode,$('guess-pool').value));
  for (const id of ['guess-year-from','guess-year-to']) $(id).addEventListener('input',() => { updateFilterStatus(); closeOptions(); });
  $('guess-team').addEventListener('change',() => { updateFilterStatus(); closeOptions(); });
  $('guess-filter-apply').addEventListener('click',()=>{applyFilters();if(!hasPendingFilters())$('guess-settings-dialog').close();});
  $('guess-filter-cancel').addEventListener('click',() => { resetDraft(); updateFilterStatus(); updateOptions(); });
  $('guess-year-clear').addEventListener('click',() => {
    $('guess-year-from').value = ''; $('guess-year-to').value = ''; $('guess-team').value = '';
    updateFilterStatus(); closeOptions(); $('guess-filter-apply').focus();
  });
  $('guess-search').addEventListener('input',() => updateOptions());
  $('guess-search').addEventListener('focus',() => updateOptions());
  $('guess-search').addEventListener('compositionstart',() => { isComposing = true; closeOptions(); });
  $('guess-search').addEventListener('compositionend',() => { isComposing = false; updateOptions(); });
  $('guess-search').addEventListener('keydown',event => {
    if (event.isComposing || isComposing || event.keyCode === 229) { if (event.key === 'Enter') event.preventDefault(); return; }
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && matches.length) {
      event.preventDefault(); activeIndex = (activeIndex + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length;
      updateOptions(false); $(`guess-option-${activeIndex}`)?.scrollIntoView({block:'nearest'});
    } else if (event.key === 'Escape') { event.preventDefault(); closeOptions(); }
  });
  $('guess-form').addEventListener('submit',event => { event.preventDefault(); if (isComposing) return; if (round.status === 'playing' && !hasPendingFilters() && normalizeSearch($('guess-search').value) && matches[activeIndex]) guess(matches[activeIndex].id); else message('先应用有效的题目范围，再输入姓名并选择候选球员。'); });
  $('guess-options').addEventListener('mousedown',event => event.preventDefault());
  $('guess-options').addEventListener('click',event => { const option = event.target.closest('[data-id]'); if (option) guess(option.dataset.id); });
  document.addEventListener('click',event => { if (!event.target.closest('#guess-form,.guess-year-filter')) closeOptions(); });
  $('guess-new').addEventListener('click',() => {
    if (mode !== 'practice' || currentCandidates().length < 2 || hasPendingFilters()) return;
    if (round.status === 'playing' && round.guesses.length && !window.confirm('当前练习还没结束，确定换题并清空本局记录吗？每日进度不会改变。')) return;
    round = newRound({mode,pool,date:shanghaiDate(),version:data.version,filters,answerId:practiceAnswer(round.answerId)}); save(); render(); message('当前范围内的新练习题已准备好。'); $('guess-search').focus();
  });
  $('guess-share').addEventListener('click',async () => {
    const text = shareText(round,players,poolInfo().name,activeClueKeys());
    try { await navigator.clipboard.writeText(text); message('色块战绩已复制，不含答案姓名或球员 ID。'); }
    catch { $('guess-share-text').value = text; $('guess-share-text').hidden = false; $('guess-share-text').focus(); $('guess-share-text').select(); message('浏览器未允许自动复制，可在下方手动复制战绩。'); }
  });
  document.addEventListener('visibilitychange',() => { if (!document.hidden) ensureDate(); });
  window.addEventListener('focus',() => ensureDate());
  setInterval(ensureDate,30000);
}

async function init() {
  try {
    const response = await fetch('/data/guess-players.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    data = await response.json();
    if (!data.version || !Array.isArray(data.players) || !data.players.length || !Array.isArray(data.pools)) throw new Error('游戏数据尚未准备好');
    data.meta ||= {};
    players = [...data.players].sort((a,b) => String(a.name).localeCompare(String(b.name),'en'));
    data.pools = data.pools.filter(item => item && typeof item.id === 'string' && poolFamily(item.id));
    if (!data.pools.length) throw new Error('没有可用球员池');
    if (!data.pools.some(item => item.id === pool)) pool = data.pools[0].id;
    try {
      const pref = JSON.parse(localStorage.getItem(PREF_KEY) || 'null');
      customClues=pref?.customClues===true;
      clueKeys=selectedAttributes(pref?.clueKeys).map(item=>item.key);
      const migratedPool = ({nba:'nba-history',cba:'cba-history'})[pref?.pool] || pref?.pool;
      if (['daily','practice'].includes(pref?.mode)) mode = pref.mode;
      if (data.pools.some(item => item.id === migratedPool)) pool = migratedPool;
      for (const item of data.pools) {
        const legacy = item.id === 'nba-history' ? 'nba' : item.id === 'cba-history' ? 'cba' : item.id;
        const saved = pref?.filtersByPool?.[item.id] ?? pref?.filtersByPool?.[legacy];
        if (normalizeFilters(saved || {}).valid) filtersByPool[item.id] = canonical(saved || {});
      }
    } catch {}
    const linkedPool = new URLSearchParams(location.search).get('pool');
    if (data.pools.some(item => item.id === linkedPool)) pool = linkedPool;
    filters = canonical(filtersByPool[pool] || {}); filtersByPool[pool] = {...filters};
    $('guess-pool').innerHTML = [['nba','NBA · 按难度与范围选择'],['cba','CBA · 按难度与范围选择'],['global','跨联赛']].map(([family,label]) => `<optgroup label="${esc(label)}">${data.pools.filter(item => poolFamily(item.id) === family).map(item => `<option value="${esc(item.id)}">${esc(item.name)} · ${playersInPool(players,item.id).length} 人</option>`).join('')}</optgroup>`).join('');
    $('guess-data-note').textContent = data.meta.note || '缺少可靠来源的字段保留未知；不会推测国籍、球队或职业首年。';
    $('guess-metrics-cutoff').textContent=`点击「效力球队」查看完整队名。常规赛与奖项截至 2025–26；季后赛和总决赛实际出场截至 ${data.meta.postseasonThrough?`${data.meta.postseasonThrough-1}–${String(data.meta.postseasonThrough).slice(-2)}`:'2023–24'}。阵容快照 ${data.meta.snapshotDate}；统计补充 ${data.meta.postseasonUpdatedAt||data.dataAsOf}。`;
    $('guess-pools-title').textContent = `${data.pools.length} 个球员池 · 点击切换`;
    $('guess-library-summary').textContent = `猜球员题库共 ${players.length.toLocaleString('zh-CN')} 份球员档案，独立于评级页面的默认 300 人名单。`;
    const release = document.querySelector('meta[name="true-goat-release"]')?.content;
    $('guess-release').textContent = `题库 v${data.version}${release ? ` · 网站 ${release}` : ' · 本地预览'}`;
    $('guess-pool-cards').innerHTML = data.pools.map(item => `<button type="button" data-pool-card="${esc(item.id)}" aria-pressed="false"><span>${esc(item.name)}</span><strong>${playersInPool(players,item.id).length.toLocaleString('zh-CN')} <small>人</small></strong></button>`).join('');
    $('guess-pool-cards').addEventListener('click',event => {
      const button = event.target.closest('[data-pool-card]');
      if (button) switchGame(mode,button.dataset.poolCard);
    });
    $('guess-clues-enabled').checked=customClues;
    $('guess-clues-options').hidden=!customClues;
    $('guess-clues-options').innerHTML=ALL_ATTRIBUTES.map(item=>`<label><input type="checkbox" data-guess-clue value="${item.key}" ${clueKeys.includes(item.key)?'checked':''}>${esc(item.label.replace('*',''))}</label>`).join('');
    if(customClues)try{await loadExtraMetrics();}catch(error){customClues=false;$('guess-clues-enabled').checked=false;$('guess-clues-options').hidden=true;}
    updateClueSummary();
    resetDraft(); initSettings();bind(); loadRound(); $('guess-loading').hidden = true; $('guess-app').hidden = false;
    initOnline({players,pools:data.pools,dataVersion:data.version});
  } catch (error) { $('guess-loading').textContent = `游戏暂时无法载入（${error.message}）。请检查网络连接，稍后刷新重试。`; $('guess-loading').setAttribute('role','alert'); }
}

if (typeof document !== 'undefined') init();

function updateClueSummary() {
  const attributes=selectedAttributes(activeClueKeys());
  $('guess-clues-status').textContent=`当前 ${attributes.length} 项线索 · 在线对战固定使用默认 10 项。`;
  document.querySelector('.guess-history-head>span:last-child').textContent=`${attributes.length} 项${customClues?'自选':'默认'}线索`;
}
