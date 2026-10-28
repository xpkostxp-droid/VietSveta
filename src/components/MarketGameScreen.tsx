import { products } from '../content/marketProducts';
import { MarketBlitzScreen } from './MarketBlitzScreen';
import { useEffect, useState } from 'react';
import { BackButton } from './BackButton';
import { hasVietnameseVoice, onVoicesChanged, speakVietnamese, stopSpeaking } from '../domain/speech';
import { readJSON, writeJSON } from '../domain/storage';

const key = 'vietSveta.marketGame.v1';
type Progress = Record<string, number>;
function loadScores(): Progress {
  const raw = readJSON(key);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return Object.fromEntries(Object.entries(raw).filter(([, v]) => typeof v === 'number' && Number.isFinite(v) && v >= 0));
}

export function MarketGameScreen({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<'menu' | 'blitz' | 'training'>('menu');
  const [category, setCategory] = useState('all');
  const [queue, setQueue] = useState<number[]>([]);
  const [started, setStarted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [hint, setHint] = useState(false);
  const [wins, setWins] = useState<Progress>({});
  const [basket, setBasket] = useState<number[]>([]);
  const [scores, setScores] = useState(loadScores);
  const [voice, setVoice] = useState(hasVietnameseVoice);
  useEffect(() => {
    const unsubscribe = onVoicesChanged(() => setVoice(hasVietnameseVoice()));
    return () => { unsubscribe(); stopSpeaking(); };
  }, []);
  const current = products[queue[0]];
  const start = () => {
    const selected = products.map((_, i) => i).filter(i => category === 'all' || products[i][3] === category)
      .map(i => ({ i, score: scores[products[i][1]] ?? 0, random: Math.random() }))
      .sort((a, b) => a.score - b.score || a.random - b.random).slice(0, 5).map(x => x.i);
    setQueue(selected); setWins({}); setBasket([]); setHint(false); setRevealed(false); setStarted(true);
  };
  const rate = (remembered: boolean) => {
    if (!current) return;
    stopSpeaking();
    const id = current[1];
    const success = remembered && !hint;
    const count = success ? (wins[id] ?? 0) + 1 : 0;
    setWins({ ...wins, [id]: count });
    const updated = { ...scores, [id]: success ? (scores[id] ?? 0) + 1 : 0 };
    setScores(updated); writeJSON(key, updated);
    const remaining = queue.slice(1);
    if (count >= 2) setBasket(b => [...b, queue[0]]);
    else remaining.splice(Math.min(2, remaining.length), 0, queue[0]);
    setQueue(remaining); setHint(false); setRevealed(false);
  };
  if (mode === 'blitz') return <MarketBlitzScreen onBack={() => setMode('menu')} />;
  if (mode === 'menu') return <div className="screen market-screen">
    <BackButton onClick={onBack} label="К выбору игры" />
    <h1 className="screen-title">Фрукты и овощи</h1>
    <div className="market-options" style={{ gap: 18 }}>
      <button className="big-button" style={{ width: '100%', minHeight: 110, fontSize: '1.5rem', fontWeight: 800 }} onClick={() => setMode('blitz')}>⚡ Блиц</button>
      <button className="big-button" style={{ width: '100%', minHeight: 110, fontSize: '1.5rem', fontWeight: 800 }} onClick={() => setMode('training')}>🧺 Обучение</button>
    </div>
  </div>;
  return <div className={'screen market-screen' + (started && current ? ' market-learning-active' : '')}>
    <BackButton onClick={started ? () => { stopSpeaking(); setStarted(false); } : () => setMode('menu')} label={started ? 'К обучению' : 'К выбору режима'} />
    <h1 className="screen-title">Фрукты и овощи</h1>
    {!started ? <>
      <div className="market-intro">🧺<h2>Собери корзину</h2><p>Посмотри на картинку и назови продукт по-вьетнамски вслух. Затем открой ответ и проверь себя.</p><p>Пять продуктов за раунд. Дважды вспомни название без подсказки — и продукт в корзине. Забытые слова вернутся чуть позже.</p></div>
      <div className="market-options">{[['all', 'Всё вместе'], ['fruits', 'Фрукты · урок 44'], ['vegetables', 'Овощи · урок 43']].map(([value, label]) => <button key={value} className={'choice-button ' + (category === value ? 'choice-button-active' : '')} aria-pressed={category === value} onClick={() => setCategory(value)}>{label}</button>)}</div>
      <button className="big-button" onClick={start}>На рынок →</button>
    </> : current ? <>
      <p className="learning-counter">🧺 {basket.length} из 5 · Назови по-вьетнамски</p>
      <div className="market-card learning-card">
        <div className="market-product" role="img" aria-label={current[2]}>{current[0]}</div>
        <p className="market-russian">{current[2]}</p>
        <div className="market-answer" aria-live="polite">{revealed ? current[1] : hint ? current[1].slice(0, 1) + '…' : 'Вспомни и скажи вслух'}</div>
        <div className="learning-toolbar">
          <div className="learning-tools" style={{ visibility: revealed ? 'hidden' : 'visible' }} aria-hidden={revealed}>
            <button className="secondary-button" disabled={hint || revealed} onClick={() => setHint(true)}>Первая буква</button>
            <button className="big-button" disabled={revealed} onClick={() => { setRevealed(true); speakVietnamese(current[1]); }}>Показать ответ</button>
          </div>
          <div className="learning-tools learning-listen" style={{ visibility: revealed ? 'visible' : 'hidden' }} aria-hidden={!revealed}>
            <button className="secondary-button" disabled={!voice || !revealed} onClick={() => speakVietnamese(current[1])}>🔊 Послушать</button>
          </div>
        </div>
        <div className="market-ratings learning-ratings" style={{ visibility: revealed ? 'visible' : 'hidden' }} aria-hidden={!revealed}>
          <button className="big-button" disabled={!revealed || hint} onClick={() => rate(true)}>Вспомнил</button>
          <button className="secondary-button" disabled={!revealed} onClick={() => rate(false)}>С подсказкой</button>
          <button className="secondary-button" disabled={!revealed} onClick={() => rate(false)}>Забыл</button>
        </div>
      </div>
    </> : <div className="market-intro"><div className="market-basket">🧺 {basket.map(i => products[i][0]).join(' ')}</div><h2>Корзина собрана!</h2><p>Все пять названий удалось вспомнить дважды без подсказки. В следующем раунде первыми появятся слова, которым нужно больше практики.</p><button className="big-button" onClick={start}>Ещё пять продуктов</button><button className="secondary-button" onClick={() => setStarted(false)}>Выбрать категорию</button></div>}
  </div>;
}
