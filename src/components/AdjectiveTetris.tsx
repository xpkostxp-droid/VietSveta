import {useStudyActivity} from '../domain/useStudyActivity';
import {reportStudyAnswer} from '../domain/studyTelemetry';
import { GameRanking } from './GameRanking';
import { saveTimedAttempt } from '../domain/answerTime';
import { updateGameRecord } from '../domain/gameRecord';
import { CannonWordScene } from './CannonWordScene';
import { RopeWordScene } from './RopeWordScene';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { adjectiveSets, adjectiveTasks, shuffleItems, landWordBlock, type WordBlock } from '../content/adjectiveSets';
import { BackButton } from './BackButton';
import { createCountdownSound } from '../domain/countdownSound';
import { speakVietnamese,stopSpeaking } from '../domain/speech';
import './AdjectiveTetris.css';
import './SharedPlayLayout.css';
type Task={word:number;reverse:boolean};
type Round={tasks:Task[];at:number;options:number[];board:WordBlock[];correct:number;time:number;answerTime:number;lines:number;phase:'question'|'feedback'|'end';success:boolean;chosen:number|null;clearing:boolean};
export function AdjectiveTetris({onBack,variant='tetris'}:{onBack:()=>void;variant?:'tetris'|'rope'|'cannon'}){
 const rope=variant==='rope';
 const cannon=variant==='cannon';
 const animated=rope||cannon;
 const set=adjectiveSets[cannon?2:rope?1:0];
 const words=set.words;
 const gameId=cannon?'adjectives-cannon':rope?'adjectives-rope':'adjectives-tetris';
 const attemptSaved=useRef(false);
 const choices=(word:number)=>shuffleItems([word,...shuffleItems(words.map((_,i)=>i).filter(i=>i!==word)).slice(0,2)]);
 const [revealed,setRevealed]=useState(false);
 const [round,setRound]=useState<Round|null>(null);
 const [left,setLeft]=useState(5000),[paused,setPaused]=useState(false);
 const deadline=useRef(0),frozen=useRef(5000),locked=useRef(false),pausedRef=useRef(false);
 const sound=useRef<ReturnType<typeof createCountdownSound>|null>(null),lastBeep=useRef(5);
 const task=round?.tasks[round.at];
 useStudyActivity('games',gameId,!!round&&round.phase!=='end'&&!paused);
 function begin(){
  attemptSaved.current=false;
  sound.current??=createCountdownSound();sound.current.unlock();stopSpeaking();
  setRevealed(false);
  const tasks=adjectiveTasks(words.length);locked.current=false;pausedRef.current=false;setPaused(false);setLeft(5000);lastBeep.current=5;deadline.current=Date.now()+5000;
  setRound({tasks,at:0,options:choices(tasks[0].word),board:[],correct:0,time:0,answerTime:0,lines:0,phase:'question',success:false,chosen:null,clearing:false});
 }
 function answer(choice:number|null){
  if(!round||!task||round.phase!=='question'||locked.current||pausedRef.current)return;
  locked.current=true;sound.current?.stop();
  const elapsed=Math.max(0,Math.min(5000,5000-(deadline.current-Date.now())));
  const success=choice===task.word&&Date.now()<deadline.current;
  reportStudyAnswer({topic:gameId,vi:words[task.word][0],ru:words[task.word][1],direction:task.reverse?'vi-ru':'ru-vi',chosen:choice===null?null:words[choice][task.reverse?1:0],result:success?'correct':elapsed>=5000?'timeout':'wrong',elapsed_ms:elapsed});
  const label=words[task.word][0];
  const landed=landWordBlock(round.board,{correct:success,label});
  setRevealed(!animated||success);
  if(!animated||success)speakVietnamese(label);
  setLeft(0);setRound({...round,chosen:choice,success,correct:round.correct+(success?1:0),time:round.time+(success?elapsed:0),answerTime:round.answerTime+elapsed,lines:round.lines+(landed.clear?1:0),board:[...round.board,{correct:success,label}],clearing:landed.clear,phase:'feedback'});
 }
 useEffect(()=>{
  if(!round||paused)return;
  if(round.phase==='question'){
   const id=setInterval(()=>{const ms=Math.max(0,deadline.current-Date.now());setLeft(ms);const sec=Math.ceil(ms/1000);if(sec>0&&sec<=3&&sec<lastBeep.current){sound.current?.beep();lastBeep.current=sec;}if(!ms)answer(null);},50);
   return()=>clearInterval(id);
  }
  if(round.phase==='feedback'){
   const id=setTimeout(()=>{
    const board=round.clearing?round.board.slice(0,-5):round.board.length>=30?round.board.slice(5):round.board;
    if(round.at===round.tasks.length-1){setRound({...round,board,phase:'end',clearing:false});return;}
    const at=round.at+1;locked.current=false;lastBeep.current=5;setRevealed(false);setLeft(5000);deadline.current=Date.now()+5000;
    setRound({...round,at,board,options:choices(round.tasks[at].word),phase:'question',clearing:false,chosen:null});
   },animated&&!round.success?2000:1300);return()=>clearTimeout(id);
  }
 },[round,paused]);
 useEffect(()=>{
  if(!animated||!round||round.phase!=='feedback'||round.success||paused)return;
  const id=setTimeout(()=>{setRevealed(true);speakVietnamese(words[round.tasks[round.at].word][0]);},700);
  const impact=setTimeout(()=>sound.current?.explode(),350);
  const rebound=cannon?setTimeout(()=>sound.current?.rebound?.(),1400):undefined;
  return()=>{clearTimeout(id);clearTimeout(impact);if(rebound)clearTimeout(rebound);};
 },[round,animated,paused]);
 useEffect(()=>{
  const hide=()=>{if(document.hidden&&round&&round.phase!=='end'&&!pausedRef.current){frozen.current=Math.max(0,deadline.current-Date.now());pausedRef.current=true;setPaused(true);sound.current?.stop();stopSpeaking();}};
  document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);
 },[round]);
 useEffect(()=>()=>{stopSpeaking();sound.current?.close();},[]);
 const resume=()=>{if(document.hidden)return;deadline.current=Date.now()+frozen.current;sound.current?.unlock();pausedRef.current=false;setPaused(false);};
 useEffect(()=>{
  if(round?.phase!=='end'||attemptSaved.current)return;
  attemptSaved.current=true;
  updateGameRecord(gameId,{correct:round.correct,correctTimeMs:round.time});
  saveTimedAttempt({game:gameId,correct:round.correct,total:round.tasks.length,answerTimeMs:round.answerTime,correctTimeMs:round.time,completed:true});
 },[round,gameId]);
 if(!round||round.phase==='end')return <div className="screen ranking-screen"><BackButton onClick={onBack} label="К наборам"/><h1 className="screen-title">{set.title}</h1><GameRanking game={gameId} total={words.length*2} onStart={begin} startLabel={round?'Играть ещё':'Начать'} result={round?{correct:round.correct,time:round.time}:undefined}/></div>;
 const current=task!;const row=5-Math.floor(round.board.length/5),col=round.board.length%5;
 return <div className={'screen at-screen at-playing'+(animated?' rope-playing':'')}>
  <div className="at-top"><BackButton onClick={onBack} label="Назад"/><span>{round.at+1}/{round.tasks.length} · ✓ {round.correct}</span><div className={'at-clock'+(left<=3000?' at-urgent':'')} aria-label="Время на ответ"><svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="25" className="at-track"/><circle cx="30" cy="30" r="25" pathLength="100" strokeDasharray="100" strokeDashoffset={100-left/50}/></svg><strong>{paused?'Ⅱ':round.phase==='feedback'?(round.success?'✓':'×'):Math.ceil(left/1000)}</strong></div></div>
  {cannon?<CannonWordScene key={round.at} word={words[current.word][current.reverse?0:1]} outcome={round.phase==='question'?'question':round.success?'success':'failed'} paused={paused} progress={1-left/5000}/>:rope?<RopeWordScene key={round.at} word={words[current.word][current.reverse?0:1]} outcome={round.phase==='question'?'question':round.success?'success':'failed'} paused={paused}/>:<>
  <div className="at-board" aria-label="Поле тетриса">
   <div className="at-board-grid"/>
   {round.board.map((b,i)=><div key={i} className={'at-block'+(b.correct?' at-colored':' at-gray')+(round.clearing&&i>=round.board.length-5?' at-clearing':'')} style={{left:`${i%5*20}%`,top:`${(5-Math.floor(i/5))*100/6}%`}}><span>{b.correct?'✦':'×'}</span></div>)}
   {round.phase==='question'&&<div key={round.at} className="at-block at-falling" style={{left:`${col*20}%`,'--fall-distance':`${Math.max(0,row)*100}%`,animationPlayState:paused?'paused':'running'} as CSSProperties}><span>✦</span></div>}
   <div className="at-board-label">{round.lines} рядов</div>
  </div>
  </>}
  <div className={animated?'rope-instruction':'at-prompt'}><small>{'\u00a0'}</small>{!animated&&<strong>{words[current.word][current.reverse?0:1]}</strong>}</div>
  <div className="at-feedback" aria-live="polite">{'\u00a0'}</div>
  <div className="at-options">{round.options.map(i=><button key={i} disabled={round.phase!=='question'||paused} className={round.phase==='feedback'&&revealed?(i===current.word?'at-right':i===round.chosen?'at-wrong':''):''} onClick={()=>answer(i)}>{words[i][current.reverse?1:0]}</button>)}</div>
  {paused&&<div className="at-pause"><h2>Пауза</h2><button className="big-button" onClick={resume}>Продолжить</button></div>}
 </div>;
}
