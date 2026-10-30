import {expect,it} from 'vitest';
import {battleRanking,battleOpponents,type BattleRecord} from './battleRanking';
const match=(id:string,h:string,g:string,hs:number,gs:number):BattleRecord=>({id,played_at:`2026-10-${id.padStart(2,'0')}T10:00:00Z`,host_id:h,guest_id:g,host_name:h,guest_name:g,score_host:hs,score_guest:gs,topic:'fruits'});
it('counts both players and ranks by wins then fewer losses',()=>{
 const rows=battleRanking([match('1','a','b',12,5),match('2','b','a',7,3),match('3','c','b',4,2),match('4','d','c',1,2)]);
 expect(rows.map(r=>[r.id,r.played,r.wins,r.losses,r.place])).toEqual([['c',2,2,0,1],['a',2,1,1,2],['b',3,1,2,3],['d',1,0,1,4]]);
});
it('shares a place when wins and losses are identical, with no zero-match players',()=>{
 expect(battleRanking([])).toEqual([]);
 const rows=battleRanking([match('1','a','b',2,1),match('2','b','a',2,1)]);
 expect(rows.map(r=>r.place)).toEqual([1,1]);
});
it('shows the latest score from the selected player’s perspective for each opponent',()=>{
 const records=[match('1','a','b',12,5),match('3','b','a',7,10),match('2','a','c',3,5)];
 expect(battleOpponents(records,'a').map(r=>[r.id,r.played,r.wins,r.losses,r.score])).toEqual([['b',2,2,0,'10:7'],['c',1,0,1,'3:5']]);
 expect(battleOpponents(records,'b')[0].score).toBe('7:10');
});
