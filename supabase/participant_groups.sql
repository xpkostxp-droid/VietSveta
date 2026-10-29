-- Groups are profile data managed on the server; existing RLS is unchanged.
alter table public.participants add column if not exists course_group text not null default 'advanced' check (course_group in ('beginner','advanced'));
alter table public.participants add column if not exists ranking_since timestamptz;
-- A former administrator starts competing now; earlier test attempts remain in history.
update public.participants set course_group='beginner',ranking_since=coalesce(ranking_since,now()),is_admin=false where id='konstantin';
