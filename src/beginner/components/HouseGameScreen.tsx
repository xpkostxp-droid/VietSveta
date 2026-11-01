import {useScenicDepth} from '../../domain/useScenicDepth';
import {useStudyActivity} from '../../domain/useStudyActivity';
import {reportStudyAnswer} from '../../domain/studyTelemetry';
import { useEffect, useRef, useState } from 'react';
import { GameRanking } from '../../components/GameRanking';
import { saveTimedAttempt } from '../../domain/answerTime';
import { useFiveSecondQuestionTimer } from './useFiveSecondQuestionTimer';
import { houseGameWords, houseGameTasks, houseGameOptions, type HouseGame, type HouseTask } from '../content/games/house';
import { hasVietnameseVoice, onVoicesChanged, speakVietnamese, stopSpeaking } from '../domain/speech';
import { BackButton } from './BackButton';
import { HousePicture } from './HousePicture';
import { GamePrompt, GameChoices, beginnerPlayClass } from './BeginnerPlayLayout';

export function HouseGameScreen({ onBack, game = 'house' }: { onBack: () => void; game?: HouseGame }) {
  const words = houseGameWords(game);
  const title = game === 'house' ? 'Дом' : 'Прилагательные';
  const rankingGame = game === 'house' ? 'lesson11-house' : 'lesson11-adjectives';
  const clock = useFiveSecondQuestionTimer(() => answer(null), stopSpeaking);
  const answerTime = useRef(0);
  const [tasks, setTasks] = useState<HouseTask[]>([]);
  const [position, setPosition] = useState(0);
  const [options, setOptions] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState({ correct: 0, time: 0 });
  const [voice, setVoice] = useState(hasVietnameseVoice);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const locked = useRef(false);
  const task = tasks[position];
  const current = task && words[task.index];
  const active = Boolean(current);
  useStudyActivity('games',rankingGame,active&&!clock.paused);
 useScenicDepth(active?4:3);
  useEffect(() => {
    const off = onVoicesChanged(() => setVoice(hasVietnameseVoice()));
    return () => { off(); clearTimeout(timer.current); stopSpeaking(); };
  }, []);
  const prepare = (next: HouseTask[], at: number) => {
    setPosition(at); setSelected(null); setAnswered(false); locked.current = false;
    if (next[at]) clock.begin();
    setOptions(next[at] ? houseGameOptions(game, next[at]) : []);
  };
  const start = () => {
    clearTimeout(timer.current); stopSpeaking(); clock.ready();
    const next = houseGameTasks(game); setTasks(next); setScore({ correct: 0, time: 0 }); answerTime.current = 0; prepare(next, 0);
  };
  const back = () => {
    clearTimeout(timer.current); stopSpeaking(); locked.current = true; clock.stop();
    if (tasks.length) { setTasks([]); setPosition(0); } else onBack();
  };
  const answer = (index: number | null) => {
    if (locked.current || clock.isPaused() || !task) return;
    locked.current = true;
    const time = clock.finish(); answerTime.current += time;
    if (time >= 5000) index = null;
    reportStudyAnswer({topic:rankingGame,vi:words[task.index][1],ru:words[task.index][0],direction:task.reverse?'vi-ru':'ru-vi',chosen:index===null?null:words[index][task.reverse?0:1],result:index===task.index?'correct':index===null?'timeout':'wrong',elapsed_ms:time});
    setSelected(index); setAnswered(true);
    const nextScore = { correct: score.correct + (index === task.index ? 1 : 0), time: score.time + (index === task.index ? time : 0) };
    setScore(nextScore);
    speakVietnamese(words[task.index][1]);
    timer.current = setTimeout(() => {
      if (position + 1 === tasks.length) {
        saveTimedAttempt({ game: rankingGame, correct: nextScore.correct, total: tasks.length, answerTimeMs: answerTime.current, correctTimeMs: nextScore.time, completed: true });
        stopSpeaking();
      }
      prepare(tasks, position + 1);
    }, 1600);
  };
  return <div className={'screen family-screen work-blitz' + (active ? ' ' + beginnerPlayClass : '')}>
    <BackButton onClick={back} label={tasks.length ? 'Назад' : 'К играм'} />
    <span className="badge">Урок 11 · {title}</span><h1 className="screen-title">{title}</h1>
    {!active ? <GameRanking key={tasks.length ? 'result' : 'intro'} game={rankingGame} total={words.length * 2} onStart={start}
      startLabel={tasks.length ? 'Играть ещё' : 'Начать'} result={tasks.length ? score : undefined} /> : current && <>
      <div className="work-status"><strong>{position + 1}/{tasks.length} · ✓ {score.correct}</strong><span className="work-clock" aria-label="Осталось секунд">{Math.ceil(clock.remaining / 1000)}</span></div>
      <div className="work-timebar"><div style={{ width: `${clock.remaining / 50}%` }} /></div>
      <GamePrompt label={current[task.reverse ? 1 : 2]} lang={task.reverse ? 'vi' : 'ru'} long={!task.reverse && current[2].length > 23}
        visual={!task.reverse ? <HousePicture id={current[0]} /> : undefined}>
        <div className="beginner-prompt-tools">{clock.paused ? <button className="secondary-button" onClick={clock.resume}>Продолжить</button> : answered && <button className="secondary-button" disabled={!voice} onClick={() => speakVietnamese(current[1])}>🔊 Послушать ещё</button>}</div>
      </GamePrompt>
      <GameChoices>{options.map(index => <button key={index} lang={task.reverse ? 'ru' : 'vi'} disabled={answered || clock.paused}
        className={'choice-button ' + (answered ? index === task.index ? 'family-correct' : index === selected ? 'family-wrong' : '' : '')}
        onClick={() => answer(index)}>{words[index][task.reverse ? 2 : 1]}</button>)}</GameChoices>
    </>}
  </div>;
}
