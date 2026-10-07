-- Upgrade to 2–5 participants. Existing accounts, ratings and 1v1 games remain.
create table if not exists public.goat_rooms (
  id uuid primary key default gen_random_uuid(), host_id uuid not null references public.goat_profiles(id),
  pool text not null, data_version text not null, room_code text not null unique, ranked boolean not null,
  capacity integer not null check(capacity between 2 and 5), allowed_sizes integer[] not null,
  state text not null default 'waiting' check(state in('waiting','playing','finished','cancelled')),
  created_at timestamptz not null default now(), started_at timestamptz, deadline_at timestamptz,
  updated_at timestamptz not null default now(), winner_id uuid, settled boolean not null default false
);
create table if not exists public.goat_room_members (
  room_id uuid not null references public.goat_rooms(id) on delete cascade,
  user_id uuid not null references public.goat_profiles(id), accepted_sizes integer[] not null,
  joined_at timestamptz not null default clock_timestamp(), attempts integer not null default 0 check(attempts between 0 and 8),
  state text not null default 'playing' check(state in('playing','won','exhausted','left')),
  tiles jsonb not null default '[]', rating_delta integer not null default 0,
  primary key(room_id,user_id)
);
create table if not exists goat_private.room_answers (
  room_id uuid primary key references public.goat_rooms(id) on delete cascade, data jsonb not null
);
create table if not exists goat_private.room_guesses (
  room_id uuid not null references public.goat_rooms(id) on delete cascade, user_id uuid not null,
  attempt integer not null check(attempt between 1 and 8), player_id text not null, feedback jsonb not null,
  created_at timestamptz not null default clock_timestamp(),primary key(room_id,user_id,attempt),unique(room_id,user_id,player_id)
);
alter table public.goat_rooms enable row level security;
alter table public.goat_room_members enable row level security;
alter table goat_private.room_answers enable row level security;
alter table goat_private.room_guesses enable row level security;
revoke all on public.goat_rooms,public.goat_room_members from public,anon,authenticated;
revoke all on goat_private.room_answers,goat_private.room_guesses from public,anon,authenticated;
grant select on public.goat_rooms,public.goat_room_members to authenticated;
create or replace function public.goat_in_room(p_room uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.goat_room_members where room_id=p_room and user_id=auth.uid());
$$;
revoke all on function public.goat_in_room(uuid) from public,anon;
grant execute on function public.goat_in_room(uuid) to authenticated;
drop policy if exists goat_room_read on public.goat_rooms;
create policy goat_room_read on public.goat_rooms for select to authenticated using(public.goat_in_room(id));
drop policy if exists goat_member_read on public.goat_room_members;
create policy goat_member_read on public.goat_room_members for select to authenticated using(public.goat_in_room(room_id));

create or replace function goat_private.finish_room(p_room uuid,p_winner uuid) returns void
language plpgsql security definer set search_path='' as $$
declare r public.goat_rooms%rowtype;n integer;wr integer;loser record;change integer;total integer:=0;
begin
 select * into r from public.goat_rooms where id=p_room for update;
 if r.settled or r.state<>'playing' then return;end if;
 select count(*) into n from public.goat_room_members where room_id=r.id;
 if p_winner is not null and not exists(select 1 from public.goat_room_members where room_id=r.id and user_id=p_winner and state<>'left') then raise exception 'Invalid winner';end if;
 if r.ranked then
  perform 1 from public.goat_profiles where id in(select user_id from public.goat_room_members where room_id=r.id) order by id for update;
  if p_winner is not null then
   select rating into wr from public.goat_profiles where id=p_winner;
   -- Winner vs every other entrant; K divided by N-1. Each transfer is zero-sum.
   for loser in select p.id,p.rating from public.goat_profiles p join public.goat_room_members m on m.user_id=p.id where m.room_id=r.id and p.id<>p_winner order by p.id loop
    change:=greatest(0,least(loser.rating,round(24::numeric/(n-1)*(1-1/(1+power(10::numeric,(loser.rating-wr)::numeric/400))))::integer));
    update public.goat_profiles set rating=rating-change where id=loser.id;
    update public.goat_room_members set rating_delta=-change where room_id=r.id and user_id=loser.id;
    total:=total+change;
   end loop;
   update public.goat_profiles set rating=rating+total where id=p_winner;
   update public.goat_room_members set rating_delta=total where room_id=r.id and user_id=p_winner;
  end if;
  update public.goat_profiles set played=played+1,
   wins=wins+case when id=p_winner then 1 else 0 end,
   losses=losses+case when p_winner is not null and id<>p_winner then 1 else 0 end,
   draws=draws+case when p_winner is null then 1 else 0 end
   where id in(select user_id from public.goat_room_members where room_id=r.id);
 end if;
 update public.goat_rooms set state='finished',winner_id=p_winner,settled=true,updated_at=clock_timestamp() where id=r.id;
