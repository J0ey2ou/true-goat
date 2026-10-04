import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {eligiblePlayers,poolFamily,matchingAppearances,comparePlayers} from '../guess-engine.mjs';
import {rankPlayers,DIMENSIONS} from '../model.mjs';
const json=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const game=await json('../data/guess-players.json'),catalog=await json('../data/player-catalog.json');
const old=await json('../../data/processed/goat_model_v0_2_web.json'),directory=await json('../data/player-directory.json');
const inPool=id=>game.players.filter(p=>p.pools.includes(id));

test('game offers all seven documented variants independently of the default 300',()=>{
  assert.deepEqual(new Set(game.pools.map(p=>p.id)),new Set(['nba-active','nba-history','nba-easy','cba-active','cba-history','cba-easy','global']));
  assert.ok(inPool('nba-history').length>=5000);
  assert.ok(inPool('cba-history').length>1000);
  assert.equal(old.players.length,300);
  for(const p of game.pools)assert.equal(inPool(p.id).length,p.count);
  assert.equal(new Set(game.players.map(p=>p.id)).size,game.players.length);
});

test('current NBA membership is backed by dated official roster identities, not recent play',()=>{
  const current=inPool('nba-active');
  assert.equal(current.length,game.meta.nba.rosterCount);
  assert.equal(new Set(current.map(p=>p.nbaRoster.personId)).size,current.length);
  assert.equal(new Set(current.map(p=>p.nbaRoster.teamId)).size,30);
  assert.ok(!current.some(p=>p.id==='jordami01'));
  assert.ok(current.some(p=>p.id==='jamesle01'));
  for(const p of current){assert.ok(p.nbaRoster.sourceId);assert.equal(p.nbaRoster.asOf,'2026-10-04');}
  const newcomer=current.find(p=>!p.pools.includes('nba-history'));
  assert.ok(newcomer);
  assert.equal(matchingAppearances(newcomer,'nba-active').length,0);
  assert.equal(eligiblePlayers([newcomer],'nba-active',{from:2026,to:2026}).length,0);
});

test('NBA historical and easy pools use explicit actual-play and honors criteria',()=>{
  for(const p of inPool('nba-history')) assert.ok(p.appearances.some(r=>['NBA','BAA'].includes(r.league)&&r.games>0));
  for(const p of inPool('nba-easy')) {
    assert.ok(p.pools.includes('nba-history'));
    assert.ok(p.mvpCount>=1 || p.allStarSelections>=5,p.id);
  }
  assert.ok(inPool('nba-easy').length<inPool('nba-active').length);
});

test('CBA current registrations and historical appearances remain separate facts',()=>{
  assert.match(game.pools.find(p=>p.id==='cba-active').description,/国内/);
  assert.match(game.pools.find(p=>p.id==='cba-history').description,/不是|不.*完备/);
  for(const p of inPool('cba-active')) {
    assert.ok(p.registrationEvidence?.length,p.id);
    assert.ok(p.registrationEvidence.every(r=>r.status==='注册完成'&&r.sourceId));
    assert.ok(!p.appearances.some(r=>r.league==='CBA'&&r.season===2027),'registration must not become a played season');
  }
  for(const p of inPool('cba-history')) assert.ok(p.appearances.some(r=>r.league==='CBA'&&(r.games>0||r.evidence==='dated-performance')),p.id);
  for(const p of inPool('cba-easy')) assert.ok(p.pools.includes('cba-history')||p.pools.includes('cba-active'));
  assert.ok(!inPool('cba-active').some(p=>p.id==='mingya01'));
});

test('cross-league identities resolve to one record with retained source evidence',()=>{
  for(const [alias,id] of Object.entries(game.identityRedirects)) {
    assert.ok(!game.players.some(p=>p.id===alias),alias);
    assert.ok(game.players.some(p=>p.id===id),id);
  }
  const yao=game.players.filter(p=>p.id==='mingya01');assert.equal(yao.length,1);
  assert.ok(yao[0].pools.includes('nba-history')&&yao[0].pools.includes('cba-history'));
  assert.ok(yao[0].pools.includes('cba-easy'));
  for(const p of game.pools)assert.ok(poolFamily(p.id));
});

