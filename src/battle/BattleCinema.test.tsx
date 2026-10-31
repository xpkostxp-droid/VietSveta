import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
const resultFx=vi.hoisted(()=>({play:vi.fn(()=>vi.fn()),ready:vi.fn()}));
vi.mock('./resultAudio',()=>({playBattleResultSound:resultFx.play,readyBattleResultAudio:resultFx.ready}));
import { BattleCinema } from './BattleCinema';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
let node:HTMLDivElement,root:ReturnType<typeof createRoot>;
beforeEach(()=>{vi.clearAllMocks();node=document.createElement('div');document.body.append(node);root=createRoot(node);vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();});
afterEach(async()=>{await act(async()=>root.unmount());node.remove();vi.restoreAllMocks();});
it('preloads both inline clips and starts the chosen preview from a tap',async()=>{
 await act(async()=>root.render(<BattleCinema lobby result={null}/>));
 const videos=[...node.querySelectorAll('video')];
 expect(videos).toHaveLength(2);
 expect(videos.every(v=>v.preload==='auto'&&v.playsInline)).toBe(true);
 await act(async()=>([...node.querySelectorAll('button')].find(b=>b.textContent==='Смэш соперника')!).click());
 expect(videos[1].className).toBe('is-selected');expect(videos[1].muted).toBe(false);
});
it.each(['near','far'] as const)('plays %s winner once despite repeated server snapshots',async(outcome)=>{
 await act(async()=>root.render(<BattleCinema lobby={false} result={{key:'match',outcome,label:'Итог'}}/>));
 const play=vi.mocked(HTMLMediaElement.prototype.play);expect(play).toHaveBeenCalledTimes(1);
 expect(node.querySelector('video.is-selected')?.getAttribute('src')).toContain(outcome);
 expect((node.querySelector('video.is-selected') as HTMLVideoElement).muted).toBe(true);expect(resultFx.play).toHaveBeenCalledWith(outcome==='near'?'victory':'defeat');
 await act(async()=>root.render(<BattleCinema lobby={false} result={{key:'match',outcome,label:'Итог'}}/>));
 expect(play).toHaveBeenCalledTimes(1);
});
it('offers manual playback when autoplay is blocked and keeps an error inside the video panel',async()=>{
 vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValue(new Error('blocked'));
 await act(async()=>root.render(<BattleCinema lobby={false} result={{key:'match',outcome:'far',label:'Итог'}}/>));
 expect(node.textContent).toContain('Смотреть смэш');
 await act(async()=>node.querySelector('video.is-selected')!.dispatchEvent(new Event('error')));
 expect(node.textContent).toContain('Игра продолжает работать');
});

it('keeps the old video soundtrack muted and offers replay if video autoplay is blocked',async()=>{
 vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(new Error('audio blocked')).mockResolvedValueOnce();
 await act(async()=>root.render(<BattleCinema lobby={false} result={{key:'silent-fallback',outcome:'near',label:'Итог'}}/>));
 expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
 expect((node.querySelector('video.is-selected') as HTMLVideoElement).muted).toBe(true);
 expect(node.textContent).toContain('Смотреть смэш');
});
it.each([['near','victory'],['far','defeat']] as const)('plays the %s perspective with %s crowd reaction',async(outcome,reaction)=>{
 await act(async()=>root.render(<BattleCinema lobby={false} result={{key:'reaction',outcome,label:'Итог'}}/>));
 expect(node.querySelector('video.is-selected')?.getAttribute('src')).toContain(reaction);
 const other=node.querySelector('video:not(.is-selected)') as HTMLVideoElement;
 expect(other.className).not.toContain('is-selected');
});
it.each([['woman','man'],['man','woman'],['woman','woman']] as const)('keeps %s/%s players through the finale and plays the reaction audio once',async(near,far)=>{
 await act(async()=>root.render(<BattleCinema lobby={false} compact players={{near,far}} result={{key:'female-final',outcome:'near',label:'Твоя победа!'}}/>));
 expect(node.querySelector('video')).toBeNull();
 expect(node.querySelector('.battle-court')?.getAttribute('data-near-gender')).toBe(near);
 expect(node.querySelector('.battle-court')?.getAttribute('data-far-gender')).toBe(far);
 expect(node.querySelector('audio')).toBeNull();
 expect(resultFx.play).toHaveBeenCalledTimes(1);expect(resultFx.play).toHaveBeenCalledWith('victory');
 await act(async()=>root.render(<BattleCinema lobby={false} compact players={{near,far}} result={{key:'female-final',outcome:'near',label:'Твоя победа!'}}/>));
 expect(resultFx.play).toHaveBeenCalledTimes(1);
});
