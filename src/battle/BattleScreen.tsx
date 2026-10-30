import { useEffect, useRef, useState } from 'react';
import { BackButton } from '../components/BackButton';
import { supabase } from '../domain/cloud';
import './BattleScreen.css';
import { BattleCinema, type CinemaResult } from './BattleCinema';
import { BattleCourt, preloadCourt } from './BattleCourt';
import { makeCourtSound } from './courtSound';
import { finalOutcome, ownWinner } from './battleScene';
import { TopicWheel } from './TopicWheel';
import { makeGameSound } from '../beginner/components/gameSounds';
import type { Snapshot } from './battleTypes';
import { primeBattleSpeech, speakBattleWord } from './battleSpeech';
import { hasVietnameseVoice, onVoicesChanged, stopSpeaking } from '../domain/speech';
import { createBotBattle } from './botBattle';
type BattleAudio={sound:ReturnType<typeof makeGameSound>;court:ReturnType<typeof makeCourtSound>};
export function BattleScreen({onBack}:{onBack:()=>void}){
 const [audio]=useState<BattleAudio>(()=>({sound:makeGameSound(),court:makeCourtSound()}));
 useEffect(()=>()=>{audio.sound.close();audio.court.close();},[audio]);
 const [botTopic,setBotTopic]=useState<string|null>(null);
 return <BattleSession key={botTopic??'online'} botTopic={botTopic} audio={audio} onStartBot={setBotTopic} onBack={botTopic?()=>setBotTopic(null):onBack}/>;
}
function BattleSession({onBack,botTopic,onStartBot,audio}:{onBack:()=>void;botTopic:string|null;onStartBot:(topic:string)=>void;audio:BattleAudio}){
 const [bot]=useState(()=>botTopic?createBotBattle(botTopic):null);
 const device=useRef(crypto.randomUUID());
 const courtSound=useRef(audio.court);
 const sound=useRef(audio.sound),beeped=useRef('');
 const spoken=useRef(''),scoreSeen=useRef<{id:string;host:number;guest:number}|null>(null);
 const [voiceReady,setVoiceReady]=useState(()=>hasVietnameseVoice());
 useEffect(()=>onVoicesChanged(()=>setVoiceReady(hasVietnameseVoice())),[]);
 const [state,setState]=useState<Snapshot|null>(null),[topic,setTopic]=useState('fruits'),[error,setError]=useState(''),[busy,setBusy]=useState(false),[now,setNow]=useState(Date.now()),[hidden,setHidden]=useState(document.hidden),[dismissed,setDismissed]=useState('');
 const offset=useRef(0), bestPing=useRef(Infinity), alive=useRef(true),sequence=useRef(0),applied=useRef(0),locked=useRef(''),ready=useRef(''),latest=useRef<Snapshot|null>(null);
 const request=async(action='poll',payload:Record<string,unknown>={})=>{
  const seq=++sequence.current,start=Date.now();
  let snapshot:Snapshot;
  if(bot) snapshot=bot.request(action,payload);
  else {
   const {data,error:failure}=await supabase.rpc('battle_preview',{p_action:action,p_device:device.current,p_payload:payload});
   if(failure)throw new Error(failure.message);
   snapshot=data as Snapshot;
  }
  const end=Date.now();
  if(snapshot.server_now&&end-start<bestPing.current){bestPing.current=end-start;offset.current=Date.parse(snapshot.server_now)-(start+end)/2;}
  if(action!=='leave'&&alive.current&&seq>=applied.current){applied.current=seq;latest.current=snapshot;setState(snapshot);setError('');}
  return snapshot;
 };
 const act=async(action:string,payload:Record<string,unknown>={})=>{
  primeBattleSpeech();sound.current?.ready();courtSound.current?.ready();setBusy(true);try{await request(action,payload);}catch(e){if(alive.current)setError((e as Error).message);}finally{if(alive.current)setBusy(false);}
 };
 useEffect(()=>{
  alive.current=true;if(bot){sound.current?.ready();courtSound.current?.ready();}void preloadCourt().catch(()=>{});let timer:ReturnType<typeof setTimeout>;
  const loop=async()=>{if(!alive.current)return;try{if(!document.hidden)await request();}catch(e){if(alive.current)setError((e as Error).message);}if(alive.current)timer=setTimeout(loop,latest.current?.match?.status==='active'?250:1800);};
  void loop();const tick=setInterval(()=>setNow(Date.now()+offset.current),50);
  const visibility=()=>{setHidden(document.hidden);if(document.hidden)void request('leave').catch(()=>{});};
  document.addEventListener('visibilitychange',visibility);
  return()=>{alive.current=false;stopSpeaking();clearTimeout(timer);clearInterval(tick);document.removeEventListener('visibilitychange',visibility);if(!bot)void supabase.rpc('battle_preview',{p_action:'leave',p_device:device.current,p_payload:{}});};
 },[]);
 const match=state?.match;
 useEffect(()=>{
  if(match?.status==='active'&&!match.starts_at&&ready.current!==match.id){ready.current=match.id;void request('ready',{match:match.id}).catch(e=>{ready.current='';if(alive.current)setError((e as Error).message);});}
 },[match]);
 const starts=match?.starts_at?Date.parse(match.starts_at):Infinity;
 const running=match?.status==='active'&&now>=starts&&now<starts+5000;
 const roundKey=match?`${match.id}:${match.round}`:'';
 const seconds=Math.ceil((starts+5000-now)/1000);
 const preparing=match?.status==='active'&&match.round===0&&Number.isFinite(starts)&&now<starts;
 const prepareSeconds=Math.ceil((starts-now)/1000);
 useEffect(()=>{
  const digit=preparing?prepareSeconds:seconds;
  const enabled=preparing||(running&&!match?.answered);
  const key=`${roundKey}:${preparing?'prepare':'answer'}:${digit}`;
  if(enabled&&digit>=1&&digit<=3&&beeped.current!==key){beeped.current=key;sound.current?.beep(digit);}
 },[roundKey,seconds,prepareSeconds,preparing,running,match?.answered]);
 useEffect(()=>{
  if(hidden||match?.status==='finished'||match?.status==='cancelled'){stopSpeaking();return;}
  if(running&&match?.task&&voiceReady&&spoken.current!==roundKey){
   spoken.current=roundKey;speakBattleWord(match.topic,match.task.word);
  }
 },[roundKey,running,voiceReady,hidden,match?.status,match?.task?.word]);
 useEffect(()=>{
  if(!match)return;
  const previous=scoreSeen.current;
  if(previous?.id===match.id&&(match.score_host>previous.host||match.score_guest>previous.guest))courtSound.current?.point();
  scoreSeen.current={id:match.id,host:match.score_host,guest:match.score_guest};
 },[match?.id,match?.score_host,match?.score_guest]);
 const choose=(choice:number)=>{
  if(!match||!running||busy||match.answered||locked.current===roundKey)return;
  locked.current=roundKey;
  void act('answer',{match:match.id,round:match.round,choice,elapsed:Math.max(0,Math.round(now-starts))});
 };
 const inMatch=match&&match.id!==dismissed;
 const finished=!!inMatch&&match.status==='finished';
 const outcome=finished?finalOutcome(match.score_host,match.score_guest,match.side):null;
 const cinemaResult:CinemaResult|null=finished&&outcome?{key:match.id,outcome,label:outcome==='near'?'Твоя победа!':'Победа соперника'}:null;
 const playing=!!inMatch&&match.status==='active';
 const showCinema=!!state&&!hidden;
 const shownWord=running?(match?.task?.word??''):now<starts?(match?.last_result?.word??'Приготовьтесь!'):'Время!';

 return <div className={`screen battle-screen${playing?' is-playing':''}`}><div className="battle-topbar"><BackButton onClick={onBack} label={bot?'К батлу':'К играм'}/>{playing&&!hidden&&<div className="battle-round">Раунд {Math.min(15,match.round+1)}/15 <b>{!match.starts_at?'…':now<starts?Math.ceil((starts-now)/1000):Math.max(0,Math.ceil((starts+5000-now)/1000))}</b></div>}</div><div className="battle-heading"><h1>{bot?'🤖 Батл с ботом':'⚔️ Батл'}</h1>{!playing&&<span>{bot?'Тренировка · без рейтинга':'Пробный · продвинутая группа'}</span>}</div>

 {playing&&!hidden&&<BattleCourt state={{key:roundKey,round:match.round,now,starts,winner:ownWinner(match.last_result?.winner??'none',match.side),nearBlue:match.side==='host'}} onHit={(kind,near)=>courtSound.current?.hit(kind,near)}/>}
 {showCinema&&(playing||finished)&&<div className="battle-score"><span className="battle-team-blue">{match.host_name}<strong key={`host:${match.score_host}`} className={match.score_host?'battle-score-pop':undefined}>{match.score_host}</strong></span><b>:</b><span className="battle-team-red">{match.guest_name}<strong key={`guest:${match.score_guest}`} className={match.score_guest?'battle-score-pop':undefined}>{match.score_guest}</strong></span></div>}
 <BattleCinema lobby={false} result={showCinema?cinemaResult:null}/>

 {hidden?<p>Вернись в приложение, чтобы снова быть в сети.</p>:!state?<p role="status">Подключаемся…</p>:inMatch&&match.status==='invited'?<section className="battle-panel"><h2>{match.side==='host'?'Ждём ответа…':`${match.host_name} вызывает тебя!`}</h2><p>{state.topics.find(t=>t.id===match.topic)?.title} · 15 вопросов</p>{match.side==='guest'?<><button className="big-button" disabled={busy} onClick={()=>void act('accept',{match:match.id})}>Принять вызов</button><button className="battle-secondary" disabled={busy} onClick={()=>void act('decline',{match:match.id})}>Отклонить</button></>:<button className="battle-secondary" disabled={busy} onClick={()=>void act('cancel',{match:match.id})}>Отменить вызов</button>}</section>:inMatch&&match.status==='active'?<>
 <div className={`battle-word${shownWord.length>16?' battle-word-long':''}`}>{shownWord}</div>
 <div className="battle-feedback" aria-live="polite">{now<starts&&match.last_result?<>✓ {match.last_result.options[match.last_result.answer]} · {match.last_result.winner==='none'?'Без очков':match.last_result.winner==='both'?'По очку обоим':`Очко: ${match.last_result.winner==='host'?match.host_name:match.guest_name}`}</>:match.answered||locked.current===roundKey?'Ответ принят. Ждём результат…':'Выбери перевод'}</div>
 <div className="battle-answers">{(match.task?.options??[]).map((option,i)=><button key={`${roundKey}:${i}`} disabled={!running||busy||match.answered||locked.current===roundKey} onClick={()=>choose(i)}>{option}</button>)}</div>
 <button className="battle-secondary" disabled={busy} onClick={()=>void act('cancel',{match:match.id})}>Завершить батл</button>
 </>:inMatch&&['finished','cancelled'].includes(match.status)?<section className="battle-panel"><h2>{match.status==='finished'?'🏆 Батл завершён':'Батл отменён'}</h2><p>{match.host_name} {match.score_host} : {match.score_guest} {match.guest_name}</p><p>{match.status==='finished'?(match.score_host===match.score_guest?'Ничья!':`Победитель: ${match.score_host>match.score_guest?match.host_name:match.guest_name}`):'Приглашение истекло, участник вышел или свернул приложение.'}</p><button className="big-button" onClick={()=>{if(bot)onBack();else{setDismissed(match.id);ready.current='';}}}>В лобби</button></section>:<>
 <div className="battle-label">Выбери тему</div><TopicWheel items={state.topics} value={topic} onChange={setTopic}/>
 <p className="battle-rules">15 вопросов · 5 секунд · 3 ответа</p>
 <button className="big-button" disabled={busy} onClick={()=>{primeBattleSpeech();sound.current.ready();courtSound.current.ready();onStartBot(topic);}}>🤖 Сыграть с ботом</button>
 <p className="battle-note" style={{marginTop:0}}>Случайные ответы · 15 вопросов · без рейтинга</p>
 <h2>Сейчас в сети</h2>{state.online.length?state.online.map(p=><div className="battle-person" key={p.device}><span>🟢 {p.name}</span><button disabled={busy||p.busy} onClick={()=>{setDismissed('');void act('invite',{opponent:p.device,topic});}}>{p.busy?'Занят':'Вызвать'}</button></div>):<p>Пока никого. Откройте этот раздел под второй учётной записью на другом устройстве.</p>}
 <p className="battle-note">Доступно только админу и Светлане. Пробные результаты не влияют на рейтинги обычных игр.</p>
 </>}
 {error&&<p role="alert" className="battle-error">{error} <button onClick={()=>void act('poll')}>Повторить</button></p>}
 </div>;
}
