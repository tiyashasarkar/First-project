import * as db from "../db.js";
import { escapeHtml, formatDate, showToast, openSheet, closeSheet, confirmAction } from "../ui.js";
import { openEditor } from "./editor.js";
import { openCreateFlow } from "./create.js";
import { openReader } from "./reader.js";

async function coverStyle(journal) {
  if (journal.coverMediaId) {
    const url = await db.getMediaURL(journal.coverMediaId);
    if (url) return `background-image:url('${url}')`;
  }
  return `background:${journal.coverColor || "linear-gradient(145deg,#f6c9d8,#d98fac)"}`;
}

export async function renderJournals(container) {
  const journals = (await db.getAll("journals")).filter((j) => !j.archived);
  journals.sort((a, b) => (b.favorite - a.favorite) || (b.updatedAt - a.updatedAt));

  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-row">
        <div>
          <div class="eyebrow">Your library</div>
          <h1>Journals</h1>
        </div>
        <button class="icon-btn" id="new-journal-btn"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>
      </div>
    </div>
    ${
      journals.length
        ? `<div class="journal-grid" id="journal-grid"></div>`
        : `<div class="empty-state"><div class="emoji">📔</div><h3>No journals yet</h3><p>Create one to start collecting your pages together.</p></div>`
    }
  `;

  container.querySelector("#new-journal-btn").addEventListener("click", () => openNewJournalSheet(() => renderJournals(container)));

  if (journals.length) {
    const grid = container.querySelector("#journal-grid");
    for (const j of journals) grid.appendChild(await journalCoverEl(j));
  }
}

async function journalCoverEl(journal) {
  const el = document.createElement("div");
  el.className = "journal-cover fade-in";
  const style = await coverStyle(journal);
  el.innerHTML = `
    <div class="art" style="${style}">
      <div class="fav">${journal.favorite ? "💗" : "🤍"}</div>
    </div>
    <div class="info">
      <div class="title">${escapeHtml(journal.title)}</div>
      <div class="sub">${journal.pageCount || 0} page${journal.pageCount === 1 ? "" : "s"} · ${formatDate(journal.updatedAt)}</div>
    </div>
  `;
  el.addEventListener("click", () => window.blossomNavigate("journal-detail", { journalId: journal.id }));
  el.querySelector(".fav").addEventListener("click", async (e) => {
    e.stopPropagation();
    journal.favorite = !journal.favorite;
    await db.put("journals", journal);
    el.querySelector(".fav").textContent = journal.favorite ? "💗" : "🤍";
  });
  return el;
}

export function openNewJournalSheet(onDone) {
  openSheet({
    title: "New journal",
    html: `
      <div class="field">
        <label>Title</label>
        <input type="text" id="nj-title" placeholder="Italy Dreams" maxlength="40" />
      </div>
      <div class="field">
        <label>Description (optional)</label>
        <textarea id="nj-desc" placeholder="What is this journal about?"></textarea>
      </div>
      <button class="btn btn-primary btn-block" id="nj-save">Create journal</button>
    `,
  });
  const input = document.getElementById("nj-title");
  setTimeout(() => input.focus(), 300);
  document.getElementById("nj-save").addEventListener("click", async () => {
    const title = input.value.trim();
    if (!title) {
      input.focus();
      return;
    }
    const journal = await db.createJournal({ title, description: document.getElementById("nj-desc").value.trim() });
    closeSheet();
    showToast("Journal created 🌸");
    if (onDone) onDone(journal);
  });
}

export async function renderJournalDetail(container, journalId) {
  const journal = await db.get("journals", journalId);
  if (!journal) {
    window.blossomNavigate("journals");
    return;
  }
  const pages = (await db.getByIndex("pages", "journalId", journalId)).sort((a, b) => b.updatedAt - a.updatedAt);
  const style = await coverStyle(journal);

  container.innerHTML = `
    <div style="height:190px;position:relative;flex-shrink:0;${style};background-size:cover;background-position:center;">
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.35));"></div>
      <div style="position:relative;padding:calc(var(--safe-top) + 12px) 16px 0;display:flex;justify-content:space-between;">
        <button class="icon-btn" id="jd-back" style="background:rgba(255,255,255,.85);"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button>
        <button class="icon-btn" id="jd-menu" style="background:rgba(255,255,255,.85);"><svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg></button>
      </div>
      <div style="position:absolute;left:20px;right:20px;bottom:16px;color:white;">
        <h1 style="color:white;font-size:24px;">${escapeHtml(journal.title)}</h1>
        <div style="font-size:12.5px;opacity:.9;margin-top:3px;">${pages.length} page${pages.length === 1 ? "" : "s"}${journal.description ? " · " + escapeHtml(journal.description) : ""}</div>
      </div>
    </div>
    <div class="screen-scroll" style="flex:1;">
      <div class="section" style="padding-top:18px;display:flex;gap:10px;">
        <button class="btn btn-primary" style="flex:1;" id="jd-add-page">+ Add a page</button>
        ${pages.length ? `<button class="btn btn-secondary" style="flex:1;" id="jd-read">📖 Read</button>` : ""}
      </div>
      ${
        pages.length
          ? `<div class="journal-grid" id="jd-grid" style="grid-template-columns:1fr 1fr;"></div>`
          : `<div class="empty-state"><div class="emoji">🌿</div><h3>This journal is empty</h3><p>Add your first page to get started.</p></div>`
      }
    </div>
  `;

  container.querySelector("#jd-back").addEventListener("click", () => window.blossomNavigate("journals"));
  container.querySelector("#jd-add-page").addEventListener("click", () => openCreateFlow({ journalId }));
  if (pages.length) {
    container.querySelector("#jd-read").addEventListener("click", () => openReader({ journalId }));
  }
  container.querySelector("#jd-menu").addEventListener("click", () => openJournalMenu(journal, container, journalId));

  if (pages.length) {
    const grid = container.querySelector("#jd-grid");
    for (const p of pages) grid.appendChild(await pageThumbEl(p));
  }
}

async function pageThumbEl(page) {
  const el = document.createElement("div");
  el.className = "journal-cover fade-in";
  let style = "background:var(--peach)";
  if (page.thumbnailMediaId) {
    const url = await db.getMediaURL(page.thumbnailMediaId);
    if (url) style = `background-image:url('${url}');background-size:cover;background-position:center;`;
  }
  el.innerHTML = `
    <div class="art" style="${style}"><div class="fav" style="background:rgba(255,255,255,.7);">${page.mood || "📝"}</div></div>
    <div class="info">
      <div class="title">${escapeHtml(page.title || "Untitled")}</div>
      <div class="sub">${formatDate(page.dateISO || page.createdAt)}</div>
    </div>
  `;
  el.addEventListener("click", () => openEditor({ pageId: page.id }));
  return el;
}

function openJournalMenu(journal, container, journalId) {
  openSheet({
    title: journal.title,
    html: `
      <div class="settings-list">
        <button class="settings-row" id="jm-rename" style="width:100%;background:none;border:none;text-align:left;">
          <div class="si"><svg viewBox="0 0 24 24"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3"/></svg></div>
          <div class="label">Rename & edit</div>
        </button>
        <button class="settings-row" id="jm-fav" style="width:100%;background:none;border:none;text-align:left;">
          <div class="si">${journal.favorite ? "💗" : "🤍"}</div>
          <div class="label">${journal.favorite ? "Remove from favorites" : "Add to favorites"}</div>
        </button>
        <button class="settings-row" id="jm-archive" style="width:100%;background:none;border:none;text-align:left;">
          <div class="si"><svg viewBox="0 0 24 24"><path d="M4 7h16M5 7l1 13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg></div>
          <div class="label">Archive journal</div>
        </button>
        <button class="settings-row" id="jm-delete" style="width:100%;background:none;border:none;text-align:left;">
          <div class="si" style="background:#f6d3da;"><svg viewBox="0 0 24 24" style="stroke:#c94f6a;"><path d="M4 7h16M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3m-9 0 1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></svg></div>
          <div class="label" style="color:#c94f6a;">Delete journal</div>
        </button>
      </div>
    `,
  });
  document.getElementById("jm-rename").addEventListener("click", () => {
    closeSheet();
    openRenameSheet(journal, container, journalId);
  });
  document.getElementById("jm-fav").addEventListener("click", async () => {
    journal.favorite = !journal.favorite;
    await db.put("journals", journal);
    closeSheet();
    renderJournalDetail(container, journalId);
  });
  document.getElementById("jm-archive").addEventListener("click", async () => {
    journal.archived = true;
    await db.put("journals", journal);
    closeSheet();
    showToast("Journal archived");
    window.blossomNavigate("journals");
  });
  document.getElementById("jm-delete").addEventListener("click", () => {
    closeSheet();
    confirmAction({
      title: "Delete journal?",
      message: `"${journal.title}" and all its pages will be permanently deleted. This can't be undone.`,
      confirmLabel: "Delete journal",
      onConfirm: async () => {
        const pages = await db.getByIndex("pages", "journalId", journalId);
        for (const p of pages) await db.deletePage(p.id);
        await db.del("journals", journalId);
        showToast("Journal deleted");
        window.blossomNavigate("journals");
      },
    });
  });
}

function openRenameSheet(journal, container, journalId) {
  openSheet({
    title: "Edit journal",
    html: `
      <div class="field"><label>Title</label><input type="text" id="rn-title" value="${escapeHtml(journal.title)}" maxlength="40" /></div>
      <div class="field"><label>Description</label><textarea id="rn-desc">${escapeHtml(journal.description || "")}</textarea></div>
      <button class="btn btn-primary btn-block" id="rn-save">Save changes</button>
    `,
  });
  document.getElementById("rn-save").addEventListener("click", async () => {
    journal.title = document.getElementById("rn-title").value.trim() || journal.title;
    journal.description = document.getElementById("rn-desc").value.trim();
    await db.put("journals", journal);
    closeSheet();
    renderJournalDetail(container, journalId);
  });
}
