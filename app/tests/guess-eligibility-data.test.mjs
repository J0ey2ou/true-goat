import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const data = JSON.parse(await readFile(new URL('../data/guess-players.json',import.meta.url),'utf8'));
const evidence = JSON.parse(await readFile(new URL('../../config/guess-appearance-evidence.json',import.meta.url),'utf8'));
const resolvedId = id => data.identityRedirects?.[id] || id;
const player = id => data.players.find(item => item.id === resolvedId(id));
const played = (id,season,teamId) => player(id).appearances.some(item => item.season === season && item.teamId === teamId);

test('every eligibility record pairs an actual season and team with cited positive evidence',() => {
  const sources = new Set(data.sources.map(item => item.id));
  assert.equal(data.version,'2.1');
  for (const item of data.players) {
    assert.ok(Array.isArray(item.appearances),item.id);
    assert.equal(item.appearanceCoverage.verifiedOnly,true,item.id);
    const keys = new Set();
    for (const appearance of item.appearances) {
      const key = `${appearance.league}/${appearance.season}/${appearance.teamId}`;
      assert.ok(!keys.has(key),`${item.id}: duplicate ${key}`); keys.add(key);
      assert.ok(Number.isInteger(appearance.season) && appearance.season >= 1947 && appearance.season <= 2026);
      assert.ok(['NBA','BAA','CBA','EuroLeague'].includes(appearance.league));
      assert.ok(sources.has(appearance.sourceId),`${item.id}: linked evidence`);
      assert.ok(item.fieldSources.appearances.includes(appearance.sourceId));
      assert.ok(item.teams.some(team => team.id === appearance.teamId),`${item.id}: team must be displayable`);
      assert.ok(['season-games','dated-performance'].includes(appearance.evidence));
      if (appearance.evidence === 'season-games') assert.ok(Number.isFinite(appearance.games) && appearance.games > 0);
      if (appearance.games !== undefined) assert.ok(Number.isFinite(appearance.games) && appearance.games > 0);
      assert.ok(!/(?:TOT|\d+TM)$/.test(appearance.teamId),'aggregate rows are not a team');
    }
  }
});

test('NBA playing seasons have actual team evidence, including retirement gaps and traded stints',() => {
  for (const item of data.players.filter(item => item.pools.includes('nba-history'))) {
    assert.deepEqual([...new Set(item.appearances.filter(row => ['NBA','BAA'].includes(row.league)).map(row => row.season))].sort((a,b) => a-b),item.seasonYears,item.id);
  }
  assert.equal(played('jordami01',1994,'NBA:CHI'),false);
  assert.equal(played('jordami01',1995,'NBA:CHI'),true);
  assert.equal(played('jordami01',2003,'NBA:WAS'),true);
  assert.equal(played('jordami01',2003,'NBA:CHI'),false);
  assert.equal(played('jamesle01',2016,'NBA:CLE'),true);
  assert.equal(played('jamesle01',2016,'NBA:LAL'),false);
  assert.equal(played('jamesle01',2020,'NBA:LAL'),true);
  assert.equal(played('hardeja01',2021,'NBA:HOU'),true);
  assert.equal(played('hardeja01',2021,'NBA:BRK'),true);
});

test('CBA evidence comes from positive historical games, not the misleading current header',() => {
  assert.equal(played('cba-sina-7047',2019,'CBA:广东'),true);
  assert.equal(played('cba-sina-7047',2026,'CBA:广东'),false);
  assert.equal(played('cba-sina-7110',2024,'CBA:辽宁'),true);
  assert.equal(played('cba-sina-7110',2024,'CBA:上海'),false);
  assert.equal(played('cba-sina-310',2023,'CBA:深圳'),true);
  assert.equal(played('cba-sina-310',2023,'CBA:广东'),false);
  for (const id of Object.keys(evidence.players).filter(id => id.startsWith('cba-'))) {
    const item=player(id);
    assert.ok(item.appearances.length > 0,item.id);
    assert.equal(item.appearanceCoverage.complete,false);
    assert.ok(item.appearances.filter(row => row.league === 'CBA').every(row => row.games > 0));
    for(const prior of evidence.players[id]) assert.ok(item.appearances.some(row=>row.season===prior.season && row.teamId===prior.teamId && row.league===prior.league));
    const scope=item.pools.includes('nba-history') ? item.appearances.filter(row => ['NBA','BAA'].includes(row.league)) : item.appearances;
    assert.deepEqual(item.seasonYears,[...new Set(scope.map(row => row.season))].sort((a,b) => a-b));
  }
});

test('Yao has a separately sourced CBA season and is not eligible there from NBA seasons',() => {
  assert.equal(played('mingya01',2002,'CBA:上海'),true);
  assert.equal(played('mingya01',2005,'CBA:上海'),false);
  assert.equal(played('mingya01',2005,'NBA:HOU'),true);
  for(const prior of evidence.players.mingya01) assert.ok(player('mingya01').appearances.some(row=>row.season===prior.season && row.teamId===prior.teamId));
});

test('EuroLeague roster dates never stand in for played seasons, including an injured player',() => {
  assert.equal(played('euro-donta-hall',2025,'EURO:Baskonia'),true);
  assert.equal(played('euro-donta-hall',2025,'EURO:Olympiacos'),false);
  assert.equal(played('euro-markus-howard',2024,'EURO:Baskonia'),true);
  assert.deepEqual(player('euro-keenan-evans').appearances.filter(row=>row.league==='EuroLeague'),[]);
  for (const id of Object.keys(evidence.players).filter(id=>id.startsWith('euro-'))) {
    const item=player(id), european=item.appearances.filter(row=>row.league==='EuroLeague');
    assert.equal(item.appearanceCoverage.complete,false);
    assert.deepEqual(european,evidence.players[id] || []);
    assert.ok(european.every(row => row.sourceId !== 'euro-2025-round1'));
    assert.ok(!european.some(row=>row.season===2026),'2025-26 roster does not prove a 2026 appearance');
  }
});

test('published evidence counts expose rather than hide incomplete international coverage',() => {
  assert.equal(data.meta.appearanceCoverage.verifiedPlayers,data.players.filter(item => item.appearances.length).length);
  assert.equal(data.meta.appearanceCoverage.records,data.players.reduce((sum,item) => sum + item.appearances.length,0));
  assert.ok(data.players.some(item => !item.appearances.length));
  assert.match(data.meta.yearFilterNote,/同一条实际出场/);
});
