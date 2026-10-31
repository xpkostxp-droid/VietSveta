import { useEffect, useRef, useState } from 'react';
import { familyWords, familyTasks, familyOptions, type FamilyTask } from '../content/games/family';
import { hasVietnameseVoice, onVoicesChanged, speakVietnamese, stopSpeaking } from '../domain/speech';
import { BackButton } from './BackButton';
import { FamilyPicture, familyPhotos } from './FamilyPicture';
import { GamePrompt, GameChoices, GameProgress, beginnerPlayClass } from './BeginnerPlayLayout';

export function FamilyGameScreen({ onBack }: { onBack: () => void }) {
  const words = familyWords;
  const title = 'Семья';
  useEffect(() => {
    Object.values(familyPhotos).forEach(src => { const image = new Image(); image.src = src; });
  }, []);
  const [tasks, setTasks] = useState<FamilyTask[]>([]);
  const [position, setPosition] = useState(0);
  const [options, setOptions] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [voice, setVoice] = useState(hasVietnameseVoice);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const locked = useRef(false);
  const task = tasks[position];
  const current = task && words[task.index];
  const active = Boolean(current);
  useEffect(() => {
    const off = onVoicesChanged(() => setVoice(hasVietnameseVoice()));
    return () => { off(); clearTimeout(timer.current); stopSpeaking(); };
  }, []);
  const prepare = (next: FamilyTask[], at: number) => {
    setPosition(at); setSelected(null); locked.current = false;
    setOptions(next[at] ? familyOptions(next[at].index) : []);
  };
  const start = () => {
    clearTimeout(timer.current); stopSpeaking();
    const next = familyTasks(); setTasks(next); setScore(0); prepare(next, 0);
  };
  const back = () => {
    clearTimeout(timer.current); stopSpeaking(); locked.current = true;
    if (tasks.length) { setTasks([]); setPosition(0); } else onBack();
  };
  const answer = (index: number) => {
    if (locked.current || !task) return;
    locked.current = true; setSelected(index);
    if (index === task.index) setScore(value => value + 1);
    speakVietnamese(words[task.index][1]);
    timer.current = setTimeout(() => prepare(tasks, position + 1), 1600);
  };
  return <div className={'screen family-screen' + (active ? ' ' + beginnerPlayClass : '')}>
    <BackButton onClick={back} label={tasks.length ? 'Назад' : 'К играм'} />
    <span className="badge">Урок 10 · {title}</span><h1 className="screen-title">{title}</h1>
    {!tasks.length ? <>
      <p>{words.length} слов и выражений · {words.length * 2} заданий · В обе стороны · Без таймера</p>
      <FamilyPicture id={words[0][0]} />
      <button className="big-button" onClick={start}>Начать</button>
    </> : current ? <>
      <GameProgress progress={100 * position / tasks.length}>{position + 1}/{tasks.length} · ✓ {score}</GameProgress>
      <GamePrompt label={current[task.reverse ? 1 : 2]} lang={task.reverse ? 'vi' : 'ru'} long={!task.reverse && current[2].length > 23}
        visual={!task.reverse ? <FamilyPicture id={current[0]} /> : undefined}>
        <div className="beginner-prompt-tools">{selected !== null && <button className="secondary-button" disabled={!voice} onClick={() => speakVietnamese(current[1])}>🔊 Послушать ещё</button>}</div>
      </GamePrompt>
      <GameChoices>{options.map(index => <button key={index} lang={task.reverse ? 'ru' : 'vi'} disabled={selected !== null}
        className={'choice-button ' + (selected !== null ? index === task.index ? 'family-correct' : index === selected ? 'family-wrong' : '' : '')}
        onClick={() => answer(index)}>{words[index][task.reverse ? 2 : 1]}</button>)}</GameChoices>
    </> : <div className="family-result">
      <h2>Игра завершена!</h2><p>Правильно: {score} из {tasks.length}</p>
      <p>Каждое слово показано один раз в каждую сторону.</p>
      <button className="big-button" onClick={start}>Играть ещё</button>
      <button className="secondary-button" onClick={onBack}>К играм</button>
    </div>}
  </div>;
}
