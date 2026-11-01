import {useStudyActivity} from '../../domain/useStudyActivity';
import {reportStudyAnswer} from '../../domain/studyTelemetry';
import { useEffect, useRef, useState } from 'react';
import { phoneToneUrl } from '../content/games/phoneTone';
import { phoneDigitWords, phoneBlitzNumbers } from '../content/games/phone';
import { BackButton } from './BackButton';
import { GameRanking } from '../../components/GameRanking';
import { saveTimedAttempt } from '../../domain/answerTime';
import { makeGameSound } from './gameSounds';
import './PhoneGameScreen.css';
import { GamePrompt, GameChoices, beginnerPlayClass } from './BeginnerPlayLayout';
type Phase = 'intro' | 'listening' | 'question' | 'feedback' | 'calling' | 'result';
const game = 'lesson9-phone';
export function PhoneGameScreen({ onBack }: { onBack: () => void }) {
 const [retry,setRetry]=useState(0);
 const [numbers,setNumbers]=useState<string[]>([]),[at,setAt]=useState(0),[phase,setPhase]=useState<Phase>('intro');
 const [left,setLeft]=useState(5000),[paused,setPaused]=useState(false),[error,setError]=useState('');
 const [wrong,setWrong]=useState<number|null>(null),[,setSuccess]=useState(false),[score,setScore]=useState({correct:0,time:0});
 const voice=useRef<HTMLAudioElement>(null),tone=useRef<HTMLAudioElement>(null),audio=useRef(makeGameSound());
 const deadline=useRef(0),frozen=useRef(5000),lastBeep=useRef<number|null>(null),clean=useRef(true),locked=useRef(true),request=useRef(0);
 const result=useRef({correct:0,time:0,answerTime:0}),saved=useRef(false);
 useStudyActivity('games',game,!['intro','result'].includes(phase)&&!paused);
 const studyLogged=useRef(-1);
 const logStudy=(choice:number|null)=>{if(studyLogged.current===at)return;studyLogged.current=at;reportStudyAnswer({topic:game,vi:phoneDigitWords[digit],ru:String(digit),direction:reverse?'vi-ru':'listening',chosen:choice===null?null:String(choice),result:choice===digit?'correct':choice===null?'timeout':'wrong',elapsed_ms:Math.max(0,Math.min(5000,5000-(deadline.current-Date.now())))});};
 const numberIndex=Math.floor(at/10),position=at%10,reverse=numberIndex===1;
 const phone=numbers[numberIndex],digit=phone?Number(phone[position]):0;
 const [toneUrl,setToneUrl]=useState<string>();
 useEffect(()=>{if(!phone)return;const url=phoneToneUrl(phone);setToneUrl(url);return()=>URL.revokeObjectURL(url);},[phone]);
 const begin=()=>{
  audio.current.ready();request.current++;voice.current?.pause();tone.current?.pause();
  studyLogged.current=-1;
  result.current={correct:0,time:0,answerTime:0};saved.current=false;clean.current=true;locked.current=true;lastBeep.current=null;
  setNumbers(phoneBlitzNumbers());setAt(0);setScore({correct:0,time:0});setLeft(5000);setWrong(null);setError('');setPaused(document.hidden);setPhase('listening');
 };
 const stop=()=>{request.current++;voice.current?.pause();tone.current?.pause();onBack();};
 const finish=(correct:boolean)=>{
  if(locked.current||paused)return;locked.current=true;voice.current?.pause();request.current++;
  const elapsed=Math.min(5000,Math.max(0,5000-(deadline.current-Date.now())));
  if(!correct)logStudy(null);
  result.current.answerTime+=elapsed;
  if(correct&&clean.current){result.current.correct++;result.current.time+=elapsed;}
  setScore({correct:result.current.correct,time:result.current.time});setSuccess(correct&&clean.current);setLeft(Math.max(0,5000-elapsed));setPhase('feedback');
 };
 const finishCall=()=>{
  tone.current?.pause();
  if(numberIndex===0){clean.current=true;locked.current=true;lastBeep.current=null;setAt(10);setWrong(null);setLeft(5000);setError('');setPhase('listening');}
  else if(!saved.current){saved.current=true;saveTimedAttempt({game,correct:result.current.correct,total:20,answerTimeMs:result.current.answerTime,correctTimeMs:result.current.time,completed:true});setPhase('result');}
 };
 useEffect(()=>{
  if(phase!=='listening'||paused)return;
  const id=++request.current;setError('');
  const player=voice.current;if(!player)return;player.currentTime=0;
  void player.play().then(()=>{
   if(request.current!==id)return;
   if(document.hidden){player.pause();setPaused(true);return;}
   deadline.current=Date.now()+5000;frozen.current=5000;lastBeep.current=null;locked.current=false;setLeft(5000);setPhase('question');
  }).catch(()=>{if(request.current===id)setError('Не удалось включить звук. Нажми «Повторить цифру».');});
  return()=>{request.current++;};
 },[phase,at,paused,retry]);
 useEffect(()=>{
  if(phase!=='question'||paused)return;
  const timer=setInterval(()=>{
   const remaining=Math.max(0,deadline.current-Date.now());setLeft(remaining);
   const seconds=Math.ceil(remaining/1000);
   if(seconds>=1&&seconds<=3&&lastBeep.current!==seconds){lastBeep.current=seconds;audio.current.beep(seconds);}
   if(!remaining)finish(false);
  },40);return()=>clearInterval(timer);
 },[phase,at,paused]);
 useEffect(()=>{
  if(phase!=='feedback'||paused)return;
  const timer=setTimeout(()=>{
   setWrong(null);setError('');
   if(position===9)setPhase('calling');
   else {clean.current=true;locked.current=true;lastBeep.current=null;setAt(n=>n+1);setLeft(5000);setPhase('listening');}
  },800);return()=>clearTimeout(timer);
 },[phase,at,paused]);
 useEffect(()=>{
  if(phase!=='calling'||paused)return;
  const player=tone.current;if(player){player.currentTime=0;void player.play().catch(()=>{});}
  const timer=setTimeout(finishCall,3300);
  return()=>{clearTimeout(timer);player?.pause();};
 },[phase,at,paused]);
 useEffect(()=>{
  const hide=()=>{if(document.hidden&&!['intro','result'].includes(phase)){frozen.current=Math.max(0,deadline.current-Date.now());request.current++;voice.current?.pause();tone.current?.pause();setPaused(true);}};
  document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);
 },[phase]);
 useEffect(()=>()=>{request.current++;voice.current?.pause();tone.current?.pause();audio.current.close();},[]);
 const choose=(value:number)=>{
  if(phase!=='question'||paused||locked.current)return;
  if(Date.now()>=deadline.current){finish(false);return;}
  logStudy(value);
  if(value!==digit){clean.current=false;setWrong(value);return;}
  finish(true);
 };
 const replay=()=>{
  audio.current.ready();
  if(phase==='listening'){setRetry(n=>n+1);return;}
  const player=voice.current;if(player){player.currentTime=0;void player.play().catch(()=>setError('Не удалось включить звук.'));}
 };
 const source=phone?(digit===0?`${import.meta.env.BASE_URL}beginner/audio/games/phone/${reverse?'ru':'vi'}-0.mp3`:`${import.meta.env.BASE_URL}beginner/audio/games/${reverse?'numbers-ru':'numbers'}/${digit}.mp3`):undefined;
 if(phase==='intro'||phase==='result')return <div className="screen ranking-screen"><BackButton onClick={onBack} label="К числительным"/><h1 className="screen-title">Цифры 1–10 · Номер телефона</h1><GameRanking game={game} total={20} onStart={begin} startLabel={phase==='result'?'Играть ещё':'Начать'} result={phase==='result'?score:undefined}/></div>;
 const calling=phase==='calling';
 return <div className={"screen screen-phone-game phone-blitz " + beginnerPlayClass}>
  <BackButton onClick={stop} label="К числительным"/>
  <h1 className="screen-title">Номер телефона</h1>
  <div className="phone-blitz-status work-status"><strong>Номер {numberIndex+1}/2 · {Math.min(at+1,20)}/20 · ✓ {score.correct}</strong><span className={'phone-blitz-clock work-clock'+(left<=3000?' phone-blitz-urgent':'')} aria-label="Время на ответ">{calling?'☎':paused?'Ⅱ':Math.ceil(left/1000)}</span></div>
  <div className="phone-blitz-timebar work-timebar"><div style={{width:`${left/50}%`}}/></div>
  <audio ref={voice} src={source} preload="auto"/>
  <audio ref={tone} src={toneUrl} preload="auto"/>
  <GamePrompt label={calling?'☎️':reverse?digit:'🔊'}>
  <div className={'phone-display'+(calling?' phone-ringing':'')}>
   <span className="phone-handset" aria-hidden="true">☎️</span>
   <div className="phone-digits" aria-label="Набранный номер">{Array.from({length:10},(_,i)=><span key={i} className={i===position&&!calling?'phone-digit-current':''}>{i<position||calling||(i===position&&phase==='feedback')?phone[i]:'·'}</span>)}</div>
  </div>
  <div className="phone-blitz-prompt"><small>{reverse?'Выбери вьетнамское название':'Слушай цифру по-вьетнамски'}</small><strong>{calling?'☎️':reverse?digit:'🔊'}</strong></div>
  <p className="phone-feedback" role="status">{paused ? 'Игра на паузе' : calling ? 'Номер набран! Звоним…' : phase === 'listening' ? 'Включаем запись…' : '\u00a0'}</p>
  <div className="phone-replay">{paused?<button className="big-button" onClick={()=>{audio.current.ready();deadline.current=Date.now()+frozen.current;setPaused(false);}}>Продолжить</button>:<button className="secondary-button phone-replay-button" aria-label="Повторить цифру" disabled={calling||phase==='feedback'} onClick={replay}>Повторить цифру</button>}</div>
  <p className="phone-blitz-error" role="alert">{error}</p>
  </GamePrompt>
  <GameChoices count={10} columns={3} rows={4} className={'phone-keypad'+(reverse?' phone-keypad-words':'')}>{[1,2,3,4,5,6,7,8,9,0].map(value=><button key={value} data-digit={value} lang={reverse?'vi':undefined} className={'phone-key'+(value===0?' phone-key-zero':'')+(wrong===value?' phone-key-wrong':'')+(phase==='feedback'&&value===digit?' phone-key-correct':'')} disabled={phase!=='question'||paused} onClick={()=>choose(value)}>{reverse?phoneDigitWords[value]:value}</button>)}</GameChoices>
 </div>;
}
