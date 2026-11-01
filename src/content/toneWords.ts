export const tones = ['level','sac','huyen','hoi','nga','nang'] as const;
export type Tone = typeof tones[number];
export const toneLabels:Record<Tone,string>={level:'Ровный',sac:'Sắc',huyen:'Huyền',hoi:'Hỏi',nga:'Ngã',nang:'Nặng'};
export interface ToneWord {id:string;vi:string;ru:string;tone:Tone;audio:string}
export const toneWords:ToneWord[] = [
 {
  "id": "level-1",
  "vi": "đi",
  "ru": "идти, ехать",
  "tone": "level",
  "audio": "audio/tones/level-1.mp3"
 },
 {
  "id": "level-2",
  "vi": "mua",
  "ru": "покупать",
  "tone": "level",
  "audio": "audio/tones/level-2.mp3"
 },
 {
  "id": "level-3",
  "vi": "nghe",
  "ru": "слушать",
  "tone": "level",
  "audio": "audio/tones/level-3.mp3"
 },
 {
  "id": "level-4",
  "vi": "to",
  "ru": "большой",
  "tone": "level",
  "audio": "audio/tones/level-4.mp3"
 },
 {
  "id": "level-5",
  "vi": "bia",
  "ru": "пиво",
  "tone": "level",
  "audio": "audio/tones/level-5.mp3"
 },
 {
  "id": "sac-1",
  "vi": "đến",
  "ru": "приходить, прибывать",
  "tone": "sac",
  "audio": "audio/tones/sac-1.mp3"
 },
 {
  "id": "sac-2",
  "vi": "có",
  "ru": "иметь",
  "tone": "sac",
  "audio": "audio/tones/sac-2.mp3"
 },
 {
  "id": "sac-3",
  "vi": "khó",
  "ru": "трудный",
  "tone": "sac",
  "audio": "audio/tones/sac-3.mp3"
 },
 {
  "id": "sac-4",
  "vi": "mấy",
  "ru": "сколько",
  "tone": "sac",
  "audio": "audio/tones/sac-4.mp3"
 },
 {
  "id": "sac-5",
  "vi": "lớn",
  "ru": "большой, взрослый",
  "tone": "sac",
  "audio": "audio/tones/sac-5.mp3"
 },
 {
  "id": "huyen-1",
  "vi": "trà",
  "ru": "чай",
  "tone": "huyen",
  "audio": "audio/tones/huyen-1.mp3"
 },
 {
  "id": "huyen-2",
  "vi": "nhà",
  "ru": "дом",
  "tone": "huyen",
  "audio": "audio/tones/huyen-2.mp3"
 },
 {
  "id": "huyen-3",
  "vi": "làm",
  "ru": "делать, работать",
  "tone": "huyen",
  "audio": "audio/tones/huyen-3.mp3"
 },
 {
  "id": "huyen-4",
  "vi": "bà",
  "ru": "бабушка",
  "tone": "huyen",
  "audio": "audio/tones/huyen-4.mp3"
 },
 {
  "id": "huyen-5",
  "vi": "nhiều",
  "ru": "много",
  "tone": "huyen",
  "audio": "audio/tones/huyen-5.mp3"
 },
 {
  "id": "hoi-1",
  "vi": "nghỉ",
  "ru": "отдыхать",
  "tone": "hoi",
  "audio": "audio/tones/hoi-1.mp3"
 },
 {
  "id": "hoi-2",
  "vi": "hỏi",
  "ru": "спрашивать",
  "tone": "hoi",
  "audio": "audio/tones/hoi-2.mp3"
 },
 {
  "id": "hoi-3",
  "vi": "khỏe",
  "ru": "здоровый",
  "tone": "hoi",
  "audio": "audio/tones/hoi-3.mp3"
 },
 {
  "id": "hoi-4",
  "vi": "ở",
  "ru": "находиться, жить",
  "tone": "hoi",
  "audio": "audio/tones/hoi-4.mp3"
 },
 {
  "id": "hoi-5",
  "vi": "bảy",
  "ru": "семь",
  "tone": "hoi",
  "audio": "audio/tones/hoi-5.mp3"
 },
 {
  "id": "nga-1",
  "vi": "nghĩ",
  "ru": "думать",
  "tone": "nga",
  "audio": "audio/tones/nga-1.mp3"
 },
 {
  "id": "nga-2",
  "vi": "đã",
  "ru": "показатель прошедшего действия",
  "tone": "nga",
  "audio": "audio/tones/nga-2.mp3"
 },
 {
  "id": "nga-3",
  "vi": "sữa",
  "ru": "молоко",
  "tone": "nga",
  "audio": "audio/tones/nga-3.mp3"
 },
 {
  "id": "nga-4",
  "vi": "bữa",
  "ru": "приём пищи",
  "tone": "nga",
  "audio": "audio/tones/nga-4.mp3"
 },
 {
  "id": "nga-5",
  "vi": "cũ",
  "ru": "старый — о предмете",
  "tone": "nga",
  "audio": "audio/tones/nga-5.mp3"
 },
 {
  "id": "nang-1",
  "vi": "mẹ",
  "ru": "мама",
  "tone": "nang",
  "audio": "audio/tones/nang-1.mp3"
 },
 {
  "id": "nang-2",
  "vi": "chị",
  "ru": "старшая сестра",
  "tone": "nang",
  "audio": "audio/tones/nang-2.mp3"
 },
 {
  "id": "nang-3",
  "vi": "rộng",
  "ru": "просторный, широкий",
  "tone": "nang",
  "audio": "audio/tones/nang-3.mp3"
 },
 {
  "id": "nang-4",
  "vi": "ngọt",
  "ru": "сладкий",
  "tone": "nang",
  "audio": "audio/tones/nang-4.mp3"
 },
 {
  "id": "nang-5",
  "vi": "một",
  "ru": "один",
  "tone": "nang",
  "audio": "audio/tones/nang-5.mp3"
 }
];
export function shuffledToneWords(){return toneWords.map(word=>({word,key:Math.random()})).sort((a,b)=>a.key-b.key).map(x=>x.word);}
