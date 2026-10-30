import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const rpc=vi.hoisted(()=>vi.fn());
vi.mock('../domain/cloud',()=>({supabase:{rpc}}));
import { BattleScreen } from './BattleScreen';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
let host:HTMLDivElement;let root:ReturnType<typeof createRoot>;
const base={server_now:new Date().toISOString(),topics:[{id:'fruits',title:'Фрукты'}],online:[{device:'peer',name:'Светлана',busy:false}],match:null};
beforeEach(()=>{vi.useFakeTimers();rpc.mockReset();rpc.mockResolvedValue({data:base,error:null});host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.useRealTimers();});
it('shows online opponent, selected topic and sends an invitation',async()=>{
 await act(async()=>root.render(<BattleScreen onBack={()=>{}}/>));
 expect(host.textContent).toContain('Светлана');expect(host.textContent).toContain('не влияют');
 const button=[...host.querySelectorAll('button')].find(b=>b.textContent==='Вызвать')!;
 await act(async()=>button.click());
 expect(rpc).toHaveBeenCalledWith('battle_preview',expect.objectContaining({p_action:'invite',p_payload:{opponent:'peer',topic:'fruits'}}));
});
it('locks an answer immediately, preventing double submission',async()=>{
 rpc.mockResolvedValue({data:{...base,match:{id:'match',status:'active',side:'host',round:0,starts_at:new Date(Date.now()-1000).toISOString(),ready_host:true,ready_guest:true,task:{word:'táo',options:['яблоко','банан','манго']},answered:false,score_host:0,score_guest:0,host_name:'Админ',guest_name:'Светлана'}},error:null});
 await act(async()=>root.render(<BattleScreen onBack={()=>{}}/>));
 const answer=host.querySelector('.battle-answers button') as HTMLButtonElement;
 await act(async()=>{answer.click();answer.click();});
 expect(rpc.mock.calls.filter(c=>c[1].p_action==='answer')).toHaveLength(1);
});
