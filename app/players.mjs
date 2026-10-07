import { createPlayerLibrary, mergeSelectedPlayers } from './player-library.mjs';
import { searchPlayers } from './player-search.mjs';
const $ = id => document.getElementById(id);
const PAGE_SIZE = 25;
const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const normalize = value => String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const list = value => Array.isArray(value) ? value : [];
const has = value => value !== null && value !== undefined && value !== '';
const number = (value, digits = 0) => typeof value === 'number' && Number.isFinite(value)
  ? value.toLocaleString('zh-CN', {minimumFractionDigits:digits, maximumFractionDigits:digits}) : '—';
const chinese = {
  jordami01:'迈克尔·乔丹',jamesle01:'勒布朗·詹姆斯',abdulka01:'卡里姆·贾巴尔',johnsma02:'魔术师约翰逊',
  russebi01:'比尔·拉塞尔',birdla01:'拉里·伯德',onealsh01:'沙奎尔·奥尼尔',chambwi01:'威尔特·张伯伦',
  duncati01:'蒂姆·邓肯',bryanko01:'科比·布莱恩特',curryst01:'斯蒂芬·库里',duranke01:'凯文·杜兰特',
  olajuha01:'哈基姆·奥拉朱旺',jokicni01:'尼古拉·约基奇',roberos01:'奥斯卡·罗伯特森',westje01:'杰里·韦斯特',
  malonmo01:'摩西·马龙',garneke01:'凯文·加内特',antetgi01:'扬尼斯·阿德托昆博',nowitdi01:'德克·诺维茨基',
  malonka01:'卡尔·马龙',stockjo01:'约翰·斯托克顿',wadedw01:'德维恩·韦德',robinda01:'大卫·罗宾逊'
};
const knownAliases = {johnsma02:['魔术师'],antetgi01:['字母哥'],onealsh01:['大鲨鱼'],chambwi01:['张大帅'],olajuha01:['大梦']};
import { registerNames } from './i18n.mjs';
const displayName = player => player.chineseName || chinese[player.id] || player.name;
const seasonRange = player => [player.firstSeason,player.lastSeason].filter(has).filter((value,index,all) => all.indexOf(value) === index).join(' — ') || '赛季未收录';
const poolIds = player => ['A','B','C'].filter(id => player.eligibility?.pools?.[id]);
const positionLabels = {PG:'控球后卫',SG:'得分后卫',SF:'小前锋',PF:'大前锋',C:'中锋',G:'后卫',F:'前锋','G-F':'后卫 / 前锋','F-G':'前锋 / 后卫','C-F':'中锋 / 前锋','F-C':'前锋 / 中锋'};
let directory, players = [], basePlayers = [], library, page = 1, directoryReady = false;
const decoratePlayer=player=>({...player,chineseName:player.chineseName || chinese[player.id],aliases:[...list(player.aliases),...list(knownAliases[player.id])],teams:list(player.teams).map(team=>({...team,abbreviation:team.abbreviation || team.code})),searchText:normalize([player.name,player.chineseName,chinese[player.id],player.id,...list(player.aliases),...list(knownAliases[player.id]),...list(player.teams).flatMap(team => [team.code,team.name])].filter(has).join(' '))});
function applySelection({profiles}) {
  players=mergeSelectedPlayers(basePlayers,profiles.map(decoratePlayer)).sort((a,b)=>String(a.name).localeCompare(String(b.name),'en'));
  if(directoryReady){refreshFilterOptions();renderMethod();renderList();const id=new URL(location.href).searchParams.get('player');if(id&&$('player-dialog').open)showPlayer(id);}
}

function safeLink(url) {
  try { const parsed = new URL(url); return ['https:','http:'].includes(parsed.protocol) ? parsed.href : null; }
  catch { return null; }
}

