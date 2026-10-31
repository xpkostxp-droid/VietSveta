import { dragonTiming } from './dragonTiming';
import { verbGameWords } from '../content/verbGame';
// The cough file is already at 25% of its source amplitude. The approved
// playback gain is now 0.25 / 6 after the requested further reductions.
// Do not normalize the file on load.
export function createDragonSounds(){
 let context:AudioContext|null=null,closed=false;
 const buffers:Partial<Record<'success'|'error',AudioBuffer>>={};
 const sources=new Set<AudioBufferSourceNode>();
 const voiceBuffers=new Map<number,AudioBuffer>(),voiceLoads=new Map<number,Promise<AudioBuffer>>();
 const abort=new AbortController();
 let voiceSource:AudioBufferSourceNode|null=null,voiceGeneration=0;
 const stopVoice=()=>{voiceGeneration++;if(voiceSource){try{voiceSource.stop()}catch{/* Ended. */}voiceSource.disconnect();voiceSource=null}};
 const loadVoice=(index:number):Promise<AudioBuffer>=>{
  if(closed||!context||!Number.isInteger(index)||index<0||index>=verbGameWords.length)return Promise.reject(new Error('Voice unavailable'));
  const cached=voiceBuffers.get(index);if(cached)return Promise.resolve(cached);
  const pending=voiceLoads.get(index);if(pending)return pending;
  const request=(async()=>{
   const response=await fetch(import.meta.env.BASE_URL+'dragon-media/voice/'+index+'.mp3',{signal:abort.signal});
   if(!response.ok)throw new Error('Word recording unavailable');
   const decoded=await context!.decodeAudioData(await response.arrayBuffer());
   if(closed)throw new Error('Voice closed');voiceBuffers.set(index,decoded);return decoded;
  })().catch(error=>{voiceLoads.delete(index);throw error});
  voiceLoads.set(index,request);return request;
 };
 let loading:Promise<void>|null=null;
 const prepare=()=>{
  if(closed)return Promise.resolve();
  const AC=window.AudioContext??(window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
  if(!AC)return Promise.resolve();
  context??=new AC();void context.resume().catch(()=>{});
  verbGameWords.forEach((_,index)=>{void loadVoice(index).catch(()=>{/* Retry when needed. */})});
  loading??=Promise.all((['success','error'] as const).map(async kind=>{
   const response=await fetch(import.meta.env.BASE_URL+'dragon-media/'+(kind==='success'?'fire':'cough')+'.mp3',{signal:abort.signal});
   if(!response.ok)throw new Error('Audio load');const bytes=await response.arrayBuffer();
   const decoded=await context!.decodeAudioData(bytes);if(!closed)buffers[kind]=decoded;
  })).then(()=>{}).catch(()=>{loading=null});
  return loading;
 };
 const stop=()=>{stopVoice();for(const source of sources){try{source.stop()}catch{/* Already ended. */}}sources.clear()};
 return {prepare,stop,stopVoice,
  speak(index:number){
   stopVoice();const generation=voiceGeneration;
   void loadVoice(index).then(buffer=>{
    if(closed||generation!==voiceGeneration||!context||context.state!=='running')return;
    const source=context.createBufferSource();source.buffer=buffer;source.connect(context.destination);voiceSource=source;
    source.onended=()=>{if(voiceSource===source)voiceSource=null;source.disconnect()};source.start();
   }).catch(()=>{/* Other game audio and the clock remain available offline. */});
  },
  play(kind:'success'|'error'){
   if(closed||!context||context.state!=='running'||!buffers[kind])return;
   stop();const source=context.createBufferSource(),level=context.createGain();
   source.buffer=buffers[kind]!;level.gain.setValueAtTime(kind==='error'?dragonTiming.coughGain:1,context.currentTime);
   source.connect(level);level.connect(context.destination);sources.add(source);
   source.onended=()=>{sources.delete(source);source.disconnect();level.disconnect()};
   source.playbackRate.value=kind==='success'?dragonTiming.fireRate:dragonTiming.coughRate;
   source.start(context.currentTime+dragonTiming.reactionSeconds,0,kind==='error'?Math.min(dragonTiming.coughSeconds,source.buffer.duration):source.buffer.duration);
  },
  close(){closed=true;abort.abort();stop();void context?.close().catch(()=>{})}
 };
}
