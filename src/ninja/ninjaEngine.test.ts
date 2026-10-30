import {beforeEach,expect,it} from 'vitest';
import {createNinjaGame,drawNinjaProducts} from './ninjaEngine';
import {products} from '../content/marketProducts';
beforeEach(()=>localStorage.clear());
it('uses one direction and nine unique vegetables with three distinct Vietnamese options',()=>{
 let now=0;const game=createNinjaGame('vegetables',()=>.99,()=>now);let s=game.start();const seen:number[]=[];
 for(let i=0;i<9;i++){
  seen.push(s.task.product);expect(s.task.options).toHaveLength(3);expect(new Set(s.task.options).size).toBe(3);expect(s.task.options.every(p=>products[p][3]==='vegetables')).toBe(true);
  now=s.startsAt+100;s=game.answer(s.task.product,s.round);expect(s.winner).toBe('human');now=s.resultUntil;s=game.poll();
 }
 expect(new Set(seen).size).toBe(9);expect(s).toMatchObject({phase:'finished',baseRounds:9,scoreHuman:9,scoreBot:0});
});
it('leaves time to answer after a bot miss and locks human mistakes',()=>{
 let now=0;const game=createNinjaGame('fruits',()=>.4,()=>now);let s=game.start();now=s.startsAt+3000;s=game.poll();expect(s.events[0]).toMatchObject({side:'bot',kind:'miss'});expect(s.phase).toBe('question');
 s=game.answer(s.task.product,s.round);expect(s.winner).toBe('human');
 const second=createNinjaGame('fruits',()=>0,()=>now);s=second.start();now=s.startsAt+100;
 s=second.answer(s.task.options.find(p=>p!==s.task.product)!,s.round);expect(s.humanAnswered).toBe(true);s=second.answer(s.task.product,s.round);expect(s.scoreHuman).toBe(0);now=s.startsAt+1000;s=second.poll();expect(s.winner).toBe('bot');
});
it('settles a faster bot before a later human answer',()=>{
 let now=0;const game=createNinjaGame('fruits',()=>0,()=>now);let s=game.start();now=s.startsAt+1000;s=game.answer(s.task.product,s.round);expect(s).toMatchObject({phase:'result',scoreBot:1,scoreHuman:0});
});
it('continues tied matches through misses until a decisive overtime answer',()=>{
 let now=0;const game=createNinjaGame('vegetables',()=>.99,()=>now);let s=game.start();
 for(let i=0;i<9;i++){now=s.startsAt+5000;s=game.poll();expect(s.winner).toBeNull();now=s.resultUntil;s=game.poll();}
 expect(s).toMatchObject({round:9,phase:'ready',scoreHuman:0,scoreBot:0});now=s.startsAt+5000;s=game.poll();now=s.resultUntil;s=game.poll();expect(s.round).toBe(10);
 now=s.startsAt+100;s=game.answer(s.task.product,s.round);now=s.resultUntil;s=game.poll();expect(s).toMatchObject({phase:'finished',scoreHuman:1,scoreBot:0});
});
it('uses unseen products before starting a new vocabulary cycle',()=>{
 const first=drawNinjaProducts('all',10,()=>.1),second=drawNinjaProducts('all',10,()=>.8);
 expect(new Set([...first,...second]).size).toBe(20);
});
it('does not consume a vocabulary cycle until the assets are ready and game starts',()=>{
 const game=createNinjaGame('fruits');game.initial();expect(localStorage.length).toBe(0);game.start();expect(localStorage.length).toBe(1);
});
it('rejects early, stale, duplicate and out-of-options answers',()=>{
 let now=0;const game=createNinjaGame('fruits',()=>.99,()=>now);let s=game.start();expect(game.answer(s.task.product,0).scoreHuman).toBe(0);now=s.startsAt+100;expect(game.answer(s.task.product,99).humanAnswered).toBe(false);expect(game.answer(-1,0).humanAnswered).toBe(false);s=game.answer(s.task.product,0);expect(game.answer(s.task.product,0).scoreHuman).toBe(1);game.cancel();now+=10000;expect(game.poll().phase).toBe('cancelled');
});
