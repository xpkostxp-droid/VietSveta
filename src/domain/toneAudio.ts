import {toneWords} from '../content/toneWords';
/** Decoded before the countdown. Both scheduled repetitions share one cancellation path. */
export function createToneAudio(){
 let context:AudioContext|undefined;
 let sources:AudioBufferSourceNode[]=[];
 const buffers=new Map<string,AudioBuffer>();
 let closed=false;
 function unlock(){
  if(closed)return;
  const Constructor=window.AudioContext??(window as unknown as {webkitAudioContext:typeof AudioContext}).webkitAudioContext;
  if(!Constructor)throw new Error('Аудио недоступно в этом браузере');
  context??=new Constructor();return context.resume();
 }
 function stop(){for(const s of sources){try{s.stop();}catch{/* Already ended. */}s.disconnect();}sources=[];}
 return {unlock,stop,
  async load(){
   if(!context)throw new Error('audio locked');
   const ctx=context;
   // Bounded requests; opening the main application never loads these files.
   let next=0;
   await Promise.all(Array.from({length:4},async()=>{while(!closed&&next<toneWords.length){
    const word=toneWords[next++];if(buffers.has(word.id))continue;
    const response=await fetch(import.meta.env.BASE_URL+word.audio,{signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw new Error('audio unavailable');
    const buffer=await ctx.decodeAudioData(await response.arrayBuffer());
    if(!closed)buffers.set(word.id,buffer);
   }}));
   if(closed)throw new Error('closed');
  },
  playTwice(id:string){
   stop();const buffer=buffers.get(id);
   if(!context||context.state!=='running'||!buffer)throw new Error('audio unavailable');
   const start=context.currentTime;
   for(const offset of [0,buffer.duration+.35]){
    const source=context.createBufferSource();source.buffer=buffer;source.connect(context.destination);
    sources.push(source);source.start(start+offset);
   }
  },
  close(){closed=true;stop();buffers.clear();if(context)void context.close().catch(()=>{});}
 };
}
