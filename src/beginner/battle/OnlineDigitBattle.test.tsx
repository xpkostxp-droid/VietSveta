import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
const fx=vi.hoisted(()=>({rpc:vi.fn(),result:vi.fn(()=>vi.fn()),digit:vi.fn(()=>vi.fn())}));
vi.mock('../../domain/cloud',()=>({supabase:{rpc:fx.rpc}}));
vi.mock('../../battle/resultAudio',()=>({playBattleResultSound:fx.result,playBattleDigit:fx.digit,readyBattleDigitAudio:vi.fn(),readyBattleResultAudio:vi.fn()}));
vi.mock('../../battle/BattleCourt',()=>({preloadCourt:async()=>{},BattleCourt:()=>null}));
vi.mock('../../battle/BattleStatistics',()=>({BattleStatistics:({onPlay,startLabel}:any)=><section className="battle-statistics"><h2>Статистика батлов</h2><button onClick={onPlay}>{startLabel}</button></section>}));
import BeginnerApp from '../App';
import {BattleScreen} from '../../battle/BattleScreen';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
let host:HTMLDivElement,root:ReturnType<typeof createRoot>,snapshot:any;
beforeEach(()=>{vi.useFakeTimers();vi.clearAllMocks();vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});snapshot={server_now:new Date().toISOString(),online:[{device:'opponent',name:'Светлана',busy:false}],topics:[{id:'digits',title:'Цифры 0–9'}],match:null};fx.rpc.mockImplementation(async()=>({data:structuredClone(snapshot),error:null}));host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.useRealTimers();vi.restoreAllMocks();});
async function click(text:string){await act(async()=>[...host.querySelectorAll('button')].find(b=>b.textContent===text)!.click());}
it('lets every participant open the top battle key and invite another person from the digit wheel',async()=>{
 await act(async()=>root.render(<BeginnerApp section="games" onBack={()=>{}}/>));
 await act(async()=>host.querySelector<HTMLButtonElement>('.games-menu-key-battle')!.click());await click('Начать');
 expect(host.querySelector('[role="listbox"]')?.getAttribute('aria-label')).toBe('Выбери игру');expect(host.querySelectorAll('[role="option"]')).toHaveLength(1);
 expect(host.textContent).toContain('Светлана');await click('Вызвать');
 expect(fx.rpc).toHaveBeenCalledWith('battle_preview',expect.objectContaining({p_action:'invite',p_payload:{course:'beginner',topic:'digits',opponent:'opponent'}}));
 expect(host.textContent).toContain('Тренировка с ботом');
});
it.each(['host','guest'] as const)('shows synchronized words and mirrored scores to the %s player',async(side)=>{
 snapshot.match={id:'m',mode:'digits',topic:'digits',status:'active',side,host_name:'Анна',guest_name:'Борис',round:1,ready_host:true,ready_guest:true,starts_at:new Date(Date.now()-100).toISOString(),task:{word:'bảy',options:['0','1','2','3','4','5','6','7','8','9']},answered:false,score_host:2,score_guest:1,last_result:null,digit_cubes:{host:[1,2],guest:[3]}};
 await act(async()=>root.render(<BattleScreen course="beginner" onBack={()=>{}}/>));
 expect(host.querySelector('.digit-falling-cube')?.textContent).toBe('bảy');expect(host.querySelectorAll('.digit-keypad button')).toHaveLength(10);
 expect(host.querySelector('.digit-score')?.firstElementChild?.textContent).toBe(side==='host'?'Анна2':'Борис1');expect(fx.digit).toHaveBeenCalledWith(7);
 await click('7');expect(fx.rpc).toHaveBeenCalledWith('battle_preview',expect.objectContaining({p_action:'answer',p_payload:expect.objectContaining({course:'beginner',round:1,choice:7})}));
});
it('plays defeat once for the guest when the host collects the eighth cube',async()=>{
 snapshot.match={id:'m',mode:'digits',topic:'digits',status:'finished',side:'guest',host_name:'Анна',guest_name:'Борис',round:12,ready_host:true,ready_guest:true,starts_at:new Date(Date.now()+1700).toISOString(),task:null,answered:false,score_host:8,score_guest:3,last_result:{round:11,starts_at:new Date(Date.now()-2000).toISOString(),at:new Date(Date.now()).toISOString(),word:'hai',answer:2,options:[],winner:'host'},digit_cubes:{host:[1,2,3,4,5,6,7,2],guest:[0,1,0]}};
 await act(async()=>root.render(<BattleScreen course="beginner" onBack={()=>{}}/>));expect(fx.result).toHaveBeenCalledTimes(1);expect(fx.result).toHaveBeenCalledWith('defeat');
 await act(async()=>vi.advanceTimersByTimeAsync(1900));expect(fx.result).toHaveBeenCalledTimes(1);expect(host.querySelector('.digit-score')?.textContent).toContain('Борис3');await click('Реванш');expect(fx.rpc).toHaveBeenCalledWith('battle_preview',expect.objectContaining({p_action:'rematch',p_payload:{course:'beginner',match:'m'}}));
});
