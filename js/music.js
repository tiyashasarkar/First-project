// Playback for page-attached audio: either an uploaded clip (played via a
// plain <audio> element) or a synthesized "vibe" loop (played via Web
// Audio, see vibes.js). Only one page's music plays at a time.
import { getMediaURL } from "./db.js";
import { renderVibe } from "./vibes.js";

let audioEl = null;
let liveCtx = null;
let vibeSource = null;
let vibeGain = null;
let current = null; // the audio spec currently loaded ({type, mediaId|vibeId})
let playing = false;
const listeners = new Set();

function notify() {
  listeners.forEach((cb) => cb(playing));
}

export function onPlaybackChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function specKey(spec) {
  if (!spec) return null;
  return spec.type === "vibe" ? `vibe:${spec.vibeId}` : `upload:${spec.mediaId}`;
}

function stopVibe() {
  if (vibeSource) {
    try { vibeSource.stop(); } catch { /* already stopped */ }
    vibeSource.disconnect();
    vibeSource = null;
  }
  if (vibeGain) { vibeGain.disconnect(); vibeGain = null; }
}

async function resumeOrStartVibe(spec) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!liveCtx) liveCtx = new AudioCtx();
  if (liveCtx.state === "suspended") await liveCtx.resume();

  if (specKey(current) === specKey(spec) && vibeSource) {
    playing = true;
    notify();
    return;
  }
  stopVibe();
  const buffer = await renderVibe(spec.vibeId);
  vibeSource = liveCtx.createBufferSource();
  vibeSource.buffer = buffer;
  vibeSource.loop = true;
  vibeGain = liveCtx.createGain();
  vibeGain.gain.value = 0.7;
  vibeSource.connect(vibeGain);
  vibeGain.connect(liveCtx.destination);
  vibeSource.start();
  current = spec;
  playing = true;
  notify();
}

async function startUpload(spec, urlCache) {
  const url = await getMediaURL(spec.mediaId, urlCache);
  if (!url) throw new Error("That clip couldn't be found.");
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.loop = true;
  }
  if (specKey(current) !== specKey(spec)) {
    audioEl.src = url;
    current = spec;
  }
  await audioEl.play();
  playing = true;
  notify();
}

export async function playPageAudio(spec, urlCache) {
  if (!spec) return;
  if (spec.type === "vibe") {
    if (audioEl) audioEl.pause();
    await resumeOrStartVibe(spec);
  } else if (spec.type === "upload") {
    stopVibe();
    await startUpload(spec, urlCache);
  }
}

export function pausePageAudio() {
  if (audioEl) audioEl.pause();
  if (liveCtx && liveCtx.state === "running") liveCtx.suspend();
  playing = false;
  notify();
}

export function stopPageAudio() {
  if (audioEl) { audioEl.pause(); audioEl.currentTime = 0; }
  stopVibe();
  playing = false;
  current = null;
  notify();
}

export async function togglePageAudio(spec, urlCache) {
  if (playing && specKey(current) === specKey(spec)) {
    pausePageAudio();
  } else {
    await playPageAudio(spec, urlCache);
  }
}

export function isCurrentlyPlaying(spec) {
  return playing && specKey(current) === specKey(spec);
}
