import {toneWords,type ToneWord} from '../content/toneWords';
/** Decoded before the countdown. All three scheduled repetitions share one cancellation path. */
export function createToneAudio(words:readonly ToneWord[]=toneWords){
 let context:AudioContext|undefined;
 let sources:{source:AudioBufferSourceNode;gain:GainNode;start:number}[]=[];
 const FADE_SECONDS=.015;
 const buffers=new Map<string,AudioBuffer>();
 let closed=false;
 function unlock(){
  if(closed)return;
  const Constructor=window.AudioContext??(window as unknown as {webkitAudioContext:typeof AudioContext}).webkitAudioContext;
  if(!Constructor)throw new Error('Аудио недоступно в этом браузере');
  context??=new Constructor();return context.resume();
 }
 function stop(){
  const now=context?.currentTime??0;
  const playing=sources;sources=[];
  for(const {source,gain,start} of playing){
   if(start>now||context?.state!=='running'){
    try{source.stop();}catch{/* Already ended. */}
    source.disconnect();gain.disconnect();
   }else{
    // Keep the graph connected until silence: disconnecting here bypasses the fade.
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(1,now);
    gain.gain.linearRampToValueAtTime(0,now+FADE_SECONDS);
    try{source.stop(now+FADE_SECONDS);}catch{/* Already ended. */}
   }
  }
 }
 return {unlock,stop,
  async load(){
   if(!context)throw new Error('audio locked');
   const ctx=context;
   // Bounded requests; opening the main application never loads these files.
   let next=0;
   await Promise.all(Array.from({length:4},async()=>{while(!closed&&next<words.length){
    const word=words[next++];if(buffers.has(word.id))continue;
    const response=await fetch(import.meta.env.BASE_URL+word.audio,{signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw new Error('audio unavailable');
    const buffer=await ctx.decodeAudioData(await response.arrayBuffer());
    if(!closed)buffers.set(word.id,buffer);
   }}));
   if(closed)throw new Error('closed');
  },
  playThreeTimes(id:string){
   stop();const buffer=buffers.get(id);
   if(!context||context.state!=='running'||!buffer)throw new Error('audio unavailable');
   const start=context.currentTime;
   for(const offset of [0,buffer.duration+.35,2*(buffer.duration+.35)]){
    const source=context.createBufferSource();source.buffer=buffer;
    const gain=context.createGain();gain.gain.setValueAtTime(1,start+offset);
    source.connect(gain);gain.connect(context.destination);
    const entry={source,gain,start:start+offset};sources.push(entry);
    source.onended=()=>{source.disconnect();gain.disconnect();sources=sources.filter(s=>s!==entry);};
    source.start(start+offset);
   }
  },
  close(){closed=true;stop();buffers.clear();if(context){const ctx=context;window.setTimeout(()=>void ctx.close().catch(()=>{}),FADE_SECONDS*1000+5);}}
 };
}
