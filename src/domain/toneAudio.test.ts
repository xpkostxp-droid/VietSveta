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
it('fades the active recording, cancels future repetitions immediately and disconnects only after silence',async()=>{
 const sources:any[]=[],gains:any[]=[];
 let ctx:any;
 class Context {
  state='running';currentTime=10;destination={};
  constructor(){ctx=this;}
  resume=vi.fn().mockResolvedValue(undefined);close=vi.fn().mockResolvedValue(undefined);
  decodeAudioData=vi.fn().mockResolvedValue({duration:.6});
  createGain(){const g={gain:{setValueAtTime:vi.fn(),cancelScheduledValues:vi.fn(),linearRampToValueAtTime:vi.fn()},connect:vi.fn(),disconnect:vi.fn()};gains.push(g);return g;}
  createBufferSource(){const s={connect:vi.fn(),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn(),buffer:null,onended:null};sources.push(s);return s;}
 }
 vi.useFakeTimers();vi.stubGlobal('AudioContext',Context);vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)}));
 try{
  const audio=createToneAudio();await audio.unlock();await audio.load();audio.playThreeTimes(toneWords[0].id);
  expect(sources.map(s=>s.start.mock.calls[0][0])).toEqual([10,10.95,11.9]);
  ctx.currentTime=10.2;audio.stop();
  expect(gains[0].gain.linearRampToValueAtTime).toHaveBeenCalledWith(0,10.215);
  expect(sources[0].stop).toHaveBeenCalledWith(10.215);
  expect(sources[0].disconnect).not.toHaveBeenCalled();
  for(const i of [1,2]){expect(sources[i].stop).toHaveBeenCalledWith();expect(sources[i].disconnect).toHaveBeenCalledTimes(1);}
  audio.stop();expect(sources[0].stop).toHaveBeenCalledTimes(1);
  sources[0].onended();expect(sources[0].disconnect).toHaveBeenCalledTimes(1);expect(gains[0].disconnect).toHaveBeenCalledTimes(1);
  audio.playThreeTimes(toneWords[1].id);audio.close();expect(ctx.close).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(20);expect(ctx.close).toHaveBeenCalledTimes(1);
 }finally{vi.unstubAllGlobals();vi.useRealTimers();}
});

it('has exactly five approved syllables in all six tones, using thirty distinct files',()=>{
 expect(toneBasics.map(w=>w.vi)).toEqual('la là lã lả lá lạ bo bò bõ bỏ bó bọ me mè mẽ mẻ mé mẹ cu cù cũ củ cú cụ ga gà gã gả gá gạ'.split(' '));
 for(const tone of tones)expect(toneBasics.filter(w=>w.tone===tone)).toHaveLength(5);
 expect(new Set(toneBasics.map(w=>w.audio)).size).toBe(30);
 expect(toneBasics.every(w=>w.ru==='')).toBe(true);
});
