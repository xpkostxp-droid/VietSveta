// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {createDragonSounds} from './dragonSounds';
afterEach(()=>{vi.unstubAllGlobals()});
it('uses the approved quiet cough gain, schedules the action and caps cough at one second',async()=>{
 const starts=vi.fn(),stops=vi.fn(),gain=vi.fn();
 class AC{state='running';currentTime=10;destination={};resume=async()=>{};close=async()=>{};decodeAudioData=async()=>({duration:1.04});createGain=()=>({gain:{setValueAtTime:gain},connect:vi.fn(),disconnect:vi.fn()});createBufferSource=()=>({buffer:null,connect:vi.fn(),disconnect:vi.fn(),start:starts,stop:stops,onended:null})}
 vi.stubGlobal('AudioContext',AC);vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(16)})));
 const audio=createDragonSounds();await audio.prepare();audio.play('error');expect(gain).toHaveBeenLastCalledWith(.25,10);expect(starts).toHaveBeenLastCalledWith(10.65,0,1);
 audio.stop();expect(stops).toHaveBeenCalledOnce();audio.play('success');expect(gain).toHaveBeenLastCalledWith(1,10);expect(starts).toHaveBeenLastCalledWith(10.42,0,1.04);audio.close();
});
