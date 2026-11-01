// Private, per-account outbox. It is independent from progress sync and never sends on answer taps.
export type StudyCategory='games'|'cards'|'audio'|'theory'|'visit';
export interface StudyContext {category:StudyCategory;topic:string}
export interface StudyActivity {id:string;user_id:string;day:string;category:StudyCategory;topic:string;active_ms:number;updated_at:string}
export interface StudyAnswer {id:string;user_id:string;topic:string;vi:string;ru:string;direction:string;chosen:string|null;result:'correct'|'wrong'|'timeout';elapsed_ms:number;created_at:string}
export type AnswerInput=Omit<StudyAnswer,'id'|'user_id'|'created_at'>;
export type StudySender=(activity:StudyActivity[],answers:StudyAnswer[])=>Promise<void>;
const contexts=new Map<symbol,StudyContext>();
let collector:StudyCollector|null=null;
export const vietnamDay=(ms=Date.now())=>new Date(ms+7*3600000).toISOString().slice(0,10);
export function registerStudyContext(category:StudyCategory,topic:string){
 const token=Symbol();collector?.sample();contexts.set(token,{category,topic:topic.slice(0,100)});
 return()=>{collector?.sample();contexts.delete(token);};
}
export function reportStudyAnswer(input:AnswerInput){try{collector?.answer(input);}catch{/* Learning must never depend on telemetry. */}}
export class StudyCollector {
 private activity=new Map<string,StudyActivity>();private pending=new Map<string,StudyActivity>();private answers:StudyAnswer[]=[];
 private previous:number;private interaction:number;private visible:boolean;private sending=false;private stopped=false;
 private media=new Map<HTMLMediaElement,number>();private timer?:ReturnType<typeof setInterval>;private ticks=0;
 private key:string;private leaseToken=crypto.randomUUID();
 private lease(){try{const key=`vietSveta.telemetryLease.${this.owner}`,raw=JSON.parse(localStorage.getItem(key)??'null');if(raw&&raw.token!==this.leaseToken&&raw.until>this.now())return false;localStorage.setItem(key,JSON.stringify({token:this.leaseToken,until:this.now()+2500}));return true;}catch{return true;}}
 constructor(private owner:string,private send:StudySender,private now=()=>Date.now()){
  let tab:string;try{tab=sessionStorage.getItem('vietSveta.telemetryTab')??crypto.randomUUID();sessionStorage.setItem('vietSveta.telemetryTab',tab);}catch{tab=crypto.randomUUID();}
  this.key=`vietSveta.telemetry.${owner}.v2.${tab}`;this.previous=this.interaction=now();this.visible=!document.hidden;
  try{const saved=JSON.parse(localStorage.getItem(this.key)??'{}');for(const row of saved.activity??[])if(row.user_id===owner)this.pending.set(row.id,row);this.answers=(saved.answers??[]).filter((row:StudyAnswer)=>row.user_id===owner);}catch{/* New or unavailable storage. */}
  // Each tab owns an outbox. A later visit rescues abandoned tabs without overwriting a live tab.
  try{for(const key of Object.keys(localStorage)){if(!key.startsWith(`vietSveta.telemetry.${owner}.`)||key===this.key)continue;const saved=JSON.parse(localStorage.getItem(key)??'{}');if(Number(saved.saved_at??0)>now()-120000)continue;for(const row of saved.activity??[])if(row.user_id===owner)this.pending.set(row.id,row);const ids=new Set(this.answers.map(a=>a.id));for(const row of saved.answers??[])if(row.user_id===owner&&!ids.has(row.id)){this.answers.push(row);ids.add(row.id);}this.persist();localStorage.removeItem(key);}}catch{/* A damaged or unavailable queue cannot block learning. */}
  this.add({category:'visit',topic:'app'},0,this.previous);this.persist();
 }
 private add(context:StudyContext,ms:number,at:number){
  const day=vietnamDay(at),key=`${day}|${context.category}|${context.topic}`;
  const row=this.activity.get(key)??{id:crypto.randomUUID(),user_id:this.owner,day,category:context.category,topic:context.topic,active_ms:0,updated_at:new Date(at).toISOString()};
  row.active_ms=Math.min(86400000,row.active_ms+Math.round(ms));row.updated_at=new Date(at).toISOString();this.activity.set(key,row);this.pending.set(row.id,{...row});
 }
 touch=()=>{this.sample();this.interaction=this.now();if(!document.hidden)this.add({category:'visit',topic:'app'},0,this.interaction);};
 sample=()=>{
  const now=this.now(),from=this.previous;this.previous=now;
  const elapsed=now-from>5000?0:Math.max(0,now-from);const visible=this.visible;this.visible=!document.hidden;
  const values=[...contexts.values()],context=values[values.length-1];let audio:HTMLMediaElement|undefined;
  document.querySelectorAll<HTMLMediaElement>('audio,video').forEach(el=>{const before=this.media.get(el);if(!el.paused&&!el.ended&&before!==undefined&&el.currentTime>before)audio=el;this.media.set(el,el.currentTime);});
  if(!visible||!elapsed)return;
  const chosen=audio&&context?.category!=='games'?{category:'audio' as const,topic:context?.topic??document.querySelector('.screen-title')?.textContent?.slice(0,100)??'audio'}:context;
  const activeUntil=audio?now:Math.min(now,this.interaction+60000);
  const amount=Math.max(0,Math.min(elapsed,activeUntil-from));if(!chosen||!amount||!this.lease())return;
  // A sample crossing midnight belongs to both local calendar days.
  const start=now-amount;
  if(vietnamDay(start)!==vietnamDay(now)){const midnight=Date.parse(vietnamDay(now)+'T00:00:00+07:00');this.add(chosen,midnight-start,midnight-1);this.add(chosen,now-midnight,now);}
  else this.add(chosen,amount,now);
 };
 answer(input:AnswerInput){
  if(document.hidden||this.stopped)return;
  if(this.now()-this.interaction>60000)return;
  if(input.result!=='timeout')this.touch();this.answers.push({...input,id:crypto.randomUUID(),user_id:this.owner,topic:input.topic.slice(0,100),vi:input.vi.slice(0,200),ru:input.ru.slice(0,200),chosen:input.chosen?.slice(0,200)??null,elapsed_ms:Math.max(0,Math.min(60000,Math.round(input.elapsed_ms))),created_at:new Date(this.now()).toISOString()});this.persist();
 }
 private persist(){try{localStorage.setItem(this.key,JSON.stringify({saved_at:this.now(),activity:[...this.pending.values()],answers:this.answers}));}catch{/* Keep the in-memory outbox and retry upload. */}}
 async flush(){
  this.sample();this.persist();if(this.sending)return;this.sending=true;
  const activity=[...this.pending.values()].slice(0,100).map(x=>({...x})),answers=this.answers.slice(0,300);
  try{if(activity.length||answers.length){await this.send(activity,answers);for(const row of activity){const current=this.pending.get(row.id);if(current?.active_ms===row.active_ms&&current.updated_at===row.updated_at)this.pending.delete(row.id);}const sent=new Set(answers.map(x=>x.id));this.answers=this.answers.filter(x=>!sent.has(x.id));this.persist();}}
  catch{/* Offline: keep the same IDs for an idempotent retry. */}finally{this.sending=false;}
 }
 private hidden=()=>{this.sample();this.persist();if(document.hidden)void this.flush();};
 private pagehide=()=>{this.sample();this.persist();void this.flush();};
 start(){
  for(const name of ['pointerdown','keydown','scroll'])document.addEventListener(name,this.touch,{capture:true,passive:true});
  document.addEventListener('visibilitychange',this.hidden);window.addEventListener('pagehide',this.pagehide);window.addEventListener('online',this.pagehide);
  this.timer=setInterval(()=>{this.sample();if(++this.ticks%5===0)this.persist();if(this.ticks%30===0)void this.flush();},1000);void this.flush();
 }
 stop(){this.sample();this.stopped=true;clearInterval(this.timer);for(const name of ['pointerdown','keydown','scroll'])document.removeEventListener(name,this.touch,true);document.removeEventListener('visibilitychange',this.hidden);window.removeEventListener('pagehide',this.pagehide);window.removeEventListener('online',this.pagehide);this.persist();void this.flush();}
}
export function startStudyCollection(owner:string,send:StudySender){collector?.stop();const current=new StudyCollector(owner,send);collector=current;current.start();return()=>{current.stop();if(collector===current)collector=null;};}
