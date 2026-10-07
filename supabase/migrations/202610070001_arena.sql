-- Run as project owner in Supabase SQL Editor. No browser/service secrets here.
create schema if not exists goat_private;
revoke all on schema goat_private from public, anon, authenticated;

create table if not exists public.goat_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 24),
  rating integer not null default 1000 check (rating >= 0),
  wins integer not null default 0, losses integer not null default 0,
  draws integer not null default 0, played integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists goat_private.players (
  id text primary key, version text not null, data jsonb not null
);
create table if not exists goat_private.install_settings (
  singleton boolean primary key default true check(singleton),
  token_hash text not null, expires_at timestamptz not null, version text not null,
  active boolean not null default true
);
create table if not exists public.goat_matches (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.goat_profiles(id),
  guest_id uuid references public.goat_profiles(id),
  pool text not null, data_version text not null,
  room_code text not null unique, ranked boolean not null default false,
  state text not null default 'waiting' check(state in ('waiting','playing','finished','cancelled')),
  created_at timestamptz not null default now(), started_at timestamptz, deadline_at timestamptz,
  host_attempts integer not null default 0, guest_attempts integer not null default 0,
  host_state text not null default 'playing', guest_state text not null default 'playing',
  host_tiles jsonb not null default '[]', guest_tiles jsonb not null default '[]',
  winner_id uuid, host_delta integer not null default 0, guest_delta integer not null default 0,
  settled boolean not null default false,
  check (host_id is distinct from guest_id)
);
create index if not exists goat_matches_queue on public.goat_matches(pool,created_at) where state='waiting';
create table if not exists goat_private.answers (
  match_id uuid primary key references public.goat_matches(id) on delete cascade,
  player_id text not null references goat_private.players(id)
);
create table if not exists goat_private.guesses (
  match_id uuid not null references public.goat_matches(id) on delete cascade,
  user_id uuid not null, attempt integer not null check(attempt between 1 and 8),
  player_id text not null, feedback jsonb not null,
  created_at timestamptz not null default clock_timestamp(),
  primary key(match_id,user_id,attempt), unique(match_id,user_id,player_id)
);
alter table public.goat_profiles enable row level security;
alter table public.goat_matches enable row level security;
drop policy if exists goat_profile_read on public.goat_profiles;
create policy goat_profile_read on public.goat_profiles for select to authenticated using(true);
drop policy if exists goat_match_participant on public.goat_matches;
create policy goat_match_participant on public.goat_matches for select to authenticated
  using(auth.uid()=host_id or auth.uid()=guest_id);
revoke all on public.goat_profiles,public.goat_matches from anon,authenticated;
grant select on public.goat_profiles,public.goat_matches to authenticated;
revoke all on all tables in schema goat_private from public,anon,authenticated;

create or replace function public.goat_profile(p_name text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); result jsonb; name text;
begin
  if uid is null then raise exception '请先登录'; end if;
  name:=trim(coalesce(p_name,(select raw_user_meta_data->>'display_name' from auth.users where id=uid),'球迷'||left(replace(uid::text,'-',''),8)));
  if char_length(name)<2 or char_length(name)>24 or name ~ '[[:cntrl:]<>]' then raise exception '昵称需为2–24个可显示字符'; end if;
  insert into public.goat_profiles(id,display_name) values(uid,name) on conflict(id) do nothing;
  if p_name is not null then update public.goat_profiles set display_name=name where id=uid; end if;
  select to_jsonb(p) into result from public.goat_profiles p where id=uid;
  return result;
end $$;

-- Fixed default ten clues. The server accepts no custom module parameter.
create or replace function goat_private.feedback(g jsonb,a jsonb) returns jsonb
language plpgsql immutable set search_path='' as $$
declare keys text[]:=array['teams','positions','birthYear','heightCm','firstSeasonYear','teamCount','playoffAppearances','finalsAppearances','pointsPerGame','mvpCount'];
  tolerances numeric[]:=array[0,0,3,3,2,1,1,1,2,1]; i integer; k text;
  status text; direction text; delta numeric; gv text[]; av text[]; intersects boolean; gc jsonb; ac jsonb; out jsonb:='[]';
