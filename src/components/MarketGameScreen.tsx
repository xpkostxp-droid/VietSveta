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
  const [blitz, setBlitz] = useState(false);
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
  if (blitz) return <MarketBlitzScreen onBack={() => setBlitz(false)} />;
  return <div className="screen market-screen">
    <BackButton onClick={started ? () => { stopSpeaking(); setStarted(false); } : onBack} label={started ? 'К выбору игры' : 'На главную'} />
    <h1 className="screen-title">Фрукты и овощи</h1>
    {!started ? <>
      <div className="market-intro"><h2>⚡ Блиц: фрукты и овощи</h2><p>Спаси урожай! Три варианта и пять секунд на ответ. Собирай продукты в корзину, а пропущенные доберём после раунда.</p><button className="big-button" onClick={() => setBlitz(true)}>Начать блиц</button></div>
      <div className="market-intro">🧺<h2>Собери корзину</h2><p>Посмотри на картинку и назови продукт по-вьетнамски вслух. Затем открой ответ и проверь себя.</p><p>Пять продуктов за раунд. Дважды вспомни название без подсказки — и продукт в корзине. Забытые слова вернутся чуть позже.</p></div>
      <div className="market-options">{[['all', 'Всё вместе'], ['fruits', 'Фрукты · урок 44'], ['vegetables', 'Овощи · урок 43']].map(([value, label]) => <button key={value} className={'choice-button ' + (category === value ? 'choice-button-active' : '')} aria-pressed={category === value} onClick={() => setCategory(value)}>{label}</button>)}</div>
      <button className="big-button" onClick={start}>На рынок →</button>
    </> : current ? <>
      <p className="market-counter">В корзине: {basket.length} из 5 · Без таймера</p>
      <div className="market-card">
        <div className="market-product" role="img" aria-label={current[2]}>{current[0]}</div>
        <p className="market-russian">{current[2]}</p>
        <h2>Как это по-вьетнамски?</h2>
        <div className="market-answer" aria-live="polite">{revealed ? current[1] : hint ? current[1].slice(0, 1) + '…' : 'Вспомни и скажи вслух'}</div>
        {!revealed ? <div className="market-actions"><button className="secondary-button" disabled={hint} onClick={() => setHint(true)}>Первая буква</button><button className="big-button" onClick={() => { setRevealed(true); speakVietnamese(current[1]); }}>Показать ответ</button></div> : <>
          <button className="secondary-button" disabled={!voice} onClick={() => speakVietnamese(current[1])}>🔊 Послушать</button>
          <p>Получилось вспомнить до открытия ответа?</p>
          <div className="market-ratings"><button className="big-button" disabled={hint} onClick={() => rate(true)}>Вспомнила</button><button className="secondary-button" onClick={() => rate(false)}>С подсказкой</button><button className="secondary-button" onClick={() => rate(false)}>Забыла</button></div>
        </>}
      </div>
      <div className="market-basket" aria-label="Собранные продукты">🧺 {basket.map(i => products[i][0]).join(' ')}</div>
      {!voice && <p className="market-note">Для озвучки нужен вьетнамский голос на устройстве. Играть можно и без звука.</p>}
    </> : <div className="market-intro"><div className="market-basket">🧺 {basket.map(i => products[i][0]).join(' ')}</div><h2>Корзина собрана!</h2><p>Все пять названий вспомнила дважды без подсказки. В следующем раунде первыми появятся слова, которым нужно больше практики.</p><button className="big-button" onClick={start}>Ещё пять продуктов</button><button className="secondary-button" onClick={() => setStarted(false)}>Выбрать категорию</button></div>}
  </div>;
}
