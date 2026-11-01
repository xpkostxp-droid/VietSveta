import {profileGames,type ProfileGameId} from './profileGames';
export interface OverallMedal{game:ProfileGameId;place:number;correct:number;total:number;correct_time_ms:number}
export interface OverallPlayer{id:string;name:string;medals:OverallMedal[]}
export interface OverallRankingData{viewer_id:string;generated_at:string;rows:OverallPlayer[]}
export type RankingGroup='all'|'beginner'|'advanced';
export const gameGroup=(id:ProfileGameId):Exclude<RankingGroup,'all'>=>profileGames.find(g=>g.id===id)?.group??'advanced';
export const gameTitle=(id:ProfileGameId)=>profileGames.find(g=>g.id===id)?.title??id;
export function overallPlayers(rows:OverallPlayer[],group:RankingGroup){
 const next=rows.map(row=>{const medals=row.medals.filter(m=>profileGames.some(g=>g.id===m.game)&&[1,2,3].includes(m.place)&&(group==='all'||gameGroup(m.game)===group));return {...row,medals,counts:[1,2,3].map(place=>medals.filter(m=>m.place===place).length)};}).sort((a,b)=>b.counts[0]-a.counts[0]||b.counts[1]-a.counts[1]||b.counts[2]-a.counts[2]||a.name.localeCompare(b.name,'ru')||a.id.localeCompare(b.id));
 let place=0;return next.map((row,i)=>{const prev=next[i-1];if(!prev||row.counts.some((n,j)=>n!==prev.counts[j]))place=i+1;return {...row,place:row.medals.length?place:null};});
}
