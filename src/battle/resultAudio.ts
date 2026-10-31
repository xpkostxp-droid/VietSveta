// The exact approved electronic previews, shared by every online and bot battle.
export type BattleResult = 'victory' | 'defeat';
let context: AudioContext | null = null;
const buffers = new Map<string, Promise<AudioBuffer | null>>();
const urlFor = (file: string) => `${import.meta.env.BASE_URL}${file}`;
function load(file: string) {
 if (!context) return Promise.resolve(null);
 const ctx = context;
 if (!buffers.has(file)) buffers.set(file, fetch(urlFor(file)).then(async r => r.ok ? ctx.decodeAudioData(await r.arrayBuffer()) : null).catch(() => null));
 return buffers.get(file)!;
}
export function readyBattleResultAudio() {
 try {
  context ??= new AudioContext();
  void context.resume().catch(() => {});
  void load('battle-media/result-victory.mp3'); void load('battle-media/result-defeat.mp3');
 } catch { /* Sound never blocks a match. */ }
}
function play(file: string) {
 let cancelled = false, source: AudioBufferSourceNode | null = null;
 if (!context) return () => {};
 const ctx = context;
 void load(file).then(buffer => {
  if (cancelled || document.hidden || ctx.state !== 'running' || !buffer) return;
  try { source = ctx.createBufferSource(); source.buffer = buffer; source.connect(ctx.destination); source.start(); } catch { /* Optional audio. */ }
 });
 return () => { cancelled = true; try { source?.stop(); } catch {} };
}
export function playBattleResultSound(result: BattleResult) { return play(`battle-media/result-${result}.mp3`); }
export function digitVoiceFile(digit: number) { return digit === 0 ? 'beginner/audio/games/phone/vi-0.mp3' : `beginner/audio/games/numbers/${digit}.mp3`; }
export function readyBattleDigitAudio() {
 readyBattleResultAudio();
 for (let digit = 0; digit <= 9; digit++) void load(digitVoiceFile(digit));
}
export function playBattleDigit(digit: number) { return play(digitVoiceFile(digit)); }
