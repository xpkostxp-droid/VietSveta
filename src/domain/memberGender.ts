export type MemberGender='man'|'woman';
// Stable account IDs from the roster; display names do not determine identity.
export function memberGender(memberId:string):MemberGender{
 return ['svetlana','lesya','marina'].includes(memberId)?'woman':'man';
}
