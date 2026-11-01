import {act} from 'react';import {createRoot,type Root} from 'react-dom/client';
import {beforeEach,afterEach,expect,it,vi} from 'vitest';
import OverallRanking from './OverallRanking';
import {memberRequest,cachedMember} from '../domain/cloud';
import type {OverallRankingData,OverallMedal} from '../domain/overallRanking';
vi.mock('../domain/cloud',()=>({memberRequest:vi.fn(),cachedMember:vi.fn()}));
const medal=(game:OverallMedal['game'],place:number):OverallMedal=>({game,place,correct:20,total:40,correct_time_ms:1000});
const fixture=():OverallRankingData=>({viewer_id:'own',generated_at:'2026-11-01T00:00:00Z',rows:[{id:'a',name:'Светлана',medals:[medal('lesson15-verbs',1),medal('harvest-fruits',1)]},{id:'b',name:'Сергей П',medals:[medal('harvest-vegetables',1)]},{id:'c',name:'Леся',medals:[medal('questions-15',2)]},{id:'own',name:'Мой игрок',medals:[medal('lesson10-family',3)]},{id:'d',name:'Новый игрок',medals:[]}]});
let node:HTMLDivElement,root:Root,sequence=0;const open=vi.fn();
beforeEach(()=>{vi.clearAllMocks();(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;vi.mocked(cachedMember).mockReturnValue({id:'own',user_id:String(++sequence),display_name:'Мой игрок',is_admin:false});vi.mocked(memberRequest).mockResolvedValue(fixture());node=document.createElement('div');document.body.append(node);root=createRoot(node);});
afterEach(()=>{act(()=>root.unmount());node.remove();});
const render=()=>act(async()=>root.render(<OverallRanking onOpenGame={open}/>));
const player=(id:string)=>node.querySelector<HTMLButtonElement>(`[aria-controls="overall-details-${id}"]`)!;
it('shows three leaders plus the highlighted own row and expands all on demand',async()=>{
 await render();expect(memberRequest).toHaveBeenCalledWith({action:'overall-ranking'});expect(node.querySelectorAll('.overall-player-toggle')).toHaveLength(4);expect(node.querySelector('.overall-own')?.textContent).toContain('Мой игрок');expect(node.textContent).not.toContain('Новый игрок');
 await act(async()=>node.querySelector<HTMLButtonElement>('.overall-more')!.click());expect(node.querySelectorAll('.overall-player-toggle')).toHaveLength(5);expect(node.textContent).toContain('Новый игрок');
});
it('expands only one player, shows their actual medals, and opens the exact game',async()=>{
 await render();await act(async()=>player('a').click());expect(node.querySelector('#overall-details-a')?.textContent).toContain('Глаголы');expect(node.querySelector('#overall-details-a')?.textContent).toContain('Золото · 2');
 await act(async()=>node.querySelector<HTMLButtonElement>('.overall-game')!.click());expect(open).toHaveBeenCalledWith('lesson15-verbs');
 await act(async()=>player('b').click());expect(node.querySelector('#overall-details-a')).toBeNull();expect(player('b').getAttribute('aria-expanded')).toBe('true');await act(async()=>player('b').click());expect(node.querySelector('.overall-details')).toBeNull();
});
it('filters by game course without another request and shows an empty-medal explanation',async()=>{
 await render();await act(async()=>[...node.querySelectorAll('button')].find(b=>b.textContent==='Начальная')!.click());expect(memberRequest).toHaveBeenCalledTimes(1);expect(node.querySelector('.overall-player-toggle')?.textContent).toContain('Мой игрок');
 await act(async()=>player('c').click());expect(node.textContent).toContain('Пока нет медалей');expect(node.querySelectorAll('.overall-game')).toHaveLength(0);
});
it('handles loading failure and retry without fake standings',async()=>{
 vi.mocked(memberRequest).mockRejectedValueOnce(new Error('offline'));await render();expect(node.textContent).toContain('Не удалось обновить рейтинг');expect(node.querySelector('.overall-players')).toBeNull();await act(async()=>[...node.querySelectorAll('button')].find(b=>b.textContent==='Обновить рейтинг')!.click());expect(node.querySelector('.overall-players')).toBeTruthy();
});
