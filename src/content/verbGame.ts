import { adjectiveTasks, shuffleItems } from './adjectiveSets';
// The selected game list is deliberately separate from the full lesson vocabulary.
export const verbGameWords = [
 ['đến','приходить, прибывать'],['về','возвращаться'],['đọc','читать'],
 ['sang','переходить, переезжать'],['nghỉ','отдыхать'],['nghe','слушать, слышать'],
 ['ngủ','спать'],['trở thành','становиться кем-то'],['trưởng thành','взрослеть'],
 ['thăm','навещать'],['bán','продавать'],['xem','смотреть'],['biết','знать'],
 ['yêu','любить'],['hiểu','понимать'],['nghĩ','думать'],['trở nên','становиться каким-то'],
 ['nói','говорить'],['nói chuyện','разговаривать'],['gọi','звонить'],['giúp','помогать'],
 ['hỏi','спрашивать'],['sai','ошибаться'],['nói dối','врать'],['mệt','уставать'],['đi chơi','развлекаться'],
] as const;
export type VerbTask = { word: number; reverse: boolean };
export const verbGameTasks = () => adjectiveTasks(verbGameWords.length);
export const verbGameOptions = (word: number) => shuffleItems([word,...shuffleItems(verbGameWords.map((_,i)=>i).filter(i=>i!==word)).slice(0,2)]);
export const verbPrompt = (task: VerbTask) => verbGameWords[task.word][task.reverse?0:1];
