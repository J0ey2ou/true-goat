/** Record claims are ALWAYS relative to the loaded snapshot, never universal history. */
export const METRICS=Object.freeze({points:'得分',rebounds:'篮板',assists:'助攻',steals:'抢断',blocks:'盖帽',threes:'三分命中',minutes:'出场分钟',fgPct:'投篮命中率 %',tsPct:'真实命中率 TS%',efgPct:'有效命中率 eFG%',gameScore:'Game Score',bpm:'BPM',per:'PER',usgPct:'使用率 USG%',efficiency:'新浪效率值',age:'年龄',games:'赛季出场数',heightCm:'档案身高 cm',weightKg:'档案体重 kg'});
export const POOLS=['nba-active','nba-history','cba-active','cba-history'];
const OPS={gte:(a,b)=>a>=b,lte:(a,b)=>a<=b,lt:(a,b)=>a<b,gt:(a,b)=>a>b};
export function validateQuery(q){
  if(!q||!POOLS.includes(q.pool)||!['season','game'].includes(q.unit)||!['first','highest','streak'].includes(q.mode))throw Error('Invalid scope');
  if(!Object.hasOwn(METRICS,q.metric)||['age','games','heightCm','weightKg'].includes(q.metric))throw Error('Invalid ranking metric');
  if(!Number.isInteger(q.from)||!Number.isInteger(q.to)||q.from<1947||q.to>2026||q.from>q.to)throw Error('Invalid years');
  if(!['all','rs','po'].includes(q.phase)||!Array.isArray(q.filters)||q.filters.length>8)throw Error('Invalid filters');
  for(const f of q.filters)if(!Object.hasOwn(METRICS,f.key)||!Object.hasOwn(OPS,f.op)||!Number.isFinite(f.value))throw Error('Invalid numeric filter');
  if(q.unit==='season'&&(q.mode==='streak'||q.opponent||q.opponentPlayer!==null))throw Error('Game-only condition');
  if(q.pool.startsWith('cba')&&(q.unit==='game'||q.phase!=='all'||q.filters.some(f=>!supportsMetric(f.key,q))))throw Error('Unsupported CBA condition');
  if(q.filters.some(f=>!supportsMetric(f.key,q))||!supportsMetric(q.metric,q))throw Error('Unsupported statistic');
  if(['first','streak'].includes(q.mode)&&!q.filters.some(f=>!['age','games','heightCm','weightKg'].includes(f.key)))throw Error('Needs a performance threshold');
  if(q.opponentPlayer!==null&&!Number.isInteger(q.opponentPlayer))throw Error('Invalid opponent');
  return q;
}
export function supportsMetric(key,q){
  if(['heightCm','weightKg'].includes(key))return true;
  if(q.pool.startsWith('cba'))return ['points','rebounds','assists','steals','blocks','threes','efficiency','games'].includes(key);
  return q.unit==='game'?!['per','efficiency','games'].includes(key):!['gameScore','efficiency'].includes(key);
}
export function createAccumulator(query,players){
  const q=validateQuery(query),allowed=new Set(players.flatMap((p,i)=>p.pools.includes(q.pool)?[i]:[]));
  const entrants=new Set(),eligible=new Set(),qualified=new Set(),best=new Map(),runs=new Map();let rows=0,unknown=0,matched=0;
  const bioKeys=['age','games','heightCm','weightKg'],demographic=q.filters.filter(f=>bioKeys.includes(f.key));
  const required=q.filters.map(f=>f.key);if(q.mode==='highest')required.push(q.metric);
  const score=r=>q.mode==='first'?Number(r.date.replaceAll('-','')):r[q.metric];
  function keep(p,value,evidence){
    const prior=best.get(p);if(!prior||(q.mode==='first'?value<prior.value:value>prior.value))best.set(p,{p,value,evidence});
  }
  return {add(batch){for(let r of batch){
    if(!allowed.has(r.p)||r.year<q.from||r.year>q.to||(q.phase!=='all'&&r.phase!==q.phase))continue;
    rows++;entrants.add(r.p);
    const key=r.p+':'+r.year+':'+r.phase;
    const person=players[r.p];const value=k=>k==='heightCm'||k==='weightKg'?person[k]:r[k];
    const context=(!q.team||r.team===q.team)&&(!q.opponent||r.opponent===q.opponent)
      &&(q.opponentPlayer===null||r.opponentPlayers?.includes(q.opponentPlayer))
      &&(!q.position||person.positions.includes(q.position))&&(!q.college||person.college===q.college)
      &&(!q.birthplace||person.birthplaceId===q.birthplace);
    const missing=required.some(k=>!Number.isFinite(value(k)));
    if(context){if(demographic.every(f=>Number.isFinite(value(f.key))&&OPS[f.op](value(f.key),f.value)))eligible.add(r.p);if(missing)unknown++;}
    const pass=context&&!missing&&q.filters.every(f=>OPS[f.op](value(f.key),f.value));
    if(!pass){if(q.mode==='streak')runs.delete(key);continue;}
    matched++;qualified.add(r.p);
    const evidence={date:r.date,year:r.year,team:r.team,opponent:r.opponent||null,game:r.gameId||null,phase:r.phase,
      values:Object.fromEntries(Object.keys(METRICS).map(k=>[k,Number.isFinite(value(k))?value(k):null]))};
    if(q.mode==='streak'){
      const run=runs.get(key)||{count:0,start:evidence.date};run.count++;run.end=evidence.date;runs.set(key,run);
      keep(r.p,run.count,{...evidence,start:run.start,end:run.end});
    }else keep(r.p,score(r),evidence);
  }},finish(target){
    const ranked=[...best.values()].sort((a,b)=>(q.mode==='first'?a.value-b.value:b.value-a.value)||a.p-b.p);
    const targetRow=best.get(target)||null;const ahead=targetRow?ranked.filter(r=>q.mode==='first'?r.value<targetRow.value:r.value>targetRow.value).length:null;
    const ties=targetRow?ranked.filter(r=>r.value===targetRow.value).length:0;
    return {query:q,rows,unknown,entrants:entrants.size,eligible:eligible.size,qualified:qualified.size,matched,
      target:targetRow,rank:ahead===null?null:ahead+1,ties,isolated:eligible.size<2,
      leaders:ranked.slice(0,10),first:!!targetRow&&ahead===0,unique:!!targetRow&&ahead===0&&ties===1};
  }};
}
export function evaluate(rows,query,players,target){const a=createAccumulator(query,players);a.add([...rows].sort((a,b)=>a.date.localeCompare(b.date)||a.p-b.p));return a.finish(target);}

