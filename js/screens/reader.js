// Full-screen, page-by-page journal viewer with four distinct physical
// "book types" — Flip Book (stitched spine, side hinge), Notepad (spiral
// coil, top hinge), Scrapbook (ring binder, side hinge), Diary (leather
// spine + ribbon bookmark, side hinge) — each with a synthesized page-turn
// whoosh (Web Audio API, no licensed sound file). Opens on the journal's
// designed cover before page 1, for a real-book feel. Bypasses the normal
// screen router the same way the canvas editor does.
import * as db from "../db.js";
import { renderStaticPage } from "./editor.js";
import { openSheet, closeSheet, showToast, escapeHtml } from "../ui.js";
import { setMascotVisible } from "../mascot.js";

const PAGE_W = 380;
const PAGE_H = 507;

const READER_STYLES = [
  { id: "book", label: "Flip Book", icon: "📖", axis: "Y" },
  { id: "notepad", label: "Notepad", icon: "🗒️", axis: "X" },
  { id: "scrapbook", label: "Scrapbook", icon: "📔", axis: "Y" },
  { id: "diary", label: "Diary", icon: "🔐", axis: "Y" },
];

let state = null;
let resizeTimer = null;

export async function openReader({ journalId }) {
  const journal = await db.get("journals", journalId);
  const pages = (await db.getAll("pages")).filter((p) => p.journalId === journalId).sort((a, b) => a.createdAt - b.createdAt);
  if (!pages.length) {
    showToast("Add a page first!");
    return;
  }

  const style = await db.kvGet("readerStyle", "book");
  state = { journal, pages, index: -1, style, urlCache: new Map(), animating: false, zoom: 1 };

  await hydrateAllMedia(journal, pages, state.urlCache);

  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById("bottom-nav").style.display = "none";
  setMascotVisible(false);

  const root = document.getElementById("screen-reader");
  root.innerHTML = buildShell();
  root.classList.add("active");

  wireChrome();
  state.zoom = fitReaderZoom();
  applyZoom();
  applyOrigin();
  renderBinding();
  paintPage();
  window.addEventListener("resize", onResize);
}

function closeReader() {
  window.removeEventListener("resize", onResize);
  const journalId = state?.journal?.id;
  state = null;
  document.getElementById("screen-reader").classList.remove("active");
  document.getElementById("bottom-nav").style.display = "flex";
  window.blossomNavigate("journal-detail", { journalId });
}

async function hydrateAllMedia(journal, pages, urlCache) {
  if (journal.coverMediaId) await db.getMediaURL(journal.coverMediaId, urlCache);
  for (const item of journal.cover?.items || []) {
    if ((item.type === "photo" || item.type === "sticker") && item.mediaId) {
      await db.getMediaURL(item.mediaId, urlCache);
    }
  }
  for (const page of pages) {
    for (const item of page.items || []) {
      if ((item.type === "photo" || item.type === "sticker") && item.mediaId) {
        await db.getMediaURL(item.mediaId, urlCache);
      }
    }
  }
}

function fitReaderZoom() {
  const stage = document.getElementById("rd-stage");
  if (!stage) return 1;
  const rect = stage.getBoundingClientRect();
  const zoom = Math.min((rect.width - 56) / PAGE_W, (rect.height - 56) / PAGE_H, 1.1);
  return Math.max(0.3, zoom);
}

function onResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (!state) return;
    state.zoom = fitReaderZoom();
    applyZoom();
  }, 150);
}

function applyZoom() {
  const book = document.getElementById("rd-book");
  if (book) book.style.transform = `scale(${state.zoom})`;
}

function currentAxis() {
  return (READER_STYLES.find((s) => s.id === state.style) || READER_STYLES[0]).axis;
}

function applyOrigin() {
  const pageEl = document.getElementById("rd-page");
  if (!pageEl) return;
  pageEl.style.transformOrigin = currentAxis() === "X" ? "center top" : "left center";
}

function setPageRotation(deg) {
  const pageEl = document.getElementById("rd-page");
  if (!pageEl) return;
  pageEl.style.transform = `rotate${currentAxis()}(${deg}deg)`;
}

