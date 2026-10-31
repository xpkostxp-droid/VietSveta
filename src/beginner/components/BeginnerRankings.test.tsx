import { act } from 'react';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { FamilyGameScreen } from './FamilyGameScreen';
import { HouseGameScreen } from './HouseGameScreen';
import { familyWords } from '../content/games/family';
import { houseGameWords } from '../content/games/house';
import { saveTimedAttempt } from '../../domain/answerTime';
const sounds=vi.hoisted(()=>({ready:vi.fn(),beep:vi.fn(),close:vi.fn()}));
vi.mock('./gameSounds',()=>({makeGameSound:()=>sounds}));
const cloud = vi.hoisted(() => ({ memberRequest: vi.fn(async () => ({ rows: Array.from({length:5},(_,i)=>({id:String(i),name:'Участник '+(i+1),best:null})) })), syncAccount: vi.fn() }));
vi.mock('../../domain/cloud', () => ({ ...cloud, cachedMember: () => null }));
vi.mock('../../components/MemberAvatar', () => ({ MemberAvatar: () => null }));
vi.mock('../../domain/answerTime', () => ({ saveTimedAttempt: vi.fn() }));
vi.mock('../domain/speech', () => ({ speakVietnamese: vi.fn(), stopSpeaking: vi.fn(), hasVietnameseVoice: () => true, onVoicesChanged: () => () => {} }));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
let host: HTMLDivElement, root: ReturnType<typeof createRoot>;
beforeEach(() => {
 vi.useFakeTimers({ toFake:['setTimeout','clearTimeout','setInterval','clearInterval','performance'] });vi.clearAllMocks();
 Object.defineProperty(document,'hidden',{configurable:true,value:false});
 host=document.createElement('div');document.body.append(host);root=createRoot(host);
});
afterEach(() => { act(() => root.unmount());host.remove();vi.useRealTimers(); });
const cases = [
 ['lesson10-family', () => <FamilyGameScreen onBack={() => {}} />, familyWords],
 ['lesson11-house', () => <HouseGameScreen onBack={() => {}} />, houseGameWords('house')],
 ['lesson11-adjectives', () => <HouseGameScreen game="adjectives" onBack={() => {}} />, houseGameWords('adjectives')],
] as const;
it.each(cases)('loads %s ranking, places Start last and saves a separate completed result with five-second questions and active time', async (game, render, words) => {
 await act(async () => root.render(render()));
 await act(async () => vi.advanceTimersByTime(0));
 expect(cloud.memberRequest).toHaveBeenCalledWith({action:'leaderboard',game});
 expect(host.querySelector('.game-ranking')?.textContent).toContain('Участник');
 expect(host.querySelector('.game-ranking')?.lastElementChild?.textContent).toBe('Начать');
 expect(host.querySelector('img')).toBeNull();
 const dir=process.env.BEGINNER_LAYOUT_QA_DIR;
 if(dir){mkdirSync(dir,{recursive:true});writeFileSync(`${dir}/ranking-${game}.fragment.html`,host.innerHTML);}
 await act(async () => host.querySelector<HTMLButtonElement>('.ranking-start')!.click());
 for(let i=0;i<words.length*2;i++){
  const caption=host.querySelector('.profession-caption')!;
  const reverse=caption.getAttribute('lang')==='vi';
  const word=words.find(w=>w[reverse?1:2]===caption.textContent)!;
  if(i===0){
   await act(async()=>vi.advanceTimersByTime(2000));
   Object.defineProperty(document,'hidden',{configurable:true,value:true});act(()=>document.dispatchEvent(new Event('visibilitychange')));
   await act(async()=>vi.advanceTimersByTime(20000));
   Object.defineProperty(document,'hidden',{configurable:true,value:false});act(()=>document.dispatchEvent(new Event('visibilitychange')));
   await act(async()=>{ host.querySelector<HTMLButtonElement>('.beginner-prompt-tools button')!.click(); vi.advanceTimersByTime(1000); });
  }else await act(async()=>vi.advanceTimersByTime(3000));
  const correct=word[reverse?2:1];
  const button=Array.from(host.querySelectorAll<HTMLButtonElement>('.work-options button')).find(b=>b.textContent===correct)!;
  act(()=>{button.click();button.click();});
  await act(async()=>vi.advanceTimersByTime(1600));
 }
 expect(saveTimedAttempt).toHaveBeenCalledTimes(1);
 expect(saveTimedAttempt).toHaveBeenCalledWith({game,correct:words.length*2,total:words.length*2,answerTimeMs:words.length*2*3000,correctTimeMs:words.length*2*3000,completed:true});
 expect(host.querySelector('.game-ranking')).toBeTruthy();
 expect(host.querySelector('.ranking-result')?.textContent).toContain(`${words.length*2} из ${words.length*2}`);
 expect(host.querySelector('.game-ranking')?.lastElementChild?.textContent).toBe('Играть ещё');
 expect(host.querySelector('img')).toBeNull();
});

it.each(cases)('times out %s at five seconds, freezes feedback and resets each question', async (_game, render, words) => {
 await act(async()=>root.render(render()));
 await act(async()=>host.querySelector<HTMLButtonElement>('.ranking-start')!.click());
 expect(host.querySelector('.work-clock')?.textContent).toBe('5');
 expect(host.textContent).not.toContain('Без таймера');
 const caption=host.querySelector('.profession-caption')!;
 const reverse=caption.getAttribute('lang')==='vi';
 const word=words.find(w=>w[reverse?1:2]===caption.textContent)!;
 await act(async()=>vi.advanceTimersByTime(5000));
 expect(host.querySelector('.work-clock')?.textContent).toBe('0');
 expect(host.querySelector('.family-correct')?.textContent).toBe(word[reverse?2:1]);
 expect(host.querySelectorAll('.work-options button:disabled')).toHaveLength(3);
 expect(host.querySelector('.work-status')?.textContent).toContain('✓ 0');
 expect(sounds.beep.mock.calls.map(c=>c[0])).toEqual([3,2,1]);
 await act(async()=>vi.advanceTimersByTime(1599));
 expect(host.querySelector('.work-clock')?.textContent).toBe('0');
 await act(async()=>vi.advanceTimersByTime(1));
 expect(host.querySelector('.work-clock')?.textContent).toBe('5');
 expect(host.querySelectorAll('.work-options button:not(:disabled)')).toHaveLength(3);
 expect(host.querySelector('.work-status')?.textContent).toContain('2/');
 expect(saveTimedAttempt).not.toHaveBeenCalled();
 await act(async()=>host.querySelector<HTMLButtonElement>('.back-button')!.click());
 await act(async()=>vi.advanceTimersByTime(10000));
 expect(host.querySelector('.game-ranking')).toBeTruthy();
 expect(saveTimedAttempt).not.toHaveBeenCalled();
});
