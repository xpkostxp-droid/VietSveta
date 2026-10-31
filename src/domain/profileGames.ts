import { rankPlayers, type RankingRow } from './leaderboard';
export const profileGames = [
 {id:'lesson15-verbs',title:'Глаголы'},
 {id:'harvest-fruits',title:'Фрукты'},
 {id:'harvest-vegetables',title:'Овощи'},
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
 {id:'lesson10-family',title:'Семья'},
 {id:'lesson11-house',title:'Дом'},
 {id:'lesson11-adjectives',title:'Прилагательные'},
 {id:'lesson9-phone',title:'Цифры 1–10 · номер телефона'},
] as const;
export type ProfileGameId = typeof profileGames[number]['id'];
export function profilePlace(rows:RankingRow[],memberId:string){
 return rankPlayers(rows).find(row=>row.id===memberId)?.place??null;
}
