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
 return { ready, hit, close: () => { closed = true; void ctx?.close(); ctx = null; } };
}
