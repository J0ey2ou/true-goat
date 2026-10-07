import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { comparePlayers, matchesYearFilter, parseYearFilter } from '../guess-engine.mjs';
import { searchPlayers } from '../player-search.mjs';

const data = JSON.parse(await readFile(new URL('../data/guess-players.json',import.meta.url),'utf8'));
const metrics = ['teamCount','playoffAppearances','finalsAppearances','pointsPerGame','mvpCount'];
const byId = id => data.players.find(player => player.id === id);

test('expanded game data preserves unique identities and stated pool sizes',() => {
  assert.equal(data.version,'2.1');
  assert.equal(new Set(data.players.map(player => player.id)).size,data.players.length);
  for (const pool of data.pools) assert.equal(pool.count,data.players.filter(player => player.pools.includes(pool.id)).length);
  assert.ok(data.players.filter(player => player.pools.includes('nba-history')).length>=5000);
  assert.equal(data.pools.length,7);
  assert.equal(data.players.filter(player => player.id === 'mingya01').length,1);
});

test('every published career metric has a comparable coverage window and linked sources',() => {
  const sourceIds = new Set(data.sources.map(source => source.id));
  for (const player of data.players) for (const key of metrics) {
    const coverage = player.metricCoverage[key],value = player[key];
    assert.ok(coverage && typeof coverage.note === 'string',`${player.id} ${key} coverage`);
    if (value === null) continue;
    assert.equal(typeof value,'number'); assert.ok(Number.isFinite(value) && value >= 0);
    if (key !== 'pointsPerGame') assert.ok(Number.isInteger(value));
    assert.equal(coverage.complete,true,`${player.id} ${key} partial facts must not masquerade as full totals`);
    assert.ok(coverage.scope); assert.ok(Number.isInteger(coverage.throughSeason));
    assert.ok(player.fieldSources[key]?.length,`${player.id} ${key} provenance`);
    assert.ok(player.fieldSources[key].every(id => sourceIds.has(id)),`${player.id} ${key} source IDs`);
  }
});

test('Jordan career facts and Harden naming regression match the shared game schema',() => {
  const jordan = byId('jordami01'),harden = byId('hardeja01');
  assert.equal(jordan.teamCount,2); assert.equal(jordan.playoffAppearances,13);
  assert.equal(jordan.finalsAppearances,6); assert.equal(jordan.pointsPerGame,30.1); assert.equal(jordan.mvpCount,5);
  assert.equal(harden.finalsAppearances,1); assert.equal(harden.mvpCount,1);
  for (const term of ['哈登','大胡子','James Harden','jame harden']) assert.equal(searchPlayers(data.players,term)[0]?.id,harden.id,term);
  assert.equal(searchPlayers(data.players,'泡椒')[0]?.id,'georgpa01');
  assert.equal(searchPlayers(data.players,'CP3')[0]?.id,'paulch01');
});

test('observed season filtering preserves gaps and never fills unknown careers',() => {
  const jordan = byId('jordami01');
  for (const player of data.players) {
    assert.ok(Array.isArray(player.seasonYears));
    assert.equal(new Set(player.seasonYears).size,player.seasonYears.length);
    assert.ok(player.seasonYears.every(year => Number.isInteger(year) && year >= 1947 && year <= 2026));
  }
  assert.equal(matchesYearFilter(jordan,parseYearFilter('1994','1994')),false);
  assert.equal(matchesYearFilter(jordan,parseYearFilter('1995','1995')),true);
  assert.equal(matchesYearFilter(jordan,parseYearFilter('2004','2026')),false);
});

test('zero MVP differs from missing data; foreign unverified metrics never generate arrows',() => {
  const west = byId('westje01');
  assert.equal(west.mvpCount,0);
  assert.equal(comparePlayers(west,west).find(cell => cell.key === 'mvpCount').status,'correct');
  for (const player of data.players.filter(player => !player.pools.includes('nba-history'))) {
    for (const cell of comparePlayers(player,byId('jordami01')).filter(cell => cell.group === 'career')) {
      const coverage=player.metricCoverage[cell.key];
      if(!coverage.complete || !['NBA','NBA/BAA'].includes(coverage.scope)) {
        assert.equal(cell.status,'unknown'); assert.equal(cell.direction,null);
      }
    }
  }
});
