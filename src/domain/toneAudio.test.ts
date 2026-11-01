import {toneBasics} from '../content/toneBasics';
import {expect,it,vi} from 'vitest';
import {createToneAudio} from './toneAudio';
import {toneWords,tones} from '../content/toneWords';
import {toneSyllables} from '../content/toneSyllables';
it('keeps the agreed seventeen beginner recordings and all six tones',()=>{
 expect(toneSyllables.map(w=>w.vi)).toEqual(['thi','thí','thì','thị','ve','vé','vẻ','vẹ','la','lá','là','me','mé','mẹ','nghi','nghỉ','nghĩ']);
 expect(new Set(toneSyllables.map(w=>w.tone)).size).toBe(6);
});
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

it('has exactly five approved syllables in all six tones, using thirty distinct files',()=>{
 expect(toneBasics.map(w=>w.vi)).toEqual('la là lã lả lá lạ bo bò bõ bỏ bó bọ me mè mẽ mẻ mé mẹ cu cù cũ củ cú cụ ga gà gã gả gá gạ'.split(' '));
 for(const tone of tones)expect(toneBasics.filter(w=>w.tone===tone)).toHaveLength(5);
 expect(new Set(toneBasics.map(w=>w.audio)).size).toBe(30);
 expect(toneBasics.every(w=>w.ru==='')).toBe(true);
});
