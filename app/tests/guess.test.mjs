import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_GUESSES, ATTRIBUTES, shanghaiDate, playersInPool, parseYearFilter, matchesYearFilter, normalizeFilters, filterKey, matchingAppearances, eligiblePlayers, teamsForPool, dailyAnswerId, compareNumber, compareSets, comparePlayers, newRound, restoreRound, submitGuess, shareText } from '../guess-engine.mjs';

const players = Array.from({length:12},(_,index) => ({
  id:`fixture-player-${index}`,name:`Test Player ${index}`,pools:['nba','global'],
  teams:[{id:`NBA:T${index % 3}`,name:`Team ${index % 3}`}],teamsComplete:true,
  positions:[index % 2 ? 'G' : 'F'],birthYear:1980 + index,heightCm:190 + index,
  firstSeasonYear:2000 + index,firstSeasonScope:'NBA/BAA',seasonYears:[2001 + index,2003 + index],
  appearances:[2001 + index,2003 + index].map(season => ({season,teamId:`NBA:T${index % 3}`,league:'NBA',sourceId:'fixture-stats',games:1,evidence:'season-games'})),
  teamCount:index % 3 + 1,playoffAppearances:index,finalsAppearances:index % 5,pointsPerGame:20 + index / 10,mvpCount:index % 4,
  metricCoverage:Object.fromEntries(['teamCount','playoffAppearances','finalsAppearances','pointsPerGame','mvpCount'].map(key => [key,{scope:key === 'mvpCount' ? 'NBA' : 'NBA/BAA',throughSeason:['playoffAppearances','finalsAppearances'].includes(key) ? 2024 : 2026,complete:true}]))
}));
players.push({id:'fixture-cba-only',name:'CBA Sample',pools:['cba','global'],teams:[{id:'CBA:T0',name:'Team 0'}],teamsComplete:false,positions:['C'],birthYear:null,heightCm:null,firstSeasonYear:null});
const opts = (changes = {}) => ({mode:'daily',pool:'nba',date:'2026-10-03',version:'fixture-v1',players,fallbackAnswerId:players[0].id,...changes});
const practice = (answerId = players[0].id,pool = 'nba') => newRound({mode:'practice',pool,date:'2026-10-03',version:'fixture-v1',answerId});

test('Shanghai daily boundary is UTC+8 midnight, independent of host timezone',() => {
  assert.equal(shanghaiDate('2026-10-02T15:59:59.999Z'),'2026-10-02');
  assert.equal(shanghaiDate('2026-10-02T16:00:00.000Z'),'2026-10-03');
  assert.equal(shanghaiDate(new Date('2026-12-31T16:00:00Z')),'2027-01-01');
  assert.throws(() => shanghaiDate('not-a-date'),TypeError);
});

test('daily answer is stable by date, pool, version and independent of input order',() => {
  const a = dailyAnswerId(players,'nba','2026-10-03','fixture-v1');
  assert.equal(a,dailyAnswerId([...players].reverse(),'nba','2026-10-03','fixture-v1'));
  assert.equal(a,dailyAnswerId(players,'nba','2026-10-03','fixture-v1'));
  assert.equal(dailyAnswerId(players,'cba','2026-10-03','fixture-v1'),'fixture-cba-only');
  assert.equal(dailyAnswerId(players,'missing','2026-10-03','fixture-v1'),null);
  assert.equal(playersInPool(players,'nba').length,12);
  assert.equal(playersInPool(players,'global').length,13);
});

test('numeric hints use explicit tolerances and arrows point toward answer',() => {
  assert.deepEqual(compareNumber(200,200,3),{status:'correct',direction:null,note:''});
  assert.equal(compareNumber(197,200,3).status,'close');
  assert.equal(compareNumber(196,200,3).status,'wrong');
  assert.equal(compareNumber(197,200,3).direction,'up');
  assert.equal(compareNumber(203,200,3).direction,'down');
  assert.equal(compareNumber(0,0,3).status,'correct');
});

