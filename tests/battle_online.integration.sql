-- Run through the database admin connection. All simulated matches are rolled back.
begin;
do $$
declare p record; uid_h uuid; uid_g uuid; dh uuid; dg uuid; topic text;
 s jsonb; other jsonb; m battle_private.matches%rowtype; base integer; correct integer;
 h text; g text; chars jsonb; count_results integer; blocked boolean;
begin
 for p in select id,user_id from public.participants where active loop
  perform set_config('request.jwt.claim.sub',p.user_id::text,true);
  dh:=gen_random_uuid();
  s:=public.battle_preview('poll',dh,'{}');
  if s->'topics' is null then raise exception 'No Battle access for %',p.id; end if;
  s:=public.battle_statistics();
  if s->>'viewer_id'<>p.id then raise exception 'No statistics access for %',p.id; end if;
  perform public.battle_preview('leave',dh,'{}');
 end loop;
 foreach topic in array array['fruits','vegetables','harvest','questions'] loop
  h:=case when topic='vegetables' then 'lesya' else 'sergey-p' end;
  g:=case when topic in ('vegetables','harvest') then 'marina' else 'sergey-k' end;
  select user_id into uid_h from public.participants where id=h;
  select user_id into uid_g from public.participants where id=g;
  dh:=gen_random_uuid();dg:=gen_random_uuid();
  perform set_config('request.jwt.claim.sub',uid_g::text,true);
  perform public.battle_preview('poll',dg,'{}');
  perform set_config('request.jwt.claim.sub',uid_h::text,true);
  s:=public.battle_preview('invite',dh,jsonb_build_object('opponent',dg,'topic',topic));
  select * into m from battle_private.matches where id=(s->'match'->>'id')::uuid;
  if m.host_member_id<>h or m.guest_member_id<>g then raise exception 'Lost match identities'; end if;
  base:=least(10,(select jsonb_array_length(words) from battle_private.topics where id=topic));
  if topic='questions' then
   if m.mode<>'pickleball' or jsonb_array_length(m.tasks)<>base*2 then raise exception 'Pickleball changed'; end if;
  else
   if m.mode<>'ninja' or jsonb_array_length(m.tasks)<>base then raise exception 'Incorrect ninja round count'; end if;
   if m.host_character not like (case when h='lesya' then '%-woman' else '%-man' end) or m.guest_character not like (case when g='marina' then '%-woman' else '%-man' end) then raise exception 'Wrong gender'; end if;
   if h<>'lesya' and g='sergey-k' and m.host_character=m.guest_character or h='lesya' and m.host_character=m.guest_character then raise exception 'Repeated character'; end if;
   if exists(select 1 from jsonb_array_elements(m.tasks) x where x->>'word' ~ '[A-Za-z]' or x->'options'->>0 ~ '[А-Яа-я]') then raise exception 'Ninja direction changed'; end if;
   if (select count(distinct x->>'word') from jsonb_array_elements(m.tasks) x)<>base then raise exception 'Repeated fruit'; end if;
  end if;
  chars:=jsonb_build_array(m.host_character,m.guest_character);
  perform set_config('request.jwt.claim.sub',uid_g::text,true);
  other:=public.battle_preview('accept',dg,jsonb_build_object('match',m.id));
  if other->'match'->>'side'<>'guest' or other->'match'->>'host_character' is distinct from s->'match'->>'host_character' then raise exception 'Clients disagree on characters'; end if;
  perform public.battle_preview('ready',dg,jsonb_build_object('match',m.id));
  perform set_config('request.jwt.claim.sub',uid_h::text,true);
  s:=public.battle_preview('ready',dh,jsonb_build_object('match',m.id));
  if (s->'match'->>'starts_at')::timestamptz<clock_timestamp()+interval '2 seconds' then raise exception 'Missing startup countdown'; end if;
  if topic<>'questions' then
   blocked:=false;
   begin perform public.battle_preview('answer',dh,jsonb_build_object('match',m.id,'round',0,'choice',0,'elapsed',0)); exception when others then blocked:=true; end;
   if not blocked then raise exception 'Early answer accepted'; end if;
   update battle_private.matches set starts_at=clock_timestamp()-interval '1 second' where id=m.id;
   correct:=(m.tasks->0->>'answer')::integer;
   s:=public.battle_preview('answer',dh,jsonb_build_object('match',m.id,'round',0,'choice',(correct+1)%3,'elapsed',1000));
   if (s->'match'->>'round')::integer<>0 or jsonb_array_length(s->'match'->'attempts')<>1 then raise exception 'Wrong answer ended round'; end if;
   perform set_config('request.jwt.claim.sub',uid_g::text,true);
   s:=public.battle_preview('answer',dg,jsonb_build_object('match',m.id,'round',0,'choice',correct,'elapsed',1100));
   if s->'match'->>'score_guest'<>'1' or s->'match'->>'score_host'<>'0' or s->'match'->'last_result'->>'winner'<>'guest' then raise exception 'Wrong winner'; end if;
   if s->'match'->'last_result'->>'word' is null or s->'match'->'last_result'->>'at' is null or s->'match'->'last_result'->>'starts_at' is null then raise exception 'Missing round reveal'; end if;
   update battle_private.matches set starts_at=clock_timestamp()-interval '7 seconds' where id=m.id;
   s:=public.battle_preview('poll',dg,'{}');
   if s->'match'->'last_result'->>'winner'<>'none' or s->'match'->>'score_guest'<>'1' then raise exception 'Timeout awarded points'; end if;
   -- Make all base rounds a tie, then verify that play continues until a winner.
   update battle_private.matches set round=base-1,results=(select jsonb_agg(jsonb_build_object('winner','none')) from generate_series(1,base-1)),starts_at=clock_timestamp()-interval '7 seconds',answers='{}',settle_at=null where id=m.id;
   s:=public.battle_preview('poll',dg,'{}');
   if s->'match'->>'status'<>'active' or (s->'match'->>'round')::integer<>base then raise exception 'Tie did not enter overtime'; end if;
   select x.* into m from battle_private.matches x where x.id=m.id;
   if jsonb_array_length(m.tasks)<>base+1 or jsonb_build_array(m.host_character,m.guest_character)<>chars then raise exception 'Overtime/characters changed'; end if;
   correct:=(m.tasks->base->>'answer')::integer;
   update battle_private.matches set starts_at=clock_timestamp()-interval '1 second' where id=m.id;
   s:=public.battle_preview('answer',dg,jsonb_build_object('match',m.id,'round',base,'choice',correct,'elapsed',1000));
   update battle_private.matches set settle_at=clock_timestamp()-interval '1 millisecond' where id=m.id;
   s:=public.battle_preview('poll',dg,'{}');
   if s->'match'->>'status'<>'finished' or s->'match'->>'score_guest'<>'1' then raise exception 'Overtime did not finish'; end if;
   other:=public.battle_statistics();
   if not exists(select 1 from jsonb_array_elements(other->'matches') x where x->>'id'=m.id::text and x->>'guest_id'=g and x->>'score_guest'='1') then raise exception 'No saved statistics'; end if;
   s:=public.battle_preview('rematch',dg,jsonb_build_object('match',m.id));
   if s->'match'->>'status'<>'invited' or s->'match'->>'topic'<>topic then raise exception 'Rematch failed'; end if;
  end if;
  perform set_config('request.jwt.claim.sub',uid_h::text,true);perform public.battle_preview('leave',dh,'{}');
  perform set_config('request.jwt.claim.sub',uid_g::text,true);perform public.battle_preview('leave',dg,'{}');
 end loop;
 perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 blocked:=false;begin perform public.battle_preview('poll',gen_random_uuid(),'{}');exception when insufficient_privilege then blocked:=true;end;
 if not blocked then raise exception 'Non-member admitted'; end if;
 if has_function_privilege('anon','public.battle_preview(text,uuid,jsonb)','execute') or has_function_privilege('anon','public.battle_statistics()','execute') then raise exception 'Anonymous RPC access'; end if;
end $$;
select 'PASS: all profiles, three ninja topics, pickleball, synchronized characters, ready, miss/hit, timeout, overtime, statistics, rematch, authorization' as verification;
rollback;
