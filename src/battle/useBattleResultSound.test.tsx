import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { expect,it,vi } from 'vitest';
const fx=vi.hoisted(()=>({play:vi.fn(()=>vi.fn())}));
vi.mock('./resultAudio',()=>({playBattleResultSound:fx.play}));
import { useBattleResultSound } from './useBattleResultSound';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
function Result({id,outcome}:{id:string|null;outcome:'victory'|'defeat'|null}){useBattleResultSound(id,outcome);return null;}
it('plays once per match, stops on leaving, and permits the next rematch',()=>{
 fx.play.mockClear();const root=createRoot(document.createElement('div'));
 act(()=>root.render(<Result id={null} outcome={null}/>));expect(fx.play).not.toHaveBeenCalled();
 act(()=>root.render(<Result id="one" outcome="defeat"/>));const stop=fx.play.mock.results[0].value;expect(fx.play).toHaveBeenCalledWith('defeat');
 act(()=>root.render(<Result id="one" outcome="defeat"/>));expect(fx.play).toHaveBeenCalledTimes(1);
 act(()=>root.render(<Result id={null} outcome={null}/>));expect(stop).toHaveBeenCalledTimes(1);
 act(()=>root.render(<Result id="two" outcome="victory"/>));expect(fx.play).toHaveBeenCalledTimes(2);expect(fx.play).toHaveBeenLastCalledWith('victory');
 act(()=>root.unmount());expect(fx.play.mock.results[1].value).toHaveBeenCalledTimes(1);
});
it('cancels the first StrictMode setup so it does not leave duplicate playback',()=>{
 fx.play.mockClear();const root=createRoot(document.createElement('div'));
 act(()=>root.render(<StrictMode><Result id="strict" outcome="victory"/></StrictMode>));
 expect(fx.play.mock.results[0].value).toHaveBeenCalledTimes(1);expect(fx.play.mock.results[1].value).not.toHaveBeenCalled();act(()=>root.unmount());
});
