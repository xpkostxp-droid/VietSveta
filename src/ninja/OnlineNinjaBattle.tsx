import {useEffect,useRef,useState} from 'react';
import {BackButton} from '../components/BackButton';
import type {Match} from '../battle/battleTypes';
import {products} from '../content/marketProducts';
import {speakVietnamese,stopSpeaking} from '../domain/speech';
import {ninjaAsset,type NinjaCharacter} from './ninjaCharacters';
import {NinjaStage} from './NinjaStage';
import {onlineNinjaSnapshot} from './onlineNinja';
import type {createNinjaSound} from './ninjaSound';
import './NinjaScreen.css';
export function OnlineNinjaBattle({match,now,busy,locked,error,sound,onReady,onAnswer,onCancel,onBack,onReplay,onStatistics}:{match:Match;now:number;busy:boolean;locked:boolean;error:string;sound:ReturnType<typeof createNinjaSound>;onReady:()=>void;onAnswer:(choice:number)=>void;onCancel:()=>void;onBack:()=>void;onReplay:()=>void;onStatistics:()=>void}){
 const [loaded,setLoaded]=useState(false),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0);
 const heard=useRef(new Set<string>()),lastBeep=useRef(0),readyCallback=useRef(onReady);readyCallback.current=onReady;
 const human=(match.side==='host'?match.host_character:match.guest_character) as NinjaCharacter;
 const opponent=(match.side==='host'?match.guest_character:match.host_character) as NinjaCharacter;
 const scene=onlineNinjaSnapshot(match,now);
 const ownName=match.side==='host'?match.host_name:match.guest_name,opponentName=match.side==='host'?match.guest_name:match.host_name;
 useEffect(()=>{
  let cancelled=false;setFailed(false);
  const files=[human+'.webp',opponent+'.webp','vault.webp',...products.map((_,i)=>`produce-${i}.webp`)];
  void Promise.all(files.map(file=>new Promise<void>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve();img.onerror=reject;img.src=ninjaAsset(file);}))).then(()=>{if(!cancelled){setLoaded(true);readyCallback.current();}}).catch(()=>{if(!cancelled)setFailed(true);});
  return()=>{cancelled=true;};
 },[human,opponent,retry]);
 const countdown=loaded&&match.round===0&&scene.phase==='ready'&&Number.isFinite(scene.startsAt)?Math.ceil((scene.startsAt-now)/1000):0;
 useEffect(()=>{if(countdown>=1&&countdown<=3&&lastBeep.current!==countdown){lastBeep.current=countdown;sound.beep(countdown);}},[countdown,sound]);
 // Each client presents the authoritative result, including an opponent's hit or a timeout.
 useEffect(()=>{
  if(!loaded)return;
  const timers:ReturnType<typeof setTimeout>[]=[];
  for(const e of scene.events){
   const key=`${match.id}:${scene.round}:${e.kind}:${e.side}`;
   if(heard.current.has(key))continue;
   const delay=e.kind==='hit'?190:e.kind==='splat'?300:0;
   const play=()=>{if(heard.current.has(key))return;heard.current.add(key);sound.play(e.kind);if(e.kind!=='miss')speakVietnamese(products[scene.task.product][1]);};
   // Use the server-adjusted clock for animation timing, rather than the device clock.
   timers.push(setTimeout(play,Math.max(0,e.at+delay-now)));
  }
  return()=>timers.forEach(clearTimeout);
 },[loaded,match.id,scene.round,scene.events.map(e=>`${e.kind}:${e.side}:${e.at}`).join(','),sound]);
 useEffect(()=>()=>stopSpeaking(),[]);
 const final=scene.phase==='finished';
 const reveal=scene.events.some(e=>(e.kind==='hit'&&now>=e.at+190)||(e.kind==='splat'&&now>=e.at+300));
 const canAnswer=loaded&&match.status==='active'&&scene.phase==='question'&&now<scene.startsAt+5000&&!match.answered&&!locked&&!busy;
 const options=(scene.phase==='result'||final)?match.last_result?.options:match.task?.options;
 return <div className={`screen battle-screen ninja-screen is-playing${final?' is-finished':''}`}>
  <div className="battle-topbar"><BackButton onClick={onBack} label="К играм"/><div className="battle-round">{scene.round>=scene.baseRounds?`Доп. раунд ${scene.round-scene.baseRounds+1}`:`Раунд ${Math.min(scene.baseRounds,scene.round+1)}/${scene.baseRounds}`}<b>{final?'✓':!Number.isFinite(scene.startsAt)?'…':scene.phase==='ready'?Math.max(1,countdown):scene.phase==='result'?'✓':Math.max(0,Math.ceil((scene.startsAt+5000-now)/1000))}</b></div></div>
  {loaded?<NinjaStage state={scene} now={now} human={human} bot={opponent}/>:<div className="ninja-stage ninja-loading" role="status">{failed?<>Не удалось загрузить арену.<button onClick={()=>setRetry(n=>n+1)}>Повторить</button></>:'Готовим арену…'}</div>}
  <div className="battle-score ninja-score"><span className="battle-team-blue">{ownName}<strong key={`own:${scene.scoreHuman}`}>{scene.scoreHuman}</strong></span><b>:</b><span className="battle-team-red">{opponentName}<strong key={`opponent:${scene.scoreBot}`}>{scene.scoreBot}</strong></span></div>
  {final?<section className="ninja-result"><h2>{scene.scoreHuman>scene.scoreBot?'🏆 Ты победил!':'Победа соперника'}</h2><p>{error||'Результат сохранён в статистике батлов'}</p><button className="big-button" disabled={busy} onClick={onReplay}>Реванш</button><button className="battle-return-button" onClick={onStatistics}>← К статистике</button></section>:<>
   <div className="ninja-prompt" aria-hidden="true"/>
   <div className="ninja-feedback" aria-live="polite">{error||(!loaded?'':!Number.isFinite(scene.startsAt)?'Ждём готовности соперника':scene.phase==='result'?scene.winner===null?'Без очков':scene.winner==='human'?'Твоё очко':'Очко соперника':match.answered||locked?'Ответ принят':scene.events.length?'Соперник промахнулся — отвечай!':'')}</div>
   <div className="battle-answers ninja-answers">{(options??[]).map((option,i)=><button key={`${scene.round}:${i}`} className={reveal&&i===match.last_result?.answer?'is-correct':''} disabled={!canAnswer} onClick={()=>onAnswer(i)}>{option}</button>)}</div>
   <button className="battle-secondary" disabled={busy} onClick={onCancel}>Завершить батл</button>
  </>}
 </div>;
}
