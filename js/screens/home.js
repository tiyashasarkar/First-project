import * as db from "../db.js";
import { formatDate, timeAgo, escapeHtml, MOODS } from "../ui.js";
import { openEditor } from "./editor.js";
import { openCreateFlow } from "./create.js";

async function thumbStyle(page) {
  if (!page.thumbnailMediaId) return "";
  const url = await db.getMediaURL(page.thumbnailMediaId);
  return url ? `background-image:url('${url}')` : "";
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Sweet dreams";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

async function findOnThisDay(pages) {
  const now = new Date();
  return pages.filter((p) => {
    const d = new Date(p.dateISO || p.createdAt);
    return d.getMonth() === now.getMonth() && d.getDate() === now.getDate() && d.getFullYear() !== now.getFullYear();
  });
}

export async function renderHome(container) {
  const [pages, journals] = await Promise.all([db.getAllPagesSorted(), db.getAll("journals")]);
  const journalById = Object.fromEntries(journals.map((j) => [j.id, j]));
  const onThisDay = await findOnThisDay(pages);
  const recent = pages.slice(0, 10);
  const continueEditing = pages[0];

  container.innerHTML = `
    <div class="topbar home-topbar">
      <div class="eyebrow">${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
      <div class="topbar-row">
        <h1 class="home-greeting">${greeting()} <span class="home-greeting-emoji">🌸</span></h1>
      </div>
    </div>

    ${
      onThisDay.length
        ? `<div class="section">
            <div class="section-head"><h2>✨ On This Day</h2></div>
            <div class="hscroll" id="otd-scroll"></div>
          </div>`
        : ""
    }

    <div class="section">
      <button class="home-cta fade-in" id="create-cta">
        <div class="home-cta-icon">📷</div>
        <div class="home-cta-text">
          <div class="home-cta-title">Create a memory</div>
          <div class="home-cta-sub">Turn today's photos into a page</div>
        </div>
        <div class="home-cta-arrow"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></div>
      </button>
    </div>

    ${
      continueEditing
        ? `<div class="section">
            <div class="section-head"><h2>Continue editing</h2></div>
            <div id="continue-card"></div>
          </div>`
        : ""
    }

    <div class="section">
      <div class="section-head">
        <h2>Recent memories</h2>
        <span class="link" data-nav-link="memories">See all</span>
      </div>
      ${recent.length ? `<div class="hscroll" id="recent-scroll"></div>` : renderEmpty()}
    </div>
  `;

  container.querySelector("#create-cta").addEventListener("click", () => openCreateFlow());
  const seeAll = container.querySelector('[data-nav-link="memories"]');
  if (seeAll) seeAll.addEventListener("click", () => window.blossomNavigate("memories"));

  if (onThisDay.length) {
    const wrap = container.querySelector("#otd-scroll");
    for (const [i, p] of onThisDay.entries()) {
      const card = await memoryCard(p, journalById, true);
      card.style.animationDelay = i * 45 + "ms";
      wrap.appendChild(card);
    }
  }

  if (continueEditing) {
    const wrap = container.querySelector("#continue-card");
    const card = document.createElement("div");
    card.className = "card fade-in";
    card.style.cssText = "display:flex;align-items:center;gap:12px;padding:12px;";
    const style = await thumbStyle(continueEditing);
    card.innerHTML = `
      <div style="width:56px;height:56px;border-radius:12px;background-color:var(--peach);background-size:cover;background-position:center;flex-shrink:0;${style}"></div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(continueEditing.title || "Untitled page")}</div>
        <div style="font-size:12px;color:var(--ink-soft);margin-top:2px;">${journalById[continueEditing.journalId]?.title || "Journal"} · edited ${timeAgo(continueEditing.updatedAt)}</div>
      </div>
      <div class="icon-btn"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></div>
    `;
    card.addEventListener("click", () => openEditor({ pageId: continueEditing.id }));
    wrap.appendChild(card);
  }

  if (recent.length) {
    const wrap = container.querySelector("#recent-scroll");
    for (const [i, p] of recent.entries()) {
      const card = await memoryCard(p, journalById);
      card.style.animationDelay = i * 45 + "ms";
      wrap.appendChild(card);
    }
  }
}

function renderEmpty() {
  return `<div class="empty-state">
    <div class="emoji">🌷</div>
    <h3>No memories yet</h3>
    <p>Tap "Create a memory" above to make your first scrapbook page.</p>
  </div>`;
}

async function memoryCard(page, journalById, showOtdYear = false) {
  const card = document.createElement("div");
  card.className = "memory-card fade-in";
  const style = await thumbStyle(page);
  const year = new Date(page.dateISO || page.createdAt).getFullYear();
  card.innerHTML = `
    <div class="thumb" style="${style}">
      ${page.mood ? `<span class="mood">${page.mood}</span>` : ""}
    </div>
    <div class="meta">
      <div class="title">${escapeHtml(page.title || "Untitled")}</div>
      <div class="date">${showOtdYear ? year + " · " : ""}${journalById[page.journalId]?.title || ""}</div>
    </div>
  `;
  card.addEventListener("click", () => openEditor({ pageId: page.id }));
  return card;
}
