import { readyBattleResultAudio } from '../battle/resultAudio';
export function createNinjaSound(){
 let ctx:AudioContext|null=null;
 const ready=()=>{readyBattleResultAudio();try{ctx??=new AudioContext();void ctx.resume();}catch{}};
 const beep=(digit:number)=>{try{
  const context=ctx;if(!context)return;
  const play=()=>{try{
   if(ctx!==context||context.state!=='running')return;
   const now=context.currentTime,osc=context.createOscillator(),gain=context.createGain();
   osc.type='square';osc.frequency.value=digit===1?880:800;
   gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.24,now+.004);gain.gain.exponentialRampToValueAtTime(.0001,now+.18);
   osc.connect(gain);gain.connect(context.destination);osc.start(now);osc.stop(now+.19);
  }catch{}};
  // An iPhone may still be completing resume() from the Start/Accept tap.
  if(context.state==='running')play();else void context.resume().then(play).catch(()=>{});
 }catch{}};
 const tone=(kind:'miss'|'hit'|'splat')=>{try{
  if(!ctx||ctx.state!=='running')return;
  const at=ctx.currentTime,duration=kind==='miss'?.15:kind==='hit'?.22:.3;
  const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,kind==='hit'?2:1);
  const noise=ctx.createBufferSource();noise.buffer=buffer;const filter=ctx.createBiquadFilter();filter.type=kind==='splat'?'lowpass':'bandpass';filter.frequency.setValueAtTime(kind==='miss'?2400:kind==='hit'?1600:650,at);filter.frequency.exponentialRampToValueAtTime(180,at+duration);
  const gain=ctx.createGain();gain.gain.setValueAtTime(.25,at);gain.gain.exponentialRampToValueAtTime(.001,at+duration);noise.connect(filter);filter.connect(gain);gain.connect(ctx.destination);noise.start(at);
 }catch{}};
 return {ready,beep,play:tone,close(){void ctx?.close();ctx=null;}};
}