test('reviewed NBA/CBA duplicates merge while remaining identity uncertainty is disclosed',()=>{
  for(const [alias,id] of Object.entries({'cba-sina-4128':'arenagi01','cba-sina-6929':'boozeca01','cba-sina-6949':'smithjo03','cba-sina-7069':'jeffeal01'})){
    assert.equal(game.identityRedirects[alias],id);
    const person=game.players.find(p=>p.id===id);
    assert.ok(person.appearances.some(r=>r.league==='NBA'));
    assert.ok(person.appearances.some(r=>r.league==='CBA'));
    assert.ok(!game.players.some(p=>p.id===alias));
  }
  assert.equal(game.meta.cba.identityResolution.complete,false);
  assert.ok(game.meta.cba.identityResolution.unresolvedCount>0);
  assert.ok(game.meta.cba.identityResolution.verifiedNbaMappings>=154);
});

test('merged cross-league team samples never pretend to be complete career sets',()=>{
  const cross=game.players.filter(p=>new Set(p.teams.map(t=>t.id.split(':')[0])).size>1);
  assert.ok(cross.length>10);
  for(const p of cross) {
    assert.equal(p.teamsComplete,false,p.id);
    const other={...p,teams:[{id:'NBA:NOT-A-REAL-TEAM'}],teamsComplete:true};
    assert.equal(comparePlayers(p,other).find(a=>a.key==='teams').status,'unknown',p.id);
  }
});

test('extended directory preserves every original model and profile',()=>{
  const byId=new Map(catalog.players.map(p=>[p.id,p]));
  assert.ok(byId.size>5000);assert.equal(byId.size,catalog.players.length);
  for(const p of old.players)assert.deepEqual(byId.get(p.player_id).model,p);
  for(const p of directory.players)for(const [key,value] of Object.entries(p))assert.deepEqual(byId.get(p.id)[key],value,`${p.id}/${key}`);
});

test('new entries never invent a public prior or playoff score and unknown newcomers stay unscored',()=>{
  const weights=Object.fromEntries(DIMENSIONS.map(d=>[d.key,1]));
  const added=catalog.players.filter(p=>!p.catalogOriginal);
  for(const p of added){
    assert.equal(p.model.rankings.public_prior_score,null);
    assert.equal(p.model.components.playoffs_score,null);
    for(const d of DIMENSIONS){const v=p.model.components[d.key+'_score'];assert.ok(v===null || Number.isFinite(v)&&v>=0&&v<=100);}
  }
  const unobserved=added.filter(p=>DIMENSIONS.every(d=>p.model.components[d.key+'_score']===null));
  assert.ok(unobserved.length>0);
  assert.ok(rankPlayers(unobserved.map(p=>p.model),weights).every(p=>p.score===null&&p.rank===null));
});

test('adding a player cannot recalibrate any original score',()=>{
  const coefficients=Object.fromEntries(DIMENSIONS.map((d,i)=>[d.key,i+1]));
  const before=rankPlayers(old.players,coefficients,2);
  const added=catalog.players.find(p=>!p.catalogOriginal&&Number.isFinite(p.model.components.regular_season_score));
  const after=new Map(rankPlayers([...old.players,added.model],coefficients,2).map(p=>[p.player_id,p]));
  for(const p of before)assert.equal(after.get(p.player_id).score,p.score);
  assert.equal(catalog.meta.referencePlayerCount,300);
  assert.ok(catalog.meta.frozenReferences&&catalog.meta.componentSpecifications);
});

test('public data packages fit a free static host single-file limit',async()=>{
  for(const file of ['guess-players.json','player-catalog.json'])assert.ok((await stat(new URL('../data/'+file,import.meta.url))).size<25*1024*1024,file);
});
