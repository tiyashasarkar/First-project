import * as db from "../db.js";
import { formatDate, timeAgo, escapeHtml, MOODS, thumbPlaceholder } from "../ui.js";
import { ICONS } from "../icons.js";
import { openEditor } from "./editor.js";
import { openCreateFlow } from "./create.js";

async function thumbStyle(page) {
  if (!page.thumbnailMediaId) return "";
  const url = await db.getMediaURL(page.thumbnailMediaId);
  return url ? `background-image:url('${url}')` : "";
}

// Hand-drawn line-art doodles for each time of day — deliberately not
// smiley-face emoji, to keep the greeting feeling illustrated rather than
// like a chat app.
const GREETING_ICONS = {
  morning: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20 10v4M11 14l2.8 2.8M29 14l-2.8 2.8" stroke-linecap="round"/><path d="M11 24a9 9 0 0 1 18 0" /><path d="M6 24h28" stroke-linecap="round"/><path d="M9 29h22" stroke-linecap="round" opacity="0.6"/></svg>`,
  afternoon: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="20" cy="20" r="7"/><path d="M20 5v4M20 31v4M5 20h4M31 20h4M9.5 9.5l2.8 2.8M27.7 27.7l2.8 2.8M9.5 30.5l2.8-2.8M27.7 12.3l2.8-2.8" stroke-linecap="round"/></svg>`,
  evening: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M24 8a11 11 0 1 0 9 17 9 9 0 0 1-9-17Z" stroke-linejoin="round"/><path d="M30 10l1 2.4 2.4 1-2.4 1L30 17l-1-2.6-2.4-1 2.4-1Z" fill="currentColor" stroke="none"/></svg>`,
  night: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M22 8a12 12 0 1 0 10 18 10 10 0 0 1-10-18Z" stroke-linejoin="round"/><path d="M10 28l0.9 2.1L13 31l-2.1 0.9L10 34l-0.9-2.1L7 31l2.1-0.9Z" fill="currentColor" stroke="none"/><circle cx="8" cy="14" r="1.1" fill="currentColor" stroke="none"/></svg>`,
};

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return { text: "Sweet dreams", icon: GREETING_ICONS.night };
  if (h < 12) return { text: "Good morning", icon: GREETING_ICONS.morning };
  if (h < 18) return { text: "Good afternoon", icon: GREETING_ICONS.afternoon };
  return { text: "Good evening", icon: GREETING_ICONS.evening };
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
  const greet = greeting();

  container.innerHTML = `
    <div class="topbar home-topbar">
      <div class="eyebrow">${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
      <div class="topbar-row">
        <h1 class="home-greeting">${greet.text} <span class="home-greeting-emoji">${greet.icon}</span></h1>
      </div>
    </div>

    ${
      onThisDay.length
        ? `<div class="section">
            <div class="section-head"><h2 class="icon-heading">${ICONS.sparkleHeader} On This Day</h2></div>
            <div class="hscroll" id="otd-scroll"></div>
          </div>`
        : ""
    }

    <div class="section">
      <button class="home-cta fade-in" id="create-cta">
        <div class="home-cta-icon">${ICONS.camera}</div>
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
      <div class="thumb-sm" style="width:56px;height:56px;border-radius:12px;background-color:var(--peach);background-size:cover;background-position:center;flex-shrink:0;${style}">${style ? "" : thumbPlaceholder(continueEditing.id)}</div>
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
    <div class="emoji">${ICONS.tulip}</div>
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
      ${style ? "" : thumbPlaceholder(page.id)}
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
