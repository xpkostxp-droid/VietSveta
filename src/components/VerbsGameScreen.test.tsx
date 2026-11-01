// @vitest-environment jsdom
import {act} from 'react';import {createRoot,type Root} from 'react-dom/client';
import {beforeEach,afterEach,expect,it,vi} from 'vitest';
import VerbsGameScreen from './VerbsGameScreen';
import {reportStudyAnswer} from '../domain/studyTelemetry';
vi.mock('../domain/studyTelemetry',()=>({reportStudyAnswer:vi.fn(),registerStudyContext:()=>()=>{}}));
import {verbGameWords,verbGameTasks,verbGameOptions} from '../content/verbGame';
const audio=vi.hoisted(()=>({prepare:vi.fn(),play:vi.fn(),stop:vi.fn(),close:vi.fn(),speak:vi.fn(),stopVoice:vi.fn()}));
vi.mock('../domain/dragonSounds',()=>({createDragonSounds:()=>audio}));
vi.mock('../domain/speech',()=>({speakVietnamese:vi.fn(),stopSpeaking:vi.fn()}));
vi.mock('../beginner/components/gameSounds',()=>({makeGameSound:()=>({ready:vi.fn(),beep:vi.fn(),close:vi.fn(),speak:vi.fn(),stopVoice:vi.fn()})}));
vi.mock('./DragonWordScene',()=>({DragonWordScene:({word,outcome,paused}:{word:string;outcome:string;paused:boolean})=><div data-scene={outcome} data-paused={paused}>{word}</div>}));
vi.mock('./GameRanking',()=>({GameRanking:({onStart,result,total}:{onStart:()=>void;result?:{correct:number;time:number};total:number})=><div><button onClick={onStart}>Начать</button>{result&&<p data-result>{result.correct} из {total} · {result.time}</p>}</div>}));
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
let node:HTMLDivElement,root:Root;
const click=async(text:string)=>{const b=[...node.querySelectorAll('button')].find(b=>b.textContent===text);expect(b).toBeTruthy();await act(async()=>b!.click())};
const time=async(ms:number)=>{await act(async()=>vi.advanceTimersByTime(ms))};
beforeEach(async()=>{vi.useFakeTimers();vi.spyOn(performance,'now').mockImplementation(()=>Date.now());vi.clearAllMocks();localStorage.clear();Object.defineProperty(document,'hidden',{configurable:true,value:false});node=document.createElement('div');root=createRoot(node);await act(async()=>root.render(<VerbsGameScreen onBack={()=>{}}/>))});
afterEach(async()=>{await act(async()=>root.unmount());vi.restoreAllMocks();vi.useRealTimers()});
it('uses exactly the 26 selected verbs and three distinct options',()=>{
 expect(verbGameWords).toHaveLength(26);expect(new Set(verbGameWords.map(w=>w[0])).size).toBe(26);
 const tasks=verbGameTasks();expect(tasks).toHaveLength(52);
 for(let word=0;word<26;word++){expect(tasks.filter(t=>t.word===word&&t.reverse)).toHaveLength(1);expect(tasks.filter(t=>t.word===word&&!t.reverse)).toHaveLength(1);const o=verbGameOptions(word);expect(new Set(o).size).toBe(3);expect(o).toContain(word)}
});
it('completes every word once each way, saves one attempt and excludes animation time',async()=>{
 await click('Начать');const seen=new Set<string>();
 for(let i=0;i<52;i++){
  const prompt=node.querySelector('.verbs-prompt')!.textContent!,reverse=i%2===1;
  seen.add(prompt+':'+reverse);const pair=verbGameWords.find(w=>w[reverse?0:1]===prompt)!;expect(pair).toBeTruthy();
  await time(100);await click(pair[reverse?1:0]);expect(node.querySelectorAll('.at-right')).toHaveLength(1);expect(audio.play).toHaveBeenLastCalledWith('success');
  await time(1800);
 }
 expect(vi.mocked(reportStudyAnswer).mock.calls).toHaveLength(52);
 expect(vi.mocked(reportStudyAnswer).mock.calls.filter(([a])=>a.direction==='vi-ru')).toHaveLength(26);
 expect(vi.mocked(reportStudyAnswer).mock.calls.every(([a])=>a.result==='correct'&&a.elapsed_ms===100)).toBe(true);
 expect(seen.size).toBe(52);expect(node.querySelector('[data-result]')!.textContent).toBe('52 из 52 · 5200');
 const attempts=JSON.parse(localStorage.getItem('vietSveta.timedAttempts.v1')!);expect(attempts).toHaveLength(1);expect(attempts[0]).toMatchObject({game:'lesson15-verbs',total:52,correct:52,correctTimeMs:5200,answerTimeMs:5200});
});
it('coughs on a wrong answer and timeout, highlights the correct button and moves on',async()=>{
 await click('Начать');const prompt=node.querySelector('.verbs-prompt')!.textContent!,correct=verbGameWords.find(w=>w[1]===prompt)![0];
 const wrong=[...node.querySelectorAll<HTMLButtonElement>('.at-options button')].find(b=>b.textContent!==correct)!;
 await act(async()=>{wrong.click();wrong.click()});expect(audio.play).toHaveBeenCalledTimes(1);expect(audio.play).toHaveBeenCalledWith('error');expect(node.querySelectorAll('.at-right')).toHaveLength(1);expect(node.querySelectorAll('.at-wrong')).toHaveLength(1);
 await time(1100);expect(node.querySelector('.at-top')!.textContent).toContain('2/52');
 await time(5000);expect(audio.play).toHaveBeenCalledTimes(2);expect(audio.play).toHaveBeenLastCalledWith('error');await time(1100);expect(node.querySelector('.at-top')!.textContent).toContain('3/52');
 expect(vi.mocked(reportStudyAnswer).mock.calls.map(([a])=>a.result)).toEqual(['wrong','timeout']);
});
it('pauses both question and feedback while hidden and saves no unfinished run',async()=>{
 await click('Начать');await time(1000);Object.defineProperty(document,'hidden',{configurable:true,value:true});await act(async()=>document.dispatchEvent(new Event('visibilitychange')));await time(9000);expect(node.textContent).toContain('Продолжить');
 Object.defineProperty(document,'hidden',{configurable:true,value:false});await click('Продолжить');await time(100);
 const prompt=node.querySelector('.verbs-prompt')!.textContent!,answer=verbGameWords.find(w=>w[1]===prompt)![0];await click(answer);await time(500);
 Object.defineProperty(document,'hidden',{configurable:true,value:true});await act(async()=>document.dispatchEvent(new Event('visibilitychange')));await time(9000);expect(node.querySelector('.at-top')!.textContent).toContain('1/52');
 Object.defineProperty(document,'hidden',{configurable:true,value:false});await click('Продолжить');await time(1300);expect(node.querySelector('.at-top')!.textContent).toContain('2/52');expect(localStorage.getItem('vietSveta.timedAttempts.v1')).toBeNull();
});

