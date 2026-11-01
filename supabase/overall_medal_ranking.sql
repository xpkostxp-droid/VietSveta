-- A limited shared leaderboard, separate from private administrator study statistics.
begin;
create or replace function public.get_overall_medal_ranking() returns jsonb
language sql stable security invoker set search_path=public as $$
 with people as (
  select id,display_name,user_id,ranking_since from public.participants where active and not is_admin
 ), rules(game,total) as (values
 ('beginner-listening-tones',17),('listening-tones',30),('lesson15-verbs',52),('harvest-fruits',40),('harvest-vegetables',32),
 ('questions-15',30),('questions-24',48),('adjectives-tetris',36),('adjectives-rope',36),('adjectives-cannon',34),
 ('lesson5-professions',30),('lesson5-work',28),('lesson7-countries',30),('lesson7-travel',34),('lesson8-people',34),
 ('lesson10-family',38),('lesson11-house',36),('lesson11-adjectives',38),('lesson9-phone',20)
 ), best as (
  select distinct on(a.user_id,a.game) a.user_id,a.game,a.correct,a.total,a.correct_time_ms
  from public.game_attempts a join people p using(user_id) join rules r on a.game=r.game and a.total=r.total
  where a.created_at>=coalesce(p.ranking_since,'1970-01-01'::timestamptz) and a.created_at<=now()
  order by a.user_id,a.game,a.correct desc,a.correct_time_ms,a.created_at
 ), ranked as (
  select *,rank() over(partition by game order by correct desc,correct_time_ms) as place from best
 )
 select jsonb_build_object('generated_at',now(),'rows',coalesce((select jsonb_agg(jsonb_build_object(
  'id',p.id,'name',p.display_name,'medals',coalesce((select jsonb_agg(jsonb_build_object('game',r.game,'place',r.place,'correct',r.correct,'total',r.total,'correct_time_ms',r.correct_time_ms) order by r.place,r.game) from ranked r where r.user_id=p.user_id and r.place<=3),'[]'::jsonb)
 ) order by p.id) from people p),'[]'::jsonb));
$$;
revoke all on function public.get_overall_medal_ranking() from public,anon,authenticated;
grant execute on function public.get_overall_medal_ranking() to service_role;
commit;