const LOCK_SVG = `<svg viewBox="0 0 40 50"><rect x="4" y="20" width="32" height="26" rx="5" fill="#d9a06c"/><rect x="4" y="20" width="32" height="8" rx="4" fill="#ffdcc0"/><path d="M11 20 v-6 a9 9 0 0 1 18 0 v6" stroke="#b8724a" stroke-width="5" fill="none"/><circle cx="20" cy="33" r="4" fill="#7a4a30"/><rect x="18.5" y="33" width="3" height="8" fill="#7a4a30"/></svg>`;

function renderBinding() {
  const stage = document.getElementById("rd-stage");
  const binding = document.getElementById("rd-binding");
  const pagestack = document.getElementById("rd-pagestack");
  const ribbon = document.getElementById("rd-ribbon");
  const lock = document.getElementById("rd-lock");
  if (!binding) return;

  stage.className = "reader-stage style-" + state.style;
  binding.className = "reader-binding style-" + state.style;

  if (state.style === "scrapbook") {
    binding.innerHTML = [16, 50, 84].map((t) => `<span class="ring" style="top:${t}%"></span>`).join("");
  } else if (state.style === "notepad") {
    const loops = 15;
    binding.innerHTML = Array.from({ length: loops }, (_, i) => {
      const pct = (100 / loops) * (i + 0.5);
      const rot = i % 2 === 0 ? -9 : 9;
      return `<span class="coil" style="left:${pct}%;transform:translateX(-50%) rotate(${rot}deg);"></span>`;
    }).join("");
  } else {
    binding.innerHTML = "";
  }

  pagestack.className = "reader-pagestack style-" + state.style;
  ribbon.style.display = state.style === "diary" ? "block" : "none";
  if (lock) {
    lock.style.display = state.style === "diary" ? "block" : "none";
    if (state.style === "diary" && !lock.innerHTML) lock.innerHTML = LOCK_SVG;
  }
}

function buildShell() {
  return `
    <div class="reader-topbar">
      <button class="icon-btn" id="rd-close"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      <div class="reader-title">
        <div id="rd-page-title"></div>
        <div id="rd-page-counter"></div>
      </div>
      <button class="icon-btn" id="rd-style-btn"><svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M4 12h16"/></svg></button>
    </div>
    <div class="reader-stage" id="rd-stage">
      <button class="reader-navzone left" id="rd-navzone-prev" aria-label="Previous page"></button>
      <div class="reader-book" id="rd-book">
        <div class="reader-pagestack" id="rd-pagestack"></div>
        <div class="reader-binding" id="rd-binding"></div>
        <div class="canvas-page" id="rd-page"></div>
        <div class="reader-ribbon" id="rd-ribbon"></div>
        <div class="reader-lock" id="rd-lock"></div>
      </div>
      <button class="reader-navzone right" id="rd-navzone-next" aria-label="Next page"></button>
      <button class="reader-chevron left" id="rd-chevron-prev"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button>
      <button class="reader-chevron right" id="rd-chevron-next"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>
    </div>
  `;
}

function wireChrome() {
  document.getElementById("rd-close").addEventListener("click", closeReader);
  document.getElementById("rd-style-btn").addEventListener("click", openStyleSheet);
  document.getElementById("rd-navzone-prev").addEventListener("click", goPrev);
  document.getElementById("rd-navzone-next").addEventListener("click", goNext);
  document.getElementById("rd-chevron-prev").addEventListener("click", goPrev);
  document.getElementById("rd-chevron-next").addEventListener("click", goNext);

  const stage = document.getElementById("rd-stage");
  let startX = null;
  stage.addEventListener("pointerdown", (e) => { startX = e.clientX; });
  stage.addEventListener("pointerup", (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) goNext(); else goPrev();
  });
}

function openStyleSheet() {
  openSheet({
    title: "Journal type",
    html: `<div class="reader-style-grid">${READER_STYLES.map((s) => `
      <button class="reader-style-opt${state.style === s.id ? " selected" : ""}" data-style="${s.id}">
        <div class="rso-icon">${s.icon}</div><span>${s.label}</span>
      </button>
    `).join("")}</div>`,
  });
  document.querySelectorAll(".reader-style-opt").forEach((btn) => {
    btn.addEventListener("click", async () => {
      state.style = btn.dataset.style;
      await db.kvSet("readerStyle", state.style);
      applyOrigin();
      renderBinding();
      if (state.index === -1) paintCover(document.getElementById("rd-page"));
      setPageRotation(0);
      closeSheet();
    });
  });
}

