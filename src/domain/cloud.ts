import { createClient } from '@supabase/supabase-js';
import { accountEntries, applyAccountEntries, type AccountEntries } from './accountStorage';
export const supabase = createClient('https://eqdlhipzjhbzfchwjazr.supabase.co','sb_publishable_TX1Cf_ARp8EGWs37lbP3Yw_o43pfuyU',{global:{fetch:(input,init)=>fetch(input,{...init,signal:init?.signal??AbortSignal.timeout(15000)})},auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:'vietSveta.auth.v1'}});
export interface Member { id:string; display_name:string; is_admin:boolean; user_id:string; course_group?:'beginner'|'advanced'; ranking_since?:string|null }
export async function memberRequest(body:Record<string,unknown>) {
 if(body.action==='leaderboard'&&body.total===undefined&&(body.game==='harvest-fruits'||body.game==='harvest-vegetables'))body={...body,total:body.game==='harvest-fruits'?40:32};
 const {data:{session}}=await supabase.auth.getSession();
 const endpoint=body.action==='overall-ranking'?'overall-ranking':body.action==='admin-study-stats'?'admin-study-stats':body.action==='leaderboard'&&['lesson10-family','lesson11-house','lesson11-adjectives','lesson15-verbs'].includes(String(body.game))?'beginner-game-ranking':'member-access';
 const response=await fetch('https://eqdlhipzjhbzfchwjazr.supabase.co/functions/v1/'+endpoint,{
  method:'POST',headers:{'Content-Type':'application/json',...(session?{Authorization:`Bearer ${session.access_token}`}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)
 });
 const result=await response.json();
 if(!response.ok)throw Object.assign(new Error(result.error??'Не удалось соединиться с сервером'),{status:response.status});
 return result;
}
export function cacheMember(member:Member) {localStorage.setItem('vietSveta.member.v1',JSON.stringify(member));}
export function cachedMember():Member|null {try{return JSON.parse(localStorage.getItem('vietSveta.member.v1')??'null');}catch{return null;}}
export async function signInMember(id:string,pin:string):Promise<Member> {
 const result=await memberRequest({action:'login',id,pin});
 const {error}=await supabase.auth.setSession(result.session);if(error)throw error;
 cacheMember(result.profile);return result.profile;
}
export async function syncAccount(id:string) {
 if(cachedMember()?.user_id===id&&cachedMember()?.is_admin)return;
 const entries=accountEntries(id);
 const {data,error}=await supabase.rpc('sync_learning_state',{p_entries:entries});
 if(error)throw error;
 applyAccountEntries(id,data as AccountEntries);
 const attempts=accountEntries(id)['vietSveta.timedAttempts.v1']?.value;
 const ackKey=`vietSveta.sentAttempts.${id}`;
 let sent:string[]=[];try{sent=JSON.parse(localStorage.getItem(ackKey)??'[]');}catch{/* retry */}
 if(Array.isArray(attempts)){
  const pending=attempts.filter(a=>a?.id&&a.game!=='harvest-review'&&!(a.game==='lesson7-travel'&&a.total!==34)&&!sent.includes(a.id));
  if(pending.length){
   const rows=pending.map(a=>({id:a.id,user_id:id,game:a.game,correct:a.correct,total:a.total,correct_time_ms:Math.round(a.correctTimeMs),created_at:a.date}));
   const {error:e}=await supabase.from('game_attempts').upsert(rows,{onConflict:'id',ignoreDuplicates:true});if(e)throw e;
   localStorage.setItem(ackKey,JSON.stringify([...sent,...pending.map(a=>a.id)].slice(-500)));
  }
 }
}
export function startAccountSync(id:string,onStatus:(status:string)=>void) {
 let stopped=false,busy=false,again=false,timer:ReturnType<typeof setTimeout>|undefined;
 const run=async()=>{
  if(stopped)return;if(busy){again=true;return;}busy=true;onStatus('Сохраняем…');
  try{await syncAccount(id);if(!stopped)onStatus('Сохранено');}
  catch{if(!stopped){onStatus('На устройстве · ждём сеть');timer=setTimeout(run,15000);}}
  finally{busy=false;if(again&&!stopped){again=false;timer=setTimeout(run,800);}}
 };
 const changed=(e:Event)=>{if(e instanceof CustomEvent&&e.detail!==id)return;if(timer)clearTimeout(timer);timer=setTimeout(run,800);};
 window.addEventListener('vietsveta-progress',changed);window.addEventListener('online',changed);window.addEventListener('focus',changed);
 const sessionChanged=supabase.auth.onAuthStateChange(event=>{if(event==='TOKEN_REFRESHED')changed(new Event('refresh'));});
 void run();
 return()=>{stopped=true;if(timer)clearTimeout(timer);window.removeEventListener('vietsveta-progress',changed);window.removeEventListener('online',changed);window.removeEventListener('focus',changed);sessionChanged.data.subscription.unsubscribe();};
}

const identityKey = 'vietSveta.identities.v1';
function identities(): Record<string,{access_token:string;refresh_token:string}> {
 try { return JSON.parse(localStorage.getItem(identityKey) ?? '{}'); } catch { return {}; }
}
export async function rememberIdentity(member: Member) {
 if (!['konstantin','admin'].includes(member.id)) return;
 const {data:{session}} = await supabase.auth.getSession();
 if (!session || session.user.id !== member.user_id) return;
 localStorage.setItem(identityKey,JSON.stringify({...identities(),[member.id]:{access_token:session.access_token,refresh_token:session.refresh_token}}));
}
export function forgetIdentity(id: string) {
 const saved = identities(); delete saved[id]; localStorage.setItem(identityKey,JSON.stringify(saved));
}
export async function restoreIdentity(id: string): Promise<Member|null> {
 if (!['konstantin','admin'].includes(id)) return null;
 const session = identities()[id]; if (!session) return null;
 try {
  const {error} = await supabase.auth.setSession(session); if (error) throw error;
  const member = (await memberRequest({action:'profile'})).profile as Member;
  if (member.id !== id) throw new Error('identity');
  return member;
 } catch { forgetIdentity(id); return null; }
}
