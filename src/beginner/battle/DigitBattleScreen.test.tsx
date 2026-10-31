import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import BeginnerApp from '../App';
import { phoneDigitWords } from '../content/games/phone';
vi.mock('../components/gameSounds',()=>({makeGameSound:()=>({ready:vi.fn(),beep:vi.fn(),crash:vi.fn(),close:vi.fn()})}));
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
let host:HTMLDivElement,root:ReturnType<typeof createRoot>;
beforeEach(()=>{vi.useFakeTimers();vi.spyOn(Math,'random').mockReturnValue(.9);host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(()=>{act(()=>root.unmount());host.remove();vi.useRealTimers();vi.restoreAllMocks();});
function click(text:string){act(()=>[...host.querySelectorAll('button')].find(b=>b.textContent===text)!.click());}
it('hides the test from participants and gates an already-open game if admin access is removed',()=>{
 act(()=>root.render(<BeginnerApp section="games" onBack={()=>{}}/>));expect(host.textContent).not.toContain('Батл · Цифры');
 act(()=>root.render(<BeginnerApp section="games" isAdmin onBack={()=>{}}/>));
 act(()=>[...host.querySelectorAll('button')].find(b=>b.textContent?.includes('Батл · Цифры'))!.click());click('Сыграть с ботом');expect(host.querySelector('.digit-glass')).not.toBeNull();
 act(()=>root.render(<BeginnerApp section="games" onBack={()=>{}}/>));expect(host.querySelector('.digit-glass')).toBeNull();expect(host.textContent).not.toContain('Батл · Цифры');
});
it('plays a full eight-cube match, keeps scores below the glass and has no bottom exit',()=>{
 act(()=>root.render(<BeginnerApp section="games" isAdmin memberName="Константин" onBack={()=>{}}/>));
 act(()=>[...host.querySelectorAll('button')].find(b=>b.textContent?.includes('Батл · Цифры'))!.click());click('Сыграть с ботом');
 expect([...host.querySelectorAll('.digit-keypad button')].map(b=>b.textContent)).toEqual(['1','2','3','4','5','6','7','8','9','0']);expect(host.textContent).not.toContain('Завершить');
 for(let i=0;i<8;i++){
  act(()=>vi.advanceTimersByTime(i===0?3003:1815));
  const word=host.querySelector('.digit-falling-cube')!.textContent!;click(String(phoneDigitWords.indexOf(word)));
 }
 act(()=>vi.advanceTimersByTime(1155));
 expect(host.textContent).toContain('Ты победил!');expect(host.querySelectorAll('.digit-stack-human .digit-small-cube')).toHaveLength(8);expect(host.querySelector('.digit-score')?.textContent).toContain('Константин8');
 expect(host.querySelector('.digit-glass')!.nextElementSibling).toBe(host.querySelector('.digit-score'));
 expect(host.querySelectorAll('.digit-keypad button')).toHaveLength(10);click('Реванш с ботом');expect(host.querySelector('.digit-score')?.textContent).toContain('Константин0');
});