end $$;

create or replace function public.goat_arena_state(p_match uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();r public.goat_rooms%rowtype;members jsonb;guesses jsonb;answer jsonb;
begin
 if uid is null then raise exception '请先登录';end if;
 select * into r from public.goat_rooms where id=p_match for update;
 if not found then return public.goat_state(p_match)||jsonb_build_object('legacy',true);end if;
 if not public.goat_in_room(r.id) then raise exception '无权访问该对局';end if;
 if r.state='waiting' and r.created_at<now()-interval '5 minutes' then update public.goat_rooms set state='cancelled',updated_at=clock_timestamp() where id=r.id;
 elsif r.state='playing' and now()>=r.deadline_at then perform goat_private.finish_room(r.id,null);end if;
 select * into r from public.goat_rooms where id=p_match;
 select coalesce(jsonb_agg(jsonb_build_object('id',m.user_id,'name',p.display_name,'attempts',m.attempts,'state',m.state,'tiles',m.tiles,'delta',m.rating_delta) order by m.joined_at,m.user_id),'[]') into members from public.goat_room_members m join public.goat_profiles p on p.id=m.user_id where m.room_id=r.id;
 select coalesce(jsonb_agg(jsonb_build_object('id',g.player_id,'attempt',g.attempt,'feedback',g.feedback) order by g.attempt),'[]') into guesses from goat_private.room_guesses g where g.room_id=r.id and g.user_id=uid;
 if r.state='finished' then select data into answer from goat_private.room_answers where room_id=r.id;end if;
 return to_jsonb(r)||jsonb_build_object('my_id',uid,'members',members,'guesses',guesses,'answer',answer,'server_time',now());
end $$;

create or replace function public.goat_arena_lobby(p_pool text,p_action text,p_code text default null,p_sizes integer[] default array[2],p_capacity integer default 2) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();r public.goat_rooms%rowtype;sizes integer[];common integer[];n integer;pid text;v text;code text;old_id uuid;
begin
 if uid is null then raise exception '请先登录';end if;
 perform public.goat_profile();
 if p_pool is null or p_pool not in('nba-easy','nba-active','nba-history','cba-easy','cba-active','cba-history','global') or p_action is null or p_action not in('ranked','create','join','resume') then raise exception '无效的对战选项';end if;
 if p_sizes is null or cardinality(p_sizes) not between 1 and 4 or exists(select 1 from unnest(p_sizes) x where x is null or x<2 or x>5) or p_capacity is null or p_capacity not between 2 and 5 then raise exception '请选择2至5人的有效人数';end if;
 select array_agg(distinct x order by x) into sizes from unnest(p_sizes) x;
 perform pg_advisory_xact_lock(733107);
 select q.* into r from public.goat_rooms q join public.goat_room_members m on m.room_id=q.id where m.user_id=uid and q.state in('waiting','playing') order by q.created_at desc limit 1;
 if found then
  if (r.state='waiting' and r.created_at<now()-interval '5 minutes') or (r.state='playing' and r.deadline_at<=now()) then perform public.goat_arena_state(r.id);
  else return public.goat_arena_state(r.id);end if;
 end if;
 select id into old_id from public.goat_matches where (host_id=uid or guest_id=uid) and state in('waiting','playing') order by created_at desc limit 1;
 if old_id is not null then
  if (public.goat_state(old_id)->>'state') in('waiting','playing') then return public.goat_state(old_id)||jsonb_build_object('legacy',true);end if;
 end if;
 if p_action='resume' then return null;end if;
 select id,version into pid,v from goat_private.players where data->'pools' ? p_pool order by random() limit 1;
 if not found then raise exception '对战题库尚未安装';end if;
 if p_action='join' then
  select * into r from public.goat_rooms where room_code=upper(trim(p_code)) and state='waiting' and not ranked and created_at>now()-interval '5 minutes' for update;
  if not found then
   select id into old_id from public.goat_matches where room_code=upper(trim(p_code)) and state='waiting' and not ranked;
   if old_id is not null then return public.goat_lobby(p_pool,'join',p_code)||jsonb_build_object('legacy',true);end if;
   raise exception '房间不存在或已过期';
  end if;
  if r.data_version<>v then raise exception '房间题库版本已更新，请重新建房';end if;
  select count(*) into n from public.goat_room_members where room_id=r.id;
  if n>=r.capacity then raise exception '房间已满';end if;
  sizes:=array[r.capacity];common:=sizes;
 elsif p_action='ranked' then
  select q.* into r from public.goat_rooms q where q.ranked and q.state='waiting' and q.pool=p_pool and q.data_version=v and q.allowed_sizes&&sizes and q.created_at>now()-interval '5 minutes'
   and (select count(*) from public.goat_room_members m where m.room_id=q.id)<(select min(x) from unnest(q.allowed_sizes) x where x=any(sizes))
   order by q.created_at limit 1 for update;
  if found then select array_agg(x order by x) into common from unnest(r.allowed_sizes) x where x=any(sizes);end if;
 end if;
 if p_action='create' or r.id is null then
  if p_action='create' then sizes:=array[p_capacity];end if;
  loop code:=upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));exit when not exists(select 1 from public.goat_rooms where room_code=code);end loop;
  insert into public.goat_rooms(host_id,pool,data_version,room_code,ranked,capacity,allowed_sizes) values(uid,p_pool,v,code,p_action='ranked',sizes[1],sizes) returning * into r;
  insert into goat_private.room_answers(room_id,data) select r.id,data from goat_private.players where id=pid;
  common:=sizes;
 end if;
 insert into public.goat_room_members(room_id,user_id,accepted_sizes) values(r.id,uid,sizes);
 select count(*) into n from public.goat_room_members where room_id=r.id;
 update public.goat_rooms set allowed_sizes=common,capacity=common[1],updated_at=clock_timestamp(),
  state=case when n=common[1] then 'playing' else 'waiting' end,
  started_at=case when n=common[1] then now() else null end,deadline_at=case when n=common[1] then now()+interval '180 seconds' else null end where id=r.id;
 return public.goat_arena_state(r.id);
