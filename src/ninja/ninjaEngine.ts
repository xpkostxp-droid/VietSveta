import { products } from '../content/marketProducts';
export type NinjaTopic='fruits'|'vegetables'|'all';
export type NinjaSide='human'|'bot';
export type NinjaEvent={id:number;round:number;side:NinjaSide;kind:'hit'|'miss'|'splat';at:number};
export type NinjaTask={product:number;options:number[]};
export type NinjaSnapshot={phase:'ready'|'question'|'result'|'finished'|'cancelled';round:number;baseRounds:number;startsAt:number;resultUntil:number;task:NinjaTask;humanAnswered:boolean;scoreHuman:number;scoreBot:number;winner:NinjaSide|null;events:NinjaEvent[]};
export function shuffle<T>(items:readonly T[],random:()=>number){const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
// Persistent vocabulary cycles. Within a match every product is unique until overtime.
export function drawNinjaProducts(topic:NinjaTopic,n:number,random:()=>number=Math.random,avoid:number[]=[]):number[]{
 const pool=products.map((_,i)=>i).filter(i=>topic==='all'||products[i][3]===topic),key=`vietSveta.ninja.words.v1:${topic}`;
 let seen:number[]=[];try{const value=JSON.parse(localStorage.getItem(key)??'[]');if(Array.isArray(value))seen=value.filter((v:unknown):v is number=>typeof v==='number'&&pool.includes(v));}catch{}
 const selected:number[]=[];
 for(let i=0;i<Math.min(n,pool.length);i++){
  let available=pool.filter(p=>!seen.includes(p)&&!selected.includes(p)&&!avoid.includes(p));
  if(!available.length){available=pool.filter(p=>!seen.includes(p)&&!selected.includes(p));}
  if(!available.length){seen=[];available=pool.filter(p=>!selected.includes(p)&&!avoid.includes(p));if(!available.length)available=pool.filter(p=>!selected.includes(p));}
  const product=available[Math.floor(random()*available.length)];selected.push(product);seen.push(product);
 }
 try{localStorage.setItem(key,JSON.stringify(seen));}catch{}
 return selected;
}
export function createNinjaGame(topic:NinjaTopic,random:()=>number=Math.random,clock:()=>number=Date.now){
 const pool=products.map((_,i)=>i).filter(i=>topic==='all'||products[i][3]===topic),baseRounds=Math.min(10,pool.length);
 const queue:number[]=[];
 const taskFor=(product:number):NinjaTask=>({product,options:shuffle([product,...shuffle(pool.filter(i=>i!==product),random).slice(0,2)],random)});
 const s:NinjaSnapshot={phase:'ready',round:0,baseRounds,startsAt:clock()+3000,resultUntil:0,task:taskFor(pool[0]),humanAnswered:false,scoreHuman:0,scoreBot:0,winner:null,events:[]};
 let botAnswered=false,plan={kind:Math.floor(random()*3),delay:900+Math.floor(random()*3300)},serial=0;
 const event=(side:NinjaSide,kind:NinjaEvent['kind'],at:number)=>s.events.push({id:++serial,round:s.round,side,kind,at});
 const settle=(winner:NinjaSide|null,at:number)=>{s.winner=winner;if(winner==='human')s.scoreHuman++;if(winner==='bot')s.scoreBot++;if(!winner)event('human','splat',at);s.phase='result';s.resultUntil=at+1700;};
 const advance=()=>{
  const now=clock();
  if(s.phase==='ready'&&now>=s.startsAt)s.phase='question';
  if(s.phase==='question'){
   if(!botAnswered&&plan.kind!==2&&now>=s.startsAt+plan.delay){
    botAnswered=true;const at=s.startsAt+plan.delay;
    if(plan.kind===0){event('bot','hit',at);settle('bot',at);}else{event('bot','miss',at);if(s.humanAnswered)settle(null,at);}
   }
   if(s.phase==='question'&&now>=s.startsAt+5000)settle(null,s.startsAt+5000);
  }
  if(s.phase==='result'&&now>=s.resultUntil){
   if(s.round+1>=baseRounds&&s.scoreHuman!==s.scoreBot){s.phase='finished';return;}
   s.round++;if(s.round===queue.length)queue.push(...drawNinjaProducts(topic,1,random,[s.task.product]));
   s.task=taskFor(queue[s.round]);s.humanAnswered=false;botAnswered=false;s.winner=null;s.events=[];
   s.startsAt=now+700;s.phase='ready';plan={kind:Math.floor(random()*3),delay:900+Math.floor(random()*3300)};
  }
 };
 const snapshot=()=>({...s,task:{...s.task,options:[...s.task.options]},events:s.events.map(e=>({...e}))});
 return {initial(){return snapshot();},start(){if(!queue.length){queue.push(...drawNinjaProducts(topic,baseRounds,random));s.task=taskFor(queue[0]);}s.startsAt=clock()+3000;return snapshot();},poll(){advance();return snapshot();},answer(product:number,round:number){
  advance();if(s.phase!=='question'||s.humanAnswered||round!==s.round||!s.task.options.includes(product))return snapshot();
  s.humanAnswered=true;const at=clock();if(product===s.task.product){event('human','hit',at);settle('human',at);}else{event('human','miss',at);if(botAnswered)settle(null,at);}
  return snapshot();
 },cancel(){s.phase='cancelled';return snapshot();}};
}
