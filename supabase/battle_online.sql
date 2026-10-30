-- Online battle rollout. Existing matches keep their original pickleball rules.
alter table battle_private.matches add column if not exists mode text not null default 'pickleball';
alter table battle_private.matches add column if not exists host_character text;
alter table battle_private.matches add column if not exists guest_character text;
create or replace function battle_private.statistics()
returns jsonb language plpgsql security definer set search_path='' as $$
declare mid text; records jsonb;
begin
 select id into mid from public.participants where user_id=auth.uid() and active;
 if mid is null then raise exception 'Войди в активный профиль участника' using errcode='42501'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'played_at',finished_at,'host_id',host_member_id,'guest_id',guest_member_id,'host_name',host_display,'guest_name',guest_display,'score_host',h,'score_guest',g,'topic',topic) order by finished_at desc,id),'[]'::jsonb) into records
 from (select m.*, (select count(*) from jsonb_array_elements(results) r where r->>'winner' in ('host','both')) h,
 (select count(*) from jsonb_array_elements(results) r where r->>'winner' in ('guest','both')) g
 from battle_private.matches m where status='finished' and host_member_id is not null and guest_member_id is not null and host_member_id<>guest_member_id
 and exists(select 1 from public.participants p where p.id=m.host_member_id and not p.is_admin)
 and exists(select 1 from public.participants p where p.id=m.guest_member_id and not p.is_admin)) scored where h<>g;
 return jsonb_build_object('viewer_id',mid,'matches',records);
end $$;
revoke all on function battle_private.statistics() from public,anon;
grant execute on function battle_private.statistics() to authenticated;
create or replace function public.battle_statistics()
returns jsonb language sql security invoker set search_path='' as $$ select battle_private.statistics(); $$;
revoke all on function public.battle_statistics() from public,anon;
grant execute on function public.battle_statistics() to authenticated;

create or replace function battle_private.action(p_action text,p_device uuid,p_payload jsonb default '{}')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
 uid uuid := auth.uid(); mid text; nm text; t timestamptz := clock_timestamp();
 m battle_private.matches%rowtype; topicrow battle_private.topics%rowtype;
 opponent battle_private.presence%rowtype; task jsonb; tasklist jsonb := '[]';
 w jsonb; options jsonb; reverse boolean; idx integer; answer integer;
 side text; elapsed integer; received integer; good boolean; a jsonb; b jsonb;
 ninja boolean; host_gender text; guest_gender text; hc text; gc text; misses jsonb;
 winner text; score_h integer; score_g integer; out_match jsonb; topiclist jsonb; online jsonb;
