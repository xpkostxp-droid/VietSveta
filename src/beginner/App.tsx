import ToneGameScreen from '../components/ToneGameScreen';
import {useScenicDepth} from '../domain/useScenicDepth';
import {beginnerScenicDepth} from '../domain/scenicDepth';
import './index.css';
import { BeginnerBattleScreen } from './battle/BeginnerBattleScreen';
import { readJSON, writeJSON } from './domain/storage';

import { QuestionsBlitzScreen } from './components/QuestionsBlitzScreen';
import { QuestionTowerGameScreen } from './components/QuestionTowerGameScreen';
import { RestaurantGameScreen } from './components/RestaurantGameScreen';
import { PeopleGameScreen } from './components/PeopleGameScreen';
import { NumbersGamesListScreen } from './components/NumbersGamesListScreen';
import { TravelGameScreen } from './components/TravelGameScreen';
import { ProfessionsGameScreen } from './components/ProfessionsGameScreen';
import { FamilyGameScreen } from './components/FamilyGameScreen';
import { HouseGameScreen } from './components/HouseGameScreen';
import { DialogueGameScreen } from './components/DialogueGameScreen';
import { BackButton } from './components/BackButton';
import { BigNumbersGameScreen } from './components/BigNumbersGameScreen';
import { lazy, Suspense, useState } from 'react';
const TaxiDemoScreen = lazy(() => import('./components/TaxiDemoScreen').then(m=>({default:m.TaxiDemoScreen})));
const ListeningScreen = lazy(() => import('./components/ListeningHub'));
import { PhoneGameScreen } from './components/PhoneGameScreen';
import type { NumberGameRange } from './content/games/ranges';
import { GamesListScreen, type GamesCategory } from './components/GamesListScreen';
import { CubesGameScreen } from './components/CubesGameScreen';
import { GameDirectionScreen, type NumberGameDirection } from './components/GameDirectionScreen';
import type { CardOrder, Direction } from './types';
import { saveLastActivity } from './domain/lastActivity';
import { TheoryListScreen } from './components/TheoryListScreen';
import { TheoryLessonScreen } from './components/TheoryLessonScreen';
import { CardsLessonListScreen } from './components/CardsLessonListScreen';
import { CardsSetupScreen } from './components/CardsSetupScreen';
import { TrainingScreen } from './components/TrainingScreen';
import { PronunciationScreen } from './components/PronunciationScreen';
import { PhoneticaTestScreen } from './components/PhoneticaTestScreen';
import { PhoneticaTestListScreen } from './components/PhoneticaTestListScreen';
import type { PhoneticsTestId } from './content/phonetics/tests';

type Screen =
  | { name: 'home' }
  | { name: 'listening' }
  | { name: 'games-list' }
  | { name: 'lesson-games-list' }
  | { name: 'listening-games' }
  | { name: 'tone-game' }
  | { name: 'tone-basics' }
  | { name: 'beginner-battle' }
  | { name: 'numbers-games-list' }
  | { name: 'family-game' }
  | { name: 'house-game' }
  | { name: 'adjectives-game' }
  | { name: 'professions-game' }
  | { name: 'travel-game' }
  | { name: 'people-game' }
  | { name: 'taxi-demo' }
  | { name: 'question-tower' }
  | { name: 'questions-superblitz' }
  | { name: 'restaurant-game' }
  | { name: 'dialogue-games-list' }
  | { name: 'dialogue-game-setup' }
  | { name: 'dialogue-game'; direction: NumberGameDirection }
  | { name: 'big-numbers-setup' }
  | { name: 'big-numbers-game'; reverse: boolean }
  | { name: 'numbers-game-setup'; range: NumberGameRange }
  | { name: 'numbers-game'; direction: NumberGameDirection; range: NumberGameRange }
  | { name: 'pronunciation' }
  | { name: 'phonetics-test-list' }
  | { name: 'phonetics-test'; testId: PhoneticsTestId }
  | { name: 'theory-list' }
  | { name: 'theory-lesson'; lessonId: string }
  | { name: 'cards-lesson-list' }
  | { name: 'cards-setup'; lessonId: string }
  | { name: 'training'; lessonId: string; direction: Direction; order: CardOrder };

