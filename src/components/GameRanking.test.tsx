// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {expect,it,vi} from 'vitest';
import {GameRanking} from './GameRanking';
const calls=vi.hoisted(()=>({order:[] as string[],fail:false}));
vi.mock('../domain/cloud',()=>({
 cachedMember:()=>({id:'lesya',user_id:'test-owner',is_admin:false}),
 syncAccount:vi.fn(async()=>{calls.order.push('sync');if(calls.fail)throw Error();}),
 memberRequest:vi.fn(async()=>{calls.order.push('ranking');if(calls.fail)throw Error();return {rows:[{id:'svetlana',name:'Светлана',best:{correct:7,correct_time_ms:900}},{id:'lesya',name:'Леся',best:{correct:7,correct_time_ms:800}},{id:'marina',name:'Марина',best:null}]};})
}));
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
const flush=async()=>{await act(async()=>{await new Promise(r=>setTimeout(r,15));});};
it('reads immediately without full sync, uploads completed runs first and permits offline play',async()=>{
 const node=document.createElement('div'),root=createRoot(node),start=vi.fn();
 await act(async()=>root.render(<GameRanking game="questions-15" total={30} onStart={start}/>));await flush();
 expect(calls.order).toEqual(['ranking']);
 expect(node.querySelector('.ranking-own')?.textContent).toContain('Леся · ты');
 expect(node.textContent).toContain('7 из 30 · 0,80 сек');
 expect(node.textContent).toContain('Пока нет результата');
 await act(async()=>node.querySelector('button')!.click());expect(start).toHaveBeenCalledOnce();
 await act(async()=>root.unmount());
 const next=createRoot(node);await act(async()=>next.render(<GameRanking game="questions-15" total={30} onStart={start} result={{correct:7,time:800}}/>));await flush();
 expect(calls.order).toEqual(['ranking','sync','ranking']);
 expect(node.textContent).toContain('Твоё место: 1');expect(node.textContent).not.toContain('Новый личный рекорд');
 await act(async()=>next.unmount());
 calls.fail=true;const offline=createRoot(node);await act(async()=>offline.render(<GameRanking game="questions-24" total={48} onStart={start}/>));await flush();
 expect(node.textContent).toContain('Рейтинг пока недоступен');
 expect(node.querySelector('button')?.disabled).toBe(false);
 await act(async()=>offline.unmount());
});
it('puts the start button before statistics for every game',async()=>{
 calls.fail=false;calls.order=[];
 const node=document.createElement('div'),root=createRoot(node);
 await act(async()=>root.render(<GameRanking game="adjectives-tetris" total={36} onStart={()=>{}} startLabel="Начать"/>));await flush();
 const rows=node.querySelectorAll('.ranking-row'),button=node.querySelector('.ranking-start')!;
 expect(rows.length).toBeGreaterThan(0);expect(button.compareDocumentPosition(rows[0])&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 expect(node.textContent).toContain('7 из 36');await act(async()=>root.unmount());
});

it('shows the saved table immediately on reopening and keeps it during a network failure',async()=>{
 calls.fail=false;calls.order=[];
 const node=document.createElement('div'),root=createRoot(node);
 await act(async()=>root.render(<GameRanking game="cache-test" total={20} onStart={()=>{}}/>));await flush();
 await act(async()=>root.unmount());
 calls.fail=true;calls.order=[];
 const reopened=createRoot(node);
 await act(async()=>reopened.render(<GameRanking game="cache-test" total={20} onStart={()=>{}}/>));
 // Check before the scheduled network request has completed.
 expect(node.querySelectorAll('.ranking-row')).toHaveLength(3);
 expect(node.textContent).toContain('Леся · ты');
 await flush();
 expect(calls.order).toEqual(['ranking']);
 expect(node.textContent).toContain('Рейтинг пока недоступен');
 expect(node.querySelectorAll('.ranking-row')).toHaveLength(3);
 await act(async()=>reopened.unmount());calls.fail=false;
});
it('does not reuse another game cache or expired cache',async()=>{
 localStorage.setItem('vietSveta.ranking.v1:test-owner::expired-test',JSON.stringify({savedAt:Date.now()-25*60*60*1000,rows:[{id:'old',name:'Устаревший',best:null}]}));
 calls.fail=true;
 const node=document.createElement('div'),root=createRoot(node);
 await act(async()=>root.render(<GameRanking game="expired-test" total={20} onStart={()=>{}}/>));
 expect(node.querySelectorAll('.ranking-row')).toHaveLength(0);
 await flush();await act(async()=>root.unmount());calls.fail=false;
});
