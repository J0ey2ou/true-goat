import { MAX_GUESSES, ATTRIBUTES, playersInPool, parseYearFilter, matchesYearFilter, shanghaiDate, comparePlayers, newRound, restoreRound, submitGuess, shareText } from './guess-engine.mjs';
import { normalizeSearch, searchPlayers } from './player-search.mjs';

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const list = value => Array.isArray(value) ? value : [];
const chinese = {jordami01:'迈克尔·乔丹',jamesle01:'勒布朗·詹姆斯',abdulka01:'卡里姆·贾巴尔',johnsma02:'魔术师约翰逊',russebi01:'比尔·拉塞尔',birdla01:'拉里·伯德',onealsh01:'沙奎尔·奥尼尔',chambwi01:'威尔特·张伯伦',duncati01:'蒂姆·邓肯',bryanko01:'科比·布莱恩特',curryst01:'斯蒂芬·库里',duranke01:'凯文·杜兰特',olajuha01:'哈基姆·奥拉朱旺',jokicni01:'尼古拉·约基奇',roberos01:'奥斯卡·罗伯特森',westje01:'杰里·韦斯特',malonmo01:'摩西·马龙',garneke01:'凯文·加内特',antetgi01:'扬尼斯·阿德托昆博',nowitdi01:'德克·诺维茨基',malonka01:'卡尔·马龙',stockjo01:'约翰·斯托克顿',wadedw01:'德维恩·韦德',robinda01:'大卫·罗宾逊'};
const name = player => player.chineseName || chinese[player.id] || player.name;
const numeric = value => typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString('zh-CN',{maximumFractionDigits:1,useGrouping:false}) : '未知';
const statusNames = {correct:'一致',close:'接近 / 重合',wrong:'不同',unknown:'未知'};
const stateCache = new Map();
const PREF_KEY = 'true-goat-guess:preferences:v1';
let data,players = [],mode = 'daily',pool = 'nba',round,matches = [],activeIndex = 0,storageWarning = false,isComposing = false;

function storageKey() { return `true-goat-guess:v1:${data.version}:${mode}:${pool}`; }
function safeUrl(value) { try { const url = new URL(value); return ['http:','https:'].includes(url.protocol) ? url.href : null; } catch { return null; } }
function poolInfo() { return data.pools.find(item => item.id === pool); }
function message(text) { $('guess-message').textContent = text; }
function yearFilter() { return parseYearFilter($('guess-year-from').value,$('guess-year-to').value); }
function updateYearStatus() {
  const filter = yearFilter(), candidates = playersInPool(players,pool);
  const count = candidates.filter(player => matchesYearFilter(player,filter)).length;
  for (const id of ['guess-year-from','guess-year-to']) $(id).setAttribute('aria-invalid',String(!filter.valid));
  $('guess-year-status').classList.toggle('invalid',!filter.valid);
  $('guess-year-status').textContent = !filter.valid ? filter.error : filter.active ? `赛季符合条件：${count} / ${candidates.length} 位。若没有你想找的人，可清除筛选。` : `未限制年份 · 可搜索当前池全部 ${candidates.length} 位球员`;
  $('guess-year-clear').disabled = !filter.active;
  return filter;
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
  try { localStorage.setItem(storageKey(),JSON.stringify(round)); localStorage.setItem(PREF_KEY,JSON.stringify({mode,pool})); }
  catch { storageWarning = true; }
}

function practiceAnswer(previous) {
  let options = playersInPool(players,pool).filter(player => player.id !== previous);
  if (!options.length) options = playersInPool(players,pool);
  const entropy = new Uint32Array(1); crypto.getRandomValues(entropy);
  return options[entropy[0] % options.length]?.id || null;
}

function loadRound() {
  let saved = stateCache.get(storageKey()),parseError = false;
  if (!saved) try { const raw = localStorage.getItem(storageKey()); saved = raw ? JSON.parse(raw) : null; } catch { parseError = true; }
  const restored = restoreRound(saved,{mode,pool,date:shanghaiDate(),version:data.version,players,fallbackAnswerId:practiceAnswer()});
  round = restored.round; save(); render();
  if (parseError || restored.recovered) message('旧进度无法使用，已恢复本池当前题目；每日答案不会因此改变。');
  else if (storageWarning) message('浏览器不允许持久保存；本次打开期间仍可切换球员池，关闭后可能丢失进度。');
}