test('unknown numeric values are never marked wrong and never get an arrow',() => {
  for (const unknown of [null,undefined,NaN,Infinity,'200','']) {
    assert.equal(compareNumber(unknown,200,3).status,'unknown');
    assert.equal(compareNumber(200,unknown,3).direction,null);
  }
});

test('sets compare exact matches and intersection without order or duplicate effects',() => {
  assert.equal(compareSets(['G','F','G'],['F','G']).status,'correct');
  assert.equal(compareSets(['G'],['F','G']).status,'close');
  assert.equal(compareSets(['G'],['C']).status,'wrong');
  assert.equal(compareSets([],['C']).status,'unknown');
  assert.equal(compareSets(null,null).status,'unknown');
});

test('incomplete team history cannot establish equality or disjointness',() => {
  assert.equal(compareSets(['NBA:X'],['NBA:X'],{guessComplete:false}).status,'close');
  assert.equal(compareSets(['NBA:X'],['NBA:Y'],{answerComplete:false}).status,'unknown');
  assert.equal(compareSets(['NBA:X'],['CBA:X']).status,'wrong');
  assert.equal(compareSets(['NBA:X'],['NBA:X','NBA:Y'],{guessComplete:false,answerComplete:false}).status,'close');
});

test('player comparisons expose ten clues and do not compare incompatible debut scopes',() => {
  assert.equal(ATTRIBUTES.length,10);
  const unknownScope = {...players[0],firstSeasonScope:'CBA',firstSeasonYear:2000};
  assert.equal(comparePlayers(players[0],unknownScope).find(cell => cell.key === 'firstSeasonYear').status,'unknown');
  assert.equal(comparePlayers(players[0],{...players[0],firstSeasonScope:null}).find(cell => cell.key === 'firstSeasonYear').direction,null);
  assert.equal(comparePlayers(players[0],players[0]).every(cell => cell.status === 'correct'),true);
});

test('winning requires identity, not all-green attributes',() => {
  const twin = {...players[0],id:'fixture-identical-twin',name:'Distinct Player'};
  const all = [...players,twin];
  assert.equal(comparePlayers(players[0],twin).every(cell => cell.status === 'correct'),true);
  const result = submitGuess(practice(),twin.id,all);
  assert.equal(result.round.status,'playing');
  assert.equal(submitGuess(result.round,players[0].id,all).round.status,'won');
});

test('one correct guess wins even if all answer attributes are unknown',() => {
  const unknown = {...players.at(-1),teams:null,positions:null};
  const result = submitGuess(practice(unknown.id,'cba'),unknown.id,[unknown]);
  assert.equal(result.round.status,'won');
  assert.equal(result.round.guesses.length,1);
});

test('invalid, out-of-pool and duplicate guesses do not consume attempts',() => {
  let round = practice();
  for (const id of ['missing','fixture-cba-only',null,'']) {
    const result = submitGuess(round,id,players);
    assert.ok(result.error); assert.equal(result.round,round); assert.equal(round.guesses.length,0);
  }
  round = submitGuess(round,players[1].id,players).round;
  const duplicate = submitGuess(round,players[1].id,players);
  assert.ok(duplicate.error); assert.equal(duplicate.round.guesses.length,1);
});

test('eight wrong guesses end the round and further guesses are rejected',() => {
  let round = practice();
  for (let index=1;index<=MAX_GUESSES;index++) round = submitGuess(round,players[index].id,players).round;
  assert.equal(round.status,'lost'); assert.equal(round.guesses.length,8);
  const after = submitGuess(round,players[0].id,players);
  assert.ok(after.error); assert.equal(after.round,round);
});

test('won rounds are locked and submissions do not mutate prior state',() => {
  const initial = practice();
  const result = submitGuess(initial,players[0].id,players);
  assert.deepEqual(initial.guesses,[]);
  assert.equal(result.round.status,'won');
  assert.ok(submitGuess(result.round,players[1].id,players).error);
});

