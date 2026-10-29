begin;
alter table public.game_attempts drop constraint game_attempts_game_check;
alter table public.game_attempts add constraint game_attempts_game_check check (game in ('questions-15','questions-24','harvest-40','harvest-fruits','harvest-vegetables','adjectives-tetris','adjectives-rope','adjectives-cannon','lesson5-professions','lesson5-work','lesson7-countries','lesson7-travel','lesson8-people'));
alter table public.game_attempts drop constraint game_attempts_check1;
alter table public.game_attempts add constraint game_attempts_check1 check (
(game='questions-15' and total=30) or (game='questions-24' and total=48) or (game='harvest-40' and total=40) or (game='harvest-fruits' and total=22) or (game='harvest-vegetables' and total=18) or
(game in ('adjectives-tetris','adjectives-rope') and total=36) or (game='adjectives-cannon' and total=34) or (game='lesson5-professions' and total=30) or (game='lesson5-work' and total=28) or (game='lesson7-countries' and total=30) or (game='lesson7-travel' and total=34) or (game='lesson8-people' and total=34));
commit;