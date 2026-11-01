import { rankPlayers, type RankingRow } from './leaderboard';
export const profileGames = [
 {id:'lesson15-verbs',title:'Глаголы',group:'advanced'},
 {id:'harvest-fruits',title:'Фрукты',group:'advanced'},
 {id:'harvest-vegetables',title:'Овощи',group:'advanced'},
 {id:'questions-15',title:'Вопросительные слова · блиц',group:'advanced'},
 {id:'questions-24',title:'Вопросительные слова · суперблиц',group:'advanced'},
 {id:'adjectives-tetris',title:'Прилагательные · размер, предметы и сравнение',group:'advanced'},
 {id:'adjectives-rope',title:'Прилагательные · люди, качества и оценки',group:'advanced'},
 {id:'adjectives-cannon',title:'Прилагательные · вкусы, ощущения и погода',group:'advanced'},
 {id:'lesson5-professions',title:'Профессии',group:'beginner'},
 {id:'lesson5-work',title:'Работа и место работы',group:'beginner'},
 {id:'lesson7-countries',title:'Страны',group:'beginner'},
 {id:'lesson7-travel',title:'Города и путешествия',group:'beginner'},
 {id:'lesson8-people',title:'Люди и обращения',group:'beginner'},
 {id:'lesson10-family',title:'Семья',group:'beginner'},
 {id:'lesson11-house',title:'Дом',group:'beginner'},
 {id:'lesson11-adjectives',title:'Прилагательные',group:'beginner'},
 {id:'lesson9-phone',title:'Цифры 1–10 · номер телефона',group:'beginner'},
] as const;
export type ProfileGameId = typeof profileGames[number]['id'];
export function profilePlace(rows:RankingRow[],memberId:string){
 return rankPlayers(rows).find(row=>row.id===memberId)?.place??null;
}
