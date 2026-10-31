// @vitest-environment jsdom
import {beforeEach,afterEach,expect,it,vi} from 'vitest';
import {act} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {AccountGate} from './AccountGate';
import {signInMember,restoreIdentity,syncAccount,startAccountSync,supabase,cachedMember,memberRequest,rememberIdentity} from '../domain/cloud';
vi.mock('../domain/cloud',()=>({
 supabase:{auth:{getSession:vi.fn(async()=>({data:{session:null}})),onAuthStateChange:vi.fn(()=>({data:{subscription:{unsubscribe:vi.fn()}}})),signOut:vi.fn(async()=>({error:null}))}},
 cachedMember:vi.fn(()=>null),cacheMember:vi.fn(),memberRequest:vi.fn(),syncAccount:vi.fn(async()=>{}),startAccountSync:vi.fn(()=>()=>{}),
 rememberIdentity:vi.fn(async()=>{}),restoreIdentity:vi.fn(async()=>null),forgetIdentity:vi.fn(),
 signInMember:vi.fn(async(id:string)=>({id,user_id:'user-'+id,display_name:id==='artur'?'Артур':'Светлана',is_admin:false,course_group:id==='artur'?'beginner':'advanced'})),
}));
vi.mock('../App',()=>({default:({memberName,courseGroup,onOpenProfile}:any)=><div>Личное приложение: {memberName} · {courseGroup}<button onClick={onOpenProfile}>Профиль</button></div>}));
vi.mock('./ProfileScreen',()=>({ProfileScreen:({onSwitch}:any)=><button onClick={onSwitch}>Переключить профиль</button>}));
let node:HTMLDivElement,root:Root;
beforeEach(()=>{vi.clearAllMocks();vi.mocked(supabase.auth.getSession).mockResolvedValue({data:{session:null}} as any);vi.mocked(cachedMember).mockReturnValue(null);localStorage.clear();node=document.createElement('div');document.body.append(node);root=createRoot(node);(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;});
afterEach(()=>{act(()=>root.unmount());node.remove();});
it('shows all eight identities, removes old progress, and opens Artur’s beginner profile',async()=>{
 localStorage.setItem('vietCards.progress.v1','{"old":true}');
 await act(async()=>{root.render(<AccountGate/>);});
 expect(node.textContent).toContain('Марина');expect(node.querySelectorAll('.account-roster button').length).toBe(8);
 expect(localStorage.getItem('vietCards.progress.v1')).toBeNull();
 await act(async()=>{Array.from(node.querySelectorAll('button')).find(b=>b.textContent?.includes('Артур'))!.click();});
 const input=node.querySelector('input')!;
 act(()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,'1234');input.dispatchEvent(new Event('input',{bubbles:true}));});
 await act(async()=>{node.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
 expect(signInMember).toHaveBeenCalledWith('artur','1234');expect(node.textContent).toContain('Личное приложение: Артур · beginner');
});

it('restores a remembered admin, skips all statistics sync and can return to profile selection',async()=>{
 vi.mocked(restoreIdentity).mockResolvedValueOnce({id:'admin',user_id:'admin-user',display_name:'Админ',is_admin:true,course_group:'beginner'});
 await act(async()=>{root.render(<AccountGate/>);});
 await act(async()=>{Array.from(node.querySelectorAll('button')).find(b=>b.textContent?.includes('Админ'))!.click();});
 expect(node.textContent).toContain('Личное приложение: Админ');
 expect(node.textContent).not.toContain('Константин');
 expect(syncAccount).not.toHaveBeenCalled();expect(startAccountSync).not.toHaveBeenCalled();
 act(()=>Array.from(node.querySelectorAll('button')).find(b=>b.textContent==='Профиль')!.click());
 await act(async()=>Array.from(node.querySelectorAll('button')).find(b=>b.textContent==='Переключить профиль')!.click());
 expect(node.querySelectorAll('.account-roster button')).toHaveLength(8);
 expect(syncAccount).not.toHaveBeenCalled();
});

it('opens a returning account before profile verification or background sync finishes',async()=>{
 const member={id:'artur',user_id:'returning-user',display_name:'Артур',is_admin:false,course_group:'beginner' as const};
 localStorage.setItem('vietSveta.cleanStart.v1','1');
 localStorage.setItem('vietSveta.account.returning-user.v1',JSON.stringify({progress:{value:{lesson:3},modified:1}}));
 vi.mocked(cachedMember).mockReturnValue(member);
 vi.mocked(supabase.auth.getSession).mockResolvedValue({data:{session:{user:{id:member.user_id}}}} as any);
 let verify!:(value:any)=>void;
 vi.mocked(memberRequest).mockImplementationOnce(()=>new Promise(resolve=>{verify=resolve;}));
 vi.mocked(rememberIdentity).mockImplementationOnce(()=>new Promise(()=>{}));
 await act(async()=>root.render(<AccountGate/>));
 expect(node.textContent).toContain('Личное приложение: Артур');
 expect(node.textContent).not.toContain('Открываем приложение');
 expect(syncAccount).not.toHaveBeenCalled();
 expect(startAccountSync).toHaveBeenCalledTimes(1);
 await act(async()=>verify({profile:{...member}}));
 expect(startAccountSync).toHaveBeenCalledTimes(1);
});
it('does not open a cached identity belonging to another session',async()=>{
 vi.mocked(cachedMember).mockReturnValue({id:'admin',user_id:'other-user',display_name:'Админ',is_admin:true});
 vi.mocked(supabase.auth.getSession).mockResolvedValue({data:{session:{user:{id:'actual-user'}}}} as any);
 let verify!:(value:any)=>void;
 vi.mocked(memberRequest).mockImplementationOnce(()=>new Promise(resolve=>{verify=resolve;}));
 await act(async()=>root.render(<AccountGate/>));
 expect(node.textContent).toContain('Открываем приложение');expect(node.textContent).not.toContain('Личное приложение');
 await act(async()=>verify({profile:{id:'artur',user_id:'actual-user',display_name:'Артур',is_admin:false,course_group:'beginner'}}));
 expect(syncAccount).toHaveBeenCalledWith('actual-user');expect(node.textContent).toContain('Личное приложение: Артур');
});
it('signs out and closes a cached account if the server rejects access',async()=>{
 const member={id:'admin',user_id:'revoked-user',display_name:'Админ',is_admin:true};
 vi.mocked(cachedMember).mockReturnValue(member);
 vi.mocked(supabase.auth.getSession).mockResolvedValue({data:{session:{user:{id:member.user_id}}}} as any);
 let reject!:(error:any)=>void;
 vi.mocked(memberRequest).mockImplementationOnce(()=>new Promise((_resolve,fail)=>{reject=fail;}));
 await act(async()=>root.render(<AccountGate/>));
 expect(node.textContent).toContain('Личное приложение: Админ');
 await act(async()=>reject(Object.assign(new Error('disabled'),{status:403})));
 expect(supabase.auth.signOut).toHaveBeenCalledWith({scope:'local'});
 const handler=vi.mocked(supabase.auth.onAuthStateChange).mock.calls.slice(-1)[0][0];
 act(()=>{handler('SIGNED_OUT',null);});
 expect(node.textContent).not.toContain('Личное приложение');expect(node.textContent).toContain('Вход в приложение');
});

it('does not reopen an account after sign-out while profile verification was pending',async()=>{
 const member={id:'admin',user_id:'signed-out-user',display_name:'Админ',is_admin:true};
 vi.mocked(cachedMember).mockReturnValue(member);
 vi.mocked(supabase.auth.getSession).mockResolvedValue({data:{session:{user:{id:member.user_id}}}} as any);
 let verify!:(value:any)=>void;
 vi.mocked(memberRequest).mockImplementationOnce(()=>new Promise(resolve=>{verify=resolve;}));
 await act(async()=>root.render(<AccountGate/>));
 const handler=vi.mocked(supabase.auth.onAuthStateChange).mock.calls.slice(-1)[0][0];
 act(()=>{handler('SIGNED_OUT',null);});
 await act(async()=>verify({profile:{...member}}));
 expect(node.textContent).not.toContain('Личное приложение');expect(node.textContent).toContain('Вход в приложение');
});
