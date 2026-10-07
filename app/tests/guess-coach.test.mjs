import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeClues,coachMarkup} from '../guess-coach.mjs';
import {compareNumber,ATTRIBUTES,newRound,giveUpRound,restoreRound,submitGuess,shareText} from '../guess-engine.mjs';
const attribute=key=>ATTRIBUTES.find(item=>item.key===key);
const row=(key,value,answer)=>({values:{[key]:value},feedback:[{key,...compareNumber(value,answer,attribute(key).tolerance)}]});
test('numeric notebook intersects yellow/gray arrows and preserves the true value at tolerance boundaries',()=>{
  for(const key of ['birthYear','heightCm','pointsPerGame'])for(const answer of [20,23,23.000009,23.00002,26.5]){
    const summary=summarizeClues([18,20,23,26,30].map(value=>row(key,value,answer)),[attribute(key)])[0];
    if(summary.integer&&!Number.isInteger(answer))continue;
    assert.ok(!summary.lower || (summary.lower.exclusive?answer>summary.lower.value:answer>=summary.lower.value));
    assert.ok(!summary.upper || (summary.upper.exclusive?answer<summary.upper.value:answer<=summary.upper.value));
  }
  const result=summarizeClues([row('birthYear',1980,1985),row('birthYear',1987,1985)],[attribute('birthYear')])[0];
  assert.deepEqual(result.lower,{value:1984,exclusive:false});assert.deepEqual(result.upper,{value:1986,exclusive:false});
  const height=summarizeClues([row('heightCm',196,205)],[attribute('heightCm')])[0];
  assert.equal(height.integer,true);assert.equal(Number.isInteger(height.lower.value),true);
});
test('unknown observations never narrow a range and unknown-only clues stay unconstrained',()=>{
  const rows=[row('pointsPerGame',20,24),{values:{pointsPerGame:999},feedback:[{key:'pointsPerGame',status:'unknown',direction:'down'}]}];
  const result=summarizeClues(rows,[attribute('pointsPerGame')])[0];
  assert.equal(result.used,1);assert.equal(result.unknown,1);assert.equal(result.upper,null);
  assert.match(coachMarkup(rows.slice(1),[attribute('pointsPerGame')]),/尚无可用约束/);
});
test('set overlap remains an OR clause; disjoint evidence excludes only verified items',()=>{
  const rows=[{values:{teams:['a','b']},feedback:[{key:'teams',status:'close'}]},{values:{teams:['b','c']},feedback:[{key:'teams',status:'wrong'}]},{values:{teams:['a']},feedback:[{key:'teams',status:'unknown'}]}];
  const result=summarizeClues(rows,[attribute('teams')])[0];
  assert.deepEqual(result.overlap,[['a']]);assert.deepEqual(result.excluded,['b','c']);assert.equal(result.exact,null);
  const html=coachMarkup(rows,[attribute('teams')],{a:'<team>',b:'B',c:'C'});assert.match(html,/&lt;team&gt;/);assert.doesNotMatch(html,/<team>/);
});
test('giving up is a durable loss without fake guesses, cannot become a win, and does not disclose an answer in shares',()=>{
  const players=[{id:'a',name:'SECRET ANSWER',pools:['nba-easy']},{id:'b',name:'Other',pools:['nba-easy']}];
  const options={mode:'practice',pool:'nba-easy',date:'2026-10-07',version:'test',answerId:'a'};
  const round=giveUpRound(newRound(options));assert.equal(round.status,'lost');assert.equal(round.guesses.length,0);
  const restored=restoreRound(round,{...options,players,fallbackAnswerId:'b'}).round;
  assert.equal(restored.status,'lost');assert.equal(restored.abandoned,true);assert.equal(restored.answerId,'a');
  assert.ok(submitGuess(restored,'a',players).error);
  const share=shareText(restored,players,'NBA');assert.match(share,/已放弃/);assert.doesNotMatch(share,/SECRET ANSWER/);
  const won={...round,abandoned:false,status:'won',guesses:['a']};assert.equal(giveUpRound(won),won);
});