/** Bounded, disclosed search. No name, exact birthday or arbitrary identity qualifiers. */
export function explorationQueries(q,targetRows,person={}){
  const variants=[q],seen=new Set([JSON.stringify(q)]);
  const add=x=>{const s=JSON.stringify(x);if(!seen.has(s)&&variants.length<128){seen.add(s);variants.push(x);}};
  for(const metric of ['points','assists','rebounds','threes']){
    const peaks=targetRows.filter(r=>Number.isFinite(r[metric])).sort((a,b)=>b[metric]-a[metric]).slice(0,2);
    for(const r of peaks){
      const step=metric==='points'?5:metric==='threes'?1:2;
      const threshold=Math.floor(r[metric]/step)*step;if(threshold<=0)continue;
      const base={...q,metric,filters:[{key:metric,op:'gte',value:threshold}]};add(base);
      if(r.team)add({...base,team:r.team});
      if(Number.isFinite(r.age)){
        const upper=[21,23,25,28,30,35,40,45,50].find(n=>n>r.age);
        if(upper)add({...base,filters:[...base.filters,{key:'age',op:'lt',value:upper}]});
      }
      for(const extra of ['points','assists','rebounds'])if(extra!==metric&&Number.isFinite(r[extra])){
        const v=Math.floor(r[extra]/(extra==='points'?5:2))*(extra==='points'?5:2);
        if(v>0)add({...base,filters:[...base.filters,{key:extra,op:'gte',value:v}]});
      }
      if(q.unit==='game'&&r.opponent)add({...base,opponent:r.opponent});
      if(person.college)add({...base,college:person.college});
      if(person.birthplaceId)add({...base,birthplace:person.birthplaceId});
      const physical=['heightCm','weightKg'].filter(k=>Number.isFinite(person[k])).flatMap(key=>[
        {key,op:'gte',value:Math.floor(person[key]/5)*5},{key,op:'lt',value:Math.floor(person[key]/5)*5+5}]);
      if(physical.length){add({...base,filters:[...base.filters,...physical]});
        if(person.college)add({...base,college:person.college,filters:[...base.filters,...physical]});
        if(person.birthplaceId)add({...base,birthplace:person.birthplaceId,filters:[...base.filters,...physical]});}
    }
  }
  return variants;
}
export function sortExplorations(results){return results.sort((a,b)=>Number(b.first&&!b.isolated)-Number(a.first&&!a.isolated)
  ||Number(a.isolated)-Number(b.isolated)||(a.rank??Infinity)-(b.rank??Infinity)||b.eligible-a.eligible
  ||a.query.filters.length-b.query.filters.length);}
