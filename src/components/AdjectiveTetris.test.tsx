// @vitest-environment jsdom
import {act} from 'react';import{createRoot,type Root}from'react-dom/client';
import{beforeEach,afterEach,expect,it,vi}from'vitest';
import{AdjectiveTetris}from'./AdjectiveTetris';import{adjectiveSets}from'../content/adjectiveSets';
vi.mock('../domain/speech',()=>({speakVietnamese:vi.fn(),stopSpeaking:vi.fn()}));
vi.mock('../domain/countdownSound',()=>({createCountdownSound:()=>({unlock:vi.fn(),beep:vi.fn(),stop:vi.fn(),close:vi.fn()})}));
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
let node:HTMLDivElement,root:Root;
const click=async(label:string)=>{const b=[...node.querySelectorAll('button')].find(b=>b.textContent===label)!;expect(b).toBeTruthy();await act(async()=>b.click());};
const time=async(ms:number)=>{await act(async()=>vi.advanceTimersByTime(ms));};
beforeEach(async()=>{vi.useFakeTimers();localStorage.clear();node=document.createElement('div');root=createRoot(node);await act(async()=>root.render(<AdjectiveTetris onBack={()=>{}}/>));});
afterEach(async()=>{await act(async()=>root.unmount());vi.useRealTimers();});
it('plays all 36 directional tasks and never saves test attempts',async()=>{
 await click('Начать тест');const seen=new Set<string>();
 for(let i=0;i<36;i++){
 const prompt=node.querySelector('.at-prompt strong')!.textContent!;
 const reverse=i%2===1;seen.add(`${prompt}:${reverse}`);
 const pair=adjectiveSets[0].words.find(w=>w[reverse?0:1]===prompt)!;
 await time(100);await click(pair[reverse?1:0]);
 expect(node.querySelectorAll('.at-right')).toHaveLength(1);
 await time(1300);
 }
 expect(seen.size).toBe(36);expect(node.textContent).toContain('36 из 36');expect(node.textContent).toContain('Собрано рядов: 7');
 expect(localStorage.length).toBe(0);
});
it('times out, shows the translation, and continues instead of ending the round',async()=>{
 await click('Начать тест');await time(5000);
 expect(node.querySelector('.at-gray')).toBeTruthy();expect(node.textContent).toContain('Правильный ответ:');
 await time(1300);expect(node.querySelector('.at-top')?.textContent).toContain('2/36');
 expect(node.querySelectorAll('.at-options button:disabled')).toHaveLength(0);
});
