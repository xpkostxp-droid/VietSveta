import type { TheoryBlock } from '../../types';
import { lesson15Verbs } from '../vocabulary/lesson15';

const vocabulary = (heading: string, words: string[]): TheoryBlock => ({
  kind: 'vocab', heading,
  items: words.map(vi => lesson15Verbs.find(word => word.vi === vi)!),
});

export const lesson15Theory: TheoryBlock[] = [
  { kind: 'text', heading: 'Động từ — Глаголы', paragraphs: [
    '33 глагола и глагольных выражения из урока. К каждому дан перевод и короткий пример. Сочетания làm việc и nói chuyện учим целиком; muốn ngủ — пример сочетания двух уже известных глаголов.',
    'В примерах chị используется как «я» от лица Светланы. В разговоре это же обращение может означать «ты / Вы» или обозначать старшую женщину — значение зависит от собеседников.',
  ] },
  { kind: 'pattern', heading: '1. Как строится фраза',
    formula: 'Кто + (đã / đang / sẽ) + глагол + остальная часть фразы',
    formulaNote: 'Глагол не меняется по лицам. Đã указывает на предшествующее или завершённое действие, đang — на действие в процессе, sẽ — на будущее. Если время ясно из контекста, эти слова могут отсутствовать.',
    examples: [
      { vi: 'Chị đang học tiếng Việt.', ru: 'Я сейчас изучаю вьетнамский язык.' },
      { vi: 'Chị đã mua một xe máy mới.', ru: 'Я купила новый мотоцикл.' },
      { vi: 'Chị đã sang Việt Nam để làm việc.', ru: 'Я приехала во Вьетнам, чтобы работать.' },
    ],
  },
  { kind: 'pattern', heading: 'Отрицание и вопрос', formula: 'Кто + không + глагол · Кто + có + глагол + không?',
    examples: [
      { vi: 'Chị không muốn về nước.', ru: 'Я не хочу возвращаться на родину.' },
      { vi: 'Chị có thích đọc sách không?', ru: 'Вам нравится читать книги?' },
      { vi: 'Chị thích đọc tất cả các loại sách.', ru: 'Я люблю читать книги всех жанров.' },
    ],
  },
  vocabulary('2. Быть, иметь, жить', ['là', 'có', 'sống', 'ở']),
  vocabulary('3. Передвижение', ['đi', 'đến', 'về', 'sang']),
  vocabulary('4. Работа, учёба и понимание', ['làm', 'làm việc', 'học', 'đọc', 'nghĩ', 'biết', 'hiểu']),
  vocabulary('5. Повседневные действия', ['nghỉ', 'nghe', 'ngủ', 'ăn', 'uống', 'xem', 'mua', 'bán']),
  vocabulary('6. Желания, чувства и общение', ['thích', 'muốn', 'yêu', 'gặp', 'thăm', 'nói', 'nói chuyện']),
  vocabulary('7. Становиться и взрослеть', ['trở thành', 'trở nên', 'trưởng thành']),
  { kind: 'table', heading: '8. Не перепутать', columns: ['Слова', 'Разница'], rows: [
    ['nghĩ / nghỉ', 'nghĩ — думать; nghỉ — отдыхать. Разные тоны и значения.'],
    ['làm / làm việc', 'làm — делать или работать кем-либо: làm giáo viên. làm việc — работать: làm việc ở trường.'],
    ['sống / ở', 'sống — жить: sống ở Nha Trang. ở — находиться или проживать где-либо: ở nhà. В sống ở слово ở связывает действие с местом.'],
    ['trở thành / trở nên', 'trở thành + кем / чем: trở thành bác sĩ — стать врачом. trở nên + каким: trở nên tốt hơn — стать лучше.'],
    ['trưởng thành', 'Взрослеть, становиться взрослым. Не путать с trở thành — становиться кем-либо.'],
    ['thích / yêu', 'thích — нравиться, любить занятие: thích đọc sách. yêu — любить, испытывать любовь: yêu gia đình.'],
    ['biết / hiểu', 'biết — знать: biết tiếng Anh. hiểu — понимать: hiểu tiếng Việt.'],
    ['đến / sang / về', 'đến — прибыть в место; sang — переместиться в другую страну или на другую сторону; về — вернуться домой или к исходному месту. đến từ — быть родом из.'],
  ] },
  { kind: 'vocab', heading: '9. Полезные слова из записей', items: [
    { vi: 'bây giờ', ru: 'сейчас' },
    { vi: 'thường', ru: 'обычно', example: 'Chị thường nghỉ ở nhà.', exampleRu: 'Я обычно отдыхаю дома.' },
    { vi: 'hồi nhỏ', ru: 'в детстве', example: 'Hồi nhỏ, chị muốn trở thành bác sĩ.', exampleRu: 'В детстве я хотела стать врачом.' },
    { vi: 'tất cả', ru: 'все, всё' },
    { vi: 'để', ru: 'чтобы', example: 'sang Việt Nam để làm việc', exampleRu: 'приехать во Вьетнам, чтобы работать' },
    { vi: 'cuộc sống', ru: 'жизнь' },
    { vi: 'rất tốt', ru: 'очень хорошо; очень хороший' },
    { vi: 'mới / cũ', ru: 'новый / старый, бывший в употреблении' },
    { vi: 'bằng tiếng Việt', ru: 'на вьетнамском языке' },
    { vi: 'xe buýt', ru: 'автобус' },
    { vi: 'Trời ơi!', ru: 'О боже!' },
  ] },
  { kind: 'table', heading: 'Вопросительные слова', columns: ['Вьетнамский', 'Русский'], rows: [
    ['ai', 'кто'], ['của ai', 'чей'], ['với ai', 'с кем'], ['thế nào', 'как; какой'],
  ] },
  { kind: 'tip', heading: 'Hay и hoặc — «или»', items: [
    'Hay обычно используется в вопросе с выбором: trà hay cà phê? — чай или кофе?',
    'Hoặc часто используется для перечисления вариантов в сообщении. Это полезный ориентир, а не абсолютный запрет на другие употребления.',
  ] },
  { kind: 'dialogue', heading: '10. Короткие диалоги из урока', lines: [
    { speaker: 'A', vi: 'Cuộc sống ở Nha Trang thế nào?', ru: 'Как жизнь в Нячанге?' },
    { speaker: 'B', vi: 'Cuộc sống ở Nha Trang rất tốt.', ru: 'Жизнь в Нячанге очень хорошая.' },
    { speaker: 'A', vi: 'Bây giờ chị đang làm gì?', ru: 'Что Вы сейчас делаете?' },
    { speaker: 'B', vi: 'Chị đang nói chuyện bằng tiếng Việt.', ru: 'Я сейчас разговариваю на вьетнамском языке.' },
  ] },
];
