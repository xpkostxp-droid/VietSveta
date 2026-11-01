// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,expect,it} from 'vitest';
import BeginnerApp from '../App';
let root:Root,node:HTMLDivElement;
beforeEach(()=>{node=document.createElement('div');document.body.append(node);root=createRoot(node);(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;});
afterEach(()=>{act(()=>root.unmount());node.remove();});
async function open(admin:boolean){await act(async()=>root.render(<BeginnerApp section="games" isAdmin={admin} onBack={()=>{}}/>));}
async function lessons(){await act(async()=>Array.from(node.querySelectorAll('button')).find(b=>b.textContent?.includes('Игры по урокам'))!.click());}
async function lesson9(){await act(async()=>Array.from(node.querySelectorAll('button')).find(b=>b.textContent?.includes('Урок 9'))!.click());}
it('puts Listening after Battle and opens the seventeen-syllable game for all participants',async()=>{
 await open(false);
 expect([...node.querySelectorAll('.games-menu-key')].map(b=>b.textContent?.trim())).toEqual(['⚔️ Батл','🎧Аудирование','📚Игры по урокам']);
 await act(async()=>[...node.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent?.includes('Аудирование'))!.click());
 expect(node.querySelector('[aria-label="Игры на аудирование"]')).toBeTruthy();
 await act(async()=>[...node.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent?.includes('Угадай тон'))!.click());
 expect(node.textContent).toContain('17 слогов');expect(node.querySelector('.ranking-start')).toBeTruthy();
 await act(async()=>node.querySelector<HTMLButtonElement>('.back-button')!.click());expect(node.querySelector('[aria-label="Игры на аудирование"]')).toBeTruthy();
 await act(async()=>node.querySelector<HTMLButtonElement>('.back-button')!.click());expect(node.textContent).toContain('Игры по урокам');expect(node.textContent).not.toContain('Урок 5');
});
it('opens family and separate house/adjectives games to participants while retaining number-game restrictions',async()=>{
 await open(false);await lessons();expect(node.textContent).toContain('Урок 10 · Семья');expect(node.textContent).toContain('Урок 11 · Дом');expect(node.textContent).toContain('Урок 11 · Прилагательные');expect(node.textContent).toContain('Урок 8');
 await lesson9();expect(node.textContent).toContain('Цифры 1–10 · Номер телефона');
 for(const hidden of ['Числа 11–99','Числа 100–999','Купюры','Большие числа','Диалоги'])expect(node.textContent).not.toContain(hidden);
 expect(node.querySelectorAll('.game-menu-item')).toHaveLength(1);
});
it('retains family, house and all other number games for admin',async()=>{
 await open(true);await lessons();expect(node.textContent).toContain('Урок 10');expect(node.textContent).toContain('Урок 11');
 await lesson9();for(const visible of ['Числа 11–99','Числа 100–999','Купюры','Большие числа','Диалоги','Номер телефона'])expect(node.textContent).toContain(visible);
});
it('removes an already-open restricted menu immediately if the admin flag is lost',async()=>{
 await open(true);await lessons();await lesson9();
 await open(false);expect(node.querySelectorAll('.game-menu-item')).toHaveLength(1);expect(node.textContent).toContain('Номер телефона');
});

it.each([['Урок 11 · Дом','Дом','36'],['Урок 11 · Прилагательные','Прилагательные','38']])('opens %s directly for participants',async(label,title)=>{
 await open(false);await lessons();await act(async()=>Array.from(node.querySelectorAll('button')).find(b=>b.textContent?.includes(label))!.click());
 expect(node.querySelector('h1')?.textContent).toBe(title);
 expect(node.querySelector('.game-ranking')).toBeTruthy();expect(node.querySelector('img')).toBeNull();expect(node.querySelector('.ranking-start')?.textContent).toBe('Начать');
 expect(node.textContent).not.toContain('Блиц');expect(node.textContent).not.toContain('Обучение');
});

it('nests lesson games and returns through their parent menus',async()=>{
 await open(false);
 expect(node.querySelectorAll('.games-menu-key')).toHaveLength(3);
 expect(node.textContent).not.toContain('Урок 5');
 await lessons();
 expect(node.querySelectorAll('.game-lesson-group')).toHaveLength(7);
 await lesson9();
 await act(async()=>node.querySelector<HTMLButtonElement>('.back-button')!.click());
 expect(node.querySelector('h1')?.textContent).toBe('Игры по урокам');
 await act(async()=>node.querySelector<HTMLButtonElement>('.back-button')!.click());
 expect(node.querySelectorAll('.games-menu-key')).toHaveLength(3);
 expect(node.textContent).not.toContain('Урок 5');
});
