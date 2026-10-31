begin;
do $$
declare totals text;
begin
 select pg_get_expr(conbin,conrelid) into strict totals from pg_constraint
 where conrelid='public.game_attempts'::regclass and conname='game_attempts_check1';
 alter table public.game_attempts drop constraint game_attempts_check1;
 execute format('alter table public.game_attempts add constraint game_attempts_check1 check ((%s) or (game = %L and total = 40) or (game = %L and total = 32))',totals,'harvest-fruits','harvest-vegetables');
end $$;
commit;
