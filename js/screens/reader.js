// Full-screen, page-by-page journal viewer with a page-turn animation —
// "Flip Book" hinges pages on the left like a real book, "Notepad" hinges
// them on the top like flipping a spiral notepad — plus a synthesized
// page-flip whoosh (Web Audio API, no licensed sound file). Bypasses the
// normal screen router the same way the canvas editor does.
import * as db from "../db.js";
import { renderStaticPage } from "./editor.js";
import { openSheet, closeSheet, showToast } from "../ui.js";
import { setMascotVisible } from "../mascot.js";

const PAGE_W = 380;
const PAGE_H = 507;

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
  state = { journal, pages, index: 0, style, urlCache: new Map(), animating: false, zoom: 1 };

  await hydrateAllMedia(pages, state.urlCache);

  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById("bottom-nav").style.display = "none";
  setMascotVisible(false);

  const root = document.getElementById("screen-reader");
  root.innerHTML = buildShell();
  root.classList.add("active");

  wireChrome();
  state.zoom = fitReaderZoom();
  applyOrigin();
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

async function hydrateAllMedia(pages, urlCache) {
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
  const zoom = Math.min((rect.width - 40) / PAGE_W, (rect.height - 40) / PAGE_H, 1.1);
  return Math.max(0.3, zoom);
}

function onResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (!state) return;
    state.zoom = fitReaderZoom();
    setTransform(0);
  }, 150);
}

function applyOrigin() {
  const pageEl = document.getElementById("rd-page");
  if (!pageEl) return;
  pageEl.style.transformOrigin = state.style === "notepad" ? "center top" : "left center";
}

function setTransform(deg) {
  const pageEl = document.getElementById("rd-page");
  if (!pageEl) return;
  const axis = state.style === "notepad" ? "X" : "Y";
  pageEl.style.transform = `scale(${state.zoom}) rotate${axis}(${deg}deg)`;
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
      <div class="canvas-page" id="rd-page"></div>
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
    title: "Reading style",
    html: `
      <div class="reader-style-grid">
        <button class="reader-style-opt${state.style === "book" ? " selected" : ""}" data-style="book">
          <div class="rso-icon">📖</div><span>Flip Book</span>
        </button>
        <button class="reader-style-opt${state.style === "notepad" ? " selected" : ""}" data-style="notepad">
          <div class="rso-icon">🗒️</div><span>Notepad</span>
        </button>
      </div>
    `,
  });
  document.querySelectorAll(".reader-style-opt").forEach((btn) => {
    btn.addEventListener("click", async () => {
      state.style = btn.dataset.style;
      await db.kvSet("readerStyle", state.style);
      applyOrigin();
      setTransform(0);
      closeSheet();
    });
  });
}

function updateChrome() {
  const page = state.pages[state.index];
  document.getElementById("rd-page-title").textContent = page.title || "Untitled";
  document.getElementById("rd-page-counter").textContent = `${state.index + 1} / ${state.pages.length}`;
  document.getElementById("rd-chevron-prev").disabled = state.index === 0;
  document.getElementById("rd-chevron-next").disabled = state.index === state.pages.length - 1;
  document.getElementById("rd-navzone-prev").style.visibility = state.index === 0 ? "hidden" : "visible";
  document.getElementById("rd-navzone-next").style.visibility = state.index === state.pages.length - 1 ? "hidden" : "visible";
}

function paintPage() {
  const pageEl = document.getElementById("rd-page");
  renderStaticPage(pageEl, state.pages[state.index], state.urlCache);
  setTransform(0);
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
  if (!state || state.animating || newIndex < 0 || newIndex >= state.pages.length) return;
  state.animating = true;
  playFlipSound();

  const pageEl = document.getElementById("rd-page");
  const sign = direction === "next" ? -1 : 1;

  pageEl.style.transition = "transform 0.26s cubic-bezier(.4,0,.2,1)";
  setTransform(sign * 100);
  await waitForTransition(pageEl);

  renderStaticPage(pageEl, state.pages[newIndex], state.urlCache);
  state.index = newIndex;
  updateChrome();

  pageEl.style.transition = "none";
  setTransform(-sign * 100);
  void pageEl.offsetWidth;
  pageEl.style.transition = "transform 0.26s cubic-bezier(.4,0,.2,1)";
  setTransform(0);
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