function ensureDate() {
  if (!round) return false;
  if (mode === 'daily' && round.date !== shanghaiDate()) { loadRound(); message('北京时间已进入新的一天，每日题目已更新。'); return true; }
  return false;
}

function switchGame(nextMode,nextPool) {
  if (!['daily','practice'].includes(nextMode) || !data.pools.some(item => item.id === nextPool)) return;
  save(); mode = nextMode; pool = nextPool; loadRound();
}

function render() {
  const currentPool = poolInfo(), count = playersInPool(players,pool).length;
  $('guess-pool').value = pool;
  document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.mode === mode)));
  $('guess-pool-count').textContent = `${currentPool.name} · ${count} 位`;
  const dates = [...new Set(playersInPool(players,pool).map(player => player.asOf).filter(Boolean))].sort();
  $('guess-snapshot').textContent = dates.length === 1 ? `快照 ${dates[0]}` : `多期快照 · 数据包 ${data.meta.snapshotDate || data.meta.dataAsOf || '见数据说明'}`;
  $('guess-round-label').textContent = mode === 'daily' ? `DAILY / ${round.date} / UTC+8` : 'PRACTICE / YOUR OWN PACE';
  $('guess-board-title').textContent = round.status === 'won' ? '漂亮，你找到了。' : round.status === 'lost' ? '八次用完，看看答案。' : mode === 'daily' ? '今天，你能几次猜中？' : '选一位球员，开始推理。';
  $('guess-attempts').textContent = round.guesses.length;
  $('guess-round-note').textContent = currentPool.description || '答案与猜测均来自当前收录球员池。';
  $('guess-search').value = ''; $('guess-search').disabled = round.status !== 'playing';
  $('guess-submit').disabled = true; closeOptions(); message('');
  $('guess-search-hint').textContent = round.status === 'playing' ? '↑ ↓ 切换候选，回车或点击候选提交；重复猜测不扣次数。' : '本局已结束，输入已锁定。可复制战绩，或前往自由练习。';
  $('guess-new').hidden = mode !== 'practice';
  $('guess-share').disabled = round.guesses.length === 0;
  $('guess-next-day').textContent = mode === 'daily' ? '每池每日一题 · 北京时间 00:00 更新' : '练习换题不会影响每日进度';
  $('guess-share-text').hidden = true;
  updateYearStatus();
  renderHistory(); renderResult();
}

function cellValue(player,key) {
  if (key === 'teams') return list(player.teams).map(team => team.name || team.id).join(' / ') || '未知';
  if (key === 'positions') return list(player.positions).join(' / ') || '未知';
  return numeric(player[key]);
}

function renderHistory() {
  if (!round.guesses.length) {
    $('guess-history').innerHTML = '<div class="guess-empty"><strong>第一步，从你最熟悉的人开始。</strong><p>中文、英文、常见绰号都可以：<br><span>哈登 / James Harden / 大胡子</span><br>每次猜测留下 10 项线索，分两组帮你缩小范围。</p></div>';
    return;
  }
  const answer = players.find(player => player.id === round.answerId);
  $('guess-history').innerHTML = round.guesses.map((id,index) => {
    const guessed = players.find(player => player.id === id);
    const cells = comparePlayers(guessed,answer);
    const renderCells = group => cells.filter(cell => (cell.group === 'career') === (group === 'career')).map(cell => {
      const value = cellValue(guessed,cell.key),arrow = cell.direction === 'up' ? '↑' : cell.direction === 'down' ? '↓' : '';
      const note = [cell.note,cell.group === 'career' ? metricDescription(guessed,cell.key) : ''].filter(Boolean).join(' · ');
      return `<div class="guess-cell ${cell.status}" data-key="${cell.key}" data-label="${esc(cell.label)}" aria-label="${esc(cell.label)}：${esc(value)}，${statusNames[cell.status]}${arrow ? '，答案数值' + (cell.direction === 'up' ? '更大' : '更小') : ''}" title="${esc(value)}${note ? ' · ' + esc(note) : ''}"><span class="cell-label">${esc(cell.label)}</span><span class="cell-value">${esc(value)}${arrow ? `<b class="cell-arrow" aria-hidden="true">${arrow}</b>` : ''}</span><small>${cell.status === 'unknown' ? '未知 / 不可比较' : statusNames[cell.status]}</small></div>`;
    }).join('');
    return `<article class="guess-row" data-guessed="${esc(id)}"><div class="guess-player"><div><strong>${esc(name(guessed))}</strong>${name(guessed) !== guessed.name ? `<small>${esc(guessed.name)}</small>` : ''}</div><span class="guess-order">${String(index + 1).padStart(2,'0')} / 08</span></div><section class="guess-clue-group" aria-label="基本资料"><h3>基本资料</h3><div class="guess-clue-grid">${renderCells('basic')}</div></section><section class="guess-clue-group" aria-label="NBA/BAA 生涯指标"><h3>NBA / BAA 生涯指标</h3><div class="guess-clue-grid">${renderCells('career')}</div></section></article>`;
  }).join('');
}