test('restore recomputes status and preserves valid guesses without trusting saved status',() => {
  const fresh = restoreRound(null,opts()).round;
  const wrong = players.find(player => player.pools.includes('nba') && player.id !== fresh.answerId);
  const saved = {...fresh,guesses:[wrong.id],status:'won'};
  const restored = restoreRound(saved,opts());
  assert.equal(restored.recovered,false); assert.equal(restored.round.status,'playing');
  assert.deepEqual(restored.round.guesses,[wrong.id]); assert.notEqual(restored.round.guesses,saved.guesses);
});

test('date, pool and data version changes cannot reuse daily progress',() => {
  const saved = restoreRound(null,opts()).round;
  saved.guesses = [players.find(player => player.id !== saved.answerId).id];
  for (const changes of [{date:'2026-10-04'},{pool:'cba'},{version:'fixture-v2'}]) {
    const restored = restoreRound(saved,opts(changes));
    assert.equal(restored.recovered,true); assert.deepEqual(restored.round.guesses,[]);
    assert.equal(restored.round.answerId,dailyAnswerId(players,restored.round.pool,restored.round.date,restored.round.version));
  }
});

test('corrupt localStorage shapes recover without throwing or changing the daily target',() => {
  const fresh = restoreRound(null,opts()).round;
  const wrong = players.find(player => player.id !== fresh.answerId && player.pools.includes('nba')).id;
  const corrupt = [{},[],7,'broken',{...fresh,guesses:null},{...fresh,guesses:[wrong,wrong]}, {...fresh,guesses:['unknown']},{...fresh,guesses:[fresh.answerId,wrong]},{...fresh,answerId:wrong},{...fresh,guesses:Array(9).fill(wrong)}];
  for (const saved of corrupt) {
    const result = restoreRound(saved,opts());
    assert.equal(result.round.answerId,fresh.answerId);
    assert.deepEqual(result.round.guesses,[]);
  }
});

test('practice persists across days but stays isolated by pool and mode',() => {
  const saved = submitGuess(practice(),players[1].id,players).round;
  const restored = restoreRound(saved,opts({mode:'practice',date:'2026-10-04'}));
  assert.equal(restored.recovered,false); assert.deepEqual(restored.round.guesses,[players[1].id]);
  assert.deepEqual(restoreRound(saved,opts({mode:'daily'})).round.guesses,[]);
  assert.deepEqual(restoreRound(saved,opts({mode:'practice',pool:'cba',fallbackAnswerId:'fixture-cba-only'})).round.guesses,[]);
});

test('share results contain colored clues but no player name or ID',() => {
  const round = submitGuess(practice(),players[0].id,players).round;
  const text = shareText(round,players,'NBA');
  assert.match(text,/1\/8/); assert.match(text,/🟩/);
  for (const player of players) { assert.equal(text.includes(player.id),false); assert.equal(text.includes(player.name),false); }
  const partial = submitGuess(practice('fixture-cba-only','global'),players[0].id,players).round;
  assert.match(shareText(partial,players,'全球精选'),/⬜/);
  assert.equal([...text.split('\n').find(line => line.startsWith('🟩'))].length,10);
});

test('five career metrics have independent numeric hints, valid zero, and decimal tolerance',() => {
  const guess = {...players[0],teamCount:2,playoffAppearances:8,finalsAppearances:4,pointsPerGame:28.1,mvpCount:0};
  const answer = {...players[0],teamCount:3,playoffAppearances:10,finalsAppearances:3,pointsPerGame:30.1,mvpCount:0};
  const cells = Object.fromEntries(comparePlayers(guess,answer).map(cell => [cell.key,cell]));
  assert.equal(cells.teamCount.status,'close'); assert.equal(cells.teamCount.direction,'up');
  assert.equal(cells.playoffAppearances.status,'wrong'); assert.equal(cells.playoffAppearances.direction,'up');
  assert.equal(cells.finalsAppearances.status,'close'); assert.equal(cells.finalsAppearances.direction,'down');
  assert.equal(cells.pointsPerGame.status,'close'); assert.equal(cells.pointsPerGame.direction,'up');
  assert.equal(cells.mvpCount.status,'correct'); assert.equal(cells.mvpCount.direction,null);
});

