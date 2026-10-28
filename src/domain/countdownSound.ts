// Tiny synthesized cues: no audio files or network requests.
export function createCountdownSound() {
  let context: AudioContext | undefined;
  let tone: OscillatorNode | undefined;
  function stop() { try { tone?.stop(); } catch { /* already ended */ } tone = undefined; }
  return {
    unlock() {
      try {
        const Constructor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Constructor) return;
        context ??= new Constructor();
        void context.resume().catch(() => {});
      } catch { /* Audio unavailable: the visible countdown still works. */ }
    },
    beep() {
      if (!context || context.state !== 'running') return;
      try {
        stop();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const now = context.currentTime;
        oscillator.frequency.value = 660;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        oscillator.connect(gain); gain.connect(context.destination);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(now); oscillator.stop(now + 0.13); tone = oscillator;
      } catch { /* Do not interrupt a round if audio fails. */ }
    },
    stop,
    close() { stop(); if (context) void context.close().catch(() => {}); },
  };
}
