// Independently implemented basketball adaptation; no reference-site code is copied.
export const MAX_GUESSES = 8;
export const ATTRIBUTES = [
  {key:'teams',label:'效力球队*'}, {key:'positions',label:'位置'},
  {key:'birthYear',label:'出生年',tolerance:3}, {key:'heightCm',label:'身高 cm',tolerance:3},
  {key:'firstSeasonYear',label:'首赛年*',tolerance:2},
  {key:'teamCount',label:'效力球队数*',tolerance:1,group:'career'},
  {key:'playoffAppearances',label:'季后赛次数*',tolerance:1,group:'career'},
  {key:'finalsAppearances',label:'总决赛次数*',tolerance:1,group:'career'},
  {key:'pointsPerGame',label:'场均得分*',tolerance:2,group:'career'},
  {key:'mvpCount',label:'MVP 次数*',tolerance:1,group:'career'}
];

const finite = value => typeof value === 'number' && Number.isFinite(value);
const unique = values => [...new Set(Array.isArray(values) ? values.filter(value => typeof value === 'string' && value.trim()) : [])].sort();
export function shanghaiDate(now = new Date()) {
  const time = now instanceof Date ? now.getTime() : new Date(now).getTime();
  if (!Number.isFinite(time)) throw new TypeError('Invalid date');
  return new Date(time + 8 * 60 * 60 * 1000).toISOString().slice(0,10);
}

export function playersInPool(players,pool) {
  return players.filter(player => Array.isArray(player.pools) && player.pools.includes(pool));
}

// A season is identified by its ending year, never by an interpolated career range.
export function parseYearFilter(fromValue,toValue) {
  const parse = value => {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const text = String(value).trim();
    return /^\d{4}$/.test(text) && Number(text) >= 1850 && Number(text) <= 2100 ? Number(text) : NaN;
  };
  const from = parse(fromValue),to = parse(toValue);
  const active = from !== null || to !== null;
  const error = Number.isNaN(from) || Number.isNaN(to) ? '请输入 1850–2100 之间的四位年份。'
    : from !== null && to !== null && from > to ? '开始年份不能晚于结束年份。' : '';
  return {from,to,active,valid:!error,error};
}

export function matchesYearFilter(player,filter) {
  if (!filter || !filter.valid) return false;
  if (!filter.active) return true;
  // No interpolation over retirement/gap years, and no unknown-as-current assumption.
  return Array.isArray(player.seasonYears) && player.seasonYears.some(year => Number.isInteger(year)
    && (filter.from === null || year >= filter.from) && (filter.to === null || year <= filter.to));
}

export function normalizeFilters(input = {}) {
  const object = input !== null && typeof input === 'object' && !Array.isArray(input);
  const years = parseYearFilter(object ? input.from : null,object ? input.to : null);
  const teamValue = object ? input.teamId : null;
  const teamId = typeof teamValue === 'string' ? teamValue.trim() : '';
  const error = !object ? '筛选条件格式不正确。' : input.valid === false ? '筛选条件无效，请重新设置。' : years.error
    || (teamValue !== null && teamValue !== undefined && typeof teamValue !== 'string')
      && '请选择有效的球队。'
    || (teamId.length > 120 || /[\u0000-\u001f\u007f]/.test(teamId)) && '请选择有效的球队。' || '';
  return {from:years.from,to:years.to,teamId,active:years.active || !!teamId,valid:!error,error};
}

const canonicalFilters = filters => ({from:Number.isInteger(filters.from) ? filters.from : null,to:Number.isInteger(filters.to) ? filters.to : null,teamId:filters.teamId});

export function filterKey(filters = {}) {
  const normalized = normalizeFilters(filters);
  return normalized.valid ? `years:${normalized.from ?? '*'}:${normalized.to ?? '*'}|team:${encodeURIComponent(normalized.teamId)}` : 'invalid';
}

const leagueInPool = (league,pool) => pool === 'nba' ? ['NBA','BAA'].includes(league)
  : pool === 'cba' ? league === 'CBA' : pool === 'global' && ['NBA','BAA','CBA','EuroLeague'].includes(league);

const hasPlayedEvidence = row => row.evidence === 'season-games' ? finite(row.games) && row.games > 0
  : row.evidence === 'dated-performance' && (row.games === undefined || finite(row.games) && row.games > 0);

export function matchingAppearances(player,pool,filters = {}) {
  const normalized = normalizeFilters(filters);
  if (!normalized.valid || !player.pools?.includes(pool) || !Array.isArray(player.appearances)) return [];
  return player.appearances.filter(row => row && Number.isInteger(row.season) && row.season >= 1850 && row.season <= 2100
    && leagueInPool(row.league,pool) && typeof row.teamId === 'string' && !!row.teamId.trim()
    && typeof row.sourceId === 'string' && !!row.sourceId.trim() && hasPlayedEvidence(row)
    && (normalized.from === null || row.season >= normalized.from)
    && (normalized.to === null || row.season <= normalized.to)
    && (!normalized.teamId || row.teamId === normalized.teamId));
}

