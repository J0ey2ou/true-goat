import test from 'node:test';import assert from 'node:assert/strict';
import {evaluate,validateQuery,explorationQueries} from '../custom-engine.mjs';
import {createAccumulator,applyExclusions,EXCLUSIONS} from '../custom-engine.mjs';
import {describeClaim} from '../custom-claim.mjs';
import {issueUrl} from '../feedback.mjs';import {mergePresence,presenceCount} from '../presence.mjs';
const players=[{id:'a',pools:['nba-history'],positions:['G'],heightCm:190,weightKg:90,college:'A'},{id:'b',pools:['nba-history'],positions:['G'],heightCm:200,weightKg:100,college:'B'},{id:'c',pools:['nba-history'],positions:['F']}];
const q={pool:'nba-history',unit:'game',mode:'first',metric:'points',from:2020,to:2021,phase:'rs',filters:[{key:'points',op:'gte',value:30}],opponentPlayer:null};
const row=(p,date,points,other={})=>({p,date,points,year:Number(date.slice(0,4)),phase:'rs',team:'NBA:A',opponent:'NBA:B',...other});
test('excluded qualifier types are absent from every exploration, not just hidden in the claim',()=>{
  const excluded=Object.keys(EXCLUSIONS),query=applyExclusions({...q,team:'NBA:A',college:'A',opponent:'NBA:B',opponentPlayer:1,honors:[{key:'mvpCount',op:'gte',value:1}],filters:[...q.filters,{key:'heightCm',op:'gte',value:185}]},excluded);
  const variants=explorationQueries(query,[row(0,'2020-01-01',40,{age:22,assists:10})],{...players[0],birthplaceId:'place'});
  assert.ok(variants.length>1);for(const v of variants){validateQuery(v);assert.equal(v.team,'');assert.equal(v.college,'');assert.equal(v.birthplace,'');assert.equal(v.opponent,'');assert.equal(v.opponentPlayer,null);assert.deepEqual(v.honors,[]);assert.ok(v.filters.every(f=>!excluded.includes(f.key)));}
  assert.throws(()=>validateQuery({...query,team:'NBA:A'}));assert.throws(()=>validateQuery({...query,filters:[...q.filters,{key:'age',op:'lt',value:25}]}));assert.throws(()=>applyExclusions(q,['invented']));
  const scoped={...q,mode:'highest',team:'NBA:A'};const rows=[row(0,'2020-01-01',40),row(1,'2020-01-01',50,{team:'NBA:C'})];assert.equal(evaluate(rows,scoped,players,0).first,true);assert.equal(evaluate(rows,applyExclusions(scoped,['team']),players,0).rank,2);
});
test('complete claims retain scope, qualifiers, ties, counterexamples and missing records',()=>{
  const people=players.map((p,i)=>({...p,name:'Player '+i,chineseName:'球员'+i})),data={players:people,teams:{'NBA:A':'Team A'}};
  const rows=[row(0,'2020-01-01',40),row(1,'2020-01-01',40),row(2,'2020-01-02',31)];
  const result=evaluate(rows,{...q,mode:'highest'},people,0);
  const claim=describeClaim(result,people[0],data);assert.match(claim.sentence,/2020–2021/);assert.match(claim.sentence,/得分 ≥ 30/);assert.match(claim.sentence,/并列第一名球员/);assert.match(claim.evidence,/40/);
  assert.match(describeClaim(evaluate(rows,{...q,mode:'highest'},people,2),people[2],data).sentence,/排名第 3，不是第一/);
  assert.match(describeClaim({...result,isolated:true},people[0],data).sentence,/不能据此认定/);
  assert.match(describeClaim({...result,target:null},people[0],data).sentence,/没有符合条件/);
  const english=describeClaim(result,people[0],data,{language:'en',translate:s=>s==='得分'?'points':s});assert.match(english.sentence,/ties for first among 2/);assert.doesNotMatch(english.sentence,/[\u3400-\u9fff]/);
  assert.match(describeClaim({...result,query:{...result.query,unit:'season'}},people[0],data).sentence,/赛季场均得分/);
});
test('reverse mode returns all matches and honors exclude unknown rather than treating it as zero',()=>{
  const people=Array.from({length:30},(_,i)=>({...players[0],id:String(i),honors:i===29?{}:{mvpCount:i%2}}));
  const query={...q,mode:'highest',honors:[{key:'mvpCount',op:'gte',value:1}]},a=createAccumulator(query,people);
  a.add(people.map((_,i)=>row(i,'2020-01-01',30+i)));const result=a.finish(-1,{all:true});assert.equal(result.leaders.length,14);assert.equal(result.unknown,1);assert.equal(result.leaders[0].p,27);
  assert.throws(()=>validateQuery({...query,honors:[{key:'fake',op:'gte',value:1}]}));
  assert.throws(()=>validateQuery({...query,pool:'cba-history',unit:'season',phase:'all'}));
});
test('focused exploration preserves explicit constraints and honors',()=>{
  const query={...q,team:'NBA:A',college:'Locked',honors:[{key:'mvpCount',op:'gte',value:1}],metric:'assists'};
  const variants=explorationQueries(query,[row(0,'2020-01-01',40,{assists:12,age:22})],players[0],['assists']);
  for(const v of variants){assert.equal(v.metric,'assists');assert.equal(v.team,query.team);assert.equal(v.college,query.college);assert.deepEqual(v.honors,query.honors);assert.ok(v.filters.some(f=>f.key==='points'&&f.value===30));validateQuery(v);}
});
test('earliest is not highest; same date ties rather than fabricated order',()=>{
  const rows=[row(0,'2020-01-02',40),row(1,'2020-01-01',30),row(2,'2020-01-01',35)];
  assert.equal(evaluate(rows,q,players,0).rank,3);assert.equal(evaluate(rows,q,players,1).ties,2);
  assert.equal(evaluate(rows,{...q,mode:'highest'},players,0).unique,true);
});
test('streaks break on failures, unknown, opponent changes, season and phase boundaries',()=>{
  const rows=[row(0,'2020-01-01',30),row(0,'2020-01-02',40),row(0,'2020-01-03',null),row(0,'2020-01-04',40),row(0,'2020-01-05',40,{opponent:'NBA:C'}),row(0,'2020-01-06',40),row(0,'2021-01-01',40)];
  const r=evaluate(rows,{...q,mode:'streak',opponent:'NBA:B'},players,0);assert.equal(r.target.value,2);assert.equal(r.target.evidence.start,'2020-01-01');assert.equal(r.unknown,1);
});
test('age is strict under threshold, missing is not zero, and one-player contexts are isolated',()=>{
  const rows=[row(0,'2020-01-01',40,{age:25}),row(1,'2020-01-01',35,{age:24})];
  const result=evaluate(rows,{...q,filters:[...q.filters,{key:'age',op:'lt',value:25}]},players,0);assert.equal(result.target,null);assert.equal(result.eligible,1);
  const physical=evaluate(rows,{...q,filters:[...q.filters,{key:'heightCm',op:'lt',value:195}]},players,0);assert.equal(physical.isolated,true);
  assert.throws(()=>validateQuery({...q,filters:[{key:'heightCm',op:'gte',value:100}]}));
});
test('opponent identity needs verified opposite-team appearances and auto qualifiers are bounded',()=>{
  const rows=[row(0,'2020-01-01',40,{opponentPlayers:[1]}),row(0,'2020-01-02',50,{opponentPlayers:[2]})];
  assert.equal(evaluate(rows,{...q,opponentPlayer:1,mode:'highest'},players,0).target.value,40);
  const variants=explorationQueries(q,rows,players[0]);assert.ok(variants.length<=128);for(const v of variants)validateQuery(v);
});
test('CBA unsupported claims and invalid filters cannot silently broaden scope',()=>{
  assert.throws(()=>validateQuery({...q,pool:'cba-history'}));assert.throws(()=>validateQuery({...q,unit:'season',mode:'streak'}));
  assert.throws(()=>validateQuery({...q,filters:[{key:'points',op:'gte',value:NaN}]}));
  assert.throws(()=>validateQuery({...q,filters:[{key:'per',op:'gte',value:10}]}));
});
test('report requires evidence and sends no tokens to GitHub',()=>{
  const values={subject:'Michael Jordan / points',wrong:'1',correct:'2',source:'https://example.org/proof',page:'https://j0ey2ou.github.io/true-goat/guess.html',release:'test'};
  const url=new URL(issueUrl(values));assert.equal(url.hostname,'github.com');assert.match(url.searchParams.get('body'),/example.org\/proof/);
  assert.throws(()=>issueUrl({...values,source:'javascript:alert(1)'}));assert.throws(()=>issueUrl({...values,correct:''}));
});
test('presence deduplicates tabs and applies leaves by reference rather than deleting the whole person',()=>{
  const state=new Map();mergePresence(state,{a:{metas:[{phx_ref:'1'},{phx_ref:'2'}]}},true);assert.equal(presenceCount(state),1);
  mergePresence(state,{joins:{b:{metas:[{phx_ref:'3'}]}},leaves:{a:{metas:[{phx_ref:'1'}]}}});assert.equal(presenceCount(state),2);
  mergePresence(state,{leaves:{a:{metas:[{phx_ref:'2'}]}}});assert.equal(presenceCount(state),1);
});
