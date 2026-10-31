// The cough file is already at 25% of its source amplitude. The approved
// playback gain is 0.25 / 3 after the requested further reduction.
// Do not normalize the file on load.
export function createDragonSounds(){
 let context:AudioContext|null=null,closed=false;
 const buffers:Partial<Record<'success'|'error',AudioBuffer>>={};
 const sources=new Set<AudioBufferSourceNode>();
 let loading:Promise<void>|null=null;
 const prepare=()=>{
  if(closed)return Promise.resolve();
  const AC=window.AudioContext??(window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
  if(!AC)return Promise.resolve();
  context??=new AC();void context.resume().catch(()=>{});
  loading??=Promise.all((['success','error'] as const).map(async kind=>{
   const response=await fetch(import.meta.env.BASE_URL+'dragon-media/'+(kind==='success'?'fire':'cough')+'.mp3');
   if(!response.ok)throw new Error('Audio load');const bytes=await response.arrayBuffer();
   const decoded=await context!.decodeAudioData(bytes);if(!closed)buffers[kind]=decoded;
  })).then(()=>{}).catch(()=>{loading=null});
  return loading;
 };
 const stop=()=>{for(const source of sources){try{source.stop()}catch{/* Already ended. */}}sources.clear()};
 return {prepare,stop,
  play(kind:'success'|'error'){
   if(closed||!context||context.state!=='running'||!buffers[kind])return;
   stop();const source=context.createBufferSource(),level=context.createGain();
   source.buffer=buffers[kind]!;level.gain.setValueAtTime(kind==='error'?(.25/3):1,context.currentTime);
   source.connect(level);level.connect(context.destination);sources.add(source);
   source.onended=()=>{sources.delete(source);source.disconnect();level.disconnect()};
   source.start(context.currentTime+(kind==='success'?.42:.65),0,kind==='error'?Math.min(1,source.buffer.duration):source.buffer.duration);
  },
  close(){closed=true;stop();void context?.close().catch(()=>{})}
 };
}
