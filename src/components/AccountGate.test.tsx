// @vitest-environment jsdom
import {beforeEach,afterEach,expect,it,vi} from 'vitest';
import {act} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {AccountGate} from './AccountGate';
import {signInMember} from '../domain/cloud';
vi.mock('../domain/cloud',()=>({
 supabase:{auth:{getSession:vi.fn(async()=>({data:{session:null}})),onAuthStateChange:vi.fn(()=>({data:{subscription:{unsubscribe:vi.fn()}}})),signOut:vi.fn(async()=>({error:null}))}},
 cachedMember:vi.fn(()=>null),cacheMember:vi.fn(),memberRequest:vi.fn(),syncAccount:vi.fn(async()=>{}),startAccountSync:vi.fn(()=>()=>{}),
 signInMember:vi.fn(async(id:string)=>({id,user_id:'user-'+id,display_name:id==='artur'?'Артур':'Светлана',is_admin:false,course_group:id==='artur'?'beginner':'advanced'})),
}));
vi.mock('../App',()=>({default:({memberName,courseGroup}:{memberName:string;courseGroup:string})=><div>Личное приложение: {memberName} · {courseGroup}</div>}));
vi.mock('./ProfileScreen',()=>({ProfileScreen:()=>null}));
let node:HTMLDivElement,root:Root;
beforeEach(()=>{localStorage.clear();node=document.createElement('div');document.body.append(node);root=createRoot(node);(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;});
afterEach(()=>{act(()=>root.unmount());node.remove();});
it('shows all seven identities, removes old progress, and opens Artur’s beginner profile',async()=>{
 localStorage.setItem('vietCards.progress.v1','{"old":true}');
 await act(async()=>{root.render(<AccountGate/>);});
 expect(node.textContent).toContain('Марина');expect(node.querySelectorAll('.account-roster button').length).toBe(7);
 expect(localStorage.getItem('vietCards.progress.v1')).toBeNull();
 act(()=>{Array.from(node.querySelectorAll('button')).find(b=>b.textContent?.includes('Артур'))!.click();});
 const input=node.querySelector('input')!;
 act(()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,'1234');input.dispatchEvent(new Event('input',{bubbles:true}));});
 await act(async()=>{node.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
 expect(signInMember).toHaveBeenCalledWith('artur','1234');expect(node.textContent).toContain('Личное приложение: Артур · beginner');
});