function updateChrome() {
  const atCover = state.index === -1;
  document.getElementById("rd-page-title").textContent = atCover ? (state.journal.title || "Untitled Journal") : (state.pages[state.index].title || "Untitled");
  document.getElementById("rd-page-counter").textContent = atCover ? "Cover" : `${state.index + 1} / ${state.pages.length}`;
  document.getElementById("rd-chevron-prev").disabled = state.index === -1;
  document.getElementById("rd-chevron-next").disabled = state.index === state.pages.length - 1;
  document.getElementById("rd-navzone-prev").style.visibility = state.index === -1 ? "hidden" : "visible";
  document.getElementById("rd-navzone-next").style.visibility = state.index === state.pages.length - 1 ? "hidden" : "visible";
}

const CORNER_ORNAMENT_SVG = `<svg viewBox="0 0 60 60"><path d="M4 4 Q26 4 26 26 Q26 44 44 44" stroke="#f0d9a0" stroke-width="1.6" fill="none" opacity="0.85"/><circle cx="4" cy="4" r="2.6" fill="#f0d9a0"/><path d="M10 16 Q18 18 16 26" stroke="#f0d9a0" stroke-width="1.1" fill="none" opacity="0.7"/></svg>`;

function paintCover(pageEl) {
  const journal = state.journal;
  if (journal.cover?.items?.length) {
    renderStaticPage(pageEl, journal.cover, state.urlCache);
    return;
  }
  pageEl.className = "canvas-page reader-fallback-cover style-" + state.style;
  pageEl.innerHTML = `
    <div class="reader-cover-ornament">${CORNER_ORNAMENT_SVG}</div>
    <div class="reader-cover-sparkle" style="top:20%;right:20%;"></div>
    <div class="reader-cover-sparkle" style="top:40%;left:16%;animation-delay:1.1s;"></div>
    <div class="reader-cover-content">
      <div class="reader-cover-rule"></div>
      <div class="reader-cover-title">${escapeHtml(journal.title || "Untitled Journal")}</div>
    </div>
  `;
  const coverUrl = journal.coverMediaId && state.urlCache.get(journal.coverMediaId);
  if (coverUrl) pageEl.style.background = `url('${coverUrl}') center/cover`;
  else if (journal.coverColor) pageEl.style.background = journal.coverColor;
  else pageEl.style.background = "";
}

function paintPage() {
  const pageEl = document.getElementById("rd-page");
  if (state.index === -1) paintCover(pageEl);
  else {
    pageEl.style.background = "";
    renderStaticPage(pageEl, state.pages[state.index], state.urlCache);
  }
  setPageRotation(0);
  updateChrome();
}

function goNext() { flipTo(state.index + 1, "next"); }
function goPrev() { flipTo(state.index - 1, "prev"); }

function waitForTransition(el) {
  return new Promise((resolve) => {
    const handler = () => { el.removeEventListener("transitionend", handler); resolve(); };
    el.addEventListener("transitionend", handler);
    setTimeout(resolve, 400);
  });
}

async function flipTo(newIndex, direction) {
  if (!state || state.animating || newIndex < -1 || newIndex >= state.pages.length) return;
  state.animating = true;
  playFlipSound(state.style, direction);
  db.hapticFeedback(6);

  const pageEl = document.getElementById("rd-page");
  const sign = direction === "next" ? -1 : 1;

  pageEl.style.transition = "transform 0.26s cubic-bezier(.4,0,.2,1)";
  setPageRotation(sign * 100);
  await waitForTransition(pageEl);
  if (!state) return; // reader was closed mid-flip

  if (newIndex === -1) paintCover(pageEl);
  else {
    pageEl.style.background = "";
    renderStaticPage(pageEl, state.pages[newIndex], state.urlCache);
  }
  state.index = newIndex;
  updateChrome();

  pageEl.style.transition = "none";
  setPageRotation(-sign * 100);
  void pageEl.offsetWidth;
  pageEl.style.transition = "transform 0.26s cubic-bezier(.4,0,.2,1)";
  setPageRotation(0);
  await waitForTransition(pageEl);
  if (!state) return; // reader was closed mid-flip

  state.animating = false;
}

function noiseBuffer(ctx, duration) {
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  return buffer;
}

