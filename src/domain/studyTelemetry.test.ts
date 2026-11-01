import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {StudyCollector,registerStudyContext,startStudyCollection,reportStudyAnswer,vietnamDay,type StudyActivity,type StudyAnswer} from './studyTelemetry';
let now:number;let cleanups:(()=>void)[]=[];
const hidden=(value:boolean)=>Object.defineProperty(document,'hidden',{value,configurable:true});
const input={topic:'lesson15-verbs',vi:'nghĩ',ru:'думать',direction:'ru-vi',chosen:'ngủ',result:'wrong' as const,elapsed_ms:1200};
const makeSender=()=>vi.fn<[StudyActivity[],StudyAnswer[]],Promise<void>>(async()=>{});
type SenderMock=ReturnType<typeof makeSender>;
function setup(owner='one',sender?:SenderMock){const send=sender??makeSender();const c=new StudyCollector(owner,send,()=>now);return {c,send};}
const rows=(send:SenderMock)=>{const map=new Map<string,StudyActivity>();for(const [activities] of send.mock.calls)for(const row of activities as StudyActivity[])map.set(row.id,row);return [...map.values()];};
const studied=(send:SenderMock)=>rows(send).filter(a=>a.category!=='visit').reduce((n,a)=>n+a.active_ms,0);
beforeEach(()=>{now=Date.parse('2026-11-01T05:00:00Z');localStorage.clear();sessionStorage.clear();hidden(false);});
afterEach(()=>{for(const fn of cleanups)fn();cleanups=[];hidden(false);document.body.innerHTML='';vi.useRealTimers();});
it('counts only learning contexts, excludes menus, and stops after one minute idle',async()=>{
 const {c,send}=setup();now+=1000;c.sample();expect(studied(send)).toBe(0);
 const unregister=registerStudyContext('theory','theory:advanced:lesson-15');cleanups.push(unregister);
 for(let i=0;i<70;i++){now+=1000;c.sample();}await c.flush();expect(studied(send)).toBe(59000);
 c.touch();now+=1000;c.sample();await c.flush();expect(studied(send)).toBe(60000);
 unregister();now+=1000;c.sample();await c.flush();expect(studied(send)).toBe(60000);
});
it('excludes hidden intervals and never counts sleep as hours of activity',async()=>{
 const {c,send}=setup();cleanups.push(registerStudyContext('games','lesson15-verbs'));
 now+=1000;c.sample();hidden(true);c.sample();now+=60000;c.sample();hidden(false);c.sample();c.touch();now+=1000;c.sample();await c.flush();expect(studied(send)).toBe(2000);
 now+=3600000;c.touch();await c.flush();expect(studied(send)).toBe(2000);
});
it('splits at midnight in Vietnam rather than UTC',async()=>{
 now=Date.parse('2026-11-01T16:59:59Z');const {c,send}=setup();cleanups.push(registerStudyContext('cards','cards:advanced:lesson-44'));
 now+=2000;c.sample();await c.flush();const activity=rows(send).filter(a=>a.category==='cards');
 expect(activity.map(a=>[a.day,a.active_ms])).toEqual([['2026-11-01',1000],['2026-11-02',1000]]);expect(vietnamDay(now)).toBe('2026-11-02');
});
it('counts advancing media while listening but keeps game effects inside games',async()=>{
 const {c,send}=setup();const audio=document.createElement('audio');document.body.append(audio);Object.defineProperty(audio,'paused',{value:false});Object.defineProperty(audio,'ended',{value:false});c.sample();
 now+=1000;audio.currentTime=1;c.sample();await c.flush();expect(rows(send).find(a=>a.category==='audio')?.active_ms).toBe(1000);
 cleanups.push(registerStudyContext('games','lesson15-verbs'));now+=1000;audio.currentTime=2;c.sample();await c.flush();expect(rows(send).find(a=>a.category==='games')?.active_ms).toBe(1000);
});
it('queues answers without networking, retries identical IDs, and restores offline data per account',async()=>{
 const send=makeSender().mockRejectedValue(new Error('offline'));const {c}=setup('one',send);c.answer(input);expect(send).not.toHaveBeenCalled();await c.flush();const id=(send.mock.calls[0][1] as StudyAnswer[])[0].id;
 const restored=setup('one');await restored.c.flush();expect(restored.send.mock.calls[0][1][0].id).toBe(id);
 const other=setup('two');await other.c.flush();expect(other.send.mock.calls[0][1]).toHaveLength(0);expect(rows(other.send).every(r=>r.user_id==='two')).toBe(true);
});
it('preserves updates and answers created during an upload',async()=>{
 let resolve!:()=>void;const send=makeSender().mockImplementationOnce(()=>new Promise<void>(r=>{resolve=r;})).mockResolvedValue(undefined);const {c}=setup('one',send);cleanups.push(registerStudyContext('games','lesson15-verbs'));c.answer(input);const upload=c.flush();now+=1000;c.sample();c.answer({...input,vi:'nghe'});resolve();await upload;await c.flush();
 expect(send.mock.calls[1][1]).toHaveLength(1);expect(send.mock.calls[1][1][0].vi).toBe('nghe');expect(studied(send)).toBe(1000);expect(send.mock.calls[0][1][0].vi).toBe('nghĩ');
});
it('ignores hidden and unattended timer answers',async()=>{
 const {c,send}=setup();hidden(true);c.answer(input);hidden(false);now+=61000;c.answer({...input,result:'timeout',chosen:null});await c.flush();expect(send.mock.calls[0][1]).toHaveLength(0);
});
it('keeps tab outboxes separate and leases time to one visible tab',async()=>{
 const a=setup();sessionStorage.clear();const b=setup();cleanups.push(registerStudyContext('games','lesson15-verbs'));now+=1000;a.c.sample();b.c.sample();a.c.answer(input);b.c.answer({...input,vi:'nghe'});await a.c.flush();await b.c.flush();
 expect(studied(a.send)+studied(b.send)).toBe(1000);expect(Object.keys(localStorage).filter(k=>k.includes('.v2.'))).toHaveLength(2);
});
it('registers collection without blocking and cleans up timer on account change',async()=>{
 vi.useFakeTimers();vi.setSystemTime(now);const send=makeSender();const stop=startStudyCollection('one',send);cleanups.push(registerStudyContext('games','lesson15-verbs'));reportStudyAnswer(input);await vi.advanceTimersByTimeAsync(30000);stop();await vi.advanceTimersByTimeAsync(1);expect(send.mock.calls.flatMap(c=>c[1] as StudyAnswer[]).some(a=>a.vi==='nghĩ')).toBe(true);expect(vi.getTimerCount()).toBe(0);
});
