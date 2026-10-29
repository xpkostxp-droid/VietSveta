// @vitest-environment jsdom
import {act} from 'react';import{createRoot}from'react-dom/client';import{expect,it}from'vitest';import App from '../App';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
it('shows the prototype only to admin and enables all three sets',async()=>{
 const node=document.createElement('div');let root=createRoot(node);
 const click=async(text:string)=>{const b=[...node.querySelectorAll('button')].find(b=>b.textContent?.includes(text))!;expect(b).toBeTruthy();await act(async()=>b.click());};
 await act(async()=>root.render(<App memberId="svetlana" isAdmin={false}/>));await click('Игра');expect(node.textContent).not.toContain('Прилагательные');await act(async()=>root.unmount());
 root=createRoot(node);await act(async()=>root.render(<App memberId="konstantin" isAdmin/>));await click('Игра');await click('Прилагательные');
 const sets=[...node.querySelectorAll<HTMLButtonElement>('.lesson-item')];expect(sets).toHaveLength(3);expect(sets.map(b=>b.disabled)).toEqual([false,false,false]);await click('Размер, предметы');expect(node.textContent).toContain('Начать тест');await act(async()=>root.unmount());
});
