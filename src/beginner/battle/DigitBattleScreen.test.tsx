import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {DigitBattleScreen} from './DigitBattleScreen';
import { phoneDigitWords } from '../content/games/phone';
vi.mock('../../battle/BattleStatistics',()=>({BattleStatistics:({onPlay,startLabel}:any)=><section className="battle-statistics"><h2>Статистика батлов</h2><button onClick={onPlay}>{startLabel}</button></section>}));
const voices = vi.hoisted(()=>({result:vi.fn(()=>vi.fn()),digit:vi.fn(()=>vi.fn()),ready:vi.fn()}));
vi.mock('../../battle/resultAudio',()=>({playBattleResultSound:voices.result,playBattleDigit:voices.digit,readyBattleDigitAudio:voices.ready}));
const sound = vi.hoisted(()=>({ready:vi.fn(),beep:vi.fn(),crash:vi.fn(),pop:vi.fn(),close:vi.fn()}));
vi.mock('../components/gameSounds',()=>({makeGameSound:()=>sound}));
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
let host:HTMLDivElement,root:ReturnType<typeof createRoot>;
beforeEach(()=>{vi.clearAllMocks();vi.useFakeTimers();vi.spyOn(Math,'random').mockReturnValue(.9);host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(()=>{act(()=>root.unmount());host.remove();vi.useRealTimers();vi.restoreAllMocks();});
function click(text:string){act(()=>[...host.querySelectorAll('button')].find(b=>b.textContent===text)!.click());}
function openBattle(){click('Сыграть с ботом');}
it('plays a full eight-cube match, keeps scores below the glass and has no bottom exit',()=>{
 act(()=>root.render(<DigitBattleScreen playerName="Константин" onBack={()=>{}}/>));
 openBattle();
 expect([...host.querySelectorAll('.digit-keypad button')].map(b=>b.textContent)).toEqual(['1','2','3','4','5','6','7','8','9','0']);expect(host.textContent).not.toContain('Завершить');
 for(let i=0;i<8;i++){
  act(()=>vi.advanceTimersByTime(i===0?3003:1815));
  expect(voices.digit).toHaveBeenCalledTimes(i+1);
  expect(host.querySelector('.digit-feedback')?.textContent).toBe('');
  const word=host.querySelector('.digit-falling-cube')!.textContent!;click(String(phoneDigitWords.indexOf(word)));
  expect(host.querySelector('.digit-falling-cube')).toBeNull();
  expect(host.querySelectorAll('.digit-stack-human .digit-small-cube')).toHaveLength(i+1);
 }
 act(()=>vi.advanceTimersByTime(1155));
 expect(voices.result).toHaveBeenCalledTimes(1);expect(voices.result).toHaveBeenCalledWith('victory');
 expect(host.textContent).toContain('Ты победил!');expect(host.querySelectorAll('.digit-stack-human .digit-small-cube')).toHaveLength(8);expect(host.querySelector('.digit-score')?.textContent).toContain('Константин8');
 expect(host.querySelector('.digit-glass')!.nextElementSibling).toBe(host.querySelector('.digit-score'));
 expect(host.querySelectorAll('.digit-keypad button')).toHaveLength(10);click('Реванш с ботом');expect(host.querySelector('.digit-score')?.textContent).toContain('Константин0');
});

it('pops an unanswered cube briefly, without an explosion sound or commentary',()=>{
 act(()=>root.render(<DigitBattleScreen onBack={()=>{}}/>));
 openBattle();
 act(()=>vi.advanceTimersByTime(8040));
 expect(host.querySelector('.is-popping')).not.toBeNull();expect(sound.pop).toHaveBeenCalledTimes(1);expect(sound.crash).not.toHaveBeenCalled();
 expect(host.querySelector('.digit-feedback')?.textContent).toBe('');
 act(()=>vi.advanceTimersByTime(198));expect(host.querySelector('.digit-falling-cube')).toBeNull();
});