export type BeginnerSection = 'games' | 'listening' | 'theory' | 'cards';
function App({section,onBack,isAdmin=false,memberName}:{section:BeginnerSection;onBack:()=>void;isAdmin?:boolean;memberName?:string}) {
  const [gamesCategory, setGamesCategory] = useState<GamesCategory>(null);
  const [requestedScreen, setScreen] = useState<Screen>(section === 'games' ? {name:'games-list'} : section === 'theory' ? {name:'theory-list'} : section === 'cards' ? {name:'cards-lesson-list'} : {name:'listening'});

  let screen = requestedScreen;
  if(!isAdmin) {
    if(['dialogue-games-list','dialogue-game-setup','dialogue-game','big-numbers-setup','big-numbers-game'].includes(screen.name)
      || ((screen.name === 'numbers-game-setup' || screen.name === 'numbers-game') && screen.range !== 'phone')) screen = {name:'numbers-games-list'};
  }
  useScenicDepth(beginnerScenicDepth(screen.name));
  switch (screen.name) {
    case 'listening':
      return <Suspense fallback={<div className="screen"><BackButton onClick={onBack} label="К выбору группы" /><p role="status">Загружаем аудирование…</p></div>}><ListeningScreen onBack={onBack} /></Suspense>;

    case 'tone-basics':
      return <ToneGameScreen variant="basics" onBack={()=>setScreen({name:'listening-games'})}/>;
    case 'tone-game':
      return <ToneGameScreen variant="syllables" onBack={()=>setScreen({name:'listening-games'})}/>;
    case 'listening-games':
      return <div className="screen games-menu-screen"><BackButton onClick={()=>setScreen({name:'games-list'})} label="К играм"/><h1 className="screen-title">Аудирование</h1><nav className="games-menu-keys" aria-label="Игры на аудирование"><button className="games-menu-key" onClick={()=>setScreen({name:'tone-basics'})}><span className="games-menu-key-icon" aria-hidden="true">🎧</span><span>Тоны · пять слогов</span></button><button className="games-menu-key" onClick={()=>setScreen({name:'tone-game'})}><span className="games-menu-key-icon" aria-hidden="true">🎧</span><span>Тоны · разные слоги</span></button></nav></div>;
    case 'games-list':
      return <div className="screen games-menu-screen">
        <BackButton onClick={onBack} label="К выбору группы"/>
        <h1 className="screen-title">Игры</h1>
        <nav className="games-menu-keys" aria-label="Разделы игр">
          <button className="games-menu-key games-menu-key-battle" onClick={()=>setScreen({name:'beginner-battle'})}><span className="games-menu-key-icon" aria-hidden="true">⚔️</span>{' '}<span>Батл</span></button>
          <button className="games-menu-key" onClick={()=>setScreen({name:'listening-games'})}><span className="games-menu-key-icon" aria-hidden="true">🎧</span><span>Аудирование</span></button>
          <button className="games-menu-key" onClick={()=>setScreen({name:'lesson-games-list'})}><span className="games-menu-key-icon" aria-hidden="true">📚</span><span>Игры по урокам</span></button>
        </nav>
      </div>;
    case 'lesson-games-list':
      return <GamesListScreen isAdmin={isAdmin} category={gamesCategory} onCategoryChange={setGamesCategory} onOpenTaxi={() => setScreen({ name: 'taxi-demo' })} onOpenQuestionTower={() => setScreen({ name: 'question-tower' })} onOpenSuperBlitz={() => setScreen({ name: 'questions-superblitz' })} onOpenRestaurant={() => setScreen({ name: 'restaurant-game' })} onOpenPeople={() => setScreen({ name: 'people-game' })} onBack={()=>setScreen({name:'games-list'})} onOpenTravel={() => setScreen({ name: 'travel-game' })} onOpenProfessions={() => setScreen({ name: 'professions-game' })} onOpenFamily={() => setScreen({ name: 'family-game' })} onOpenHouse={() => setScreen({ name: 'house-game' })} onOpenAdjectives={() => setScreen({ name: 'adjectives-game' })} onOpenLesson9={() => setScreen({ name: 'numbers-games-list' })} />;

    case 'beginner-battle':
      return <BeginnerBattleScreen playerName={memberName} onBack={() => setScreen({name:'games-list'})}/>;

    case 'numbers-games-list':
      return <NumbersGamesListScreen isAdmin={isAdmin} onBack={() => setScreen({ name: 'lesson-games-list' })} onOpenDialogues={() => setScreen({ name: 'dialogue-games-list' })} onOpenBigNumbers={() => setScreen({ name: 'big-numbers-setup' })} onOpenNumbers={range => setScreen({ name: 'numbers-game-setup', range })} />;

    case 'questions-superblitz':
      return <QuestionsBlitzScreen onBack={() => { setGamesCategory('extra'); setScreen({ name: 'games-list' }); }} />;

    case 'taxi-demo':
      return <Suspense fallback={<div className="screen"><BackButton onClick={()=>setScreen({name:'games-list'})} label="К играм"/><p role="status">Загружаем игру…</p></div>}><TaxiDemoScreen onBack={() => { setGamesCategory('extra'); setScreen({ name: 'games-list' }); }} /></Suspense>;

    case 'question-tower':
      return <QuestionTowerGameScreen onBack={() => { setGamesCategory('extra'); setScreen({ name: 'games-list' }); }} />;

    case 'restaurant-game':
      return <RestaurantGameScreen onBack={() => setScreen({ name: 'games-list' })} />;

    case 'people-game':
      return <PeopleGameScreen onBack={() => setScreen({ name: 'lesson-games-list' })} />;

    case 'travel-game':
      return <TravelGameScreen onBack={() => setScreen({ name: 'lesson-games-list' })} />;

    case 'professions-game':
      return <ProfessionsGameScreen onBack={() => setScreen({ name: 'lesson-games-list' })} />;

    case 'family-game':
      return <FamilyGameScreen onBack={() => setScreen({ name: 'lesson-games-list' })} />;

    case 'adjectives-game':
      return <HouseGameScreen key="adjectives" game="adjectives" onBack={() => setScreen({ name: 'lesson-games-list' })} />;

    case 'house-game':
      return <HouseGameScreen key="house" onBack={() => setScreen({ name: 'lesson-games-list' })} />;

    case 'dialogue-games-list':
      return <div className="screen"><BackButton onClick={() => setScreen({ name: 'numbers-games-list' })} label="К уроку 9" /><span className="badge">Урок 9 · Числа и возраст</span><h1 className="screen-title">Диалоги</h1><button className="lesson-item game-menu-item" onClick={() => setScreen({ name: 'dialogue-game-setup' })}><span className="game-menu-icon" aria-hidden="true">💬</span><span className="lesson-number">Собери фразу</span><span>17 фраз · Знакомство и возраст</span></button></div>;

    case 'dialogue-game-setup':
      return <div className="screen"><BackButton onClick={() => setScreen({ name: 'dialogue-games-list' })} label="К диалогам" /><span className="badge">Урок 9 · Диалоги</span><h1 className="screen-title">Собери фразу</h1><button className="big-button" onClick={() => setScreen({ name: 'dialogue-game', direction: 'vi-ru' })}>Вьетнамский → Русский</button><button className="big-button" onClick={() => setScreen({ name: 'dialogue-game', direction: 'ru-vi' })}>Русский → Вьетнамский</button></div>;
    case 'dialogue-game':
      return <DialogueGameScreen key={screen.direction} direction={screen.direction} onBack={() => setScreen({ name: 'dialogue-game-setup' })} />;

    case 'big-numbers-setup':
      return <div className="screen"><BackButton onClick={() => setScreen({ name: 'numbers-games-list' })} label="К уроку 9" /><span className="badge">Урок 9 · Числа и возраст</span><h1 className="screen-title">Большие числа</h1><button className="big-button" onClick={() => setScreen({ name: 'big-numbers-game', reverse: false })}>Цифры → Вьетнамский</button><button className="big-button" onClick={() => setScreen({ name: 'big-numbers-game', reverse: true })}>Вьетнамский → Цифры</button></div>;
    case 'big-numbers-game':
      return <BigNumbersGameScreen key={String(screen.reverse)} reverse={screen.reverse} onBack={() => setScreen({ name: 'big-numbers-setup' })} />;

    case 'numbers-game-setup':
      if(screen.range === 'phone') return <PhoneGameScreen onBack={() => setScreen({ name: 'numbers-games-list' })} />;
      return <GameDirectionScreen range={screen.range} onBack={() => setScreen({ name: 'numbers-games-list' })} onStart={direction => setScreen({ name: 'numbers-game', direction, range: screen.range })} />;

    case 'numbers-game':
      if(screen.range === 'phone') return <PhoneGameScreen onBack={() => setScreen({ name: 'numbers-games-list' })} />;
      return <CubesGameScreen key={`${screen.range}-${screen.direction}`} range={screen.range} direction={screen.direction} onBack={() => setScreen({ name: 'numbers-game-setup', range: screen.range })} />;

    case 'pronunciation':
      return <PronunciationScreen onBack={onBack} />;

    case 'phonetics-test':
      return <PhoneticaTestScreen key={screen.testId} testId={screen.testId} onBack={() => setScreen({ name: 'phonetics-test-list' })} />;

    case 'phonetics-test-list':
      return <PhoneticaTestListScreen onBack={onBack} onOpenTest={(testId) => setScreen({ name: 'phonetics-test', testId })} />;

    case 'theory-list':
      return (
        <TheoryListScreen
          onBack={onBack}
          onOpenLesson={(lessonId) => {
            saveLastActivity(lessonId, 'theory');
            const visits=readJSON('vietCards.theoryVisits.v1');
            writeJSON('vietCards.theoryVisits.v1',{...(visits&&typeof visits==='object'?visits:{}),[lessonId]:Date.now()});
            setScreen({ name: 'theory-lesson', lessonId });
          }}
        />
      );

    case 'theory-lesson':
      return (
        <TheoryLessonScreen
          lessonId={screen.lessonId}
          onBack={() => setScreen({ name: 'theory-list' })}
        />
      );

    case 'cards-lesson-list':
      return (
        <CardsLessonListScreen
          onBack={onBack}
          onOpenLesson={(lessonId) => {
            saveLastActivity(lessonId, 'cards');
            setScreen({ name: 'cards-setup', lessonId });
          }}
        />
      );

    case 'cards-setup':
      return (
        <CardsSetupScreen
          lessonId={screen.lessonId}
          onBack={() => setScreen({ name: 'cards-lesson-list' })}
          onStart={(direction, order) =>
            setScreen({ name: 'training', lessonId: screen.lessonId, direction, order })
          }
        />
      );

    case 'training':
      return (
        <TrainingScreen
          lessonId={screen.lessonId}
          direction={screen.direction}
          order={screen.order}
          onExit={() => setScreen({ name: 'cards-setup', lessonId: screen.lessonId })}
        />
      );

    default:
      return null;
  }
}

export default App;
