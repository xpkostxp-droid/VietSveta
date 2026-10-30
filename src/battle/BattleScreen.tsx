import { useEffect, useRef, useState } from 'react';
import { BackButton } from '../components/BackButton';
import { supabase } from '../domain/cloud';
import './BattleScreen.css';
import { BattleCinema, type CinemaResult } from './BattleCinema';
import { BattleCourt, preloadCourt } from './BattleCourt';
import { makeCourtSound } from './courtSound';
import { finalOutcome, ownWinner } from './battleScene';
import { BattleStatistics } from './BattleStatistics';
import { TopicWheel } from './TopicWheel';
import { makeGameSound } from '../beginner/components/gameSounds';
import type { Snapshot } from './battleTypes';
import { primeBattleSpeech, speakBattleWord } from './battleSpeech';
import { hasVietnameseVoice, onVoicesChanged, stopSpeaking } from '../domain/speech';
import { botVocabulary } from './botVocabulary';
import { OnlineNinjaBattle } from '../ninja/OnlineNinjaBattle';
import { createNinjaSound } from '../ninja/ninjaSound';
type BattleAudio={sound:ReturnType<typeof makeGameSound>;court:ReturnType<typeof makeCourtSound>;ninja:ReturnType<typeof createNinjaSound>};
export function BattleScreen({onBack}:{onBack:()=>void}){
 const [audio]=useState<BattleAudio>(()=>({sound:makeGameSound(),court:makeCourtSound(),ninja:createNinjaSound()}));
 useEffect(()=>()=>{audio.sound.close();audio.court.close();audio.ninja.close();},[audio]);
 return <BattleSession audio={audio} onBack={onBack}/>;
}
function BattleSession({onBack,audio}:{onBack:()=>void;audio:BattleAudio}){
 const [assetsReady,setAssetsReady]=useState('');
 const [view,setView]=useState<'stats'|'lobby'>('stats');
 const device=useRef(crypto.randomUUID());
 const courtSound=useRef(audio.court);
 const sound=useRef(audio.sound),beeped=useRef('');
 const answerSpeech=useRef<{key:string;topic:string;word:string}|null>(null),spoken=useRef(''),scoreSeen=useRef<{id:string;host:number;guest:number}|null>(null);
 const [voiceReady,setVoiceReady]=useState(()=>hasVietnameseVoice());
 useEffect(()=>onVoicesChanged(()=>setVoiceReady(hasVietnameseVoice())),[]);
 const [state,setState]=useState<Snapshot|null>(null),[topic,setTopic]=useState('fruits'),[error,setError]=useState(''),[busy,setBusy]=useState(false),[now,setNow]=useState(Date.now()),[hidden,setHidden]=useState(document.hidden),[dismissed,setDismissed]=useState('');
 const offset=useRef(0), bestPing=useRef(Infinity), alive=useRef(true),sequence=useRef(0),applied=useRef(0),locked=useRef(''),ready=useRef(''),latest=useRef<Snapshot|null>(null);
 const request=async(action='poll',payload:Record<string,unknown>={})=>{
  const seq=++sequence.current,start=Date.now();
  let snapshot:Snapshot;
  {
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
  primeBattleSpeech();sound.current?.ready();courtSound.current?.ready();audio.ninja.ready();setBusy(true);try{await request(action,payload);}catch(e){if(alive.current)setError((e as Error).message);}finally{if(alive.current)setBusy(false);}
 };
 useEffect(()=>{
  alive.current=true;void preloadCourt().catch(()=>{});let timer:ReturnType<typeof setTimeout>;
  const loop=async()=>{if(!alive.current)return;try{if(!document.hidden)await request();}catch(e){if(alive.current)setError((e as Error).message);}if(alive.current)timer=setTimeout(loop,latest.current?.match?.status==='active'?250:1800);};
  void loop();const tick=setInterval(()=>setNow(Date.now()+offset.current),50);
  const visibility=()=>{setHidden(document.hidden);if(document.hidden)void request('leave').catch(()=>{});};
  document.addEventListener('visibilitychange',visibility);
  return()=>{alive.current=false;stopSpeaking();clearTimeout(timer);clearInterval(tick);document.removeEventListener('visibilitychange',visibility);void supabase.rpc('battle_preview',{p_action:'leave',p_device:device.current,p_payload:{}});};
 },[]);
 const match=state?.match;
 const isNinja=match?.mode==='ninja';
 useEffect(()=>{
  if(match?.status==='active'&&!match.starts_at&&ready.current!==match.id&&(!isNinja||assetsReady===match.id)){ready.current=match.id;void request('ready',{match:match.id}).catch(e=>{ready.current='';if(alive.current)setError((e as Error).message);});}
 },[match,isNinja,assetsReady]);
 const baseRounds=match?.base_rounds??Math.min(10,botVocabulary[match?.topic??topic]?.words.length??10)*2;
 const starts=match?.starts_at?Date.parse(match.starts_at):Infinity;
 const running=match?.status==='active'&&now>=starts&&now<starts+5000;
 const roundKey=match?`${match.id}:${match.round}`:'';
 const seconds=Math.ceil((starts+5000-now)/1000);
 const preparing=match?.status==='active'&&match.round===0&&Number.isFinite(starts)&&now<starts;
 const prepareSeconds=Math.ceil((starts-now)/1000);
 useEffect(()=>{
  if(isNinja)return;
  const digit=preparing?prepareSeconds:seconds;
  const enabled=preparing||(running&&!match?.answered);
  const key=`${roundKey}:${preparing?'prepare':'answer'}:${digit}`;
  if(enabled&&digit>=1&&digit<=3&&beeped.current!==key){beeped.current=key;sound.current?.beep(digit);}
 },[roundKey,seconds,prepareSeconds,preparing,running,match?.answered,isNinja]);
 useEffect(()=>{
  if(hidden||match?.status==='cancelled'){stopSpeaking();return;}
  const pending=answerSpeech.current;
  if(pending&&pending.key===roundKey&&voiceReady&&spoken.current!==pending.key){
   spoken.current=pending.key;speakBattleWord(pending.topic,pending.word);
  }
 },[roundKey,voiceReady,hidden,match?.status]);
 useEffect(()=>{
  if(!match||isNinja)return;
  const previous=scoreSeen.current;
  if(previous?.id===match.id&&(match.score_host>previous.host||match.score_guest>previous.guest))courtSound.current?.point();
  scoreSeen.current={id:match.id,host:match.score_host,guest:match.score_guest};
 },[match?.id,match?.score_host,match?.score_guest,isNinja]);
 const choose=(choice:number)=>{
  if(!match||!running||busy||match.answered||locked.current===roundKey)return;
  locked.current=roundKey;
  if(!isNinja&&match.task){
   const pending={key:roundKey,topic:match.topic,word:match.task.word};
   answerSpeech.current=pending;primeBattleSpeech();
   if(hasVietnameseVoice()){spoken.current=roundKey;speakBattleWord(pending.topic,pending.word);}
  }
  void act('answer',{match:match.id,round:match.round,choice,elapsed:Math.max(0,Math.round(now-starts))});
 };
 const inMatch=match&&match.id!==dismissed;
 const finished=!!inMatch&&match.status==='finished';
 const outcome=finished?finalOutcome(match.score_host,match.score_guest,match.side):null;
 const cinemaResult:CinemaResult|null=finished&&outcome?{key:match.id,outcome,label:outcome==='near'?'Твоя победа!':'Победа соперника'}:null;
 const playing=!!inMatch&&match.status==='active';
 const showCinema=!!state&&!hidden;
 const shownWord=running?(match?.task?.word??''):now<starts?(match?.last_result?.word??'Приготовьтесь!'):'Время!';

 if(isNinja&&inMatch&&(playing||finished)&&!hidden)return <OnlineNinjaBattle key={match.id} match={match} now={now} busy={busy} locked={locked.current===roundKey} error={error} sound={audio.ninja} onReady={()=>setAssetsReady(match.id)} onAnswer={choose} onCancel={()=>void act('cancel',{match:match.id})} onBack={onBack} onReplay={()=>void act('rematch',{match:match.id})} onStatistics={()=>{setDismissed(match.id);ready.current='';setView('stats');}}/>;
 return <div className={`screen battle-screen${playing||finished?' is-playing':''}${finished?' is-finished':''}`}><div className="battle-topbar"><BackButton onClick={!playing&&!finished&&view==='lobby'?()=>setView('stats'):onBack} label={!playing&&!finished&&view==='lobby'?'К статистике':'К играм'}/>{(playing||finished)&&!hidden&&<div className="battle-round">{match.round>=baseRounds&&!finished?'Дополнительный раунд '+(match.round-baseRounds+1):`Раунд ${Math.min(baseRounds,match.round+1)}/${baseRounds}`} <b>{finished?'✓':!match.starts_at?'…':now<starts?Math.ceil((starts-now)/1000):Math.max(0,Math.ceil((starts+5000-now)/1000))}</b></div>}</div><div className="battle-heading"><h1>⚔️ Батл</h1>{!playing&&<span>Онлайн · с участниками</span>}</div>

 {(playing||(finished&&!outcome))&&!hidden&&<BattleCourt state={{key:roundKey,round:finished?Math.max(0,match.round-1):match.round,now,starts:finished?Infinity:starts,winner:ownWinner(match.last_result?.winner??'none',match.side),nearBlue:match.side==='host'}} onHit={(kind,near)=>courtSound.current?.hit(kind,near)}/>}

 <BattleCinema lobby={false} compact result={showCinema?cinemaResult:null}/>
 {showCinema&&(playing||finished)&&<div className="battle-score"><span className="battle-team-blue">{match.host_name}<strong key={`host:${match.score_host}`} className={match.score_host?'battle-score-pop':undefined}>{match.score_host}</strong></span><b>:</b><span className="battle-team-red">{match.guest_name}<strong key={`guest:${match.score_guest}`} className={match.score_guest?'battle-score-pop':undefined}>{match.score_guest}</strong></span></div>}

 {hidden?<p>Вернись в приложение, чтобы снова быть в сети.</p>:!state?<p role="status">Подключаемся…</p>:inMatch&&match.status==='invited'?<section className="battle-panel"><h2>{match.side==='host'?'Ждём ответа…':`${match.host_name} вызывает тебя!`}</h2><p>{state.topics.find(t=>t.id===match.topic)?.title} · {baseRounds} вопросов</p>{match.side==='guest'?<><button className="big-button" disabled={busy} onClick={()=>void act('accept',{match:match.id})}>Принять вызов</button><button className="battle-secondary" disabled={busy} onClick={()=>void act('decline',{match:match.id})}>Отклонить</button></>:<button className="battle-secondary" disabled={busy} onClick={()=>void act('cancel',{match:match.id})}>Отменить вызов</button>}</section>:inMatch&&match.status==='active'?<>
 <div className={`battle-word${shownWord.length>16?' battle-word-long':''}`}>{shownWord}</div>
 <div className="battle-feedback" aria-live="polite">{now<starts&&match.last_result?<>✓ {match.last_result.options[match.last_result.answer]} · {match.last_result.winner==='none'?'Без очков':match.last_result.winner==='both'?'По очку обоим':`Очко: ${match.last_result.winner==='host'?match.host_name:match.guest_name}`}</>:match.answered||locked.current===roundKey?'Ответ принят. Ждём результат…':'Выбери перевод'}</div>
 <div className="battle-answers">{(match.task?.options??[]).map((option,i)=><button key={`${roundKey}:${i}`} disabled={!running||busy||match.answered||locked.current===roundKey} onClick={()=>choose(i)}>{option}</button>)}</div>
 <button className="battle-secondary" disabled={busy} onClick={()=>void act('cancel',{match:match.id})}>Завершить батл</button>
 </>:inMatch&&['finished','cancelled'].includes(match.status)?<section className={`battle-panel${finished?' battle-result':''}`}><h2>{match.status==='finished'?'🏆 Батл завершён':'Батл отменён'}</h2><p>{match.status==='finished'?(match.score_host===match.score_guest?'Ничья!':`Победитель: ${match.score_host>match.score_guest?match.host_name:match.guest_name}`):'Приглашение истекло, участник вышел или свернул приложение.'}</p><div className="battle-result-actions">{finished&&<button className="big-button" disabled={busy} onClick={()=>void act('rematch',{match:match.id})}>Реванш</button>}<button className="battle-return-button" onClick={()=>{setDismissed(match.id);ready.current='';setView('stats');}}>← К статистике</button></div></section>:view==='stats'?<BattleStatistics onPlay={()=>{setView('lobby');if(match)setDismissed(match.id);}}/>:<>
 <div className="battle-label">Выбери тему</div><TopicWheel items={state.topics} value={topic} onChange={setTopic}/>
 <p className="battle-rules">{['fruits','vegetables','harvest'].includes(topic)?'🥷 Ниндзя · картинки → вьетнамский · до 10 раундов':'🏓 Пиклбол · до 10 слов в каждом направлении'} · 5 секунд · до победы</p>
 <h2>Сейчас в сети</h2>{state.online.length?state.online.map(p=><div className="battle-person" key={p.device}><span>🟢 {p.name}</span><button disabled={busy||p.busy} onClick={()=>{setDismissed('');void act('invite',{opponent:p.device,topic});}}>{p.busy?'Занят':'Вызвать'}</button></div>):<p>Пока никого. Откройте этот раздел под второй учётной записью на другом устройстве.</p>}
 <p className="battle-note">Результаты сохраняются в статистике батлов и не влияют на рейтинги обычных игр.</p>
 </>}
 {error&&<p role="alert" className="battle-error">{error} <button onClick={()=>void act('poll')}>Повторить</button></p>}
 </div>;
}
