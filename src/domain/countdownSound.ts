// Tiny synthesized cues: no audio files or network requests.
export function createCountdownSound() {
  let context: AudioContext | undefined;
  let tone: AudioScheduledSourceNode | undefined;
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
    explode() {
      if (!context || context.state !== 'running') return;
      try {
        stop();
        const now = context.currentTime;
        const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.35), context.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
        const source = context.createBufferSource();
        source.buffer = buffer;
        const filter = context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1500, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.3);
        const gain = context.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.65, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.33);
        source.connect(filter); filter.connect(gain); gain.connect(context.destination);
        source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
        source.start(now); source.stop(now + 0.35); tone = source;
      } catch { /* Visual explosion remains available if sound fails. */ }
    },
    rebound() {
      if (!context || context.state !== 'running') return;
      try {
        stop();
        const now = context.currentTime;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(170, now);
        oscillator.frequency.exponentialRampToValueAtTime(420, now + 0.025);
        oscillator.frequency.exponentialRampToValueAtTime(130, now + 0.12);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.09, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        oscillator.connect(gain); gain.connect(context.destination);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(now); oscillator.stop(now + 0.16); tone = oscillator;
      } catch { /* Rebound remains visible when sound is unavailable. */ }
    },
    stop,
    close() { stop(); if (context) void context.close().catch(() => {}); },
  };
}
