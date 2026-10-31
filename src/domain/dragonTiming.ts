// One timeline for game flow, canvas action and sound scheduling.
export const dragonTiming = {
 successMs: 1800,
 errorMs: 1100,
 voiceMs: 600,
 reactionSeconds: .08,
 fireSeconds: .5,
 fireRate: 1.3,
 coughSeconds: 1,
 coughRate: 1.2,
 coughGain: .25 / 6,
 smokeSeconds: .45,
} as const;
export const dragonFeedbackMs = (success:boolean) => success ? dragonTiming.successMs : dragonTiming.errorMs;
