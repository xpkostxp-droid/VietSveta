import type {Match} from '../battle/battleTypes';
import {products} from '../content/marketProducts';
import type {NinjaEvent,NinjaSnapshot,NinjaSide} from './ninjaEngine';
export function onlineNinjaSnapshot(match:Match,now:number):NinjaSnapshot{
 const starts=match.starts_at?Date.parse(match.starts_at):Infinity;
 const previous=match.last_result;
 const result=!!previous&&(match.status==='finished'||now<starts);
 const task=result?previous:match.task;
 const round=result?(previous.round??match.round-1):match.round;
 const eventAt=result?Date.parse(previous.at!):0;
 const own=(side:string):NinjaSide=>side===match.side?'human':'bot';
 const events:NinjaEvent[]=(result?previous.misses:match.attempts)?.map((e,i)=>({id:i+1,round,side:own(e.side),kind:'miss',at:Date.parse(e.at)}))??[];
 if(result)events.push({id:events.length+1,round,side:own(previous.winner),kind:previous.winner==='none'?'splat':'hit',at:eventAt});
 const product=Math.max(0,products.findIndex(p=>p[2]===task?.word||p[1]===task?.word));
 return {phase:result?(match.status==='finished'&&now>=eventAt+1700?'finished':'result'):now<starts?'ready':'question',round,
  baseRounds:match.base_rounds??10,startsAt:result?Date.parse(previous.starts_at!):starts,resultUntil:eventAt+2000,
  task:{product,options:task?.options.map(w=>products.findIndex(p=>p[1]===w))??[]},humanAnswered:match.answered,
  scoreHuman:match.side==='host'?match.score_host:match.score_guest,scoreBot:match.side==='host'?match.score_guest:match.score_host,
  winner:result&&previous.winner!=='none'?own(previous.winner):null,events};
}
