begin;
create table public.study_activity (
 id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
 day date not null, category text not null check(category in ('games','cards','audio','theory','visit')),
 topic text not null check(length(topic) between 1 and 100),
 active_ms integer not null check(active_ms between 0 and 86400000),
 updated_at timestamptz not null check(updated_at <= now()+interval '1 day'),
 created_at timestamptz not null default now()
);
create table public.study_answers (
 id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
 topic text not null check(length(topic) between 1 and 100),
 vi text not null check(length(vi) between 1 and 200), ru text not null check(length(ru)<=200),
 direction text not null check(direction in ('ru-vi','vi-ru','listening')),
 chosen text check(length(chosen)<=200), result text not null check(result in ('correct','wrong','timeout')),
 elapsed_ms integer not null check(elapsed_ms between 0 and 60000),
 created_at timestamptz not null check(created_at<=now()+interval '1 day')
);
create index study_activity_user_day on public.study_activity(user_id,day);
create index study_answers_date_user on public.study_answers(created_at,user_id);
create index study_answers_user_date on public.study_answers(user_id,created_at desc);
alter table public.study_activity enable row level security;
alter table public.study_answers enable row level security;
revoke all on public.study_activity,public.study_answers from public,anon,authenticated;
grant select,insert,update on public.study_activity to authenticated;
grant select,insert on public.study_answers to authenticated;
grant all on public.study_activity,public.study_answers to service_role;
create policy study_activity_own on public.study_activity for all to authenticated
 using(user_id=(select auth.uid()) and exists(select 1 from public.participants p where p.user_id=(select auth.uid()) and p.active and not p.is_admin))
 with check(user_id=(select auth.uid()) and exists(select 1 from public.participants p where p.user_id=(select auth.uid()) and p.active and not p.is_admin));
create policy study_answers_read on public.study_answers for select to authenticated
 using(user_id=(select auth.uid()) and exists(select 1 from public.participants p where p.user_id=(select auth.uid()) and p.active and not p.is_admin));
create policy study_answers_insert on public.study_answers for insert to authenticated
 with check(user_id=(select auth.uid()) and exists(select 1 from public.participants p where p.user_id=(select auth.uid()) and p.active and not p.is_admin));
