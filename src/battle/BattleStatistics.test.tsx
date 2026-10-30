import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
const rpc=vi.hoisted(()=>vi.fn());
vi.mock('../domain/cloud',()=>({supabase:{rpc}}));
import {BattleStatistics} from './BattleStatistics';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
let node:HTMLDivElement,root:ReturnType<typeof createRoot>;
beforeEach(()=>{rpc.mockReset();node=document.createElement('div');document.body.append(node);root=createRoot(node);});
afterEach(async()=>{await act(async()=>root.unmount());node.remove();});
it('shows an empty state and a working play button',async()=>{
 rpc.mockResolvedValue({data:{viewer_id:'a',matches:[]},error:null});const play=vi.fn();
 await act(async()=>root.render(<BattleStatistics onPlay={play}/>));
 expect(node.textContent).toContain('Пока нет завершённых батлов');
 await act(async()=>[...node.querySelectorAll('button')].find(b=>b.textContent==='Играть')!.click());expect(play).toHaveBeenCalledOnce();
});
it('shows medals, highlights the viewer and expands opponent results',async()=>{
 const data={viewer_id:'a',matches:[{id:'1',played_at:'2026-10-30',host_id:'a',guest_id:'b',host_name:'Светлана',guest_name:'Константин',score_host:12,score_guest:5,topic:'fruits'}]};
 rpc.mockResolvedValue({data,error:null});await act(async()=>root.render(<BattleStatistics onPlay={()=>{}}/>));
 expect(node.querySelectorAll('tbody tr')).toHaveLength(2);expect(node.textContent).toContain('🥇');expect(node.textContent).toContain('🥈');
 expect(node.querySelector('.battle-stats-own')?.textContent).toContain('Светлана');
 await act(async()=>(node.querySelector('tbody button') as HTMLButtonElement).click());
 expect(node.querySelector('.battle-stats-details')?.textContent).toContain('12:5');
 expect(node.querySelector('.battle-stats-details')?.textContent).toContain('Константин');
});
it('retries a failed request',async()=>{
 rpc.mockResolvedValueOnce({error:{message:'offline'}}).mockResolvedValue({data:{viewer_id:'a',matches:[]},error:null});
 await act(async()=>root.render(<BattleStatistics onPlay={()=>{}}/>));expect(node.querySelector('[role="alert"]')).not.toBeNull();
 await act(async()=>[...node.querySelectorAll('button')].find(b=>b.textContent==='Повторить')!.click());
 expect(node.textContent).toContain('Пока нет завершённых батлов');
});