export function eligiblePlayers(players,pool,filters = {}) {
  const normalized = normalizeFilters(filters);
  if (!normalized.valid) return [];
  return playersInPool(players,pool).filter(player => !normalized.active || matchingAppearances(player,pool,normalized).length > 0);
}

export function teamsForPool(players,pool) {
  const teams = new Map();
  for (const player of playersInPool(players,pool)) {
    for (const row of matchingAppearances(player,pool)) {
      const name = player.teams?.find(team => team.id === row.teamId)?.name || row.teamId;
      if (!teams.has(row.teamId)) teams.set(row.teamId,{id:row.teamId,name,players:new Set()});
      const team = teams.get(row.teamId);
      // Stable metadata even when input player order changes.
      if (name.localeCompare(team.name,'zh-CN') < 0) team.name = name;
      team.players.add(player.id);
    }
  }
  return [...teams.values()].map(team => ({id:team.id,name:team.name,count:team.players.size}))
    .sort((a,b) => a.name.localeCompare(b.name,'zh-CN') || a.id.localeCompare(b.id));
}

export function dailyAnswerId(players,pool,date,version,filters = {}) {
  const candidates = [...new Set(eligiblePlayers(players,pool,filters).map(player => player.id))].sort();
  if (!candidates.length) return null;
  let hash = 2166136261;
  for (const char of String(version) + '|' + pool + '|' + date + '|' + filterKey(filters)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash,16777619) >>> 0; }
  return candidates[hash % candidates.length];
}

export function compareNumber(guess,answer,tolerance) {
  if (!finite(guess) || !finite(answer)) return {status:'unknown',direction:null,note:'缺少可核实数据'};
  const delta = answer - guess;
  return {status:Math.abs(delta) < 0.00001 ? 'correct' : Math.abs(delta) <= tolerance + 0.00001 ? 'close' : 'wrong',direction:Math.abs(delta) < 0.00001 ? null : delta > 0 ? 'up' : 'down',note:''};
}

export function compareSets(guess,answer,{guessComplete = true,answerComplete = true} = {}) {
  const g = unique(guess), a = unique(answer);
  if (!g.length || !a.length) return {status:'unknown',direction:null,note:'缺少可核实数据'};
  const intersection = g.filter(value => a.includes(value));
  if (guessComplete && answerComplete && g.length === a.length && intersection.length === a.length) return {status:'correct',direction:null,note:'集合完全一致'};
  if (intersection.length) return {status:'close',direction:null,note:'有重合记录'};
  if (!guessComplete || !answerComplete) return {status:'unknown',direction:null,note:'记录不完整，不能排除'};
  return {status:'wrong',direction:null,note:'无重合记录'};
}

function compareCareerMetric(guess,answer,attribute) {
  const g = guess.metricCoverage?.[attribute.key],a = answer.metricCoverage?.[attribute.key];
  const unknown = note => ({status:'unknown',direction:null,note});
  if (!finite(guess[attribute.key]) || !finite(answer[attribute.key])) return unknown('缺少可核实的同口径生涯数据');
  if (!g?.scope || !a?.scope || g.scope !== a.scope) return unknown('联赛统计口径不同或未注明');
  if (g.complete !== true || a.complete !== true) return unknown('统计覆盖不完整，不能准确比较');
  if (!Number.isInteger(g.throughSeason) || g.throughSeason !== a.throughSeason) return unknown('统计截止赛季不同或未注明');
  const compared = compareNumber(guess[attribute.key],answer[attribute.key],attribute.tolerance);
  return {...compared,note:`${g.scope} · 截至 ${g.throughSeason - 1}–${String(g.throughSeason).slice(-2)} 赛季`};
}

export function comparePlayers(guess,answer) {
  return ATTRIBUTES.map(attribute => {
    let comparison;
    if (attribute.key === 'teams') comparison = compareSets(guess.teams?.map(team => team.id),answer.teams?.map(team => team.id),{guessComplete:guess.teamsComplete === true,answerComplete:answer.teamsComplete === true});
    else if (attribute.key === 'positions') comparison = compareSets(guess.positions,answer.positions);
    else if (attribute.key === 'firstSeasonYear' && (!guess.firstSeasonScope || !answer.firstSeasonScope || guess.firstSeasonScope !== answer.firstSeasonScope)) comparison = {status:'unknown',direction:null,note:'首赛年口径不同或未注明'};
    else if (attribute.group === 'career') comparison = compareCareerMetric(guess,answer,attribute);
    else comparison = compareNumber(guess[attribute.key],answer[attribute.key],attribute.tolerance);
    return {...attribute,...comparison};
  });
}

export function roundStatus(guesses,answerId) {
  if (!answerId) return 'empty';
  if (guesses.includes(answerId)) return 'won';
  return guesses.length >= MAX_GUESSES ? 'lost' : 'playing';
}