begin
  for i in 1..10 loop
    k:=keys[i];status:='unknown';direction:=null;
    if k in ('teams','positions') then
      if k='teams' then
        select array_agg(distinct x->>'id' order by x->>'id') into gv from jsonb_array_elements(coalesce(g->k,'[]')) x;
        select array_agg(distinct x->>'id' order by x->>'id') into av from jsonb_array_elements(coalesce(a->k,'[]')) x;
      else
        select array_agg(distinct x order by x) into gv from jsonb_array_elements_text(coalesce(g->k,'[]')) x;
        select array_agg(distinct x order by x) into av from jsonb_array_elements_text(coalesce(a->k,'[]')) x;
      end if;
      if cardinality(gv)>0 and cardinality(av)>0 then
        intersects:=gv&&av;
        if (k='positions' or (g->>'teamsComplete'='true' and a->>'teamsComplete'='true')) then
          status:=case when gv=av then 'correct' when intersects then 'close' else 'wrong' end;
        elsif intersects then status:='close'; end if;
      end if;
    elsif jsonb_typeof(g->k)='number' and jsonb_typeof(a->k)='number' then
      if i>=6 then
        gc:=g->'metricCoverage'->k;ac:=a->'metricCoverage'->k;
        if gc->>'complete' is distinct from 'true' or ac->>'complete' is distinct from 'true'
          or gc->>'scope' is null or gc->>'scope' is distinct from ac->>'scope'
          or gc->>'throughSeason' is null or gc->>'throughSeason' is distinct from ac->>'throughSeason' then
          out:=out||jsonb_build_array(jsonb_build_object('key',k,'status',status,'direction',direction));continue;
        end if;
      end if;
      if k='firstSeasonYear' and (g->>'firstSeasonScope' is null or g->>'firstSeasonScope' is distinct from a->>'firstSeasonScope') then
        status:='unknown';
      else
        delta:=(a->>k)::numeric-(g->>k)::numeric;
        status:=case when abs(delta)<0.00001 then 'correct' when abs(delta)<=tolerances[i]+0.00001 then 'close' else 'wrong' end;
        direction:=case when abs(delta)<0.00001 then null when delta>0 then 'up' else 'down' end;
      end if;
    end if;
    out:=out||jsonb_build_array(jsonb_build_object('key',k,'status',status,'direction',direction));
  end loop;
  return out;
end $$;

create or replace function goat_private.finish(p_match uuid,p_winner uuid) returns void
language plpgsql security definer set search_path='' as $$
declare m public.goat_matches%rowtype;hr integer;gr integer;change integer;score numeric;
begin
  select * into m from public.goat_matches where id=p_match for update;
  if m.settled or m.guest_id is null then return; end if;
  if p_winner is not null and p_winner<>m.host_id and p_winner<>m.guest_id then raise exception 'Invalid winner'; end if;
  if m.ranked then
    -- All profile locks use stable UUID order, including concurrent games.
    perform 1 from public.goat_profiles where id in(m.host_id,m.guest_id) order by id for update;
    select rating into hr from public.goat_profiles where id=m.host_id;
    select rating into gr from public.goat_profiles where id=m.guest_id;
    score:=case when p_winner is null then 0.5 when p_winner=m.host_id then 1 else 0 end;
    change:=round(24*(score-1/(1+power(10::numeric,(gr-hr)::numeric/400))));
    change:=greatest(-hr,least(gr,change));
    update public.goat_profiles set rating=rating+change,played=played+1,
      wins=wins+case when p_winner=m.host_id then 1 else 0 end,
      losses=losses+case when p_winner=m.guest_id then 1 else 0 end,
      draws=draws+case when p_winner is null then 1 else 0 end where id=m.host_id;
    update public.goat_profiles set rating=rating-change,played=played+1,
      wins=wins+case when p_winner=m.guest_id then 1 else 0 end,
      losses=losses+case when p_winner=m.host_id then 1 else 0 end,
      draws=draws+case when p_winner is null then 1 else 0 end where id=m.guest_id;
  else change:=0; end if;
  update public.goat_matches set state='finished',winner_id=p_winner,settled=true,
    host_delta=change,guest_delta=-change where id=p_match;
end $$;

