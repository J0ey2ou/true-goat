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

// Search filters deliberately do not participate in answer selection or saved rounds.
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

export function dailyAnswerId(players,pool,date,version) {
  const candidates = playersInPool(players,pool).map(player => player.id).sort();
  if (!candidates.length) return null;
  let hash = 2166136261;
  for (const char of String(version) + '|' + pool + '|' + date) { hash ^= char.charCodeAt(0); hash = Math.imul(hash,16777619) >>> 0; }
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
  if (guesses.includes(answerId)) return 'won';
  return guesses.length >= MAX_GUESSES ? 'lost' : 'playing';
}

export function newRound({mode,pool,date,version,answerId}) {
  return {schema:1,mode,pool,date,version,answerId,guesses:[],status:'playing'};
}

export function restoreRound(saved,{mode,pool,date,version,players,fallbackAnswerId}) {
  const candidates = new Set(playersInPool(players,pool).map(player => player.id));
  const answerId = mode === 'daily' ? dailyAnswerId(players,pool,date,version) : candidates.has(saved?.answerId) ? saved.answerId : fallbackAnswerId;
  const fresh = newRound({mode,pool,date,version,answerId});
  if (!saved) return {round:fresh,recovered:false};
  const valid = saved && saved.schema === 1 && saved.mode === mode && saved.pool === pool && saved.version === version
    && (mode !== 'daily' || saved.date === date) && saved.answerId === answerId && candidates.has(answerId)
    && Array.isArray(saved.guesses) && saved.guesses.length <= MAX_GUESSES && new Set(saved.guesses).size === saved.guesses.length
    && saved.guesses.every(id => typeof id === 'string' && candidates.has(id))
    && (!saved.guesses.includes(answerId) || saved.guesses.at(-1) === answerId);
  if (!valid) return {round:fresh,recovered:true};
  return {round:{...fresh,guesses:[...saved.guesses],status:roundStatus(saved.guesses,answerId)},recovered:false};
}

export function submitGuess(round,id,players) {
  if (round.status !== 'playing') return {round,error:'本局已结束，请查看战绩。'};
  if (!playersInPool(players,round.pool).some(player => player.id === id)) return {round,error:'请选择当前球员池中的有效球员。'};
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
  const result = round.status === 'lost' ? 'X' : round.guesses.length;
  return ['TRUE GOAT · 猜球员',poolName + ' · ' + (round.mode === 'daily' ? '每日 ' + round.date + ' (UTC+8)' : '自由练习'),result + '/' + MAX_GUESSES + (round.status === 'playing' ? ' · 进行中' : round.status === 'won' ? ' · 猜中了' : ' · 本局结束'),...lines,'🟩 一致  🟨 接近/重合  ⬛ 不同  ⬜ 未知'].join('\n');
}
