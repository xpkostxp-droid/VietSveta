import {AdminBattleLab} from '../battle/AdminBattleLab';
import { MemberAvatar } from './MemberAvatar';
import { useEffect, useState } from 'react';
import { BackButton } from './BackButton';
import { memberRequest, type Member } from '../domain/cloud';
import { readJSON } from '../domain/storage';
import { loadProgress, type CardProgressRecord } from '../domain/progress';
interface AdminData {participants:Member[];states:{user_id:string;data:Record<string,{value:unknown}>;updated_at:string}[];attempts:{id:string;user_id:string;game:string;correct:number;total:number;correct_time_ms:number}[]}
export function ProfileScreen({member,status,onBack,onLogout,onSwitch,busy}:{member:Member;status:string;onBack:()=>void;onLogout:()=>void;onSwitch?:()=>void;busy:boolean}) {
 const [testing,setTesting]=useState(false);
 const [admin,setAdmin]=useState<AdminData|null>(null),[error,setError]=useState(''),[reset,setReset]=useState(''),[pin,setPin]=useState(''),[message,setMessage]=useState(''),[confirm,setConfirm]=useState(false);
 const beginnerProgress=readJSON('vietSveta.beginner.vietCards.progress.v1') as {records?:Record<string,CardProgressRecord>}|undefined;
 const records=[...Object.values(loadProgress().records).map(r=>({...r,cardId:`advanced:${r.cardId}`})),...Object.values(beginnerProgress?.records??{}).map(r=>({...r,cardId:`beginner:${r.cardId}`}))],count=new Set(records.map(r=>r.cardId)).size;
 const advancedVisits=readJSON('vietCards.theoryVisits.v1');
 const beginnerVisits=readJSON('vietSveta.beginner.vietCards.theoryVisits.v1');
 const visitCount=[advancedVisits,beginnerVisits].reduce<number>((n,v)=>n+(v&&typeof v==='object'?Object.keys(v).length:0),0);
 const attempts=readJSON('vietSveta.timedAttempts.v1');
 useEffect(()=>{if(member.is_admin)void memberRequest({action:'admin-overview'}).then(setAdmin).catch(()=>setError('Не удалось загрузить участников. Проверь сеть.'));},[member.is_admin]);
 if(member.is_admin&&testing)return <AdminBattleLab isAdmin={member.is_admin} onBack={()=>setTesting(false)}/>;
 return <div className="screen account-profile"><BackButton onClick={onBack} label="На главную"/><div className="profile-avatar-heading"><MemberAvatar id={member.id} name={member.display_name} size={88}/><h1>{member.display_name}</h1></div><p className="account-sync">{status}</p>
  {member.is_admin&&<button className="big-button" onClick={()=>setTesting(true)}>🤖 Проверить игры с ботом</button>}
  {member.is_admin&&<p className="account-admin-note">Режим проверки. Результаты игр и учебная статистика не сохраняются.</p>}
  {!member.is_admin&&<><div className="account-stats"><div><strong>{count}</strong><span>Карточек отработано</span></div><div><strong>{new Set(records.filter(r=>r.lastResult==='not-remembered').map(r=>r.cardId)).size}</strong><span>Карточек на повтор</span></div><div><strong>{visitCount}</strong><span>Уроков теории открыто</span></div><div><strong>{Array.isArray(attempts)?attempts.length:0}</strong><span>{member.is_admin?'Тестовых игр':'Игр сыграно'}</span></div></div>
  <p className="account-description">Подробный прогресс карточек — в разделе «Карточки». Открытая теория не считается выученным уроком.</p>
  </>}
  {onSwitch&&<button className="big-button" disabled={busy} onClick={onSwitch}>Переключить профиль</button>}
  {member.is_admin&&<section className="account-admin"><h2>Участники</h2>{error&&<p role="alert">{error}</p>}{!admin&&!error&&<p>Загружаем…</p>}{admin?.participants.filter(p=>!p.is_admin).map(p=>{
   const state=admin.states.find(s=>s.user_id===p.user_id);const progress=state?.data['vietCards.progress.v1']?.value as {records?:Record<string,{cardId:string}>}|undefined;
   const beginner=state?.data['vietSveta.beginner.vietCards.progress.v1']?.value as {records?:Record<string,{cardId:string}>}|undefined;
   const cards=new Set(Object.values(progress?.records??{}).map(r=>r.cardId)).size+new Set(Object.values(beginner?.records??{}).map(r=>r.cardId)).size;
   return <div className="account-admin-row" key={p.id}><strong className="admin-member-name"><MemberAvatar id={p.id} name={p.display_name}/>{p.display_name}{p.is_admin?' · админ':''}</strong><p>Карточек: {cards} · Игр: {admin.attempts.filter(a=>a.user_id===p.user_id).length}{p.is_admin?' · вне рейтинга':''}</p><button className="secondary-button" onClick={()=>{setReset(p.id);setPin('');setMessage('');}}>Изменить код</button></div>;
  })}
  {reset&&<form onSubmit={async e=>{e.preventDefault();try{await memberRequest({action:'reset-pin',id:reset,pin});setMessage('Новый код сохранён');setReset('');setPin('');}catch{setMessage('Не удалось изменить код');}}}><label htmlFor="reset-pin">Новый код: {admin?.participants.find(p=>p.id===reset)?.display_name}</label><input id="reset-pin" aria-label="Новый код" type="password" inputMode="numeric" maxLength={4} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,''))}/><button className="big-button" disabled={pin.length!==4}>Сохранить код</button><button className="account-back" type="button" onClick={()=>setReset('')}>Отмена</button></form>}{message&&<p role="status">{message}</p>}</section>}
  {!confirm?<button className="account-back" onClick={()=>setConfirm(true)}>Выйти из учётной записи</button>:<div className="account-logout"><p>После выхода потребуется снова ввести код.</p><button className="big-button" disabled={busy} onClick={onLogout}>{busy?'Выходим…':'Выйти'}</button><button className="account-back" onClick={()=>setConfirm(false)}>Остаться</button></div>}
 </div>;
}
