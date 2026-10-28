import { QuestionsBlitzScreen } from './components/QuestionsBlitzScreen';
import { MarketGameScreen } from './components/MarketGameScreen';
import { useState } from 'react';
import type { CardOrder, Direction } from './types';
import { saveLastActivity } from './domain/lastActivity';
import { BackButton } from './components/BackButton';
import { ListeningLessonScreen } from './components/ListeningLessonScreen';
import { HomeScreen } from './components/HomeScreen';
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
  | { name: 'game' }
  | { name: 'games-menu' }
  | { name: 'questions-blitz' }
  | { name: 'listening' }
  | { name: 'listening-lesson'; lesson?: number }
  | { name: 'pronunciation' }
  | { name: 'phonetics-test-list' }
  | { name: 'phonetics-test'; testId: PhoneticsTestId }
  | { name: 'theory-list' }
  | { name: 'theory-lesson'; lessonId: string }
  | { name: 'cards-lesson-list' }
  | { name: 'cards-setup'; lessonId: string }
  | { name: 'training'; lessonId: string; direction: Direction; order: CardOrder };

function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });

  switch (screen.name) {
    case 'home':
      // «Продолжить урок» на главном экране пока скрыт (по просьбе автора,
      // чтобы не загораживать фото), но какой урок открывали последним —
      // по-прежнему запоминается через saveLastActivity ниже, на будущее.
      return (
        <HomeScreen
          onOpenGame={() => setScreen({ name: 'games-menu' })}
          onOpenListening={() => setScreen({ name: 'listening' })}
          onOpenTheory={() => setScreen({ name: 'theory-list' })}
          onOpenCards={() => setScreen({ name: 'cards-lesson-list' })}
          onOpenPronunciation={() => setScreen({ name: 'pronunciation' })}
          onOpenPhoneticaTest={() => setScreen({ name: 'phonetics-test-list' })}
        />
      );

    case 'games-menu':
      return <div className="screen"><BackButton onClick={() => setScreen({ name: 'home' })} label="На главную"/><h1 className="screen-title">Игры</h1><button className="lesson-item" onClick={() => setScreen({ name: 'game' })}><span className="lesson-number">🍎 Фрукты и овощи</span></button><button className="lesson-item" onClick={() => setScreen({ name: 'questions-blitz' })}><span className="lesson-number">🏗️ Вопросы · Суперблиц</span></button></div>;

    case 'questions-blitz':
      return <QuestionsBlitzScreen onBack={() => setScreen({ name: 'games-menu' })}/>;

    case 'game':
      return <MarketGameScreen onBack={() => setScreen({ name: 'games-menu' })} />;

    case 'listening':
      return <div className="screen"><BackButton onClick={() => setScreen({ name: 'home' })} label="На главную" /><h1 className="screen-title">Аудирование</h1><button className="lesson-item" onClick={() => setScreen({ name: 'listening-lesson' })}><span className="lesson-number">Урок 1</span><span>Поездка в Вунгтау</span></button><button className="lesson-item" onClick={() => setScreen({ name: 'listening-lesson', lesson: 2 })}><span className="lesson-number">Урок 2</span><span>На рынке · 4 диалога</span></button></div>;

    case 'listening-lesson':
      return <ListeningLessonScreen key={screen.lesson ?? 1} lesson={screen.lesson} onBack={() => setScreen({ name: 'listening' })} />;

    case 'pronunciation':
      return <PronunciationScreen onBack={() => setScreen({ name: 'home' })} />;

    case 'phonetics-test':
      return <PhoneticaTestScreen key={screen.testId} testId={screen.testId} onBack={() => setScreen({ name: 'phonetics-test-list' })} />;

    case 'phonetics-test-list':
      return <PhoneticaTestListScreen onBack={() => setScreen({ name: 'home' })} onOpenTest={(testId) => setScreen({ name: 'phonetics-test', testId })} />;

    case 'theory-list':
      return (
        <TheoryListScreen
          onBack={() => setScreen({ name: 'home' })}
          onOpenLesson={(lessonId) => {
            saveLastActivity(lessonId, 'theory');
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
          onBack={() => setScreen({ name: 'home' })}
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
