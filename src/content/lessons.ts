// Учебные материалы: список уроков.
// Группа Светы: группа продвинулась дальше, чем демо-версия сайта, поэтому
// уроки добавляются не по порядку, а по мере готовности материалов —
// ранние уроки (1–51 и т.д.) появятся здесь позже.
//
// Чтобы добавить урок: впиши запись в lessons ниже (id вида 'lesson-N',
// number — номер урока, title — название). Если есть материалы теории —
// создай файл в src/content/theory/ (по образцу старых lessonN.ts из
// исходного проекта) и подключи его импортом в theoryByLessonId. Карточки
// для урока добавляются в cards.ts с тем же lessonId.
//
// ID уроков и карточек — постоянные, их нельзя менять после публикации,
// иначе гостевой прогресс участников потеряет связь с уроком.

import type { Lesson, TheoryMaterial } from '../types';
import { lesson42Theory } from './theory/lesson42';
import { lesson52Theory } from './theory/lesson52';

export const lessons: Lesson[] = [
  {
    id: 'lesson-42',
    number: 42,
    title: 'Магазины, еда и напитки',
  },
  {
    id: 'lesson-46',
    number: 46,
    title: 'Прилагательные: пары и вкусы',
  },
  {
    id: 'lesson-52',
    number: 52,
    title: 'So sánh — Сравнение',
  },
];

// Материалы теории по ID урока. У урока без записи здесь экран теории
// покажет заглушку «Материалы скоро появятся».
const theoryByLessonId: Record<string, TheoryMaterial['sections']> = {
  'lesson-42': lesson42Theory,
  'lesson-52': lesson52Theory,
};

export const theoryMaterials: TheoryMaterial[] = lessons.map((lesson) => ({
  lessonId: lesson.id,
  sections: theoryByLessonId[lesson.id] ?? null,
}));

export function getLessonById(lessonId: string): Lesson | undefined {
  return lessons.find((l) => l.id === lessonId);
}

export function getTheoryForLesson(lessonId: string): TheoryMaterial['sections'] {
  return theoryMaterials.find((m) => m.lessonId === lessonId)?.sections ?? null;
}
