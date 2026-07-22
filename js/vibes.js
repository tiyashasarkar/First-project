// A handful of original, royalty-free ambient sound loops — synthesized
// entirely client-side with the Web Audio API, not licensed/recorded
// music. Fits the app's zero-dependency, zero-external-asset style, and
// sidesteps the copyright problem real commercial songs would create.
// Each vibe is rendered once (offline) into a short seamless-looping
// AudioBuffer and cached; js/music.js loops it during playback.

const cache = new Map();

export const VIBES = [
  { id: "sparkle", label: "Sparkle" },
  { id: "dreamy", label: "Dreamy" },
  { id: "rain", label: "Rainy day" },
  { id: "pulse", label: "Soft pulse" },
];

const DURATION = 4; // seconds — loops seamlessly
const SAMPLE_RATE = 44100;

function fadeGain(gainNode, duration, peak = 1, fade = 0.18) {
  const g = gainNode.gain;
  g.setValueAtTime(0, 0);
  g.linearRampToValueAtTime(peak, fade);
  g.setValueAtTime(peak, duration - fade);
  g.linearRampToValueAtTime(0, duration);
}

function noiseBuffer(ctx, duration) {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function buildSparkle(ctx) {
  const master = ctx.createGain();
  master.connect(ctx.destination);
  fadeGain(master, DURATION, 0.5, 0.1);
  const notes = [660, 784, 880, 988, 1174, 1318];
  notes.forEach((freq, i) => {
    const t = 0.15 + i * 0.32;
    if (t > DURATION - 0.3) return;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.35, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + 0.75);
  });
}

function buildDreamy(ctx) {
  const master = ctx.createGain();
  master.connect(ctx.destination);
  fadeGain(master, DURATION, 0.45, 0.4);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  filter.Q.value = 0.6;
  filter.connect(master);

  [220, 224, 330].forEach((freq) => {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = 0.18;
    osc.connect(g);
    g.connect(filter);
    osc.start(0);
    osc.stop(DURATION);
  });

  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.25;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 250;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start(0);
  lfo.stop(DURATION);
}

function buildRain(ctx) {
  const master = ctx.createGain();
  master.connect(ctx.destination);
  fadeGain(master, DURATION, 0.16, 0.3);
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, DURATION);
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 2400;
  filter.Q.value = 0.5;
  src.connect(filter);
  filter.connect(master);
  src.start(0);
}

function buildPulse(ctx) {
  const master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(ctx.destination);
  const beats = [0.2, 1.05, 1.9, 2.75, 3.55];
  beats.forEach((t) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.22);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.55, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + 0.35);
  });
}

const BUILDERS = { sparkle: buildSparkle, dreamy: buildDreamy, rain: buildRain, pulse: buildPulse };

export function renderVibe(id) {
  if (cache.has(id)) return cache.get(id);
  const builder = BUILDERS[id];
  if (!builder) return Promise.reject(new Error("Unknown vibe: " + id));
  const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const ctx = new OfflineCtx(1, SAMPLE_RATE * DURATION, SAMPLE_RATE);
  builder(ctx);
  const promise = ctx.startRendering();
  cache.set(id, promise);
  return promise;
}
