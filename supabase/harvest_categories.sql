-- Separate fruit and vegetable leaderboards; preserve all existing attempts and RLS.
begin;
alter table public.game_attempts drop constraint game_attempts_game_check;
alter table public.game_attempts drop constraint game_attempts_check1;
alter table public.game_attempts add constraint game_attempts_game_check check (game in ('questions-15','questions-24','harvest-40','harvest-fruits','harvest-vegetables','adjectives-tetris','adjectives-rope','adjectives-cannon'));
alter table public.game_attempts add constraint game_attempts_check1 check (
 (game='questions-15' and total=30) or (game='questions-24' and total=48) or (game='harvest-40' and total=40) or (game='harvest-fruits' and total=22) or (game='harvest-vegetables' and total=18) or
 (game in ('adjectives-tetris','adjectives-rope') and total=36) or (game='adjectives-cannon' and total=34));
commit;
