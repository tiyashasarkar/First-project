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

function renderBinding() {
  const binding = document.getElementById("rd-binding");
  const pagestack = document.getElementById("rd-pagestack");
  const ribbon = document.getElementById("rd-ribbon");
  if (!binding) return;
  binding.className = "reader-binding style-" + state.style;
  binding.innerHTML = state.style === "scrapbook"
    ? [18, 50, 82].map((t) => `<span class="ring" style="top:${t}%"></span>`).join("")
    : "";
  pagestack.style.display = state.style === "notepad" ? "none" : "block";
  ribbon.style.display = state.style === "diary" ? "block" : "none";
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

function paintCover(pageEl) {
  const journal = state.journal;
  if (journal.cover?.items?.length) {
    renderStaticPage(pageEl, journal.cover, state.urlCache);
    return;
  }
  pageEl.className = "canvas-page reader-fallback-cover";
  pageEl.innerHTML = `<div class="reader-cover-title">${escapeHtml(journal.title || "Untitled Journal")}</div>`;
  const coverUrl = journal.coverMediaId && state.urlCache.get(journal.coverMediaId);
  pageEl.style.background = coverUrl
    ? `url('${coverUrl}') center/cover`
    : (journal.coverColor || "linear-gradient(145deg,#f6c9d8,#d98fac)");
}

function paintPage() {
  const pageEl = document.getElementById("rd-page");
  if (state.index === -1) paintCover(pageEl);
  else renderStaticPage(pageEl, state.pages[state.index], state.urlCache);
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
  playFlipSound();

  const pageEl = document.getElementById("rd-page");
  const sign = direction === "next" ? -1 : 1;

  pageEl.style.transition = "transform 0.26s cubic-bezier(.4,0,.2,1)";
  setPageRotation(sign * 100);
  await waitForTransition(pageEl);

  if (newIndex === -1) paintCover(pageEl);
  else renderStaticPage(pageEl, state.pages[newIndex], state.urlCache);
  state.index = newIndex;
  updateChrome();

  pageEl.style.transition = "none";
  setPageRotation(-sign * 100);
  void pageEl.offsetWidth;
  pageEl.style.transition = "transform 0.26s cubic-bezier(.4,0,.2,1)";
  setPageRotation(0);
  await waitForTransition(pageEl);

  state.animating = false;
}

function playFlipSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const duration = 0.22;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(3500, ctx.currentTime + duration * 0.5);
    filter.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + duration);
    filter.Q.value = 0.7;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    src.stop(ctx.currentTime + duration + 0.02);
    src.onended = () => ctx.close();
  } catch {
    // Web Audio unavailable — reading still works, just silently
  }
}