-- Invoker rights: only the service role may call this cross-participant read.
-- The Edge Function authenticates the caller and checks participants.is_admin first.
create function public.get_study_admin_stats(p_days integer default 7) returns jsonb
language plpgsql stable security invoker set search_path=public as $$
declare since_at timestamptz; stats_payload jsonb;
begin
 if p_days is null or p_days not in (0,1,7,30) then raise exception 'invalid period'; end if;
 since_at:=case when p_days=0 then '1970-01-01'::timestamptz else (((now() at time zone 'Asia/Ho_Chi_Minh')::date-(p_days-1))::timestamp at time zone 'Asia/Ho_Chi_Minh') end;
 with people as (
  select id,display_name,user_id,course_group,ranking_since from participants where active and not is_admin
 ), saved_learning as (
  select s.user_id,
   jsonb_build_object('progress',coalesce(s.data->'vietCards.progress.v1'->'value'->'records','{}'::jsonb),'theory',coalesce(s.data->'vietCards.theoryVisits.v1'->'value','{}'::jsonb),'last',s.data->'vietCards.lastActivity.v1'->'value') as advanced,
   jsonb_build_object('progress',coalesce(s.data->'vietSveta.beginner.vietCards.progress.v1'->'value'->'records','{}'::jsonb),'theory',coalesce(s.data->'vietSveta.beginner.vietCards.theoryVisits.v1'->'value','{}'::jsonb),'last',s.data->'vietSveta.beginner.vietCards.lastActivity.v1'->'value') as beginner,
   coalesce(s.data->'vietSveta.marketBlitz.errors.v2'->'value','[]'::jsonb) as market_errors,
   coalesce((select jsonb_agg(jsonb_build_object('game',substring(e.key from '^vietSveta\.gameRecord\.(.+)\.v[12]$'),'record',e.value->'value')) from jsonb_each(s.data) e where e.key ~ '^vietSveta\.gameRecord\..+\.v[12]$'),'[]'::jsonb) as bests
  from learning_state s join people p using(user_id)
 ), coverage as (
  select a.user_id,min(a.created_at) as first_seen,max(a.updated_at) as last_seen from study_activity a join people p using(user_id) group by a.user_id
 ), activity as (
  select a.user_id,a.day,a.category,a.topic,sum(a.active_ms) as active_ms from study_activity a join people p using(user_id)
  where a.day >= (since_at at time zone 'Asia/Ho_Chi_Minh')::date and a.day <= (now() at time zone 'Asia/Ho_Chi_Minh')::date
  group by a.user_id,a.day,a.category,a.topic
 ), answer_source as (
  select a.* from study_answers a join people p using(user_id) where a.created_at>=since_at and a.created_at<=now()
 ), confusion as (
  select user_id,topic,vi,ru,direction,chosen,count(*) as count from answer_source
  where result='wrong' and chosen is not null group by user_id,topic,vi,ru,direction,chosen
 ), words as (
  select user_id,topic,vi,ru,direction,count(*) as shows,
   count(*) filter(where result<>'correct') as errors,
   count(*) filter(where result='timeout') as timeouts,
   count(*) filter(where result='correct') as correct,
   coalesce(sum(elapsed_ms) filter(where result='correct'),0) as correct_ms,
   max(created_at) filter(where result<>'correct') as last_error,
   to_jsonb((array_agg(jsonb_build_object('result',result,'at',created_at) order by created_at desc,id desc))[1:5]) as recent
  from answer_source group by user_id,topic,vi,ru,direction
 ), enriched as (
  select w.*,coalesce((select jsonb_agg(to_jsonb(c)) from (
   select chosen,count from confusion c where c.user_id=w.user_id and c.topic=w.topic and c.vi=w.vi and c.ru=w.ru and c.direction=w.direction order by count desc,chosen limit 3
  ) c),'[]'::jsonb) as confusions from words w
 ), rules(game,total) as (values
 ('lesson15-verbs',52),('harvest-fruits',40),('harvest-vegetables',32),
 ('questions-15',30),('questions-24',48),('adjectives-tetris',36),('adjectives-rope',36),('adjectives-cannon',34),
 ('lesson5-professions',30),('lesson5-work',28),('lesson7-countries',30),('lesson7-travel',34),('lesson8-people',34),
 ('lesson10-family',38),('lesson11-house',36),('lesson11-adjectives',38),('lesson9-phone',20)
 ), best as (
  select distinct on(a.user_id,a.game) a.user_id,a.game,a.correct,a.total,a.correct_time_ms
  from game_attempts a join people p using(user_id) join rules r on a.game=r.game and a.total=r.total
  where a.created_at>=coalesce(p.ranking_since,'1970-01-01'::timestamptz)
  order by a.user_id,a.game,a.correct desc,a.correct_time_ms,a.created_at
 ), ranked as (
  select *,rank() over(partition by game order by correct desc,correct_time_ms) as place from best
 ), attempts as (
  select a.* from game_attempts a join people p using(user_id) where a.created_at>=since_at and a.created_at<=now()
 )
 select jsonb_build_object(
  'since',since_at,'generated_at',now(),'timezone','Asia/Ho_Chi_Minh',
  'saved_learning',coalesce((select jsonb_agg(to_jsonb(s)) from saved_learning s),'[]'::jsonb),
  'participants',coalesce((select jsonb_agg(to_jsonb(p)) from people p),'[]'::jsonb),
  'coverage',coalesce((select jsonb_agg(to_jsonb(c)) from coverage c),'[]'::jsonb),
  'activity',coalesce((select jsonb_agg(to_jsonb(a)) from activity a),'[]'::jsonb),
  'words',coalesce((select jsonb_agg(to_jsonb(w)) from enriched w),'[]'::jsonb),
  'medals',coalesce((select jsonb_agg(to_jsonb(r)) from ranked r where place<=3),'[]'::jsonb),
  'attempts',coalesce((select jsonb_agg(to_jsonb(a) order by created_at desc) from attempts a),'[]'::jsonb)
 ) into stats_payload;
 return stats_payload;
end $$;
revoke all on function public.get_study_admin_stats(integer) from public,anon,authenticated;
grant execute on function public.get_study_admin_stats(integer) to service_role;
commit;
