// @vitest-environment jsdom
import {act} from 'react';import {createRoot} from 'react-dom/client';import {expect,it} from 'vitest';import {GroupSelection} from './GroupSelection';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
it.each(['games','listening','theory','cards'] as const)('highlights Konstantin’s beginner group in %s while keeping both choices usable',async section=>{
 const node=document.createElement('div'),root=createRoot(node);let chosen='';
 try{await act(async()=>root.render(<GroupSelection section={section} preferredGroup="beginner" onBack={()=>{}} onChoose={g=>{chosen=g;}}/>));
 const current=node.querySelector<HTMLButtonElement>('[aria-current="true"]')!;expect(current.textContent).toBe('Начальная группа');expect(current.classList.contains('group-preferred')).toBe(true);await act(async()=>current.click());expect(chosen).toBe('beginner');
 const advanced=[...node.querySelectorAll('button')].find(b=>b.textContent==='Продвинутая группа')!;await act(async()=>advanced.click());expect(chosen).toBe('advanced');
 }finally{await act(async()=>root.unmount());}
});
