import {profileGames} from './profileGames';
export interface StudyParticipant{id:string;display_name:string;user_id:string;course_group:string;ranking_since:string|null}
export interface ActivitySummary{user_id:string;day:string;category:string;topic:string;active_ms:number}
export interface WordSummary{user_id:string;topic:string;vi:string;ru:string;direction:string;shows:number;errors:number;timeouts:number;correct:number;correct_ms:number;last_error:string|null;recent:{result:string;at:string}[];confusions:{chosen:string;count:number}[]}
export interface StudyAttempt{id:string;user_id:string;game:string;correct:number;total:number;correct_time_ms:number;created_at:string}
export interface StudyMedal{user_id:string;game:string;correct:number;total:number;correct_time_ms:number;place:number}
export interface AdminStudyData{since:string;generated_at:string;timezone:string;participants:StudyParticipant[];coverage:{user_id:string;first_seen:string;last_seen:string}[];activity:ActivitySummary[];words:WordSummary[];attempts:StudyAttempt[];medals:StudyMedal[]}
export const studyTopicTitle=(topic:string)=>profileGames.find(g=>g.id===topic)?.title??(topic.startsWith('cards:')?`Карточки · ${topic.endsWith('lesson-44')?'Фрукты · урок 44':topic.split(':').pop()?.replace('lesson-','Урок ')}`:topic.startsWith('theory:')?`Теория · ${topic.split(':').pop()?.replace('lesson-','Урок ')}`:topic.startsWith('battle:')?`Батл · ${topic.includes('digits')?'Цифры 0–9':topic.endsWith('fruits')?'Фрукты':topic.endsWith('vegetables')?'Овощи':topic.slice(7)}`:topic.startsWith('phonetics:')?`Фонетика · тест ${topic.split(':').pop()}`:topic);
export const studyTime=(ms:number)=>{const seconds=Math.floor(ms/1000);if(seconds<60)return `${seconds} сек`;const min=Math.floor(seconds/60);return min<60?`${min} мин`:`${Math.floor(min/60)} ч ${min%60} мин`;};
export const studyDate=(value:string)=>new Intl.DateTimeFormat('ru-RU',{timeZone:'Asia/Ho_Chi_Minh',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(value));
export function participantActivity(data:AdminStudyData,user:string){
 const rows=data.activity.filter(a=>a.user_id===user&&a.category!=='visit');
 const total=rows.reduce((s,a)=>s+Number(a.active_ms),0),days=new Set(rows.filter(a=>a.active_ms>0).map(a=>a.day)).size;
 return {rows,total,days,coverage:data.coverage.find(c=>c.user_id===user)};
}
export interface DifficultWord{key:string;vi:string;ru:string;topic:string;shows:number;errors:number;timeouts:number;correct:number;correctMs:number;lastError:string|null;recent:{result:string;at:string}[];directions:WordSummary[];confusions:{chosen:string;count:number}[]}
export function difficultWords(data:AdminStudyData,user:string,topic='all',mode='errors'){
 const map=new Map<string,DifficultWord>();
 for(const row of data.words.filter(w=>w.user_id===user&&(topic==='all'||topic===w.topic))){
  const key=JSON.stringify([row.topic,row.vi,row.ru]),word=map.get(key)??{key,vi:row.vi,ru:row.ru,topic:row.topic,shows:0,errors:0,timeouts:0,correct:0,correctMs:0,lastError:null,recent:[],directions:[],confusions:[]};
  word.shows+=Number(row.shows);word.errors+=Number(row.errors);word.timeouts+=Number(row.timeouts);word.correct+=Number(row.correct);word.correctMs+=Number(row.correct_ms);word.directions.push(row);
  if(row.last_error&&(!word.lastError||row.last_error>word.lastError))word.lastError=row.last_error;
  word.recent.push(...row.recent);for(const c of row.confusions){const prev=word.confusions.find(x=>x.chosen===c.chosen);if(prev)prev.count+=Number(c.count);else word.confusions.push({...c,count:Number(c.count)});}map.set(key,word);
 }
 const list=[...map.values()];for(const w of list){w.recent.sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));w.recent=w.recent.slice(-5);w.confusions.sort((a,b)=>b.count-a.count);}
 if(mode==='fixed')return list.filter(w=>w.errors>0&&w.shows>=5&&w.recent.length>=3&&w.recent.slice(-3).every(r=>r.result==='correct')).sort((a,b)=>b.shows-a.shows);
 if(mode==='slow')return list.filter(w=>!w.topic.startsWith('cards:')&&!w.topic.startsWith('phonetics:')&&w.correct>=3&&w.correctMs/w.correct>=2500).sort((a,b)=>b.correctMs/b.correct-a.correctMs/a.correct);
 return list.filter(w=>w.errors>0).sort((a,b)=>Number(a.shows<5)-Number(b.shows<5)||b.errors/b.shows-a.errors/a.shows||b.shows-a.shows);
}
