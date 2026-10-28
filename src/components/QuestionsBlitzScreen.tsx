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
 const q=queue[0];
 const reverse=blocks.length%2===1;
 const choices=useRef<number[]>([]);
 const [options,setOptions]=useState<number[]>([]);
 const setQuestion=(list:number[],direction:boolean)=>{
  const correct=list[0];
  if(correct===undefined)return;
  const others=shuffle(cards.map((_,i)=>i).filter(i=>i!==correct&&cards[i][direction?1:0]!==cards[correct][direction?1:0])).slice(0,2);
  const answerOptions=shuffle([correct,...others]);
  choices.current=answerOptions;
  setOptions(answerOptions);
  setQueue(list);
  setSeconds(5);
  deadline.current=Date.now()+5000;
  locked.current=false;
 };
 const start=()=>{
  if(pending.current)clearTimeout(pending.current);
  stopSpeaking();locked.current=false;setFailed(null);setFeedback(false);setBlocks([]);setStarted(true);
  let all=shuffle(cards.map((_,i)=>i));
  if(retry!==null){all=all.filter(i=>i!==retry);all.unshift(retry);}
  setRetry(null);setQuestion(all,false);
 };
 const lose=(reason:'wrong'|'timeout')=>{
  if(locked.current)return;
  locked.current=true;deadline.current=null;setRetry(q);setFailed(reason);setFeedback(false);stopSpeaking();
 };
 const answer=(index:number)=>{
  if(locked.current||failed||!started)return;
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
  },850);
 };
 useEffect(()=>{
  if(!started||failed)return;
  const id=setInterval(()=>{
   if(deadline.current===null||locked.current)return;
   const left=Math.max(0,(deadline.current-Date.now())/1000);
   setSeconds(left);
   if(left<=0)lose('timeout');
  },50);
  return()=>clearInterval(id);
 },[started,failed,q]);
 useEffect(()=>()=>{if(pending.current)clearTimeout(pending.current);stopSpeaking();},[]);
 return <div className="screen qs-screen">
  <BackButton onClick={started?()=>{deadline.current=null;if(pending.current)clearTimeout(pending.current);stopSpeaking();setStarted(false);}:onBack} label={started?'К выбору игры':'К играм'}/>
  <h1 className="screen-title">🏗️ Суперблиц · Вопросы</h1>
  {!started?<div className="qs-intro"><p>24 вопроса · 5 секунд на ответ · русский и вьетнамский чередуются. Каждый вопрос — один раз за круг.</p><p>При ошибке башня рушится, а трудный вопрос появится первым в следующей игре.</p><p>🏆 Рекорд: {best} кубиков</p><button className="big-button" onClick={start}>⚡ Начать суперблиц</button></div>:<>
   <div className="qs-stats"><span>🧱 {blocks.length}</span><span>🏆 {best}</span></div>
   {!failed&&<div className="qs-timer"><strong>{Math.ceil(seconds)}</strong><div className="qs-timer-track"><div className="qs-timer-fill" style={{width:(seconds/5*100)+'%'}}/></div></div>}
   <div className="qs-prompt"><small>{failed?'Игра окончена':reverse?'Выбери перевод':'Переведи на вьетнамский'}</small><strong>{failed?(failed==='timeout'?'⏰ Время вышло!':'💥 Ошибка!'):cards[q][reverse?0:1]}</strong></div>
   <div className="qs-scene"><span className="qs-cloud">☁️</span><div className={'qs-stack'+(failed?' qs-collapse':'')}>{blocks.slice(-9).reverse().map((item,i)=><div key={blocks.length-i} className={'qs-block qs-color-'+(item%5)+(i===0&&feedback?' qs-new':'')}>{cards[item][0]}</div>)}<div className="qs-ground"/></div></div>
   {failed?<div className="qs-end"><p>Построено: {blocks.length} кубиков · Рекорд: {best}</p><p>Следующая игра начнётся с вопроса: <b>{cards[q][0]}</b></p><button className="big-button" onClick={start}>Играть снова</button></div>:<div className="qs-answers">{options.map(i=><button key={i} className={'qs-answer'+(feedback&&i===q?' qs-correct':'')} disabled={feedback} onClick={()=>answer(i)}>{cards[i][reverse?1:0]}</button>)}</div>}
  </>}
 </div>;
}
