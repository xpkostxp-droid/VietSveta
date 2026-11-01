import {expect,it} from 'vitest';
import {overallPlayers,gameGroup,type OverallPlayer,type OverallMedal} from './overallRanking';
import {profileGames} from './profileGames';
const medal=(game:OverallMedal['game'],place:number):OverallMedal=>({game,place,correct:10,total:20,correct_time_ms:1000});
it('sorts gold before any number of silver, then bronze, and gives identical counts equal places',()=>{
 const rows:OverallPlayer[]=[{id:'b',name:'Б',medals:[medal('lesson15-verbs',2),medal('harvest-fruits',2),medal('harvest-vegetables',3)]},{id:'a',name:'А',medals:[medal('lesson15-verbs',1)]},{id:'c',name:'В',medals:[medal('harvest-fruits',1)]},{id:'n',name:'Нет',medals:[]}];
 expect(overallPlayers(rows,'all').map(p=>[p.id,p.place,p.counts])).toEqual([['a',1,[1,0,0]],['c',1,[1,0,0]],['b',3,[0,2,1]],['n',null,[0,0,0]]]);
});
it('filters games by course, keeps the same participants and ignores retired games',()=>{
 const rows:OverallPlayer[]=[{id:'a',name:'А',medals:[medal('lesson15-verbs',1),medal('lesson10-family',3),{...medal('harvest-fruits',1),game:'harvest-40' as any}]}];
 expect(overallPlayers(rows,'beginner')[0].counts).toEqual([0,0,1]);expect(overallPlayers(rows,'advanced')[0].counts).toEqual([1,0,0]);expect(rows[0].medals).toHaveLength(3);
 expect(profileGames.filter(g=>gameGroup(g.id)==='beginner')).toHaveLength(9);expect(profileGames.filter(g=>gameGroup(g.id)==='advanced')).toHaveLength(9);
});
