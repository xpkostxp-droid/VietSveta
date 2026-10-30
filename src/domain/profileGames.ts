import { rankPlayers, type RankingRow } from './leaderboard';
export const profileGames = [
 {id:'harvest-fruits',title:'Фрукты'},
 {id:'harvest-vegetables',title:'Овощи'},
 {id:'harvest-40',title:'Фрукты и овощи · суперблиц'},
 {id:'questions-15',title:'Вопросительные слова · блиц'},
 {id:'questions-24',title:'Вопросительные слова · суперблиц'},
 {id:'adjectives-tetris',title:'Прилагательные · размер, предметы и сравнение'},
 {id:'adjectives-rope',title:'Прилагательные · люди, качества и оценки'},
 {id:'adjectives-cannon',title:'Прилагательные · вкусы, ощущения и погода'},
 {id:'lesson5-professions',title:'Профессии'},
 {id:'lesson5-work',title:'Работа и место работы'},
 {id:'lesson7-countries',title:'Страны'},
 {id:'lesson7-travel',title:'Города и путешествия'},
 {id:'lesson8-people',title:'Люди и обращения'},
 {id:'lesson9-phone',title:'Цифры 1–10 · номер телефона'},
] as const;
export type ProfileGameId = typeof profileGames[number]['id'];
export function profilePlace(rows:RankingRow[],memberId:string){
 return rankPlayers(rows).find(row=>row.id===memberId)?.place??null;
}
