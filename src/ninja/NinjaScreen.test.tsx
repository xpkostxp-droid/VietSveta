import {act,StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
const speech=vi.hoisted(()=>vi.fn());
const beep=vi.hoisted(()=>vi.fn());
vi.mock('./ninjaSound',()=>({createNinjaSound:()=>({ready:vi.fn(),beep,play:vi.fn(),close:vi.fn()})}));
vi.mock('../domain/speech',()=>({speakVietnamese:speech,stopSpeaking:vi.fn()}));
vi.mock('../battle/battleSpeech',()=>({primeBattleSpeech:vi.fn()}));
import {NinjaScreen} from './NinjaScreen';
import {products} from '../content/marketProducts';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
let node:HTMLDivElement,root:ReturnType<typeof createRoot>;
beforeEach(()=>{localStorage.clear();vi.useFakeTimers();vi.spyOn(Math,'random').mockReturnValue(.99);speech.mockReset();beep.mockReset();vi.stubGlobal('Image',class {onload:(()=>void)|null=null;onerror:(()=>void)|null=null;set src(_:string){void Promise.resolve().then(()=>this.onload?.());}});node=document.createElement('div');document.body.append(node);root=createRoot(node);});
afterEach(async()=>{await act(async()=>root.unmount());node.remove();vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();});
const click=async(label:string)=>act(async()=>[...node.querySelectorAll('button')].find(b=>b.textContent===label)!.click());
const advance=async(ms:number)=>act(async()=>vi.advanceTimersByTimeAsync(ms));
it('assigns different male characters automatically and enters the fixed pickleball layout after assets load',async()=>{
 await act(async()=>root.render(<StrictMode><NinjaScreen onBack={()=>{}}/></StrictMode>));
 expect(node.querySelectorAll('.ninja-character-grid button')).toHaveLength(0);
 expect(node.textContent).not.toContain('Выбери персонажа');
 await click('Сыграть с ботом');expect(node.querySelector('.ninja-stage')).not.toBeNull();
 const characters=[...node.querySelectorAll<HTMLElement>('.ninja-actor')].map(n=>n.dataset.character);
 expect(characters.every(id=>id?.endsWith('-man'))).toBe(true);expect(new Set(characters).size).toBe(2);
 const top=node.querySelector('.battle-topbar')!,stage=node.querySelector('.ninja-stage')!,score=node.querySelector('.battle-score')!;
 expect(top.contains(node.querySelector('.battle-round'))).toBe(true);
 expect(top.compareDocumentPosition(stage)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();expect(stage.compareDocumentPosition(score)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 expect(JSON.parse(localStorage.getItem('vietSveta.ninja.words.v1:fruits')!)).toHaveLength(10);
 expect(speech).not.toHaveBeenCalled();await advance(3100);expect(node.querySelectorAll('.battle-answers button:not(:disabled)')).toHaveLength(3);
});
it('speaks only after a correct human answer and animates the fruit split',async()=>{
 await act(async()=>root.render(<NinjaScreen onBack={()=>{}}/>));await click('Сыграть с ботом');await advance(3100);
 const img=node.querySelector('.ninja-produce img') as HTMLImageElement,p=Number(img.src.match(/produce-(\d+)/)![1]);
 await click(products[p][1]);expect(speech).not.toHaveBeenCalled();await advance(220);
 expect(speech).toHaveBeenCalledWith(products[p][1]);expect(node.querySelectorAll('.ninja-half')).toHaveLength(2);expect(node.querySelector('.battle-score strong')!.textContent).toBe('1');
});
it('keeps the remaining time after a human miss without speaking or awarding a point',async()=>{
 await act(async()=>root.render(<NinjaScreen onBack={()=>{}}/>));await click('Сыграть с ботом');await advance(3100);
 const img=node.querySelector('.ninja-produce img') as HTMLImageElement,p=Number(img.src.match(/produce-(\d+)/)![1]);
 const wrong=[...node.querySelectorAll<HTMLButtonElement>('.battle-answers button')].find(b=>b.textContent!==products[p][1])!;
 await act(async()=>wrong.click());await advance(500);expect(speech).not.toHaveBeenCalled();expect(node.textContent).toContain('У бота ещё есть время');expect(node.querySelector('.battle-score strong')!.textContent).toBe('0');expect(node.querySelectorAll('.ninja-half')).toHaveLength(0);
});
it('interrupts a match when the page is hidden',async()=>{
 await act(async()=>root.render(<NinjaScreen onBack={()=>{}}/>));await click('Сыграть с ботом');
 const spy=vi.spyOn(document,'hidden','get').mockReturnValue(true);await act(async()=>document.dispatchEvent(new Event('visibilitychange')));expect(node.textContent).toContain('Матч прерван');spy.mockRestore();
});

it('plays exactly three startup beeps and does not beep between questions',async()=>{
 await act(async()=>root.render(<StrictMode><NinjaScreen onBack={()=>{}}/></StrictMode>));await click('Сыграть с ботом');
 expect(beep.mock.calls.map(c=>c[0])).toEqual([3]);await advance(1030);expect(beep.mock.calls.map(c=>c[0])).toEqual([3,2]);await advance(1000);expect(beep.mock.calls.map(c=>c[0])).toEqual([3,2,1]);
 await advance(3100);await advance(2500);expect(beep.mock.calls.map(c=>c[0])).toEqual([3,2,1]);
});
it('automatically assigns two different women for Svetlana',async()=>{
 await act(async()=>root.render(<NinjaScreen memberId="svetlana" onBack={()=>{}}/>));await click('Сыграть с ботом');
 const characters=[...node.querySelectorAll<HTMLElement>('.ninja-actor')].map(n=>n.dataset.character);
 expect(characters.every(id=>id?.endsWith('-woman'))).toBe(true);expect(new Set(characters).size).toBe(2);
});
it('shows preparation only at startup and reveals a dropped fruit without points',async()=>{
 await act(async()=>root.render(<NinjaScreen onBack={()=>{}}/>));await click('Сыграть с ботом');
 expect(node.textContent).toContain('Приготовься!');await advance(3100);
 expect(node.textContent).not.toContain('Приготовься!');expect(node.textContent).not.toContain('Как это называется?');
 const img=node.querySelector('.ninja-produce img') as HTMLImageElement,p=Number(img.src.match(/produce-(\d+)/)![1]);
 await advance(4900);expect(speech).not.toHaveBeenCalled();await advance(400);await advance(1);
 expect(speech).toHaveBeenCalledTimes(1);expect(speech).toHaveBeenCalledWith(products[p][1]);expect(node.querySelector('.is-correct')?.textContent).toBe(products[p][1]);
 expect([...node.querySelectorAll('.battle-score strong')].map(n=>n.textContent)).toEqual(['0','0']);
 await advance(1400);expect(node.querySelector('.ninja-prepare')).toBeNull();expect(node.querySelector('.is-correct')).toBeNull();
});
it('speaks and highlights the correct answer when the bot slices the fruit',async()=>{
 vi.mocked(Math.random).mockReturnValue(0);
 await act(async()=>root.render(<NinjaScreen onBack={()=>{}}/>));await click('Сыграть с ботом');await advance(3100);
 const img=node.querySelector('.ninja-produce img') as HTMLImageElement,p=Number(img.src.match(/produce-(\d+)/)![1]);
 await advance(1100);await advance(1);expect(speech).toHaveBeenCalledTimes(1);expect(speech).toHaveBeenCalledWith(products[p][1]);
 expect(node.querySelector('.is-correct')?.textContent).toBe(products[p][1]);expect([...node.querySelectorAll('.battle-score strong')].map(n=>n.textContent)).toEqual(['0','1']);
});
