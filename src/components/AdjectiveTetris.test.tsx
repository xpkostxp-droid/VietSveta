// @vitest-environment jsdom
import {act} from 'react';import{createRoot,type Root}from'react-dom/client';
import{beforeEach,afterEach,expect,it,vi}from'vitest';
import{AdjectiveTetris}from'./AdjectiveTetris';import{adjectiveSets}from'../content/adjectiveSets';
vi.mock('../domain/speech',()=>({speakVietnamese:vi.fn(),stopSpeaking:vi.fn()}));
vi.mock('../domain/countdownSound',()=>({createCountdownSound:()=>({unlock:vi.fn(),beep:vi.fn(),stop:vi.fn(),close:vi.fn(),explode:vi.fn()})}));
vi.mock('./GameRanking',()=>({GameRanking:({onStart,result,startLabel,total}:{onStart:()=>void;result?:{correct:number;time:number};startLabel:string;total:number})=><div className="game-ranking"><button onClick={onStart}>{startLabel}</button>{result&&<p>{result.correct} из {total}</p>}</div>}));
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
let node:HTMLDivElement,root:Root;
const click=async(label:string)=>{const b=[...node.querySelectorAll('button')].find(b=>b.textContent===label)!;expect(b).toBeTruthy();await act(async()=>b.click());};
const time=async(ms:number)=>{await act(async()=>vi.advanceTimersByTime(ms));};
beforeEach(async()=>{vi.useFakeTimers();localStorage.clear();node=document.createElement('div');root=createRoot(node);await act(async()=>root.render(<AdjectiveTetris onBack={()=>{}}/>));});
afterEach(async()=>{await act(async()=>root.unmount());vi.useRealTimers();});
it('plays all 36 directional tasks and saves one completed attempt',async()=>{
 await click('Начать');const seen=new Set<string>();
 for(let i=0;i<36;i++){
 const prompt=node.querySelector('.at-prompt strong')!.textContent!;
 const reverse=i%2===1;seen.add(`${prompt}:${reverse}`);
 const pair=adjectiveSets[0].words.find(w=>w[reverse?0:1]===prompt)!;
 await time(100);await click(pair[reverse?1:0]);
 expect(node.querySelectorAll('.at-right')).toHaveLength(1);
 await time(1300);
 }
 expect(seen.size).toBe(36);expect(node.textContent).toContain('36 из 36');
 expect(JSON.parse(localStorage.getItem('vietSveta.timedAttempts.v1')!)).toHaveLength(1);
});
it('times out, shows the translation, and continues instead of ending the round',async()=>{
 await click('Начать');await time(5000);
 expect(node.querySelector('.at-gray')).toBeTruthy();expect(node.textContent).toContain('Правильный ответ:');
 await time(1300);expect(node.querySelector('.at-top')?.textContent).toContain('2/36');
 expect(node.querySelectorAll('.at-options button:disabled')).toHaveLength(0);
});

async function ropeMode(){await act(async()=>root.unmount());root=createRoot(node);await act(async()=>root.render(<AdjectiveTetris variant="rope" onBack={()=>{}}/>));await click('Начать');}
it('rope mode tests all 18 second-set words both ways and saves the result',async()=>{
 await ropeMode();expect(node.querySelector('.at-prompt')).toBeNull();const seen=new Set<string>();
 for(let i=0;i<36;i++){
  const prompt=node.querySelector('.rope-plaque span')!.textContent!,reverse=i%2===1;
  seen.add(`${prompt}:${reverse}`);const pair=adjectiveSets[1].words.find(w=>w[reverse?0:1]===prompt)!;
  expect(pair).toBeTruthy();await time(100);await click(pair[reverse?1:0]);
  expect(node.querySelector('.rope-success')).toBeTruthy();await time(1300);
 }
 expect(seen.size).toBe(36);expect(node.textContent).toContain('36 из 36');expect(node.textContent).not.toContain('Собрано рядов');expect(JSON.parse(localStorage.getItem('vietSveta.timedAttempts.v1')!)).toHaveLength(1);
});
it('rope breaks before revealing a wrong answer and continues after a timeout',async()=>{
 await ropeMode();const prompt=node.querySelector('.rope-plaque span')!.textContent!;
 const pair=adjectiveSets[1].words.find(w=>w[1]===prompt)!;
 const wrong=[...node.querySelectorAll<HTMLButtonElement>('.at-options button')].find(b=>b.textContent!==pair[0])!;
 await act(async()=>wrong.click());expect(node.querySelector('.rope-failed')).toBeTruthy();
 expect(node.querySelector('.at-feedback')!.textContent!.trim()).toBe('');expect(node.querySelector('.at-right')).toBeNull();
 await time(699);expect(node.querySelector('.at-right')).toBeNull();await time(1);expect(node.querySelector('.at-feedback')!.textContent).toContain(pair[0]);
 await time(1300);expect(node.querySelector('.at-top')!.textContent).toContain('2/36');
 await time(5000);expect(node.querySelector('.rope-failed')).toBeTruthy();await time(700);expect(node.querySelector('.at-right')).toBeTruthy();await time(1300);expect(node.querySelector('.at-top')!.textContent).toContain('3/36');
});
async function cannonMode(){await act(async()=>root.unmount());root=createRoot(node);await act(async()=>root.render(<AdjectiveTetris variant="cannon" onBack={()=>{}}/>));expect(node.textContent).toContain('Вкусы, ощущения и погода');await click('Начать');}
it('cannon covers all 34 third-set tasks and saves the completed result',async()=>{
 await cannonMode();const seen=new Set<string>();
 for(let i=0;i<34;i++){
  const prompt=node.querySelector('.cannon-word span')!.textContent!,reverse=i%2===1;
  seen.add(`${prompt}:${reverse}`);const pair=adjectiveSets[2].words.find(w=>w[reverse?0:1]===prompt)!;
  expect(pair).toBeTruthy();await time(100);await click(pair[reverse?1:0]);expect(node.querySelector('.cannon-ball')).toBeTruthy();await time(1300);
 }
 expect(seen.size).toBe(34);expect(node.textContent).toContain('34 из 34');expect(JSON.parse(localStorage.getItem('vietSveta.timedAttempts.v1')!)).toHaveLength(1);
});
it('cannon gets crushed before revealing the translation and then continues',async()=>{
 await cannonMode();await time(5000);expect(node.querySelector('.cannon-failed')).toBeTruthy();expect(node.querySelector('.at-right')).toBeNull();
 await time(700);expect(node.querySelector('.at-right')).toBeTruthy();await time(1300);expect(node.querySelector('.at-top')!.textContent).toContain('2/34');expect(node.querySelector('.cannon-question')).toBeTruthy();
});
