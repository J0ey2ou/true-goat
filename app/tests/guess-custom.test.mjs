import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {ATTRIBUTES,ALL_ATTRIBUTES,selectedAttributes,comparePlayers} from '../guess-engine.mjs';
import {opponentProgress,tier} from '../online.mjs';
const data=JSON.parse(await readFile(new URL('../data/guess-players.json',import.meta.url),'utf8'));
const extra=JSON.parse(await readFile(new URL('../data/guess-extra-metrics.json',import.meta.url),'utf8'));
test('default clues stay exactly ten; custom clues accept only known keys',()=>{
 assert.equal(ATTRIBUTES.length,10);assert.equal(ALL_ATTRIBUTES.length,18);
 assert.deepEqual(selectedAttributes(['assistsPerGame','fake']).map(a=>a.key),['assistsPerGame']);
 assert.deepEqual(selectedAttributes([]),ATTRIBUTES);
});
test('extra facts expose real averages and observed zero with matching coverage',()=>{
 assert.equal(extra.version,data.version);const jordan=extra.players.jordami01;
 assert.equal(jordan.championshipCount,6);assert.equal(jordan.dpoyCount,1);assert.equal(jordan.assistsPerGame,5.3);
 const p={...data.players.find(p=>p.id==='jordami01'),...jordan};
 for(const [k,d]of Object.entries(extra.definitions))p.metricCoverage[k]={...d,complete:jordan.completeFields.includes(k)};
 assert.ok(comparePlayers(p,p,['championshipCount','dpoyCount','assistsPerGame']).every(c=>c.status==='correct'));
 assert.equal(comparePlayers({metricCoverage:{}},{metricCoverage:{}},['assistsPerGame'])[0].status,'unknown');
});
test('postseason data reaches 2026 using actual game participants',()=>{
 assert.equal(data.meta.postseasonThrough,2026);
 const w=data.players.find(p=>p.id==='wembavi01');assert.ok(w);
 assert.ok(w.playoffSeasonYears.includes(2026));assert.ok(w.finalsSeasonYears.includes(2026));
 for(const p of data.players.filter(p=>p.pools.includes('nba-history')))for(const k of ['playoffAppearances','finalsAppearances'])if(p[k]!==null)assert.equal(p.metricCoverage[k].throughSeason,2026);
});
test('opponent view exposes color progress and rating tiers are deterministic',()=>{
 const view=opponentProgress({host_id:'a',guest_id:'b',host_name:'A',guest_name:'B',host_attempts:1,guest_attempts:2,host_state:'playing',guest_state:'playing',guest_tiles:[['close']]},'a');
 assert.equal(view.name,'B');assert.equal(view.attempts,2);assert.ok(!Object.hasOwn(view,'guesses'));
 assert.equal(tier(1000),'白银');assert.equal(tier(1800),'大师');
});
