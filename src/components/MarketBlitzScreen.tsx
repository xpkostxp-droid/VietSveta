import { useEffect, useRef, useState } from 'react';
import { products } from '../content/marketProducts';
import { readJSON, writeJSON } from '../domain/storage';
import { speakVietnamese, stopSpeaking } from '../domain/speech';
import { BackButton } from './BackButton';

const storageKey = 'vietSveta.marketBlitz.errors.v1';
const QUESTION_MS = 5000;
const FEEDBACK_MS = 1700;
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
  return shuffled([index, ...shuffled(others).slice(0, 2)]);
}
function loadErrors(): number[] {
  const raw = readJSON(storageKey);
  return Array.isArray(raw) ? products.map((p, i) => raw.includes(p[1]) ? i : -1).filter(i => i >= 0) : [];
}
function saveErrors(indices: number[]) { writeJSON(storageKey, indices.map(i => products[i][1])); }
type Phase = 'question' | 'success' | 'wrong' | 'timeout';

export function MarketBlitzScreen({ onBack }: { onBack: () => void }) {
  const [saved, setSaved] = useState(loadErrors);
  const [round, setRound] = useState<number[]>([]);
  const [position, setPosition] = useState(0);
  const [options, setOptions] = useState<number[]>([]);
  const [errors, setErrors] = useState<number[]>([]);
  const [collected, setCollected] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>('question');
  const [selected, setSelected] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(QUESTION_MS);
  const [active, setActive] = useState(false);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const deadline = useRef(0);
  const frozen = useRef(QUESTION_MS);
  const locked = useRef(false);
  const pausedRef = useRef(false);

  useEffect(() => () => stopSpeaking(), []);
  useEffect(() => {
    function hide() {
      if (document.hidden && active && !pausedRef.current) {
        frozen.current = Math.max(0, deadline.current - Date.now());
        pausedRef.current = true; setPaused(true); stopSpeaking();
      }
    }
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, [active]);

  // Only one short timer is active. No animation loops run between questions.
  useEffect(() => {
    if (!active || paused) return;
    if (phase === 'question') {
      const tick = () => {
        if (pausedRef.current) return;
        const left = Math.max(0, deadline.current - Date.now());
        setRemaining(left);
        if (!left) resolve(null);
      };
      const timer = setInterval(tick, 100);
      return () => clearInterval(timer);
    }
    const timer = setTimeout(() => {
      if (pausedRef.current) return;
      if (position + 1 === round.length) setActive(false);
      else {
        const next = position + 1;
        setPosition(next); setOptions(optionsFor(round[next])); setSelected(null);
        setRemaining(QUESTION_MS); deadline.current = Date.now() + QUESTION_MS;
        locked.current = false; setPhase('question');
      }
    }, FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [active, paused, phase, position, round]);

  function start(indices: number[]) {
    const next = shuffled(indices);
    if (!next.length) return;
    stopSpeaking(); setRound(next); setPosition(0); setOptions(optionsFor(next[0]));
    setErrors([]); setCollected([]); setSelected(null); setPhase('question');
    setRemaining(QUESTION_MS); setStreak(0); setBest(0);
    setStarted(true); setActive(true); setPaused(false); pausedRef.current = false;
    locked.current = false; deadline.current = Date.now() + QUESTION_MS;
  }
  function resolve(index: number | null) {
    if (locked.current || pausedRef.current || !active) return;
    locked.current = true;
    const current = round[position];
    // A click at or after the deadline is a timeout, even between timer ticks.
    const timedOut = index === null || Date.now() >= deadline.current;
    const success = !timedOut && index === current;
    setSelected(index); setPhase(success ? 'success' : timedOut ? 'timeout' : 'wrong');
    const nextSaved = success ? saved.filter(i => i !== current) : [...new Set([...saved, current])];
    setSaved(nextSaved); saveErrors(nextSaved);
    if (success) {
      setCollected(c => [...c, current]); setStreak(s => s + 1); setBest(b => Math.max(b, streak + 1));
    } else {
      setErrors(e => [...e, current]); setStreak(0);
    }
    speakVietnamese(products[current][1]);
  }
  function resume() {
    if (document.hidden) return;
    deadline.current = Date.now() + frozen.current;
    pausedRef.current = false; setPaused(false);
  }
  const current = products[round[position]];
  return <div className="screen market-screen harvest-screen">
    <BackButton onClick={onBack} label="К выбору игры" />
    <h1 className="screen-title">🍉 Спаси урожай</h1>
    {!started ? <div className="market-intro"><h2>Фруктовый блиц</h2>
      <p>Три названия и пять секунд на ответ. Угадала — продукт в корзине. Ошибка или время вышло — пух! 💥 Этот продукт доберём после раунда.</p>
      <p>Все {products.length} фруктов и овощей вперемешку, каждый — один раз. Корзина при ошибке сохраняется.</p>
      <button className="big-button" onClick={() => start(products.map((_, i) => i))}>Начать проверку</button>
      {saved.length > 0 && <button className="secondary-button" onClick={() => start(saved)}>Добрать урожай — {saved.length}</button>}
    </div> : active ? <>
      <div className="blitz-status"><span>Продукт {position + 1} из {round.length}</span><span>🧺 {collected.length} · 🔥 {streak}</span></div>
      <div className="harvest-timer" role="progressbar" aria-label="Время на ответ" aria-valuemin={0} aria-valuemax={5} aria-valuenow={phase === 'question' ? Math.ceil(remaining / 1000) : 0}><div style={{ width: `${phase === 'question' ? remaining / QUESTION_MS * 100 : 0}%` }} /></div>
      <p className="harvest-seconds">{paused ? 'Пауза' : phase === 'question' ? `${Math.ceil(remaining / 1000)} сек` : phase === 'success' ? '+1 в корзину!' : phase === 'timeout' ? 'Время вышло!' : 'Пух! Доберём позже'}</p>
      {paused ? <div className="market-intro"><h2>Урожай подождёт ⏸</h2><p>Игра на паузе. Продолжим, когда будешь готова.</p><button className="big-button" onClick={resume}>Продолжить</button></div> : <div className="market-card blitz-card">
        <div className={'harvest-stage harvest-' + phase} key={`${position}-${phase}`}>
          <div className="market-product" role="img" aria-label={current[2]}>{current[0]}</div>
          {(phase === 'wrong' || phase === 'timeout') && <div className="harvest-puff" aria-hidden="true">💥<span>✦</span><span>✧</span><span>✦</span></div>}
        </div>
        <h2>{phase === 'question' ? 'Выбери название' : current[1]}</h2>
        {phase !== 'question' && <p className="harvest-translation">{current[2]}</p>}
        <div className="blitz-options harvest-options">{options.map(i => <button key={i} className={'blitz-option' + (phase !== 'question' && i === round[position] ? ' blitz-correct' : selected === i && phase === 'wrong' ? ' blitz-wrong' : '')} disabled={phase !== 'question'} onClick={() => resolve(i)}>{products[i][1]}</button>)}</div>
        <p className="blitz-feedback" aria-live="polite">{phase === 'question' ? 'Три варианта — один правильный' : phase === 'success' ? 'Спасён! Следующий продукт…' : 'Правильное название показано выше. Этот продукт ушёл в повтор.'}</p>
      </div>}
      <div className="market-basket" aria-label="Собранные продукты">🧺 {collected.map(i => products[i][0]).join(' ')}</div>
    </> : <div className="market-intro"><h2>{saved.length === 0 ? 'Весь урожай спасён! 🎉' : 'Урожай собран не весь'}</h2>
      <p className="blitz-result">Собрано {collected.length} из {round.length}</p><p>Лучшая серия: {best} 🔥</p>
      {errors.length > 0 && <ul className="blitz-errors">{errors.map(i => <li key={i}>{products[i][0]} {products[i][2]} — <strong>{products[i][1]}</strong></li>)}</ul>}
      {saved.length > 0 && <button className="big-button" onClick={() => start(saved)}>Добрать урожай — {saved.length}</button>}
      <button className="secondary-button" onClick={() => start(products.map((_, i) => i))}>Новый блиц</button>
    </div>}
  </div>;
}
