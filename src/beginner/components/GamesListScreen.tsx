import '../../components/GamesMenu.css';
import { BackButton } from './BackButton';
export type GamesCategory = 'lessons' | 'extra' | null;
export function GamesListScreen({ onOpenListeningGames, onOpenBattle, onBack, onOpenPeople, onOpenTravel, onOpenProfessions, onOpenFamily, onOpenHouse, onOpenAdjectives, onOpenLesson9 }: { onOpenListeningGames?:()=>void; isAdmin?: boolean; onOpenBattle?: () => void; category: GamesCategory; onCategoryChange: (category: GamesCategory) => void; onOpenRestaurant: () => void; onOpenQuestionTower: () => void; onOpenTaxi?: () => void; onOpenSuperBlitz: () => void; onOpenPeople: () => void; onBack: () => void; onOpenTravel: () => void; onOpenProfessions: () => void; onOpenFamily: () => void; onOpenHouse: () => void; onOpenAdjectives?: () => void; onOpenLesson9: () => void }) {
 return <div className="screen games-menu-screen">
  <BackButton onClick={onBack} label="К выбору группы"/>
  <h1 className="screen-title">Игры по урокам</h1>
  {onOpenBattle && <nav className="games-menu-keys" aria-label="Батлы"><button className="games-menu-key games-menu-key-battle" onClick={onOpenBattle}><span className="games-menu-key-icon" aria-hidden="true">⚔️</span>{' '}<span>Батл</span></button></nav>}
  {onOpenListeningGames&&<nav className="games-menu-keys" aria-label="Аудирование"><button className="games-menu-key" onClick={onOpenListeningGames}><span className="games-menu-key-icon" aria-hidden="true">🎧</span><span>Аудирование</span></button></nav>}
  {[
   ['Урок 5 · Профессии и место работы', onOpenProfessions],
   ['Урок 7 · Страны, города и путешествия', onOpenTravel],
   ['Урок 8 · Мы, они и все', onOpenPeople],
   ['Урок 9 · Числительные', onOpenLesson9],
   ['Урок 10 · Семья', onOpenFamily],
   ['Урок 11 · Дом', onOpenHouse],
   ['Урок 11 · Прилагательные', onOpenAdjectives ?? onOpenHouse],
  ].map(([title, open]) => <button key={title as string} className="lesson-item game-menu-item game-lesson-group" onClick={open as () => void}><span className="lesson-number">Игра · {title as string}</span></button>)}

 </div>;
}