test('career comparisons reject unknown, partial, cross-league, and mismatched snapshots',() => {
  for (const key of ['teamCount','playoffAppearances','finalsAppearances','pointsPerGame','mvpCount']) {
    const variants = [
      {...players[0],[key]:null}, {...players[0],metricCoverage:{}},
      ...[{scope:'CBA'},{complete:false},{throughSeason:2023},{throughSeason:null}].map(change => ({...players[0],metricCoverage:{...players[0].metricCoverage,[key]:{...players[0].metricCoverage[key],...change}}}))
    ];
    for (const other of variants) for (const [guess,answer] of [[players[0],other],[other,players[0]]]) {
      const cell = comparePlayers(guess,answer).find(cell => cell.key === key);
      assert.equal(cell.status,'unknown',key); assert.equal(cell.direction,null,key);
    }
  }
});

test('year filter validates bounds and matches real season-ending years without interpolating gaps',() => {
  const player = {seasonYears:[1985,1993,1995,1998,2002,2003]};
  assert.equal(matchesYearFilter(player,parseYearFilter('1994','1994')),false);
  assert.equal(matchesYearFilter(player,parseYearFilter('1994','1995')),true);
  assert.equal(matchesYearFilter(player,parseYearFilter('2002','')),true);
  assert.equal(matchesYearFilter(player,parseYearFilter('','1984')),false);
  assert.equal(matchesYearFilter({},parseYearFilter('','')),true);
  assert.equal(matchesYearFilter({},parseYearFilter('2000','2026')),false);
  for (const [from,to] of [['2020','2010'],['abc',''],['199.5',''],['1800',''],['','2101'],['2e3','']]) {
    const filter = parseYearFilter(from,to); assert.equal(filter.valid,false); assert.ok(filter.error);
    assert.equal(matchesYearFilter(player,filter),false);
  }
});

test('canonical filters normalize form input and isolate storage keys',() => {
  const filter = normalizeFilters({from:'2005',to:'2007',teamId:' NBA:T0 '});
  assert.deepEqual(filter,{from:2005,to:2007,teamId:'NBA:T0',active:true,valid:true,error:''});
  assert.equal(filterKey(filter),filterKey({teamId:'NBA:T0',to:2007,from:2005}));
  assert.equal(filterKey({}),filterKey({from:'',to:'',teamId:''}));
  assert.notEqual(filterKey({from:2005}),filterKey({to:2005}));
  assert.notEqual(filterKey({teamId:'NBA:T0'}),filterKey({teamId:'CBA:T0'}));
  assert.notEqual(filterKey({teamId:'*'}),filterKey({}));
  for (const value of [null,[],1,'x',{from:'bad'},{from:2026,to:2000},{teamId:7},{teamId:'a\nb'},{valid:false}]) {
    const normalized = normalizeFilters(value);
    assert.equal(normalized.valid,false);
    assert.equal(filterKey(value),'invalid');
    assert.deepEqual(eligiblePlayers(players,'nba',value),[]);
    assert.deepEqual(eligiblePlayers(players,'nba',normalized),[]);
  }
});

const appearance = (season,teamId,league = 'NBA') => ({season,teamId,league,sourceId:'fixture-played-games',games:1,evidence:'season-games'});
const scopePlayers = [
  {id:'gap',name:'Gap Player',pools:['nba','global'],teams:[{id:'NBA:CHI',name:'公牛'},{id:'NBA:WAS',name:'奇才'}],seasonYears:[1993,1994,1995,2002],appearances:[appearance(1993,'NBA:CHI'),appearance(1995,'NBA:CHI'),appearance(2002,'NBA:WAS')]},
  {id:'cross',name:'Cross League',pools:['nba','cba','global'],teams:[{id:'NBA:LAL',name:'湖人'},{id:'CBA:上海',name:'上海'}],appearances:[appearance(2010,'NBA:LAL'),appearance(2015,'CBA:上海','CBA'),appearance(2015,'CBA:上海','CBA')]},
  {id:'baa',name:'BAA Sample',pools:['nba','global'],teams:[{id:'NBA:NYK',name:'尼克斯'}],appearances:[appearance(1949,'NBA:NYK','BAA')]},
  {id:'euro',name:'Euro Sample',pools:['global'],teams:[{id:'EURO:Olympiacos',name:'奥林匹亚科斯'}],appearances:[appearance(2025,'EURO:Olympiacos','EuroLeague')]},
  {id:'unverified',name:'Roster Only',pools:['nba','cba','global'],teams:[{id:'CBA:上海',name:'上海'}],seasonYears:[2026],appearances:[]}
];

