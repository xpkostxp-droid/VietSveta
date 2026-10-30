import {beforeEach,afterEach,expect,it,vi} from 'vitest';
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {ProfileScreen} from './ProfileScreen';
import {memberRequest} from '../domain/cloud';
vi.mock('../domain/cloud',()=>({memberRequest:vi.fn(),syncAccount:vi.fn(async()=>{})}));
vi.mock('../battle/AdminBattleLab',()=>({AdminBattleLab:()=>null}));
vi.mock('./ProfileGameLauncher',()=>({ProfileGameLauncher:({game,onBack}:any)=><div>Игра: {game}<button onClick={onBack}>К профилю</button></div>}));
let node:HTMLDivElement,root:Root;
const base={user_id:'user',display_name:'Светлана',is_admin:false,id:'svetlana'};
beforeEach(()=>{
 vi.clearAllMocks();localStorage.clear();vi.spyOn(window,'scrollTo').mockImplementation(()=>{});
 (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;node=document.createElement('div');document.body.append(node);root=createRoot(node);
 vi.mocked(memberRequest).mockImplementation(async(body:any)=>{
  if(body.action==='admin-overview')return {participants:[],states:[],attempts:[]};
  if(body.game==='harvest-fruits')return {rows:[{id:'svetlana',name:'Светлана',best:{correct:10,correct_time_ms:1000}}]};
  if(body.game==='harvest-vegetables')return {rows:[1,2,3,4].map(n=>({id:n===4?'svetlana':String(n),name:'Игрок',best:{correct:10-n,correct_time_ms:1000}}))};
  return {rows:[{id:'svetlana',name:'Светлана',best:null}]};
 });
});
afterEach(()=>{act(()=>root.unmount());node.remove();vi.restoreAllMocks();});
const render=async(member=base)=>act(async()=>{root.render(<ProfileScreen member={member} status="Сохранено" onBack={()=>{}} onLogout={()=>{}} busy={false}/>);});
it('groups current medals and unplayed games, hides participant logout, opens exact game and returns',async()=>{
 await render();
 expect(node.textContent).not.toContain('Выйти из учётной записи');
 const sections=node.querySelectorAll('.profile-achievement-section');
 expect(sections[0].textContent).toContain('Фрукты');expect(sections[3].textContent).toContain('4-е место');
 expect(sections[4].textContent).toContain('Профессии');expect(Array.from(sections[4].querySelectorAll('button')).some(b=>b.textContent==='Фрукты→')).toBe(false);
 await act(async()=>Array.from(sections[4].querySelectorAll('button')).find(b=>b.textContent?.includes('Профессии'))!.click());
 expect(node.textContent).toContain('Игра: lesson5-professions');
 await act(async()=>node.querySelector('button')!.click());expect(node.textContent).toContain('Мои достижения');
});
it('does not classify a failed ranking as unplayed and offers retry',async()=>{
 vi.mocked(memberRequest).mockRejectedValue(new Error('offline'));await render();
 expect(node.querySelector('.profile-achievement-error')).toBeTruthy();
 expect(node.querySelectorAll('.profile-game-link')).toHaveLength(0);
});
it.each([['admin',true]] as const)('preserves the old %s profile and logout',async(id,is_admin)=>{
 await render({...base,id,is_admin});
 expect(node.textContent).toContain('Выйти из учётной записи');expect(node.textContent).not.toContain('Мои достижения');
 expect(vi.mocked(memberRequest).mock.calls.some(([b])=>b.action==='leaderboard')).toBe(false);
});

it('shows Konstantin achievements while preserving logout and profile switching',async()=>{
 const switchProfile=vi.fn();
 await act(async()=>root.render(<ProfileScreen member={{...base,id:'konstantin'}} status="Сохранено" onBack={()=>{}} onLogout={()=>{}} onSwitch={switchProfile} busy={false}/>));
 expect(node.textContent).toContain('Мои достижения');
 expect(node.textContent).toContain('Выйти из учётной записи');
 await act(async()=>Array.from(node.querySelectorAll('button')).find(b=>b.textContent==='Переключить профиль')!.click());
 expect(switchProfile).toHaveBeenCalledOnce();
});
