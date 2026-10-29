-- Applied remotely as prepare_participants_and_private_progress.
-- Schema snapshot, not a migration to reapply to an existing database.
create table public.participants (
 id text primary key check (id ~ '^[a-z0-9-]{1,40}$'),
 display_name text not null check (length(display_name) between 1 and 80),
 user_id uuid unique references auth.users(id) on delete set null,
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create table public.learning_state (
 user_id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 1000000),
 revision bigint not null default 1 check (revision > 0),
 updated_at timestamptz not null default now()
);
create table public.game_attempts (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 game text not null check (game in ('questions-15','questions-24','harvest-40')),
 correct integer not null check (correct >= 0),
 total integer not null,
 correct_time_ms integer not null check (correct_time_ms >= 0 and correct_time_ms <= correct * 5000),
 created_at timestamptz not null default now(),
 check ((game = 'questions-15' and total = 30) or (game = 'questions-24' and total = 48) or (game = 'harvest-40' and total = 40)),
 check (correct <= total)
);
create index game_attempts_user_game on public.game_attempts(user_id,game,created_at desc);
alter table public.participants enable row level security;
alter table public.learning_state enable row level security;
alter table public.game_attempts enable row level security;
revoke all on public.participants, public.learning_state, public.game_attempts from anon, authenticated;
grant select on public.participants to authenticated;
grant select,insert,update on public.learning_state to authenticated;
grant select,insert on public.game_attempts to authenticated;
create policy participant_self on public.participants for select to authenticated using (user_id = (select auth.uid()) and active);
create policy learning_self_select on public.learning_state for select to authenticated using (
 user_id = (select auth.uid()) and exists(select 1 from public.participants p where p.user_id = (select auth.uid()) and p.active)
);
create policy learning_self_insert on public.learning_state for insert to authenticated with check (
 user_id = (select auth.uid()) and exists(select 1 from public.participants p where p.user_id = (select auth.uid()) and p.active)
);
create policy learning_self_update on public.learning_state for update to authenticated using (
 user_id = (select auth.uid()) and exists(select 1 from public.participants p where p.user_id = (select auth.uid()) and p.active)
) with check (
 user_id = (select auth.uid()) and exists(select 1 from public.participants p where p.user_id = (select auth.uid()) and p.active)
);
create policy attempts_self_select on public.game_attempts for select to authenticated using (
 user_id = (select auth.uid()) and exists(select 1 from public.participants p where p.user_id = (select auth.uid()) and p.active)
);
create policy attempts_self_insert on public.game_attempts for insert to authenticated with check (
 user_id = (select auth.uid()) and exists(select 1 from public.participants p where p.user_id = (select auth.uid()) and p.active)
);
insert into public.participants(id,display_name) values
 ('svetlana','Светлана'),('lesya','Леся'),('sergey-p','Сергей П'),('sergey-k','Сергей К'),('marina','Марина');