function renderMethod() {
  const meta = directory.meta || {};
  $('directory-total').textContent = players.length;
  const customCount=players.filter(p=>p.customPlayer).length;
  $('pool-heading').textContent = customCount ? `默认 ${basePlayers.length} 位 + 你添加的 ${customCount} 位` : `为什么是这 ${players.length} 位？`;
  $('directory-method').textContent = (meta.note || '')+(customCount?' 用户添加的档案来自扩展库，不代表通过 A/B/C 入选规则；添加不修改默认样本的指数。':' 这些是默认样本，可通过上方入口加入其他有据可查的球员。');
  document.querySelector('.dir-overlap-note').textContent=customCount?'默认三池 + 用户自选':'三个入口 · 去重合并';
  $('pool-overlap').textContent='同一位默认球员可以属于多个候选池，各池人数不可直接相加。'+(customCount?'用户添加 '+customCount+' 人单独标记，不计入 A/B/C。':'')+'入选不等于上榜，也不保证高分。';
  $('pool-cards').innerHTML = list(directory.pools).map(pool => {
    const count = players.filter(player => player.eligibility?.pools?.[pool.id]).length;
    return `<article class="dir-pool-card"><header><span class="dir-pool-letter">${esc(pool.id)}</span><h3>${esc(pool.name)}</h3><strong>${number(count)}<span class="sr-only"> 人</span></strong></header><p>${esc(pool.description)}</p>${list(pool.rules).length ? `<details><summary>查看筛选规则</summary><ul>${pool.rules.map(rule => `<li>${esc(rule)}</li>`).join('')}</ul></details>` : ''}</article>`;
  }).join('');
  const through = [];
  if (has(meta.regularSeasonThrough)) through.push(`常规赛截至 ${meta.regularSeasonThrough}`);
  if (has(meta.playoffsThrough)) through.push(`季后赛截至 ${meta.playoffsThrough}`);
  $('directory-version').textContent = [`TRUE GOAT · ${directory.version || 'PLAYER DIRECTORY'}`,meta.scope,...through].filter(has).join(' · ');
}

function refreshFilterOptions() {
  const positions = [...new Set(players.map(player => player.position).filter(has))].sort();
  const eras = [...new Set(players.map(player => player.era).filter(has))].sort((a,b) => String(a).localeCompare(String(b), 'en', {numeric:true}));
  const selectedPosition=$('filter-position').value,selectedEra=$('filter-era').value;
  $('filter-position').innerHTML = '<option value="">全部位置</option>'+positions.map(position => `<option value="${esc(position)}">${esc(positionLabels[position] ? `${position} · ${positionLabels[position]}` : position)}</option>`).join('');
  $('filter-era').innerHTML = '<option value="">全部年代</option>'+eras.map(era => `<option value="${esc(era)}">${esc(era)}</option>`).join('');
  if(positions.includes(selectedPosition))$('filter-position').value=selectedPosition;
  if(eras.map(String).includes(selectedEra))$('filter-era').value=selectedEra;
}
function setupFilters() {
  refreshFilterOptions();
  $('directory-filters').addEventListener('submit', event => event.preventDefault());
  $('directory-search').addEventListener('input', () => { page = 1; renderList(); });
  for (const id of ['filter-position','filter-era','filter-pool']) $(id).addEventListener('change', () => { page = 1; renderList(); });
  $('clear-filters').addEventListener('click', () => { $('directory-filters').reset(); page = 1; renderList(); $('directory-search').focus(); });
  $('directory-prev').addEventListener('click', () => { page -= 1; renderList(); scrollToList(); });
  $('directory-next').addEventListener('click', () => { page += 1; renderList(); scrollToList(); });
  $('directory-list').addEventListener('click', event => {
    const row = event.target.closest('[data-player]');
    if (row) showPlayer(row.dataset.player);
  });
}

function scrollToList() {
  $('directory-heading').scrollIntoView({behavior:'instant',block:'start'});
}

function filteredPlayers() {
  const query = $('directory-search').value;
  const matching = new Set(searchPlayers(players,query,{includeTeams:true}).map(p=>p.id));
  const position = $('filter-position').value, era = $('filter-era').value, pool = $('filter-pool').value;
  return players.filter(player => (!position || player.position === position)
    && (!era || String(player.era) === era)
    && (!pool || (pool==='custom'?player.customPlayer:player.eligibility?.pools?.[pool]))
    && matching.has(player.id));
}

