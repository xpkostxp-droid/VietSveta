import { RopeWordScene } from './RopeWordScene';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { adjectiveSets, adjectiveTasks, shuffleItems, landWordBlock, type WordBlock } from '../content/adjectiveSets';
import { BackButton } from './BackButton';
import { createCountdownSound } from '../domain/countdownSound';
import { speakVietnamese,stopSpeaking } from '../domain/speech';
import './AdjectiveTetris.css';
type Task={word:number;reverse:boolean};
type Round={tasks:Task[];at:number;options:number[];board:WordBlock[];correct:number;time:number;lines:number;phase:'question'|'feedback'|'end';success:boolean;chosen:number|null;clearing:boolean};
export function AdjectiveTetris({onBack,variant='tetris'}:{onBack:()=>void;variant?:'tetris'|'rope'}){
 const rope=variant==='rope';
 const set=adjectiveSets[rope?1:0];
 const words=set.words;
 const choices=(word:number)=>shuffleItems([word,...shuffleItems(words.map((_,i)=>i).filter(i=>i!==word)).slice(0,2)]);
 const [revealed,setRevealed]=useState(false);
 const [round,setRound]=useState<Round|null>(null);
 const [left,setLeft]=useState(5000),[paused,setPaused]=useState(false);
 const deadline=useRef(0),frozen=useRef(5000),locked=useRef(false),pausedRef=useRef(false);
 const sound=useRef<ReturnType<typeof createCountdownSound>|null>(null),lastBeep=useRef(5);
 const task=round?.tasks[round.at];
 function begin(){
  sound.current??=createCountdownSound();sound.current.unlock();stopSpeaking();
  setRevealed(false);
  const tasks=adjectiveTasks(words.length);locked.current=false;pausedRef.current=false;setPaused(false);setLeft(5000);lastBeep.current=5;deadline.current=Date.now()+5000;
  setRound({tasks,at:0,options:choices(tasks[0].word),board:[],correct:0,time:0,lines:0,phase:'question',success:false,chosen:null,clearing:false});
 }
 function answer(choice:number|null){
  if(!round||!task||round.phase!=='question'||locked.current||pausedRef.current)return;
  locked.current=true;sound.current?.stop();
  const elapsed=Math.max(0,Math.min(5000,5000-(deadline.current-Date.now())));
  const success=choice===task.word&&Date.now()<deadline.current;
  const label=words[task.word][0];
  const landed=landWordBlock(round.board,{correct:success,label});
  setRevealed(!rope||success);
  if(!rope||success)speakVietnamese(label);
  setLeft(0);setRound({...round,chosen:choice,success,correct:round.correct+(success?1:0),time:round.time+(success?elapsed:0),lines:round.lines+(landed.clear?1:0),board:[...round.board,{correct:success,label}],clearing:landed.clear,phase:'feedback'});
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
   },rope&&!round.success?2000:1300);return()=>clearTimeout(id);
  }
 },[round,paused]);
 useEffect(()=>{
  if(!rope||!round||round.phase!=='feedback'||round.success||paused)return;
  const id=setTimeout(()=>{setRevealed(true);speakVietnamese(words[round.tasks[round.at].word][0]);},700);
  const impact=setTimeout(()=>sound.current?.explode(),350);
  return()=>{clearTimeout(id);clearTimeout(impact);};
 },[round,rope,paused]);
 useEffect(()=>{
  const hide=()=>{if(document.hidden&&round&&round.phase!=='end'&&!pausedRef.current){frozen.current=Math.max(0,deadline.current-Date.now());pausedRef.current=true;setPaused(true);sound.current?.stop();stopSpeaking();}};
  document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);
 },[round]);
 useEffect(()=>()=>{stopSpeaking();sound.current?.close();},[]);
 const resume=()=>{if(document.hidden)return;deadline.current=Date.now()+frozen.current;sound.current?.unlock();pausedRef.current=false;setPaused(false);};
 if(!round)return <div className="screen at-screen"><BackButton onClick={onBack} label="К наборам"/><p className="at-test">🧪 Тест · только для администратора</p><h1>{rope?'Удержи слово':'Тетрис прилагательных'}</h1><h2>{set.title}</h2><p>18 слов · 36 заданий · 5 секунд на ответ</p><div className="at-instructions">{rope?<><p>Табличка со словом качается на тросах. Выбери перевод — и спаси слово!</p><p>Верный ответ поднимет табличку. Ошибка или время вышло — тросы оборвутся, а затем появится правильный перевод. Игра продолжается до конца.</p></>:<><p>Выбери перевод из трёх вариантов. Правильный ответ — цветной кубик, ошибка — серый.</p><p>Собери ряд из пяти цветных кубиков — он исчезнет! После ошибки игра продолжается до конца.</p></>}</div><button className="big-button" onClick={begin}>Начать тест</button><p className="at-note">Результат этой игры не сохраняется и не участвует в рейтинге.</p></div>;
 if(round.phase==='end')return <div className="screen at-screen"><BackButton onClick={onBack} label="К наборам"/><p className="at-test">🧪 Тест завершён</p><h1>Раунд закончен!</h1><div className="at-summary"><strong>{round.correct} из {round.tasks.length}</strong>{!rope&&<p>Собрано рядов: {round.lines}</p>}<p>Время правильных ответов: {(round.time/1000).toFixed(2).replace('.',',')} сек</p></div><button className="big-button" onClick={begin}>Попробовать ещё</button><p className="at-note">Тестовый результат · без сохранения и рейтинга</p></div>;
 const current=task!;const row=5-Math.floor(round.board.length/5),col=round.board.length%5;
 return <div className="screen at-screen at-playing">
  <div className="at-top"><BackButton onClick={onBack} label="Назад"/><span>{round.at+1}/{round.tasks.length} · ✓ {round.correct}</span><div className={'at-clock'+(left<=3000?' at-urgent':'')} aria-label="Время на ответ"><svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="25" className="at-track"/><circle cx="30" cy="30" r="25" pathLength="100" strokeDasharray="100" strokeDashoffset={100-left/50}/></svg><strong>{paused?'Ⅱ':round.phase==='feedback'?(round.success?'✓':'×'):Math.ceil(left/1000)}</strong></div></div>
  {rope?<RopeWordScene key={round.at} word={words[current.word][current.reverse?0:1]} outcome={round.phase==='question'?'question':round.success?'success':'failed'} paused={paused}/>:<>
  <div className="at-board" aria-label="Поле тетриса">
   <div className="at-board-grid"/>
   {round.board.map((b,i)=><div key={i} className={'at-block'+(b.correct?' at-colored':' at-gray')+(round.clearing&&i>=round.board.length-5?' at-clearing':'')} style={{left:`${i%5*20}%`,top:`${(5-Math.floor(i/5))*100/6}%`}}><span>{b.correct?'✦':'×'}</span></div>)}
   {round.phase==='question'&&<div key={round.at} className="at-block at-falling" style={{left:`${col*20}%`,'--fall-distance':`${Math.max(0,row)*100}%`,animationPlayState:paused?'paused':'running'} as CSSProperties}><span>✦</span></div>}
   <div className="at-board-label">{round.lines} рядов</div>
  </div>
  </>}
  <div className="at-prompt"><small>{current.reverse?'Выбери перевод':'Переведи на вьетнамский'}</small><strong>{words[current.word][current.reverse?0:1]}</strong></div>
  <div className="at-feedback" aria-live="polite">{round.phase==='feedback'&&revealed?<><b>{round.success?(rope?'Слово спасено!':round.clearing?'Ряд собран! ✨':'Верно!'):'Правильный ответ:'}</b> {words[current.word][current.reverse?1:0]}</>:' '}</div>
  <div className="at-options">{round.options.map(i=><button key={i} disabled={round.phase!=='question'||paused} className={round.phase==='feedback'&&revealed?(i===current.word?'at-right':i===round.chosen?'at-wrong':''):''} onClick={()=>answer(i)}>{words[i][current.reverse?1:0]}</button>)}</div>
  <p className="at-note">🧪 Тест администратора · без рейтинга</p>
  {paused&&<div className="at-pause"><h2>Пауза</h2><button className="big-button" onClick={resume}>Продолжить</button></div>}
 </div>;
}