end $$;

create or replace function public.goat_arena_guess(p_match uuid,p_player text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();r public.goat_rooms%rowtype;m public.goat_room_members%rowtype;g jsonb;a jsonb;f jsonb;tile jsonb;won boolean;last_guess timestamptz;
begin
 if uid is null then raise exception '请先登录';end if;
 select * into r from public.goat_rooms where id=p_match for update;
 if not found then return public.goat_guess(p_match,p_player)||jsonb_build_object('legacy',true);end if;
 select * into m from public.goat_room_members where room_id=r.id and user_id=uid;
 if not found then raise exception '无权访问该对局';end if;
 if r.state<>'playing' then raise exception '本局尚未开始或已经结束';end if;
 if now()>=r.deadline_at then perform goat_private.finish_room(r.id,null);return public.goat_arena_state(r.id);end if;
 if m.state<>'playing' or m.attempts>=8 then raise exception '已退出或八次机会已用完';end if;
 if exists(select 1 from goat_private.room_guesses where room_id=r.id and user_id=uid and player_id=p_player) then raise exception '已经猜过，不消耗次数';end if;
 select max(created_at) into last_guess from goat_private.room_guesses where room_id=r.id and user_id=uid;
 if last_guess>clock_timestamp()-interval '650 milliseconds' then raise exception '提交太快，请稍候';end if;
 select data into g from goat_private.players where id=p_player and version=r.data_version and data->'pools' ? r.pool;
 if g is null then raise exception '请选择当前池的有效球员';end if;
 select data into a from goat_private.room_answers where room_id=r.id;
 won:=p_player=a->>'id';f:=goat_private.feedback(g,a);
 select jsonb_agg(x->>'status') into tile from jsonb_array_elements(f) x;
 insert into goat_private.room_guesses(room_id,user_id,attempt,player_id,feedback) values(r.id,uid,m.attempts+1,p_player,f);
 update public.goat_room_members set attempts=attempts+1,tiles=tiles||jsonb_build_array(tile),state=case when won then 'won' when attempts+1=8 then 'exhausted' else 'playing' end where room_id=r.id and user_id=uid;
 update public.goat_rooms set updated_at=clock_timestamp() where id=r.id;
 if won then perform goat_private.finish_room(r.id,uid);
 elsif not exists(select 1 from public.goat_room_members where room_id=r.id and state='playing') then perform goat_private.finish_room(r.id,null);end if;
 return public.goat_arena_state(r.id);
end $$;

create or replace function public.goat_arena_leave(p_match uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();r public.goat_rooms%rowtype;winner uuid;n integer;
begin
 if uid is null then raise exception '请先登录';end if;
 select * into r from public.goat_rooms where id=p_match for update;
 if not found then return public.goat_leave(p_match)||jsonb_build_object('legacy',true);end if;
 if not public.goat_in_room(r.id) then raise exception '无权访问该对局';end if;
 if r.state='waiting' then
  -- Cancel this unstarted room for all entrants; nobody receives a rating change.
  update public.goat_rooms set state='cancelled',updated_at=clock_timestamp() where id=r.id;
 elsif r.state='playing' then
  if now()>=r.deadline_at then perform goat_private.finish_room(r.id,null);
  else
   update public.goat_room_members set state='left' where room_id=r.id and user_id=uid;
   select count(*) into n from public.goat_room_members where room_id=r.id and state<>'left';
   if n=1 then select user_id into winner from public.goat_room_members where room_id=r.id and state<>'left';perform goat_private.finish_room(r.id,winner);
   elsif not exists(select 1 from public.goat_room_members where room_id=r.id and state='playing') then perform goat_private.finish_room(r.id,null);end if;
   update public.goat_rooms set updated_at=clock_timestamp() where id=r.id;
  end if;
 end if;
 return public.goat_arena_state(r.id);
end $$;
revoke all on function goat_private.finish_room(uuid,uuid) from public,anon,authenticated;
revoke all on function public.goat_arena_state(uuid),public.goat_arena_lobby(text,text,text,integer[],integer),public.goat_arena_guess(uuid,text),public.goat_arena_leave(uuid) from public,anon,authenticated;
grant execute on function public.goat_arena_state(uuid),public.goat_arena_lobby(text,text,text,integer[],integer),public.goat_arena_guess(uuid,text),public.goat_arena_leave(uuid) to authenticated;
create or replace function public.goat_arena_info() returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('minPlayers',2,'maxPlayers',5,'dataVersion',max(version),'playerCount',count(*)) from goat_private.players;
$$;
revoke all on function public.goat_arena_info() from public;
grant execute on function public.goat_arena_info() to anon,authenticated;
do $$begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='goat_rooms') then alter publication supabase_realtime add table public.goat_rooms;end if;
end$$;
