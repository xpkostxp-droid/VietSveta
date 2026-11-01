import {expect,it,vi} from 'vitest';
import {createToneAudio} from './toneAudio';
import {toneWords,tones} from '../content/toneWords';
it('has five known single-syllable words per tone without repeats',()=>{
 expect(new Set(toneWords.map(w=>w.vi)).size).toBe(30);
 for(const tone of tones)expect(toneWords.filter(w=>w.tone===tone)).toHaveLength(5);
 expect(toneWords.every(w=>!w.vi.includes(' '))).toBe(true);
});
it('cancels the playing word and both scheduled repetitions immediately',async()=>{
 const sources:any[]=[];
 class Context {state='running';currentTime=10;destination={};resume=vi.fn().mockResolvedValue(undefined);close=vi.fn().mockResolvedValue(undefined);decodeAudioData=vi.fn().mockResolvedValue({duration:.6});createBufferSource(){const s={connect:vi.fn(),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn(),buffer:null};sources.push(s);return s;}}
 vi.stubGlobal('AudioContext',Context);vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)}));
 try{const audio=createToneAudio();await audio.unlock();await audio.load();audio.playThreeTimes(toneWords[0].id);expect(sources).toHaveLength(3);expect(sources[0].start).toHaveBeenCalledWith(10);expect(sources[1].start).toHaveBeenCalledWith(10.95);expect(sources[2].start).toHaveBeenCalledWith(11.9);audio.stop();expect(sources.every(s=>s.stop.mock.calls.length===1)).toBe(true);audio.close();}finally{vi.unstubAllGlobals();}
});
