import {expect,it} from 'vitest';
import {savedStudy,attemptSummary} from './savedStudy';
import type {AdminStudyData} from './adminStudy';
const data=():AdminStudyData=>({since:'',generated_at:'',timezone:'',participants:[],coverage:[],activity:[],words:[],attempts:[],medals:[]});
it('keeps historical cumulative cards separate from detailed new events and maps exact stable card IDs',()=>{
 const d=data();d.saved_learning=[{user_id:'u',advanced:{progress:{a:{cardId:'l15-01',direction:'ru-vi',timesRemembered:2,timesNotRemembered:1,lastResult:'remembered',lastReviewedAt:'2026-10-29T04:00:00Z'},b:{cardId:'l15-01',direction:'vi-ru',timesRemembered:0,timesNotRemembered:2,lastResult:'not-remembered',lastReviewedAt:'2026-10-30T04:00:00Z'},x:{cardId:'unknown',direction:'ru-vi',timesNotRemembered:999}},theory:{'lesson-15':'2026-10-29T03:00:00Z',bad:'not a date'}},market_errors:['chuối|word','chuối|picture','unknown|word']}];
 const s=savedStudy(d,'u');expect(s.unique).toBe(1);expect(s.cards).toHaveLength(2);expect(s.repeat).toBe(1);expect(s.errors).toHaveLength(2);expect(s.theory).toHaveLength(1);expect(s.market).toEqual([{vi:'chuối',ru:'банан'}]);expect(s.last).toBe('2026-10-30T04:00:00Z');expect(d.words).toHaveLength(0);expect(d.activity).toHaveLength(0);expect(savedStudy(d,'other').cards).toHaveLength(0);
});
it('tolerates missing and malformed saved snapshots without estimating counts or time',()=>{
 const d=data();d.saved_learning=[{user_id:'u',advanced:{progress:[],theory:null,last:'bad'},market_errors:[3,null],bests:[]}];expect(savedStudy(d,'u').unique).toBe(0);expect(savedStudy(d,'u').last).toBeNull();expect(savedStudy(data(),'u').market).toEqual([]);
});
it('sums saved attempts as attempts and correct-answer time, counting game days in Vietnam',()=>{
 const s=attemptSummary([{id:'1',user_id:'u',game:'x',correct:3,total:5,correct_time_ms:2500,created_at:'2026-10-29T23:59:00Z'},{id:'2',user_id:'u',game:'x',correct:4,total:5,correct_time_ms:3500,created_at:'2026-10-30T00:01:00Z'}]);expect(s).toEqual({count:2,correct:7,total:10,correctMs:6000,days:1});
});
