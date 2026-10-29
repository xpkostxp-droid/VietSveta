// @vitest-environment jsdom
import {beforeEach,afterEach,expect,it,vi} from 'vitest';
import {act} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {AccountGate} from './AccountGate';
import {signInMember} from '../domain/cloud';
vi.mock('../domain/cloud',()=>({
 supabase:{auth:{getSession:vi.fn(async()=>({data:{session:null}})),onAuthStateChange:vi.fn(()=>({data:{subscription:{unsubscribe:vi.fn()}}})),signOut:vi.fn(async()=>({error:null}))}},
 cachedMember:vi.fn(()=>null),cacheMember:vi.fn(),memberRequest:vi.fn(),syncAccount:vi.fn(async()=>{}),startAccountSync:vi.fn(()=>()=>{}),
 signInMember:vi.fn(async(id:string)=>({id,user_id:'user-'+id,display_name:id==='konstantin'?'Константин':'Светлана',is_admin:id==='konstantin'})),
}));
vi.mock('../App',()=>({default:({memberName}:{memberName:string})=><div>Личное приложение: {memberName}</div>}));
vi.mock('./ProfileScreen',()=>({ProfileScreen:()=>null}));
let node:HTMLDivElement,root:Root;
beforeEach(()=>{localStorage.clear();node=document.createElement('div');document.body.append(node);root=createRoot(node);(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;});
afterEach(()=>{act(()=>root.unmount());node.remove();});
it('shows six identities, removes old progress, and logs admin into whole app',async()=>{
 localStorage.setItem('vietCards.progress.v1','{"old":true}');
 await act(async()=>{root.render(<AccountGate/>);});
 expect(node.textContent).toContain('Марина');expect(node.querySelectorAll('.account-roster button').length).toBe(6);
 expect(localStorage.getItem('vietCards.progress.v1')).toBeNull();
 act(()=>{Array.from(node.querySelectorAll('button')).find(b=>b.textContent?.includes('Константин'))!.click();});
 const input=node.querySelector('input')!;
 act(()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,'1234');input.dispatchEvent(new Event('input',{bubbles:true}));});
 await act(async()=>{node.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
 expect(signInMember).toHaveBeenCalledWith('konstantin','1234');expect(node.textContent).toContain('Личное приложение: Константин · админ');
});
