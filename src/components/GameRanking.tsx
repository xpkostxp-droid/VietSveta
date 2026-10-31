import { useEffect, useState } from 'react';
import { cachedMember, memberRequest, syncAccount } from '../domain/cloud';
import { rankPlayers, betterAttempt, type RankingRow } from '../domain/leaderboard';
import { MemberAvatar } from './MemberAvatar';
import './GameRanking.css';
type Result={correct:number;time:number};
const before=new Map<string,ReturnType<typeof rankPlayers>>();
type RankedRows=ReturnType<typeof rankPlayers>;
const cachePrefix='vietSveta.ranking.v1:';
const maxCacheAge=24*60*60*1000;
function readRanking(key:string):RankedRows {
 try {
  const saved=JSON.parse(localStorage.getItem(cachePrefix+key)??'null');
  if(!saved||Date.now()-saved.savedAt>maxCacheAge||!Number.isFinite(saved.savedAt)||!Array.isArray(saved.rows))return [];
  if(!saved.rows.every((r:RankingRow)=>r&&typeof r.id==='string'&&typeof r.name==='string'&&(r.best===null||(r.best&&Number.isFinite(r.best.correct)&&Number.isFinite(r.best.correct_time_ms)))))return [];
  return rankPlayers(saved.rows);
 }catch{return [];}
}
function saveRanking(key:string,rows:RankedRows) {
 try{localStorage.setItem(cachePrefix+key,JSON.stringify({savedAt:Date.now(),rows}));}catch{/* Storage is optional; the live ranking still works. */}
}
export function GameRanking({game,total,onStart,startLabel='Начать игру',result,children,startAtBottom=false}:{game:string;total:number;onStart:()=>void;startLabel?:string;result?:Result;children?:React.ReactNode;startAtBottom?:boolean}) {
 const member=cachedMember();
 const key=`${member?.user_id}:${member?.ranking_since??''}:${game}`;
 const [ranking,setRanking]=useState(()=>({key,rows:readRanking(key)}));
 const rows=ranking.key===key?ranking.rows:readRanking(key);
 const [busy,setBusy]=useState(true);
 const [error,setError]=useState('');
 const [retry,setRetry]=useState(0);
 const [notice,setNotice]=useState('');
 useEffect(()=>{
  let alive=true;setBusy(true);setError('');setNotice('');
  setRanking({key,rows:readRanking(key)});
  const load=async()=>{
   try {
    // Only a completed run needs to wait for upload. Menu reads must not
    // wait for the full learning-state sync, which already runs in the background.
    if(member&&result)await syncAccount(member.user_id);
    const data=await memberRequest({action:'leaderboard',game});
    const next=rankPlayers(data.rows as RankingRow[]);
    saveRanking(key,next);
    if(!alive)return;
    const old=before.get(key)?.find(r=>r.id===member?.id);
    const own=next.find(r=>r.id===member?.id);
    if(result&&own?.place){
     const improved=before.has(key)&&betterAttempt({correct:result.correct,correct_time_ms:result.time},old?.best??null);
     setNotice((improved?'Новый личный рекорд! ':'')+(old?.place&&own.place<old.place?`С ${old.place}-го на ${own.place}-е место!`:`Твоё место: ${own.place}`));
    }
    setRanking({key,rows:next});
    if(!result)before.set(key,next);
   }catch{if(alive)setError('Рейтинг пока недоступен. Проверь интернет и обнови — твоя попытка остаётся на устройстве.');}
   finally{if(alive)setBusy(false);}
  };
  // Parent saves the completed attempt before this server sync starts.
  const timer=setTimeout(()=>void load(),0);
  return()=>{alive=false;clearTimeout(timer);};
 },[game,key,retry,result?.correct,result?.time]);
 const seconds=(ms:number)=>(ms/1000).toFixed(2).replace('.',',');
 return <section className="game-ranking">
  {result&&<div className="ranking-result" aria-live="polite"><h2>Твоя попытка</h2><strong>{result.correct} из {total} · {seconds(result.time)} сек</strong>{notice&&<p>{notice}</p>}{member?.is_admin&&<p>Тест администратора · вне рейтинга</p>}</div>}
  {!startAtBottom&&(<button className="big-button ranking-start" onClick={()=>{if(rows.length)before.set(key,rows);onStart();}}>{startLabel}</button>)}
  <h2 className="ranking-heading">🏆 Лучшие попытки</h2><p className="ranking-caption">За всё время · больше ответов, затем быстрее</p>
  {busy&&<p role="status">{rows.length?'Обновляем сохранённый рейтинг…':'Обновляем рейтинг…'}</p>}
  {error&&<div role="status"><p>{error}</p><button className="secondary-button" onClick={()=>setRetry(n=>n+1)}>Обновить рейтинг</button></div>}
  {rows.length>0&&<ol className="ranking-list">{rows.map(row=><li key={row.id} className={'ranking-row'+(row.id===member?.id?' ranking-own':'')}>
   <span className="ranking-place">{row.place?(['🥇','🥈','🥉'][row.place-1]??row.place):'—'}</span>
   <MemberAvatar id={row.id} name={row.name} size={44}/>
   <div className="ranking-person"><strong>{row.name}{row.id===member?.id?' · ты':''}</strong><span>{row.best?`${row.best.correct} из ${total} · ${seconds(row.best.correct_time_ms)} сек`:'Пока нет результата'}</span></div>
  </li>)}</ol>}
  {children}
  {startAtBottom&&(<button className="big-button ranking-start" onClick={()=>{if(rows.length)before.set(key,rows);onStart();}}>{startLabel}</button>)}
 </section>;
}
