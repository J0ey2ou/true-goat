import {createAccumulator,explorationQueries,sortExplorations} from './custom-engine.mjs';
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
    const {query:q,target,explore}=data;
    let queries=[q];
    if(explore){const own=[];for await(const batch of batches(q))own.push(...batch.filter(r=>r.p===target));queries=explorationQueries(q,own,manifest.players[target]);}
    const accumulators=queries.map(q=>createAccumulator(q,manifest.players));
    for await(const batch of batches(q))for(const a of accumulators)a.add(batch);
    const results=accumulators.map(a=>a.finish(target));
    postMessage({type:'result',tested:queries.length,results:explore?sortExplorations(results).slice(0,6):results});
  }catch(error){postMessage({type:'error',message:error.message});}
};
