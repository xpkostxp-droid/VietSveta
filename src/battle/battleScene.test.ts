import { expect,it } from 'vitest';
import { sceneTiming,ownWinner,finalOutcome,type CourtState } from './battleScene';
const base:CourtState={key:'m:2',round:2,now:10000,starts:11000,winner:'near',nearBlue:true};
it('keeps previous corners throughout the result and hard-cuts at next start',()=>{
 expect(sceneTiming(base)).toMatchObject({phase:'point',corner:1,seconds:1});
 expect(sceneTiming({...base,now:10999}).corner).toBe(1);
 expect(sceneTiming({...base,now:11000})).toMatchObject({phase:'rally',corner:0,seconds:0});
});
it('never invents a point during initial countdown or readiness',()=>{
 expect(sceneTiming({...base,round:0})).toMatchObject({phase:'waiting',corner:0});
 expect(sceneTiming({...base,round:0,starts:Infinity})).toMatchObject({phase:'waiting',corner:0});
});
it('converts server winner into each players own perspective',()=>{
 expect(ownWinner('host','host')).toBe('near');expect(ownWinner('host','guest')).toBe('far');
 expect(ownWinner('guest','guest')).toBe('near');expect(ownWinner('none','guest')).toBe('none');
 expect(ownWinner('both','host')).toBe('both');
});
it('chooses the final smash by total score, with no smash on a tie',()=>{
 expect(finalOutcome(7,6,'host')).toBe('near');expect(finalOutcome(7,6,'guest')).toBe('far');
 expect(finalOutcome(2,9,'host')).toBe('far');expect(finalOutcome(0,0,'host')).toBeNull();
});
