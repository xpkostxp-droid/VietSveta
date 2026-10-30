import { useEffect, useRef, useState } from 'react';
import { BackButton } from '../components/BackButton';
import { supabase } from '../domain/cloud';
import './BattleScreen.css';
import { TopicWheel } from './TopicWheel';
import { makeGameSound } from '../beginner/components/gameSounds';
type Match={id:string;status:string;topic:string;side:'host'|'guest';host_name:string;guest_name:string;round:number;starts_at:string|null;ready_host:boolean;ready_guest:boolean;task:{word:string;options:string[]}|null;answered:boolean;score_host:number;score_guest:number;last_result:{winner:string;word:string;options:string[];answer:number}|null};
type Snapshot={server_now:string;online:{device:string;name:string;busy:boolean}[];topics:{id:string;title:string}[];match:Match|null};
export function BattleScreen({onBack}:{onBack:()=>void}){
 const device=useRef(crypto.randomUUID());
 const sound=useRef<ReturnType<typeof makeGameSound>|null>(null),beeped=useRef('');
 sound.current??=makeGameSound();
 const [state,setState]=useState<Snapshot|null>(null),[topic,setTopic]=useState('fruits'),[error,setError]=useState(''),[busy,setBusy]=useState(false),[now,setNow]=useState(Date.now()),[hidden,setHidden]=useState(document.hidden),[dismissed,setDismissed]=useState('');
 const offset=useRef(0), bestPing=useRef(Infinity), alive=useRef(true),sequence=useRef(0),applied=useRef(0),locked=useRef(''),ready=useRef(''),latest=useRef<Snapshot|null>(null);
 const request=async(action='poll',payload:Record<string,unknown>={})=>{
  const seq=++sequence.current,start=Date.now();
  const {data,error:failure}=await supabase.rpc('battle_preview',{p_action:action,p_device:device.current,p_payload:payload});
  if(failure)throw new Error(failure.message);
  const end=Date.now(),snapshot=data as Snapshot;
  if(snapshot.server_now&&end-start<bestPing.current){bestPing.current=end-start;offset.current=Date.parse(snapshot.server_now)-(start+end)/2;}
  if(action!=='leave'&&alive.current&&seq>=applied.current){applied.current=seq;latest.current=snapshot;setState(snapshot);setError('');}
  return snapshot;
 };
 const act=async(action:string,payload:Record<string,unknown>={})=>{
  sound.current?.ready();setBusy(true);try{await request(action,payload);}catch(e){if(alive.current)setError((e as Error).message);}finally{if(alive.current)setBusy(false);}
 };
 useEffect(()=>{
  alive.current=true;let timer:ReturnType<typeof setTimeout>;
  const loop=async()=>{if(!alive.current)return;try{if(!document.hidden)await request();}catch(e){if(alive.current)setError((e as Error).message);}if(alive.current)timer=setTimeout(loop,latest.current?.match?.status==='active'?250:1800);};
  void loop();const tick=setInterval(()=>setNow(Date.now()+offset.current),50);
  const visibility=()=>{setHidden(document.hidden);if(document.hidden)void request('leave').catch(()=>{});};
  document.addEventListener('visibilitychange',visibility);
  return()=>{alive.current=false;sound.current?.close();clearTimeout(timer);clearInterval(tick);document.removeEventListener('visibilitychange',visibility);void supabase.rpc('battle_preview',{p_action:'leave',p_device:device.current,p_payload:{}});};
 },[]);
 const match=state?.match;
 useEffect(()=>{
  if(match?.status==='active'&&!match.starts_at&&ready.current!==match.id){ready.current=match.id;void request('ready',{match:match.id}).catch(e=>{ready.current='';if(alive.current)setError((e as Error).message);});}
 },[match]);
 const starts=match?.starts_at?Date.parse(match.starts_at):Infinity;
 const running=match?.status==='active'&&now>=starts&&now<starts+5000;
 const roundKey=match?`${match.id}:${match.round}`:'';
 const seconds=Math.ceil((starts+5000-now)/1000);
 useEffect(()=>{const key=`${roundKey}:${seconds}`;if(running&&!match?.answered&&seconds>=1&&seconds<=3&&beeped.current!==key){beeped.current=key;sound.current?.beep(seconds);}},[roundKey,seconds,running,match?.answered]);
 const choose=(choice:number)=>{
  if(!match||!running||busy||match.answered||locked.current===roundKey)return;
  locked.current=roundKey;
  void act('answer',{match:match.id,round:match.round,choice,elapsed:Math.max(0,Math.round(now-starts))});
 };
 const inMatch=match&&match.id!==dismissed;
 return <div className="screen battle-screen"><BackButton onClick={onBack} label="К играм"/><div className="battle-heading"><h1>⚔️ Батл</h1><span>Пробный · продвинутая группа</span></div>
 {hidden?<p>Вернись в приложение, чтобы снова быть в сети.</p>:!state?<p role="status">Подключаемся…</p>:inMatch&&match.status==='invited'?<section className="battle-panel"><h2>{match.side==='host'?'Ждём ответа…':`${match.host_name} вызывает тебя!`}</h2><p>{state.topics.find(t=>t.id===match.topic)?.title} · 15 раундов</p>{match.side==='guest'?<><button className="big-button" disabled={busy} onClick={()=>void act('accept',{match:match.id})}>Принять вызов</button><button className="battle-secondary" disabled={busy} onClick={()=>void act('decline',{match:match.id})}>Отклонить</button></>:<button className="battle-secondary" disabled={busy} onClick={()=>void act('cancel',{match:match.id})}>Отменить вызов</button>}</section>:inMatch&&match.status==='active'?<>
 <div className="battle-score"><span>{match.host_name}<strong>{match.score_host}</strong></span><b>:</b><span>{match.guest_name}<strong>{match.score_guest}</strong></span></div>
 <div className="battle-round">Раунд {Math.min(15,match.round+1)}/15 <b>{!match.starts_at?'…':now<starts?Math.ceil((starts-now)/1000):Math.max(0,Math.ceil((starts+5000-now)/1000))}</b></div>
 <div className="battle-word">{running?match.task?.word:now<starts?(match.last_result?'Следующий раунд':'Приготовьтесь!'):'Время!'}</div>
 <div className="battle-feedback" aria-live="polite">{now<starts&&match.last_result?<>Правильно: {match.last_result.options[match.last_result.answer]}<br/>{match.last_result.winner==='none'?'Без очков':match.last_result.winner==='both'?'По очку обоим':`Очко: ${match.last_result.winner==='host'?match.host_name:match.guest_name}`}</>:match.answered||locked.current===roundKey?'Ответ принят. Ждём результат…':'Выбери перевод'}</div>
 <div className="battle-answers">{(match.task?.options??[]).map((option,i)=><button key={`${roundKey}:${i}`} disabled={!running||busy||match.answered||locked.current===roundKey} onClick={()=>choose(i)}>{option}</button>)}</div>
 <button className="battle-secondary" disabled={busy} onClick={()=>void act('cancel',{match:match.id})}>Завершить батл</button>
 </>:inMatch&&['finished','cancelled'].includes(match.status)?<section className="battle-panel"><h2>{match.status==='finished'?'🏆 Батл завершён':'Батл отменён'}</h2><p>{match.host_name} {match.score_host} : {match.score_guest} {match.guest_name}</p><p>{match.status==='finished'?(match.score_host===match.score_guest?'Ничья!':`Победитель: ${match.score_host>match.score_guest?match.host_name:match.guest_name}`):'Приглашение истекло, участник вышел или свернул приложение.'}</p><button className="big-button" onClick={()=>{setDismissed(match.id);ready.current='';}}>В лобби</button></section>:<>
 <div className="battle-label">Выбери тему</div><TopicWheel items={state.topics} value={topic} onChange={setTopic}/>
 <p className="battle-rules">15 раундов · 5 секунд · 3 ответа<br/>Первый правильный ответ приносит очко. После ошибки соперник ещё может ответить.</p>
 <h2>Сейчас в сети</h2>{state.online.length?state.online.map(p=><div className="battle-person" key={p.device}><span>🟢 {p.name}</span><button disabled={busy||p.busy} onClick={()=>{setDismissed('');void act('invite',{opponent:p.device,topic});}}>{p.busy?'Занят':'Вызвать'}</button></div>):<p>Пока никого. Откройте этот раздел под второй учётной записью на другом устройстве.</p>}
 <p className="battle-note">Доступно только админу и Светлане. Пробные результаты не влияют на рейтинги обычных игр.</p>
 </>}
 {error&&<p role="alert" className="battle-error">{error} <button onClick={()=>void act('poll')}>Повторить</button></p>}
 </div>;
}