test('active answer filters use played appearance evidence, never career spans or roster years',() => {
  assert.deepEqual(eligiblePlayers(scopePlayers,'nba').map(player => player.id),['gap','cross','baa','unverified']);
  assert.deepEqual(eligiblePlayers(scopePlayers,'nba',{from:1994,to:1994}),[]);
  assert.deepEqual(eligiblePlayers(scopePlayers,'nba',{from:1994,to:1995}).map(player => player.id),['gap']);
  assert.deepEqual(eligiblePlayers(scopePlayers,'cba',{from:2026,to:2026}),[]);
  const malformed = [{...scopePlayers[0],appearances:[{season:1994,teamId:'NBA:CHI',league:'NBA'},{...appearance(1994,'NBA:CHI'),season:'1994'},appearance(1994,'NBA:CHI','UNKNOWN')]}];
  assert.deepEqual(eligiblePlayers(malformed,'nba',{from:1994}),[]);
});

test('team and year must match the SAME played appearance, including return and gap seasons',() => {
  assert.deepEqual(eligiblePlayers(scopePlayers,'nba',{from:2002,to:2002,teamId:'NBA:CHI'}),[]);
  assert.deepEqual(eligiblePlayers(scopePlayers,'nba',{from:2002,to:2002,teamId:'NBA:WAS'}).map(player => player.id),['gap']);
  assert.deepEqual(eligiblePlayers(scopePlayers,'nba',{teamId:'NBA:CHI'}).map(player => player.id),['gap']);
  assert.deepEqual(matchingAppearances(scopePlayers[0],'nba',{from:1994,to:1995,teamId:'NBA:CHI'}),[appearance(1995,'NBA:CHI')]);
  assert.deepEqual(matchingAppearances(scopePlayers[0],'cba',{}),[]);
});

test('zero games and unverified roster rows cannot qualify, while dated Euro game performance can',() => {
  const nbaPlayer = {...scopePlayers[0],appearances:[]};
  for (const games of [0,-1,undefined,null,NaN,Infinity,'1']) {
    nbaPlayer.appearances = [{...appearance(1994,'NBA:CHI'),games}];
    assert.deepEqual(eligiblePlayers([nbaPlayer],'nba',{from:1994}),[]);
  }
  nbaPlayer.appearances = [{...appearance(1994,'NBA:CHI'),evidence:'roster'}];
  assert.deepEqual(eligiblePlayers([nbaPlayer],'nba',{from:1994}),[]);
  const euroPlayer = {...scopePlayers[3],appearances:[{season:2025,teamId:'EURO:Olympiacos',league:'EuroLeague',sourceId:'fixture-dated-game',evidence:'dated-performance'}]};
  assert.equal(eligiblePlayers([euroPlayer],'global',{from:2025}).length,1);
  const cbaPerformance = {...scopePlayers[1],appearances:[{season:2015,teamId:'CBA:上海',league:'CBA',sourceId:'fixture-dated-game',evidence:'dated-performance'}]};
  assert.equal(eligiblePlayers([cbaPerformance],'cba',{from:2015}).length,1);
  for (const change of [{games:0},{games:null},{evidence:'roster'},{evidence:undefined}]) {
    const player = {...euroPlayer,appearances:[{...euroPlayer.appearances[0],...change}]};
    assert.deepEqual(eligiblePlayers([player],'global',{from:2025}),[]);
  }
});