function renderList() {
  const filtered = filteredPlayers();
  const totalPages = Math.max(1,Math.ceil(filtered.length / PAGE_SIZE));
  page = Math.min(totalPages,Math.max(1,page));
  const start = (page - 1) * PAGE_SIZE;
  $('directory-count').textContent = `${filtered.length} / ${players.length} 位`;
  $('directory-list').innerHTML = filtered.slice(start,start + PAGE_SIZE).map(player => `<button type="button" class="dir-player-row" data-player="${esc(player.id)}" aria-label="查看 ${esc(displayName(player))} 的球员档案">
    <span class="dir-player-name"><strong>${esc(displayName(player))}</strong>${displayName(player) !== player.name ? `<small lang="en">${esc(player.name)}</small>` : ''}</span>
    <span class="dir-player-meta dir-career" data-label="赛季">${esc(seasonRange(player))}</span>
    <span class="dir-player-meta dir-position" data-label="位置">${esc(player.position || '—')}</span>
    <span class="dir-player-meta dir-era" data-label="年代">${esc(player.era || '—')}</span>
    <span class="dir-pool-tags" aria-label="${player.customPlayer?'用户添加':'入选候选池 '+poolIds(player).join('、')}">${player.customPlayer?'<span class="dir-tag">自选</span>':poolIds(player).map(id => `<span class="dir-pool-letter">${id}</span>`).join('')}</span>
    <span class="dir-player-arrow" aria-hidden="true">↗</span></button>`).join('') || '<div class="dir-empty">没有匹配的球员。试试英文姓名，或清除筛选条件。</div>';
  $('directory-range').textContent = filtered.length ? `第 ${start + 1}–${Math.min(start + PAGE_SIZE,filtered.length)} 位，共 ${filtered.length} 位` : '没有匹配结果';
  $('directory-page').textContent = `${page} / ${totalPages}`;
  $('directory-prev').disabled = page === 1;
  $('directory-next').disabled = page === totalPages;
}

function textValue(value, unit = '') {
  return has(value) ? `${esc(Array.isArray(value) ? value.join(' / ') : value)}${esc(unit)}` : '<span class="dir-value-missing">未收录 / 未确认</span>';
}

function fact(label,value) { return `<div class="dir-fact"><dt>${esc(label)}</dt><dd>${value}</dd></div>`; }
function countValue(value) { return has(value) ? esc(number(value)) : '<span class="dir-value-missing">未收录</span>'; }
function booleanValue(value) { return value === true ? '是' : value === false ? '否' : '<span class="dir-value-missing">未收录</span>'; }
function metric(value,digits = 0,percentage = false) { return number(percentage && typeof value === 'number' ? value * 100 : value,digits) + (percentage && typeof value === 'number' ? '%' : ''); }

function renderBackground(player) {
  const background = player.background || {};
  const height = has(background.heightCm) ? `${number(background.heightCm,1)} cm${has(background.heightIn) ? ` / ${number(background.heightIn,1)} in` : ''}` : null;
  const weight = has(background.weightKg) ? `${number(background.weightKg,1)} kg${has(background.weightLb) ? ` / ${number(background.weightLb)} lb` : ''}` : null;
  const draft = background.draft;
  const draftText = draft && has(draft.year) ? [draft.year,has(draft.round) ? `第 ${draft.round} 轮` : null,has(draft.pick) ? `第 ${draft.pick} 顺位` : null,draft.team].filter(has).join(' · ') : null;
  const teams = list(player.teams);
  return `<section class="dir-detail-section"><h3>球员履历</h3><dl class="dir-facts">
    ${fact('场上位置',textValue(player.position ? `${player.position}${positionLabels[player.position] ? ' · ' + positionLabels[player.position] : ''}` : null))}
    ${fact('主要年代',textValue(player.era))}
    ${fact('首个赛季',textValue(player.firstSeason))}${fact('最近赛季',textValue(player.lastSeason))}
    ${fact('记录赛季数',countValue(player.seasons))}${fact('档案首赛',textValue(background.debutDate ? `${background.debutDate}${background.debutScope ? '（' + background.debutScope + '）' : '（联赛范围待核实）'}` : null))}
    ${fact('身高',textValue(height))}${fact('体重',textValue(weight))}
    ${fact('出生日期',textValue(background.birthDate))}${fact('学院 / 大学',textValue(background.college))}
    ${fact('选秀记录',textValue(draftText))}${fact('数据状态',textValue(player.snapshotStatus === 'active' ? '快照末季仍有参赛记录' : player.snapshotStatus === 'retired' ? '生涯记录已结束（快照口径）' : null))}
    </dl><p class="dir-detail-caption">生涯起止按数据中的 NBA / BAA 赛季记录展示，不等同于正式宣布出道或退役的年份；身高体重为来源记录值，不代表实时测量。</p>
    <h3>效力球队</h3><div class="dir-teams">${teams.length ? teams.map(team => `<span class="dir-team">${esc(team.name || team.code)}${team.code && team.name && team.code !== team.name ? ` (${esc(team.code)})` : ''}${has(team.firstSeason) ? ` · ${esc(team.firstSeason)}${has(team.lastSeason) && team.firstSeason !== team.lastSeason ? ` — ${esc(team.lastSeason)}` : ''}` : ''}</span>`).join('') : '<span class="dir-value-missing">球队记录未收录</span>'}</div><p class="dir-detail-caption">每支球队列出首次与最后一次记录赛季，不代表期间连续效力。</p></section>`;
}

