import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect,it,vi } from 'vitest';
import App from '../App';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
it.each([['admin',true,true],['svetlana',false,true],['konstantin',false,false],['sergey-p',false,false]] as const)('limits preview entry for %s',async(memberId,isAdmin,visible)=>{
 vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});
 const node=document.createElement('div'),root=createRoot(node);
 const click=async(text:string)=>{await act(async()=>[...node.querySelectorAll('button')].find(b=>b.textContent?.includes(text))!.click());};
 try{
 await act(async()=>root.render(<App memberId={memberId} isAdmin={isAdmin}/>));
 await click('Игра');await click('Продвинутая группа');
 expect(node.textContent?.includes('Батл · пробный')).toBe(visible);
 }finally{await act(async()=>root.unmount());vi.restoreAllMocks();}
});
