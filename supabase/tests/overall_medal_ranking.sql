-- Read-only validation; no participant results are changed.
begin;
do $$
declare shared jsonb:=public.get_overall_medal_ranking(); private_stats jsonb:=public.get_study_admin_stats(0); mismatches integer; expected integer;
begin
 select count(*) into expected from public.participants where active and not is_admin;
 if jsonb_array_length(shared->'rows')<>expected then raise exception 'Missing active participants'; end if;
 if exists(select 1 from jsonb_array_elements(shared->'rows') p cross join lateral jsonb_object_keys(p) k where k not in ('id','name','medals')) then raise exception 'Unexpected private participant field'; end if;
 if has_function_privilege('authenticated','public.get_overall_medal_ranking()','execute') or has_function_privilege('anon','public.get_overall_medal_ranking()','execute') then raise exception 'Unrestricted RPC'; end if;
 with common as (
  select p->>'id' as id,m->>'game' as game,m->>'place' as place,m->>'total' as total,m->>'correct' as correct,m->>'correct_time_ms' as ms from jsonb_array_elements(shared->'rows') p cross join lateral jsonb_array_elements(p->'medals') m
 ), admin_medals as (
  select p.id,m->>'game' as game,m->>'place' as place,m->>'total' as total,m->>'correct' as correct,m->>'correct_time_ms' as ms from jsonb_array_elements(private_stats->'medals') m join public.participants p on p.user_id::text=m->>'user_id'
 ), differences as ((select * from common except select * from admin_medals) union all (select * from admin_medals except select * from common))
 select count(*) into mismatches from differences;
 if mismatches<>0 then raise exception 'Shared medals disagree with current individual rankings'; end if;
 if exists(select 1 from jsonb_array_elements(shared->'rows') p cross join lateral jsonb_array_elements(p->'medals') m where m->>'game'='harvest-40' or (m->>'game'='harvest-fruits' and m->>'total'<>'40') or (m->>'game'='harvest-vegetables' and m->>'total'<>'32')) then raise exception 'Retired game version counted'; end if;
end $$;
rollback;
