import { useEffect, useRef, useState } from 'react';
import { travelWords, travelBlitzGroups, travelBlitzTasks, travelBlitzAnswer, travelBlitzOptions, travelBlitzPool, type TravelBlitzGroup, type TravelTask } from '../content/games/travel';
import { GameRanking } from '../../components/GameRanking';
import { saveTimedAttempt } from '../../domain/answerTime';
import { speakVietnamese, stopSpeaking } from '../domain/speech';
import { BackButton } from './BackButton';
import { TravelPicture, travelPhotos } from './TravelPicture';
import './ProfessionsGameScreen.css';
import './TravelGameScreen.css';
import '../../components/SharedPlayLayout.css';
import { makeGameSound } from './gameSounds';
type Result = { correct: number; time: number };
export function TravelGameScreen({ onBack, initialGroup = null }: { onBack: () => void; initialGroup?: TravelBlitzGroup | null }) {
  const [group, setGroup] = useState<TravelBlitzGroup | null>(initialGroup);
  const [tasks, setTasks] = useState<TravelTask[]>([]);
  const [position, setPosition] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [phase, setPhase] = useState<'intro' | 'playing' | 'feedback' | 'result'>('intro');
  const [remaining, setRemaining] = useState(5000);
  const [paused, setPaused] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState<Result>({ correct: 0, time: 0 });
  const audio = useRef(makeGameSound());
  const lastBeep = useRef<number | null>(null);
  const elapsed = useRef(0);
  const started = useRef(0);
  const locked = useRef(true);
  const current = tasks[position];
  const word = current && travelWords[current.index];
  const answer = current && travelBlitzAnswer(current);
  const title = travelBlitzGroups.find(g => g.id === group);
  const prepare = (next: TravelTask[], at: number, category: TravelBlitzGroup) => {
    setPosition(at); setOptions(travelBlitzOptions(next[at], category)); setSelected(null);
    lastBeep.current = null;
    elapsed.current = 0; started.current = performance.now(); locked.current = false;
    setRemaining(5000); setPaused(document.hidden); setPhase('playing');
  };
  const start = () => {
    if (!group) return;
    audio.current.ready(); stopSpeaking(); const next = travelBlitzTasks(group); setTasks(next);
    setScore({ correct: 0, time: 0 }); prepare(next, 0, group);
  };
  const finishAnswer = (choice: string | null) => {
    if (locked.current || paused || !current) return;
    locked.current = true;
    const time = Math.min(5000, elapsed.current + performance.now() - started.current);
    if (time >= 5000) choice = null;
    setRemaining(Math.max(0, 5000 - time)); setSelected(choice);
    if (choice === answer) setScore(s => ({ correct: s.correct + 1, time: s.time + time }));
    setPhase('feedback'); speakVietnamese(travelWords[current.index][1]);
  };
  useEffect(() => {
    if (phase !== 'playing' || paused) return;
    const tick = () => {
      const left = Math.max(0, 5000 - elapsed.current - (performance.now() - started.current));
      setRemaining(left);
      const digit = Math.ceil(left / 1000);
      if (digit >= 1 && digit <= 3 && lastBeep.current !== digit) { lastBeep.current = digit; audio.current.beep(digit); }
      if (left === 0) finishAnswer(null);
    };
    const timer = setInterval(tick, 40);
    const hide = () => {
      if (document.hidden && !locked.current) {
        elapsed.current += performance.now() - started.current;
        setPaused(true); stopSpeaking();
      }
    };
    document.addEventListener('visibilitychange', hide);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', hide); };
  }, [phase, paused, position]);
  useEffect(() => {
    if (phase !== 'feedback' || !group) return;
    const timer = setTimeout(() => {
      if (position + 1 < tasks.length) prepare(tasks, position + 1, group);
      else {
        saveTimedAttempt({ game: group === 'countries' ? 'lesson7-countries' : 'lesson7-travel', correct: score.correct, total: tasks.length, answerTimeMs: score.time, correctTimeMs: score.time, completed: true });
        setPhase('result'); stopSpeaking();
      }
    }, 1600);
    return () => clearTimeout(timer);
  }, [phase, position, group, tasks, score]);
  useEffect(() => () => { stopSpeaking(); audio.current.close(); }, []);
  useEffect(() => {
    if (group === 'travel') travelBlitzPool(group).forEach(index => {
      const image = new Image(); image.src = travelPhotos[travelWords[index][0]];
    });
  }, [group]);
  const back = () => {
    stopSpeaking(); locked.current = true; setPhase('intro'); setTasks([]); setPaused(false);
    if (phase === 'intro') { if (initialGroup) onBack(); else if (group) setGroup(null); else onBack(); }
  };
  return <div className={"screen family-screen work-blitz travel-blitz" + (phase === 'playing' || phase === 'feedback' ? ' work-active'+(group==='travel'?' profession-session':'') : '')}>
    <BackButton onClick={back} label={group ? 'Назад' : 'К играм'} />
    <span className="badge">Урок 7 · Страны, города и путешествия</span>
    <h1 className="screen-title">{title?.label ?? 'Страны, города и путешествия'}</h1>
    {!group ? <div className="work-group-list">{travelBlitzGroups.map(g => <button className="big-button" key={g.id} onClick={() => { setGroup(g.id); }}><strong>{g.label}</strong><span>{g.words} слов и выражений · {g.words * 2} заданий</span></button>)}</div>
      : phase === 'intro' || phase === 'result' ? <GameRanking
          game={group === 'countries' ? 'lesson7-countries' : 'lesson7-travel'}
          total={title!.words * 2} onStart={start} startAtBottom
          startLabel={phase === 'result' ? 'Играть ещё' : 'Начать'}
          result={phase === 'result' ? score : undefined}
        /> : word && <>
        <div className="work-status"><strong>{position + 1}/{tasks.length} · ✓ {score.correct}</strong><span className="work-clock" aria-label="Осталось секунд">{Math.ceil(remaining / 1000)}</span></div>
        <div className="work-timebar"><div style={{ width: `${remaining / 50}%` }} /></div>
        <div className={'family-card work-prompt ' + (current.reverse ? 'work-prompt-text' : '')}>
          {!current.reverse && (group==='travel'
            ? <div className="profession-illustration"><TravelPicture id={word[0]} /><h2 className="profession-caption" lang="ru">{word[2]}</h2></div>
            : <TravelPicture id={word[0]} />)}
          {current.reverse ? <h2 lang="vi">{word[1]}</h2> : group!=='travel'&&<h2 lang="ru">{word[2]}</h2>}
        </div>
        {paused ? <button className="big-button" onClick={() => { audio.current.ready(); started.current = performance.now(); setPaused(false); }}>Продолжить</button> : <div className="family-choices work-options">{options.map(option => <button key={option} lang={current.reverse ? 'ru' : 'vi'} disabled={phase !== 'playing'} className={'choice-button ' + (phase === 'feedback' ? option === answer ? 'family-correct' : option === selected ? 'family-wrong' : '' : '')} onClick={() => finishAnswer(option)}>{option}</button>)}</div>}
        {(paused || group!=='travel')&&<p className="family-feedback work-feedback" role="status">{paused ? 'Игра на паузе' : '\u00a0'}</p>}
      </>}

  </div>;
}
