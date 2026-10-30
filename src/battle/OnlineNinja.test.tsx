import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {beforeEach,afterEach,expect,it,vi} from 'vitest';
const fx=vi.hoisted(()=>({rpc:vi.fn(),beep:vi.fn(),play:vi.fn(),speak:vi.fn()}));
vi.mock('./BattleCourt',()=>({preloadCourt:async()=>{},BattleCourt:()=>null}));
vi.mock('../domain/cloud',()=>({supabase:{rpc:fx.rpc}}));
vi.mock('../ninja/ninjaSound',()=>({createNinjaSound:()=>({ready:vi.fn(),close:vi.fn(),beep:fx.beep,play:fx.play})}));
vi.mock('../domain/speech',()=>({hasVietnameseVoice:()=>true,onVoicesChanged:()=>()=>{},stopSpeaking:vi.fn(),speakVietnamese:fx.speak}));
vi.mock('./battleSpeech',()=>({primeBattleSpeech:vi.fn(),speakBattleWord:vi.fn()}));
import {BattleScreen} from './BattleScreen';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
let node:HTMLDivElement,root:ReturnType<typeof createRoot>,snapshot:any;
beforeEach(()=>{
 vi.useFakeTimers();vi.clearAllMocks();vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});
 vi.stubGlobal('Image',class {onload:(()=>void)|null=null;onerror:(()=>void)|null=null;set src(_:string){void Promise.resolve().then(()=>this.onload?.());}});
 snapshot={server_now:new Date().toISOString(),topics:[],online:[],match:{id:'ninja-online',mode:'ninja',topic:'fruits',status:'active',side:'host',round:0,base_rounds:10,starts_at:new Date(Date.now()+3000).toISOString(),ready_host:true,ready_guest:true,host_name:'Сергей',guest_name:'Марина',host_character:'teal-man',guest_character:'red-woman',task:{word:'банан',options:['táo','chuối','xoài']},answered:false,score_host:0,score_guest:0,last_result:null,attempts:[]}};
 fx.rpc.mockImplementation(async()=>({data:structuredClone(snapshot),error:null}));node=document.createElement('div');document.body.append(node);root=createRoot(node);
});
afterEach(async()=>{await act(async()=>root.unmount());node.remove();vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();});
const advance=async(ms:number)=>act(async()=>vi.advanceTimersByTimeAsync(ms));
it('routes an online ninja match into the arena with both actual participants and server answers',async()=>{
 await act(async()=>root.render(<BattleScreen onBack={()=>{}}/>));
 expect(node.querySelector('.ninja-stage')).not.toBeNull();expect(node.querySelector('.battle-court')).toBeNull();expect(node.querySelector('video')).toBeNull();
 expect(node.textContent).toContain('Сергей');expect(node.textContent).toContain('Марина');expect(node.textContent).not.toContain('Бот');expect(node.textContent).not.toContain('банан');
 expect(fx.beep.mock.calls.map(c=>c[0])).toEqual([3]);await advance(1000);await advance(1000);await advance(1100);
 expect(fx.beep.mock.calls.map(c=>c[0])).toEqual([3,2,1]);expect(fx.speak).not.toHaveBeenCalled();
 await act(async()=>{(node.querySelectorAll('.ninja-answers button')[1] as HTMLButtonElement).click();});
 expect(fx.rpc).toHaveBeenCalledWith('battle_preview',expect.objectContaining({p_action:'answer',p_payload:expect.objectContaining({match:'ninja-online',round:0,choice:1})}));expect(fx.speak).not.toHaveBeenCalled();
});
it.each(['guest','none'])('reveals and pronounces a %s result to both players',async(winner)=>{
 const now=Date.now(),started=new Date(now-2000).toISOString();snapshot.match.round=1;snapshot.match.starts_at=new Date(now+2000).toISOString();
 snapshot.match.last_result={round:0,starts_at:started,at:new Date(now).toISOString(),winner,word:'банан',options:['táo','chuối','xoài'],answer:1,misses:[]};
 snapshot.match.task={word:'яблоко',options:['táo','chuối','xoài']};snapshot.match.score_guest=winner==='guest'?1:0;
 await act(async()=>root.render(<BattleScreen onBack={()=>{}}/>));await advance(350);
 expect(fx.speak).toHaveBeenCalledTimes(1);expect(fx.speak).toHaveBeenCalledWith('chuối');expect(node.querySelector('.is-correct')?.textContent).toBe('chuối');
 expect(node.querySelector('.ninja-produce')?.getAttribute('aria-label')).toBe('банан');
 await advance(300);expect(fx.speak).toHaveBeenCalledTimes(1);
});
it('waits for arena loading before telling the server that the client is ready',async()=>{
 const loads:(()=>void)[]=[];vi.stubGlobal('Image',class {onload:(()=>void)|null=null;onerror:(()=>void)|null=null;set src(_:string){loads.push(()=>this.onload?.());}});snapshot.match.starts_at=null;
 await act(async()=>root.render(<BattleScreen onBack={()=>{}}/>));expect(fx.rpc.mock.calls.some(c=>c[1]?.p_action==='ready')).toBe(false);
 await act(async()=>loads.forEach(load=>load()));expect(fx.rpc).toHaveBeenCalledWith('battle_preview',expect.objectContaining({p_action:'ready',p_payload:{match:'ninja-online'}}));
});
