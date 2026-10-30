import {expect,it} from 'vitest';
import {assignNinjaCharacters,ninjaGenderForMember} from './ninjaCharacters';
import {ninjaFruitPosition} from './NinjaStage';
it.each(['svetlana','lesya','marina'])('uses female characters for %s and never duplicates a same-gender opponent',id=>{
 expect(ninjaGenderForMember(id)).toBe('woman');
 for(const random of [()=>0,()=>.99]){const pair=assignNinjaCharacters(id,id,random);expect(pair.human.endsWith('-woman')).toBe(true);expect(pair.bot.endsWith('-woman')).toBe(true);expect(pair.human).not.toBe(pair.bot);}
});
it.each(['admin','konstantin','artur','sergey-p','sergey-k'])('uses male characters for %s',id=>{
 const pair=assignNinjaCharacters(id,id,()=>0);expect(pair.human).toBe('teal-man');expect(pair.bot).toBe('red-man');
});
it('respects both roster identities for a mixed pair',()=>{
 const pair=assignNinjaCharacters('konstantin','svetlana',()=>.99);expect(pair.human).toBe('red-man');expect(pair.bot).toBe('red-woman');
});
it('falls monotonically from top to floor without circling sideways',()=>{
 const positions=Array.from({length:21},(_,i)=>ninjaFruitPosition(i/20));
 expect(positions[0]).toEqual({x:50,y:8});expect(positions[20]).toEqual({x:50,y:83});
 expect(positions.every(p=>p.x===50)).toBe(true);expect(positions.slice(1).every((p,i)=>p.y>positions[i].y)).toBe(true);
});
