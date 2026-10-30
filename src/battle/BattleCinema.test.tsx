import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { BattleCinema } from './BattleCinema';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
let node:HTMLDivElement,root:ReturnType<typeof createRoot>;
beforeEach(()=>{node=document.createElement('div');document.body.append(node);root=createRoot(node);vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();});
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
 expect((node.querySelector('video.is-selected') as HTMLVideoElement).muted).toBe(false);
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

it('falls back to muted playback if the browser refuses audio autoplay',async()=>{
 vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(new Error('audio blocked')).mockResolvedValueOnce();
 await act(async()=>root.render(<BattleCinema lobby={false} result={{key:'silent-fallback',outcome:'near',label:'Итог'}}/>));
 expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2);
 expect((node.querySelector('video.is-selected') as HTMLVideoElement).muted).toBe(true);
 expect(node.textContent).toContain('Повторить со звуком');
});
