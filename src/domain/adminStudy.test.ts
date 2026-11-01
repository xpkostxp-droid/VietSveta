import {expect,it} from 'vitest';
import {difficultWords,participantActivity,studyTime,type AdminStudyData,type WordSummary} from './adminStudy';
const data=():AdminStudyData=>({since:'',generated_at:'',timezone:'Asia/Ho_Chi_Minh',participants:[],coverage:[],activity:[],words:[],medals:[],attempts:[]});
const word=(extra:Partial<WordSummary>={}):WordSummary=>({user_id:'u',topic:'lesson15-verbs',vi:'nghĩ',ru:'думать',direction:'ru-vi',shows:6,errors:2,timeouts:1,correct:4,correct_ms:12000,last_error:'2026-11-01T01:00:00Z',recent:[],confusions:[{chosen:'ngủ',count:1}],...extra});
it('combines directions without duplicating words, rates, or confusions',()=>{
 const d=data();d.words=[word(),word({direction:'vi-ru',shows:4,errors:1,timeouts:0,correct:3,correct_ms:3000}),word({user_id:'other'})];const [w]=difficultWords(d,'u');expect(w.shows).toBe(10);expect(w.errors).toBe(3);expect(w.correctMs/w.correct).toBeCloseTo(15000/7);expect(w.confusions).toEqual([{chosen:'ngủ',count:2}]);expect(w.directions).toHaveLength(2);
});
it('requires enough correct answers for slow words and enough evidence for fixed words',()=>{
 const d=data();d.words=[word({recent:['correct','wrong','correct','correct','correct'].map((result,i)=>({result,at:`2026-11-01T00:00:0${i}Z`}))}),word({vi:'ngủ',shows:2,correct:1,correct_ms:9000})];expect(difficultWords(d,'u','all','fixed').map(w=>w.vi)).toEqual(['nghĩ']);expect(difficultWords(d,'u','all','slow').map(w=>w.vi)).toEqual(['nghĩ']);
});
it('puts repeated mistakes before low sample words and filters by topic',()=>{
 const d=data();d.words=[word({vi:'a',shows:1,errors:1}),word({vi:'b',shows:10,errors:2}),word({topic:'cards:advanced:lesson-15',vi:'c'})];expect(difficultWords(d,'u')[0].vi).toBe('c');expect(difficultWords(d,'u','lesson15-verbs').map(w=>w.vi)).toEqual(['b','a']);
});
it('does not count app visits or double-count days, and preserves unknown coverage',()=>{
 const d=data();d.activity=[{user_id:'u',day:'2026-11-01',category:'visit',topic:'app',active_ms:0},{user_id:'u',day:'2026-11-01',category:'games',topic:'x',active_ms:60000},{user_id:'u',day:'2026-11-01',category:'cards',topic:'y',active_ms:30000}];const result=participantActivity(d,'u');expect(result.total).toBe(90000);expect(result.days).toBe(1);expect(result.coverage).toBeUndefined();expect(studyTime(3661000)).toBe('1 ч 1 мин');
});
