import { useState } from 'react';
import { MarketBlitzScreen } from './MarketBlitzScreen';
import { BackButton } from './BackButton';
export function MarketGameScreen({ onBack }: { onBack: () => void }) {
  const [category, setCategory] = useState<'all' | 'fruits' | 'vegetables' | null>(null);
  if (category) return <MarketBlitzScreen key={category} category={category} onBack={() => setCategory(null)} />;
  return <div className="screen market-screen">
    <BackButton onClick={onBack} label="К выбору игры" />
    <h1 className="screen-title">Фрукты и овощи</h1>
    <div className="market-options" style={{ gap: 18 }}>
      {([['fruits', '🍉 Фрукты'], ['vegetables', '🥕 Овощи'], ['all', '⚡ Суперблиц · фрукты и овощи']] as const).map(([value, label]) =>
        <button key={value} className="big-button" style={{ width: '100%', minHeight: 110, fontSize: '1.5rem', fontWeight: 800 }} onClick={() => setCategory(value)}>{label}</button>)}
    </div>
    <a href={import.meta.env.BASE_URL+'market/credits.html'} target="_blank" rel="noreferrer">Источники изображений</a>
  </div>;
}