function renderStats(player) {
  const rs = player.careerRS || {}, po = player.careerPO || {};
  const rows = [
    ['参赛赛季','seasons',0],['出场场次','games',0],['场均得分','ppg',1],['场均篮板','rpg',1],['场均助攻','apg',1],
    ['场均抢断','spg',1],['场均盖帽','bpg',1],['场均上场分钟','mpg',1],['累计得分','points',0],['累计篮板','rebounds',0],['累计助攻','assists',0],
    ['累计抢断','steals',0],['累计盖帽','blocks',0],['累计上场分钟','minutes',0],['真实命中率 TS%','ts',1,true]
  ];
  const coverage = player.coverage || {}, meta = directory.meta || {};
  const through = [has(coverage.regularSeasonThrough ?? meta.regularSeasonThrough) ? `常规赛最后记录 ${coverage.regularSeasonThrough ?? meta.regularSeasonThrough}` : '',has(coverage.playoffsThrough ?? meta.playoffsThrough) ? `季后赛最后记录 ${coverage.playoffsThrough ?? meta.playoffsThrough}` : ''].filter(Boolean).join('；');
  const coverageKeys = {ppg:'points',rpg:'rebounds',apg:'assists',spg:'steals',bpg:'blocks',mpg:'minutes'};
  const partial = key => { const games = rs.metricCoverageGames?.[coverageKeys[key] || key]; return typeof games === 'number' && games > 0 && games < rs.games; };
  const partialNotes = rows.filter(([,key]) => partial(key) && !Object.hasOwn(coverageKeys,key)).map(([label,key]) => `${label}：${number(rs.metricCoverageGames[key])} / ${number(rs.games)} 场有记录`);
  return `<section class="dir-detail-section"><h3>生涯数据</h3><table class="dir-stats"><caption class="sr-only">${esc(displayName(player))} 常规赛与季后赛数据</caption><thead><tr><th scope="col">指标</th><th scope="col">常规赛</th><th scope="col">季后赛</th></tr></thead><tbody>${rows.map(([label,key,digits,percentage]) => `<tr><td>${label}</td><td>${metric(rs[key],digits,percentage)}${partial(key) ? '<sup title="仅涵盖有记录赛季，见表后说明">†</sup>' : ''}</td><td>${metric(po[key],digits,percentage)}</td></tr>`).join('')}</tbody></table>
    <p class="dir-detail-caption">${esc(through)}（赛季结束年）。— 表示未收录或该项未有可用记录，不代表 0。季后赛合计未收录，不从已四舍五入的场均倒推累计。${partialNotes.length ? `<br>† ${esc(partialNotes.join('；'))}。累计仅涵盖已观测赛季，场均也以有记录场数为分母。` : ''}</p></section>`;
}

