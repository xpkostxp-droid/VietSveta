// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {beforeEach,expect,it} from 'vitest';
import BeginnerApp from '../App';
import {recordResult as beginnerResult,loadProgress as beginnerProgress} from '../domain/progress';
import {recordResult as advancedResult,loadProgress as advancedProgress} from '../../domain/progress';
import {setStorageOwner,accountEntries} from '../../domain/accountStorage';
import {writeJSON} from '../domain/storage';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
beforeEach(()=>{localStorage.clear();setStorageOwner(null);});
it('keeps identical card IDs separate between groups and participants in cloud-ready entries',()=>{
 setStorageOwner('first');beginnerResult('same-card','ru-vi','remembered');advancedResult('same-card','ru-vi','not-remembered');writeJSON('alexviet-listening-completed-v1',['listening-01']);
 expect(Object.values(beginnerProgress().records)[0].lastResult).toBe('remembered');expect(Object.values(advancedProgress().records)[0].lastResult).toBe('not-remembered');
 expect(accountEntries()['vietSveta.beginner.vietCards.progress.v1']).toBeTruthy();expect(accountEntries()['vietSveta.beginner.alexviet-listening-completed-v1']).toBeTruthy();
 setStorageOwner('second');expect(Object.keys(beginnerProgress().records)).toHaveLength(0);expect(Object.keys(advancedProgress().records)).toHaveLength(0);setStorageOwner(null);
});
it.each([['games','Игры по урокам'],['theory','Урок 11'],['cards','Урок 11']] as const)('opens real beginner %s content',async(section,text)=>{
 const node=document.createElement('div'),root=createRoot(node);try{await act(async()=>root.render(<BeginnerApp section={section} onBack={()=>{}}/>));expect(node.textContent).toContain(text);expect(node.textContent).not.toContain('Урок 56');}finally{await act(async()=>root.unmount());}
});
