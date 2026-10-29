import { shuffled } from './family';
export type TravelCategory = 'all' | 'countries' | 'geography' | 'words';
export const travelCategories: [TravelCategory, string][] = [['all','Всё вместе'],['countries','Страны'],['geography','География и города'],['words','Слова и вопросы']];
export const travelWords = [
 ['vn','Việt Nam','Вьетнам','countries','🇻🇳'], ['ru','Nga','Россия','countries','🇷🇺'],
 ['cn','Trung Quốc','Китай','countries','🇨🇳'], ['kr','Hàn Quốc','Южная Корея','countries','🇰🇷'],
 ['jp','Nhật Bản','Япония','countries','🇯🇵'], ['la','Lào','Лаос','countries','🇱🇦'],
 ['kh','Campuchia','Камбоджа','countries','🇰🇭'], ['th','Thái Lan','Таиланд','countries','🇹🇭'],
 ['fr','Pháp','Франция','countries','🇫🇷'], ['de','Đức','Германия','countries','🇩🇪'],
 ['gb','Anh','Англия','countries','🇬🇧'], ['it','Ý','Италия','countries','🇮🇹'],
 ['es','Tây Ban Nha','Испания','countries','🇪🇸'], ['us','Mỹ','США','countries','🇺🇸'],
 ['au','Úc','Австралия','countries','🇦🇺'],
 ['asia','Châu Á','Азия','geography',''], ['europe','Châu Âu','Европа','geography',''],
 ['country','nước','Страна','geography',''], ['city','thành phố','Город','geography',''],
 ['capital','thủ đô','Столица','geography',''],
 ['live','sống','Жить','words',''], ['travel','đi du lịch','Путешествовать','words',''],
 ['arrive','đến','Приезжать / прибывать','words',''], ['from','từ','Из / от','words',''],
 ['origin','đến từ','Быть родом из / приехать из','words',''], ['all','tất cả','Все','words',''],
 ['person','người','Человек','words',''], ['which','nào','Какой / какая','words',''],
 ['which-country','nước nào?','Какая страна?','words',''], ['which-city','thành phố nào?','Какой город?','words',''],
 ['ask-country','Anh đến từ nước nào?','Из какой страны ты приехал?','words',''],
 ['ask-city','Anh đến từ thành phố nào?','Из какого города ты приехал?','words',''],
] as const;
export function travelIndices(category: TravelCategory) { return travelWords.map((_,i)=>i).filter(i=>category==='all'||travelWords[i][3]===category); }
export function travelOptions(index: number, pool: number[]) { return shuffled([index,...shuffled(pool.filter(i=>i!==index)).slice(0,5)]); }

export type TravelBlitzGroup = 'countries' | 'travel';
export type TravelTask = { index: number; reverse: boolean };
export const travelBlitzGroups = [
 { id: 'countries' as const, label: 'Страны', words: 15 },
 { id: 'travel' as const, label: 'Города и путешествия', words: 17 },
];
export function travelBlitzPool(group: TravelBlitzGroup) {
 return travelIndices('all').filter(i => group === 'countries' ? travelWords[i][3] === 'countries' : travelWords[i][3] !== 'countries');
}
export function travelBlitzTasks(group: TravelBlitzGroup): TravelTask[] {
 return shuffled(travelBlitzPool(group).flatMap(index => [{ index, reverse: false }, { index, reverse: true }]));
}
export function travelBlitzAnswer(task: TravelTask): string { return travelWords[task.index][task.reverse ? 2 : 1]; }
export function travelBlitzOptions(task: TravelTask, group: TravelBlitzGroup): string[] {
 const question = travelWords[task.index][1].endsWith('?');
 const candidates = travelBlitzPool(group).filter(i => i !== task.index && travelWords[i][1].endsWith('?') === question);
 return shuffled([travelBlitzAnswer(task), ...shuffled(candidates).slice(0, 2).map(i => travelWords[i][task.reverse ? 2 : 1])]);
}
