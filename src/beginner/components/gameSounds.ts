export function makeGameSound(){
 let ctx:AudioContext|null=null;
 const ready=()=>{try{ctx??=new AudioContext();void ctx.resume();}catch{}};
 const beep=(digit:number)=>{if(!ctx||ctx.state!=='running')return;const now=ctx.currentTime;const osc=ctx.createOscillator();const gain=ctx.createGain();osc.type='sine';osc.frequency.value=digit===1?660:digit===2?740:820;gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.13,now+.012);gain.gain.exponentialRampToValueAtTime(.0001,now+.13);osc.connect(gain).connect(ctx.destination);osc.start(now);osc.stop(now+.14)};
 const crash=()=>{if(!ctx||ctx.state!=='running')return;const rate=ctx.sampleRate;const buffer=ctx.createBuffer(1,Math.floor(rate*.65),rate);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++){const t=i/rate;data[i]=(Math.random()*2-1)*Math.exp(-7*t)*(.65+.35*Math.sin(t*95))}const source=ctx.createBufferSource();source.buffer=buffer;const low=ctx.createBiquadFilter();low.type='lowpass';low.frequency.value=1100;const gain=ctx.createGain();gain.gain.value=.32;source.connect(low).connect(gain).connect(ctx.destination);source.start()};
 // A short rounded bubble pop: descending sine, no noise or explosive tail.
 const pop=()=>{if(!ctx||ctx.state!=='running')return;const now=ctx.currentTime;const osc=ctx.createOscillator();const gain=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(650,now);osc.frequency.exponentialRampToValueAtTime(110,now+.075);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.17,now+.006);gain.gain.exponentialRampToValueAtTime(.0001,now+.095);osc.connect(gain).connect(ctx.destination);osc.start(now);osc.stop(now+.1)};
 const close=()=>{void ctx?.close();ctx=null};
 return {ready,beep,crash,pop,close};
}
