import {expect,it} from 'vitest';
import type {Match} from '../battle/battleTypes';
import {onlineNinjaSnapshot} from './onlineNinja';
const at=Date.parse('2026-10-30T14:00:00Z');
const match:Match={id:'online',mode:'ninja',topic:'fruits',status:'active',side:'host',host_name:'Сергей',guest_name:'Марина',host_character:'teal-man',guest_character:'red-woman',round:0,base_rounds:10,starts_at:new Date(at).toISOString(),ready_host:true,ready_guest:true,task:{word:'банан',options:['táo','chuối','xoài']},answered:false,score_host:0,score_guest:0,last_result:null};
it('uses an image with Vietnamese options and maps a live opponent miss',()=>{
 const s=onlineNinjaSnapshot({...match,attempts:[{side:'guest',at:new Date(at+500).toISOString()}]},at+700);
 expect(s.phase).toBe('question');expect(s.task).toEqual({product:9,options:[12,9,10]});expect(s.events[0]).toMatchObject({kind:'miss',side:'bot',at:at+500});
});
it.each(['host','guest'] as const)('keeps the previous fruit and maps a guest hit for %s',side=>{
 const s=onlineNinjaSnapshot({...match,side,round:1,score_guest:1,starts_at:new Date(at+3000).toISOString(),task:{word:'яблоко',options:['táo','chuối','xoài']},last_result:{round:0,at:new Date(at+1000).toISOString(),starts_at:new Date(at).toISOString(),winner:'guest',word:'банан',options:['táo','chuối','xoài'],answer:1,misses:[]}},at+1300);
 expect(s.phase).toBe('result');expect(s.task.product).toBe(9);expect(s.startsAt).toBe(at);expect(s.events[0].side).toBe(side==='guest'?'human':'bot');expect(s.scoreHuman).toBe(side==='guest'?1:0);
});
it('preserves a final splat before showing the victory banner',()=>{
 const m:Match={...match,status:'finished',round:10,score_host:5,score_guest:3,task:null,last_result:{round:9,at:new Date(at+5000).toISOString(),starts_at:new Date(at).toISOString(),winner:'none',word:'банан',options:['táo','chuối','xoài'],answer:1}};
 expect(onlineNinjaSnapshot(m,at+5400).events[0].kind).toBe('splat');expect(onlineNinjaSnapshot(m,at+5400).phase).toBe('result');expect(onlineNinjaSnapshot(m,at+6800).phase).toBe('finished');
});
