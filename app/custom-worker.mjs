import {METRICS,supportsMetric,validateQuery,createAccumulator,explorationQueries,sortExplorations} from './custom-engine.mjs';
const cache=new Map();let manifest;
async function json(file,zipped=false){
  if(cache.has(file))return cache.get(file);
  const url=new URL('./data/'+file,import.meta.url);url.search=new URL(import.meta.url).search;
  const response=await fetch(url);if(!response.ok)throw Error('Data download failed: '+response.status);
  const data=zipped?await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).json():await response.json();
  if(cache.size>=3)cache.delete(cache.keys().next().value);cache.set(file,data);return data;
}
async function* batches(q){
  if(q.unit==='season'){
    const data=await json(q.pool.startsWith('cba')?'custom-cba-seasons.json':'custom-nba-seasons.json');
    yield data.rows.filter(r=>r.year>=q.from&&r.year<=q.to);return;
  }
  const files=manifest.gameFiles.filter(f=>f.year>=q.from&&f.year<=q.to);
  for(let i=0;i<files.length;i++){
    const f=files[i];postMessage({type:'progress',current:i+1,total:files.length,year:f.year});
    const data=await json(f.file,true);
    yield data.rows.map(values=>{
      const r=Object.fromEntries(data.columns.map((key,index)=>[key,values[index]])),g=data.games[r.game];
      return {...r,year:f.year,date:g.date,phase:g.phase,gameId:g.id,opponent:r.team===g.home?g.away:g.home,opponentPlayers:r.team===g.home?g.awayPlayers:g.homePlayers};
    });
  }
}
onmessage=async({data})=>{
  try{
    manifest ||= await json('custom-manifest.json');
    const {query:q,target,explore,reverse,focus='all',definitions='all'}=data;
    if(q.honors?.length){
      const [guess,extra]=await Promise.all([json('guess-players.json'),json('guess-extra-metrics.json')]);
      const byId=new Map(guess.players.map(p=>[p.id,p]));
      for(const p of manifest.players)p.honors={mvpCount:byId.get(p.id)?.mvpCount,...extra.players[p.id]};
    }
    let queries=[q];
    if(explore){const own=[];for await(const batch of batches(q))own.push(...batch.filter(r=>r.p===target));
      const metrics=focus==='all'?Object.keys(METRICS).filter(k=>!['age','games','heightCm','weightKg'].includes(k)&&supportsMetric(k,q)):[focus];
      const groups=metrics.map(metric=>explorationQueries({...q,metric},own,manifest.players[target],[metric]));
      // Round-robin dimensions so the bounded budget cannot be consumed by points alone.
      const variants=[];for(let i=0;i<Math.max(...groups.map(g=>g.length));i++)for(const group of groups)if(group[i])variants.push(group[i]);
      const modes=definitions==='all'?(q.unit==='game'?['first','highest','streak']:['first','highest']):[q.mode];
      const seen=new Set();queries=[];
      for(const v of variants)for(const mode of modes){const candidate={...v,mode};try{validateQuery(candidate);}catch{continue;}const key=JSON.stringify({...candidate,metric:mode==='highest'?candidate.metric:null,filters:[...candidate.filters].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))});if(!seen.has(key)&&queries.length<128){seen.add(key);queries.push(candidate);}}
    }
    const accumulators=queries.map(q=>createAccumulator(q,manifest.players));
    for await(const batch of batches(q))for(const a of accumulators)a.add(batch);
    const results=accumulators.map(a=>a.finish(target,{all:!!reverse}));
    postMessage({type:'result',tested:queries.length,results:explore?sortExplorations(results):results});
  }catch(error){postMessage({type:'error',message:error.message});}
};
