export interface RankingRow { id:string; name:string; best:{correct:number;correct_time_ms:number}|null }
export function rankPlayers(rows:RankingRow[]) {
 const sorted=[...rows].sort((a,b)=>!a.best?(b.best?1:a.id.localeCompare(b.id)):!b.best?-1:b.best.correct-a.best.correct||a.best.correct_time_ms-b.best.correct_time_ms||a.id.localeCompare(b.id));
 let place=0;
 return sorted.map((row,i)=>{
  const prev=sorted[i-1];
  if(row.best && (!prev?.best || row.best.correct!==prev.best.correct || row.best.correct_time_ms!==prev.best.correct_time_ms))place=i+1;
  return {...row,place:row.best?place:null};
 });
}
export function betterAttempt(a:{correct:number;correct_time_ms:number},b:RankingRow['best']) {
 return !b||a.correct>b.correct||(a.correct===b.correct&&a.correct_time_ms<b.correct_time_ms);
}
