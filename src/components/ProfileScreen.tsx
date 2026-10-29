import { MemberAvatar } from './MemberAvatar';
import { useEffect, useState } from 'react';
import { BackButton } from './BackButton';
import { memberRequest, type Member } from '../domain/cloud';
import { readJSON } from '../domain/storage';
import { loadProgress } from '../domain/progress';
interface AdminData {participants:Member[];states:{user_id:string;data:Record<string,{value:unknown}>;updated_at:string}[];attempts:{id:string;user_id:string;game:string;correct:number;total:number;correct_time_ms:number}[]}
export function ProfileScreen({member,status,onBack,onLogout,busy}:{member:Member;status:string;onBack:()=>void;onLogout:()=>void;busy:boolean}) {
 const [admin,setAdmin]=useState<AdminData|null>(null),[error,setError]=useState(''),[reset,setReset]=useState(''),[pin,setPin]=useState(''),[message,setMessage]=useState(''),[confirm,setConfirm]=useState(false);
 const records=Object.values(loadProgress().records),count=new Set(records.map(r=>r.cardId)).size;
 const visits=readJSON('vietCards.theoryVisits.v1');
 const attempts=readJSON('vietSveta.timedAttempts.v1');
 useEffect(()=>{if(member.is_admin)void memberRequest({action:'admin-overview'}).then(setAdmin).catch(()=>setError('Не удалось загрузить участников. Проверь сеть.'));},[member.is_admin]);
 return <div className="screen account-profile"><BackButton onClick={onBack} label="На главную"/><div className="profile-avatar-heading"><MemberAvatar id={member.id} name={member.display_name} size={88}/><h1>{member.display_name}{member.is_admin?' · админ':''}</h1></div><p className="account-sync">{status}</p>
  {member.is_admin&&<p className="account-admin-note">Режим проверки. Твои результаты сохраняются отдельно и не участвуют в рейтинге игроков.</p>}
  <div className="account-stats"><div><strong>{count}</strong><span>Карточек отработано</span></div><div><strong>{new Set(records.filter(r=>r.lastResult==='not-remembered').map(r=>r.cardId)).size}</strong><span>Карточек на повтор</span></div><div><strong>{visits&&typeof visits==='object'?Object.keys(visits).length:0}</strong><span>Уроков теории открыто</span></div><div><strong>{Array.isArray(attempts)?attempts.length:0}</strong><span>{member.is_admin?'Тестовых игр':'Игр сыграно'}</span></div></div>
  <p className="account-description">Подробный прогресс карточек — в разделе «Карточки». Открытая теория не считается выученным уроком.</p>
  {member.is_admin&&<section className="account-admin"><h2>Участники</h2>{error&&<p role="alert">{error}</p>}{!admin&&!error&&<p>Загружаем…</p>}{admin?.participants.map(p=>{
   const state=admin.states.find(s=>s.user_id===p.user_id);const progress=state?.data['vietCards.progress.v1']?.value as {records?:Record<string,{cardId:string}>}|undefined;
   const cards=new Set(Object.values(progress?.records??{}).map(r=>r.cardId)).size;
   return <div className="account-admin-row" key={p.id}><strong className="admin-member-name"><MemberAvatar id={p.id} name={p.display_name}/>{p.display_name}{p.is_admin?' · админ':''}</strong><p>Карточек: {cards} · Игр: {admin.attempts.filter(a=>a.user_id===p.user_id).length}{p.is_admin?' · вне рейтинга':''}</p><button className="secondary-button" onClick={()=>{setReset(p.id);setPin('');setMessage('');}}>Изменить код</button></div>;
  })}
  {reset&&<form onSubmit={async e=>{e.preventDefault();try{await memberRequest({action:'reset-pin',id:reset,pin});setMessage('Новый код сохранён');setReset('');setPin('');}catch{setMessage('Не удалось изменить код');}}}><label htmlFor="reset-pin">Новый код: {admin?.participants.find(p=>p.id===reset)?.display_name}</label><input id="reset-pin" aria-label="Новый код" type="password" inputMode="numeric" maxLength={4} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,''))}/><button className="big-button" disabled={pin.length!==4}>Сохранить код</button><button className="account-back" type="button" onClick={()=>setReset('')}>Отмена</button></form>}{message&&<p role="status">{message}</p>}</section>}
  {!confirm?<button className="account-back" onClick={()=>setConfirm(true)}>Выйти из учётной записи</button>:<div className="account-logout"><p>После выхода потребуется снова ввести код.</p><button className="big-button" disabled={busy} onClick={onLogout}>{busy?'Выходим…':'Выйти'}</button><button className="account-back" onClick={()=>setConfirm(false)}>Остаться</button></div>}
 </div>;
}
