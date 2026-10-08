import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {buildGlobalIndex,mergeGlobalCatalog,validPlayerId,playerCoverage} from '../global-catalog.mjs';
import {normalizeCatalog,sanitizeSelectedIds} from '../player-library.mjs';
import {rankPlayers} from '../model.mjs';
const read=name=>JSON.parse(readFileSync(new URL('../data/'+name+'.json',import.meta.url),'utf8'));
const nba=read('player-catalog'),index=read('global-player-index');
const merged=normalizeCatalog(mergeGlobalCatalog(nba,index));
test('global catalog includes every verified source identity and league without a 300-player gate',()=>{
  const original=read('guess-players');
  assert.equal(merged.players.length,original.players.length);
  assert.equal(new Set(merged.players.map(player=>player.id)).size,merged.players.length);
  for(const player of original.players)assert.ok(merged.players.some(row=>row.id===(index.identityRedirects[player.id]||player.directoryId||player.id)),player.id);
  assert.ok(merged.meta.leagues.NBA>=5217);assert.ok(merged.meta.leagues.CBA>=1500);assert.ok(merged.meta.leagues.EuroLeague>=18);
  assert.ok(merged.players.find(player=>player.id==='jianlyi01').leagues.includes('CBA'));
  assert.deepEqual(buildGlobalIndex(original),index,'published index matches reproducible source adapter');
});
test('global merge preserves existing scores and does not manufacture international career totals',()=>{
  for(const player of nba.players)assert.deepEqual(merged.players.find(row=>row.id===player.id).model.components,player.model.components,player.id);
  const global=merged.players.find(player=>player.id==='euro-giannoulis-larentzakis');
  assert.equal(global.dataCoverage,'profile');assert.deepEqual(global.careerRS,{});assert.deepEqual(global.awards,{});
  assert.equal(global.firstSeason,null);assert.equal(global.lastSeason,null);
  const ranked=rankPlayers([global.model],{regular_season:1,team_success:1},0);
  assert.equal(ranked[0].score,null);assert.equal(ranked[0].rank,null);
});
test('only verified identity redirects merge people, never same-name guesses',()=>{
  const result=mergeGlobalCatalog({players:[{id:'nba01',name:'Same Name',model:{components:{peak_score:30}}}]},{players:[{id:'global01',name:'Same Name',leagues:['CBA']},{id:'verified01',name:'Same Name',leagues:['CBA']}],identityRedirects:{verified01:'nba01'}});
  assert.equal(result.players.length,2);assert.deepEqual(result.players.find(player=>player.id==='nba01').leagues,['NBA','CBA']);
  assert.equal(result.players.find(player=>player.id==='global01').model,undefined);
});
test('Chinese and middle-dot source IDs survive selection; markup and path IDs remain forbidden',()=>{
  const id='cba-registered-阿卜杜赛麦提·买提阿布拉';
  assert.ok(validPlayerId(id));assert.ok(merged.players.some(player=>player.id===id));
  assert.deepEqual(sanitizeSelectedIds([id,'../bad','<script>','a/b',id]),[id]);
});
test('data coverage reflects observed scores and every cited source resolves',()=>{
  assert.equal(playerCoverage(merged.players.find(player=>player.id==='wembavi01')),'partial');
  assert.equal(playerCoverage(merged.players.find(player=>player.id==='jordami01')),'complete');
  const sources=new Set(merged.sources.map(source=>source.id));
  for(const player of merged.players)for(const source of player.coverage?.sources||[])assert.ok(sources.has(source),player.id+': '+source);
});
