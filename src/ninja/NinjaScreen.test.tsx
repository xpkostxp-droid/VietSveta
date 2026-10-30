import {act,StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
const speech=vi.hoisted(()=>vi.fn());
vi.mock('../domain/speech',()=>({speakVietnamese:speech,stopSpeaking:vi.fn()}));
vi.mock('../battle/battleSpeech',()=>({primeBattleSpeech:vi.fn()}));
import {NinjaScreen} from './NinjaScreen';
import {products} from '../content/marketProducts';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
let node:HTMLDivElement,root:ReturnType<typeof createRoot>;
beforeEach(()=>{localStorage.clear();vi.useFakeTimers();vi.spyOn(Math,'random').mockReturnValue(.99);speech.mockReset();vi.stubGlobal('Image',class {onload:(()=>void)|null=null;onerror:(()=>void)|null=null;set src(_:string){void Promise.resolve().then(()=>this.onload?.());}});node=document.createElement('div');document.body.append(node);root=createRoot(node);});
afterEach(async()=>{await act(async()=>root.unmount());node.remove();vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();});
const click=async(label:string)=>act(async()=>[...node.querySelectorAll('button')].find(b=>b.textContent===label)!.click());
const advance=async(ms:number)=>act(async()=>vi.advanceTimersByTimeAsync(ms));
it('offers the four characters and enters the fixed pickleball layout after assets load',async()=>{
 await act(async()=>root.render(<StrictMode><NinjaScreen onBack={()=>{}}/></StrictMode>));
 expect(node.querySelectorAll('.ninja-character-grid button')).toHaveLength(4);
 await click('Сыграть с ботом');expect(node.querySelector('.ninja-stage')).not.toBeNull();
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
