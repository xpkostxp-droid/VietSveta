import {useEffect,useRef,useState} from 'react';
import {shuffledToneWords,tones,toneLabels,type Tone,type ToneWord} from '../content/toneWords';
import {createToneAudio} from '../domain/toneAudio';
import {createCountdownSound} from '../domain/countdownSound';
import {saveTimedAttempt,formatAnswerTime} from '../domain/answerTime';
import {updateGameRecord} from '../domain/gameRecord';
import {reportStudyAnswer} from '../domain/studyTelemetry';
import {useStudyActivity} from '../domain/useStudyActivity';
import {useScenicDepth} from '../domain/useScenicDepth';
import {GameRanking} from './GameRanking';
import {BackButton} from './BackButton';
import './SharedPlayLayout.css';
import './ToneGameScreen.css';
type Phase='intro'|'loading'|'countdown'|'question'|'feedback'|'result'|'error';
const GAME='listening-tones';
const LIMIT=5000;
function ToneSign({tone}:{tone:Tone}){
 const paths:Partial<Record<Tone,string>>={sac:'M35 58 L65 30',huyen:'M35 30 L65 58',hoi:'M37 34 C38 17 65 16 65 34 C65 46 48 45 48 59',nga:'M23 47 C40 20 58 69 77 38'};
 return <svg viewBox="0 0 100 100" aria-hidden="true">{paths[tone]&&<path d={paths[tone]} />}{tone==='nang'&&<circle cx="50" cy="72" r="6"/>}</svg>;
}
export default function ToneGameScreen({onBack}:{onBack:()=>void}){
 const [phase,setPhase]=useState<Phase>('intro'),[round,setRound]=useState<ToneWord[]>([]),[position,setPosition]=useState(0);
 const [count,setCount]=useState(4),[remaining,setRemaining]=useState(LIMIT),[selected,setSelected]=useState<Tone|null>(null),[paused,setPaused]=useState(false);
 const [score,setScore]=useState(0),[time,setTime]=useState(0);
 const player=useRef<ReturnType<typeof createToneAudio>>(),sound=useRef<ReturnType<typeof createCountdownSound>>();
 const run=useRef(0),locked=useRef(true),deadline=useRef(0),frozen=useRef(LIMIT),pausedRef=useRef(false);
 const totals=useRef({correct:0,correctMs:0,allMs:0}),alive=useRef(true),resolveRef=useRef<(tone:Tone|null)=>void>(()=>{});
 const active=['countdown','question','feedback'].includes(phase);
 useScenicDepth(active?4:3);useStudyActivity('games',GAME,active&&!paused);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;run.current++;player.current?.close();player.current=undefined;sound.current?.close();sound.current=undefined;};},[]);
 function pause(){
  if(pausedRef.current)return;
  if(phase==='question'&&!locked.current)frozen.current=Math.max(0,deadline.current-Date.now());
  pausedRef.current=true;setPaused(true);player.current?.stop();sound.current?.stop();
 }
 useEffect(()=>{function hide(){if(document.hidden&&active)pause();}document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);},[phase,active]);
 async function start(){
  const id=++run.current;locked.current=true;totals.current={correct:0,correctMs:0,allMs:0};setScore(0);setTime(0);setPaused(false);pausedRef.current=false;setPhase('loading');
  try{
   player.current??=createToneAudio();sound.current??=createCountdownSound();sound.current.unlock();
   await player.current.unlock();await player.current.load();
   if(!alive.current||run.current!==id)return;
   setRound(shuffledToneWords());setPosition(0);setSelected(null);setCount(4);frozen.current=LIMIT;setRemaining(LIMIT);setPhase('countdown');
   if(document.hidden){pausedRef.current=true;setPaused(true);}
  }catch{if(alive.current&&run.current===id)setPhase('error');}
 }
 function finish(){
  const t=totals.current;updateGameRecord(GAME,{correct:t.correct,correctTimeMs:t.correctMs});
  saveTimedAttempt({game:GAME,correct:t.correct,total:30,answerTimeMs:t.allMs,correctTimeMs:t.correctMs,completed:true});
  setTime(t.correctMs);setPhase('result');
 }
 function resolve(tone:Tone|null){
  if(phase!=='question'||locked.current||pausedRef.current)return;
  locked.current=true;player.current?.stop();sound.current?.stop();
  const left=Math.max(0,deadline.current-Date.now()),elapsed=LIMIT-left,word=round[position];
  const timeout=tone===null||left===0,correct=!timeout&&tone===word.tone;
  totals.current.allMs+=elapsed;if(correct){totals.current.correct++;totals.current.correctMs+=elapsed;}
  reportStudyAnswer({topic:GAME,vi:word.vi,ru:word.ru,direction:'listening',chosen:timeout?null:tone,result:correct?'correct':timeout?'timeout':'wrong',elapsed_ms:elapsed});
  setSelected(timeout?null:tone);setScore(totals.current.correct);setTime(totals.current.correctMs);setPhase('feedback');
  if(!correct)sound.current?.explode();
 }
 resolveRef.current=resolve;
 useEffect(()=>{
  if(paused)return;
  if(phase==='countdown'){
   if(count<4)sound.current?.beep();
   const timer=window.setTimeout(()=>{if(pausedRef.current)return;if(count===1){frozen.current=LIMIT;setPhase('question');}else setCount(c=>c-1);},count===4?600:1000);
   return()=>clearTimeout(timer);
  }
  if(phase==='question'){
   if(pausedRef.current)return;
   try{player.current!.playTwice(round[position].id);}catch{locked.current=true;setPhase('error');return;}
   deadline.current=Date.now()+frozen.current;locked.current=false;let last=Math.ceil(frozen.current/1000);
   const tick=()=>{if(pausedRef.current||locked.current)return;const left=Math.max(0,deadline.current-Date.now());setRemaining(left);const second=Math.ceil(left/1000);if(second>0&&second<=3&&second<last)sound.current?.beep();last=second;if(!left)resolveRef.current(null);};
   tick();const timer=window.setInterval(tick,40);return()=>{clearInterval(timer);player.current?.stop();};
  }
  if(phase==='feedback'){
   const timer=window.setTimeout(()=>{if(pausedRef.current)return;if(position===29)finish();else{setPosition(p=>p+1);setSelected(null);frozen.current=LIMIT;setRemaining(LIMIT);setPhase('question');}},1100);
   return()=>clearTimeout(timer);
  }
 },[phase,count,position,paused]);
 async function resume(){try{await player.current?.unlock();sound.current?.unlock();if(document.hidden)return;pausedRef.current=false;setPaused(false);}catch{setPhase('error');}}
 if(phase==='intro'||phase==='result')return <div className="screen ranking-screen"><BackButton onClick={onBack} label="К аудированию"/><h1 className="screen-title">🎧 Угадай тон</h1><GameRanking game={GAME} total={30} onStart={()=>void start()} startLabel={phase==='result'?'Играть ещё':'Начать'} result={phase==='result'?{correct:score,time}:undefined}><p>30 слов · 5 секунд на ответ. Каждое слово звучит дважды. Выбери знак тона.</p></GameRanking></div>;
 if(phase==='loading'||phase==='error')return <div className="screen"><BackButton onClick={onBack} label="К аудированию"/><h1 className="screen-title">🎧 Угадай тон</h1><p role="status">{phase==='loading'?'Подготавливаем звук…':'Не удалось включить записи. Проверь интернет и звук.'}</p>{phase==='error'&&<button className="big-button" onClick={()=>void start()}>Попробовать снова</button>}</div>;
 const word=round[position],feedback=phase==='feedback';
 return <div className="screen market-screen harvest-screen harvest-playing tone-screen">
  <BackButton onClick={onBack} label="К аудированию"/><h1 className="screen-title">🎧 Угадай тон</h1>
  <div className="harvest-play-header"><span>Задание {position+1}/30</span><span>⏱ {formatAnswerTime(time)} · ✓ {score}</span></div>
  <div className="harvest-question-bar"><span>Какой тон звучит?</span><div className={'harvest-countdown'+(remaining<=3000?' harvest-countdown-urgent':'')} role="progressbar" aria-label="Время на ответ" aria-valuemin={0} aria-valuemax={5} aria-valuenow={phase==='question'?Math.ceil(remaining/1000):0}><svg viewBox="0 0 100 100" aria-hidden="true"><circle className="harvest-ring-track" cx="50" cy="50" r="43"/><circle className="harvest-ring-progress" cx="50" cy="50" r="43" pathLength="100" strokeDasharray="100" strokeDashoffset={100-(phase==='question'?remaining/LIMIT*100:0)}/></svg><span className="harvest-countdown-number">{paused?'Ⅱ':phase==='countdown'?'5':feedback?(selected===word.tone?'✓':'0'):Math.ceil(remaining/1000)}</span></div></div>
  <div className="harvest-play-block">
   <div className="tone-display" aria-live="polite">{phase==='countdown'?<strong className="tone-count">{count===4?'Начинаем!':count}</strong>:feedback?<><strong className="tone-word">{word.vi}</strong><span className="tone-translation">{word.ru}</span></>:<><svg className="tone-speaker" viewBox="0 0 100 100" aria-hidden="true"><path d="M15 38 H30 L53 18 V82 L30 62 H15 Z"/><path className="tone-waves" d="M65 34 Q79 50 65 66 M77 22 Q100 50 77 78"/></svg><span>Слушай слово</span></>}</div>
   <div className="blitz-options harvest-options tone-options">{tones.map(tone=><button key={tone} aria-label={toneLabels[tone]} className={'blitz-option'+(feedback&&tone===word.tone?' blitz-correct':feedback&&tone===selected?' blitz-wrong':'')} disabled={phase!=='question'||paused} onClick={()=>resolve(tone)}><ToneSign tone={tone}/></button>)}</div>
   {paused&&<div className="harvest-pause-overlay"><h2>Пауза ⏸</h2><button className="big-button" onClick={()=>void resume()}>Продолжить</button></div>}
  </div>
 </div>;
}