export function newRound({mode,pool,date,version,answerId,filters = {}}) {
  const normalized = normalizeFilters(filters);
  const selectedAnswer = normalized.valid && typeof answerId === 'string' && answerId ? answerId : null;
  return {schema:2,mode,pool,date,version,filters:canonicalFilters(normalized),answerId:selectedAnswer,guesses:[],status:selectedAnswer ? 'playing' : 'empty'};
}

function validStoredFilters(filters) {
  return filters !== null && typeof filters === 'object' && !Array.isArray(filters)
    && ['from','to','teamId'].every(key => Object.hasOwn(filters,key))
    && Object.keys(filters).length === 3 && normalizeFilters(filters).valid
    && (filters.from === null || Number.isInteger(filters.from))
    && (filters.to === null || Number.isInteger(filters.to)) && typeof filters.teamId === 'string';
}

function validGuesses(guesses,candidates,answerId) {
  return Array.isArray(guesses) && guesses.length <= MAX_GUESSES && new Set(guesses).size === guesses.length
    && guesses.every(id => typeof id === 'string' && candidates.has(id))
    && (!guesses.includes(answerId) || guesses.at(-1) === answerId);
}

export function restoreRound(saved,{mode,pool,date,version,players,fallbackAnswerId,filters = {}}) {
  const normalized = normalizeFilters(filters);
  const candidates = new Set(eligiblePlayers(players,pool,normalized).map(player => player.id));
  const envelope = normalized.valid && saved?.schema === 2 && saved.mode === mode && saved.pool === pool && saved.version === version
    && (mode !== 'daily' || saved.date === date) && validStoredFilters(saved.filters) && filterKey(saved.filters) === filterKey(normalized);
  const answerId = mode === 'daily' ? dailyAnswerId(players,pool,date,version,normalized)
    : envelope && candidates.has(saved.answerId) ? saved.answerId
      : candidates.has(fallbackAnswerId) ? fallbackAnswerId : [...candidates].sort()[0] ?? null;
  const fresh = newRound({mode,pool,date,version,answerId,filters:normalized});
  if (saved === null || saved === undefined) return {round:fresh,recovered:false};
  const valid = envelope && saved.answerId === answerId && (candidates.has(answerId) || answerId === null && !candidates.size)
    && validGuesses(saved.guesses,candidates,answerId);
  if (!valid) return {round:fresh,recovered:true};
  return {round:{...fresh,guesses:[...saved.guesses],status:roundStatus(saved.guesses,answerId)},recovered:false};
}

export function submitGuess(round,id,players) {
  if (round.status === 'empty') return {round,error:'当前范围没有已核实的可出题球员，请调整筛选条件。'};
  if (round.status !== 'playing') return {round,error:'本局已结束，请查看战绩。'};
  if (round.schema !== 2 || !validStoredFilters(round.filters)) return {round,error:'本局筛选记录无效，请重新开始。'};
  const candidates = new Set(eligiblePlayers(players,round.pool,round.filters).map(player => player.id));
  if (!candidates.has(round.answerId) || !validGuesses(round.guesses,candidates,round.answerId)
    || round.guesses.length >= MAX_GUESSES || round.guesses.includes(round.answerId)) return {round,error:'本局记录无效，请重新开始。'};
  if (!candidates.has(id)) return {round,error:'请选择符合当前赛季和球队范围的有效球员。'};
  if (round.guesses.includes(id)) return {round,error:'已经猜过这位球员，不会扣除次数。'};
  const guesses = [...round.guesses,id];
  return {round:{...round,guesses,status:roundStatus(guesses,round.answerId)},error:null};
}

export function shareText(round,players,poolName) {
  const answer = players.find(player => player.id === round.answerId);
  const cells = {correct:'🟩',close:'🟨',wrong:'⬛',unknown:'⬜'};
  const lines = round.guesses.map(id => {
    const guessed = players.find(player => player.id === id);
    return guessed && answer ? comparePlayers(guessed,answer).map(cell => cells[cell.status]).join('') : '⬜'.repeat(ATTRIBUTES.length);
  });
  const filters = normalizeFilters(round.filters);
  const years = filters.from === null && filters.to === null ? '全部赛季'
    : filters.from === filters.to ? `赛季结束年 ${filters.from}`
      : `赛季结束年 ${filters.from ?? '不限'}–${filters.to ?? '不限'}`;
  const team = filters.teamId ? teamsForPool(players,round.pool).find(item => item.id === filters.teamId)?.name || '指定球队' : '全部球队';
  const result = round.status === 'empty' ? '—' : round.status === 'lost' ? 'X' : round.guesses.length;
  return ['TRUE GOAT · 猜球员',poolName + ' · ' + (round.mode === 'daily' ? '每日 ' + round.date + ' (UTC+8)' : '自由练习'),`范围：${years} · ${team}`,result + '/' + MAX_GUESSES + (round.status === 'empty' ? ' · 暂无题目' : round.status === 'playing' ? ' · 进行中' : round.status === 'won' ? ' · 猜中了' : ' · 本局结束'),...lines,'🟩 一致  🟨 接近/重合  ⬛ 不同  ⬜ 未知'].join('\n');
}
