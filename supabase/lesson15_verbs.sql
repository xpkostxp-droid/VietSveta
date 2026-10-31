begin;
-- Extend only the two game-list constraints. Existing timing, ownership,
-- nonnegative score and score <= total checks remain in force.
do $$
declare allowed text; totals text;
begin
 select pg_get_expr(conbin,conrelid) into strict allowed from pg_constraint
 where conrelid='public.game_attempts'::regclass and conname='game_attempts_game_check';
 select pg_get_expr(conbin,conrelid) into strict totals from pg_constraint
 where conrelid='public.game_attempts'::regclass and conname='game_attempts_check1';
 alter table public.game_attempts drop constraint game_attempts_game_check;
 execute format('alter table public.game_attempts add constraint game_attempts_game_check check ((%s) or game = %L)',allowed,'lesson15-verbs');
 alter table public.game_attempts drop constraint game_attempts_check1;
 execute format('alter table public.game_attempts add constraint game_attempts_check1 check ((%s) or (game = %L and total = 52))',totals,'lesson15-verbs');
end $$;
commit;
