import assert from 'node:assert/strict';
import test from 'node:test';
import {normalizeCatalog,sanitizeSelectedIds,mergeSelectedPlayers,readCustomIds,CUSTOM_PLAYERS_KEY} from '../player-library.mjs';

test('only unique catalog IDs outside default sample may be selected',()=>{
  assert.deepEqual(sanitizeSelectedIds(['known','known','default','invented','<script>',null],new Set(['known','default']),new Set(['default'])),['known']);
});
test('normalization keeps missing indices null, never fabricates 50 or public prior',()=>{
  const {players}=normalizeCatalog({players:[{id:'unknown01',name:'Unknown',model:{components:{peak_score:Infinity,regular_season_score:55}}}]});
  assert.equal(players[0].model.components.regular_season_score,55);
  assert.equal(players[0].model.components.peak_score,null);
  assert.equal(Object.values(players[0].model.components).filter(v=>v===null).length,6);
  assert.equal(players[0].model.rankings.public_prior_score,null);
  assert.deepEqual(players[0].eligibility.pools,{});
});
test('flat and nested profiles preserve raw module data and source coverage',()=>{
  const profile={careerRS:{games:2,ppg:10},coverage:{sources:['verified']}};
  const catalog=normalizeCatalog({players:[{id:'a01',name:'Alpha',profile},{id:'b01',name:'Beta',...profile}],sources:[{id:'verified'}]});
  for(const player of catalog.players){assert.deepEqual(player.careerRS,profile.careerRS);assert.deepEqual(player.coverage,profile.coverage);}
  assert.equal(catalog.sources[0].id,'verified');
});
test('invalid and duplicate catalog records cannot overwrite original identity',()=>{
  const catalog=normalizeCatalog({players:[{id:'a01',name:'Alpha'},{id:'a01',name:'Forged'},{id:'../bad',name:'Bad'},{id:'empty'}]});
  assert.equal(catalog.players.length,1);assert.equal(catalog.players[0].name,'Alpha');
});
test('merging preserves base object identity and excludes duplicates',()=>{
  const first={id:'a',score:9};const merged=mergeSelectedPlayers([first],[{id:'a',score:0},{id:'b'},{id:'b'}]);
  assert.equal(merged[0],first);assert.equal(merged.length,2);assert.equal(first.score,9);
});
test('storage parsing is bounded to valid ID strings and failure remains usable',()=>{
  assert.deepEqual(readCustomIds({getItem:key=>{assert.equal(key,CUSTOM_PLAYERS_KEY);return JSON.stringify({v:1,ids:['a','a',3]});}}),['a']);
  assert.deepEqual(readCustomIds({getItem:()=>{throw new Error('denied');}}),[]);
  assert.deepEqual(readCustomIds({getItem:()=>'{broken'}),[]);
});
