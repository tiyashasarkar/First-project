import * as db from "../db.js";
import { openSheet, closeSheet } from "../ui.js";
import { openNewJournalSheet } from "./journals.js";
import { openEditor } from "./editor.js";

const TEMPLATES = [
  { id: "blank", icon: "📄", title: "Blank Page", sub: "Start from a totally empty canvas", wantsPhotos: false },
  { id: "photodump", icon: "🧺", title: "Photo Dump", sub: "Lots of photos, playfully scattered", wantsPhotos: true, multi: true },
  { id: "daily", icon: "☀️", title: "Daily Journal", sub: "One entry about today", wantsPhotos: true, multi: true },
  { id: "travel", icon: "✈️", title: "Travel Journal", sub: "Photos, tickets, places you went", wantsPhotos: true, multi: true },
  { id: "letter", icon: "💌", title: "Letter to Future Self", sub: "A page made mostly of words", wantsPhotos: false },
];

export function openCreateFlow({ journalId } = {}) {
  openSheet({
    title: "Create a memory",
    html: `
      <div class="template-list">
        ${TEMPLATES.map((t) => `
          <button class="template-card" data-t="${t.id}">
            <div class="ic">${t.icon}</div>
            <div>
              <div class="tc-title">${t.title}</div>
              <div class="tc-sub">${t.sub}</div>
            </div>
          </button>
        `).join("")}
      </div>
    `,
  });
  document.querySelectorAll(".template-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      const template = TEMPLATES.find((t) => t.id === btn.dataset.t);
      closeSheet();
      proceedWithTemplate(template, journalId);
    });
  });
}

async function proceedWithTemplate(template, journalId) {
  if (journalId) {
    await proceedWithJournal(template, journalId);
    return;
  }
  const journals = await db.getAll("journals");
  const active = journals.filter((j) => !j.archived);
  if (active.length === 1) {
    await proceedWithJournal(template, active[0].id);
    return;
  }
  openSheet({
    title: "Which journal?",
    html: `
      <div class="template-list" id="jp-list"></div>
      <button class="btn btn-secondary btn-block" id="jp-new" style="margin-top:6px;">+ New journal</button>
    `,
  });
  const list = document.getElementById("jp-list");
  active
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .forEach((j) => {
      const btn = document.createElement("button");
      btn.className = "template-card";
      btn.innerHTML = `<div class="ic">📔</div><div><div class="tc-title">${j.title}</div><div class="tc-sub">${j.pageCount || 0} pages</div></div>`;
      btn.addEventListener("click", () => {
        closeSheet();
        proceedWithJournal(template, j.id);
      });
      list.appendChild(btn);
    });
  document.getElementById("jp-new").addEventListener("click", () => {
    openNewJournalSheet((journal) => proceedWithJournal(template, journal.id));
  });
}

function pickPhotos({ multi }) {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    if (multi) input.multiple = true;
    input.style.display = "none";
    document.body.appendChild(input);
    input.addEventListener("change", () => {
      const files = Array.from(input.files || []);
      document.body.removeChild(input);
      resolve(files);
    });
    // if the user cancels, no 'change' fires on iOS Safari reliably — fall back with a focus listener
    window.addEventListener(
      "focus",
      () => setTimeout(() => { if (document.body.contains(input)) { document.body.removeChild(input); resolve([]); } }, 400),
      { once: true }
    );
    input.click();
  });
}

async function proceedWithJournal(template, journalId) {
  if (!template.wantsPhotos) {
    openEditor({ journalId, template: template.id, files: [] });
    return;
  }
  const files = await pickPhotos({ multi: template.multi });
  openEditor({ journalId, template: template.id, files });
}
