import { expect, it } from 'vitest';
import { createDigitBattle } from './digitBattle';
function setup(plan: 'correct'|'wrong'|'skip') {
 let now = 10000, calls = 0;
 // First nine random calls shuffle the digit bag; then two calls plan the bot.
 const random = () => ++calls <= 9 ? .5 : calls % 2 === 0 ? ({correct:0,wrong:.4,skip:.9}[plan]) : .8;
 const game = createDigitBattle(random,()=>now);
 return {game,at:(n:number)=>{now=n;return game.poll();},set:(n:number)=>{now=n;}};
}
it('keeps the original deadline after a wrong answer and lets the bot claim the cube',()=>{
 const {game,at,set}=setup('correct'); let s=at(13000); set(14000);
 s=game.answer((s.digit+1)%10,s.round); expect(s.phase).toBe('question'); expect(s.humanAnswered).toBe(true);expect(s.startsAt).toBe(13000);
 expect(game.answer(s.digit,s.round).cubes.human).toHaveLength(0);
 s=at(17000);expect(s.winner).toBe('bot');expect(s.cubes.bot).toHaveLength(1);
});
it('expires unanswered cubes at five seconds, and rejects a late correct tap',()=>{
 const {game,at,set}=setup('skip');let s=at(13000);set(17999);s=game.answer((s.digit+1)%10,s.round);
 expect(s.phase).toBe('question');s=at(18000);expect(s.phase).toBe('result');expect(s.winner).toBeNull();expect(s.resultAt).toBe(18000);
 set(18001);expect(game.answer(s.digit,s.round).cubes.human).toHaveLength(0);
});
it('lets the human answer after a bot miss; two misses destroy the cube',()=>{
 const {game,at}=setup('wrong');let s=at(17000);expect(s.botAnswered).toBe(true);expect(s.phase).toBe('question');
 s=game.answer(s.digit,s.round);expect(s.winner).toBe('human');
 const other=setup('wrong');s=other.at(17000);s=other.game.answer((s.digit+1)%10,s.round);expect(s.phase).toBe('result');expect(s.winner).toBeNull();
});
it('stops immediately on eight cubes and ignores stale rounds and repeated taps',()=>{
 let now=10000;const game=createDigitBattle(()=>.9,()=>now);let s=game.initial();const seen:number[]=[];
 for(let i=0;i<8;i++){
  now=s.startsAt;s=game.poll();seen.push(s.digit);
  expect(game.answer(s.digit,s.round-1).humanAnswered).toBe(false);
  s=game.answer(s.digit,s.round);s=game.answer(s.digit,s.round);
  expect(s.cubes.human).toHaveLength(i+1);
  if(i<7){now=s.resultUntil;s=game.poll();}else expect(s.phase).toBe('finished');
 }
 expect(new Set(seen).size).toBe(8);now+=999999;expect(game.poll().round).toBe(8);expect(game.poll().cubes.human).toHaveLength(8);
});
it('preserves remaining time and the bot schedule while paused',()=>{
 const {game,at,set}=setup('correct');at(13000);set(14000);game.pause();at(114000);expect(game.poll().phase).toBe('question');
 let s=game.resume();expect(s.startsAt).toBe(113000);expect(s.botAnswered).toBe(false);
 s=at(117000);expect(s.winner).toBe('bot');
});
it('uses all ten digits before drawing a new bag, without adjacent repeats',()=>{
 let now=10000;const game=createDigitBattle(()=>.9,()=>now);let s=game.initial();const seen:number[]=[];
 for(let i=0;i<21;i++){seen.push(s.digit);now=s.startsAt+5000;s=game.poll();now=s.resultUntil;s=game.poll();}
 expect(new Set(seen.slice(0,10)).size).toBe(10);expect(new Set(seen.slice(10,20)).size).toBe(10);
 expect(seen.every((n,i)=>i===0||n!==seen[i-1])).toBe(true);
});
