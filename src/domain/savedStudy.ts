import {flashCards as advancedCards} from '../content/cards';
import {flashCards as beginnerCards} from '../beginner/content/cards';
import {products} from '../content/advancedProduce';
import type {AdminStudyData,StudyAttempt} from './adminStudy';
export interface SavedLearning{user_id:string;advanced?:SavedCourse;beginner?:SavedCourse;market_errors?:unknown;bests?:{game:string;record:{correct:number;correctTimeMs:number|null}}[]}
interface SavedCourse{progress?:unknown;theory?:unknown;last?:unknown}
export interface SavedCard{key:string;course:string;lesson:string;vi:string;ru:string;direction:string;remembered:number;missed:number;lastResult:string;lastReviewedAt:string|null}
export interface SavedLesson{key:string;course:string;lesson:string;at:string}
const object=(value:unknown):Record<string,unknown>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
const date=(value:unknown)=>typeof value==='string'&&Number.isFinite(Date.parse(value))?value:null;
const count=(value:unknown)=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=0?value:0;
export function savedStudy(data:AdminStudyData,user:string){
 const saved=data.saved_learning?.find(s=>s.user_id===user),cards:SavedCard[]=[],theory:SavedLesson[]=[],last:string[]=[];
 for(const [course,catalog] of [['advanced',advancedCards],['beginner',beginnerCards]] as const){
  const source=saved?.[course];
  for(const value of Object.values(object(source?.progress))){const r=object(value),card=catalog.find(c=>c.id===r.cardId);if(!card||!['ru-vi','vi-ru','listening'].includes(String(r.direction)))continue;
   const at=date(r.lastReviewedAt);if(at)last.push(at);cards.push({key:`${course}:${card.id}:${r.direction}`,course,lesson:card.lessonId,vi:card.vi,ru:card.ru,direction:String(r.direction),remembered:count(r.timesRemembered),missed:count(r.timesNotRemembered),lastResult:String(r.lastResult),lastReviewedAt:at});
  }
  for(const [lesson,value] of Object.entries(object(source?.theory))){const at=date(value);if(!at)continue;theory.push({key:`${course}:${lesson}`,course,lesson,at});last.push(at);}
  const at=date(object(source?.last).updatedAt);if(at)last.push(at);
 }
 const repeat=cards.filter(c=>c.lastResult==='not-remembered');
 const errors=cards.filter(c=>c.missed>0).sort((a,b)=>b.missed-a.missed||a.vi.localeCompare(b.vi));
 const unique=new Set(cards.map(c=>`${c.course}:${c.lesson}:${c.vi}:${c.ru}`)).size;
 const market=Array.isArray(saved?.market_errors)?[...new Set(saved.market_errors.filter((v):v is string=>typeof v==='string').map(v=>v.split('|')[0].replace(/^ngô$/,'bắp / ngô')))].flatMap(vi=>{const p=products.find(p=>p[1]===vi);return p?[{vi:p[1],ru:p[2]}]:[];}):[];
 return {cards,theory,unique,repeat:new Set(repeat.map(c=>`${c.course}:${c.lesson}:${c.vi}:${c.ru}`)).size,errors,market,bests:Array.isArray(saved?.bests)?saved.bests.filter(b=>typeof b.game==='string'&&b.record&&Number.isFinite(b.record.correct)):[],last:last.sort().pop()??null};
}
export function attemptSummary(attempts:StudyAttempt[]){
 const correct=attempts.reduce((n,a)=>n+a.correct,0),total=attempts.reduce((n,a)=>n+a.total,0),correctMs=attempts.reduce((n,a)=>n+a.correct_time_ms,0);
 const days=new Set(attempts.map(a=>new Date(Date.parse(a.created_at)+7*3600000).toISOString().slice(0,10))).size;
 return {count:attempts.length,correct,total,correctMs,days};
}
