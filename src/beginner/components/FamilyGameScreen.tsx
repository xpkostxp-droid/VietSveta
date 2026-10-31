import { useEffect, useRef, useState } from 'react';
import { advanceFamily, familyOptions, familyWords, shuffled } from '../content/games/family';
import { hasVietnameseVoice, onVoicesChanged, speakVietnamese, stopSpeaking } from '../domain/speech';
import { BackButton } from './BackButton';
import { FamilyPicture } from './FamilyPicture';
import { GamePrompt, GameChoices, GameProgress, beginnerPlayClass } from './BeginnerPlayLayout';
type Mode = 'learn' | 'blitz';
export function FamilyGameScreen({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [queue, setQueue] = useState<number[]>([]);
  const [wins, setWins] = useState<Record<number, number>>({});
  const [errors, setErrors] = useState<number[]>([]);
  const [review, setReview] = useState(false);
  const [firstCorrect, setFirstCorrect] = useState(0);
  const [options, setOptions] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number[]>([]);
  const [correct, setCorrect] = useState(false);
  const [voice, setVoice] = useState(hasVietnameseVoice);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const locked = useRef(false);
  useEffect(() => { const off = onVoicesChanged(() => setVoice(hasVietnameseVoice())); return () => { off(); clearTimeout(timer.current); stopSpeaking(); }; }, []);
  const index = queue[0];
  const current = familyWords[index];
  const prepare = (next: number[]) => { setQueue(next); setOptions(next.length ? familyOptions(next[0]) : []); setWrong([]); setCorrect(false); locked.current = false; };
  const start = (value: Mode) => { clearTimeout(timer.current); stopSpeaking(); setMode(value); setWins({}); setErrors([]); setReview(false); setFirstCorrect(0); prepare(shuffled(familyWords.map((_, i) => i))); };
  const exit = () => { clearTimeout(timer.current); stopSpeaking(); locked.current = false; setMode(null); };
  const answer = (selected: number) => {
    if (locked.current || wrong.includes(selected)) return;
    if (selected !== index) { setWrong(w => [...w, selected]); setErrors(e => e.includes(index) ? e : [...e, index]); return; }
    locked.current = true; setCorrect(true); speakVietnamese(current[1]);
    if (mode === 'blitz' && !review && wrong.length === 0) setFirstCorrect(n => n + 1);
    const next = advanceFamily(queue, wins, wrong.length > 0, mode === 'learn');
    timer.current = setTimeout(() => { setWins(next.wins); prepare(next.queue); }, 1800);
  };
  const mastered = Object.values(wins).filter(n => n >= 2).length;
  return <div className={"screen family-screen" + (mode && current ? " " + beginnerPlayClass : "")}>
    <BackButton onClick={mode ? exit : onBack} label={mode ? 'К выбору режима' : 'К играм'} />
    <span className="badge">Урок 10 · Семья</span><h1 className="screen-title">{mode === 'learn' ? 'Учимся узнавать семью' : mode === 'blitz' ? review ? 'Повтор ошибок' : 'Блиц · Семья' : 'Семья'}</h1>
    {!mode ? <>
      <p>19 слов и выражений · Картинки с русскими подписями · Без таймера</p>
      <FamilyPicture id="all-family" />
      <button className="lesson-item family-mode" onClick={() => start('learn')}><strong>🌱 Обучение</strong><span>Выбирай из шести вариантов. Дважды ответь без ошибки, чтобы закрепить слово. Сложные слова вернутся позже.</span></button>
      <button className="lesson-item family-mode" onClick={() => start('blitz')}><strong>⚡ Блиц</strong><span>Вся семья вперемешку, каждое задание один раз. Затем можно повторить ошибки.</span></button>
    </> : current ? <>
      <GameProgress progress={100 * (mode === 'learn' ? mastered : 19 - queue.length) / 19}>{mode === 'learn' ? `Закреплено: ${mastered} из 19` : review ? `Осталось в повторе: ${queue.length}` : `Карточка ${20 - queue.length} из 19`}</GameProgress>
      <GamePrompt label={current[2]} lang="ru" visual={<FamilyPicture id={current[0]} />}>
        <div className="beginner-prompt-tools">{correct && <button className="secondary-button" disabled={!voice} onClick={() => speakVietnamese(current[1])}>🔊 Послушать ещё</button>}</div>
        {!voice && <p className="beginner-prompt-note">Для озвучки нужен вьетнамский голос на устройстве. Играть можно без звука.</p>}
      </GamePrompt>
      <GameChoices count={options.length}>{options.map(i => <button key={i} disabled={correct || wrong.includes(i)} className={'choice-button ' + (wrong.includes(i) ? 'family-wrong' : correct && i === index ? 'family-correct' : '')} onClick={() => answer(i)}>{familyWords[i][1]}</button>)}</GameChoices>
    </> : <div className="family-result">
      <FamilyPicture id="all-family" /><h2>{mode === 'learn' ? 'Семья выучена!' : review ? 'Повтор завершён!' : 'Блиц завершён!'}</h2>
      <p>{mode === 'learn' ? 'Все 19 слов и выражений угаданы дважды без ошибки.' : review ? 'Все выбранные слова пройдены.' : `С первой попытки: ${firstCorrect} из 19`}</p>
      {mode === 'blitz' && errors.length > 0 && <><p>Для повторения: {errors.map(i => familyWords[i][2].toLowerCase()).join(', ')}.</p><button className="big-button" onClick={() => { const next = shuffled(errors); setErrors([]); setReview(true); prepare(next); }}>Повторить ошибки · {errors.length}</button></>}
      <button className="big-button" onClick={() => start(mode)}>Сыграть заново</button><button className="secondary-button" onClick={exit}>К выбору режима</button>
    </div>}
    {mode && !current && !voice && <p className="family-note">Для озвучки нужен вьетнамский голос на устройстве. Играть можно без звука.</p>}
  </div>;
}
