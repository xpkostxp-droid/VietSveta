import {useEffect,useState} from 'react';
import {memberRequest,syncAccount,type Member} from '../domain/cloud';
import {profileGames,profilePlace,type ProfileGameId} from '../domain/profileGames';
import './ProfileAchievements.css';
type Place = {id:ProfileGameId;title:string;place:number|null};
export function ProfileAchievements({member,onOpen}:{member:Member;onOpen:(id:ProfileGameId)=>void}){
 const [places,setPlaces]=useState<Place[]>([]),[failed,setFailed]=useState<string[]>([]),[busy,setBusy]=useState(true),[retry,setRetry]=useState(0);
 useEffect(()=>{
  let alive=true;setBusy(true);setFailed([]);
  void(async()=>{
   try{await syncAccount(member.user_id);}catch{if(alive){setFailed(['Не удалось синхронизировать результаты. Проверь интернет.']);setBusy(false);}return;}
   const results=await Promise.allSettled(profileGames.map(async game=>{
    const data=await memberRequest({action:'leaderboard',game:game.id});
    if(!Array.isArray(data.rows))throw new Error('Invalid ranking');
    return {...game,place:profilePlace(data.rows,member.id)};
   }));
   if(!alive)return;
   setPlaces(results.flatMap(r=>r.status==='fulfilled'?[r.value]:[]));
   setFailed(results.flatMap((r,i)=>r.status==='rejected'?[profileGames[i].title]:[]));setBusy(false);
  })();return()=>{alive=false;};
 },[member.id,member.user_id,retry]);
 const section=(title:string,items:Place[],empty:string)=> <section className="profile-achievement-section"><h2>{title} <span>{items.length}</span></h2>{items.length?<ul>{items.map(game=><li key={game.id}><button className="profile-game-link" onClick={()=>onOpen(game.id)}><span>{game.title}{game.place!==null&&game.place>3&&<small>{game.place}-е место · поборись за тройку</small>}</span><span aria-hidden="true">→</span></button></li>)}</ul>:<p>{empty}</p>}</section>;
 return <div className="profile-achievements">
  <h2>Мои достижения</h2><p className="profile-achievement-caption">Текущие места в общих рейтингах игр. Нажми на игру, чтобы улучшить результат.</p>
  {busy?<p role="status">Обновляем достижения…</p>:<>
   {failed.length>0&&<div role="status" className="profile-achievement-error"><p>Часть результатов недоступна. Не загруженные игры не считаем непробованными.</p><button className="secondary-button" onClick={()=>setRetry(n=>n+1)}>Обновить</button></div>}
   {!places.some(g=>g.place!==null&&g.place<=3)&&!failed.length&&<p className="profile-first-medal">Твоя первая медаль ещё впереди!</p>}
   {section('🥇 Первые места',places.filter(g=>g.place===1),'Первое золото ещё впереди.')}
   {section('🥈 Вторые места',places.filter(g=>g.place===2),'Серебряных медалей пока нет.')}
   {section('🥉 Третьи места',places.filter(g=>g.place===3),'Бронзовых медалей пока нет.')}
   {section('🎯 Поборись за медаль',places.filter(g=>g.place!==null&&g.place>3),'Здесь появятся игры, где ты пока за пределами тройки.')}
   {section('✨ Ещё не пробовал',places.filter(g=>g.place===null),'Во всех загруженных играх уже есть результат!')}
   <p className="profile-achievement-caption">Здесь игры с общим рейтингом. Игра считается пройденной после завершённой попытки.</p>
  </>}
 </div>;
}
