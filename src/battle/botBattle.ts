import { botVocabulary } from './botVocabulary';
import type { Snapshot, Match } from './battleTypes';
type Answer = { correct: boolean; elapsed: number };
type Task = { word: string; options: string[]; answer: number };
export function botPlan(random:()=>number=Math.random) {
 const action=Math.floor(random()*3);
 return {kind:action===0?'correct' as const:action===1?'wrong' as const:'skip' as const,elapsed:650+Math.floor(random()*3650)};
}
function shuffle<T>(items:T[],random:()=>number) {
 const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;
}
export function createBotBattle(topic:string,random:()=>number=Math.random,clock:()=>number=Date.now) {
 const group=botVocabulary[topic]??botVocabulary.fruits;
 const count=Math.min(10,group.words.length),baseRounds=count*2;
 const draw=(direction:number,n:number)=>{
  const key=`battle-words-v2:${topic}:${direction}`;
  let seen:string[]=[];
  try{seen=JSON.parse(localStorage.getItem(key)??'[]');}catch{}
  const selected:typeof group.words=[];
  for(let i=0;i<n;i++){
   let available=group.words.filter(p=>!seen.includes(p[0])&&!selected.includes(p));
   if(!available.length){seen=[];available=group.words.filter(p=>!selected.includes(p));}
   const pair=available[Math.floor(random()*available.length)];selected.push(pair);seen.push(pair[0]);
  }
  try{localStorage.setItem(key,JSON.stringify(seen));}catch{}
  return selected.map(pair=>{
   const correct=pair[1-direction];
   const wrong=shuffle([...new Set(group.words.map(p=>p[1-direction]))].filter(w=>w!==correct),random).slice(0,2);
   const options=shuffle([correct,...wrong],random);
   return {word:pair[direction],options,answer:options.indexOf(correct)};
  });
 };
 const tasks:Task[]=shuffle([...draw(0,count),...draw(1,count)],random);
 const plans=tasks.map(()=>botPlan(random));
 const match:Match={id:'bot-'+clock().toString(36),status:'active',topic,side:'host',host_name:'Ты',guest_name:'Бот',round:0,base_rounds:baseRounds,starts_at:null,ready_host:false,ready_guest:true,task:null,answered:false,score_host:0,score_guest:0,last_result:null};
 let human:Answer|null=null,opponent:Answer|null=null;
 const settle=()=>{
  if(match.status!=='active'||!match.starts_at)return;
  const elapsed=clock()-Date.parse(match.starts_at);
  if(elapsed<0)return;
  const plan=plans[match.round];
  if(!opponent&&plan.kind!=='skip'&&elapsed>=plan.elapsed)opponent={correct:plan.kind==='correct',elapsed:plan.elapsed};
  const correct=[human,opponent].filter((a):a is Answer=>!!a?.correct);
  const first=correct.length?Math.min(...correct.map(a=>a.elapsed)):Infinity;
  if(elapsed<5000&&!(human&&opponent)&&elapsed<first+600)return;
  let winner='none';
  if(human?.correct)winner='host';
  if(opponent?.correct){
   if(!human?.correct||opponent.elapsed<human.elapsed)winner='guest';
   else if(opponent.elapsed===human.elapsed)winner='both';
  }
  if(winner==='host'||winner==='both')match.score_host++;
  if(winner==='guest'||winner==='both')match.score_guest++;
  match.last_result={winner,...tasks[match.round],round:match.round,at:new Date(clock()).toISOString(),starts_at:match.starts_at};
  match.round++;human=null;opponent=null;match.answered=false;
  if(match.round>=baseRounds&&match.score_host!==match.score_guest){match.status='finished';match.task=null;}
  else {
   if(match.round===tasks.length){tasks.push(...draw(Math.floor(random()*2),1));plans.push(botPlan(random));}
   match.starts_at=new Date(clock()+2000).toISOString();
  }
 };
 const snapshot=():Snapshot=>{
  const task=tasks[match.round];
  return {server_now:new Date(clock()).toISOString(),online:[],topics:Object.entries(botVocabulary).map(([id,t])=>({id,title:t.title})),match:{...match,task:match.status==='active'&&task?{word:task.word,options:[...task.options]}:null,last_result:match.last_result?{...match.last_result,options:[...match.last_result.options]}:null}};
 };
 return {request(action='poll',payload:Record<string,unknown>={}):Snapshot{
  if(action==='ready'&&match.starts_at===null&&match.status==='active'){match.ready_host=true;match.starts_at=new Date(clock()+3000).toISOString();}
  if(action==='cancel'||action==='leave')match.status='cancelled';
  if(action==='answer'&&match.status==='active'&&match.starts_at&&!human){
   const elapsed=clock()-Date.parse(match.starts_at),choice=Number(payload.choice);
   if(Number(payload.round)===match.round&&elapsed>=0&&elapsed<5000&&Number.isInteger(choice)&&choice>=0&&choice<3){
    human={correct:choice===tasks[match.round].answer,elapsed};match.answered=true;
   }
  }
  settle();return snapshot();
 }};
}
