import {expect,it} from 'vitest';
import {courtPlayers} from './battlePlayers';
import {sceneTiming} from './battleScene';
it.each(['svetlana','lesya','marina'])('uses a woman for %s on both devices',id=>{
 expect(courtPlayers({side:'host',host_member_id:'sergey-p',guest_member_id:id})).toEqual({near:'man',far:'woman'});
 expect(courtPlayers({side:'guest',host_member_id:'sergey-p',guest_member_id:id})).toEqual({near:'woman',far:'man'});
 expect(courtPlayers({side:'host',host_member_id:id,guest_member_id:'artur'})).toEqual({near:'woman',far:'man'});
});
it('supports two women and two men without forcing a mixed pair',()=>{
 expect(courtPlayers({side:'guest',host_member_id:'svetlana',guest_member_id:'marina'})).toEqual({near:'woman',far:'woman'});
 expect(courtPlayers({side:'host',host_member_id:'konstantin',guest_member_id:'admin'})).toEqual({near:'man',far:'man'});
});
it('keeps the final point on court after its animation, rather than starting a rally',()=>{
 const t=sceneTiming({key:'final',round:20,now:15000,starts:Infinity,finalPointAt:1000,winner:'near',nearBlue:true});
 expect(t.phase).toBe('point');expect(t.seconds).toBe(14);
});
