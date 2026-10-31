// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {beforeEach,expect,it,vi} from 'vitest';
import App from '../App';
vi.mock('../beginner/App',()=>({default:({section,onBack}:{section:string;onBack:()=>void})=><div>Начальный раздел: {section}<button onClick={onBack}>К выбору группы</button></div>}));
beforeEach(()=>{vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});});
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
it.each([['Игра','games','Овощи'],['Аудирование','listening','Поездка в Вунгтау'],['Теория','theory','Теория'],['Карточки','cards','Карточки']])('opens both groups inside %s and returns to the group selector',async(label,section,advanced)=>{
 const node=document.createElement('div'),root=createRoot(node);
 const click=async(text:string)=>{const b=[...node.querySelectorAll('button')].find(b=>b.textContent?.includes(text));expect(b,text).toBeTruthy();await act(async()=>b!.click());};
 try{
 await act(async()=>root.render(<App/>));await click(label);
 expect(node.querySelectorAll('.market-options .big-button')).toHaveLength(2);
 await click('Начальная группа');expect(node.textContent).toContain(`Начальный раздел: ${section}`);
 await click('К выбору группы');await click('Продвинутая группа');expect(node.textContent).toContain(advanced);
 await act(async()=>node.querySelector<HTMLButtonElement>('.back-button')!.click());
 expect(node.textContent).toContain('Начальная группа');expect(node.textContent).toContain('Продвинутая группа');
 }finally{await act(async()=>root.unmount());}
});
it('opens shared phonetics directly without choosing a group',async()=>{
 const node=document.createElement('div'),root=createRoot(node);
 try{await act(async()=>root.render(<App/>));await act(async()=>[...node.querySelectorAll('button')].find(b=>b.textContent==='Фонетика')!.click());expect(node.textContent).not.toContain('Начальная группа');expect(node.querySelector('audio')).toBeTruthy();}finally{await act(async()=>root.unmount());}
});
vi.mock('./VerbsGameScreen',()=>({default:({onBack}:{onBack:()=>void})=><div data-verbs-game>Игра «Глаголы»<button onClick={onBack}>К играм</button></div>}));
it('opens Verbs from the advanced games menu and returns to that menu',async()=>{
 const node=document.createElement('div'),root=createRoot(node);
 const click=async(text:string)=>{const b=[...node.querySelectorAll('button')].find(b=>b.textContent?.includes(text));expect(b).toBeTruthy();await act(async()=>b!.click())};
 try{await act(async()=>root.render(<App/>));await click('Игра');await click('Продвинутая группа');expect(node.textContent).toContain('Глаголы');await click('Глаголы');expect(node.querySelector('[data-verbs-game]')).toBeTruthy();await click('К играм');expect(node.querySelector('.games-menu-keys')).toBeTruthy()}finally{await act(async()=>root.unmount())}
});

vi.mock('./MarketBlitzScreen',()=>({MarketBlitzScreen:({category,onBack}:{category:string;onBack:()=>void})=><div data-produce-game={category}><button onClick={onBack}>К играм</button></div>}));
it('opens fruits and vegetables directly from matching beige menu buttons without mixed superblitz',async()=>{
 const node=document.createElement('div'),root=createRoot(node);
 const click=async(text:string)=>{const b=[...node.querySelectorAll('button')].find(b=>b.textContent?.includes(text));expect(b,text).toBeTruthy();await act(async()=>b!.click());};
 try{
  await act(async()=>root.render(<App/>));await click('Игра');await click('Продвинутая группа');
  for(const [label,category] of [['Овощи','vegetables'],['Фрукты','fruits']]){
   const button=[...node.querySelectorAll('button')].find(b=>b.textContent?.includes(label))!;
   expect(button.classList.contains('games-menu-key')).toBe(true);
   expect(button.classList.contains('big-button')).toBe(false);
   expect(node.textContent).not.toContain('Овощи-фрукты');expect(node.textContent).not.toContain('Суперблиц');
   await click(label);expect(node.querySelector('[data-produce-game]')?.getAttribute('data-produce-game')).toBe(category);
   await click('К играм');expect(node.querySelector('.games-menu-keys')).toBeTruthy();
  }
 }finally{await act(async()=>root.unmount());}
});
