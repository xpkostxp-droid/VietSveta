import { BookIcon, CardsIcon, ChevronRightIcon, SpeakerOnIcon } from './icons';

interface Props {
  onOpenGame: () => void;
  onOpenListening: () => void;
  onOpenTheory: () => void;
  onOpenCards: () => void;
  onOpenPronunciation: () => void;
  onOpenPhoneticaTest: () => void;
}

export function HomeScreen({ onOpenGame, onOpenListening, onOpenTheory, onOpenCards, onOpenPronunciation, onOpenPhoneticaTest }: Props) {
  return (
    <div className="screen screen-home">
      <div className="home-tiles">
        <button className="home-tile home-tile-blue home-tile-game" onClick={onOpenGame}><span className="home-tile-icon" aria-hidden="true">🎮</span><span className="home-tile-label">Игра</span></button>
        <button className="home-tile home-tile-teal home-tile-listening" onClick={onOpenListening}>
          <svg className="home-tile-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 14v-3a8 8 0 0 1 16 0v3M4 12H3v7h4v-7H4Zm16 0h1v7h-4v-7h3Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span className="home-tile-label">Аудирование</span>
        </button>
        <button className="home-tile home-tile-blue home-tile-pronunciation" onClick={onOpenPronunciation}>
          <SpeakerOnIcon className="home-tile-icon" />
          <span className="home-tile-label">Фонетика</span>
          <ChevronRightIcon className="home-tile-chevron" />
        </button>
        <button className="home-tile home-tile-teal home-tile-phonetics-test" onClick={onOpenPhoneticaTest}>
          <SpeakerOnIcon className="home-tile-icon" />
          <span className="home-tile-label">Фонетика тест</span>
        </button>

        <button className="home-tile home-tile-blue home-tile-study" onClick={onOpenTheory}>
          <BookIcon className="home-tile-icon" />
          <span className="home-tile-label">Теория</span>
          <ChevronRightIcon className="home-tile-chevron" />
        </button>
        <button className="home-tile home-tile-teal home-tile-study" onClick={onOpenCards}>
          <CardsIcon className="home-tile-icon" />
          <span className="home-tile-label">Карточки</span>
          <ChevronRightIcon className="home-tile-chevron" />
        </button>
      </div>
    </div>
  );
}
