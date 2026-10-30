export function makeCourtSound() {
 let ctx: AudioContext | null = null;
 let loading: Promise<void> | null = null;
 const buffers: Partial<Record<'paddle' | 'bounce', AudioBuffer>> = {};
 let closed = false;
 const ready = () => {
  closed = false;
  try {
   ctx ??= new AudioContext();
   void ctx.resume().catch(() => {});
   loading ??= Promise.all((['paddle', 'bounce'] as const).map(async name => {
    const response = await fetch(`./battle-media/${name}-real-v1.wav`);
    if (!response.ok) return;
    const buffer = await ctx!.decodeAudioData(await response.arrayBuffer());
    if (!closed) buffers[name] = buffer;
   })).then(() => {}).catch(() => {});
  } catch { /* Audio failure must never affect answering. */ }
 };
 const hit = (kind: 'paddle' | 'bounce', near: boolean) => {
  if (!ctx || ctx.state !== 'running' || !buffers[kind] || closed) return;
  const source = ctx.createBufferSource(), gain = ctx.createGain();
  source.buffer = buffers[kind]!;
  gain.gain.value = (near ? .64 : .42) * (kind === 'bounce' ? .8 : 1);
  source.connect(gain).connect(ctx.destination); source.start();
 };
 const point=()=>{
  if(!ctx||ctx.state!=='running'||closed)return;
  const now=ctx.currentTime,osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type='triangle';osc.frequency.setValueAtTime(1150,now);osc.frequency.exponentialRampToValueAtTime(1750,now+.045);
  gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.13,now+.006);gain.gain.exponentialRampToValueAtTime(.0001,now+.10);
  osc.connect(gain).connect(ctx.destination);osc.start(now);osc.stop(now+.11);
  const buffer=ctx.createBuffer(1,Math.floor(ctx.sampleRate*.065),ctx.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/(ctx.sampleRate*.018));
  const noise=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),ng=ctx.createGain();noise.buffer=buffer;
  filter.type='highpass';filter.frequency.value=2200;ng.gain.value=.075;noise.connect(filter).connect(ng).connect(ctx.destination);noise.start(now);
 };
 return { ready, hit, point, close: () => { closed = true; void ctx?.close(); ctx = null; } };
}
