// Deterministic positive-record search for EVERY selectable player, including
// explicit no-data/not-found outcomes. These are snapshot claims, not all-time titles.
import {readFile,writeFile} from 'node:fs/promises';
const load=async file=>JSON.parse(await readFile(new URL('../app/data/'+file,import.meta.url),'utf8'));
const manifest=await load('custom-manifest.json'),nba=(await load('custom-nba-seasons.json')).rows,cba=(await load('custom-cba-seasons.json')).rows;
const metrics=['points','assists','rebounds','steals','blocks','threes','minutes'];
const dimensions=['team','college','birthplace','heightCm','weightKg','age','year'];
const templates=[[]];for(let mask=1;mask<(1<<dimensions.length);mask++){
  const fields=dimensions.filter((_,i)=>mask&(1<<i));templates.push(fields);
}
const all={};
for(const pool of ['nba-history','nba-active','cba-history','cba-active']){
  const allowed=new Set(manifest.players.flatMap((p,i)=>p.pools.includes(pool)?[i]:[])),rows=(pool.startsWith('nba')?nba:cba).filter(r=>allowed.has(r.p)),best=new Map(),present=new Set(rows.map(r=>r.p));
  for(const fields of templates){
    const groups=new Map();
    for(const r of rows){
      const person=manifest.players[r.p],values=fields.map(k=>k==='team'?r.team:k==='year'?r.year:k==='birthplace'?person.birthplaceId:k==='college'?person.college:Math.floor((k==='age'?r.age:person[k])/5)*5);
      if(fields.some((k,i)=>['age','heightCm','weightKg'].includes(k)?!Number.isFinite(k==='age'?r.age:person[k]):values[i]===null||values[i]===undefined||values[i]===''))continue;
      const key=JSON.stringify(values);let g=groups.get(key);if(!g){g={values,players:new Set(),max:metrics.map(()=>({value:-Infinity,winners:new Set()}))};groups.set(key,g);}g.players.add(r.p);
      metrics.forEach((m,i)=>{const v=r[m];if(!Number.isFinite(v)||v<=0)return;const b=g.max[i];if(v>b.value){b.value=v;b.winners=new Set([r.p]);}else if(v===b.value)b.winners.add(r.p);});
    }
    for(const g of groups.values()){
      for(let mi=0;mi<metrics.length;mi++)for(const p of g.max[mi].winners){
        const old=best.get(p),candidate={fields,values:g.values,metric:metrics[mi],peers:g.players.size,ties:g.max[mi].winners.size};
        // Fewer qualifiers first; then wider comparisons; prefer sole records.
        if(!old||(old.peers<2&&candidate.peers>=2)||(old.peers>=2)===(candidate.peers>=2)&&(fields.length<old.fields.length||(fields.length===old.fields.length&&(candidate.peers>old.peers||candidate.peers===old.peers&&candidate.ties<old.ties))))best.set(p,candidate);
      }
    }
  }
  const records={};
  for(const p of allowed){
    const found=best.get(p);if(!found){records[p]={status:present.has(p)?'not-found':'no-data'};continue;}
    const q={pool,unit:'season',mode:'highest',metric:found.metric,from:pool.startsWith('nba')?1947:2006,to:pool.startsWith('nba')?2026:2024,phase:pool.startsWith('nba')?'rs':'all',opponentPlayer:null,filters:[{key:found.metric,op:'gt',value:0}]};
    found.fields.forEach((k,i)=>{const v=found.values[i];if(['age','heightCm','weightKg'].includes(k))q.filters.push({key:k,op:'gte',value:v},{key:k,op:'lt',value:v+5});else if(k==='year')q.from=q.to=v;else q[k]=v;});
    // Up to eight numeric constraints; skip over-specific candidates rather than
    // claiming a result that the public query interface cannot reproduce.
    records[p]=q.filters.length<=8?{status:found.peers<2?'isolated':'candidate',query:q,peers:found.peers,ties:found.ties}:{status:'not-found'};
  }
  all[pool]={players:allowed.size,withData:present.size,found:Object.values(records).filter(r=>r.status==='candidate').length,isolated:Object.values(records).filter(r=>r.status==='isolated').length,records};
  console.log(pool,JSON.stringify({players:allowed.size,withData:present.size,found:all[pool].found,isolated:all[pool].isolated}));
}
await writeFile(new URL('../app/data/custom-discoveries.json',import.meta.url),JSON.stringify({version:'1.0',asOf:manifest.asOf,templates:templates.length,pools:all})+'\n');
