import { useEffect,useState } from 'react';
import { supabase } from '../domain/cloud';
import { battleRanking,battleOpponents,type BattleStats } from './battleRanking';
import './BattleStatistics.css';
export function BattleStatistics({onPlay,startLabel='Играть'}:{onPlay:()=>void;startLabel?:string}){
 const [data,setData]=useState<BattleStats>({viewer_id:'',matches:[]}),[busy,setBusy]=useState(true),[error,setError]=useState(''),[retry,setRetry]=useState(0),[expanded,setExpanded]=useState<string|null>(null);
 useEffect(()=>{
  let alive=true;setBusy(true);setError('');
  void (async()=>{try{
   const {data,error}=await supabase.rpc('battle_statistics');if(error)throw error;
   if(alive)setData({viewer_id:data?.viewer_id??'',matches:data?.matches??[]});
  }catch{if(alive)setError('Не удалось загрузить статистику. Проверь подключение.');}finally{if(alive)setBusy(false);}})();
  return()=>{alive=false;};
 },[retry]);
 const rows=battleRanking(data.matches);
 return <section className="battle-statistics">
  <h2>🏆 Статистика батлов</h2>
  <p className="battle-stats-caption">Больше побед, затем меньше поражений</p>
  {busy?<p role="status">Загружаем статистику…</p>:error?<div role="alert"><p>{error}</p><button className="battle-secondary" onClick={()=>setRetry(n=>n+1)}>Повторить</button></div>:rows.length===0?<div className="battle-stats-empty"><span aria-hidden="true">⚔️</span><p>Пока нет завершённых батлов.<br/>Сыграйте первый!</p></div>:<>
   <div className="battle-stats-table-wrap"><table className="battle-stats-table"><thead><tr><th scope="col">Игрок</th><th scope="col">Матчей</th><th scope="col">Побед</th><th scope="col">Пораж.</th></tr></thead><tbody>{rows.map(row=><tr key={row.id} className={row.id===data.viewer_id?'battle-stats-own':''}><th scope="row"><button aria-expanded={expanded===row.id} onClick={()=>setExpanded(expanded===row.id?null:row.id)}><span className="battle-stats-place">{['🥇','🥈','🥉'][row.place-1]??row.place}</span><span>{row.name}{row.id===data.viewer_id&&<small> · ты</small>}</span><span aria-hidden="true">{expanded===row.id?'▴':'▾'}</span></button></th><td>{row.played}</td><td className="battle-stats-wins">{row.wins}</td><td>{row.losses}</td></tr>)}</tbody></table></div>
   {expanded&&<section className="battle-stats-details" aria-label="Результаты по соперникам"><h3>{rows.find(r=>r.id===expanded)?.name} · соперники</h3>{battleOpponents(data.matches,expanded).map(row=><div className="battle-stats-opponent" key={row.id}><strong>{row.name}</strong><span>{row.played} матчей · {row.wins} побед · {row.losses} пораж.</span><span>Последний счёт <b>{row.score}</b></span></div>)}<p className="battle-stats-caption">Счёт со стороны выбранного игрока</p></section>}
  </>}
  <p className="battle-stats-caption">Только завершённые матчи с людьми · за всё время</p>
  <button className="big-button battle-stats-play" onClick={onPlay}>{startLabel}</button>
 </section>;
}
