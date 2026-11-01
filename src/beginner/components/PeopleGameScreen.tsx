import {useScenicDepth} from '../../domain/useScenicDepth';
import {useStudyActivity} from '../../domain/useStudyActivity';
import {reportStudyAnswer} from '../../domain/studyTelemetry';
import { useEffect, useRef, useState } from 'react';
import { peopleWords, peopleBlitzTasks, peopleBlitzAnswer, peopleBlitzOptions, type PeopleTask } from '../content/games/people';
import { GameRanking } from '../../components/GameRanking';
import { saveTimedAttempt } from '../../domain/answerTime';
import { speakVietnamese, stopSpeaking } from '../domain/speech';
import { BackButton } from './BackButton';
import { PeoplePicture, peoplePhotos } from './PeoplePicture';
import './ProfessionsGameScreen.css';
import { makeGameSound } from './gameSounds';
import { GamePrompt, GameChoices } from './BeginnerPlayLayout';
type Result = { correct: number; time: number };
export function PeopleGameScreen({ onBack }: { onBack: () => void }) {
  useEffect(() => {
    Object.values(peoplePhotos).forEach(src => { const image = new Image(); image.src = src; });
  }, []);
  const group = 'people';
  const [tasks, setTasks] = useState<PeopleTask[]>([]);
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
  const studyGame='lesson8-people';
  useStudyActivity('games',studyGame,(phase==='playing'||phase==='feedback')&&!paused);
 useScenicDepth(phase==='playing'||phase==='feedback'?4:3);
  const current = tasks[position];
  const word = current && peopleWords[current.index];
  const answer = current && peopleBlitzAnswer(current);
  const title = { label: 'Я, мы, они и все', words: 17 };
  const prepare = (next: PeopleTask[], at: number) => {
    setPosition(at); setOptions(peopleBlitzOptions(next[at])); setSelected(null);
    lastBeep.current = null;
    elapsed.current = 0; started.current = performance.now(); locked.current = false;
    setRemaining(5000); setPaused(document.hidden); setPhase('playing');
  };
  const start = () => {
    if (!group) return;
    audio.current.ready(); stopSpeaking(); const next = peopleBlitzTasks(); setTasks(next);
    setScore({ correct: 0, time: 0 }); prepare(next, 0);
  };
  const finishAnswer = (choice: string | null) => {
    if (locked.current || paused || !current) return;
    locked.current = true;
    const time = Math.min(5000, elapsed.current + performance.now() - started.current);
    if (time >= 5000) choice = null;
    reportStudyAnswer({topic:studyGame,vi:peopleWords[current.index][1],ru:peopleWords[current.index][0],direction:current.reverse?'vi-ru':'ru-vi',chosen:choice,result:choice===answer?'correct':choice===null?'timeout':'wrong',elapsed_ms:time});
    setRemaining(Math.max(0, 5000 - time)); setSelected(choice);
    if (choice === answer) setScore(s => ({ correct: s.correct + 1, time: s.time + time }));
    setPhase('feedback'); speakVietnamese(peopleWords[current.index][1]);
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
      if (position + 1 < tasks.length) prepare(tasks, position + 1);
      else {
        saveTimedAttempt({ game: 'lesson8-people', correct: score.correct, total: tasks.length, answerTimeMs: score.time, correctTimeMs: score.time, completed: true });
        setPhase('result'); stopSpeaking();
      }
    }, 1600);
    return () => clearTimeout(timer);
  }, [phase, position, group, tasks, score]);
  useEffect(() => () => { stopSpeaking(); audio.current.close(); }, []);
  const back = () => {
    stopSpeaking(); locked.current = true; setPhase('intro'); setTasks([]); setPaused(false);
    if (phase === 'intro') onBack();
  };
  return <div className={"screen family-screen work-blitz" + (phase === 'playing' || phase === 'feedback' ? ' work-active profession-session beginner-play' : '')}>
    <BackButton onClick={back} label={group ? 'Назад' : 'К играм'} />
    <span className="badge">Урок 8 · Я, мы, они и все</span>
    <h1 className="screen-title">{title?.label ?? 'Я, мы, они и все'}</h1>
    {phase === 'intro' || phase === 'result' ? <GameRanking
          game={'lesson8-people'}
          total={title!.words * 2} onStart={start}
          startLabel={phase === 'result' ? 'Играть ещё' : 'Начать'}
          result={phase === 'result' ? score : undefined}
        /> : word && <>
        <div className="work-status"><strong>{position + 1}/{tasks.length} · ✓ {score.correct}</strong><span className="work-clock" aria-label="Осталось секунд">{Math.ceil(remaining / 1000)}</span></div>
        <div className="work-timebar"><div style={{ width: `${remaining / 50}%` }} /></div>
        <GamePrompt long={!current.reverse && word[2].length > 23} label={current.reverse ? word[1] : word[2]} lang={current.reverse ? 'vi' : 'ru'} visual={!current.reverse ? <PeoplePicture id={word[0]} /> : undefined} />
        {paused ? <button className="big-button" onClick={() => { audio.current.ready(); started.current = performance.now(); setPaused(false); }}>Продолжить</button> : <GameChoices>{options.map(option => <button key={option} lang={current.reverse ? 'ru' : 'vi'} disabled={phase !== 'playing'} className={'choice-button ' + (phase === 'feedback' ? option === answer ? 'family-correct' : option === selected ? 'family-wrong' : '' : '')} onClick={() => finishAnswer(option)}>{option}</button>)}</GameChoices>}
        {paused&&<p className="family-feedback work-feedback" role="status">Игра на паузе</p>}
      </>}

  </div>;
}
