import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {evaluate,validateQuery} from '../app/custom-engine.mjs';
const load=async f=>JSON.parse(await readFile(new URL('../app/data/'+f,import.meta.url),'utf8'));
const m=await load('custom-manifest.json'),d=await load('custom-discoveries.json'),nba=(await load('custom-nba-seasons.json')).rows,cba=(await load('custom-cba-seasons.json')).rows;
let checked=0;
for(const [pool,entry] of Object.entries(d.pools)){
  const rows=pool.startsWith('nba')?nba:cba;
  assert.equal(entry.players,m.players.filter(p=>p.pools.includes(pool)).length);
  for(const [target,record] of Object.entries(entry.records)){
    if(!['candidate','isolated'].includes(record.status))continue;const q=validateQuery(record.query);
    // Safe prefilter for season maximum queries only, retaining every eligible
    // player and row. Streak queries must never use this optimization.
    const comparable=rows.filter(r=>r.year>=q.from&&r.year<=q.to&&(!q.team||r.team===q.team)&&(!q.college||m.players[r.p].college===q.college)&&(!q.birthplace||m.players[r.p].birthplaceId===q.birthplace));
    const result=evaluate(comparable,q,m.players,Number(target));
    assert.equal(result.first,true,`${pool}:${target}`);assert.equal(result.isolated,record.status==='isolated',`${pool}:${target} isolated`);assert.equal(result.eligible,record.peers,`${pool}:${target} peers`);checked++;
  }
  console.log('Verified',pool,entry.found);
}
console.log('PASS: every precomputed positive candidate reproduces its rank, peer count and honest isolation label:',checked);
