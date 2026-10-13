import { useEffect, useRef, useState } from 'react';
import { BackButton } from './BackButton';
import { listeningTurns } from '../content/listening/lesson1';
const names = { narrator: 'Вступление', man: 'Тан', woman: 'Жена Тана' };
export function ListeningLessonScreen({ onBack }: { onBack: () => void }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const rowsRef = useRef<(HTMLElement | null)[]>([]);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const activeTurn = listeningTurns.findIndex(turn => time >= turn.start && time < turn.end);
  useEffect(() => {
    const audio = audioRef.current!;
    let frame = 0;
    const update = () => { setTime(audio.currentTime); frame = requestAnimationFrame(update); };
    frame = requestAnimationFrame(update);
    return () => { cancelAnimationFrame(frame); audio.pause(); };
  }, []);
  useEffect(() => {
    if (playing && activeTurn >= 0) rowsRef.current[activeTurn]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeTurn, playing]);
  async function playFrom(start: number) {
    const audio = audioRef.current!;
    audio.currentTime = start; setTime(start); setError('');
    try { await audio.play(); } catch { setError('Не удалось включить запись. Попробуй ещё раз.'); }
  }
  return <div className="screen screen-listening">
    <BackButton onClick={onBack} label="К урокам аудирования" />
    <span className="badge">Аудирование · Урок 1</span>
    <h1 className="screen-title">Поездка в Вунгтау</h1>
    <p className="listening-subtitle" lang="vi">Đi Vũng Tàu nghỉ mát</p>
    <div className="listening-player">
      <audio ref={audioRef} controls preload="auto" src={`${import.meta.env.BASE_URL}audio/listening/vung-tau.mp3`} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => setError('Не удалось загрузить запись.')} />
      <button className="secondary-button" onClick={() => void playFrom(12.65)}>Слушать диалог сначала</button>
    </div>
    {error && <p className="pronunciation-error" role="alert">{error}</p>}
    <p className="hint-text">Нажми на слово, чтобы послушать с этого места.</p>
    <div className="listening-dialogue">
      {listeningTurns.map((turn, row) => <section key={row} ref={element => { rowsRef.current[row] = element; }} className={`listening-turn listening-${turn.speaker}${activeTurn === row ? ' listening-turn-active' : ''}`}>
        <div className="listening-speaker"><span aria-hidden="true">{turn.speaker === 'man' ? '👨' : turn.speaker === 'woman' ? '👩' : '🎧'}</span><strong>{names[turn.speaker]}</strong><button onClick={() => void playFrom(Math.max(0, turn.start - .08))} aria-label={`Послушать реплику: ${names[turn.speaker]}`}>▶</button></div>
        <p lang="vi">{turn.words.map((word, index) => <span key={index}><button className={`listening-word${time >= word.start && time < word.end ? ' listening-word-active' : ''}`} onClick={() => void playFrom(Math.max(0, word.start - .04))}>{word.text}</button>{' '}</span>)}</p>
      </section>)}
    </div>
  </div>;
}
