import { BackButton } from './BackButton';
export type GamesCategory = 'lessons' | 'extra' | null;
export function GamesListScreen({ onBack, onOpenPeople, onOpenTravel, onOpenProfessions, onOpenFamily, onOpenHouse, onOpenLesson9 }: { category: GamesCategory; onCategoryChange: (category: GamesCategory) => void; onOpenRestaurant: () => void; onOpenQuestionTower: () => void; onOpenTaxi?: () => void; onOpenSuperBlitz: () => void; onOpenPeople: () => void; onBack: () => void; onOpenTravel: () => void; onOpenProfessions: () => void; onOpenFamily: () => void; onOpenHouse: () => void; onOpenLesson9: () => void }) {
 return <div className="screen games-menu-screen">
  <BackButton onClick={onBack} label="К выбору группы"/>
  <h1 className="screen-title">Игры по урокам</h1>
  {[
   ['Урок 5 · Профессии и место работы', onOpenProfessions],
   ['Урок 7 · Страны, города и путешествия', onOpenTravel],
   ['Урок 8 · Мы, они и все', onOpenPeople],
   ['Урок 9 · Числительные', onOpenLesson9],
   ['Урок 10 · Семья', onOpenFamily],
   ['Урок 11 · Дом и прилагательные', onOpenHouse],
  ].map(([title, open]) => <button key={title as string} className="lesson-item game-menu-item game-lesson-group" onClick={open as () => void}><span className="lesson-number">Игра · {title as string}</span></button>)}
 </div>;
}
