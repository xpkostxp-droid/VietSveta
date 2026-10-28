// @vitest-environment jsdom
import {beforeEach,expect,it} from 'vitest';
import {leaderboardRows,selectParticipant,recordParticipantAttempt} from './leaderboard';
import {saveTimedAttempt} from './answerTime';
beforeEach(()=>localStorage.clear());
it('starts with five unranked participants and no invented results',()=>{expect(leaderboardRows('questions-15')).toHaveLength(5);expect(leaderboardRows('questions-15').every(p=>p.rank===null)).toBe(true);});
it('ranks best count then fastest time, preserves ties and isolates games',()=>{
 selectParticipant('svetlana');recordParticipantAttempt('questions-15',7,8000);recordParticipantAttempt('questions-15',6,1000);
 selectParticipant('lesya');recordParticipantAttempt('questions-15',7,7000);
 selectParticipant('sergey-p');recordParticipantAttempt('questions-15',7,7000);
 expect(leaderboardRows('questions-15').slice(0,3).map(p=>[p.id,p.rank])).toEqual([['lesya',1],['sergey-p',1],['svetlana',3]]);
 expect(leaderboardRows('questions-24').every(p=>!p.record)).toBe(true);
});
it('adds completed game attempts for selected player and excludes review',()=>{
 selectParticipant('svetlana');const attempt={game:'harvest-40' as const,correct:4,total:40,answerTimeMs:10000,correctTimeMs:6000,completed:false};saveTimedAttempt(attempt);
 expect(leaderboardRows('harvest-40')[0].record?.correct).toBe(4);
 saveTimedAttempt({...attempt,game:'harvest-review',correct:10});expect(leaderboardRows('harvest-40')[0].record?.correct).toBe(4);
 selectParticipant('');recordParticipantAttempt('questions-15',8,2000);expect(leaderboardRows('questions-15').every(p=>!p.record)).toBe(true);
});
