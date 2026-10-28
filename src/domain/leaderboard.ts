import { readJSON, writeJSON } from './storage';
import { isBetterRecord, type GameRecord } from './gameRecord';
export const participants = [{id:'svetlana',name:'Светлана'},{id:'lesya',name:'Леся'},{id:'sergey-p',name:'Сергей П'},{id:'sergey-k',name:'Сергей К'},{id:'pending',name:'?'}];
export const ratingGames = [{id:'harvest-40',name:'Овощи-фрукты',total:40},{id:'questions-15',name:'Вопросы 15',total:30},{id:'questions-24',name:'Вопросы 24',total:48}];
export function activeParticipant(): string { const id=readJSON('vietSveta.participant.v1'); return participants.some(p=>p.id===id) ? id as string : ''; }
export function selectParticipant(id:string) { writeJSON('vietSveta.participant.v1',participants.some(p=>p.id===id)?id:''); }
function key(game:string,id:string) { return `vietSveta.groupRecord.${game}.${id}.v1`; }
function readRecord(game:string,id:string):GameRecord|null {
 const r=readJSON(key(game,id)) as GameRecord|undefined;
 const total=ratingGames.find(g=>g.id===game)?.total??0;
 return r && Number.isInteger(r.correct) && r.correct>=0 && r.correct<=total && typeof r.correctTimeMs==='number' && Number.isFinite(r.correctTimeMs) && r.correctTimeMs>=0 ? r : null;
}
export function recordParticipantAttempt(game:string,correct:number,correctTimeMs:number) {
 const id=activeParticipant(), total=ratingGames.find(g=>g.id===game)?.total;
 if(!id||!total||!Number.isInteger(correct)||correct<0||correct>total||!Number.isFinite(correctTimeMs)||correctTimeMs<0)return;
 const next={correct,correctTimeMs}, previous=readRecord(game,id);
 if(!previous||isBetterRecord(next,previous))writeJSON(key(game,id),next);
}
export function leaderboardRows(game:string) {
 const rows=participants.map(p=>({...p,record:readRecord(game,p.id)}));
 rows.sort((a,b)=>!a.record?(b.record?1:0):!b.record?-1:b.record.correct-a.record.correct||a.record.correctTimeMs!-b.record.correctTimeMs!);
 return rows.map(row=>({...row,rank:row.record?1+rows.filter(other=>other.record&&(other.record.correct>row.record!.correct||other.record.correct===row.record!.correct&&other.record.correctTimeMs!<row.record!.correctTimeMs!)).length:null}));
}