create or replace function public.goat_state(p_match uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();m public.goat_matches%rowtype;result jsonb;history jsonb;answer jsonb;
begin
  if uid is null then raise exception '请先登录'; end if;
  select * into m from public.goat_matches where id=p_match for update;
  if not found or (uid<>m.host_id and uid is distinct from m.guest_id) then raise exception '无权访问该对局'; end if;
  if m.state='waiting' and m.created_at<now()-interval '5 minutes' then
    update public.goat_matches set state='cancelled' where id=m.id;
  elsif m.state='playing' and now()>=m.deadline_at then
    perform goat_private.finish(m.id,null);
  end if;
  select * into m from public.goat_matches where id=p_match;
  select coalesce(jsonb_agg(jsonb_build_object('id',g.player_id,'feedback',g.feedback,'attempt',g.attempt) order by g.attempt),'[]')
    into history from goat_private.guesses g where g.match_id=m.id and g.user_id=uid;
  if m.state='finished' then select p.data into answer from goat_private.answers a join goat_private.players p on p.id=a.player_id where a.match_id=m.id;end if;
  result:=to_jsonb(m)||jsonb_build_object('my_id',uid,'guesses',history,'answer',answer,
    'host_name',(select display_name from public.goat_profiles where id=m.host_id),
    'guest_name',(select display_name from public.goat_profiles where id=m.guest_id),'server_time',now());
  return result;
end $$;

create or replace function public.goat_lobby(p_pool text,p_action text,p_code text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();m public.goat_matches%rowtype;pid text;version text;code text;candidate uuid;
begin
  if uid is null then raise exception '请先登录'; end if;
  perform public.goat_profile();
  if p_pool not in('nba-easy','nba-active','nba-history','cba-easy','cba-active','cba-history','global') or p_action not in('ranked','create','join','resume') then raise exception '无效的对战选项'; end if;
  perform pg_advisory_xact_lock(733107);
  select * into m from public.goat_matches where (host_id=uid or guest_id=uid) and state in('waiting','playing') order by created_at desc limit 1;
  if found then
    if (m.state='waiting' and m.created_at<now()-interval '5 minutes') or (m.state='playing' and m.deadline_at<=now()) then
      perform public.goat_state(m.id);
    else return public.goat_state(m.id); end if;
  end if;
  if p_action='resume' then return null; end if;
  select p.version,p.id into version,pid from goat_private.players p where p.data->'pools' ? p_pool order by random() limit 1;
  if not found then raise exception '对战题库尚未安装'; end if;
  if p_action='join' then
    select * into m from public.goat_matches where room_code=upper(trim(p_code)) and state='waiting' and not ranked and created_at>now()-interval '5 minutes' for update;
    if not found then raise exception '房间不存在或已过期'; end if;
    if m.host_id=uid then raise exception '不能加入自己的房间'; end if;
    if m.data_version<>version then raise exception '房间题库版本已更新，请重新建房'; end if;
    update public.goat_matches set guest_id=uid,state='playing',started_at=now(),deadline_at=now()+interval '180 seconds' where id=m.id;
    return public.goat_state(m.id);
  elsif p_action='ranked' then
    select id into candidate from public.goat_matches where state='waiting' and ranked and pool=p_pool and data_version=version and host_id<>uid and created_at>now()-interval '5 minutes' order by created_at limit 1 for update;
    if candidate is not null then
      update public.goat_matches set guest_id=uid,state='playing',started_at=now(),deadline_at=now()+interval '180 seconds' where id=candidate;
      return public.goat_state(candidate);
    end if;
  end if;
  loop
    code:=upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
    exit when not exists(select 1 from public.goat_matches where room_code=code);
  end loop;
  insert into public.goat_matches(host_id,pool,data_version,room_code,ranked) values(uid,p_pool,version,code,p_action='ranked') returning * into m;
  insert into goat_private.answers(match_id,player_id) values(m.id,pid);
  return public.goat_state(m.id);
end $$;

create or replace function public.goat_guess(p_match uuid,p_player text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();m public.goat_matches%rowtype;g jsonb;a jsonb;feedback jsonb;attempt integer;is_host boolean;won boolean;tile jsonb;last_guess timestamptz;
begin
  if uid is null then raise exception '请先登录'; end if;
  select * into m from public.goat_matches where id=p_match for update;
  if not found or (uid<>m.host_id and uid is distinct from m.guest_id) then raise exception '无权访问该对局'; end if;
  if m.state<>'playing' then raise exception '本局尚未开始或已经结束';end if;
  if now()>=m.deadline_at then perform goat_private.finish(m.id,null);return public.goat_state(m.id);end if;
  is_host:=uid=m.host_id;attempt:=case when is_host then m.host_attempts else m.guest_attempts end+1;
  if attempt>8 then raise exception '八次机会已用完';end if;
  if exists(select 1 from goat_private.guesses where match_id=m.id and user_id=uid and player_id=p_player) then raise exception '已经猜过，不消耗次数'; end if;
  select max(created_at) into last_guess from goat_private.guesses where match_id=m.id and user_id=uid;
  if last_guess>clock_timestamp()-interval '650 milliseconds' then raise exception '提交太快，请稍候';end if;
  select data into g from goat_private.players where id=p_player and version=m.data_version and data->'pools' ? m.pool;
  if g is null then raise exception '请选择当前池的有效球员';end if;
  select p.data into a from goat_private.answers x join goat_private.players p on p.id=x.player_id where x.match_id=m.id;
  won:=p_player=a->>'id';feedback:=goat_private.feedback(g,a);
  select jsonb_agg(x->>'status') into tile from jsonb_array_elements(feedback) x;
  insert into goat_private.guesses(match_id,user_id,attempt,player_id,feedback) values(m.id,uid,attempt,p_player,feedback);
  if is_host then update public.goat_matches set host_attempts=attempt,host_tiles=host_tiles||jsonb_build_array(tile),host_state=case when won then 'won' when attempt=8 then 'exhausted' else 'playing' end where id=m.id;
  else update public.goat_matches set guest_attempts=attempt,guest_tiles=guest_tiles||jsonb_build_array(tile),guest_state=case when won then 'won' when attempt=8 then 'exhausted' else 'playing' end where id=m.id;end if;
  if won then perform goat_private.finish(m.id,uid);
  elsif (select host_attempts=8 and guest_attempts=8 from public.goat_matches where id=m.id) then perform goat_private.finish(m.id,null);end if;
  return public.goat_state(m.id);
end $$;

create or replace function public.goat_leave(p_match uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();m public.goat_matches%rowtype;
begin
  if uid is null then raise exception '请先登录';end if;
  select * into m from public.goat_matches where id=p_match for update;
  if not found or (uid<>m.host_id and uid is distinct from m.guest_id) then raise exception '无权访问该对局';end if;
  if m.state='waiting' then update public.goat_matches set state='cancelled' where id=m.id;
  elsif m.state='playing' then
    if now()>=m.deadline_at then perform goat_private.finish(m.id,null);
    else perform goat_private.finish(m.id,case when uid=m.host_id then m.guest_id else m.host_id end);end if;
  end if;
  return public.goat_state(m.id);
end $$;

create or replace function public.goat_leaderboard() returns jsonb
language sql security definer set search_path='' as $$
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') from
  (select display_name,rating,wins,losses,draws,played from public.goat_profiles where played>0 order by rating desc,wins desc,created_at,id limit 100) x;
$$;
-- Project-owner setup issues a two-hour import capability. It can only load
-- default clue facts, cannot modify accounts/matches, and is revoked on finish.
create or replace function public.goat_seed(p_token text,p_players jsonb,p_version text,p_finish boolean default false) returns integer
language plpgsql security definer set search_path='' as $$
declare settings goat_private.install_settings%rowtype;x jsonb;n integer:=0;
begin
  select * into settings from goat_private.install_settings where singleton=true for update;
  if not found or not settings.active or settings.expires_at<=now() or p_version is distinct from settings.version
    or p_token is null or settings.token_hash is distinct from encode(sha256(convert_to(p_token,'UTF8')),'hex') then raise exception '安装授权无效或已过期';end if;
  if jsonb_typeof(p_players) is distinct from 'array' or jsonb_array_length(p_players)>250 then raise exception 'Invalid import batch';end if;
  for x in select value from jsonb_array_elements(p_players) loop
    if jsonb_typeof(x) is distinct from 'object' or jsonb_typeof(x->'id') is distinct from 'string' or length(x->>'id')>120 or jsonb_typeof(x->'pools') is distinct from 'array' then raise exception 'Invalid player facts';end if;
    insert into goat_private.players(id,version,data) values(x->>'id',p_version,x)
      on conflict(id) do update set version=excluded.version,data=excluded.data;n:=n+1;
  end loop;
  if p_finish then update goat_private.install_settings set active=false where singleton=true;end if;
  return n;
end $$;
revoke all on all functions in schema goat_private from public,anon,authenticated;
revoke all on function public.goat_profile(text),public.goat_state(uuid),public.goat_lobby(text,text,text),public.goat_guess(uuid,text),public.goat_leave(uuid),public.goat_leaderboard() from public,anon,authenticated;
grant execute on function public.goat_profile(text),public.goat_state(uuid),public.goat_lobby(text,text,text),public.goat_guess(uuid,text),public.goat_leave(uuid),public.goat_leaderboard() to authenticated;
grant execute on function public.goat_leaderboard() to anon;
revoke all on function public.goat_seed(text,jsonb,text,boolean) from public;
grant execute on function public.goat_seed(text,jsonb,text,boolean) to anon,authenticated;
-- Database changes contain counts and color grids only, never the hidden answer.
do $$begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime')
    and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='goat_matches') then
    alter publication supabase_realtime add table public.goat_matches;
  end if;
end$$;
