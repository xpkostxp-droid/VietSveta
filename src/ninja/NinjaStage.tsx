import type {NinjaSnapshot,NinjaSide} from './ninjaEngine';
import {ninjaAsset,ninjaFrame,type NinjaCharacter} from './ninjaCharacters';
import {products} from '../content/marketProducts';
export function NinjaStage({state,now,human,bot}:{state:NinjaSnapshot;now:number;human:NinjaCharacter;bot:NinjaCharacter}){
 const progress=Math.max(0,Math.min(1,(now-state.startsAt)/5000));
 const hit=state.events.find(e=>e.kind==='hit'),splat=state.events.find(e=>e.kind==='splat');
 const event=hit??splat;
 const atProgress=event?Math.max(0,Math.min(1,(event.at-state.startsAt)/5000)):progress;
 const elapsed=event?now-event.at:0;
 const sliced=!!hit&&elapsed>=190,smashed=!!splat&&elapsed>=300;
 const flightY=83-32*Math.sin(Math.PI*atProgress);
 const y=splat?flightY+(83-flightY)*Math.min(1,Math.pow(elapsed/300,2)):flightY;
 const x=50+4*Math.sin(atProgress*Math.PI*2);
 const fruitStyle={left:`${x}%`,top:`${y}%`};
 const drawActor=(side:NinjaSide,id:NinjaCharacter)=>{
  const latest=[...state.events].reverse().find(e=>e.side===side&&e.kind!=='splat');
  const frame=latest?ninjaFrame(now-latest.at):0;
  return <div className={`ninja-actor ninja-actor-${side}`} data-character={id} data-frame={frame} aria-hidden="true"><div className="ninja-sprite" style={{backgroundImage:`url("${ninjaAsset(id+'.webp')}")`,backgroundPosition:`${frame*100/7}% 0`}}/></div>;
 };
 const showFruit=state.phase!=='ready'&&state.phase!=='finished'&&state.phase!=='cancelled';
 const fruit=ninjaAsset(`produce-${state.task.product}.webp`);
 return <div className="ninja-stage" aria-label="Каменная арена с двумя самураями" style={{backgroundImage:`url("${ninjaAsset('vault.webp')}")`}}>
  <i className="ninja-torch ninja-torch-left" aria-hidden="true"/><i className="ninja-torch ninja-torch-right" aria-hidden="true"/>
  {drawActor('human',human)}{drawActor('bot',bot)}
  {showFruit&&<div className={`ninja-produce${sliced?' is-sliced':''}${smashed?' is-smashed':''}`} style={fruitStyle} role="img" aria-label={products[state.task.product][2]}>
   {sliced?<><img className="ninja-half ninja-half-left" src={fruit} alt=""/><img className="ninja-half ninja-half-right" src={fruit} alt=""/><span className="ninja-juice" aria-hidden="true"/></>:<img src={fruit} alt=""/>}
  </div>}
  {hit&&elapsed>=160&&elapsed<450&&<i className={`ninja-cut${(hit.side==='human'?human:bot).startsWith('red')?' is-horizontal':''}`} style={fruitStyle} aria-hidden="true"/>}
  {state.phase==='ready'&&<div className="ninja-prepare" role="status">{Math.max(1,Math.ceil((state.startsAt-now)/1000))}</div>}
  {state.phase==='finished'&&<div className="ninja-finish-banner">{state.scoreHuman>state.scoreBot?'🏆 Твоя победа!':'Победа бота'}<small>Батл завершён</small></div>}
 </div>;
}
