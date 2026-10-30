import {useEffect,useRef,useState} from 'react';
import {BackButton} from '../components/BackButton';
import {products} from '../content/marketProducts';
import {speakVietnamese,stopSpeaking} from '../domain/speech';
import {primeBattleSpeech} from '../battle/battleSpeech';
import {createNinjaGame,type NinjaTopic} from './ninjaEngine';
import {ninjaAsset,assignNinjaCharacters,type NinjaCharacter} from './ninjaCharacters';
import {createNinjaSound} from './ninjaSound';
import type {MemberGender} from '../domain/memberGender';
import {NinjaStage} from './NinjaStage';
import '../battle/BattleScreen.css';
import './NinjaScreen.css';
export function NinjaScreen({onBack,memberId='admin',testSetup}:{onBack:()=>void;memberId?:string;testSetup?:{topic:NinjaTopic;gender:MemberGender;sound:ReturnType<typeof createNinjaSound>}}){
 const opponent=testSetup?.gender==='woman'?'svetlana':testSetup?.gender==='man'?'admin':memberId;
 const [pair,setPair]=useState(()=>assignNinjaCharacters(memberId,opponent));
 const [topic,setTopic]=useState<NinjaTopic>(testSetup?.topic??'fruits'),[session,setSession]=useState(0),[playing,setPlaying]=useState(!!testSetup);
 const [sound]=useState(()=>testSetup?.sound??createNinjaSound());
 useEffect(()=>()=>{if(!testSetup)sound.close();stopSpeaking();},[sound]);
 const start=()=>{setPair(assignNinjaCharacters(memberId,opponent));sound.ready();primeBattleSpeech();setSession(n=>n+1);setPlaying(true);};
 if(playing)return <NinjaMatch key={session} topic={topic} human={pair.human} bot={pair.bot} sound={sound} onBack={()=>testSetup?onBack():setPlaying(false)} onReplay={start}/>;
 const count=Math.min(10,products.filter(p=>topic==='all'||p[3]===topic).length);
 return <div className="screen ninja-setup"><BackButton onClick={onBack} label="К играм"/><h1>🥷 Ниндзя</h1><p>Пробный батл с ботом</p>
  <label className="ninja-topic">Тема<select value={topic} onChange={e=>setTopic(e.target.value as NinjaTopic)}><option value="fruits">Фрукты</option><option value="vegetables">Овощи</option><option value="all">Фрукты и овощи</option></select></label>
  <p className="ninja-rules">Узнай предмет и выбери название на вьетнамском. Ошибся — у соперника остаётся время. {count} раундов по 5 секунд; при равном счёте играем до победы.</p>
  <button className="big-button" onClick={start}>Сыграть с ботом</button><small className="ninja-note">Тренировка · без рейтинга</small>
 </div>;
}
function NinjaMatch({topic,human,bot,sound,onBack,onReplay}:{topic:NinjaTopic;human:NinjaCharacter;bot:NinjaCharacter;sound:ReturnType<typeof createNinjaSound>;onBack:()=>void;onReplay:()=>void}){
 const [game]=useState(()=>createNinjaGame(topic)),[state,setState]=useState(()=>game.initial()),[now,setNow]=useState(Date.now),[paused,setPaused]=useState(false),[assetError,setAssetError]=useState(false),[assetsReady,setAssetsReady]=useState(false);
 const lastBeep=useRef(0);
 const heard=useRef(0),timeouts=useRef<ReturnType<typeof setTimeout>[]>([]),alive=useRef(true);
 // Start the countdown only after both animation sheets and produce assets have loaded.
 const roundGame=game;
 useEffect(()=>{
  alive.current=true;let cancelled=false;
  const assets=[human+'.webp',bot+'.webp','vault.webp',...products.map((_,i)=>`produce-${i}.webp`)];
  const loads=assets.map(file=>new Promise<void>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve();img.onerror=()=>reject(new Error(file));img.src=ninjaAsset(file);}));
  void Promise.all(loads).then(()=>{if(cancelled)return;setState(game.start());setNow(Date.now());setAssetsReady(true);}).catch(()=>{if(!cancelled)setAssetError(true);});
  return()=>{cancelled=true;alive.current=false;for(const t of timeouts.current)clearTimeout(t);stopSpeaking();};
 },[]);
 useEffect(()=>{if(!assetsReady)return;const timer=setInterval(()=>{setNow(Date.now());setState(roundGame.poll());},33);return()=>clearInterval(timer);},[roundGame,assetsReady]);
 useEffect(()=>{
  const hide=()=>{if(document.hidden){roundGame.cancel();setPaused(true);stopSpeaking();for(const t of timeouts.current)clearTimeout(t);}};
  document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);
 },[roundGame]);
 useEffect(()=>{
  for(const e of state.events){if(e.id<=heard.current)continue;heard.current=e.id;
   if(e.kind==='hit'){
    timeouts.current.push(setTimeout(()=>{if(alive.current){sound.play('hit');speakVietnamese(products[state.task.product][1]);}},Math.max(0,e.at+190-Date.now())));
   }else {sound.play(e.kind);if(e.kind==='splat')timeouts.current.push(setTimeout(()=>{if(alive.current)speakVietnamese(products[state.task.product][1]);},Math.max(0,e.at+300-Date.now())));}
  }
 },[state.events.map(e=>e.id).join(',')]);
 const countdown=assetsReady&&!paused&&state.round===0&&state.phase==='ready'?Math.ceil((state.startsAt-now)/1000):0;
 useEffect(()=>{
  if(countdown>=1&&countdown<=3&&lastBeep.current!==countdown){lastBeep.current=countdown;sound.beep(countdown);}
 },[countdown,sound]);
 const finished=state.phase==='finished',result=state.phase==='result';
 const reveal=state.events.some(e=>(e.kind==='hit'&&now>=e.at+190)||(e.kind==='splat'&&now>=e.at+300));
 const seconds=Math.max(0,Math.ceil((state.startsAt+5000-now)/1000));
 const extra=state.round>=state.baseRounds;
 const label=extra?`Доп. раунд ${state.round-state.baseRounds+1}`:`Раунд ${state.round+1}/${state.baseRounds}`;
 const choose=(product:number)=>{if(!assetsReady||paused)return;setState(roundGame.answer(product,state.round));setNow(Date.now());};
 if(paused)return <div className="screen ninja-setup"><BackButton onClick={onBack} label="К ниндзя"/><h1>Матч прерван</h1><p>Приложение было свёрнуто. Начнём новый матч?</p><button className="big-button" onClick={onReplay}>Начать заново</button></div>;
 if(!assetsReady)return <div className="screen ninja-setup"><BackButton onClick={onBack} label="К ниндзя"/><h1>🥷 Ниндзя</h1><p role={assetError?'alert':'status'}>{assetError?'Не удалось загрузить арену. Проверь интернет.':'Готовим арену…'}</p>{assetError&&<button className="big-button" onClick={onReplay}>Повторить</button>}</div>;
 return <div className={`screen battle-screen ninja-screen is-playing${finished?' is-finished':''}`}>
  <div className="battle-topbar"><BackButton onClick={onBack} label="К ниндзя"/><div className="battle-round">{label}<b>{finished?'✓':state.phase==='ready'?Math.max(1,Math.ceil((state.startsAt-now)/1000)):result?'✓':seconds}</b></div></div>
  <NinjaStage state={state} now={now} human={human} bot={bot}/>
  <div className="battle-score ninja-score"><span className="battle-team-blue">Ты<strong key={'you'+state.scoreHuman}>{state.scoreHuman}</strong></span><b>:</b><span className="battle-team-red">Бот<strong key={'bot'+state.scoreBot}>{state.scoreBot}</strong></span></div>
  {finished?<section className="ninja-result"><h2>{state.scoreHuman>state.scoreBot?'🏆 Ты победил!':'Бот победил'}</h2><p>Тренировка завершена · без рейтинга</p><button className="big-button" onClick={onReplay}>Реванш</button><button className="battle-return-button" onClick={onBack}>← К выбору темы</button></section>:<>
   <div className="ninja-prompt" aria-hidden="true"/>
   <div className="ninja-feedback" aria-live="polite">{result?<>{state.winner==='human'?'Твоё очко':state.winner==='bot'?'Очко бота':'Без очков'}</>:state.humanAnswered?'Промах! У бота ещё есть время':state.events.some(e=>e.side==='bot'&&e.kind==='miss')?'Бот промахнулся — отвечай!':''}</div>
   <div className="battle-answers ninja-answers">{state.task.options.map(p=><button key={`${state.round}:${p}`} className={reveal&&p===state.task.product?'is-correct':''} disabled={state.phase!=='question'||state.humanAnswered} onClick={()=>choose(p)}>{products[p][1]}</button>)}</div>
   <button className="battle-secondary" onClick={onBack}>Завершить батл</button>
  </>}
 </div>;
}
