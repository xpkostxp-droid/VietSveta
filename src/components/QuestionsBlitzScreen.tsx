import { GameRanking } from './GameRanking';
import { readGameRecord, updateGameRecord } from '../domain/gameRecord';
import { createAnswerClock, formatAnswerTime, saveTimedAttempt } from '../domain/answerTime';
import { basicQuestions } from '../content/basicQuestions';
import { BalanceScales } from './BalanceScales';
import { useEffect, useRef, useState } from 'react';
import { BackButton } from './BackButton';
import { speakVietnamese, stopSpeaking } from '../domain/speech';
import './QuestionsBlitzScreen.css';

export const superCards: [string,string][] = [
 ['Ai','Кто'],['Gì','Что'],['Ở đâu','Где'],['Đi đâu','Куда'],
 ['Từ đâu','Откуда'],['Khi nào','Когда'],['Ngày nào','В какой день'],
 ['Mấy giờ','Во сколько'],['Tại sao','Почему'],['Thế nào','Как'],
 ['Bao nhiêu','Сколько (13+)'],['Mấy','Сколько (1–12)'],
 ['Nào','Какой / который'],['Của ai','Чей'],['Với ai','С кем'],
 ['Cho ai','Кому / для кого'],['Bằng gì','Чем / с помощью чего'],
 ['Để làm gì','Зачем / для чего'],['Bao lâu','Как долго'],
 ['Bao xa','Как далеко'],['Bao lớn','Насколько большой'],
 ['Mấy lần','Сколько раз'],['... hay ...?','... или ...?'],
 ['... chưa?','Уже ...? / Ещё не ...?']
];
const shuffle=(items:number[])=>{const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;};

// Short synthesized sounds; no external audio files needed.
function beep(ctx:AudioContext,frequency:number){
 const now=ctx.currentTime;
 const oscillator=ctx.createOscillator();const volume=ctx.createGain();
 oscillator.type='sine';oscillator.frequency.value=frequency;
 volume.gain.setValueAtTime(0.0001,now);
 volume.gain.exponentialRampToValueAtTime(0.13,now+0.012);
 volume.gain.exponentialRampToValueAtTime(0.0001,now+0.13);
 oscillator.connect(volume).connect(ctx.destination);
 oscillator.start(now);oscillator.stop(now+0.14);
}
function crash(ctx:AudioContext){
 const duration=0.65;const sampleRate=ctx.sampleRate;
 const buffer=ctx.createBuffer(1,Math.floor(sampleRate*duration),sampleRate);
 const data=buffer.getChannelData(0);
 for(let i=0;i<data.length;i++){const t=i/sampleRate;data[i]=(Math.random()*2-1)*Math.exp(-7*t)*(0.65+0.35*Math.sin(t*95));}
 const source=ctx.createBufferSource();source.buffer=buffer;
 const low=ctx.createBiquadFilter();low.type='lowpass';low.frequency.value=1100;
 const gain=ctx.createGain();gain.gain.value=0.32;
 source.connect(low).connect(gain).connect(ctx.destination);source.start();
}