test('multi-pool players qualify only from the selected league scope',() => {
  assert.deepEqual(eligiblePlayers(scopePlayers,'nba',{from:2015,to:2015}),[]);
  assert.deepEqual(eligiblePlayers(scopePlayers,'cba',{from:2010,to:2010}),[]);
  assert.deepEqual(eligiblePlayers(scopePlayers,'cba',{from:2015,to:2015}).map(player => player.id),['cross']);
  assert.deepEqual(eligiblePlayers(scopePlayers,'global',{from:2015,to:2015}).map(player => player.id),['cross']);
  assert.deepEqual(eligiblePlayers(scopePlayers,'nba',{from:1949,to:1949}).map(player => player.id),['baa']);
  assert.deepEqual(eligiblePlayers(scopePlayers,'nba',{teamId:'EURO:Olympiacos'}),[]);
  assert.deepEqual(eligiblePlayers(scopePlayers,'global',{teamId:'EURO:Olympiacos'}).map(player => player.id),['euro']);
  assert.deepEqual(eligiblePlayers(scopePlayers,'missing',{from:2000}),[]);
});

test('team options change with pool, count unique players and exclude unverified roster membership',() => {
  assert.deepEqual(teamsForPool(scopePlayers,'cba'),[{id:'CBA:上海',name:'上海',count:1}]);
  assert.equal(teamsForPool(scopePlayers,'nba').length,4);
  assert.equal(teamsForPool(scopePlayers,'global').length,6);
  assert.equal(teamsForPool(scopePlayers,'nba').some(team => team.id.startsWith('CBA:')),false);
  assert.deepEqual(teamsForPool(scopePlayers,'global'),teamsForPool([...scopePlayers].reverse(),'global'));
  assert.deepEqual(teamsForPool([...scopePlayers,scopePlayers[1]],'cba'),teamsForPool(scopePlayers,'cba'));
  assert.deepEqual(teamsForPool(scopePlayers,'missing'),[]);
});

test('daily filtered answers are deterministic, order independent and always inside the selected range',() => {
  const filter = {from:2005,to:2007,teamId:'NBA:T0'};
  const eligible = eligiblePlayers(players,'nba',filter);
  assert.ok(eligible.length > 0 && eligible.length < 12);
  const id = dailyAnswerId(players,'nba','2026-10-03','fixture-v1',filter);
  assert.ok(eligible.some(player => player.id === id));
  assert.equal(id,dailyAnswerId([...players].reverse(),'nba','2026-10-03','fixture-v1',filter));
  assert.equal(id,dailyAnswerId(players,'nba','2026-10-03','fixture-v1',{teamId:'NBA:T0',to:'2007',from:'2005'}));
  for (const invalid of [{from:2100},{teamId:'NBA:MISSING'},{from:2020,to:2000}]) assert.equal(dailyAnswerId(players,'nba','2026-10-03','fixture-v1',invalid),null);
  const allIDs = new Set(players.map(player => player.id));
  assert.equal(allIDs.has(id),true);
  // The range is also part of the seed when two ranges happen to have the same candidates.
  const seeded = date => dailyAnswerId(players,'nba',date,'fixture-v1',{});
  assert.ok(Array.from({length:30},(_,day) => `2026-10-${String(day + 1).padStart(2,'0')}`)
    .some(date => seeded(date) !== dailyAnswerId(players,'nba',date,'fixture-v1',{from:1900})));
});

test('schema 2 rounds store canonical filters and practice fallback never widens the range',() => {
  const filters = {from:'2005',to:'2007',teamId:' NBA:T0 '};
  const round = restoreRound(null,opts({mode:'practice',filters,fallbackAnswerId:'fixture-cba-only'})).round;
  assert.equal(round.schema,2);
  assert.deepEqual(round.filters,{from:2005,to:2007,teamId:'NBA:T0'});
  assert.equal(round.status,'playing');
  assert.ok(eligiblePlayers(players,'nba',filters).some(player => player.id === round.answerId));
  const fresh = newRound({...opts(),filters,answerId:round.answerId});
  assert.deepEqual(fresh.filters,round.filters);
  assert.equal(newRound({...opts(),filters:{from:2000,to:1990},answerId:players[0].id}).status,'empty');
});

