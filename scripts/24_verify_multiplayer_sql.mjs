import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {PGlite}=await import(process.env.GOAT_PGLITE_MODULE||'@electric-sql/pglite');
const db=new PGlite();
try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`);
 for(const file of ['202610070001_arena.sql','202610070002_multiplayer.sql'])await db.exec(await readFile('supabase/migrations/'+file,'utf8'));
 const ids=Array.from({length:6},(_,i)=>`${i+1}`.repeat(8)+'-'+`${i+1}`.repeat(4)+'-4'+`${i+1}`.repeat(3)+'-8'+`${i+1}`.repeat(3)+'-'+`${i+1}`.repeat(12));
 const login=async i=>db.query("select set_config('request.jwt.claim.sub',$1,false)",[ids[i]]);
 const call=async(sql,args=[])=>(await db.query(sql,args)).rows[0].value;
 for(let i=0;i<6;i++){await db.query('insert into auth.users(id) values($1)',[ids[i]]);await login(i);await call('select public.goat_profile() as value');}
 const data=JSON.parse(await readFile('app/data/guess-players.json','utf8'));
 const players=data.players.filter(p=>p.pools.includes('nba-easy')).slice(0,10);
 for(const p of players)await db.query('insert into goat_private.players values($1,$2,$3)',[p.id,data.version,p]);
 const lobby=(action,sizes=[2],capacity=2,code=null)=>call('select public.goat_arena_lobby($1,$2,$3,$4,$5) as value',['nba-easy',action,code,sizes,capacity]);
 const state=id=>call('select public.goat_arena_state($1) as value',[id]);
 const leave=id=>call('select public.goat_arena_leave($1) as value',[id]);
 for(const invalid of [[],[1],[6],[2,null],null]){await login(0);await assert.rejects(()=>lobby('ranked',invalid),/有效人数/);}
 for(const capacity of [2,3,4,5]){
  await login(0);let r=await lobby('create',[2,3,4,5],capacity);assert.equal(r.capacity,capacity);assert.equal(r.members.length,1);assert.equal(r.answer,null);
  for(let i=1;i<capacity;i++){await login(i);r=await lobby('join',[2],2,r.room_code);assert.equal(r.members.length,i+1);assert.equal(r.state,i+1===capacity?'playing':'waiting');}
  await login(5);await assert.rejects(()=>state(r.id),/无权访问/);await assert.rejects(()=>lobby('join',[2],2,r.room_code),/不存在/);
  await db.exec('set role authenticated');assert.equal((await db.query('select * from public.goat_rooms')).rows.length,0);assert.equal((await db.query('select * from public.goat_room_members')).rows.length,0);await assert.rejects(()=>db.query('select * from goat_private.room_answers'),/permission denied/);await db.exec('reset role');
  const answer=(await db.query('select data from goat_private.room_answers where room_id=$1',[r.id])).rows[0].data;
  await login(0);const wrong=players.find(p=>p.id!==answer.id);
  await assert.rejects(()=>call('select public.goat_arena_guess($1,$2) as value',[r.id,'invalid']),/有效球员/);
  r=await call('select public.goat_arena_guess($1,$2) as value',[r.id,wrong.id]);assert.equal(r.members[0].attempts,1);assert.equal(r.guesses[0].feedback.length,10);
  await assert.rejects(()=>call('select public.goat_arena_guess($1,$2) as value',[r.id,wrong.id]),/已经猜过/);
  await assert.rejects(()=>call('select public.goat_arena_guess($1,$2) as value',[r.id,answer.id]),/提交太快/);
  await login(1);r=await state(r.id);assert.equal(r.guesses.length,0);assert.equal(r.answer,null);assert.equal(r.members[0].tiles.length,1);assert.ok(!Object.hasOwn(r.members[0],'guesses'));
  r=await call('select public.goat_arena_guess($1,$2) as value',[r.id,answer.id]);assert.equal(r.state,'finished');assert.equal(r.winner_id,ids[1]);assert.equal(r.answer.id,answer.id);assert.ok(r.members.every(p=>p.delta===0));
 }
 assert.ok((await db.query('select played from public.goat_profiles')).rows.every(p=>p.played===0));
 // Multi-select matches use the intersection and never start with too few people.
 await login(0);const first=await lobby('ranked',[4,5]);await login(1);let intersect=await lobby('ranked',[3,5]);assert.equal(intersect.id,first.id);assert.equal(intersect.capacity,5);assert.equal(intersect.state,'waiting');
 await login(2);const separate=await lobby('ranked',[3]);assert.notEqual(separate.id,first.id);await leave(separate.id);await login(0);await leave(first.id);
 let ranked;
 for(let i=0;i<5;i++){await login(i);ranked=await lobby('ranked',[5]);assert.equal(ranked.state,i===4?'playing':'waiting');assert.equal(ranked.members.length,i+1);}
 const answer=(await db.query('select data from goat_private.room_answers where room_id=$1',[ranked.id])).rows[0].data;
 await login(4);ranked=await call('select public.goat_arena_guess($1,$2) as value',[ranked.id,answer.id]);assert.equal(ranked.state,'finished');assert.equal(ranked.members.find(p=>p.id===ids[4]).delta,12);assert.ok(ranked.members.filter(p=>p.id!==ids[4]).every(p=>p.delta===-3));assert.equal(ranked.members.reduce((sum,p)=>sum+p.delta,0),0);
 await state(ranked.id);await state(ranked.id);assert.ok((await db.query('select played from public.goat_profiles where id=any($1)',[ids.slice(0,5)])).rows.every(p=>p.played===1));
 // Leaving a five-player game does not finish it for everyone else.
 await login(0);let quit=await lobby('create',[5],5);for(let i=1;i<5;i++){await login(i);quit=await lobby('join',[5],5,quit.room_code);}
 await login(0);quit=await leave(quit.id);assert.equal(quit.state,'playing');assert.equal(quit.members[0].state,'left');
 for(let i=1;i<4;i++){await login(i);quit=await leave(quit.id);}assert.equal(quit.state,'finished');assert.equal(quit.winner_id,ids[4]);
 // All eight exhausted means draw; no early answer reveal for one exhausted player.
 await login(0);let exhausted=await lobby('create',[2],2);await login(1);exhausted=await lobby('join',[2],2,exhausted.room_code);
 const a=(await db.query('select data from goat_private.room_answers where room_id=$1',[exhausted.id])).rows[0].data;
 for(let i=0;i<2;i++)for(const p of players.filter(p=>p.id!==a.id).slice(0,8)){
  await login(i);await db.query("update goat_private.room_guesses set created_at=clock_timestamp()-interval '1 second' where room_id=$1 and user_id=$2",[exhausted.id,ids[i]]);
  exhausted=await call('select public.goat_arena_guess($1,$2) as value',[exhausted.id,p.id]);
  if(i===0){assert.equal(exhausted.state,'playing');assert.equal(exhausted.answer,null);}
 }
 assert.equal(exhausted.state,'finished');assert.equal(exhausted.winner_id,null);
 // Timeout settles once, and unsigned users cannot mutate rooms.
 await login(0);let timeout=await lobby('ranked',[3]);for(let i=1;i<3;i++){await login(i);timeout=await lobby('ranked',[3]);}
 await db.query("update public.goat_rooms set deadline_at=now()-interval '1 second' where id=$1",[timeout.id]);timeout=await state(timeout.id);assert.equal(timeout.state,'finished');assert.equal(timeout.winner_id,null);assert.ok(timeout.members.every(p=>p.delta===0));
 await db.exec('set role anon');assert.equal((await call('select public.goat_arena_info() as value')).maxPlayers,5);await assert.rejects(()=>state(timeout.id),/permission denied/);const board=await call('select public.goat_leaderboard() as value');assert.equal(board.length,5);assert.ok(board.every(p=>!Object.hasOwn(p,'email')));await db.exec('reset role');
 // Resume and complete a pre-upgrade game without deleting it.
 await login(0);const old=await call("select public.goat_lobby('nba-easy','create') as value");await login(1);const joined=await lobby('join',[2],2,old.room_code);assert.equal(joined.legacy,true);await login(0);assert.equal((await lobby('resume')).id,old.id);const ended=await leave(old.id);assert.equal(ended.legacy,true);assert.equal(ended.state,'finished');
 console.log('PASS: 2–5 capacities, multi-select intersection, no premature starts, five-player RLS, hidden guesses, rate limit, eight attempts, winner Elo zero sum, exactly-once settlement, group exits, draws, timeout and legacy compatibility.');
}catch(error){console.error(JSON.stringify({message:error.message,code:error.code,stack:error.code?undefined:error.stack}));process.exitCode=1;}finally{await db.close();}
