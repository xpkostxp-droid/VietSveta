-- Integration checks run in one rollback-only transaction. No participant history is retained.
begin;
do $$
declare users uuid[]; own_user uuid; other_user uuid; own_id uuid:=gen_random_uuid(); other_id uuid:=gen_random_uuid(); answer_id uuid:=gen_random_uuid(); payload jsonb; n integer;
begin
 select array_agg(user_id) into users from (select user_id from public.participants where active and not is_admin order by id limit 2) p;
 if cardinality(users)<2 then raise exception 'Need two existing participants for RLS validation'; end if;
 own_user:=users[1];other_user:=users[2];
 insert into public.study_activity(id,user_id,day,category,topic,active_ms,updated_at) values(other_id,other_user,(now() at time zone 'Asia/Ho_Chi_Minh')::date,'games','statistics-rls-check',1000,now());
 perform set_config('request.jwt.claim.sub',own_user::text,true);
 execute 'set local role authenticated';
 insert into public.study_activity(id,user_id,day,category,topic,active_ms,updated_at) values(own_id,own_user,(now() at time zone 'Asia/Ho_Chi_Minh')::date,'games','statistics-rls-check',2000,now()) on conflict(id) do update set active_ms=excluded.active_ms;
 insert into public.study_activity(id,user_id,day,category,topic,active_ms,updated_at) values(own_id,own_user,(now() at time zone 'Asia/Ho_Chi_Minh')::date,'games','statistics-rls-check',3000,now()) on conflict(id) do update set active_ms=excluded.active_ms;
 select count(*) into n from public.study_activity where id=other_id;
 if n<>0 then raise exception 'Cross-account read allowed'; end if;
 begin
  insert into public.study_activity(id,user_id,day,category,topic,active_ms,updated_at) values(gen_random_uuid(),other_user,(now() at time zone 'Asia/Ho_Chi_Minh')::date,'games','statistics-rls-check',1000,now());
  raise exception 'Cross-account write allowed';
 exception when insufficient_privilege then null; end;
 insert into public.study_answers(id,user_id,topic,vi,ru,direction,chosen,result,elapsed_ms,created_at) values(answer_id,own_user,'statistics-rls-check','nghĩ','думать','ru-vi','ngủ','wrong',1200,now()) on conflict(id) do nothing;
 insert into public.study_answers(id,user_id,topic,vi,ru,direction,chosen,result,elapsed_ms,created_at) values(answer_id,own_user,'statistics-rls-check','nghĩ','думать','ru-vi','ngủ','wrong',1200,now()) on conflict(id) do nothing;
 begin
  perform public.get_study_admin_stats(7);
  raise exception 'Participant can read group statistics';
 exception when insufficient_privilege then null; end;
 begin
  delete from public.study_answers where id=answer_id;
  raise exception 'Participant can delete answers';
 exception when insufficient_privilege then null; end;
 execute 'reset role';
 payload:=public.get_study_admin_stats(1);
 select count(*) into n from jsonb_array_elements(payload->'words') w where w->>'topic'='statistics-rls-check' and w->>'shows'='1' and w->>'errors'='1' and w->'confusions'->0->>'chosen'='ngủ';
 if n<>1 then raise exception 'Answer aggregation or retry deduplication failed'; end if;
 select count(*) into n from jsonb_array_elements(payload->'activity') a where a->>'user_id'=own_user::text and a->>'topic'='statistics-rls-check' and a->>'active_ms'='3000';
 if n<>1 then raise exception 'Cumulative activity upsert failed'; end if;
end $$;
do $$
declare all_stats jsonb:=public.get_study_admin_stats(0); today_stats jsonb:=public.get_study_admin_stats(1); expected integer;
begin
 select count(*) into expected from public.game_attempts a join public.participants p using(user_id) where p.active and not p.is_admin and a.created_at<='now'::timestamptz;
 if jsonb_array_length(all_stats->'attempts')<>expected then raise exception 'All-time history is incomplete'; end if;
 if jsonb_array_length(all_stats->'attempts')<jsonb_array_length(today_stats->'attempts') then raise exception 'Period filter is reversed'; end if;
 if jsonb_typeof(all_stats->'saved_learning')<>'array' then raise exception 'Saved learning is missing'; end if;
end $$;
rollback;
