-- Private preview: only the existing Admin and Svetlana accounts.
create schema if not exists battle_private;
revoke all on schema battle_private from public, anon;
grant usage on schema battle_private to authenticated;
create table battle_private.presence (
 device uuid primary key, user_id uuid not null, member_id text not null,
 name text not null, seen_at timestamptz not null default now()
);
create table battle_private.topics (id text primary key, title text not null, words jsonb not null);
create table battle_private.matches (
 id uuid primary key default gen_random_uuid(), host uuid not null, guest uuid not null,
 topic text not null references battle_private.topics, status text not null default 'invited',
 created_at timestamptz not null default now(), tasks jsonb not null,
 round integer not null default 0, starts_at timestamptz,
 ready_host boolean not null default false, ready_guest boolean not null default false,
 answers jsonb not null default '{}', results jsonb not null default '[]', settle_at timestamptz
);
alter table battle_private.presence enable row level security;
alter table battle_private.topics enable row level security;
alter table battle_private.matches enable row level security;
revoke all on all tables in schema battle_private from public, anon, authenticated;

create function battle_private.action(p_action text,p_device uuid,p_payload jsonb default '{}')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
 uid uuid := auth.uid(); mid text; nm text; t timestamptz := clock_timestamp();
 m battle_private.matches%rowtype; topicrow battle_private.topics%rowtype;
 opponent battle_private.presence%rowtype; task jsonb; tasklist jsonb := '[]';
 w jsonb; options jsonb; reverse boolean; idx integer; answer integer;
 side text; elapsed integer; received integer; good boolean; a jsonb; b jsonb;
 winner text; score_h integer; score_g integer; out_match jsonb; topiclist jsonb; online jsonb;
begin
 select id,display_name into mid,nm from public.participants
 where user_id=uid and active and id in ('admin','svetlana');
 if mid is null then raise exception 'Батл пока доступен только админу и Светлане' using errcode='42501'; end if;
 if p_device is null then raise exception 'Нет устройства'; end if;
 -- Serialize all preview mutations, including simultaneous invitations/answers.
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
  for idx in 1..15 loop
   select value into w from jsonb_array_elements(topicrow.words) order by random() limit 1;
   reverse := random()<0.5;
   -- Ensure the correct answer and exactly two distinct distractors.
   select jsonb_agg(label order by random()) into options from (
    select w->>(case when reverse then 0 else 1 end) label
    union all
    (select label from (select distinct value->>(case when reverse then 0 else 1 end) label
     from jsonb_array_elements(topicrow.words)
     where value->>(case when reverse then 0 else 1 end) <> w->>(case when reverse then 0 else 1 end)) distractors
     order by random() limit 2)
   ) choices;
   select ordinality-1 into answer from jsonb_array_elements_text(options) with ordinality where value=w->>(case when reverse then 0 else 1 end);
   tasklist:=tasklist||jsonb_build_array(jsonb_build_object('word',w->>(case when reverse then 1 else 0 end),'options',options,'answer',answer));
  end loop;
  insert into battle_private.matches(host,guest,topic,tasks) values(p_device,opponent.device,topicrow.id,tasklist) returning * into m;
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
    update battle_private.matches set answers=answers||jsonb_build_object(side,jsonb_build_object('choice',answer,'elapsed',elapsed,'correct',good)),
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
   elsif (b->>'elapsed')::integer=(a->>'elapsed')::integer then winner:='both'; end if;
  end if;
  update battle_private.matches set results=results||jsonb_build_array(jsonb_build_object('winner',winner,'answer',m.tasks->m.round->'answer','word',m.tasks->m.round->'word','options',m.tasks->m.round->'options')),
   round=round+1,status=case when round=14 then 'finished' else 'active' end,
   starts_at=t+interval '2 seconds',answers='{}',settle_at=null
  where id=m.id returning * into m;
 end if;
 if m.id is null then
  select * into m from battle_private.matches where (host=p_device or guest=p_device) and created_at>t-interval '1 hour' order by created_at desc limit 1;
 end if;
 if m.id is not null then
  select count(*) filter(where value->>'winner' in ('host','both')),count(*) filter(where value->>'winner' in ('guest','both')) into score_h,score_g from jsonb_array_elements(m.results);
  task:=m.tasks->m.round;
  out_match:=jsonb_build_object('id',m.id,'status',m.status,'topic',m.topic,'side',case when m.host=p_device then 'host' else 'guest' end,
   'host_name',(select name from battle_private.presence where device=m.host),'guest_name',(select name from battle_private.presence where device=m.guest),
   'round',m.round,'starts_at',m.starts_at,'ready_host',m.ready_host,'ready_guest',m.ready_guest,
   'task',task-'answer','answered',m.answers ? case when m.host=p_device then 'host' else 'guest' end,
   'score_host',score_h,'score_guest',score_g,'last_result',m.results->-1);
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('device',p.device,'name',p.name,'busy',exists(select 1 from battle_private.matches x where x.status in ('invited','active') and (x.host=p.device or x.guest=p.device)))),'[]') into online
 from battle_private.presence p where p.user_id<>uid and p.seen_at>t-interval '15 seconds';
 select jsonb_agg(jsonb_build_object('id',id,'title',title) order by id) into topiclist from battle_private.topics;
 return jsonb_build_object('server_now',clock_timestamp(),'online',online,'topics',topiclist,'match',out_match);
