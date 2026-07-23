import * as db from "../db.js";
import { escapeHtml, formatDayLabel, formatDate, thumbPlaceholder } from "../ui.js";
import { openEditor } from "./editor.js";

let mode = "timeline";

export async function renderMemories(container) {
  const pages = await db.getAllPagesSorted();

  container.innerHTML = `
    <div class="topbar">
      <div class="eyebrow">${pages.length} memor${pages.length === 1 ? "y" : "ies"} saved</div>
      <h1>Memories</h1>
      <div class="segmented" style="margin-top:14px;">
        <button data-m="timeline" class="${mode === "timeline" ? "active" : ""}">Timeline</button>
        <button data-m="mood" class="${mode === "mood" ? "active" : ""}">By Mood</button>
        <button data-m="location" class="${mode === "location" ? "active" : ""}">By Place</button>
      </div>
    </div>
    <div id="mem-body" style="padding-top:14px;"></div>
  `;

  container.querySelectorAll(".segmented button").forEach((b) =>
    b.addEventListener("click", () => {
      mode = b.dataset.m;
      renderMemories(container);
    })
  );

  const body = container.querySelector("#mem-body");
  if (!pages.length) {
    body.innerHTML = `<div class="empty-state"><div class="emoji">🕰️</div><h3>Nothing here yet</h3><p>Pages you create will show up here, organized by date.</p></div>`;
    return;
  }

  if (mode === "timeline") await renderTimeline(body, pages);
  else if (mode === "mood") await renderGrouped(body, pages, (p) => p.mood || "No mood set", true);
  else await renderGrouped(body, pages, (p) => p.location || "No location", false);
}

async function renderTimeline(body, pages) {
  const groups = [];
  let lastKey = null;
  for (const p of pages) {
    const ts = p.dateISO ? new Date(p.dateISO + "T12:00:00").getTime() : p.createdAt;
    const key = new Date(ts).toDateString();
    if (key !== lastKey) {
      groups.push({ key, ts, pages: [] });
      lastKey = key;
    }
    groups[groups.length - 1].pages.push(p);
  }

  for (const g of groups) {
    const row = document.createElement("div");
    row.className = "timeline-day fade-in";
    row.innerHTML = `
      <div class="dot-col"><div class="dot"></div><div class="line"></div></div>
      <div class="content">
        <div class="day-label">${formatDayLabel(g.ts)}</div>
        <div id="grp-${g.key.replace(/\s/g, "")}"></div>
      </div>
    `;
    body.appendChild(row);
    const holder = row.querySelector(`#grp-${g.key.replace(/\s/g, "")}`);
    for (const p of g.pages) holder.appendChild(await entryEl(p));
  }
}

async function renderGrouped(body, pages, keyFn, isEmoji) {
  const map = new Map();
  for (const p of pages) {
    const k = keyFn(p);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(p);
  }
  for (const [key, list] of map) {
    const row = document.createElement("div");
    row.className = "section fade-in";
    row.style.paddingTop = "6px";
    row.innerHTML = `<div class="section-head"><h2>${isEmoji ? key : escapeHtml(key)}</h2></div><div id="g-${Math.random().toString(36).slice(2)}"></div>`;
    const holder = row.querySelector("div[id^='g-']");
    for (const p of list) holder.appendChild(await entryEl(p));
    body.appendChild(row);
  }
}

async function entryEl(page) {
  const el = document.createElement("div");
  el.className = "timeline-entry";
  let style = "";
  if (page.thumbnailMediaId) {
    const url = await db.getMediaURL(page.thumbnailMediaId);
    if (url) style = `background-image:url('${url}')`;
  }
  el.innerHTML = `
    <div class="thumb" style="${style}">${style ? "" : thumbPlaceholder(page.id)}</div>
    <div class="tx">
      <div class="t">${escapeHtml(page.title || "Untitled")}${page.mood ? " " + page.mood : ""}</div>
      <div class="s">${formatDate(page.dateISO ? new Date(page.dateISO + "T12:00:00").getTime() : page.createdAt)}</div>
    </div>
  `;
  el.addEventListener("click", () => openEditor({ pageId: page.id }));
  return el;
}
