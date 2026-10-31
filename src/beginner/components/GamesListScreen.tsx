import { BackButton } from './BackButton';
export type GamesCategory = 'lessons' | 'extra' | null;
export function GamesListScreen({ isAdmin=false, onOpenDigitBattle, onBack, onOpenPeople, onOpenTravel, onOpenProfessions, onOpenFamily, onOpenHouse, onOpenAdjectives, onOpenLesson9 }: { isAdmin?: boolean; onOpenDigitBattle?: () => void; category: GamesCategory; onCategoryChange: (category: GamesCategory) => void; onOpenRestaurant: () => void; onOpenQuestionTower: () => void; onOpenTaxi?: () => void; onOpenSuperBlitz: () => void; onOpenPeople: () => void; onBack: () => void; onOpenTravel: () => void; onOpenProfessions: () => void; onOpenFamily: () => void; onOpenHouse: () => void; onOpenAdjectives?: () => void; onOpenLesson9: () => void }) {
 return <div className="screen games-menu-screen">
  <BackButton onClick={onBack} label="К выбору группы"/>
  <h1 className="screen-title">Игры по урокам</h1>
  {[
   ['Урок 5 · Профессии и место работы', onOpenProfessions],
   ['Урок 7 · Страны, города и путешествия', onOpenTravel],
   ['Урок 8 · Мы, они и все', onOpenPeople],
   ['Урок 9 · Числительные', onOpenLesson9],
   ['Урок 10 · Семья', onOpenFamily],
   ['Урок 11 · Дом', onOpenHouse],
   ['Урок 11 · Прилагательные', onOpenAdjectives ?? onOpenHouse],
  ].map(([title, open]) => <button key={title as string} className="lesson-item game-menu-item game-lesson-group" onClick={open as () => void}><span className="lesson-number">Игра · {title as string}</span></button>)}
  {isAdmin && onOpenDigitBattle && <button className="lesson-item game-menu-item" onClick={onOpenDigitBattle}><span className="lesson-number">Батл · Цифры 0–9</span><small>С ботом · Тест для администратора</small></button>}
 </div>;
}
