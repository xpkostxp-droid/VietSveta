import { expect,it } from 'vitest';
import { botPlan,createBotBattle } from './botBattle';
import { botVocabulary } from './botVocabulary';
import type { Snapshot } from './battleTypes';
function correct(s:Snapshot) {
 const task=s.match!.task!;
 const pair=botVocabulary.fruits.words.find(p=>p.includes(task.word))!;
 return task.options.indexOf(pair[0]===task.word?pair[1]:pair[0]);
}
it.each([[0,'correct'],[.4,'wrong'],[.9,'skip']] as const)('chooses random behavior %s', (n,kind)=>{
 expect(botPlan(()=>n).kind).toBe(kind);
});
it('lets the human answer after the bot has already made a mistake',()=>{
 let now=0;const bot=createBotBattle('fruits',()=>.4,()=>now);
 let s=bot.request('ready');now=Date.parse(s.match!.starts_at!)+2500;
 s=bot.request();expect(s.match!.round).toBe(0);expect(s.match!.answered).toBe(false);
 s=bot.request('answer',{round:0,choice:correct(s)});expect(s.match!.round).toBe(1);
 expect(s.match!.last_result!.winner).toBe('host');
});
it('awards nothing when the human is wrong and the bot skips',()=>{
 let now=0;const bot=createBotBattle('fruits',()=>.99,()=>now);
 let s=bot.request('ready');const start=Date.parse(s.match!.starts_at!);
 now=start+100;s=bot.request('answer',{round:0,choice:(correct(s)+1)%3});
 expect(s.match!.round).toBe(0);
 now=start+5000;s=bot.request();
 expect(s.match!.round).toBe(1);expect(s.match!.last_result!.winner).toBe('none');
 expect(s.match!.score_host+s.match!.score_guest).toBe(0);
});
it('the bot wins with a correct answer when the human misses, and answers lock',()=>{
 let now=0;const bot=createBotBattle('fruits',()=>0,()=>now);
 let s=bot.request('ready');const start=Date.parse(s.match!.starts_at!);
 now=start+100;const answer=correct(s);
 bot.request('answer',{round:0,choice:(answer+1)%3});
 bot.request('answer',{round:0,choice:answer});
 now=start+700;s=bot.request();
 expect(s.match!.last_result!.winner).toBe('guest');expect(s.match!.score_guest).toBe(1);
});
it('finishes at exactly 15 questions, excludes the hidden answer, and stops scoring',()=>{
 let now=0;const bot=createBotBattle('fruits',()=>.99,()=>now);
 let s=bot.request('ready');
 expect(s.match!.task).not.toHaveProperty('answer');
 for(let round=0;round<15;round++){
  const start=Date.parse(s.match!.starts_at!);now=start+100;
  s=bot.request('answer',{round,choice:correct(s)});now=start+701;s=bot.request();
 }
 expect(s.match).toMatchObject({round:15,status:'finished',score_host:15,score_guest:0,task:null});
 now+=10000;expect(bot.request().match!.score_host).toBe(15);
});
