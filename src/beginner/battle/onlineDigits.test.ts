import {expect,it} from 'vitest';
import type {Match} from '../../battle/battleTypes';
import {onlineDigitSnapshot} from './onlineDigits';
const now=100000;
const base:Match={id:'digits',status:'active',mode:'digits',topic:'digits',side:'host',host_name:'Анна',guest_name:'Борис',round:1,starts_at:new Date(now+1700).toISOString(),ready_host:true,ready_guest:true,task:{word:'bảy',options:['0','1','2','3','4','5','6','7','8','9']},answered:false,score_host:1,score_guest:0,last_result:{round:0,starts_at:new Date(now-1000).toISOString(),at:new Date(now).toISOString(),winner:'host',word:'một',options:[],answer:1},digit_cubes:{host:[1],guest:[]}};
it('mirrors stacks and winner so each participant is on the left',()=>{
 const host=onlineDigitSnapshot(base,now),guest=onlineDigitSnapshot({...base,side:'guest'},now);
 expect(host.cubes).toEqual({human:[1],bot:[]});expect(guest.cubes).toEqual({human:[],bot:[1]});expect(host.winner).toBe('human');expect(guest.winner).toBe('bot');expect(host.digit).toBe(1);expect(guest.round).toBe(1);
});
it('keeps a shared result, preparation and falling task on the same server timeline',()=>{
 expect(onlineDigitSnapshot(base,now+900).phase).toBe('result');expect(onlineDigitSnapshot(base,now+1200).phase).toBe('ready');
 const next=onlineDigitSnapshot(base,now+1800);expect(next.phase).toBe('question');expect(next.digit).toBe(7);expect(next.round).toBe(2);
});
it('stops immediately when the authoritative match finishes and retains both stacks',()=>{
 const s=onlineDigitSnapshot({...base,status:'finished',digit_cubes:{host:[1,2,3,4,5,6,7,8],guest:[0,0]},score_host:8,score_guest:2},now);
 expect(s.phase).toBe('finished');expect(s.cubes.human).toHaveLength(8);expect(s.cubes.bot).toHaveLength(2);
});
