import { useEffect, useRef, useState } from 'react';
import { products } from '../content/marketProducts';
import { readJSON, writeJSON } from '../domain/storage';
import { speakVietnamese, stopSpeaking } from '../domain/speech';
import { BackButton } from './BackButton';

const storageKey = 'vietSveta.marketBlitz.errors.v1';
function shuffled<T,>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function optionsFor(index: number) {
  const others = products.map((_, i) => i).filter(i => i !== index && products[i][3] === products[index][3]);
  return shuffled([index, ...shuffled(others).slice(0, 5)]);
}
function loadErrors(): number[] {
  const raw = readJSON(storageKey);
  return Array.isArray(raw) ? products.map((p, i) => raw.includes(p[1]) ? i : -1).filter(i => i >= 0) : [];
}
function saveErrors(indices: number[]) { writeJSON(storageKey, indices.map(i => products[i][1])); }
function clock(ms: number) {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function MarketBlitzScreen({ onBack }: { onBack: () => void }) {
  const [saved, setSaved] = useState(loadErrors);
  const [round, setRound] = useState<number[]>([]);
  const [position, setPosition] = useState(0);
  const [options, setOptions] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number[]>([]);
  const [errors, setErrors] = useState<number[]>([]);
  const [correct, setCorrect] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [active, setActive] = useState(false);
  const [started, setStarted] = useState(false);
  const startTime = useRef(0);
  const locked = useRef(false);
  const transition = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => { clearTimeout(transition.current); stopSpeaking(); }, []);
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => setElapsed(Date.now() - startTime.current), 200);
    return () => clearInterval(interval);
  }, [active]);
  function start(indices: number[]) {
    clearTimeout(transition.current); stopSpeaking();
    const next = shuffled(indices);
    if (!next.length) return;
    setRound(next); setPosition(0); setOptions(optionsFor(next[0])); setWrong([]); setErrors([]);
    setCorrect(null); setElapsed(0); setStarted(true); setActive(true);
    locked.current = false; startTime.current = Date.now();
  }
  function choose(index: number) {
    if (locked.current || !active || wrong.includes(index)) return;
    const current = round[position];
    if (index !== current) {
      setWrong(w => [...w, index]);
      setErrors(e => e.includes(current) ? e : [...e, current]);
      const nextSaved = [...new Set([...saved, current])];
      setSaved(nextSaved); saveErrors(nextSaved);
      return;
    }
    locked.current = true; setCorrect(index); speakVietnamese(products[index][1]);
    transition.current = setTimeout(() => {
      if (position + 1 === round.length) {
        const remaining = [...new Set([...saved.filter(i => !round.includes(i)), ...errors])];
        setSaved(remaining); saveErrors(remaining);
        setElapsed(Date.now() - startTime.current); setActive(false);
      } else {
        setPosition(position + 1); setOptions(optionsFor(round[position + 1]));
        setWrong([]); setCorrect(null); locked.current = false;
      }
    }, 850);
  }
  const current = products[round[position]];
  return <div className="screen market-screen">
    <BackButton onClick={onBack} label="К выбору игры" />
    <h1 className="screen-title">⚡ Блиц: фрукты и овощи</h1>
    {!started ? <div className="market-intro"><h2>Проверь себя</h2><p>Картинка и шесть названий. Нажми правильное — появится следующий продукт. Неверная кнопка отключится, а продукт попадёт в ошибки.</p><p>Все {products.length} продуктов вперемешку. Секундомер без ограничения времени.</p><button className="big-button" onClick={() => start(products.map((_, i) => i))}>Начать проверку</button>{saved.length > 0 && <button className="secondary-button" onClick={() => start(saved)}>Проверить ошибки ({saved.length})</button>}</div>
    : active ? <>
      <div className="blitz-status"><span>Продукт {position + 1} из {round.length}</span><span>⏱ {clock(elapsed)}</span></div>
      <div className="market-card blitz-card"><div className="market-product" role="img" aria-label={current[2]}>{current[0]}</div><h2>Выбери название</h2>
        <div className="blitz-options">{options.map(i => <button key={i} className={'blitz-option' + (wrong.includes(i) ? ' blitz-wrong' : '') + (correct === i ? ' blitz-correct' : '')} disabled={correct !== null || wrong.includes(i)} onClick={() => choose(i)}>{products[i][1]}{wrong.includes(i) ? ' ✕' : correct === i ? ' ✓' : ''}</button>)}</div>
        <p className="blitz-feedback" aria-live="polite">{correct !== null ? 'Верно!' : wrong.length ? 'Попробуй другой вариант. Этот продукт повторим позже.' : 'Выбери один из шести вариантов'}</p>
      </div>
    </> : <div className="market-intro"><h2>{errors.length ? 'Проверка завершена' : 'Всё с первой попытки! 🎉'}</h2><p className="blitz-result">С первой попытки: {round.length - errors.length} из {round.length}</p><p>Время: {clock(elapsed)}</p>
      {errors.length > 0 && <><p>Ошибки в этом раунде:</p><ul className="blitz-errors">{errors.map(i => <li key={i}>{products[i][0]} {products[i][2]} — <strong>{products[i][1]}</strong></li>)}</ul></>}
      {saved.length > 0 && <button className="big-button" onClick={() => start(saved)}>Проверить ошибки ({saved.length})</button>}
      <button className="secondary-button" onClick={() => start(products.map((_, i) => i))}>Новый блиц</button>
    </div>}
  </div>;
}
