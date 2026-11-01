import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import ToneGameScreen from './ToneGameScreen';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
const audio=vi.hoisted(()=>({unlock:vi.fn().mockResolvedValue(undefined),load:vi.fn().mockResolvedValue(undefined),playThreeTimes:vi.fn(),stop:vi.fn(),close:vi.fn()}));
vi.mock('../domain/toneAudio',()=>({createToneAudio:()=>audio}));
vi.mock('../domain/countdownSound',()=>({createCountdownSound:()=>({unlock:vi.fn(),beep:vi.fn(),explode:vi.fn(),stop:vi.fn(),close:vi.fn()})}));
vi.mock('./GameRanking',()=>({GameRanking:({onStart,result}:any)=><><button onClick={onStart}>Начать</button>{result&&<p>Результат {result.correct}</p>}</>}));
vi.mock('../domain/studyTelemetry',()=>({reportStudyAnswer:vi.fn()}));
vi.mock('../domain/useStudyActivity',()=>({useStudyActivity:vi.fn()}));
import {reportStudyAnswer} from '../domain/studyTelemetry';
import {toneWords} from '../content/toneWords';
import * as attempts from '../domain/answerTime';
let node:HTMLDivElement,root:ReturnType<typeof createRoot>;
beforeEach(async()=>{vi.useFakeTimers();vi.clearAllMocks();audio.load.mockResolvedValue(undefined);node=document.createElement('div');document.body.append(node);root=createRoot(node);await act(async()=>root.render(<ToneGameScreen onBack={()=>{}}/>));});
afterEach(async()=>{await act(async()=>root.unmount());node.remove();vi.useRealTimers();});
async function start(){await act(async()=>node.querySelector<HTMLButtonElement>('button:not(.back-button)')!.click());}
async function advance(ms:number){await act(async()=>{await vi.advanceTimersByTimeAsync(ms);});}
async function countdown(){await advance(600);await advance(1000);await advance(1000);await advance(1000);}
it('hides the word, counts in, enables six symbols and cancels audio on the first answer',async()=>{
 await start();expect(node.textContent).toContain('Начинаем!');expect(node.querySelectorAll('.tone-options button')).toHaveLength(6);
 expect([...node.querySelectorAll<HTMLButtonElement>('.tone-options button')].every(b=>b.disabled)).toBe(true);
 await countdown();expect(audio.playThreeTimes).toHaveBeenCalledTimes(1);expect(node.textContent).toContain('Слушай слово');
 const before=audio.stop.mock.calls.length;await advance(200);
 await act(async()=>node.querySelector<HTMLButtonElement>('.tone-options button')!.click());
 expect(audio.stop.mock.calls.length).toBeGreaterThan(before);expect(node.querySelector('.tone-word')).toBeTruthy();expect(reportStudyAnswer).toHaveBeenCalledTimes(1);
 const word=toneWords.find(w=>w.id===audio.playThreeTimes.mock.calls[0][0])!;expect(node.querySelector('.tone-word')?.textContent).toBe(word.vi);
 await act(async()=>node.querySelector<HTMLButtonElement>('.tone-options button')!.click());expect(reportStudyAnswer).toHaveBeenCalledTimes(1);
 await advance(1100);expect(audio.playThreeTimes).toHaveBeenCalledTimes(2);expect(node.querySelector('.tone-word')).toBeNull();
});
it('times out after five seconds and automatically advances without a Next button',async()=>{
 await start();await countdown();await advance(5000);expect(reportStudyAnswer).toHaveBeenCalledWith(expect.objectContaining({result:'timeout',elapsed_ms:5000}));
 expect(node.querySelector('.blitz-correct')).toBeTruthy();await advance(1100);expect(node.textContent).toContain('Задание 2/30');expect(node.textContent).not.toContain('Дальше');
});
it('does not start a timed question if an audio file cannot load',async()=>{
 audio.load.mockRejectedValueOnce(new Error('offline'));await start();expect(node.textContent).toContain('Не удалось включить записи');await advance(10000);expect(audio.playThreeTimes).not.toHaveBeenCalled();expect(reportStudyAnswer).not.toHaveBeenCalled();
});
it('finishes all thirty tasks and saves one completed attempt',async()=>{
 const saved=vi.spyOn(attempts,'saveTimedAttempt');await start();await countdown();
 for(let i=0;i<30;i++){await advance(5000);await advance(1100);}
 expect(reportStudyAnswer).toHaveBeenCalledTimes(30);expect(saved).toHaveBeenCalledTimes(1);
 expect(saved).toHaveBeenCalledWith(expect.objectContaining({game:'listening-tones',correct:0,total:30,correctTimeMs:0,completed:true}));
 expect(node.textContent).toContain('Результат 0');saved.mockRestore();
});
it('stops audio and freezes the question while hidden, then resumes the remaining time',async()=>{
 await start();await countdown();await advance(1000);
 Object.defineProperty(document,'hidden',{configurable:true,value:true});await act(async()=>document.dispatchEvent(new Event('visibilitychange')));
 await advance(10000);expect(reportStudyAnswer).not.toHaveBeenCalled();expect(node.textContent).toContain('Продолжить');
 Object.defineProperty(document,'hidden',{configurable:true,value:false});await act(async()=>[...node.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent==='Продолжить')!.click());
 await advance(3990);expect(reportStudyAnswer).not.toHaveBeenCalled();await advance(50);expect(reportStudyAnswer).toHaveBeenCalledWith(expect.objectContaining({result:'timeout',elapsed_ms:5000}));
});