function playNoiseLayer(ctx, { duration, filterType, freqStart, freqMid, freqEnd, Q = 0.6, gainPeak = 0.3, attack = 0.016, startTime = 0, pan = 0 }) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, duration);
  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.Q.value = Q;
  const t0 = ctx.currentTime + startTime;
  filter.frequency.setValueAtTime(freqStart, t0);
  if (freqMid !== undefined) filter.frequency.exponentialRampToValueAtTime(freqMid, t0 + duration * 0.45);
  filter.frequency.exponentialRampToValueAtTime(freqEnd, t0 + duration);
  // A gentle top-end roll-off so the noise burst reads as soft paper
  // rather than a harsh, tinny hiss.
  const smooth = ctx.createBiquadFilter();
  smooth.type = "lowpass";
  smooth.frequency.value = 5000;
  smooth.Q.value = 0.3;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(gainPeak, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  src.connect(filter);
  filter.connect(smooth);
  let out = smooth;
  if (ctx.createStereoPanner) {
    const panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime(pan, t0);
    out.connect(panner);
    out = panner;
  }
  out.connect(gain);
  gain.connect(ctx.destination);
  src.start(t0);
  src.stop(t0 + duration + 0.02);
  return t0 + duration;
}

function playTone(ctx, { freq, freqEnd, duration, gainPeak = 0.18, type = "sine", startTime = 0, pan = 0 }) {
  const osc = ctx.createOscillator();
  osc.type = type;
  const t0 = ctx.currentTime + startTime;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + duration);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(gainPeak, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  let out = osc;
  if (ctx.createStereoPanner) {
    const panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime(pan, t0);
    osc.connect(panner);
    out = panner;
  }
  out.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
  return t0 + duration;
}

// Each journal type gets its own soft, e-reader-quality page-turn: a
// clean, low-gain paper swish (never a harsh noise burst or buzzy square
// wave) that pans across the stereo field in the direction of the flip,
// with a subtle low tone underneath for physical weight. Gated by the
// user's Sound & Haptics preference in Profile.
async function playFlipSound(style, direction) {
  if (!(await db.isSoundEnabled())) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    let end = ctx.currentTime;
    const mark = (t) => { if (t > end) end = t; };
    const pan = direction === "prev" ? -0.35 : 0.35;

    if (style === "notepad") {
      mark(playNoiseLayer(ctx, { duration: 0.15, filterType: "bandpass", freqStart: 2100, freqMid: 3600, freqEnd: 1700, Q: 0.7, gainPeak: 0.26, attack: 0.014, pan }));
      mark(playTone(ctx, { freq: 2100, freqEnd: 1500, duration: 0.055, gainPeak: 0.06, type: "sine", startTime: 0.02, pan }));
    } else if (style === "scrapbook") {
      mark(playNoiseLayer(ctx, { duration: 0.25, filterType: "bandpass", freqStart: 850, freqMid: 2300, freqEnd: 720, Q: 0.55, gainPeak: 0.28, attack: 0.02, pan }));
      mark(playTone(ctx, { freq: 1450, freqEnd: 1100, duration: 0.2, gainPeak: 0.05, type: "sine", startTime: 0.05, pan }));
    } else if (style === "diary") {
      mark(playNoiseLayer(ctx, { duration: 0.3, filterType: "lowpass", freqStart: 700, freqMid: 420, freqEnd: 560, Q: 0.4, gainPeak: 0.24, attack: 0.045, pan }));
      mark(playTone(ctx, { freq: 150, freqEnd: 78, duration: 0.16, gainPeak: 0.08, type: "sine", startTime: 0.025, pan }));
    } else {
      mark(playNoiseLayer(ctx, { duration: 0.22, filterType: "bandpass", freqStart: 950, freqMid: 2400, freqEnd: 800, Q: 0.6, gainPeak: 0.26, attack: 0.018, pan }));
      mark(playNoiseLayer(ctx, { duration: 0.15, filterType: "bandpass", freqStart: 1200, freqMid: 2700, freqEnd: 1000, Q: 0.75, gainPeak: 0.14, attack: 0.014, startTime: 0.05, pan }));
      mark(playTone(ctx, { freq: 115, freqEnd: 62, duration: 0.13, gainPeak: 0.09, type: "sine", startTime: 0.012, pan }));
    }

    setTimeout(() => ctx.close(), (end - ctx.currentTime) * 1000 + 100);
  } catch {
    // Web Audio unavailable — reading still works, just silently
  }
}
