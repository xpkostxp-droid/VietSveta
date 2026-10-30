import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const rpc=vi.hoisted(()=>vi.fn());
vi.mock('../domain/cloud',()=>({supabase:{rpc}}));
import { BattleScreen } from './BattleScreen';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
let host:HTMLDivElement;let root:ReturnType<typeof createRoot>;
const base={server_now:new Date().toISOString(),topics:[{id:'fruits',title:'Фрукты'}],online:[{device:'peer',name:'Светлана',busy:false}],match:null};
beforeEach(()=>{vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();vi.useFakeTimers();rpc.mockReset();rpc.mockResolvedValue({data:base,error:null});host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.useRealTimers();vi.restoreAllMocks();});
it('shows online opponent, selected topic and sends an invitation',async()=>{
 await act(async()=>root.render(<BattleScreen onBack={()=>{}}/>));
 await act(async()=>[...host.querySelectorAll('button')].find(b=>b.textContent==='Играть')!.click());
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

it.each([['host',12,8,'near'],['guest',12,8,'far'],['guest',8,12,'near'],['host',8,12,'far']] as const)('uses personal perspective for %s at %i:%i',async(side,h,g,outcome)=>{
 rpc.mockResolvedValue({data:{...base,match:{id:'finished',status:'finished',side,round:15,starts_at:null,task:null,answered:true,score_host:h,score_guest:g,host_name:'Админ',guest_name:'Светлана',last_result:null}},error:null});
 await act(async()=>root.render(<BattleScreen onBack={()=>{}}/>));
 expect(host.querySelector('video.is-selected')?.getAttribute('src')).toContain(outcome);
 expect(host.textContent).not.toContain('Проверим смэш на телефоне');
});
it('uses total match score when both players miss question 15',async()=>{
 rpc.mockResolvedValue({data:{...base,match:{id:'last-miss',status:'finished',side:'host',round:15,starts_at:null,task:null,answered:true,score_host:6,score_guest:4,host_name:'Админ',guest_name:'Светлана',last_result:{winner:'none',word:'táo',options:['яблоко','банан','манго'],answer:0}}},error:null});
 await act(async()=>root.render(<BattleScreen onBack={()=>{}}/>));
 expect(host.querySelector('video.is-selected')?.getAttribute('src')).toContain('near');
 expect([...host.querySelectorAll('.battle-score strong')].map(n=>n.textContent)).toEqual(['6','4']);
});
it('shows a draw without a victory smash after 15 questions',async()=>{
 rpc.mockResolvedValue({data:{...base,match:{id:'draw',status:'finished',side:'guest',round:15,starts_at:null,task:null,answered:true,score_host:5,score_guest:5,host_name:'Админ',guest_name:'Светлана',last_result:null}},error:null});
 await act(async()=>root.render(<BattleScreen onBack={()=>{}}/>));
 expect(host.querySelector('video.is-selected')).toBeNull();expect(host.textContent).toContain('Ничья!');
});
it('removes bot play from the online lobby',async()=>{
 await act(async()=>root.render(<BattleScreen onBack={()=>{}}/>));
 await act(async()=>[...host.querySelectorAll('button')].find(b=>b.textContent==='Играть')!.click());
 expect(host.textContent).not.toContain('Сыграть с ботом');expect(host.textContent).not.toContain('только админу');
 expect(host.textContent).toContain('🥷 Ниндзя');
});

it('keeps the lobby free of the old smash preview controls',async()=>{
 await act(async()=>root.render(<BattleScreen onBack={()=>{}}/>));
 expect(host.textContent).not.toContain('Проверим смэш на телефоне');
 expect([...host.querySelectorAll('button')].some(b=>b.textContent==='Мой смэш'||b.textContent==='Смэш соперника')).toBe(false);
});
it('places the question timer above the court and scores below the players',async()=>{
 rpc.mockResolvedValue({data:{...base,match:{id:'layout',topic:'fruits',status:'active',side:'host',round:0,starts_at:new Date(Date.now()-1000).toISOString(),ready_host:true,ready_guest:true,task:{word:'táo',options:['яблоко','банан','манго']},answered:false,score_host:0,score_guest:0,host_name:'Админ',guest_name:'Светлана',last_result:null}},error:null});
 await act(async()=>root.render(<BattleScreen onBack={()=>{}}/>));
 const top=host.querySelector('.battle-topbar')!,court=host.querySelector('.battle-court')!,score=host.querySelector('.battle-score')!;
 expect(top.contains(host.querySelector('.battle-round'))).toBe(true);
 expect(top.compareDocumentPosition(court)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 expect(court.compareDocumentPosition(score)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

it('keeps the final score below the smash and preserves the match layout',async()=>{
 rpc.mockResolvedValue({data:{...base,match:{id:'end-layout',topic:'fruits',status:'finished',side:'host',round:15,starts_at:null,task:null,answered:true,score_host:6,score_guest:4,host_name:'Админ',guest_name:'Светлана',last_result:null}},error:null});
 await act(async()=>root.render(<BattleScreen onBack={()=>{}}/>));
 const screen=host.querySelector('.battle-screen')!,cinema=host.querySelector('.battle-cinema')!,score=host.querySelector('.battle-score')!;
 expect(screen.classList.contains('is-playing')).toBe(true);expect(screen.classList.contains('is-finished')).toBe(true);
 expect(cinema.compareDocumentPosition(score)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 expect(cinema.classList.contains('battle-cinema-compact')).toBe(true);
 expect(host.querySelectorAll('.battle-score')).toHaveLength(1);
 expect(host.querySelector('.battle-result')?.textContent).toContain('К статистике');
});
it('opens statistics first and enters the lobby through Play',async()=>{
 await act(async()=>root.render(<BattleScreen onBack={()=>{}}/>));
 expect(host.textContent).toContain('Статистика батлов');expect(host.querySelector('.topic-wheel')).toBeNull();
 await act(async()=>[...host.querySelectorAll('button')].find(b=>b.textContent==='Играть')!.click());
 expect(host.textContent).toContain('Выбери тему');
 await act(async()=>[...host.querySelectorAll('button')].find(b=>b.textContent?.includes('К статистике'))!.click());
 expect(host.textContent).toContain('Статистика батлов');
});
it('offers a rematch with the same opponent and a return to statistics',async()=>{
 const match={id:'ended',topic:'fruits',status:'finished',side:'host',round:20,starts_at:null,task:null,answered:true,score_host:12,score_guest:5,host_name:'Админ',guest_name:'Светлана',last_result:null};
 rpc.mockResolvedValue({data:{...base,match},error:null});
 await act(async()=>root.render(<BattleScreen onBack={()=>{}}/>));
 await act(async()=>[...host.querySelectorAll('button')].find(b=>b.textContent==='Реванш')!.click());
 expect(rpc).toHaveBeenCalledWith('battle_preview',expect.objectContaining({p_action:'rematch',p_payload:{match:'ended'}}));
 await act(async()=>[...host.querySelectorAll('button')].find(b=>b.textContent==='← К статистике')!.click());
 expect(host.textContent).toContain('Статистика батлов');
 expect(host.querySelector('.battle-score')).toBeNull();
});
