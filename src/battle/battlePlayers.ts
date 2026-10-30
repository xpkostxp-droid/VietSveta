import {memberGender,type MemberGender} from '../domain/memberGender';
import type {Match} from './battleTypes';
export type CourtPlayers={near:MemberGender;far:MemberGender};
export function courtPlayers(match:Pick<Match,'side'|'host_member_id'|'guest_member_id'>):CourtPlayers{
 const host=memberGender(match.host_member_id??''),guest=memberGender(match.guest_member_id??'');
 return match.side==='host'?{near:host,far:guest}:{near:guest,far:host};
}
