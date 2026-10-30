// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {PhoneGameScreen} from './PhoneGameScreen';
import {phoneBlitzNumbers,phoneDigitWords} from '../content/games/phone';
const mocks=vi.hoisted(()=>({beep:vi.fn(),ready:vi.fn(),close:vi.fn(),save:vi.fn(),play:vi.fn(async()=>{})}));
vi.mock('./gameSounds',()=>({makeGameSound:()=>mocks}));
vi.mock('../content/games/phoneTone',()=>({phoneToneUrl:()=> 'blob:phone'}));
vi.mock('../../domain/answerTime',()=>({saveTimedAttempt:mocks.save}));
vi.mock('../../components/GameRanking',()=>({GameRanking:({onStart,result}:any)=><div>Рейтинг{result&&<span>Результат: {result.correct}/20</span>}<button onClick={onStart}>Начать</button></div>}));
let root:Root,node:HTMLDivElement;
beforeEach(()=>{vi.useFakeTimers();vi.clearAllMocks();vi.spyOn(HTMLMediaElement.prototype,'play').mockImplementation(mocks.play);vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});URL.revokeObjectURL=vi.fn();node=document.createElement('div');document.body.append(node);root=createRoot(node);(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;});
afterEach(()=>{act(()=>root.unmount());node.remove();vi.restoreAllMocks();vi.useRealTimers();});
async function click(text:string){await act(async()=>Array.from(node.querySelectorAll('button')).find(b=>b.textContent===text)!.click());}
async function time(ms:number){await act(async()=>{vi.advanceTimersByTime(ms);});}
function digit(){return Number(node.querySelector('audio')!.getAttribute('src')!.match(/(?:vi-|ru-)?(\d)\.mp3/)![1]);}
async function choose(value:number){await act(async()=>node.querySelector<HTMLButtonElement>(`[data-digit="${value}"]`)!.click());}
it('generates two distinct random ten-digit numbers, including with constant randomness',()=>{
 const pairs=Array.from({length:10},()=>phoneBlitzNumbers());expect(new Set(pairs.flat()).size).toBeGreaterThan(2);
 vi.spyOn(Math,'random').mockReturnValue(0);const pair=phoneBlitzNumbers();expect(pair).toHaveLength(2);expect(pair[0]).not.toBe(pair[1]);expect(pair.every(p=>/^0\d{9}$/.test(p))).toBe(true);
});
it('plays two directions, calls after each number and saves only one completed twenty-digit attempt',async()=>{
 await act(async()=>root.render(<PhoneGameScreen onBack={()=>{}}/>));expect(node.textContent).toContain('Рейтинг');await click('Начать');
 for(let i=0;i<20;i++){
  const d=digit();const key=node.querySelector(`[data-digit="${d}"]`)!;
  expect(key.textContent).toBe(i<10?String(d):phoneDigitWords[d]);
  if(i>=10)expect(node.querySelector('.phone-blitz-prompt strong')!.textContent).toBe(String(d));
  await time(200);await choose(d);await time(800);
  if(i===9||i===19){expect(node.textContent).toContain('Звоним');expect(mocks.save).not.toHaveBeenCalled();await time(3300);}
 }
 expect(node.textContent).toContain('Результат: 20/20');expect(mocks.save).toHaveBeenCalledTimes(1);
 expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({game:'lesson9-phone',total:20,correct:20,correctTimeMs:4000,completed:true}));
});
it('beeps at three, two, one, keeps a wrong digit retryable and advances on timeout without a point',async()=>{
 await act(async()=>root.render(<PhoneGameScreen onBack={()=>{}}/>));await click('Начать');
 await choose((digit()+1)%10);expect(node.textContent).toContain('Не та цифра');
 await time(4000);expect(mocks.beep.mock.calls.map(c=>c[0])).toEqual([3,2,1]);
 await choose(digit());expect(node.textContent).toContain('Без балла');await time(800);
 await time(5000);expect(node.textContent).toContain('Без балла');await time(800);
 expect(node.querySelector('.phone-blitz-status')!.textContent).toContain('3/20 · ✓ 0');
});
it('does not start a timer without audio playback and can retry a blocked recording',async()=>{
 mocks.play.mockRejectedValueOnce(new Error('blocked'));
 await act(async()=>root.render(<PhoneGameScreen onBack={()=>{}}/>));await click('Начать');await time(6000);
 expect(node.textContent).toContain('Не удалось включить звук');expect(mocks.beep).not.toHaveBeenCalled();
 await click('Повторить цифру');expect(node.textContent).toContain('Набирай номер');
});
it('pauses the countdown in the background until explicit resume',async()=>{
 await act(async()=>root.render(<PhoneGameScreen onBack={()=>{}}/>));await click('Начать');await time(1000);
 Object.defineProperty(document,'hidden',{configurable:true,value:true});await act(async()=>document.dispatchEvent(new Event('visibilitychange')));await time(10000);
 expect(node.textContent).toContain('Игра на паузе');Object.defineProperty(document,'hidden',{configurable:true,value:false});await click('Продолжить');
 await time(1000);await choose(digit());expect(node.textContent).toContain('✓ Верно!');
});

it('never reveals future digits after a correct answer, wrong press or timeout',async()=>{
 await act(async()=>root.render(<PhoneGameScreen onBack={()=>{}}/>));await click('Начать');
 const slots=()=>Array.from(node.querySelectorAll('.phone-digits span')).map(n=>n.textContent);
 expect(slots()).toEqual(Array(10).fill('·'));
 await choose((digit()+1)%10);expect(slots()).toEqual(Array(10).fill('·'));
 await choose(digit());expect(slots()[0]).not.toBe('·');expect(slots().slice(1)).toEqual(Array(9).fill('·'));
 await time(800);expect(slots().slice(1)).toEqual(Array(9).fill('·'));
 await time(5000);expect(slots()[1]).not.toBe('·');expect(slots().slice(2)).toEqual(Array(8).fill('·'));
 await time(800);await choose(digit());expect(slots().slice(3)).toEqual(Array(7).fill('·'));
});