function renderAwards(player) {
  const awards = player.awards || {};
  const awardFields = [['常规赛 MVP','mvp'],['总决赛 MVP','finalsMvp'],['最佳防守球员','dpoy'],['最佳阵容一阵','allNbaFirst'],['最佳阵容合计','allNba'],['最佳防守阵容','allDefense'],['全明星次数','allStar'],['总冠军次数','championships'],['总决赛次数','finalsAppearances']];
  return `<section class="dir-detail-section"><h3>生涯荣誉</h3><dl class="dir-facts">${awardFields.map(([label,key]) => fact(label,countValue(awards[key]))).join('')}${fact('篮球名人堂',booleanValue(awards.hallOfFame))}${fact('NBA 75 大',booleanValue(awards.nba75))}${fact('NBA 50 大',booleanValue(awards.nba50))}</dl><p class="dir-detail-caption">荣誉按当前数据快照统计；奖项的设立时间不同，早期球员的 0 次不等于不具备相应能力。</p></section>`;
}

function renderEligibility(player) {
  if(player.customPlayer)return '<section class="dir-detail-section"><h3>为什么在当前比较池？</h3><p>这是'+(library.has(player.id)?'你从扩展档案选择的球员':'扩展档案预览，尚未加入当前比较池')+'，并非 A/B/C 默认入选者。添加操作不会改变原 '+basePlayers.length+' 位默认球员的指数或入选规则。</p><p class="dir-detail-caption">新增指标按档案明确的覆盖与固定参照计算；未计算项保持缺失，不以 50 冒充观测指数。可查看原始统计并选择高级模块。</p></section>';
  const eligibility = player.eligibility || {}, ids = poolIds(player);
  const rankings = list(eligibility.externalRankings);
  const rankingList = rankings.length ? `<details class="dir-source-mapping"><summary>查看入选参考榜单中的位置</summary><ul class="dir-notes">${rankings.map(ranking => {
    const source = list(directory.sources).find(item => item.id === ranking.sourceId);
    const url = safeLink(source?.url);
    const label = source?.title || ranking.sourceId;
    return `<li>${url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>` : esc(label)}：第 ${number(ranking.rank)} / ${number(ranking.size)} 位</li>`;
  }).join('')}</ul></details>` : '';
  return `<section class="dir-detail-section"><h3>为什么入选比较池？</h3>${ids.length ? ids.map(id => {
    const pool = list(directory.pools).find(item => item.id === id);
    const reasons = list(eligibility.reasons?.[id]);
    return `<div class="dir-reason"><span class="dir-pool-letter">${id}</span><div><strong>${esc(pool?.name || `${id} 池`)}</strong>${reasons.length ? reasons.map(reason => `<p>${esc(reason)}</p>`).join('') : '<p>已核实属于该候选池，具体条目尚未收录。</p>'}</div></div>`;
  }).join('') : '<p>具体入选路径尚未收录。</p>'}<p class="dir-detail-caption">入选依据是候选资格，不是模型权重，也不是预设排名。多条路径可以重叠，最终球员名单去重。</p>${rankingList}</section>`;
}

function renderCoverage(player) {
  const coverage = player.coverage || {};
  const missingFields = list(coverage.missingFields);
  const notes = list(coverage.notes);
  const ids = new Set(list(coverage.sources));
  const sourcePool=player.customPlayer?list(library.catalog()?.sources):list(directory.sources);
  const sources = sourcePool.filter(source => !ids.size || ids.has(source.id));
  const fieldLabels = {background:'球员背景',draft:'选秀',teams:'球队',regularSeason:'常规赛',playoffs:'季后赛',awards:'荣誉',eligibility:'入选依据'};
  const missingLabels = {country:'国家 / 地区',college:'学院 / 大学',draft:'选秀记录',birthDate:'出生日期',height:'身高',weight:'体重'};
  const fieldSources = (player.customPlayer?library.catalog()?.meta?.fieldSources:directory.meta?.fieldSources) || {};
  return `<section class="dir-detail-section"><h3>数据覆盖与缺失说明</h3>${notes.length ? `<ul class="dir-notes">${notes.map(note => `<li>${esc(note)}</li>`).join('')}</ul>` : '<p>当前记录未提供额外覆盖说明；表格中的缺失值仍按“—”保留。</p>'}${missingFields.length ? `<p class="dir-detail-caption">未收录字段：${missingFields.map(field => esc(missingLabels[field] || field)).join('、')}。</p>` : ''}</section>
    <section class="dir-detail-section"><h3>数据出处</h3>${Object.keys(fieldSources).length ? `<details class="dir-source-mapping"><summary>各字段的数据加工来源</summary><dl class="dir-facts">${Object.entries(fieldSources).map(([key,value]) => fact(fieldLabels[key] || key,textValue(value))).join('')}</dl></details>` : ''}${sources.length ? `<ul class="dir-sources">${sources.map(source => {
      const url = safeLink(source.url);
      return `<li>${url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(source.title || source.id)} ↗</a>` : esc(source.title || source.id)}${source.note ? `<small>${esc(source.note)}</small>` : ''}${source.accessedAt ? `<small>采集 / 核对日期：${esc(source.accessedAt)}</small>` : ''}</li>`;
    }).join('')}</ul>` : '<p>来源链接尚未收录。</p>'}</section>`;
}