it('speaks Vietnamese questions on arrival and answers Russian questions only after a correct choice',async()=>{
 await click('Начать');expect(audio.speak).not.toHaveBeenCalled();
 const ru=node.querySelector('.verbs-prompt')!.textContent!,pair=verbGameWords.find(w=>w[1]===ru)!;
 await click(pair[0]);await time(600);expect(audio.speak).toHaveBeenCalledTimes(1);expect(audio.speak).toHaveBeenLastCalledWith(verbGameWords.indexOf(pair));
 await time(1200);const vn=node.querySelector('.verbs-prompt')!.textContent!;expect(audio.speak).toHaveBeenLastCalledWith(verbGameWords.findIndex(w=>w[0]===vn));expect(audio.speak).toHaveBeenCalledTimes(2);
 await time(1000);expect(audio.speak).toHaveBeenCalledTimes(2);
 const correct=verbGameWords.find(w=>w[0]===vn)![1];await click(correct);await time(1800);expect(audio.speak).toHaveBeenCalledTimes(2);
 const nextRu=node.querySelector('.verbs-prompt')!.textContent!,nextCorrect=verbGameWords.find(w=>w[1]===nextRu)![0];
 const wrong=[...node.querySelectorAll<HTMLButtonElement>('.at-options button')].find(b=>b.textContent!==nextCorrect)!;await act(async()=>wrong.click());await time(1000);expect(audio.speak).toHaveBeenCalledTimes(2);
});
