import { useEffect, useRef, useState } from 'react';
import { houseGameWords, houseGameTasks, houseGameOptions, type HouseGame, type HouseTask } from '../content/games/house';
import { hasVietnameseVoice, onVoicesChanged, speakVietnamese, stopSpeaking } from '../domain/speech';
import { BackButton } from './BackButton';
import { HousePicture } from './HousePicture';
import { GamePrompt, GameChoices, GameProgress, beginnerPlayClass } from './BeginnerPlayLayout';

export function HouseGameScreen({ onBack, game = 'house' }: { onBack: () => void; game?: HouseGame }) {
  const words = houseGameWords(game);
  const title = game === 'house' ? 'Дом' : 'Прилагательные';
  const [tasks, setTasks] = useState<HouseTask[]>([]);
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
  const prepare = (next: HouseTask[], at: number) => {
    setPosition(at); setSelected(null); locked.current = false;
    setOptions(next[at] ? houseGameOptions(game, next[at]) : []);
  };
  const start = () => {
    clearTimeout(timer.current); stopSpeaking();
    const next = houseGameTasks(game); setTasks(next); setScore(0); prepare(next, 0);
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
    <span className="badge">Урок 11 · {title}</span><h1 className="screen-title">{title}</h1>
    {!tasks.length ? <>
      <p>{words.length} слов и выражений · {words.length * 2} заданий · В обе стороны · Без таймера</p>
      <HousePicture id={words[0][0]} />
      <button className="big-button" onClick={start}>Начать</button>
    </> : current ? <>
      <GameProgress progress={100 * position / tasks.length}>{position + 1}/{tasks.length} · ✓ {score}</GameProgress>
      <GamePrompt label={current[task.reverse ? 1 : 2]} lang={task.reverse ? 'vi' : 'ru'} long={!task.reverse && current[2].length > 23}
        visual={!task.reverse ? <HousePicture id={current[0]} /> : undefined}>
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
