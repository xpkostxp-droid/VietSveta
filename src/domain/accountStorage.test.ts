// @vitest-environment jsdom
import {beforeEach,expect,it} from 'vitest';
import {setStorageOwner,accountEntries,applyAccountEntries,mergeEntries} from './accountStorage';
import {readJSON,writeJSON} from './storage';
beforeEach(()=>{localStorage.clear();setStorageOwner(null);});
it('starts every account empty and never imports guest progress',()=>{
 writeJSON('vietCards.progress.v1',{guest:true});setStorageOwner('student-a');expect(readJSON('vietCards.progress.v1')).toBeUndefined();
 writeJSON('vietCards.progress.v1',{owner:'a'});setStorageOwner('student-b');expect(readJSON('vietCards.progress.v1')).toBeUndefined();
 writeJSON('vietCards.progress.v1',{owner:'b'});setStorageOwner('student-a');expect(readJSON('vietCards.progress.v1')).toEqual({owner:'a'});
 setStorageOwner(null);expect(readJSON('vietCards.progress.v1')).toEqual({guest:true});
});
it('merges other device keys without overwriting newer pending changes',()=>{
 expect(mergeEntries({a:{value:1,modified:3}},{a:{value:2,modified:2},b:{value:3,modified:4}})).toEqual({a:{value:1,modified:3},b:{value:3,modified:4}});
 setStorageOwner('a');writeJSON('vietCards.progress.v1',{new:true});const local=accountEntries();
 applyAccountEntries('a',{'vietCards.progress.v1':{value:{old:true},modified:1}});expect(accountEntries()).toEqual(local);
});
