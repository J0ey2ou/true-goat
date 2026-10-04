import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MODULES,sanitizeAdvanced,effectiveCoefficients,evaluateModule,scoreWithModules,rankWithModules,overlapWarnings } from '../modules.mjs';
import { DIMENSIONS,scorePlayer,rankPlayers } from '../model.mjs';
import { radarMarkup,contributionMarkup } from '../score-charts.mjs';
const coefficients=Object.fromEntries(DIMENSIONS.map(d=>[d.key,1]));
const player={player_id:'x',player_name:'Example',components:Object.fromEntries(DIMENSIONS.map(d=>[d.key+'_score',60])),rankings:{public_prior_score:70}};
const profile={careerRS:{games:100,ppg:25,apg:7,rpg:8,ts:.6,metricCoverageGames:{points:100,assists:100,rebounds:100}},careerPO:{games:10,ppg:30},awards:{mvp:2,finalsMvp:1,dpoy:1,allNba:5,allDefense:3,championships:2},coverage:{regularSeasonThrough:2000,playoffsThrough:1999}};
const setting=(modules={},extra={})=>sanitizeAdvanced({enabled:true,modules:Object.fromEntries(Object.entries(modules).map(([key,coefficient])=>[key,{enabled:true,coefficient}])),...extra});
const zero=Object.fromEntries(DIMENSIONS.map(d=>[d.key,0]));
test('advanced off preserves exact basic score, rank and coefficients',()=>{
  const advanced={enabled:false,disabledBase:['peak'],modules:{rs_ppg:{enabled:true,coefficient:10}}};
  assert.equal(scoreWithModules(player,coefficients,2,advanced,profile).score,scorePlayer(player,coefficients,2).score);
  assert.deepEqual(rankWithModules([player],coefficients,2,advanced),rankPlayers([player],coefficients,2));
  assert.deepEqual(effectiveCoefficients(coefficients,advanced),coefficients);
});
test('independent addition uses fixed units, never changes other coefficients',()=>{
  const result=scoreWithModules(player,coefficients,2,setting({rs_ppg:3,mvp:2}),profile);
  assert.equal(result.score,50+7+4+6+4);
  assert.equal(result.termDetails.find(t=>t.key==='rs_ppg').contribution,6);
  assert.equal(result.termDetails.find(t=>t.key==='mvp').contribution,4);
  assert.equal(result.score,50+result.termDetails.reduce((sum,t)=>sum+t.contribution,0));
  assert.deepEqual(coefficients,Object.fromEntries(DIMENSIONS.map(d=>[d.key,1])));
});
test('exported details distinguish basic-only subtotal from the complete active contribution map',()=>{
  const result=JSON.parse(JSON.stringify(scoreWithModules(player,coefficients,2,setting({rs_ppg:3,mvp:2}),profile)));
  assert.equal(Object.hasOwn(result,'dataScore'),false);
  assert.equal(Object.hasOwn(result,'contributions'),false);
  assert.equal(result.basicDimensionsScoreIncludingIntercept,57);
  assert.equal(Object.keys(result.basicDimensionContributions).length,7);
  assert.equal(result.basicDimensionContributions.rs_ppg,undefined);
  assert.equal(result.activeTermContributions.rs_ppg,6);
  assert.equal(result.activeTermContributions.public_prior,4);
  assert.equal(result.score,50+Object.values(result.activeTermContributions).reduce((sum,value)=>sum+value,0));
  assert.match(result.fieldDefinitions.basicDimensionsScoreIncludingIntercept,/不是高级模型总分/);
  const missing=scoreWithModules(player,zero,0,setting({rs_ppg:1}),null);
  assert.equal(missing.score,null);assert.deepEqual(missing.activeTermContributions,{rs_ppg:0});assert.equal(missing.termDetails[0].missing,true);
});
test('remove base or extra modules and restore base exactly when advanced is off',()=>{
  const advanced=setting({rs_ppg:2},{disabledBase:['peak','awards']});
  assert.equal(scoreWithModules(player,coefficients,0,advanced,profile).score,59);
  advanced.modules.rs_ppg.enabled=false;
  assert.equal(scoreWithModules(player,coefficients,0,advanced,profile).score,55);
  advanced.enabled=false;
  assert.equal(scoreWithModules(player,coefficients,0,advanced,profile).score,57);
});
test('missing raw data is neutral, all active missing null, all zero deliberately 50',()=>{
  assert.equal(scoreWithModules(player,zero,0,setting({rs_ppg:2}),null).score,null);
  assert.equal(scoreWithModules(player,zero,0,setting({rs_ppg:0}),null).score,50);
  const mixed=scoreWithModules(player,coefficients,0,setting({rs_ppg:2}),null);
  assert.equal(mixed.score,57);assert.ok(mixed.missingModules.includes('rs_ppg'));
  assert.equal(mixed.termDetails.find(t=>t.key==='rs_ppg').raw,null);
});
test('a valid extra rescues a missing base and null is not added arithmetically',()=>{
  const p={...player,components:{}};
  assert.equal(scoreWithModules(p,coefficients,0,setting({rs_ppg:2}),profile).score,54);
});
test('partial era stat coverage is not treated as a complete career average',()=>{
  const partial={...profile,careerRS:{...profile.careerRS,metricCoverageGames:{points:99,assists:100,rebounds:100}}};
  const t=evaluateModule(MODULES.find(m=>m.key==='rs_ppg'),player,partial);
  assert.equal(t.missing,true);assert.match(t.reason,/覆盖不足/);
  assert.equal(evaluateModule(MODULES.find(m=>m.key==='rs_apg'),player,partial).missing,false);
});
test('award 0 observed, missing not 0, normative honor composite exact',()=>{
  const honors=MODULES.find(m=>m.key==='honors');
  assert.equal(evaluateModule(honors,player,profile).z,7.8);
  assert.equal(evaluateModule(honors,player,{awards:{mvp:0}}).missing,true);
  const mvp=MODULES.find(m=>m.key==='mvp');
  assert.equal(evaluateModule(mvp,player,{awards:{mvp:0}}).missing,false);
  assert.equal(evaluateModule(mvp,player,{awards:{}}).missing,true);
});
test('interactions require positive excess in both parents; no negative-negative reward',()=>{
  const m=MODULES.find(m=>m.key==='peak_playoffs');
  assert.equal(evaluateModule(m,{components:{peak_score:30,playoffs_score:20}},null).z,0);
  assert.equal(evaluateModule(m,{components:{peak_score:100,playoffs_score:100}},null).z,5);
  assert.equal(evaluateModule(m,{components:{peak_score:100}},null).missing,true);
  assert.equal(evaluateModule(m,{components:{peak_score:80,playoffs_score:20}},null).z,0);
});
test('state sanitized, coefficient limits, unknown module keys ignored',()=>{
  const s=sanitizeAdvanced({enabled:'true',disabledBase:['peak','fake'],modules:{rs_ppg:{enabled:true,coefficient:999},mvp:{enabled:true,coefficient:NaN},evil:{enabled:true,coefficient:10}}});
  assert.equal(s.enabled,false);assert.deepEqual(s.disabledBase,['peak']);assert.equal(s.modules.rs_ppg.coefficient,10);assert.equal(s.modules.mvp.coefficient,1);assert.equal(s.modules.evil,undefined);
  assert.deepEqual(sanitizeAdvanced(JSON.parse(JSON.stringify(s))),s);
});
test('overlap warnings identify aggregate and constituents, and disappear when removed',()=>{
  assert.ok(overlapWarnings(coefficients,setting({honors:1,mvp:2})).some(w=>w.includes('重复计入')));
  assert.ok(overlapWarnings(coefficients,setting({rs_ppg:1})).some(w=>w.includes('常规赛表现')));
  assert.deepEqual(overlapWarnings(zero,setting({rs_ppg:1})),[]);
});
test('ranking uses active actual modules, tie consistency and unavailable last',()=>{
  const rows=[{...player,player_id:'a',player_name:'A'},{...player,player_id:'b',player_name:'B'},{...player,player_id:'c',player_name:'C'}];
  const directory=new Map([['a',{...profile,careerRS:{...profile.careerRS,ppg:20}}],['b',profile]]);
  const ranked=rankWithModules(rows,zero,0,setting({rs_ppg:1}),directory);
  assert.deepEqual(ranked.map(p=>p.player_id),['b','a','c']);assert.deepEqual(ranked.map(p=>p.rank),[1,2,null]);
  assert.ok(rankWithModules(rows,zero,0,setting({}),directory).every(p=>p.rank===1&&p.score===50));
});
test('radar missing is not zero and signed chart carries accessible actual values',()=>{
  const p={...player,components:{...player.components,playoffs_score:null}};
  const markup=radarMarkup(p);assert.match(markup,/季后赛（缺）/);assert.doesNotMatch(markup,/class="radar-shape"/);assert.match(markup,/<td>缺失<\/td>/);
  const bars=contributionMarkup(scoreWithModules(player,zero,0,setting({rs_ppg:1}),{...profile,careerRS:{...profile.careerRS,ppg:10}}));
  assert.match(bars,/signed-bar negative/);assert.match(bars,/-1.00/);assert.match(bars,/49.00/);
});
test('actual 300-player data stays finite, sums exactly, basis is not changed',async()=>{
  const raw=JSON.parse(await readFile(new URL('../../data/processed/goat_model_v0_2_web.json',import.meta.url),'utf8'));
  const dir=JSON.parse(await readFile(new URL('../data/player-directory.json',import.meta.url),'utf8'));
  const directory=new Map(dir.players.map(p=>[p.id,p]));
  const adv=setting({rs_ppg:2,rs_ts:1,honors:1,peak_playoffs:1});
  const rows=rankWithModules(raw.players,coefficients,0,adv,directory);
  assert.equal(rows.length,300);
  for(const p of rows){assert.ok(Number.isFinite(p.score));assert.equal(p.score,50+p.termDetails.reduce((sum,t)=>sum+t.contribution,0));}
});