end $$;
revoke all on function battle_private.action(text,uuid,jsonb) from public,anon;
grant execute on function battle_private.action(text,uuid,jsonb) to authenticated;
create function public.battle_preview(p_action text,p_device uuid,p_payload jsonb default '{}')
returns jsonb language sql security invoker set search_path='' as $$ select battle_private.action(p_action,p_device,p_payload); $$;
revoke all on function public.battle_preview(text,uuid,jsonb) from public,anon;
grant execute on function public.battle_preview(text,uuid,jsonb) to authenticated;

-- Vocabulary copied from the current advanced course.
insert into battle_private.topics(id,title,words) values('fruits','Фрукты','[["chuối", "банан"], ["xoài", "манго"], ["dưa hấu", "арбуз"], ["táo", "яблоко"], ["cam", "апельсин"], ["nho", "виноград"], ["dâu tây", "клубника"], ["thơm", "ананас"], ["dừa", "кокос"], ["bơ", "авокадо"], ["đào", "персик"]]'::jsonb);
insert into battle_private.topics(id,title,words) values('vegetables','Овощи','[["cà chua", "помидор"], ["dưa chuột", "огурец"], ["khoai tây", "картофель"], ["hành củ", "репчатый лук"], ["tỏi", "чеснок"], ["ngô", "кукуруза"], ["bắp cải", "капуста"], ["ớt ngọt", "сладкий перец"], ["nấm", "грибы"]]'::jsonb);
insert into battle_private.topics(id,title,words) values('harvest','Фрукты и овощи','[["cà chua", "помидор"], ["dưa chuột", "огурец"], ["khoai tây", "картофель"], ["hành củ", "репчатый лук"], ["tỏi", "чеснок"], ["ngô", "кукуруза"], ["bắp cải", "капуста"], ["ớt ngọt", "сладкий перец"], ["nấm", "грибы"], ["chuối", "банан"], ["xoài", "манго"], ["dưa hấu", "арбуз"], ["táo", "яблоко"], ["cam", "апельсин"], ["nho", "виноград"], ["dâu tây", "клубника"], ["thơm", "ананас"], ["dừa", "кокос"], ["bơ", "авокадо"], ["đào", "персик"]]'::jsonb);
insert into battle_private.topics(id,title,words) values('questions','Вопросительные слова','[["Ai", "Кто"], ["Gì", "Что"], ["Ở đâu", "Где"], ["Từ đâu", "Откуда"], ["Khi nào", "Когда"], ["Mấy giờ", "Во сколько"], ["Tại sao", "Почему"], ["Thế nào", "Как"], ["Bao nhiêu", "Сколько (13+)"], ["Mấy", "Сколько (1–12)"], ["Nào", "Какой"], ["Của ai", "Чей"], ["Với ai", "С кем"], ["Bao lâu", "Как долго"], ["Để làm gì", "Зачем"]]'::jsonb);
insert into battle_private.topics(id,title,words) values('adjectives-1','Размер, предметы и сравнение','[["to", "большой"], ["nhỏ", "маленький"], ["cao", "высокий"], ["thấp", "низкий"], ["dài", "длинный"], ["ngắn", "короткий"], ["dày", "толстый — о предмете"], ["mỏng", "тонкий"], ["rộng", "просторный"], ["chật", "тесный"], ["cứng", "твёрдый"], ["mềm", "мягкий"], ["mới", "новый"], ["cũ", "старый — о предмете"], ["đắt", "дорогой"], ["rẻ", "дешёвый"], ["bằng nhau", "равные"], ["giống nhau", "похожие"]]'::jsonb);
insert into battle_private.topics(id,title,words) values('adjectives-2','Люди, качества и оценки','[["béo", "толстый — о человеке"], ["gầy", "худой"], ["lớn", "взрослый"], ["trẻ", "молодой"], ["già", "старый — о человеке"], ["yếu", "слабый"], ["khỏe", "здоровый / сильный"], ["giàu", "богатый"], ["nghèo", "бедный"], ["đẹp", "красивый"], ["xấu", "некрасивый"], ["nổi tiếng", "известный"], ["hay", "интересный / хороший"], ["tốt", "хороший"], ["ổn", "нормальный"], ["cởi chuồng", "голый / без одежды"], ["miễn phí", "бесплатный"], ["đầy đủ", "полный / в полном объёме"]]'::jsonb);
insert into battle_private.topics(id,title,words) values('adjectives-3','Вкусы, ощущения и погода','[["ngon", "вкусный"], ["ngọt", "сладкий"], ["chua", "кислый"], ["đắng", "горький"], ["mặn", "солёный"], ["cay", "острый"], ["nhạt", "пресный"], ["chát", "терпкий / вяжущий"], ["bùi", "с ореховым, крахмалистым вкусом"], ["nhiều nước", "сочный"], ["chín", "спелый"], ["nóng", "горячий"], ["lạnh", "холодный"], ["mát", "прохладный"], ["khô", "сухой"], ["ẩm", "влажный"], ["nắng", "солнечный"]]'::jsonb);
