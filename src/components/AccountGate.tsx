import { MemberAvatar } from './MemberAvatar';
import { useEffect, useState } from 'react';
import App from '../App';
import { cachedMember, cacheMember, memberRequest, signInMember, startAccountSync, supabase, syncAccount, rememberIdentity, restoreIdentity, forgetIdentity, type Member } from '../domain/cloud';
import { accountEntries, storageOwner, setStorageOwner } from '../domain/accountStorage';
import { ProfileScreen } from './ProfileScreen';
import './AccountGate.css';
const roster=[['svetlana','Светлана'],['lesya','Леся'],['sergey-p','Сергей П'],['sergey-k','Сергей К'],['marina','Марина'],['konstantin','Константин'],['artur','Артур'],['admin','Админ']];
function clearLegacyProgress() {
 if(localStorage.getItem('vietSveta.cleanStart.v1'))return;
 for(const key of Object.keys(localStorage))if(/^(vietCards\.|vietSveta\.|vietsveta\.)/.test(key)&&!/^vietSveta\.(auth\.|member\.|account\.|sentAttempts\.|identities\.)/.test(key))localStorage.removeItem(key);
 localStorage.setItem('vietSveta.cleanStart.v1','1');
}
export function AccountGate() {
 const [member,setMember]=useState<Member|null>(null),[loading,setLoading]=useState(true),[profile,setProfile]=useState(false);
 const [selected,setSelected]=useState(''),[pin,setPin]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[status,setStatus]=useState('');
 const enter=async(m:Member)=>{
  setStorageOwner(m.user_id,m.is_admin);cacheMember(m);
  // A new device must hydrate progress first; returning devices already have it.
  if(!m.is_admin&&!Object.keys(accountEntries(m.user_id)).length)await syncAccount(m.user_id).catch(()=>{});
  setMember(m);setProfile(false);
  void rememberIdentity(m).catch(()=>{});
 };
 useEffect(()=>{
  let cancelled=false;
  void (async()=>{
   try{
    clearLegacyProgress();
    const {data:{session}}=await supabase.auth.getSession();
    if(!session||cancelled)return;
    const saved=cachedMember();
    // A cached profile alone never opens the app: it must match the restored session.
    // Server operations continue to enforce authorization while we verify in the background.
    const returning=saved?.user_id===session.user.id&&(saved.is_admin||Object.keys(accountEntries(saved.user_id)).length>0);
    if(returning){await enter(saved);if(cancelled)return;setLoading(false);}
    let m:Member;
    try{m=(await memberRequest({action:'profile'})).profile;}catch(e){
     if(cancelled||(returning&&storageOwner()!==session.user.id))return;
     if((e as {status?:number}).status===401||(e as {status?:number}).status===403){await supabase.auth.signOut({scope:'local'});return;}
     const cached=cachedMember();if(!cached||cached.user_id!==session.user.id)throw e;m=cached;
    }
    if(returning&&storageOwner()!==session.user.id)return;
    if(!cancelled){if(returning){cacheMember(m);setStorageOwner(m.user_id,m.is_admin);setMember(m);}else await enter(m);}
   }catch{if(!cancelled)setError('Не удалось проверить вход. Проверь подключение и попробуй снова.');}
   finally{if(!cancelled)setLoading(false);}
  })();return()=>{cancelled=true;};
 },[]);
 useEffect(()=>member&&!member.is_admin?startAccountSync(member.user_id,setStatus):undefined,[member?.user_id,member?.is_admin]);
 // A signed-out or expired session immediately closes the application.
 useEffect(()=>{const {data}=supabase.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'){setStorageOwner(null);setMember(null);setProfile(false);localStorage.removeItem('vietSveta.member.v1');}});return()=>data.subscription.unsubscribe();},[]);
 const login=async()=>{setBusy(true);setError('');try{clearLegacyProgress();await enter(await signInMember(selected,pin));setPin('');}catch(e){setError((e as Error).message);setPin('');}finally{setBusy(false);}};
 const logout=async()=>{
  if(!member)return;
  setBusy(true);await syncAccount(member.user_id).catch(()=>{});
  forgetIdentity(member.id);await supabase.auth.signOut({scope:'local'});setStorageOwner(null);setMember(null);setProfile(false);setSelected('');setPin('');setBusy(false);
 };
 const switchProfile=async()=>{
  if(!member)return;
  setBusy(true);await rememberIdentity(member);if(!member.is_admin)await syncAccount(member.user_id).catch(()=>{});
  setStorageOwner(null);setMember(null);setProfile(false);setSelected('');setPin('');setError('');setBusy(false);
 };
 const choose=async(id:string)=>{
  setBusy(true);setError('');
  try { const restored=await restoreIdentity(id);if(restored){await enter(restored);return;}setSelected(id);setPin(''); }
  catch {setError('Не удалось переключить профиль. Попробуй снова.');}
  finally {setBusy(false);}
 };
 if(loading)return <div className="screen account-screen"><h1>Viet Club</h1><p role="status">Открываем приложение…</p></div>;
 if(member)return profile?<ProfileScreen member={member} status={status} onBack={()=>setProfile(false)} onLogout={logout} onSwitch={['konstantin','admin'].includes(member.id)?switchProfile:undefined} busy={busy}/>:<App courseGroup={member.course_group} isAdmin={member.is_admin} memberId={member.id} memberName={member.display_name} syncStatus={status} onOpenProfile={()=>setProfile(true)}/>;
 return <div className="screen account-screen"><div className="account-brand">🇻🇳 Viet Club</div><h1>{selected?'Введи свой код':'Вход в приложение'}</h1>
  {selected?<form onSubmit={e=>{e.preventDefault();if(pin.length===4&&!busy)void login();}}>
   <p className="account-person"><MemberAvatar id={selected} name={roster.find(p=>p[0]===selected)?.[1]??''} size={48}/>{roster.find(p=>p[0]===selected)?.[1]}</p>
   <label htmlFor="member-pin">Четыре цифры</label><input id="member-pin" type="password" inputMode="numeric" autoComplete="current-password" pattern="[0-9]{4}" maxLength={4} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,''))} autoFocus disabled={busy}/>
   <button className="big-button" disabled={pin.length!==4||busy}>{busy?'Входим…':'Войти'}</button>
   <button className="account-back" type="button" disabled={busy} onClick={()=>{setSelected('');setPin('');setError('');}}>← Другое имя</button>
  </form>:<><p className="account-description">Выбери своё имя. Вход запомнится на этом телефоне.</p><div className="account-roster">{roster.map(([id,name])=><button key={id} disabled={busy} onClick={()=>void choose(id)}><MemberAvatar id={id} name={name}/><span>{name}</span></button>)}</div></>}
  {error&&<p className="account-error" role="alert">{error}</p>}
 </div>;
}
