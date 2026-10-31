// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,expect,it} from 'vitest';
import BeginnerApp from '../App';
let root:Root,node:HTMLDivElement;
beforeEach(()=>{node=document.createElement('div');document.body.append(node);root=createRoot(node);(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;});
afterEach(()=>{act(()=>root.unmount());node.remove();});
async function open(admin:boolean){await act(async()=>root.render(<BeginnerApp section="games" isAdmin={admin} onBack={()=>{}}/>));}
async function lesson9(){await act(async()=>Array.from(node.querySelectorAll('button')).find(b=>b.textContent?.includes('Урок 9'))!.click());}
it('opens family and separate house/adjectives games to participants while retaining number-game restrictions',async()=>{
 await open(false);expect(node.textContent).toContain('Урок 10 · Семья');expect(node.textContent).toContain('Урок 11 · Дом');expect(node.textContent).toContain('Урок 11 · Прилагательные');expect(node.textContent).toContain('Урок 8');
 await lesson9();expect(node.textContent).toContain('Цифры 1–10 · Номер телефона');
 for(const hidden of ['Числа 11–99','Числа 100–999','Купюры','Большие числа','Диалоги'])expect(node.textContent).not.toContain(hidden);
 expect(node.querySelectorAll('.game-menu-item')).toHaveLength(1);
});
it('retains family, house and all other number games for admin',async()=>{
 await open(true);expect(node.textContent).toContain('Урок 10');expect(node.textContent).toContain('Урок 11');
 await lesson9();for(const visible of ['Числа 11–99','Числа 100–999','Купюры','Большие числа','Диалоги','Номер телефона'])expect(node.textContent).toContain(visible);
});
it('removes an already-open restricted menu immediately if the admin flag is lost',async()=>{
 await open(true);await lesson9();
 await open(false);expect(node.querySelectorAll('.game-menu-item')).toHaveLength(1);expect(node.textContent).toContain('Номер телефона');
});

it.each([['Урок 11 · Дом','Дом','36'],['Урок 11 · Прилагательные','Прилагательные','38']])('opens %s directly for participants',async(label,title,total)=>{
 await open(false);await act(async()=>Array.from(node.querySelectorAll('button')).find(b=>b.textContent?.includes(label))!.click());
 expect(node.querySelector('h1')?.textContent).toBe(title);
 expect(node.textContent).toContain(total+' заданий');
 expect(node.textContent).not.toContain('Блиц');expect(node.textContent).not.toContain('Обучение');
});
