import { shuffled } from './family';
export type PeopleCategory = 'all' | 'pronouns' | 'phrases';
export const peopleCategories: [PeopleCategory,string][] = [['all','Всё вместе'],['pronouns','Я, мы, они и все'],['phrases','Ответы и фразы']];
export const peopleWords = [
 [
  "l8-03",
  "hội thoại",
  "диалог",
  "phrases"
 ],
 [
  "l8-04",
  "vâng",
  "Да — вежливый ответ",
  "phrases"
 ],
 [
  "l8-05",
  "dạ",
  "Да — вежливый ответ",
  "phrases"
 ],
 [
  "l8-06",
  "có",
  "Да — ответ на có … không?",
  "phrases"
 ],
 [
  "l8-13",
  "tôi",
  "Я — нейтрально / официально",
  "pronouns"
 ],
 [
  "l8-14",
  "mình",
  "Я — мягко, по-дружески",
  "pronouns"
 ],
 [
  "l8-15",
  "tớ",
  "Я — с друзьями и ровесниками",
  "pronouns"
 ],
 [
  "l8-16",
  "tao",
  "Я — очень фамильярно / грубо",
  "pronouns"
 ],
 [
  "l8-17",
  "mày",
  "Ты — очень фамильярно / грубо",
  "pronouns"
 ],
 [
  "l8-22",
  "anh ấy",
  "Он — о мужчине",
  "pronouns"
 ],
 [
  "l8-23",
  "chị ấy",
  "Она — о старшей / ровеснице",
  "pronouns"
 ],
 [
  "l8-24",
  "cô ấy",
  "Она — о женщине",
  "pronouns"
 ],
 [
  "l8-25",
  "em ấy",
  "Он / она — о младшем",
  "pronouns"
 ],
 [
  "l8-28",
  "họ",
  "они",
  "pronouns"
 ],
 [
  "l8-31",
  "chúng ta",
  "Мы — включая собеседника",
  "pronouns"
 ],
 [
  "l8-34",
  "chúng tôi",
  "Мы — без собеседника",
  "pronouns"
 ],
 [
  "l8-37",
  "đều",
  "Все / оба — о группе",
  "pronouns"
 ]
] as const;
export function peopleIndices(category: PeopleCategory) { return peopleWords.map((_,i)=>i).filter(i=>category==='all'||peopleWords[i][3]===category); }
const equivalents = [['vâng','dạ'],['chị ấy','cô ấy']];
export function peopleAccepts(expected: number, selected: number) { return expected === selected || equivalents.some(g => g.includes(peopleWords[expected][1]) && g.includes(peopleWords[selected][1])); }
export function peopleOptions(index: number,pool: number[]) { return shuffled([index,...shuffled(pool.filter(i=>!peopleAccepts(index,i))).slice(0,5)]); }

export type PeopleTask = { index: number; reverse: boolean };
export function peopleBlitzTasks(): PeopleTask[] { return shuffled(peopleWords.flatMap((_, index) => [{index, reverse: false}, {index, reverse: true}])); }
export function peopleBlitzAnswer(task: PeopleTask): string { return peopleWords[task.index][task.reverse ? 2 : 1]; }
export function peopleBlitzOptions(task: PeopleTask): string[] {
 const candidates = peopleWords.map((_,i) => i).filter(i => !peopleAccepts(task.index, i));
 const labels = [...new Set(candidates.map(i => peopleWords[i][task.reverse ? 2 : 1]))];
 return shuffled([peopleBlitzAnswer(task), ...shuffled(labels).slice(0,2)]);
}