test('zero eligible players produces an empty round, not an unrestricted fallback',() => {
  for (const mode of ['daily','practice']) {
    const options = opts({mode,filters:{from:2100,to:2100},fallbackAnswerId:players[0].id});
    const round = restoreRound(null,options).round;
    assert.equal(round.answerId,null); assert.equal(round.status,'empty'); assert.deepEqual(round.guesses,[]);
    const submission = submitGuess(round,players[0].id,players);
    assert.ok(submission.error); assert.equal(submission.round,round);
    assert.equal(restoreRound(round,options).recovered,false);
    assert.match(shareText(round,players,'NBA'),/暂无题目/);
  }
  const corrupt = restoreRound(practice(),opts({mode:'practice',filters:{teamId:7}}));
  assert.equal(corrupt.round.status,'empty'); assert.equal(corrupt.round.answerId,null);
});

test('restoration isolates filters even when both ranges contain the saved answer',() => {
  const base = opts({mode:'practice',filters:{from:2001,to:2014}});
  let saved = restoreRound(null,base).round;
  saved = submitGuess(saved,players[1].id,players).round;
  assert.equal(restoreRound(saved,base).recovered,false);
  for (const filters of [{},{from:2000,to:2014},{from:2001,to:2014,teamId:'NBA:T0'}]) {
    const restored = restoreRound(saved,{...base,filters});
    assert.equal(restored.recovered,true); assert.deepEqual(restored.round.guesses,[]);
    assert.equal(filterKey(restored.round.filters),filterKey(filters));
  }
  for (const altered of [{...saved,schema:1},{...saved,filters:undefined},{...saved,filters:{}},{...saved,filters:{...saved.filters,from:'2001'}},{...saved,filters:{...saved.filters,extra:true}}]) {
    assert.equal(restoreRound(altered,base).recovered,true);
  }
});

test('invalid filtered saved guesses recover safely and submissions cannot bypass applied constraints',() => {
  const options = opts({mode:'practice',filters:{from:2005,to:2007,teamId:'NBA:T0'}});
  const round = restoreRound(null,options).round;
  const excluded = players.find(player => !eligiblePlayers(players,'nba',options.filters).some(candidate => candidate.id === player.id));
  assert.ok(submitGuess(round,excluded.id,players).error);
  assert.equal(round.guesses.length,0);
  const corrupt = restoreRound({...round,guesses:[excluded.id]},options);
  assert.equal(corrupt.recovered,true); assert.deepEqual(corrupt.round.guesses,[]);
  assert.ok(submitGuess({...round,answerId:excluded.id},round.answerId,players).error);
  assert.ok(submitGuess({...round,filters:{from:'invalid',to:null,teamId:''}},round.answerId,players).error);
  assert.ok(submitGuess({...round,guesses:null},round.answerId,players).error);
  assert.ok(submitGuess({...round,guesses:[excluded.id]},round.answerId,players).error);
  assert.equal(submitGuess(round,round.answerId,players).round.status,'won');
});

test('sharing states the applied season and team without revealing the answer identity',() => {
  const round = restoreRound(null,opts({players:scopePlayers,pool:'nba',filters:{from:1993,to:1995,teamId:'NBA:CHI'}})).round;
  const text = shareText(submitGuess(round,round.answerId,scopePlayers).round,scopePlayers,'NBA');
  assert.match(text,/赛季结束年 1993–1995/); assert.match(text,/公牛/); assert.match(text,/1\/8/);
  for (const player of scopePlayers) { assert.equal(text.includes(player.name),false); assert.equal(text.includes(player.id),false); }
  assert.equal(text.includes('NBA:CHI'),false);
});
