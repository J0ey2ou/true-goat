/** Global discovery is independent of model eligibility; unavailable facts stay null. */
export const leagueLabels = Object.freeze({NBA:'NBA / BAA',CBA:'CBA',EuroLeague:'EuroLeague'});
export const coverageLabels = Object.freeze({complete:'七维完整',partial:'部分评分数据',profile:'仅基础档案'});
const list = value => Array.isArray(value) ? value : [];
const unique = values => [...new Set(values.filter(value=>value!==null&&value!==undefined&&value!==''))];
const present = value => value !== null && value !== undefined && value !== '';
const DIMENSIONS = ['regular_season','peak','longevity','playoffs','awards','defense','team_success'];
export const validPlayerId = id => typeof id === 'string' && /^[\p{L}\p{N}_·-]{1,120}$/u.test(id);
export function playerLeagues(player) {
  if(Array.isArray(player.leagues))return player.leagues;
  const values=[...list(player.teams).map(team=>team.id?.split(':')[0]),...list(player.appearances).map(row=>row.league),...list(player.pools).map(pool=>pool.startsWith('nba-')?'NBA':pool.startsWith('cba-')?'CBA':null)];
  return unique(values.map(league=>league==='EURO'?'EuroLeague':league==='BAA'?'NBA':league)).filter(league=>Object.hasOwn(leagueLabels,league));
}
export function playerCoverage(player) {
  if (player.dataCoverage) return player.dataCoverage;
  const components=player.model?.components || player.components || {};
  const count=DIMENSIONS.filter(key=>Number.isFinite(components[key+'_score'])).length;
  return count===7?'complete':count||Object.values(player.careerRS||{}).some(Number.isFinite)?'partial':'profile';
}
const season = year => Number.isInteger(year) ? `${year-1}–${String(year).slice(-2)}` : null;

/** A small, reproducible discovery supplement; no guessed translations or scores. */
export function buildGlobalIndex(payload) {
  return {version:'1.0',dataAsOf:payload.dataAsOf,meta:{snapshotDate:payload.meta?.snapshotDate,scope:'NBA / BAA · CBA · EuroLeague',note:'已收录 NBA / BAA、CBA 与 EuroLeague 档案；不是全球全部篮球运动员。跨联赛仅按已核实身份映射合并，未核实身份保留独立。不同联赛的统计口径与覆盖不相同，缺失资料不评分。'},identityRedirects:payload.identityRedirects||{},sources:list(payload.sources),players:list(payload.players).map(player=>{
    const verifiedYears=unique(list(player.seasonYears)).sort((a,b)=>a-b);
    const leagues=playerLeagues(player);
    if(leagues.includes('NBA'))return {id:player.id,directoryId:player.directoryId,name:player.name,chineseName:player.chineseName,aliases:unique(list(player.aliases)),leagues,position:list(player.positions).join('-'),background:{birthYear:player.birthYear,heightCm:player.heightCm,country:player.country},teams:list(player.teams).filter(team=>!team.id?.startsWith('NBA:')),coverage:{sources:unique([...list(player.sourceIds).filter(id=>!id.startsWith('nba-')&&!id.startsWith('espn-')),...['birthYear','heightCm','country','positions'].flatMap(key=>list(player.fieldSources?.[key]))]),notes:[]}};
    const rs={},awards={};
    if(Number.isFinite(player.pointsPerGame)&&player.metricCoverage?.pointsPerGame?.coversRecordedCareer===true)rs.ppg=player.pointsPerGame;
    if(Number.isFinite(player.mvpCount)&&player.metricCoverage?.mvpCount?.coversRecordedCareer===true)awards.mvp=player.mvpCount;
    return {id:player.id,directoryId:player.directoryId,name:player.name,chineseName:player.chineseName,aliases:unique(list(player.aliases)),leagues,position:list(player.positions).join('-'),era:verifiedYears.length?Math.floor(verifiedYears.at(-1)/10)*10+'s':null,firstSeason:season(verifiedYears[0]),lastSeason:season(verifiedYears.at(-1)),seasons:verifiedYears.length||null,teams:list(player.teams),background:{birthYear:player.birthYear,heightCm:player.heightCm,country:player.country},careerRS:rs,awards,statScope:player.metricScope?.pointsPerGame||null,coverage:{sources:list(player.sourceIds),notes:list(player.notes),regularSeasonThrough:player.metricCoverage?.pointsPerGame?.throughSeason||null},asOf:player.asOf};
  })};
}

function mergeTeams(primary, secondary) {
  const teams=new Map();
  for(const team of [...list(primary),...list(secondary)]) {
    const key=team.id || 'NBA:'+(team.code||team.abbreviation||team.name);
    if(!teams.has(key))teams.set(key,{...team,code:team.code||team.id?.split(':').slice(1).join(':'),abbreviation:team.abbreviation||team.code});
  }
  return [...teams.values()];
}
export function mergeGlobalCatalog(nba, supplement) {
  const records=new Map(list(nba.players).map(player=>[player.id,{...player,leagues:['NBA'],statScope:'NBA / BAA'}]));
  const redirects=supplement.identityRedirects||{};
  for(const player of list(supplement.players)) {
    const id=redirects[player.id]||player.directoryId||player.id;
    if(!validPlayerId(id))continue;
    const existing=records.get(id);
    if(!existing){records.set(id,{...player,id});continue;}
    const background={...existing.background};
    for(const [key,value] of Object.entries(player.background||{}))if(!present(background[key])&&present(value))background[key]=value;
    records.set(id,{...existing,chineseName:existing.chineseName||player.chineseName,englishName:existing.englishName||player.englishName,position:existing.position||player.position,aliases:unique([...list(existing.aliases),...list(player.aliases)]),leagues:unique([...existing.leagues,...player.leagues]),teams:mergeTeams(existing.teams,player.teams),background,coverage:{...existing.coverage,sources:unique([...list(existing.coverage?.sources),...list(player.coverage?.sources)]),notes:unique([...list(existing.coverage?.notes),...list(player.coverage?.notes)])}});
  }
  const players=[...records.values()].map(player=>({...player,dataCoverage:playerCoverage(player)}));
  const sources=new Map([...list(nba.sources),...list(supplement.sources)].map(source=>[source.id,source]));
  const leagues=Object.fromEntries(Object.keys(leagueLabels).map(league=>[league,players.filter(player=>player.leagues.includes(league)).length]));
  const coverage=Object.fromEntries(Object.keys(coverageLabels).map(status=>[status,players.filter(player=>player.dataCoverage===status).length]));
  return {players,sources:[...sources.values()],identityRedirects:redirects,meta:{...nba.meta,...supplement.meta,playerCount:players.length,total:players.length,leagues,coverage,snapshotDate:supplement.meta?.snapshotDate}};
}
