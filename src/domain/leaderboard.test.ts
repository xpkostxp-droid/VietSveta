import { expect,it } from 'vitest';
import { rankPlayers,betterAttempt } from './leaderboard';
it('ranks scores before time, shares exact ties and leaves unplayed members unranked',()=>{
 const rows=rankPlayers([
  {id:'none',name:'None',best:null},
  {id:'fast',name:'Fast',best:{correct:7,correct_time_ms:800}},
  {id:'more',name:'More',best:{correct:8,correct_time_ms:20000}},
  {id:'slow',name:'Slow',best:{correct:7,correct_time_ms:900}},
  {id:'tie',name:'Tie',best:{correct:7,correct_time_ms:800}}
 ]);
 expect(rows.map(r=>[r.id,r.place])).toEqual([['more',1],['fast',2],['tie',2],['slow',4],['none',null]]);
 expect(betterAttempt({correct:7,correct_time_ms:700},rows[1].best)).toBe(true);
 expect(betterAttempt({correct:6,correct_time_ms:1},rows[1].best)).toBe(false);
});