function renderResult() {
  $('guess-result').hidden = round.status === 'playing';
  if (round.status === 'playing') { $('guess-result').innerHTML = ''; return; }
  const answer = players.find(player => player.id === round.answerId);
  const sourceIds = new Set(list(answer.sourceIds));
  const sources = list(data.sources).filter(source => sourceIds.has(source.id));
  const directoryId = answer.directoryId || (answer.pools.includes('nba') ? answer.id : null);
  const careerAttributes = ATTRIBUTES.filter(item => item.group === 'career');
  const metrics = careerAttributes.map(item => `<div data-result-key="${item.key}" title="${esc(metricDescription(answer,item.key))}"><dt>${esc(item.label.replace('*',''))}</dt><dd>${numeric(answer[item.key])}</dd></div>`).join('');
  const coverage = careerAttributes.map(item => `<li><strong>${esc(item.label.replace('*',''))}</strong>：${esc(metricDescription(answer,item.key))}</li>`).join('');
  $('guess-result').innerHTML = `<div class="eyebrow">${round.status === 'won' ? `FOUND IN ${round.guesses.length} / ${MAX_GUESSES}` : 'ANSWER REVEALED'}</div><h3>${esc(name(answer))}</h3><p>${esc(answer.name)} · ${esc(list(answer.positions).join(' / ') || '位置未知')} · 出生年 ${numeric(answer.birthYear)} · 身高 ${numeric(answer.heightCm)} cm</p><p>首赛年：${numeric(answer.firstSeasonYear)}${answer.firstSeasonScope ? `（${esc(answer.firstSeasonScope)}首次正式出场）` : '（口径未收录）'}<br>已确认球队：${esc(cellValue(answer,'teams'))}${answer.teamsComplete ? '' : '（记录不完整）'}</p><dl class="guess-result-metrics">${metrics}</dl><details class="guess-result-coverage"><summary>统计口径与覆盖范围</summary><ul>${coverage}</ul></details>${list(answer.notes).map(note => `<p>${esc(note)}</p>`).join('')}<div class="guess-result-links">${directoryId ? `<a href="/players?player=${encodeURIComponent(directoryId)}">查看球员档案 ↗</a>` : ''}${sources.map(source => { const url = safeUrl(source.url); return url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(source.title || source.id)} ↗</a>` : ''; }).join('')}</div>`;
}

function closeOptions() {
  $('guess-options').hidden = true; $('guess-search').setAttribute('aria-expanded','false');
  $('guess-submit').disabled = true;
  $('guess-search').removeAttribute('aria-activedescendant'); matches = []; activeIndex = 0;
}

function updateOptions(resetIndex = true) {
  const filter = updateYearStatus();
  if (round.status !== 'playing' || isComposing) return;
  const query = normalizeSearch($('guess-search').value);
  if (!filter.valid) { closeOptions(); message('请修正赛季筛选，或点击“清除”恢复全部候选。'); return; }
  if (!query) { closeOptions(); $('guess-submit').disabled = true; message(''); return; }
  const inPool = playersInPool(players,pool);
  const found = searchPlayers(inPool.filter(player => matchesYearFilter(player,filter)),query);
  const notGuessed = found.filter(player => !round.guesses.includes(player.id));
  matches = notGuessed.slice(0,10);
  if (resetIndex) activeIndex = 0;
  activeIndex = Math.max(0,Math.min(activeIndex,matches.length - 1));
  $('guess-submit').disabled = !matches.length || !query;
  if (!query || !matches.length) {
    $('guess-options').hidden = true; $('guess-search').setAttribute('aria-expanded','false'); $('guess-search').removeAttribute('aria-activedescendant');
    if (query) message(found.length ? '匹配球员已猜过，不会扣除次数；试试其他球员。' : filter.active && searchPlayers(inPool,query).length ? '匹配球员不符合当前赛季条件，或缺少赛季记录。可清除年份筛选。' : '当前球员池没有匹配姓名。可试中文、英文、常见绰号或切换球员池。');
    return;
  }
  message(''); $('guess-options').hidden = false; $('guess-search').setAttribute('aria-expanded','true');
  $('guess-options').innerHTML = matches.map((player,index) => `<div class="guess-option" id="guess-option-${index}" role="option" aria-selected="${index === activeIndex}" data-id="${esc(player.id)}"><span><strong>${esc(name(player))}</strong>${name(player) !== player.name ? `<small>${esc(player.name)}</small>` : ''}</span><span>${esc(list(player.positions).join(' / '))}</span></div>`).join('');
  $('guess-search').setAttribute('aria-activedescendant',`guess-option-${activeIndex}`);
}

function guess(id) {
  if (ensureDate()) return;
  const result = submitGuess(round,id,players);
  if (result.error) { message(result.error); return; }
  round = result.round; save(); render();
  if (round.status === 'playing') { message(`已记录第 ${round.guesses.length} 次猜测，还剩 ${MAX_GUESSES - round.guesses.length} 次。`); $('guess-search').focus(); }
  else { message(round.status === 'won' ? '猜中了！答案与数据来源已展开。' : '本局结束，答案与数据来源已展开。'); $('guess-result').scrollIntoView({block:'nearest',behavior:'instant'}); }
}

function bind() {
  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click',() => switchGame(button.dataset.mode,pool)));
  $('guess-pool').addEventListener('change',() => switchGame(mode,$('guess-pool').value));
  for (const id of ['guess-year-from','guess-year-to']) $(id).addEventListener('input',() => updateOptions());
  $('guess-year-clear').addEventListener('click',() => {
    $('guess-year-from').value = ''; $('guess-year-to').value = '';
    updateOptions(); $('guess-search').focus();
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
  $('guess-form').addEventListener('submit',event => { event.preventDefault(); if (isComposing) return; if (round.status === 'playing' && yearFilter().valid && normalizeSearch($('guess-search').value) && matches[activeIndex]) guess(matches[activeIndex].id); else message('先输入姓名并选择一位候选球员；年份条件也需有效。'); });
  $('guess-options').addEventListener('mousedown',event => event.preventDefault());
  $('guess-options').addEventListener('click',event => { const option = event.target.closest('[data-id]'); if (option) guess(option.dataset.id); });
  document.addEventListener('click',event => { if (!event.target.closest('#guess-form,.guess-year-filter')) closeOptions(); });
  $('guess-new').addEventListener('click',() => {
    if (mode !== 'practice') return;
    if (round.status === 'playing' && round.guesses.length && !window.confirm('当前练习还没结束，确定换题并清空本局记录吗？每日进度不会改变。')) return;
    round = newRound({mode,pool,date:shanghaiDate(),version:data.version,answerId:practiceAnswer(round.answerId)}); save(); render(); message('新的练习题已准备好。'); $('guess-search').focus();
  });
  $('guess-share').addEventListener('click',async () => {
    const text = shareText(round,players,poolInfo().name);
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
    data.pools = data.pools.filter(item => playersInPool(players,item.id).length);
    if (!data.pools.length) throw new Error('没有可用球员池');
    if (!data.pools.some(item => item.id === pool)) pool = data.pools[0].id;
    try { const pref = JSON.parse(localStorage.getItem(PREF_KEY) || 'null'); if (['daily','practice'].includes(pref?.mode)) mode = pref.mode; if (data.pools.some(item => item.id === pref?.pool)) pool = pref.pool; } catch {}
    $('guess-pool').innerHTML = data.pools.map(item => `<option value="${esc(item.id)}">${esc(item.name)}</option>`).join('');
    $('guess-data-note').textContent = data.meta.note || '缺少可靠来源的字段保留未知；不会推测国籍、球队或职业首年。';
    bind(); loadRound(); $('guess-loading').hidden = true; $('guess-app').hidden = false;
  } catch (error) { $('guess-loading').textContent = `游戏暂时无法载入（${error.message}）。请确认本地服务和游戏数据已准备好，再刷新重试。`; $('guess-loading').setAttribute('role','alert'); }
}

init();