function showPlayer(id) {
  if(document.getElementById('language-dialog')?.open){document.addEventListener('goat:language-ready',()=>showPlayer(id),{once:true});return;}
  const player = players.find(item => item.id === id) || library?.get(id);
  if (!player) return;
  $('player-dialog-title').textContent = displayName(player);
  $('player-dialog-subtitle').textContent = [player.name,seasonRange(player)].filter(Boolean).join(' · ');
  const included=!player.customPlayer || library.has(id);
  $('player-dialog-body').innerHTML = `<div class="dir-detail-lead"><div class="dir-detail-tags">${[player.position,player.era,...poolIds(player).map(pool => `${pool} 池`),player.customPlayer?(included?'用户添加':'扩展库预览'):null].filter(has).map(tag => `<span class="dir-tag">${esc(tag)}</span>`).join('')}</div>${included?`<a class="button primary" href="/?player=${encodeURIComponent(player.id)}">去实验室为他评分 ↗</a>`:`<button id="add-profile-player" class="button primary" type="button">加入我的比较池 ＋</button>`}</div>${!included?'<p class="library-unselected-note">分享链接打开的是档案预览，不会自动修改你的名单。确认资料后，点击加入；该选择会在当前浏览器的两个页面共用。</p>':''}${renderBackground(player)}${renderStats(player)}${renderAwards(player)}${renderEligibility(player)}${renderCoverage(player)}`;
  if(!included)$('add-profile-player').onclick=async()=>{await library.add(id);showPlayer(id);};
  if (!$('player-dialog').open) $('player-dialog').showModal();
  $('player-dialog').scrollTop = 0;
  $('close-player-dialog').focus({preventScroll:true});
  const url = new URL(location.href); url.searchParams.set('player',player.id); history.replaceState(null,'',url);
}

function setupDialog() {
  const dialog = $('player-dialog');
  $('close-player-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click',event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => { const url = new URL(location.href); url.searchParams.delete('player'); history.replaceState(null,'',url); });
}

async function init() {
  try {
    const response = await fetch('/data/player-directory.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    directory = await response.json();
    if (!Array.isArray(directory.players) || !directory.players.length) throw new Error('球员数据为空');
    basePlayers = directory.players.map(decoratePlayer).sort((a,b) => String(a.name).localeCompare(String(b.name),'en'));players=[...basePlayers];
    registerNames(players);
    library=createPlayerLibrary({baseIds:basePlayers.map(p=>p.id),onChange:applySelection,onPreview:p=>showPlayer(p.id)});
    try{await library.initialize();}catch{$('custom-player-summary').textContent='自选档案暂不可用，已保存选择不删除；先显示默认球员，可打开添加窗口重试。';}
    renderMethod(); setupFilters(); setupDialog(); renderList();directoryReady=true;
    $('directory-loading').hidden = true; $('directory-content').hidden = false;
    const selected = new URL(location.href).searchParams.get('player');
    if(selected){if(players.some(p=>p.id===selected))showPlayer(selected);else{try{await library.ensureCatalog();if(library.get(selected))showPlayer(selected);else await library.open({playerId:selected});}catch{await library.open({playerId:selected});}}}
  } catch (error) {
    $('directory-loading').textContent = `球员档案暂时无法载入（${error.message}）。请检查网络连接，稍后刷新重试。`;
    $('directory-loading').setAttribute('role','alert');
  }
}

init();
