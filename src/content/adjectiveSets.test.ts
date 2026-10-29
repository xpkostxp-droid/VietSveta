import {expect,it} from 'vitest';
import {adjectiveSets,adjectiveTasks,landWordBlock} from './adjectiveSets';
it('keeps agreed set sizes and visits each word once per direction',()=>{
 expect(adjectiveSets.map(s=>s.words.length)).toEqual([18,18,17]);
 const tasks=adjectiveTasks(18);expect(tasks).toHaveLength(36);
 expect(new Set(tasks.map(t=>`${t.word}:${t.reverse}`)).size).toBe(36);
 expect(tasks.every((t,i)=>t.reverse===(i%2===1))).toBe(true);
});
it('clears a perfect row but preserves a row with a mistake',()=>{
 const good={correct:true,label:'to'},bad={correct:false,label:'nhỏ'};
 expect(landWordBlock(Array(4).fill(good),good)).toEqual({board:[],clear:true});
 const result=landWordBlock([good,bad,good,good],good);
 expect(result.clear).toBe(false);expect(result.board).toHaveLength(5);
});
