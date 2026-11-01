-- Add the new thirty-recording game, preserving the old seventeen-recording game.
begin;
do $$
declare constraint_name text; expression text;
begin
 foreach constraint_name in array array['game_attempts_game_check','game_attempts_check1'] loop
  select pg_get_expr(conbin,conrelid) into strict expression from pg_constraint
  where conrelid='public.game_attempts'::regclass and conname=constraint_name;
  execute format('alter table public.game_attempts drop constraint %I',constraint_name);
  execute format('alter table public.game_attempts add constraint %I check ((%s) or (game = %L and total = 30))',constraint_name,expression,'beginner-tone-basics');
 end loop;
end $$;
do $$
declare signature text; definition text;
begin
 foreach signature in array array['public.get_overall_medal_ranking()','public.get_study_admin_stats(integer)'] loop
  select pg_get_functiondef(signature::regprocedure) into definition;
  if position('(''beginner-tone-basics'',30)' in definition)=0 then
   if position('(''beginner-listening-tones'',17)' in definition)=0 then raise exception 'game rules marker missing: %',signature; end if;
   execute replace(definition,'(''beginner-listening-tones'',17)','(''beginner-tone-basics'',30),(''beginner-listening-tones'',17)');
  end if;
 end loop;
end $$;
commit;
