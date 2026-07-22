import * as db from "../db.js";
import { openSheet, closeSheet, showToast, escapeHtml, MOODS } from "../ui.js";
import { setMascotVisible } from "../mascot.js";

const PAGE_W = 380;
const PAGE_H = 507;
const MIN_ZOOM = 0.45;
const MAX_ZOOM = 2.6;

const STICKERS = [
  "🎀", "💗", "💕", "💖", "💝", "💘", "⭐", "✨", "🌟", "💫",
  "🌸", "🌷", "🌼", "🌹", "💐", "🌺", "🦢", "🩰", "👛", "💄",
  "💋", "👑", "💍", "📿", "🪞", "🍓", "🍒", "🍰", "🧁", "🍭",
  "🍬", "🍡", "☕", "🕊️", "🦋", "🐚", "🧸", "👗", "👠", "🎧",
  "📷", "🎞️", "📸", "☁️", "🌙", "🌈", "🍄", "🌿", "🧺", "📌",
  "🎫", "📎", "💌", "🪄", "🕯️", "📖", "🔖", "🗝️", "🎗️", "🧵",
];

const SIGNATURE_STICKERS = [
  { id: "bow", aspect: 100 / 60, svg: `<svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg"><path d="M50 30 L10 8 Q2 8 2 20 L2 40 Q2 52 10 52 Z" fill="#e8a0bb"/><path d="M50 30 L90 8 Q98 8 98 20 L98 40 Q98 52 90 52 Z" fill="#f2b6cc"/><circle cx="50" cy="30" r="9" fill="#c9698f"/></svg>` },
  { id: "ribbon", aspect: 140 / 50, svg: `<svg viewBox="0 0 140 50" xmlns="http://www.w3.org/2000/svg"><polygon points="10,5 130,5 140,25 130,45 10,45 20,25" fill="#f6c9d8" stroke="#d98fac" stroke-width="2"/></svg>` },
  { id: "pearls", aspect: 120 / 30, svg: `<svg viewBox="0 0 120 30" xmlns="http://www.w3.org/2000/svg">${[10, 30, 50, 70, 90, 110].map((cx, i) => `<circle cx="${cx}" cy="${[20, 14, 10, 10, 14, 20][i]}" r="8" fill="#fff8f3" stroke="#e3c9a0" stroke-width="1.5"/>`).join("")}</svg>` },
  { id: "sparkle-heart", aspect: 1, svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 85 C20 65 5 45 5 28 C5 12 18 3 32 3 C42 3 50 10 50 20 C50 10 58 3 68 3 C82 3 95 12 95 28 C95 45 80 65 50 85 Z" fill="#e8688f"/><path d="M78 15 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z" fill="#fff8f3"/><path d="M20 55 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" fill="#fff8f3"/></svg>` },
  { id: "crown", aspect: 100 / 70, svg: `<svg viewBox="0 0 100 70" xmlns="http://www.w3.org/2000/svg"><polygon points="10,60 10,25 28,42 50,15 72,42 90,25 90,60" fill="#f0bd82" stroke="#c9885a" stroke-width="2"/><circle cx="10" cy="22" r="6" fill="#f0bd82"/><circle cx="50" cy="12" r="6" fill="#f0bd82"/><circle cx="90" cy="22" r="6" fill="#f0bd82"/></svg>` },
  { id: "flower-stem", aspect: 100 / 120, svg: `<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="30" r="16" fill="#fbdce6"/><circle cx="72" cy="42" r="16" fill="#fbdce6"/><circle cx="64" cy="66" r="16" fill="#fbdce6"/><circle cx="36" cy="66" r="16" fill="#fbdce6"/><circle cx="28" cy="42" r="16" fill="#fbdce6"/><circle cx="50" cy="48" r="11" fill="#f0bd82"/><path d="M50 60 C46 80 54 90 46 108" stroke="#8fa876" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M46 90 C38 90 34 84 34 84" stroke="#8fa876" stroke-width="3" fill="none" stroke-linecap="round"/></svg>` },
  { id: "butterfly", aspect: 1.2, svg: `<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg"><path d="M58 50 C40 10 5 15 8 40 C10 60 40 58 58 50Z" fill="#eab6ce"/><path d="M62 50 C80 10 115 15 112 40 C110 60 80 58 62 50Z" fill="#f2c6d9"/><path d="M58 52 C42 80 12 82 10 65 C8 55 35 55 58 52Z" fill="#d98fac"/><path d="M62 52 C78 80 108 82 110 65 C112 55 85 55 62 52Z" fill="#e0a3c0"/><rect x="57" y="45" width="6" height="34" rx="3" fill="#9c6b84"/></svg>` },
  { id: "cherries", aspect: 90 / 100, svg: `<svg viewBox="0 0 90 100" xmlns="http://www.w3.org/2000/svg"><path d="M45 8 C42 30 42 45 42 45 M45 8 C55 25 62 35 62 35" stroke="#8fa876" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="30" cy="66" r="24" fill="#d94f6a"/><circle cx="62" cy="66" r="24" fill="#e8688f"/><ellipse cx="22" cy="56" rx="6" ry="4" fill="#f2a9c4" opacity=".7"/></svg>` },
];
const TAPES = [
  "linear-gradient(180deg,#fbdce6,#f6c9d8)",
  "repeating-linear-gradient(45deg,#fff8f0,#fff8f0 6px,#f3e6d8 6px,#f3e6d8 12px)",
  "linear-gradient(180deg,#e2a8bd,#d98fac)",
  "repeating-linear-gradient(45deg,#f0d9c8,#f0d9c8 5px,#d9b79c 5px,#d9b79c 10px)",
  "radial-gradient(circle,#c9a4b6 2px,transparent 2.3px) 0 0/11px 11px,#f3d9e2",
  "repeating-linear-gradient(90deg,#f6e2c2,#f6e2c2 8px,#eec98a 8px,#eec98a 10px)",
  "linear-gradient(180deg,#fde3d3,#f7c9a8)",
  "repeating-linear-gradient(135deg,#ffffff,#ffffff 4px,#fbe4ec 4px,#fbe4ec 8px)",
];
const FONTS = [
  { id: "display", label: "Aa", family: "var(--font-display)", size: 20 },
  { id: "hand", label: "Aa", family: "var(--font-hand)", size: 26 },
  { id: "hand2", label: "Aa", family: "var(--font-hand2)", size: 22 },
  { id: "hand3", label: "Aa", family: "var(--font-hand3)", size: 24 },
  { id: "script", label: "Aa", family: "var(--font-script)", size: 30 },
  { id: "body", label: "Aa", family: "var(--font-body)", size: 16 },
];
const TEXT_COLORS = ["#4a3b42", "#9c6b84", "#c94f6a", "#a97142", "#6f8a63", "#fffdfb"];

const PROMPTS = {
  daily: "What happened today?\n\n",
  travel: "",
  letter: "Dear future me,\n\n",
  photodump: "",
  blank: "",
};

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function calendarFontSize(item) {
  return Math.max(9, item.w / 15) + "px";
}

function buildCalendarHTML(item) {
  const year = item.year, month = item.month;
  const first = new Date(year, month, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  let cells = "";
  for (let i = 0; i < startDow; i++) cells += `<div class="cal-cell empty"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = isCurrentMonth && today.getDate() === d;
    cells += `<div class="cal-cell${isToday ? " today" : ""}">${d}</div>`;
  }
  return `
    <div class="cal-head">${MONTH_NAMES[month]}<br><span class="cal-year">${year}</span></div>
    <div class="cal-dow">${["S", "M", "T", "W", "T", "F", "S"].map((d) => `<span>${d}</span>`).join("")}</div>
    <div class="cal-grid">${cells}</div>
  `;
}

let ed = null; // editor session state
let returnScreen = { name: "home", params: {} };

function rand(min, max) { return Math.random() * (max - min) + min; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function clone(v) { return JSON.parse(JSON.stringify(v)); }
function idgen() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }

function loadImageSize(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
    img.onerror = () => resolve({ w: 1, h: 1 });
    img.src = url;
  });
}

async function buildInitialItems(template, files) {
  const items = [];
  if (!files || !files.length) {
    if (template === "letter") {
      items.push({ id: idgen(), type: "text", x: 40, y: 60, w: 300, h: 380, rotation: -1, font: "hand", color: "#4a3b42", size: 26, text: PROMPTS.letter });
    }
    return items;
  }

  const photoMeta = [];
  let uploadFailed = false;
  for (const file of files) {
    const url = URL.createObjectURL(file);
    const { w, h } = await loadImageSize(url);
    try {
      const mediaId = await db.saveMediaBlob(file);
      photoMeta.push({ mediaId, aspect: w / h || 1 });
    } catch {
      uploadFailed = true;
    }
    URL.revokeObjectURL(url);
  }
  if (uploadFailed) {
    showToast("Photo storage isn't set up yet on this account — see the README to add it. Continuing without photos for now.");
  }

  if (template === "daily") {
    const top = photoMeta.slice(0, 3);
    const baseW = top.length === 1 ? 240 : top.length === 2 ? 160 : 112;
    top.forEach((m, i) => {
      const w = baseW;
      const h = w / m.aspect;
      items.push({
        id: idgen(), type: "photo", mediaId: m.mediaId,
        frame: Math.random() < 0.5 ? "polaroid" : "plain",
        x: 30 + i * (baseW + 12), y: 40 + rand(-6, 6),
        w, h: Math.min(h, 190), rotation: rand(-6, 6),
      });
    });
    items.push({ id: idgen(), type: "text", x: 32, y: 250, w: 316, h: 220, rotation: -0.5, font: "body", color: "#4a3b42", size: 16, text: PROMPTS.daily });
  } else if (template === "letter") {
    items.push({ id: idgen(), type: "text", x: 40, y: 60, w: 300, h: 300, rotation: -1, font: "hand", color: "#4a3b42", size: 26, text: PROMPTS.letter });
    photoMeta.slice(0, 1).forEach((m) => {
      const w = 130, h = w / m.aspect;
      items.push({ id: idgen(), type: "photo", mediaId: m.mediaId, frame: "polaroid", x: 230, y: 370, w, h, rotation: 8 });
    });
  } else if (template === "travel" || template === "photodump") {
    const messy = template === "photodump";
    photoMeta.forEach((m, i) => {
      const w = rand(120, messy ? 190 : 160);
      const h = w / m.aspect;
      const cols = 2;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const gridX = 40 + col * 190;
      const gridY = 30 + row * 165;
      items.push({
        id: idgen(), type: "photo", mediaId: m.mediaId,
        frame: Math.random() < 0.45 ? "polaroid" : "plain",
        x: clamp(gridX + rand(messy ? -35 : -12, messy ? 35 : 12), 10, PAGE_W - w - 10),
        y: clamp(gridY + rand(messy ? -30 : -10, messy ? 30 : 10), 10, PAGE_H - h - 10),
        w, h: Math.min(h, 220),
        rotation: rand(messy ? -16 : -6, messy ? 16 : 6),
      });
    });
  }
  return items;
}

function defaultTitle(template) {
  const d = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return {
    blank: "New Page",
    photodump: "Photo Dump",
    daily: `Daily — ${d}`,
    travel: "Travel Memory",
    letter: "Letter to Future Self",
  }[template] || "New Page";
}

export async function openEditor({ pageId, journalId, template = "blank", files = [] } = {}) {
  returnScreen = journalId ? { name: "journal-detail", params: { journalId } } : { name: window.blossomState?.currentScreen || "home", params: {} };
  const screenEl = document.getElementById("screen-editor");

  let page;
  if (pageId) {
    page = await db.get("pages", pageId);
    returnScreen = { name: "journal-detail", params: { journalId: page.journalId } };
  } else {
    const items = await buildInitialItems(template, files);
    page = {
      id: null,
      journalId,
      title: defaultTitle(template),
      dateISO: new Date().toISOString().slice(0, 10),
      mood: "",
      location: "",
      tags: "",
      template,
      background: "dot",
      items,
    };
  }

  ed = {
    page,
    items: clone(page.items || []),
    selectedId: null,
    zoom: 1,
    panX: 0,
    panY: 0,
    messy: template === "photodump",
    history: [clone(page.items || [])],
    historyIndex: 0,
    urlCache: new Map(),
    saved: false,
  };

  screenEl.innerHTML = buildShell();
  document.getElementById("bottom-nav").style.display = "none";
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  screenEl.classList.add("active");
  setMascotVisible(false);

  await hydrateMedia();
  fitToViewport();
  renderCanvas();
  wireChrome();
  wireViewportGestures();
}

export function closeEditor() {
  if (ed && !ed.saved) {
    persist().catch(() => {});
  }
  ed = null;
}

function buildShell() {
  return `
    <div class="editor-topbar">
      <div class="grp">
        <button class="icon-btn" id="ed-back"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button>
        <button class="icon-btn" id="ed-undo"><svg viewBox="0 0 24 24"><path d="M7 8 3 12l4 4"/><path d="M3 12h11a6 6 0 0 1 0 12h-1"/></svg></button>
        <button class="icon-btn" id="ed-redo"><svg viewBox="0 0 24 24"><path d="M17 8l4 4-4 4"/><path d="M21 12H10a6 6 0 0 0 0 12h1"/></svg></button>
      </div>
      <button id="ed-title-btn" style="flex:1;min-width:0;text-align:center;padding:6px;">
        <div style="font-family:var(--font-display);font-weight:600;font-size:15px;color:var(--mauve-dark);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" id="ed-title-txt"></div>
        <div style="font-size:10.5px;color:var(--ink-soft);" id="ed-date-txt"></div>
      </button>
      <div class="grp">
        <button class="icon-btn" id="ed-done" style="background:var(--grad-fab);"><svg viewBox="0 0 24 24" style="stroke:white;"><path d="M4 12l5 5L20 6"/></svg></button>
      </div>
    </div>
    <div class="editor-viewport" id="ed-viewport">
      <div class="canvas-stage" id="ed-stage">
        <div class="canvas-page" id="ed-page"></div>
      </div>
    </div>
    <div class="editor-fabbar">
      <button class="efab" id="ed-add-photo"><div class="circ"><svg viewBox="0 0 24 24"><path d="M4 8a2 2 0 0 1 2-2h1.5l1-2h7l1 2H18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.5"/></svg></div><span>Photo</span></button>
      <button class="efab" id="ed-add-text"><div class="circ"><svg viewBox="0 0 24 24"><path d="M5 6h14M12 6v13"/></svg></div><span>Text</span></button>
      <button class="efab" id="ed-add-sticker"><div class="circ"><svg viewBox="0 0 24 24"><path d="M12 3l2.6 5.6L21 9.3l-4.5 4.2 1.2 6.2L12 16.8l-5.7 2.9 1.2-6.2L3 9.3l6.4-.7z"/></svg></div><span>Sticker</span></button>
      <button class="efab" id="ed-add-tape"><div class="circ"><svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="6" rx="1.5" transform="rotate(-8 12 12)"/></svg></div><span>Tape</span></button>
      <button class="efab" id="ed-add-calendar"><div class="circ"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg></div><span>Calendar</span></button>
      <button class="efab messy" id="ed-messy"><div class="circ" id="ed-messy-circ"><svg viewBox="0 0 24 24"><path d="M4 12c2-4 5-6 8-6s6 2 8 6c-2 4-5 6-8 6s-6-2-8-6z"/><circle cx="12" cy="12" r="2"/></svg></div><span>Messy</span></button>
    </div>
    <div class="item-toolbar" id="ed-item-toolbar"></div>
  `;
}

async function hydrateMedia() {
  for (const item of ed.items) {
    if (item.type === "photo" && item.mediaId) {
      await db.getMediaURL(item.mediaId, ed.urlCache);
    }
  }
}

function fitToViewport() {
  const vp = document.getElementById("ed-viewport");
  const rect = vp.getBoundingClientRect();
  const zoom = clamp(Math.min((rect.width - 40) / PAGE_W, (rect.height - 40) / PAGE_H), MIN_ZOOM, 1.15);
  ed.zoom = zoom;
  ed.panX = (rect.width - PAGE_W * zoom) / 2;
  ed.panY = (rect.height - PAGE_H * zoom) / 2;
  applyStageTransform();
}

function applyStageTransform() {
  const stage = document.getElementById("ed-stage");
  stage.style.transform = `translate(${ed.panX}px, ${ed.panY}px) scale(${ed.zoom})`;
}

// ---------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------

function renderCanvas() {
  const page = document.getElementById("ed-page");
  page.className = `canvas-page bg-${ed.page.background || "dot"}`;
  page.innerHTML = "";
  ed.items.forEach((item, idx) => {
    item.z = idx;
    page.appendChild(createItemEl(item));
  });
  updateItemToolbar();
  updateTitleBits();
  updateUndoRedoButtons();
}

function createItemEl(item) {
  const el = document.createElement("div");
  const frameClass = item.type === "photo" && item.frame && item.frame !== "plain" ? " " + item.frame : "";
  el.className = `c-item ${item.type}${frameClass}${ed.selectedId === item.id ? " selected" : ""}${item.locked ? " locked" : ""}`;
  el.style.left = item.x + "px";
  el.style.top = item.y + "px";
  el.style.width = item.w + "px";
  el.style.height = item.h + "px";
  el.style.zIndex = item.z;
  el.style.transform = `rotate(${item.rotation || 0}deg)`;
  el.dataset.id = item.id;

  const body = document.createElement("div");
  body.className = "c-body";

  if (item.type === "photo") {
    const img = document.createElement("img");
    img.src = ed.urlCache.get(item.mediaId) || "";
    img.draggable = false;
    body.appendChild(img);
  } else if (item.type === "text") {
    body.style.fontFamily = FONTS.find((f) => f.id === item.font)?.family || "var(--font-body)";
    body.style.fontSize = (item.size || 18) + "px";
    body.style.color = item.color || "#4a3b42";
    body.textContent = item.text || "";
  } else if (item.type === "sticker") {
    if (item.svg) {
      body.innerHTML = item.svg;
      const svgEl = body.querySelector("svg");
      if (svgEl) { svgEl.style.width = "100%"; svgEl.style.height = "100%"; svgEl.style.display = "block"; }
    } else {
      const span = document.createElement("span");
      span.className = "emoji-glyph";
      span.textContent = item.emoji;
      span.style.fontSize = Math.min(item.w, item.h) * 0.78 + "px";
      body.appendChild(span);
    }
  } else if (item.type === "tape") {
    body.style.background = item.color;
  } else if (item.type === "calendar") {
    body.style.fontSize = calendarFontSize(item);
    body.innerHTML = buildCalendarHTML(item);
  }

  el.appendChild(body);
  el.appendChild(makeHandle("resize", `<path d="M4 20 20 4M14 20h6v-6"/>`));
  el.appendChild(makeHandle("rotate", `<path d="M4 12a8 8 0 1 1 2.3 5.6M4 12v5M4 17h5"/>`));

  wireItemPointer(el, item);
  return el;
}

function makeHandle(kind, svgPath) {
  const h = document.createElement("div");
  h.className = `handle ${kind}`;
  h.innerHTML = `<svg viewBox="0 0 24 24">${svgPath}</svg>`;
  return h;
}

function updateTitleBits() {
  document.getElementById("ed-title-txt").textContent = ed.page.title || "Untitled";
  const d = ed.page.dateISO ? new Date(ed.page.dateISO + "T12:00:00") : new Date();
  document.getElementById("ed-date-txt").textContent = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + (ed.page.mood ? "  " + ed.page.mood : "");
}

function updateUndoRedoButtons() {
  document.getElementById("ed-undo").style.opacity = ed.historyIndex > 0 ? 1 : 0.35;
  document.getElementById("ed-redo").style.opacity = ed.historyIndex < ed.history.length - 1 ? 1 : 0.35;
}

// ---------------------------------------------------------------------
// History
// ---------------------------------------------------------------------

function commitHistory() {
  ed.history = ed.history.slice(0, ed.historyIndex + 1);
  ed.history.push(clone(ed.items));
  ed.historyIndex++;
  updateUndoRedoButtons();
}

function undo() {
  if (ed.historyIndex <= 0) return;
  ed.historyIndex--;
  ed.items = clone(ed.history[ed.historyIndex]);
  ed.selectedId = null;
  renderCanvas();
}

function redo() {
  if (ed.historyIndex >= ed.history.length - 1) return;
  ed.historyIndex++;
  ed.items = clone(ed.history[ed.historyIndex]);
  ed.selectedId = null;
  renderCanvas();
}

// ---------------------------------------------------------------------
// Item pointer interactions: move / resize / rotate
// ---------------------------------------------------------------------

function selectItem(id) {
  ed.selectedId = id;
  document.querySelectorAll(".c-item").forEach((el) => el.classList.toggle("selected", el.dataset.id === id));
  updateItemToolbar();
}

function wireItemPointer(el, item) {
  const body = el.querySelector(".c-body");
  body.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    selectItem(item.id);
    if (item.locked) return;
    body.setPointerCapture(e.pointerId);
    const start = { x: e.clientX, y: e.clientY };
    const startPos = { x: item.x, y: item.y };
    let moved = false;
    const onMove = (ev) => {
      const dx = (ev.clientX - start.x) / ed.zoom;
      const dy = (ev.clientY - start.y) / ed.zoom;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) moved = true;
      item.x = startPos.x + dx;
      item.y = startPos.y + dy;
      el.style.left = item.x + "px";
      el.style.top = item.y + "px";
    };
    const onUp = () => {
      body.removeEventListener("pointermove", onMove);
      body.removeEventListener("pointerup", onUp);
      if (moved) commitHistory();
    };
    body.addEventListener("pointermove", onMove);
    body.addEventListener("pointerup", onUp);
  });

  const resizeHandle = el.querySelector(".handle.resize");
  resizeHandle.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    if (item.locked) return;
    resizeHandle.setPointerCapture(e.pointerId);
    const start = { x: e.clientX, y: e.clientY };
    const startW = item.w, startH = item.h;
    const rad = (-(item.rotation || 0) * Math.PI) / 180;
    const lockAspect = item.type === "photo" || item.type === "sticker";
    const aspect = startW / startH;
    const onMove = (ev) => {
      const dx = (ev.clientX - start.x) / ed.zoom;
      const dy = (ev.clientY - start.y) / ed.zoom;
      const localDx = dx * Math.cos(rad) - dy * Math.sin(rad);
      const localDy = dx * Math.sin(rad) + dy * Math.cos(rad);
      let newW = Math.max(28, startW + localDx);
      let newH = lockAspect ? newW / aspect : Math.max(28, startH + localDy);
      item.w = newW;
      item.h = newH;
      el.style.width = item.w + "px";
      el.style.height = item.h + "px";
      const span = el.querySelector(".c-body .emoji-glyph");
      if (span) span.style.fontSize = Math.min(item.w, item.h) * 0.78 + "px";
      if (item.type === "calendar") {
        el.querySelector(".c-body").style.fontSize = calendarFontSize(item);
      }
    };
    const onUp = () => {
      resizeHandle.removeEventListener("pointermove", onMove);
      resizeHandle.removeEventListener("pointerup", onUp);
      commitHistory();
    };
    resizeHandle.addEventListener("pointermove", onMove);
    resizeHandle.addEventListener("pointerup", onUp);
  });

  const rotateHandle = el.querySelector(".handle.rotate");
  rotateHandle.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    if (item.locked) return;
    rotateHandle.setPointerCapture(e.pointerId);
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
    const startRotation = item.rotation || 0;
    const onMove = (ev) => {
      const curAngle = Math.atan2(ev.clientY - cy, ev.clientX - cx);
      item.rotation = startRotation + ((curAngle - startAngle) * 180) / Math.PI;
      el.style.transform = `rotate(${item.rotation}deg)`;
    };
    const onUp = () => {
      rotateHandle.removeEventListener("pointermove", onMove);
      rotateHandle.removeEventListener("pointerup", onUp);
      commitHistory();
    };
    rotateHandle.addEventListener("pointermove", onMove);
    rotateHandle.addEventListener("pointerup", onUp);
  });
}

// ---------------------------------------------------------------------
// Item toolbar (duplicate / layer / lock / delete / edit)
// ---------------------------------------------------------------------

function updateItemToolbar() {
  const bar = document.getElementById("ed-item-toolbar");
  const item = ed.items.find((i) => i.id === ed.selectedId);
  if (!item) {
    bar.classList.remove("show");
    bar.innerHTML = "";
    return;
  }
  bar.classList.add("show");
  bar.innerHTML = `
    ${item.type === "text" ? `<button id="it-edit" title="Edit"><svg viewBox="0 0 24 24"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3"/></svg></button>` : ""}
    ${item.type === "photo" ? `<button id="it-frame" title="Frame"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 4v16M4 9h5"/></svg></button>` : ""}
    <button id="it-back" title="Send backward"><svg viewBox="0 0 24 24"><path d="M4 4h10v10H4z"/><path d="M10 10h10v10H10z"/></svg></button>
    <button id="it-fwd" title="Bring forward"><svg viewBox="0 0 24 24"><path d="M10 10h10v10H10z"/><path d="M4 4h10v10H4z" fill="none"/></svg></button>
    <button id="it-dup" title="Duplicate"><svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg></button>
    <button id="it-lock" title="Lock"><svg viewBox="0 0 24 24">${item.locked ? '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>' : '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.4-2"/>'}</svg></button>
    <button id="it-del" title="Delete"><svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3m-9 0 1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></svg></button>
  `;
  if (item.type === "text") document.getElementById("it-edit").addEventListener("click", () => openTextSheet(item));
  if (item.type === "photo") document.getElementById("it-frame").addEventListener("click", () => openFrameSheet(item));
  document.getElementById("it-back").addEventListener("click", () => reorder(item, -1));
  document.getElementById("it-fwd").addEventListener("click", () => reorder(item, 1));
  document.getElementById("it-dup").addEventListener("click", () => duplicateItem(item));
  document.getElementById("it-lock").addEventListener("click", () => { item.locked = !item.locked; commitHistory(); renderCanvas(); selectItem(item.id); });
  document.getElementById("it-del").addEventListener("click", () => { ed.items = ed.items.filter((i) => i.id !== item.id); ed.selectedId = null; commitHistory(); renderCanvas(); });
}

function reorder(item, dir) {
  const idx = ed.items.findIndex((i) => i.id === item.id);
  const swapWith = idx + dir;
  if (swapWith < 0 || swapWith >= ed.items.length) return;
  [ed.items[idx], ed.items[swapWith]] = [ed.items[swapWith], ed.items[idx]];
  commitHistory();
  renderCanvas();
  selectItem(item.id);
}

function duplicateItem(item) {
  const copy = clone(item);
  copy.id = idgen();
  copy.x += 14;
  copy.y += 14;
  ed.items.push(copy);
  commitHistory();
  renderCanvas();
  selectItem(copy.id);
}

function addItem(partial) {
  const jitter = rand(-26, 26);
  const item = { id: idgen(), rotation: 0, x: PAGE_W / 2 - 60 + jitter, y: PAGE_H / 2 - 60 + rand(-26, 26), w: 120, h: 120, ...partial };
  if (ed.messy) item.rotation = rand(-10, 10);
  ed.items.push(item);
  commitHistory();
  renderCanvas();
  selectItem(item.id);
}

// ---------------------------------------------------------------------
// Viewport pan / pinch-zoom
// ---------------------------------------------------------------------

function wireViewportGestures() {
  const vp = document.getElementById("ed-viewport");
  const pointers = new Map();
  let mode = null;
  let panAnchor = null;
  let pinch = null;
  let rect = null;

  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function mid(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }

  function recompute() {
    rect = vp.getBoundingClientRect();
    if (pointers.size === 2) {
      const arr = [...pointers.values()];
      mode = "pinch";
      const d0 = dist(arr[0], arr[1]);
      const m0 = mid(arr[0], arr[1]);
      pinch = {
        d0,
        zoomStart: ed.zoom,
        worldX: (m0.x - rect.left - ed.panX) / ed.zoom,
        worldY: (m0.y - rect.top - ed.panY) / ed.zoom,
      };
    } else if (pointers.size === 1) {
      mode = "pan";
      const p = [...pointers.values()][0];
      panAnchor = { x: p.x - ed.panX, y: p.y - ed.panY };
    } else {
      mode = null;
    }
  }

  vp.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".c-item")) return;
    selectItem(null);
    vp.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    recompute();
  });

  vp.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (mode === "pan") {
      const p = pointers.get(e.pointerId);
      ed.panX = p.x - panAnchor.x;
      ed.panY = p.y - panAnchor.y;
      applyStageTransform();
    } else if (mode === "pinch" && pointers.size === 2) {
      const arr = [...pointers.values()];
      const d1 = dist(arr[0], arr[1]);
      const m1 = mid(arr[0], arr[1]);
      const newZoom = clamp(pinch.zoomStart * (d1 / pinch.d0), MIN_ZOOM, MAX_ZOOM);
      ed.zoom = newZoom;
      ed.panX = m1.x - rect.left - pinch.worldX * newZoom;
      ed.panY = m1.y - rect.top - pinch.worldY * newZoom;
      applyStageTransform();
    }
  });

  const release = (e) => {
    pointers.delete(e.pointerId);
    recompute();
  };
  vp.addEventListener("pointerup", release);
  vp.addEventListener("pointercancel", release);
}

// ---------------------------------------------------------------------
// Sheets: text / sticker / tape / details
// ---------------------------------------------------------------------

function openTextSheet(existing) {
  const draft = existing ? { ...existing } : { font: "hand", color: TEXT_COLORS[0], size: 22, text: "" };
  openSheet({
    title: existing ? "Edit text" : "Add text",
    html: `
      <div class="field"><textarea id="tx-input" placeholder="Write something...">${escapeHtml(draft.text || "")}</textarea></div>
      <div class="field"><label>Font</label><div class="font-picker" id="tx-fonts"></div></div>
      <div class="field"><label>Color</label><div class="color-row" id="tx-colors"></div></div>
      <button class="btn btn-primary btn-block" id="tx-save">${existing ? "Save" : "Add to page"}</button>
    `,
  });
  const fontsWrap = document.getElementById("tx-fonts");
  FONTS.forEach((f) => {
    const b = document.createElement("button");
    b.textContent = f.label;
    b.style.fontFamily = f.family;
    b.className = f.id === draft.font ? "selected" : "";
    b.addEventListener("click", () => { draft.font = f.id; draft.size = f.size; [...fontsWrap.children].forEach((c) => c.classList.remove("selected")); b.classList.add("selected"); });
    fontsWrap.appendChild(b);
  });
  const colorsWrap = document.getElementById("tx-colors");
  TEXT_COLORS.forEach((c) => {
    const b = document.createElement("button");
    b.className = "color-dot" + (c === draft.color ? " selected" : "");
    b.style.background = c;
    b.addEventListener("click", () => { draft.color = c; [...colorsWrap.children].forEach((x) => x.classList.remove("selected")); b.classList.add("selected"); });
    colorsWrap.appendChild(b);
  });
  document.getElementById("tx-save").addEventListener("click", () => {
    draft.text = document.getElementById("tx-input").value;
    if (!draft.text.trim()) { closeSheet(); return; }
    closeSheet();
    if (existing) {
      Object.assign(existing, draft);
      commitHistory();
      renderCanvas();
      selectItem(existing.id);
    } else {
      addItem({ type: "text", w: 220, h: 140, font: draft.font, color: draft.color, size: draft.size, text: draft.text });
    }
  });
}

function openStickerSheet() {
  openSheet({
    title: "Add a sticker",
    html: `
      <div class="segmented" style="margin-bottom:12px;">
        <button data-tab="signature" class="active">Signature</button>
        <button data-tab="emoji">Emoji</button>
      </div>
      <div class="signature-grid" id="st-signature"></div>
      <div class="sticker-grid hidden" id="st-emoji"></div>
    `,
  });
  const sigGrid = document.getElementById("st-signature");
  SIGNATURE_STICKERS.forEach((s) => {
    const b = document.createElement("button");
    b.innerHTML = s.svg;
    b.addEventListener("click", () => {
      closeSheet();
      const w = 110;
      addItem({ type: "sticker", svg: s.svg, w, h: w / s.aspect });
    });
    sigGrid.appendChild(b);
  });
  const emojiGrid = document.getElementById("st-emoji");
  STICKERS.forEach((emoji) => {
    const b = document.createElement("button");
    b.textContent = emoji;
    b.addEventListener("click", () => {
      closeSheet();
      addItem({ type: "sticker", emoji, w: 64, h: 64 });
    });
    emojiGrid.appendChild(b);
  });
  document.querySelectorAll('.sheet [data-tab]').forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll('.sheet [data-tab]').forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      sigGrid.classList.toggle("hidden", btn.dataset.tab !== "signature");
      emojiGrid.classList.toggle("hidden", btn.dataset.tab !== "emoji");
    });
  });
}

function openCalendarSheet() {
  const now = new Date();
  const val = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  openSheet({
    title: "Add a calendar page",
    html: `
      <div class="field"><label>Month & year</label><input type="month" id="cal-month" value="${val}" /></div>
      <button class="btn btn-primary btn-block" id="cal-add">Add to page</button>
    `,
  });
  document.getElementById("cal-add").addEventListener("click", () => {
    const raw = document.getElementById("cal-month").value;
    let year = now.getFullYear(), month = now.getMonth();
    if (raw) {
      const [y, m] = raw.split("-").map(Number);
      year = y;
      month = m - 1;
    }
    closeSheet();
    addItem({ type: "calendar", year, month, w: 230, h: 260, rotation: 0 });
  });
}

function openTapeSheet() {
  openSheet({ title: "Add washi tape", html: `<div class="tape-grid" id="tp-grid"></div>` });
  const grid = document.getElementById("tp-grid");
  TAPES.forEach((css) => {
    const b = document.createElement("button");
    b.className = "tape-swatch";
    b.style.background = css;
    b.addEventListener("click", () => {
      closeSheet();
      addItem({ type: "tape", color: css, w: 96, h: 30, rotation: rand(-8, 8) });
    });
    grid.appendChild(b);
  });
}

const FRAMES = [
  { id: "plain", label: "Plain" },
  { id: "rounded", label: "Rounded" },
  { id: "circle", label: "Circle" },
  { id: "heart", label: "Heart" },
  { id: "torn", label: "Torn" },
  { id: "polaroid", label: "Polaroid" },
];

function openFrameSheet(item) {
  openSheet({ title: "Choose a frame", html: `<div class="frame-grid" id="frame-grid"></div>` });
  const grid = document.getElementById("frame-grid");
  FRAMES.forEach((f) => {
    const b = document.createElement("button");
    b.className = `fg-${f.id}` + ((item.frame || "plain") === f.id ? " selected" : "");
    b.innerHTML = `<div class="fg-swatch"></div><span class="fg-label">${f.label}</span>`;
    b.addEventListener("click", () => {
      item.frame = f.id;
      commitHistory();
      renderCanvas();
      selectItem(item.id);
      closeSheet();
    });
    grid.appendChild(b);
  });
}

function openDetailsSheet() {
  openSheet({
    title: "Page details",
    html: `
      <div class="field"><label>Title</label><input type="text" id="dt-title" value="${escapeHtml(ed.page.title || "")}" maxlength="50" /></div>
      <div class="field"><label>Date</label><input type="date" id="dt-date" value="${ed.page.dateISO || ""}" /></div>
      <div class="field"><label>Mood</label><div class="mood-picker" id="dt-mood"></div></div>
      <div class="field"><label>Location (optional)</label><input type="text" id="dt-loc" value="${escapeHtml(ed.page.location || "")}" placeholder="e.g. Rome, Italy" /></div>
      <div class="field"><label>Tags (optional, comma separated)</label><input type="text" id="dt-tags" value="${escapeHtml(ed.page.tags || "")}" placeholder="friends, sunny, birthday" /></div>
      <div class="field"><label>Page background</label><div class="page-style-grid" id="dt-bg"></div></div>
      <button class="btn btn-primary btn-block" id="dt-save">Save details</button>
    `,
  });
  const bgWrap = document.getElementById("dt-bg");
  [
    { id: "dot", label: "Dotted" },
    { id: "ruled", label: "Ruled" },
    { id: "grid", label: "Grid" },
    { id: "blank", label: "Blank" },
  ].forEach((style) => {
    const b = document.createElement("button");
    b.className = `canvas-page bg-${style.id}` + ((ed.page.background || "dot") === style.id ? " selected" : "");
    b.innerHTML = `<span>${style.label}</span>`;
    b.addEventListener("click", () => {
      ed.page.background = style.id;
      bgWrap.querySelectorAll("button").forEach((x) => x.classList.remove("selected"));
      b.classList.add("selected");
      document.getElementById("ed-page").className = `canvas-page bg-${style.id}`;
    });
    bgWrap.appendChild(b);
  });
  const moodWrap = document.getElementById("dt-mood");
  MOODS.forEach((m) => {
    const b = document.createElement("button");
    b.textContent = m;
    b.className = m === ed.page.mood ? "selected" : "";
    b.addEventListener("click", () => {
      ed.page.mood = ed.page.mood === m ? "" : m;
      [...moodWrap.children].forEach((c) => c.classList.remove("selected"));
      if (ed.page.mood) b.classList.add("selected");
    });
    moodWrap.appendChild(b);
  });
  document.getElementById("dt-save").addEventListener("click", () => {
    ed.page.title = document.getElementById("dt-title").value.trim() || "Untitled";
    ed.page.dateISO = document.getElementById("dt-date").value || ed.page.dateISO;
    ed.page.location = document.getElementById("dt-loc").value.trim();
    ed.page.tags = document.getElementById("dt-tags").value.trim();
    closeSheet();
    updateTitleBits();
  });
}

// ---------------------------------------------------------------------
// Chrome wiring + save
// ---------------------------------------------------------------------

function pickPhotosMulti() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.style.display = "none";
    document.body.appendChild(input);
    input.addEventListener("change", () => {
      const files = Array.from(input.files || []);
      document.body.removeChild(input);
      resolve(files);
    });
    input.click();
  });
}

function wireChrome() {
  document.getElementById("ed-back").addEventListener("click", () => finishAndLeave());
  document.getElementById("ed-done").addEventListener("click", () => finishAndLeave());
  document.getElementById("ed-title-btn").addEventListener("click", openDetailsSheet);
  document.getElementById("ed-undo").addEventListener("click", undo);
  document.getElementById("ed-redo").addEventListener("click", redo);
  document.getElementById("ed-add-text").addEventListener("click", () => openTextSheet(null));
  document.getElementById("ed-add-sticker").addEventListener("click", openStickerSheet);
  document.getElementById("ed-add-tape").addEventListener("click", openTapeSheet);
  document.getElementById("ed-add-calendar").addEventListener("click", openCalendarSheet);
  document.getElementById("ed-messy").addEventListener("click", () => {
    ed.messy = !ed.messy;
    document.getElementById("ed-messy-circ").classList.toggle("on", ed.messy);
    showToast(ed.messy ? "Messy Mode on — new items scatter playfully" : "Messy Mode off");
  });
  document.getElementById("ed-messy-circ").classList.toggle("on", ed.messy);
  document.getElementById("ed-add-photo").addEventListener("click", async () => {
    const files = await pickPhotosMulti();
    let added = 0;
    let uploadFailed = false;
    for (const [i, file] of files.entries()) {
      const url = URL.createObjectURL(file);
      const { w, h } = await loadImageSize(url);
      let mediaId;
      try {
        mediaId = await db.saveMediaBlob(file);
      } catch {
        uploadFailed = true;
        URL.revokeObjectURL(url);
        continue;
      }
      ed.urlCache.set(mediaId, url);
      const width = 160;
      const item = {
        id: idgen(), type: "photo", mediaId, frame: Math.random() < 0.4 ? "polaroid" : "plain",
        w: width, h: width / (w / h || 1),
        x: clamp(60 + i * 16 + rand(ed.messy ? -30 : -6, ed.messy ? 30 : 6), 10, PAGE_W - width - 10),
        y: clamp(60 + i * 16 + rand(ed.messy ? -30 : -6, ed.messy ? 30 : 6), 10, PAGE_H - 200),
        rotation: ed.messy ? rand(-14, 14) : rand(-3, 3),
      };
      ed.items.push(item);
      added++;
    }
    if (added) {
      commitHistory();
      renderCanvas();
      showToast(`Added ${added} photo${added > 1 ? "s" : ""} 🌸`);
    }
    if (uploadFailed) {
      showToast("Photo storage isn't set up yet on this account — see the README to add it.");
    }
  });
}

async function persist() {
  const thumbItem = ed.items.find((i) => i.type === "photo");
  const record = {
    ...ed.page,
    items: ed.items,
    thumbnailMediaId: thumbItem ? thumbItem.mediaId : null,
  };
  const saved = await db.savePage(record);
  ed.page.id = saved.id;
  ed.saved = true;
  return saved;
}

async function finishAndLeave() {
  await persist();
  const rs = returnScreen;
  ed = null;
  document.getElementById("bottom-nav").style.display = "flex";
  window.blossomNavigate(rs.name, rs.params);
}
