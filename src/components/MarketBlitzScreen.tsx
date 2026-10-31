import './SharedPlayLayout.css';
import { GameRanking } from './GameRanking';
import { updateGameRecord } from '../domain/gameRecord';
import { createAnswerClock, formatAnswerTime, saveTimedAttempt } from '../domain/answerTime';
import { useEffect, useRef, useState } from 'react';
import { products, mixedWords } from '../content/advancedProduce';
import { ProducePicture } from './ProducePicture';
import { readJSON, writeJSON } from '../domain/storage';
import { speakVietnamese, stopSpeaking } from '../domain/speech';
import { createCountdownSound } from '../domain/countdownSound';
import { BackButton } from './BackButton';

import { allHarvestTasks, productForTask, isPictureAnswer, taskKey, orderHarvestTasks, readHarvestErrors } from '../domain/harvestTasks';
const storageKey = 'vietSveta.marketBlitz.errors.v2';
const QUESTION_MS = 5000;
const FEEDBACK_MS = 1700;
const EXPLOSION_MS = 700;
function shuffled<T,>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function optionsFor(index: number, category: 'all' | 'fruits' | 'vegetables') {
  const others = products.map((_, i) => i).filter(i => i !== index && products[i][3] === products[index][3] && (category !== 'all' || mixedWords.has(products[i][1])));
  return shuffled([index, ...shuffled(others).slice(0, 2)]);
}
function loadErrors(): number[] {
  return readHarvestErrors(readJSON(storageKey), readJSON('vietSveta.marketBlitz.errors.v1'));
}
function saveErrors(indices: number[]) { writeJSON(storageKey, indices.map(taskKey)); }
type Phase = 'question' | 'success' | 'wrong' | 'timeout' | 'answer';