export function QuestionsBlitzScreen({onBack, variant = 'super'}:{onBack:()=>void; variant?: 'super' | 'basic'}){
 const basic = variant === 'basic';
 const cards = basic ? basicQuestions : superCards;
 const totalTasks = cards.length * 2;
 const bestKey = basic ? 'vietsveta.questions.basic15.best' : 'vietsveta.questions.blitz.best';
 const answerClock = useRef(createAnswerClock());
 const [answerTime, setAnswerTime] = useState(0);
 const correctTime = useRef(0);
 const finishedTime = useRef(0);
 const [showRanking,setShowRanking]=useState(false);
 const [completed,setCompleted]=useState(false);
 const [started,setStarted]=useState(false);
 const [queue,setQueue]=useState<number[]>([]);
 const [blocks,setBlocks]=useState<number[]>([]);
 const [seconds,setSeconds]=useState(5);
 const [failed,setFailed]=useState<'wrong'|'timeout'|null>(null);
 const [feedback,setFeedback]=useState(false);
 const gameId = basic ? 'questions-15' : 'questions-24';
 const [record,setRecord]=useState(()=>readGameRecord(gameId,bestKey));
 const best=record.correct;
 const recordText = best > 0 && record.correctTimeMs !== null ? `${best} из ${totalTasks} · ${(record.correctTimeMs / 1000).toFixed(2).replace('.', ',')} сек` : 'пока нет';
 const [retry,setRetry]=useState<number|null>(null);
 const deadline=useRef<number|null>(null);
 const pending=useRef<ReturnType<typeof setTimeout>|null>(null);
 const locked=useRef(false);
 const audio=useRef<AudioContext|null>(null);
 const lastBeep=useRef<number|null>(null);
 const sound=(kind:'beep'|'crash',count=3)=>{const ctx=audio.current;if(!ctx||ctx.state!=='running')return;try{if(kind==='crash')crash(ctx);else beep(ctx,count===1?660:count===2?740:820);}catch{}};
 const q=Math.floor(queue[0]/2);
 const [reverse,setReverse]=useState(false);
 const [heavy,setHeavy]=useState<'left'|'right'>('right');
 const choices=useRef<number[]>([]);
 const [options,setOptions]=useState<number[]>([]);
 const setQuestion=(list:number[])=>{
  const reversed = list[0] % 2 === 1;
  setReverse(reversed); setHeavy(reversed ? 'left' : 'right');
  const correct=Math.floor(list[0]/2);
  if(correct===undefined)return;
  const others=shuffle(cards.map((_,i)=>i).filter(i=>i!==correct&&cards[i][reversed?1:0]!==cards[correct][reversed?1:0])).slice(0,2);
  const answerOptions=shuffle([correct,...others]);
  choices.current=answerOptions;
  setOptions(answerOptions);
  setQueue(list);
  setSeconds(5);
  lastBeep.current=null;
  deadline.current=Date.now()+5000; answerClock.current.begin();
  locked.current=false;
 };
 const makeQueue=()=>{
  const base=shuffle(cards.map((_,i)=>i));
  return base.flatMap((p,i)=>[p*2,base[(i+Math.floor(cards.length/2))%base.length]*2+1]);
 };
 const start=()=>{
  setShowRanking(false);
  answerClock.current.reset(); setAnswerTime(0); correctTime.current=0; finishedTime.current=0;
  setCompleted(false);
  try{if(!audio.current)audio.current=new AudioContext();void audio.current.resume();}catch{}
  if(pending.current)clearTimeout(pending.current);
  stopSpeaking();locked.current=false;setFailed(null);setFeedback(false);setBlocks([]);setStarted(true);
  let all=makeQueue();
  if(retry!==null){const at=all.indexOf(retry);all=[...all.slice(at),...all.slice(0,at)];}
  setRetry(null);setQuestion(all);
 };
 const lose=(reason:'wrong'|'timeout')=>{
  if(locked.current)return;
  setAnswerTime(answerClock.current.finish());
  locked.current=true;deadline.current=null;setRetry(queue[0]);setFailed(reason);setFeedback(false);stopSpeaking();sound('crash');
 };
 const answer=(index:number)=>{
  if(locked.current||failed||!started)return;
  if(deadline.current !== null && Date.now() >= deadline.current){lose('timeout');return;}
  if(index!==q){lose('wrong');return;}
  const finished=answerClock.current.finish();
  correctTime.current += finished-finishedTime.current; finishedTime.current=finished; setAnswerTime(finished);
  locked.current=true;deadline.current=null;setFeedback(true);
  speakVietnamese(cards[q][0]);
  const updated=[...blocks,q];setBlocks(updated);
  setRecord(updateGameRecord(gameId,{correct:updated.length,correctTimeMs:correctTime.current},bestKey));
  pending.current=setTimeout(()=>{
   setFeedback(false);
   const remaining=queue.slice(1);
   if(remaining.length===0){setCompleted(true);deadline.current=null;return;}
   setQuestion(remaining);
  },1200);
 };
 useEffect(()=>{
  if(!started||failed||completed)return;
  const id=setInterval(()=>{
   if(deadline.current===null||locked.current)return;
   const left=Math.max(0,(deadline.current-Date.now())/1000);
   setSeconds(left); setAnswerTime(answerClock.current.value());
   const digit=Math.ceil(left);
   if(digit>=1&&digit<=3&&lastBeep.current!==digit){lastBeep.current=digit;sound('beep',digit);}
   if(left<=0)lose('timeout');
  },50);
  return()=>clearInterval(id);
 },[started,failed,completed,q]);
 useEffect(()=>()=>{if(pending.current)clearTimeout(pending.current);stopSpeaking();void audio.current?.close();},[]);
 useEffect(()=>{
  if(!started || (!failed && !completed)) return;
  saveTimedAttempt({game:basic?'questions-15':'questions-24',correct:blocks.length,total:totalTasks,answerTimeMs:answerClock.current.value(),correctTimeMs:correctTime.current,completed});
 },[failed,completed]);
 useEffect(()=>{
  if(!failed&&!completed)return;
  const timer=setTimeout(()=>setShowRanking(true),failed?1800:0);
  return()=>clearTimeout(timer);
 },[failed,completed]);
 if(!started||showRanking)return <div className="screen ranking-screen"><BackButton onClick={onBack} label="К играм"/><h1 className="screen-title">⚖️ {basic?'Блиц · 15 слов':'Суперблиц · 24 слова'}</h1>
  {!started&&<p>{cards.length} слов · {totalTasks} заданий · 5 секунд на ответ.<br/>Игра до первой ошибки.</p>}
  <GameRanking game={gameId} total={totalTasks} onStart={start} startLabel={showRanking?'Играть снова':basic?'⚡ Начать блиц':'⚡ Начать суперблиц'} result={showRanking?{correct:blocks.length,time:correctTime.current}:undefined}/>
 </div>;
 const promptText = !started ? '' : completed ? `Все ${totalTasks} заданий пройдены!` : failed ? '' : cards[q][reverse ? 0 : 1];
 const promptParts = promptText.match(/^(.*?)\s*\((.*?)\)$/);
 return <div className={'screen qs-screen' + (started ? ' qs-playing' : '')}>
  <div className="qs-topbar"><BackButton onClick={started?()=>{deadline.current=null;if(pending.current)clearTimeout(pending.current);stopSpeaking();setStarted(false);}:onBack} label={started?'Назад':'К играм'}/><p className="qs-total-time" aria-label="Общее время ответов">⏱ {formatAnswerTime(answerTime)}</p>{started&&<div className="qs-score"><span>⚖️ {blocks.length}/{totalTasks}</span><span>🏆 {best}</span></div>}</div>
  <>
   <div className="qs-timer-top"><div className={'qs-circle'+(seconds<=3?' qs-circle-urgent':'')} role="progressbar" aria-label="Время на ответ" aria-valuemin={0} aria-valuemax={5} aria-valuenow={failed||completed?0:Math.ceil(seconds)}>
      <svg viewBox="0 0 100 100" aria-hidden="true"><circle className="qs-ring-bg" cx="50" cy="50" r="43"/><circle className="qs-ring" cx="50" cy="50" r="43" pathLength="100" strokeDasharray="100" strokeDashoffset={100-(failed?0:seconds/5*100)}/></svg><span>{failed?'0':feedback||completed?'✓':Math.ceil(seconds)}</span>
    </div></div>
   <div className="qs-balance-scene"><BalanceScales heavy={heavy} outcome={failed?'failed':feedback?'success':'question'} labels={blocks.map(i => cards[i][0])}/></div>
   <div className="qs-message" aria-live="polite">{'\u00a0'}</div>
   <div className="qs-question-row">
    <div className="qs-prompt" data-direction={reverse?'vi-ru':'ru-vi'}><small>{'\u00a0'}</small><strong>{promptParts ? promptParts[1] : promptText}</strong>{promptParts && <span className="qs-prompt-note">{promptParts[2]}</span>}</div>

   </div>
   <div className="qs-controls">
   {completed?<div className="qs-end"><p>{totalTasks} из {totalTasks} — отлично! 🎉</p><p>Время правильных ответов: {formatAnswerTime(correctTime.current)}</p><button className="big-button" onClick={start}>Играть снова</button></div>:failed?<div className="qs-end"><p>Очки: {blocks.length} из {totalTasks} · Рекорд: {recordText}</p><p>Время правильных ответов: {formatAnswerTime(correctTime.current)}</p><button className="big-button" onClick={start}>Играть снова</button></div>:<div className="qs-answers">{options.map(i=><button key={i} className={'qs-answer'+(feedback&&i===q?' qs-correct':'')} disabled={feedback} onClick={()=>answer(i)}>{cards[i][reverse?1:0]}</button>)}</div>}
   </div>

  </>
 </div>;
}
