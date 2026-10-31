// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {createDragonSounds} from './dragonSounds';
afterEach(()=>{vi.unstubAllGlobals()});
it('uses the approved quiet cough gain, schedules the action and caps cough at one second',async()=>{
 const starts=vi.fn(),stops=vi.fn(),gain=vi.fn();
 class AC{state='running';currentTime=10;destination={};resume=async()=>{};close=async()=>{};decodeAudioData=async()=>({duration:1.04});createGain=()=>({gain:{setValueAtTime:gain},connect:vi.fn(),disconnect:vi.fn()});createBufferSource=()=>({buffer:null,connect:vi.fn(),disconnect:vi.fn(),start:starts,stop:stops,onended:null})}
 vi.stubGlobal('AudioContext',AC);vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(16)})));
 const audio=createDragonSounds();await audio.prepare();audio.play('error');expect(gain).toHaveBeenLastCalledWith(.25/3,10);expect(starts).toHaveBeenLastCalledWith(10.65,0,1);
 audio.stop();expect(stops).toHaveBeenCalledOnce();audio.play('success');expect(gain).toHaveBeenLastCalledWith(1,10);expect(starts).toHaveBeenLastCalledWith(10.42,0,1.04);audio.close();
});
it('plays a bundled Vietnamese recording without speechSynthesis or installed voices',async()=>{
 const starts=vi.fn(),fetcher=vi.fn(async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(16)}));
 class AC{state='running';currentTime=10;destination={};resume=async()=>{};close=async()=>{};decodeAudioData=async()=>({duration:1});createBufferSource=()=>({buffer:null,connect:vi.fn(),disconnect:vi.fn(),start:starts,stop:vi.fn(),onended:null})}
 vi.stubGlobal('AudioContext',AC);vi.stubGlobal('speechSynthesis',undefined);vi.stubGlobal('fetch',fetcher);
 const audio=createDragonSounds();await audio.prepare();audio.speak(7);await vi.waitFor(()=>expect(starts).toHaveBeenCalledOnce());
 expect(fetcher.mock.calls.some(call=>String((call as unknown[])[0]).endsWith('voice/7.mp3'))).toBe(true);
 audio.close();
});
it('cancels speech still loading when the player answers or leaves',async()=>{
 const starts=vi.fn();let resolveVoice!:(value:unknown)=>void;
 const delayed=new Promise(resolve=>{resolveVoice=resolve});
 class AC{state='running';currentTime=10;destination={};resume=async()=>{};close=async()=>{};decodeAudioData=async()=>({duration:1});createBufferSource=()=>({buffer:null,connect:vi.fn(),disconnect:vi.fn(),start:starts,stop:vi.fn(),onended:null})}
 vi.stubGlobal('AudioContext',AC);vi.stubGlobal('fetch',vi.fn((url:string)=>url.endsWith('/7.mp3')?delayed:Promise.resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(16)})));
 const audio=createDragonSounds();await audio.prepare();audio.speak(7);audio.stopVoice();resolveVoice({ok:true,arrayBuffer:async()=>new ArrayBuffer(16)});
 await delayed;await Promise.resolve();await Promise.resolve();await Promise.resolve();expect(starts).not.toHaveBeenCalled();audio.close();
});
