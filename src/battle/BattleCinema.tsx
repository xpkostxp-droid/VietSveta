import { useEffect, useRef, useState } from 'react';
import './BattleCinema.css';

type Outcome = 'near' | 'far';
export type CinemaResult = { key: string; outcome: Outcome; label: string };
const media = {
 near: './battle-media/smash-near-cheer-v5.mp4',
 far: './battle-media/smash-far-cheer-v5.mp4',
};
export function BattleCinema({ lobby, result }: { lobby: boolean; result: CinemaResult | null }) {
 const videos = useRef<Partial<Record<Outcome, HTMLVideoElement>>>({});
 const [selected, setSelected] = useState<Outcome | null>(null);
 const [ready, setReady] = useState({ near: false, far: false });
 const [failed, setFailed] = useState({ near: false, far: false });
 const [needsPlay, setNeedsPlay] = useState(false);
 const [muted, setMuted] = useState(true);
 const [ended, setEnded] = useState(false);
 const play = (outcome: Outcome, audible = false) => {
  Object.values(videos.current).forEach(v => v?.pause());
  const video = videos.current[outcome];
  setSelected(outcome); setEnded(false); setNeedsPlay(false); setMuted(!audible);
  if (!video) return;
  video.muted = !audible;
  video.currentTime = 0;
  void video.play().catch(() => {
   // Safari may reject sound before this particular video has been tapped.
   // Keep the animation running silently and leave an explicit sound replay.
   if (audible) { video.muted = true; setMuted(true); void video.play().catch(() => setNeedsPlay(true)); }
   else setNeedsPlay(true);
  });
 };
 useEffect(() => {
  if (result) play(result.outcome, true);
  else { Object.values(videos.current).forEach(v => v?.pause()); setSelected(null); }
 }, [result?.key]);
 useEffect(() => () => Object.values(videos.current).forEach(v => v?.pause()), []);
 const visible = lobby || !!result;
 const active = selected ?? 'near';
 return <section className="battle-cinema" hidden={!visible} aria-label="Анимация пиклбола">
  {lobby && <><h2>Проверим смэш на телефоне</h2><p>Пока пробный ролик: два мужчины. Выбери удар.</p></>}
  <div className="battle-cinema-frame">
   {(['near', 'far'] as const).map(outcome => <video key={outcome}
    ref={v => { if (v) videos.current[outcome] = v; }}
    src={media[outcome]} poster="./battle-media/court-v1.jpg"
    preload="auto" playsInline muted={muted} controls={false}
    className={selected === outcome ? 'is-selected' : ''}
    aria-hidden={selected !== outcome}
    onCanPlay={() => setReady(s => ({ ...s, [outcome]: true }))}
    onError={() => setFailed(s => ({ ...s, [outcome]: true }))}
    onEnded={() => setEnded(true)}
   />)}
   {!selected && <img src="./battle-media/court-v1.jpg" alt="Площадка для пиклбола у моря" />}
   {selected && !ready[active] && !failed[active] && <span className="battle-cinema-status" role="status">Загружаем смэш…</span>}
   {selected && failed[active] && <span className="battle-cinema-status" role="status">Ролик не загрузился. Игра продолжает работать.</span>}
   {result && ended && <strong className="battle-cinema-status">{result.label}</strong>}
  </div>
  <div className="battle-cinema-actions">
   {lobby ? <><button onClick={() => play('near', true)}>Мой смэш</button><button onClick={() => play('far', true)}>Смэш соперника</button></>
    : <button onClick={() => play(result!.outcome, true)}>{needsPlay ? '▶ Смотреть смэш' : 'Повторить со звуком'}</button>}
   {lobby && needsPlay && <button onClick={() => play(active, true)}>▶ Запустить ролик</button>}
   {selected && failed[active] && <button onClick={() => { setFailed(s => ({ ...s, [active]: false })); videos.current[active]?.load(); play(active, true); }}>Повторить загрузку</button>}
  </div>
 </section>;
}
