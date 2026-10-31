import { useBattleResultSound } from './useBattleResultSound';
import { playBattleResultSound, readyBattleResultAudio } from './resultAudio';
import { useEffect, useRef, useState } from 'react';
import './BattleCinema.css';
import {BattleCourt} from './BattleCourt';
import type {CourtPlayers} from './battlePlayers';

type Outcome = 'near' | 'far';
export type CinemaResult = { key: string; outcome: Outcome; label: string };
const media = {
 near: './battle-media/smash-near-victory-v6.mp4',
 far: './battle-media/smash-far-defeat-v6.mp4',
};
function VideoBattleCinema({ lobby, result, compact=false }: { lobby: boolean; result: CinemaResult | null; compact?: boolean }) {
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
  setSelected(outcome); setEnded(false); setNeedsPlay(false); setMuted(result ? true : !audible);
  if (!video) return;
  video.muted = result ? true : !audible;
  video.currentTime = 0;
  void video.play().catch(() => {
   // Safari may reject sound before this particular video has been tapped.
   // Keep the animation running silently and leave an explicit sound replay.
   if (audible) { video.muted = true; setMuted(true); void video.play().catch(() => setNeedsPlay(true)); }
   else setNeedsPlay(true);
  });
 };
 useEffect(() => {
  if (result) play(result.outcome, false);
  else { Object.values(videos.current).forEach(v => v?.pause()); setSelected(null); }
 }, [result?.key]);
 useEffect(() => () => Object.values(videos.current).forEach(v => v?.pause()), []);
 const visible = lobby || !!result;
 const active = selected ?? 'near';
 return <section className={`battle-cinema${compact?' battle-cinema-compact':''}`} hidden={!visible} aria-label="Анимация пиклбола">
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
    : result&&<button aria-label={needsPlay?'Смотреть смэш':'Повторить смэш со звуком'} onClick={() => { readyBattleResultAudio(); playBattleResultSound(result.outcome==='near'?'victory':'defeat'); play(result.outcome, false); }}>{compact?(needsPlay?'▶ Смэш':'↻ Со звуком'):needsPlay?'▶ Смотреть смэш':'Повторить со звуком'}</button>}
   {lobby && needsPlay && <button onClick={() => play(active, true)}>▶ Запустить ролик</button>}
   {selected && failed[active] && <button onClick={() => { setFailed(s => ({ ...s, [active]: false })); videos.current[active]?.load(); play(active, true); }}>Повторить загрузку</button>}
  </div>
 </section>;
}

export function BattleCinema({lobby,result,compact=false,players,nearBlue=true,round=1}:{lobby:boolean;result:CinemaResult|null;compact?:boolean;players?:CourtPlayers;nearBlue?:boolean;round?:number}){
 useBattleResultSound(result?.key??null,result?(result.outcome==='near'?'victory':'defeat'):null);
 if(players&&(players.near==='woman'||players.far==='woman'))return result?<PlayerFinale key={result.key} result={result} compact={compact} players={players} nearBlue={nearBlue} round={round}/>:null;
 return <VideoBattleCinema lobby={lobby} result={result} compact={compact}/>;
}
function PlayerFinale({result,compact,players,nearBlue,round}:{result:CinemaResult;compact:boolean;players:CourtPlayers;nearBlue:boolean;round:number}){
 const [started,setStarted]=useState(Date.now),[ended,setEnded]=useState(false),[needsPlay,setNeedsPlay]=useState(false);

 const play=()=>{setStarted(Date.now());setEnded(false);setNeedsPlay(false);};
 useEffect(()=>{play();},[]);
 useEffect(()=>{const timer=setTimeout(()=>setEnded(true),2200);return()=>clearTimeout(timer);},[started]);
 return <section className={`battle-cinema${compact?' battle-cinema-compact':''}`} aria-label="Анимация пиклбола">
  <div className="battle-cinema-frame battle-cinema-players">
   <BattleCourt players={players} state={{key:`${result.key}:${started}`,round,now:Date.now(),starts:Infinity,finalPointAt:started+828,winner:result.outcome,nearBlue}} onHit={()=>{}}/>
   {ended&&<strong className="battle-cinema-status">{result.label}</strong>}
  </div>
  <div className="battle-cinema-actions"><button onClick={()=>{ readyBattleResultAudio(); playBattleResultSound(result.outcome==='near'?'victory':'defeat'); play(); }}>{needsPlay?'▶ Со звуком':'↻ Со звуком'}</button></div>
 </section>;
}
