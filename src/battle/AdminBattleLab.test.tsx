import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {beforeEach,afterEach,expect,it,vi} from 'vitest';
const fx=vi.hoisted(()=>({rpc:vi.fn(),member:vi.fn()}));
vi.mock('../domain/cloud',()=>({supabase:{rpc:fx.rpc},memberRequest:fx.member}));
vi.mock('../domain/speech',()=>({hasVietnameseVoice:()=>true,onVoicesChanged:()=>()=>{},stopSpeaking:vi.fn(),speakVietnamese:vi.fn()}));
vi.mock('./battleSpeech',()=>({primeBattleSpeech:vi.fn(),speakBattleWord:vi.fn()}));
import {AdminBattleLab} from './AdminBattleLab';
import {ProfileScreen} from '../components/ProfileScreen';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
let node:HTMLDivElement,root:ReturnType<typeof createRoot>;
beforeEach(()=>{
 vi.useFakeTimers();vi.clearAllMocks();localStorage.clear();fx.member.mockResolvedValue({participants:[],states:[],attempts:[]});
 vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(null);
 vi.stubGlobal('Image',class {onload:(()=>void)|null=null;onerror:(()=>void)|null=null;set src(_:string){void Promise.resolve().then(()=>this.onload?.());}});
 node=document.createElement('div');document.body.append(node);root=createRoot(node);
});
afterEach(async()=>{await act(async()=>root.unmount());expect(fx.rpc).not.toHaveBeenCalled();node.remove();vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();});
const click=async(text:string)=>act(async()=>[...node.querySelectorAll('button')].find(b=>b.textContent===text)!.click());
const gender=async(value:string)=>act(async()=>{const select=node.querySelector('select')!;select.value=value;select.dispatchEvent(new Event('change',{bubbles:true}));});
it.each([true,false])('shows the profile lab button only when administrator=%s',async(is_admin)=>{
 await act(async()=>root.render(<ProfileScreen member={{id:is_admin?'admin':'svetlana',user_id:'test',display_name:'Профиль',is_admin,course_group:'advanced'}} status="" onBack={()=>{}} onLogout={()=>{}} busy={false}/>));
 expect(node.textContent?.includes('🤖 Проверить игры с ботом')).toBe(is_admin);
 if(is_admin){await click('🤖 Проверить игры с ботом');expect(node.querySelector('select')?.value).toBe('man');}
});
it('does not render the lab for a non-admin even if directly mounted',async()=>{
 await act(async()=>root.render(<AdminBattleLab isAdmin={false} onBack={()=>{}}/>));expect(node.textContent).toBe('');
});
it.each([['man',0,'red-man'],['man',.99,'teal-man'],['woman',0,'teal-woman'],['woman',.99,'red-woman']])('can preview %s bot %s as %s without server requests',async(selected,random,character)=>{
 vi.spyOn(Math,'random').mockReturnValue(Number(random));
 await act(async()=>root.render(<AdminBattleLab isAdmin onBack={()=>{}}/>));await gender(String(selected));await click('Начать проверку');
 expect(node.querySelector<HTMLElement>('.ninja-actor-bot')?.dataset.character).toBe(character);
 await act(async()=>vi.advanceTimersByTimeAsync(3100));
 const answer=node.querySelector('.ninja-answers button') as HTMLButtonElement;expect(answer.disabled).toBe(false);await act(async()=>answer.click());
 await act(async()=>vi.advanceTimersByTimeAsync(400));expect(fx.rpc).not.toHaveBeenCalled();
});
it.each(['man','woman'])('uses a %s pickleball bot, accepts answers and stays entirely local',async(selected)=>{
 await act(async()=>root.render(<AdminBattleLab isAdmin onBack={()=>{}}/>));await gender(selected);await click('Вопросительные слова');await click('Начать проверку');
 expect(node.querySelector('.battle-court')?.getAttribute('data-far-gender')).toBe(selected);
 await act(async()=>vi.advanceTimersByTimeAsync(3100));const answer=node.querySelector('.battle-answers button') as HTMLButtonElement;expect(answer.disabled).toBe(false);await act(async()=>answer.click());
 await act(async()=>vi.advanceTimersByTimeAsync(5500));expect(fx.rpc).not.toHaveBeenCalled();
 await click('Завершить батл');await click('← К настройкам бота');expect(node.querySelector('select')?.value).toBe(selected);
});
