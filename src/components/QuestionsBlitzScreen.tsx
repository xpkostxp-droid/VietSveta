import { BalanceScales } from './BalanceScales';
import { useEffect, useRef, useState } from 'react';
import { BackButton } from './BackButton';
import { speakVietnamese, stopSpeaking } from '../domain/speech';
import './QuestionsBlitzScreen.css';

const cards: [string,string][] = [
 ['Ai','Кто'],['Gì','Что'],['Ở đâu','Где'],['Đi đâu','Куда'],
 ['Từ đâu','Откуда'],['Khi nào','Когда'],['Ngày nào','В какой день'],
 ['Mấy giờ','Во сколько'],['Tại sao','Почему'],['Thế nào','Как'],
 ['Bao nhiêu','Сколько (общее количество)'],['Mấy','Сколько (небольшое количество)'],
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

const bestKey='vietsveta.questions.blitz.best';
export function QuestionsBlitzScreen({onBack}:{onBack:()=>void}){
 const [started,setStarted]=useState(false);
 const [queue,setQueue]=useState<number[]>([]);
 const [blocks,setBlocks]=useState<number[]>([]);
 const [seconds,setSeconds]=useState(5);
 const [failed,setFailed]=useState<'wrong'|'timeout'|null>(null);
 const [feedback,setFeedback]=useState(false);
 const [best,setBest]=useState(()=>Number(localStorage.getItem(bestKey)||0));
 const [retry,setRetry]=useState<number|null>(null);
 const deadline=useRef<number|null>(null);
 const pending=useRef<ReturnType<typeof setTimeout>|null>(null);
 const locked=useRef(false);
 const audio=useRef<AudioContext|null>(null);
 const lastBeep=useRef<number|null>(null);
 const sound=(kind:'beep'|'crash',count=3)=>{const ctx=audio.current;if(!ctx||ctx.state!=='running')return;try{if(kind==='crash')crash(ctx);else beep(ctx,count===1?660:count===2?740:820);}catch{}};
 const q=queue[0];
 const [reverse,setReverse]=useState(false);
 const [heavy,setHeavy]=useState<'left'|'right'>('right');
 const choices=useRef<number[]>([]);
 const [options,setOptions]=useState<number[]>([]);
 const setQuestion=(list:number[],direction:boolean)=>{
  setReverse(direction); setHeavy(direction ? 'left' : 'right');
  const correct=list[0];
  if(correct===undefined)return;
  const others=shuffle(cards.map((_,i)=>i).filter(i=>i!==correct&&cards[i][direction?1:0]!==cards[correct][direction?1:0])).slice(0,2);
  const answerOptions=shuffle([correct,...others]);
  choices.current=answerOptions;
  setOptions(answerOptions);
  setQueue(list);
  setSeconds(5);
  lastBeep.current=null;
  deadline.current=Date.now()+5000;
  locked.current=false;
 };
 const start=()=>{
  try{if(!audio.current)audio.current=new AudioContext();void audio.current.resume();}catch{}
  if(pending.current)clearTimeout(pending.current);
  stopSpeaking();locked.current=false;setFailed(null);setFeedback(false);setBlocks([]);setStarted(true);
  let all=shuffle(cards.map((_,i)=>i));
  if(retry!==null){all=all.filter(i=>i!==retry);all.unshift(retry);}
  setRetry(null);setQuestion(all,false);
 };
 const lose=(reason:'wrong'|'timeout')=>{
  if(locked.current)return;
  locked.current=true;deadline.current=null;setRetry(q);setFailed(reason);setFeedback(false);stopSpeaking();sound('crash');
 };
 const answer=(index:number)=>{
  if(locked.current||failed||!started)return;
  if(deadline.current !== null && Date.now() >= deadline.current){lose('timeout');return;}
  if(index!==q){lose('wrong');return;}
  locked.current=true;deadline.current=null;setFeedback(true);
  speakVietnamese(cards[q][0]);
  const updated=[...blocks,q];setBlocks(updated);
  if(updated.length>best){setBest(updated.length);localStorage.setItem(bestKey,String(updated.length));}
  pending.current=setTimeout(()=>{
   setFeedback(false);
   const remaining=queue.slice(1);
   if(remaining.length===0){
    let again=shuffle(cards.map((_,i)=>i));
    if(again[0]===q){again=[...again.slice(1),again[0]];}
    setQuestion(again,updated.length%2===1);
   }else setQuestion(remaining,updated.length%2===1);
  },1200);
 };
 useEffect(()=>{
  if(!started||failed)return;
  const id=setInterval(()=>{
   if(deadline.current===null||locked.current)return;
   const left=Math.max(0,(deadline.current-Date.now())/1000);
   setSeconds(left);
   const digit=Math.ceil(left);
   if(digit>=1&&digit<=3&&lastBeep.current!==digit){lastBeep.current=digit;sound('beep',digit);}
   if(left<=0)lose('timeout');
  },50);
  return()=>clearInterval(id);
 },[started,failed,q]);
 useEffect(()=>()=>{if(pending.current)clearTimeout(pending.current);stopSpeaking();void audio.current?.close();},[]);
 const promptText = !started ? '' : failed ? (failed === 'timeout' ? 'Время вышло!' : 'Ошибка!') : cards[q][reverse ? 0 : 1];
 const promptParts = promptText.match(/^(.*?)\s*\((.*?)\)$/);
 return <div className={'screen qs-screen' + (started ? ' qs-playing' : '')}>
  <div className="qs-topbar"><BackButton onClick={started?()=>{deadline.current=null;if(pending.current)clearTimeout(pending.current);stopSpeaking();setStarted(false);}:onBack} label={started?'Назад':'К играм'}/>{started&&<div className="qs-score"><span>⚖️ {blocks.length}</span><span>🏆 {best}</span></div>}</div>
  {!started&&<h1 className="screen-title">⚖️ Суперблиц · Вопросы</h1>}
  {!started?<div className="qs-intro"><p>24 вопроса · 5 секунд на ответ · русский и вьетнамский чередуются.</p><p>Правильный ответ уравновешивает чаши. Ошибка или время вышло — перевес, и кубики падают. Трудный вопрос появится первым при новой попытке.</p><p>🏆 Рекорд: {best}</p><button className="big-button" onClick={start}>⚡ Начать суперблиц</button></div>:<>
   <div className="qs-question-row">
    <div className="qs-prompt"><small>{failed?'Игра окончена':reverse?'Выбери перевод':'Переведи на вьетнамский'}</small><strong>{promptParts ? promptParts[1] : promptText}</strong>{promptParts && <span className="qs-prompt-note">{promptParts[2]}</span>}</div>

   </div>
   <div className="qs-balance-scene"><BalanceScales heavy={heavy} outcome={failed?'failed':feedback?'success':'question'} turn={blocks.length} label={feedback ? cards[q][0] : undefined}/></div>
   <div className="qs-message" aria-live="polite">{failed?'Перевес! Попробуй ещё раз':feedback?'+1 · Равновесие!':'\u00a0'}</div>
   <div className="qs-controls">
   {failed?<div className="qs-end"><p>Правильно: <b>{cards[q][0]}</b> — {cards[q][1]}</p><p>Очки: {blocks.length} · Рекорд: {best}</p><button className="big-button" onClick={start}>Играть снова</button></div>:<div className="qs-answers">{options.map(i=><button key={i} className={'qs-answer'+(feedback&&i===q?' qs-correct':'')} disabled={feedback} onClick={()=>answer(i)}>{cards[i][reverse?1:0]}</button>)}</div>}
   </div>
   <div className="qs-timer-bottom"><div className={'qs-circle'+(seconds<=3?' qs-circle-urgent':'')} role="progressbar" aria-label="Время на ответ" aria-valuemin={0} aria-valuemax={5} aria-valuenow={failed?0:Math.ceil(seconds)}>
      <svg viewBox="0 0 100 100" aria-hidden="true"><circle className="qs-ring-bg" cx="50" cy="50" r="43"/><circle className="qs-ring" cx="50" cy="50" r="43" pathLength="100" strokeDasharray="100" strokeDashoffset={100-(failed?0:seconds/5*100)}/></svg><span>{failed?'0':feedback?'✓':Math.ceil(seconds)}</span>
    </div></div>
  </>}
 </div>;
}
