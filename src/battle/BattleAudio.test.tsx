import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {beforeEach,afterEach,expect,it,vi} from 'vitest';
const fx=vi.hoisted(()=>({rpc:vi.fn(),beep:vi.fn(),point:vi.fn(),speak:vi.fn()}));
vi.mock('../domain/cloud',()=>({supabase:{rpc:fx.rpc}}));
vi.mock('../ninja/ninjaSound',()=>({createNinjaSound:()=>({ready:vi.fn(),close:vi.fn(),beep:fx.beep,play:vi.fn()})}));
vi.mock('./courtSound',()=>({makeCourtSound:()=>({ready:vi.fn(),close:vi.fn(),hit:vi.fn(),point:fx.point})}));
vi.mock('./battleSpeech',()=>({primeBattleSpeech:vi.fn(),speakBattleWord:fx.speak}));
vi.mock('../domain/speech',()=>({hasVietnameseVoice:()=>true,onVoicesChanged:()=>()=>{},stopSpeaking:vi.fn()}));
import {BattleScreen} from './BattleScreen';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
let node:HTMLDivElement,root:ReturnType<typeof createRoot>,snapshot:any;
beforeEach(()=>{
 vi.useFakeTimers();vi.clearAllMocks();vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();
 snapshot={server_now:new Date().toISOString(),topics:[],online:[],match:{id:'sound',topic:'questions',status:'active',side:'host',round:0,starts_at:new Date(Date.now()+3000).toISOString(),ready_host:true,ready_guest:true,host_name:'Ты',guest_name:'Светлана',task:{word:'Кто',options:['Ai','Gì','Ở đâu']},answered:false,score_host:0,score_guest:0,last_result:null}};
 fx.rpc.mockImplementation(async()=>({data:structuredClone(snapshot),error:null}));node=document.createElement('div');document.body.append(node);root=createRoot(node);
});
afterEach(async()=>{await act(async()=>root.unmount());node.remove();vi.useRealTimers();vi.restoreAllMocks();});
const advance=async(ms:number)=>act(async()=>vi.advanceTimersByTimeAsync(ms));
it('shows preparation with 3–2–1 and uses the loud startup signal only',async()=>{
 await act(async()=>root.render(<BattleScreen onBack={()=>{}}/>));
 expect(node.textContent).toContain('Приготовились!');expect(node.querySelector('.battle-court-countdown')?.textContent).toBe('3');expect(fx.beep.mock.calls.map(c=>c[0])).toEqual([3]);
 await advance(1000);await advance(1000);expect(fx.beep.mock.calls.map(c=>c[0])).toEqual([3,2,1]);
 await advance(1000);await advance(1000);await advance(1100);expect(fx.beep.mock.calls.map(c=>c[0])).toEqual([3,2,1]);expect(fx.speak).not.toHaveBeenCalled();expect(node.querySelector('.battle-court-countdown')).toBeNull();expect(node.textContent).not.toContain('Выбери перевод');
});
it.each([0,1])('does not reveal or speak merely because the player taps choice %i',async(choice)=>{
 await act(async()=>root.render(<BattleScreen onBack={()=>{}}/>));await advance(1000);await advance(1000);await advance(1100);
 await act(async()=>(node.querySelectorAll('.battle-answers button')[choice] as HTMLButtonElement).click());await advance(300);
 expect(fx.speak).not.toHaveBeenCalled();expect(node.querySelector('.is-correct')).toBeNull();
});
it.each(['host','guest','none'])('highlights the old correct option and speaks once for %s',async(winner)=>{
 await act(async()=>root.render(<BattleScreen onBack={()=>{}}/>));await advance(1000);await advance(1000);await advance(1100);
 snapshot.match.round=1;snapshot.match.starts_at=new Date(Date.now()+2000).toISOString();snapshot.match.last_result={round:0,at:new Date().toISOString(),winner,word:'Кто',options:['Ai','Gì','Ở đâu'],answer:0};snapshot.match.task={word:'Когда',options:['Khi nào','Ai','Gì']};snapshot.match.score_host=winner==='host'?1:0;snapshot.match.score_guest=winner==='guest'?1:0;
 await advance(300);
 expect(fx.speak).toHaveBeenCalledTimes(1);expect(fx.speak).toHaveBeenCalledWith('questions','Кто');expect(node.querySelector('.is-correct')?.textContent).toBe('Ai');
 expect(node.querySelector('.battle-word')?.textContent).toBe('');expect(node.querySelector('.battle-feedback')?.textContent).toBe('');expect(node.querySelector('.is-correct')?.hasAttribute('disabled')).toBe(true);
 await advance(300);expect(fx.speak).toHaveBeenCalledTimes(1);expect(fx.point).toHaveBeenCalledTimes(winner==='none'?0:1);
 await advance(1800);expect(node.querySelector('.is-correct')).toBeNull();expect(node.querySelector('.battle-word')?.textContent).toBe('Когда');expect(fx.beep.mock.calls.map(c=>c[0])).toEqual([3,2,1]);expect(fx.speak).toHaveBeenCalledTimes(1);
});
it('reveals even a final timeout before switching to the match result',async()=>{
 snapshot.match.status='finished';snapshot.match.round=20;snapshot.match.score_host=8;snapshot.match.score_guest=5;snapshot.match.task=null;snapshot.match.starts_at=new Date(Date.now()+2000).toISOString();snapshot.match.last_result={round:19,at:new Date().toISOString(),winner:'none',word:'Кто',options:['Ai','Gì','Ở đâu'],answer:0};
 await act(async()=>root.render(<BattleScreen onBack={()=>{}}/>));expect(node.querySelector('.is-correct')?.textContent).toBe('Ai');expect(node.querySelector('.battle-result')).toBeNull();expect(fx.speak).toHaveBeenCalledTimes(1);
 await advance(1800);expect(node.querySelector('.battle-result')).not.toBeNull();expect(node.querySelector('.battle-answers')).toBeNull();expect(fx.speak).toHaveBeenCalledTimes(1);
});