export function MarketBlitzScreen({ onBack, category = 'all' }: { onBack: () => void; category?: 'all' | 'fruits' | 'vegetables' }) {
  const tasks = allHarvestTasks.filter(t => category === 'all' ? mixedWords.has(products[productForTask(t)][1]) : products[productForTask(t)][3] === category);
  const game = category === 'all' ? 'harvest-40' : category === 'fruits' ? 'harvest-fruits' : 'harvest-vegetables';
  const title = category === 'all' ? '⚡ Суперблиц · фрукты и овощи' : category === 'fruits' ? '🍉 Фрукты' : '🥕 Овощи';
  const isReview = useRef(false);
  const answerClock = useRef(createAnswerClock());
  const [answerTime, setAnswerTime] = useState(0);
 const correctTime = useRef(0);
 const finishedTime = useRef(0);
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
  const sound = useRef<ReturnType<typeof createCountdownSound> | null>(null);
  const lastBeep = useRef(5);
  const deadline = useRef(0);
  const frozen = useRef(QUESTION_MS);
  const locked = useRef(false);
  const pausedRef = useRef(false);

  useEffect(() => () => { stopSpeaking(); sound.current?.close(); }, []);
  useEffect(() => {
    function hide() {
      if (document.hidden && active && !pausedRef.current) {
        if (!locked.current) answerClock.current.pause();
        frozen.current = Math.max(0, deadline.current - Date.now());
        pausedRef.current = true; setPaused(true); stopSpeaking(); sound.current?.stop();
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
        setRemaining(left); setAnswerTime(answerClock.current.value());
        const second = Math.ceil(left / 1000);
        if (second > 0 && second <= 3 && second < lastBeep.current) { sound.current?.beep(); lastBeep.current = second; }
        if (!left) resolve(null);
      };
      const timer = setInterval(tick, 100);
      return () => clearInterval(timer);
    }
    if (phase === 'wrong' || phase === 'timeout') {
      const timer = setTimeout(() => {
        if (pausedRef.current) return;
        setPhase('answer'); speakVietnamese(products[productForTask(round[position])][1]);
      }, EXPLOSION_MS);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      if (pausedRef.current) return;
      if (position + 1 === round.length) setActive(false);
      else {
        const next = position + 1;
        setPosition(next); setOptions(optionsFor(productForTask(round[next]), category)); setSelected(null);
        setRemaining(QUESTION_MS); deadline.current = Date.now() + QUESTION_MS; answerClock.current.begin();
        locked.current = false; lastBeep.current = 5; setPhase('question');
      }
    }, FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [active, paused, phase, position, round]);

  function start(indices: number[], review = false) {
    isReview.current = review;
    const next = orderHarvestTasks(indices);
    if (!next.length) return;
    answerClock.current.reset(); setAnswerTime(0); correctTime.current=0; finishedTime.current=0;
    sound.current ??= createCountdownSound(); sound.current.unlock();
    lastBeep.current = 5;
    stopSpeaking(); setRound(next); setPosition(0); setOptions(optionsFor(productForTask(next[0]), category));
    setErrors([]); setCollected([]); setSelected(null); setPhase('question');
    setRemaining(QUESTION_MS); setStreak(0); setBest(0);
    setStarted(true); setActive(true); setPaused(false); pausedRef.current = false;
    locked.current = false; deadline.current = Date.now() + QUESTION_MS; answerClock.current.begin();
  }
  function resolve(index: number | null) {
    if (locked.current || pausedRef.current || !active) return;
    const finished=answerClock.current.finish();
    const questionTime=finished-finishedTime.current; finishedTime.current=finished; setAnswerTime(finished);
    locked.current = true; sound.current?.stop();
    const current = round[position];
    // A click at or after the deadline is a timeout, even between timer ticks.
    const timedOut = index === null || Date.now() >= deadline.current;
    const success = !timedOut && index === productForTask(current);
    setSelected(index); setPhase(success ? 'success' : timedOut ? 'timeout' : 'wrong');
    const nextSaved = success ? saved.filter(i => i !== current) : [...new Set([...saved, current])];
    setSaved(nextSaved); saveErrors(nextSaved);
    if (success) {
      correctTime.current += questionTime;
      setCollected(c => [...c, current]); setStreak(s => s + 1); setBest(b => Math.max(b, streak + 1));
    } else {
      setErrors(e => [...e, current]); setStreak(0);
    }
    if (success) speakVietnamese(products[productForTask(current)][1]);
    else sound.current?.explode();
  }
  function resume() {
    if (document.hidden) return;
    sound.current?.unlock();
    if (phase === 'question') answerClock.current.resume();
    deadline.current = Date.now() + frozen.current;
    pausedRef.current = false; setPaused(false);
  }
  useEffect(() => {
    if (!started || active) return;
    if (!isReview.current) updateGameRecord(game,{correct:collected.length,correctTimeMs:correctTime.current});
    saveTimedAttempt({game:isReview.current ? 'harvest-review' : game,correct:collected.length,total:round.length,answerTimeMs:answerClock.current.value(),correctTimeMs:correctTime.current,completed:true});
  }, [active]);
  if(!started||(!active&&!isReview.current))return <div className="screen ranking-screen"><BackButton onClick={onBack} label="К выбору игры"/><h1 className="screen-title">{title}</h1>
    <GameRanking game={game} total={tasks.length} onStart={()=>start(tasks)} startAtBottom startLabel={started?'Играть ещё':'Начать'} result={started?{correct:collected.length,time:correctTime.current}:undefined}/>
  </div>;
  const current = products[productForTask(round[position])];
  const pictureAnswers = isPictureAnswer(round[position]);
  const exploding = phase === 'wrong' || phase === 'timeout';
  const showAnswer = phase === 'success' || phase === 'answer';
  return <div className={'screen market-screen harvest-screen' + (active ? ' harvest-playing' : '')}>
    <BackButton onClick={onBack} label="К выбору игры" />
    <h1 className="screen-title">{title}</h1>
    {active ? <>
      <div className="harvest-play-header"><span>Задание {position + 1}/{round.length}</span><span>⏱ {formatAnswerTime(answerTime)} · 🧺 {collected.length}</span></div>
      <div className="harvest-question-bar">
        <span>{pictureAnswers ? 'Выбери картинку' : 'Выбери название'}</span>
        <div className={'harvest-countdown' + (phase === 'question' && remaining <= 3000 ? ' harvest-countdown-urgent' : '')} role="progressbar" aria-label="Время на ответ" aria-valuemin={0} aria-valuemax={5} aria-valuenow={phase === 'question' ? Math.ceil(remaining / 1000) : 0}>
          <svg viewBox="0 0 100 100" aria-hidden="true"><circle className="harvest-ring-track" cx="50" cy="50" r="43" /><circle className="harvest-ring-progress" cx="50" cy="50" r="43" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - (phase === 'question' ? remaining / QUESTION_MS * 100 : 0)} /></svg>
          <span className="harvest-countdown-number">{paused ? 'Ⅱ' : phase === 'question' ? Math.ceil(remaining / 1000) : phase === 'success' ? '✓' : '0'}</span>
        </div>
      </div>
      <div className="harvest-play-block">
      <div className="market-card blitz-card harvest-compact-card">
        <div className={'harvest-stage harvest-' + phase} key={`${position}-${phase}`}>
          <div className={'harvest-prompt-content' + (exploding ? ' harvest-shake' : '')}>
            {pictureAnswers ? <h2 className="harvest-word-prompt">{current[1]}</h2> : <div className="market-product" role="img" aria-label={current[2]}><ProducePicture index={productForTask(round[position])}/></div>}
          </div>
        </div>
        <div className="harvest-answer-slot" aria-live="polite">
          <strong>{showAnswer ? current[2] : '\u00a0'}</strong>
        </div>
      </div>
        <div className={'blitz-options harvest-options' + (pictureAnswers ? ' harvest-picture-options' : '')}>{options.map(i => <button key={i} aria-label={pictureAnswers ? products[i][2] : products[i][1]} className={'blitz-option' + (showAnswer && i === productForTask(round[position]) ? ' blitz-correct' : selected === i && phase === 'wrong' ? ' blitz-wrong' : '')} disabled={phase !== 'question' || paused} onClick={() => resolve(i)}>{pictureAnswers ? <ProducePicture index={i}/> : products[i][1]}</button>)}</div>
        {paused && <div className="harvest-pause-overlay"><h2>Пауза ⏸</h2><button className="big-button" onClick={resume}>Продолжить</button></div>}
      </div>
    </> : <div className="market-intro"><h2>{saved.length === 0 ? 'Весь урожай спасён! 🎉' : 'Урожай собран не весь'}</h2>
      <p className="blitz-result">Собрано {collected.length} из {round.length}</p><p>Лучшая серия: {best} 🔥</p><p>Время правильных ответов: {formatAnswerTime(correctTime.current)}</p>
      {errors.length > 0 && <ul className="blitz-errors">{errors.map(i => <li key={i}>{products[productForTask(i)][2]} — <strong>{isPictureAnswer(i) ? 'узнать название' : 'вспомнить название'}</strong></li>)}</ul>}
      {saved.length > 0 && <button className="big-button" onClick={() => start(saved, true)}>Добрать урожай — {saved.length}</button>}
      <button className="secondary-button" onClick={() => start(tasks)}>Новый блиц</button>
    </div>}
  </div>;
}