begin
 select id,display_name into mid,nm from public.participants
 where user_id=uid and active;
 if mid is null then raise exception 'Войди в активный профиль участника' using errcode='42501'; end if;
 if p_device is null then raise exception 'Нет устройства'; end if;
 -- Serialize all battle mutations, including simultaneous invitations/answers.
 perform pg_advisory_xact_lock(741830219);
 if exists(select 1 from battle_private.presence where device=p_device and user_id<>uid) then
 raise exception 'Чужое устройство' using errcode='42501'; end if;
 insert into battle_private.presence(device,user_id,member_id,name,seen_at) values(p_device,uid,mid,nm,t)
 on conflict(device) do update set seen_at=t;
 -- Abandoned invitations and disconnected matches never keep players busy indefinitely.
 update battle_private.matches x set status='cancelled'
 where x.status in ('invited','active') and
 (x.status='invited' and x.created_at<t-interval '30 seconds' or
 not exists(select 1 from battle_private.presence p where p.device=x.host and p.seen_at>t-interval '15 seconds') or
 not exists(select 1 from battle_private.presence p where p.device=x.guest and p.seen_at>t-interval '15 seconds'));
 select * into m from battle_private.matches where (host=p_device or guest=p_device)
 and status in ('invited','active') order by created_at desc limit 1 for update;
 if p_action='rematch' then
  select * into topicrow from battle_private.topics where id=(select topic from battle_private.matches where id=(p_payload->>'match')::uuid and status='finished' and (host_member_id=mid or guest_member_id=mid));
  if topicrow.id is null then raise exception 'Нет завершённого матча для реванша'; end if;
  select p.* into opponent from battle_private.presence p join battle_private.matches old on old.id=(p_payload->>'match')::uuid
   where p.member_id=case when old.host_member_id=mid then old.guest_member_id else old.host_member_id end and p.user_id<>uid and p.seen_at>t-interval '15 seconds'
   order by p.seen_at desc limit 1;
  if opponent.device is null then raise exception 'Соперник уже не в сети. Вернись в лобби и выбери другого.'; end if;
  p_payload:=jsonb_build_object('topic',topicrow.id,'opponent',opponent.device);
  p_action:='invite';
 end if;
 if p_action='leave' then
  if m.id is not null then update battle_private.matches set status='cancelled' where id=m.id; end if;
  delete from battle_private.presence where device=p_device;
  return jsonb_build_object('server_now',t);
 elsif p_action='invite' then
  if m.id is not null then raise exception 'Уже есть приглашение или матч'; end if;
  select * into opponent from battle_private.presence where device=(p_payload->>'opponent')::uuid
   and user_id<>uid and seen_at>t-interval '15 seconds';
  if opponent.device is null then raise exception 'Соперник уже не в сети'; end if;
  if exists(select 1 from battle_private.matches where status in ('invited','active') and (host=opponent.device or guest=opponent.device)) then raise exception 'Соперник занят'; end if;
  select * into topicrow from battle_private.topics where id=p_payload->>'topic';
  if topicrow.id is null then raise exception 'Выбери тему'; end if;
  ninja:=topicrow.id in ('fruits','vegetables','harvest');
  if ninja then
   tasklist:=battle_private.draw_tasks(topicrow.id,uid,1,least(10,jsonb_array_length(topicrow.words)));
   host_gender:=case when mid in ('svetlana','lesya','marina') then 'woman' else 'man' end;
   guest_gender:=case when opponent.member_id in ('svetlana','lesya','marina') then 'woman' else 'man' end;
   hc:=(case when random()<0.5 then 'teal-' else 'red-' end)||host_gender;
   gc:=(case when host_gender=guest_gender then case when hc like 'teal-%' then 'red-' else 'teal-' end
      else case when random()<0.5 then 'teal-' else 'red-' end end)||guest_gender;
  else
   tasklist:=battle_private.draw_tasks(topicrow.id,uid,0,least(10,jsonb_array_length(topicrow.words)))
    ||battle_private.draw_tasks(topicrow.id,uid,1,least(10,jsonb_array_length(topicrow.words)));
  end if;
  select jsonb_agg(value order by random()) into tasklist from jsonb_array_elements(tasklist);
  insert into battle_private.matches(host,guest,topic,tasks,mode,host_character,guest_character) values(p_device,opponent.device,topicrow.id,tasklist,case when ninja then 'ninja' else 'pickleball' end,hc,gc) returning * into m;
 elsif p_action in ('accept','decline','ready','answer','cancel') then
  if m.id is null or m.id<>(p_payload->>'match')::uuid then raise exception 'Матч уже закончился'; end if;
  side:=case when m.host=p_device then 'host' else 'guest' end;
  if p_action='accept' and side='guest' and m.status='invited' then
   update battle_private.matches set status='active' where id=m.id returning * into m;
  elsif p_action='decline' and side='guest' or p_action='cancel' then
   update battle_private.matches set status='cancelled' where id=m.id returning * into m;
  elsif p_action='ready' and m.status='active' then
   update battle_private.matches set ready_host=ready_host or side='host',ready_guest=ready_guest or side='guest' where id=m.id returning * into m;
   if m.ready_host and m.ready_guest and m.starts_at is null then
    update battle_private.matches set starts_at=t+interval '3 seconds' where id=m.id returning * into m;
   end if;
  elsif p_action='answer' then
   if m.status<>'active' or m.starts_at is null or t<m.starts_at or (p_payload->>'round')::integer<>m.round then raise exception 'Раунд сменился'; end if;
   if not (m.answers ? side) then
    elapsed:=(p_payload->>'elapsed')::integer; answer:=(p_payload->>'choice')::integer;
    received:=floor(extract(epoch from(t-m.starts_at))*1000);
    if answer is null or answer<0 or answer>2 or elapsed is null or elapsed<0 or elapsed>5000 or received>6000 or elapsed>received+200 or elapsed<received-1200 then raise exception 'Ответ пришёл слишком поздно'; end if;
    good:=answer=(m.tasks->m.round->>'answer')::integer;
    update battle_private.matches set answers=answers||jsonb_build_object(side,jsonb_build_object('choice',answer,'elapsed',elapsed,'correct',good,'at',t)),
      settle_at=case when good then coalesce(settle_at,t+interval '600 milliseconds') else settle_at end
    where id=m.id returning * into m;
   end if;
  end if;
 elsif p_action<>'poll' then raise exception 'Неизвестное действие';
 end if;
 -- Resolve one round atomically. Wrong answers leave the other player the remaining time.
 if m.status='active' and m.starts_at is not null and t>=m.starts_at and
 (t>=m.starts_at+interval '6 seconds' or (m.answers ? 'host' and m.answers ? 'guest') or t>=m.settle_at) then
  a:=m.answers->'host'; b:=m.answers->'guest'; winner:='none';
  if coalesce((a->>'correct')::boolean,false) then winner:='host'; end if;
  if coalesce((b->>'correct')::boolean,false) then
   if winner='none' or (b->>'elapsed')::integer<(a->>'elapsed')::integer then winner:='guest';
   elsif (b->>'elapsed')::integer=(a->>'elapsed')::integer then winner:=case when m.mode='ninja' then case when (a->>'at')::timestamptz<=(b->>'at')::timestamptz then 'host' else 'guest' end else 'both' end; end if;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('side',key,'at',value->'at')),'[]') into misses
   from jsonb_each(m.answers) where not (value->>'correct')::boolean;
  update battle_private.matches set results=results||jsonb_build_array(jsonb_build_object('winner',winner,'answer',m.tasks->m.round->'answer','word',m.tasks->m.round->'word','options',m.tasks->m.round->'options','round',m.round,'starts_at',m.starts_at,'at',t,'misses',misses)),
   round=round+1,
   starts_at=t+interval '2 seconds',answers='{}',settle_at=null
  where id=m.id returning * into m;
  select count(*) filter(where value->>'winner' in ('host','both')),count(*) filter(where value->>'winner' in ('guest','both')) into score_h,score_g from jsonb_array_elements(m.results);
  select * into topicrow from battle_private.topics where id=m.topic;
  if m.round>=least(10,jsonb_array_length(topicrow.words))*(case when m.mode='ninja' then 1 else 2 end) and score_h<>score_g then
   update battle_private.matches set status='finished' where id=m.id returning * into m;
  elsif m.round>=jsonb_array_length(m.tasks) then
   tasklist:=battle_private.draw_tasks(m.topic,(select user_id from public.participants where id=m.host_member_id),case when m.mode='ninja' then 1 else floor(random()*2)::integer end,1);
   update battle_private.matches set tasks=tasks||tasklist where id=m.id returning * into m;
  end if;
 end if;
 if m.id is null then
  select * into m from battle_private.matches where (host=p_device or guest=p_device) and created_at>t-interval '1 hour' order by created_at desc limit 1;
 end if;
 if m.id is not null then
  select count(*) filter(where value->>'winner' in ('host','both')),count(*) filter(where value->>'winner' in ('guest','both')) into score_h,score_g from jsonb_array_elements(m.results);
  task:=case when m.status='active' then m.tasks->m.round else null end;
  out_match:=jsonb_build_object('id',m.id,'status',m.status,'topic',m.topic,'side',case when m.host=p_device then 'host' else 'guest' end,
   'mode',m.mode,'host_member_id',m.host_member_id,'guest_member_id',m.guest_member_id,'host_character',m.host_character,'guest_character',m.guest_character,
   'attempts',(select coalesce(jsonb_agg(jsonb_build_object('side',key,'at',value->'at')),'[]') from jsonb_each(m.answers) where not (value->>'correct')::boolean),
   'host_name',m.host_display,'guest_name',m.guest_display,
   'base_rounds',(select least(10,jsonb_array_length(words))*(case when m.mode='ninja' then 1 else 2 end) from battle_private.topics where id=m.topic),'round',m.round,'starts_at',m.starts_at,'ready_host',m.ready_host,'ready_guest',m.ready_guest,
   'task',task-'answer','answered',m.answers ? case when m.host=p_device then 'host' else 'guest' end,
   'score_host',score_h,'score_guest',score_g,'last_result',m.results->-1);
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('device',p.device,'name',p.name,'busy',exists(select 1 from battle_private.matches x where x.status in ('invited','active') and (x.host=p.device or x.guest=p.device)))),'[]') into online
 from battle_private.presence p where p.user_id<>uid and p.seen_at>t-interval '15 seconds';
 select jsonb_agg(jsonb_build_object('id',id,'title',title) order by id) into topiclist from battle_private.topics;
 return jsonb_build_object('server_now',clock_timestamp(),'online',online,'topics',topiclist,'match',out_match);
end $$;
