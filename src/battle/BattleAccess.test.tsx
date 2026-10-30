import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect,it,vi } from 'vitest';
import App from '../App';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
it.each([['admin',true,true],['svetlana',false,true],['konstantin',false,true],['sergey-p',false,true],['lesya',false,true],['marina',false,true],['sergey-k',false,true],['artur',false,true]] as const)('opens Battle to %s and removes the separate bot entry',async(memberId,isAdmin,visible)=>{
 vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});
 const node=document.createElement('div'),root=createRoot(node);
 const click=async(text:string)=>{await act(async()=>[...node.querySelectorAll('button')].find(b=>b.textContent?.includes(text))!.click());};
 try{
 await act(async()=>root.render(<App memberId={memberId} isAdmin={isAdmin}/>));
 await click('Игра');await click('Продвинутая группа');
 expect(node.textContent?.includes('⚔️ Батл')).toBe(visible);
 expect(node.textContent?.includes('Ниндзя · с ботом')).toBe(false);
 }finally{await act(async()=>root.unmount());vi.restoreAllMocks();}
});
