import {useEffect,useState} from 'react';
import {cachedMember,memberRequest} from '../domain/cloud';
import {overallPlayers,gameTitle,type OverallRankingData,type RankingGroup} from '../domain/overallRanking';
import type {ProfileGameId} from '../domain/profileGames';
import {MemberAvatar} from './MemberAvatar';
import './OverallRanking.css';
const cache=new Map<string,OverallRankingData>();
export default function OverallRanking({onOpenGame}:{onOpenGame:(game:ProfileGameId)=>void}){
 const key=cachedMember()?.user_id??'current';
 const [data,setData]=useState<OverallRankingData|null>(()=>cache.get(key)??null),[busy,setBusy]=useState(true),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 const [group,setGroup]=useState<RankingGroup>('all'),[all,setAll]=useState(false),[opened,setOpened]=useState<string|null>(null);
 useEffect(()=>{let alive=true;setBusy(true);setError('');void memberRequest({action:'overall-ranking'}).then((next:OverallRankingData)=>{
  if(!Array.isArray(next.rows)||!next.rows.every(p=>typeof p.id==='string'&&typeof p.name==='string'&&Array.isArray(p.medals)))throw new Error('Invalid ranking');
  if(alive){cache.set(key,next);setData(next);}
 }).catch(()=>{if(alive)setError('Не удалось обновить рейтинг. Попробуй ещё раз.');}).finally(()=>{if(alive)setBusy(false);});return()=>{alive=false;};},[key,retry]);
 const players=data?overallPlayers(data.rows,group):[],shown=all?players:players.slice(0,3),own=players.find(p=>p.id===data?.viewer_id);
 if(!all&&own&&!shown.some(p=>p.id===own.id))shown.push(own);
 return <section className="overall-ranking" aria-label="Общий рейтинг игроков">
  <div className="overall-heading"><h2>🏆 Общий рейтинг</h2>{data&&<button aria-label="Обновить общий рейтинг" disabled={busy} onClick={()=>setRetry(n=>n+1)}>↻</button>}</div><p className="overall-caption">По медалям во всех играх</p>
  <div className="overall-filters" role="group" aria-label="Игры какой группы">{[['all','Все игры'],['beginner','Начальная'],['advanced','Продвинутая']].map(([id,label])=><button key={id} aria-pressed={group===id} onClick={()=>{setGroup(id as RankingGroup);setOpened(null);setAll(false);}}>{label}</button>)}</div>
  {busy&&!data&&<p role="status" className="overall-caption">Загружаем рейтинг…</p>}
  {error&&<div role="status" className="overall-caption"><p>{error}{data?' Показываем сохранённые места.':''}</p><button className="secondary-button" onClick={()=>setRetry(n=>n+1)}>Обновить рейтинг</button></div>}
  {data&&<><div className="overall-columns overall-grid" aria-hidden="true"><span/><span>Игрок</span><span>🥇</span><span>🥈</span><span>🥉</span><span/></div>
   <div className="overall-players">{shown.map((p,i)=><div className={'overall-player'+(p.id===data.viewer_id?' overall-own':'')+(i===3&&!all?' overall-own-extra':'')} key={p.id}>
    <button className="overall-player-toggle overall-grid" aria-expanded={opened===p.id} aria-controls={'overall-details-'+p.id} aria-label={`${p.name}${p.id===data.viewer_id?', ты':''}, ${p.place?'место '+p.place:'пока без медалей'}, золото ${p.counts[0]}, серебро ${p.counts[1]}, бронза ${p.counts[2]}`} onClick={()=>setOpened(v=>v===p.id?null:p.id)}>
     <strong className="overall-place">{p.place??'—'}</strong><span className="overall-name"><MemberAvatar id={p.id} name={p.name} size={32}/><span>{p.name}{p.id===data.viewer_id&&<small> · ты</small>}</span></span>{p.counts.map((n,j)=><span key={j} className="overall-count">{n}</span>)}<span aria-hidden="true">{opened===p.id?'⌃':'⌄'}</span>
    </button>
    {opened===p.id&&<div className="overall-details" id={'overall-details-'+p.id}>
     <h3>Медали · {p.name}</h3>
     {p.medals.length===0?<p className="overall-caption">Пока нет медалей в выбранных играх. Они появятся за места в первой тройке.</p>:[1,2,3].filter(place=>p.counts[place-1]>0).map(place=><section key={place}><h4>{['🥇 Золото','🥈 Серебро','🥉 Бронза'][place-1]} · {p.counts[place-1]}</h4>{p.medals.filter(m=>m.place===place).map(m=><button className="overall-game" key={m.game} onClick={()=>onOpenGame(m.game)}><span>{gameTitle(m.game)}</span><span aria-hidden="true">›</span></button>)}</section>)}
     {p.medals.length>0&&<p className="overall-caption">Нажми на игру, чтобы улучшить свой результат.</p>}
    </div>}
   </div>)}</div>
   {players.length>3&&<button className="overall-more" aria-expanded={all} onClick={()=>{setAll(v=>!v);setOpened(null);}}>{all?'Свернуть ↑':`Все участники · ${players.length} ↓`}</button>}
   {players.length===0&&<p className="overall-caption">Участников пока нет.</p>}
   <p className="overall-caption overall-note">Сначала больше золотых, затем серебряных и бронзовых. Равные результаты делят место. Текущие медали за всё время · батлы отдельно.</p>
  </>}
 </section>;
}
