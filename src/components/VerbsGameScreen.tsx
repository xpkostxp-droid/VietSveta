import { useEffect, useRef, useState } from 'react';
import { BackButton } from './BackButton';
import { GameRanking } from './GameRanking';
import { DragonWordScene } from './DragonWordScene';
import { useFiveSecondQuestionTimer } from '../beginner/components/useFiveSecondQuestionTimer';
import { verbGameWords, verbGameTasks, verbGameOptions, verbPrompt, type VerbTask } from '../content/verbGame';
import { createDragonSounds } from '../domain/dragonSounds';
import { saveTimedAttempt } from '../domain/answerTime';
import { updateGameRecord } from '../domain/gameRecord';
import { stopSpeaking } from '../domain/speech';
import './AdjectiveTetris.css';
import './SharedPlayLayout.css';
import './VerbsGameScreen.css';
const GAME='lesson15-verbs';
const FEEDBACK_MS=2650;
type Round={tasks:VerbTask[];at:number;options:number[];phase:'question'|'feedback'|'end';chosen:number|null;success:boolean;correct:number;time:number;answerTime:number};
export default function VerbsGameScreen({onBack}:{onBack:()=>void}){
 const [round,setRound]=useState<Round|null>(null),[feedbackPaused,setFeedbackPaused]=useState(false);
 const locked=useRef(false),saved=useRef(false),sounds=useRef<ReturnType<typeof createDragonSounds>|null>(null);
 const feedbackLeft=useRef(FEEDBACK_MS),speechDone=useRef(false),spokenQuestion=useRef<VerbTask|null>(null);
 const clock=useFiveSecondQuestionTimer(()=>answer(null),()=>{sounds.current?.stop();stopSpeaking();spokenQuestion.current=null});
 const task=round?.tasks[round.at];
 const paused=clock.paused||feedbackPaused;
 useEffect(()=>{sounds.current=createDragonSounds();void sounds.current.prepare();return()=>{sounds.current?.close();stopSpeaking()}},[]);
 function begin(){
  void sounds.current?.prepare();clock.ready();stopSpeaking();saved.current=false;locked.current=false;spokenQuestion.current=null;setFeedbackPaused(false);
  const tasks=verbGameTasks();setRound({tasks,at:0,options:verbGameOptions(tasks[0].word),phase:'question',chosen:null,success:false,correct:0,time:0,answerTime:0});clock.begin();
 }
 function answer(choice:number|null){
  if(!round||!task||round.phase!=='question'||locked.current||clock.isPaused())return;
  locked.current=true;const elapsed=clock.finish(),success=choice===task.word&&elapsed<5000;
  if(elapsed>=5000)choice=null;
  stopSpeaking();sounds.current?.stopVoice();feedbackLeft.current=FEEDBACK_MS;speechDone.current=false;
  sounds.current?.play(success?'success':'error');
  setRound({...round,phase:'feedback',chosen:choice,success,correct:round.correct+(success?1:0),time:round.time+(success?elapsed:0),answerTime:round.answerTime+elapsed});
 }
 useEffect(()=>{
  if(round?.phase!=='question'||!task?.reverse||paused||spokenQuestion.current===task)return;
  spokenQuestion.current=task;sounds.current?.speak(task.word);
 },[round?.phase,task,paused]);
 useEffect(()=>{
  if(round?.phase!=='feedback'||paused)return;
  const started=performance.now(),remaining=feedbackLeft.current;
  const speakAt=1100-(FEEDBACK_MS-remaining);
  const shouldSpeak=round.success&&!round.tasks[round.at].reverse;
  const voice=!shouldSpeak||speechDone.current?undefined:setTimeout(()=>{speechDone.current=true;sounds.current?.speak(round.tasks[round.at].word)},Math.max(0,speakAt));
  const timer=setTimeout(()=>{
   sounds.current?.stop();stopSpeaking();
   if(round.at===round.tasks.length-1){setRound({...round,phase:'end'});return}
   const at=round.at+1;locked.current=false;
   setRound({...round,at,options:verbGameOptions(round.tasks[at].word),phase:'question',chosen:null});clock.begin();
  },remaining);
  return()=>{clearTimeout(timer);clearTimeout(voice);feedbackLeft.current=Math.max(0,remaining-(performance.now()-started))};
 },[round,paused]);
 useEffect(()=>{
  const hide=()=>{if(document.hidden&&round?.phase==='feedback'){setFeedbackPaused(true);sounds.current?.stop();stopSpeaking()}};
  document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);
 },[round]);
 useEffect(()=>{
  if(round?.phase!=='end'||saved.current)return;saved.current=true;
  updateGameRecord(GAME,{correct:round.correct,correctTimeMs:round.time});
  saveTimedAttempt({game:GAME,correct:round.correct,total:round.tasks.length,answerTimeMs:round.answerTime,correctTimeMs:round.time,completed:true});
 },[round]);
 const back=()=>{sounds.current?.stop();stopSpeaking();clock.stop();onBack()};
 const resume=()=>{if(document.hidden)return;void sounds.current?.prepare();clock.resume();setFeedbackPaused(false)};
 if(!round||round.phase==='end')return <div className="screen ranking-screen"><BackButton onClick={back} label="К играм"/><h1 className="screen-title">Глаголы</h1><GameRanking game={GAME} total={52} onStart={begin} startAtBottom startLabel={round?'Играть ещё':'Начать'} result={round?{correct:round.correct,time:round.time}:undefined}/></div>;
 const current=task!,word=verbPrompt(current),next=round.tasks[round.at+1];
 return <div className="screen at-screen at-playing verbs-playing">
  <div className="at-top"><BackButton onClick={back} label="Назад"/><span>{round.at+1}/52 · ✓ {round.correct}</span><div className={'at-clock'+(clock.remaining<=3000?' at-urgent':'')} aria-label="Время на ответ"><svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="25" className="at-track"/><circle cx="30" cy="30" r="25" pathLength="100" strokeDasharray="100" strokeDashoffset={100-clock.remaining/50}/></svg><strong>{paused?'Ⅱ':round.phase==='feedback'?(round.success?'✓':'×'):Math.ceil(clock.remaining/1000)}</strong></div></div>
  <div className="verbs-play-block">
   <DragonWordScene key={round.at} word={word} nextWord={next?verbPrompt(next):word} outcome={round.phase==='question'?'question':round.success?'success':'error'} paused={paused}/>
   <h1 className="verbs-prompt" lang={current.reverse?'vi':'ru'}>{word}</h1>
   <div className="at-options">{round.options.map(i=><button key={i} lang={current.reverse?'ru':'vi'} disabled={round.phase!=='question'||paused} className={round.phase==='feedback'?(i===current.word?'at-right':i===round.chosen?'at-wrong':''):''} onClick={()=>answer(i)}>{verbGameWords[i][current.reverse?1:0]}</button>)}</div>
  </div>
  {paused&&<div className="at-pause"><h2>Пауза</h2><button className="big-button" onClick={resume}>Продолжить</button></div>}
 </div>;
}
