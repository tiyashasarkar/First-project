// Shared small UI helpers: toast, bottom sheet, formatting.

let toastTimer = null;
export function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

const overlay = document.getElementById("overlay");
const sheet = document.getElementById("sheet");
const sheetHead = document.getElementById("sheet-head");
const sheetBody = document.getElementById("sheet-body");
let onCloseCb = null;

export function openSheet({ title, html, onClose } = {}) {
  sheetHead.innerHTML = title ? `<h3>${title}</h3>` : "";
  sheetBody.innerHTML = html || "";
  overlay.classList.add("open");
  sheet.classList.add("open");
  onCloseCb = onClose || null;
  return sheetBody;
}

export function closeSheet() {
  overlay.classList.remove("open");
  sheet.classList.remove("open");
  if (onCloseCb) {
    const cb = onCloseCb;
    onCloseCb = null;
    cb();
  }
}

overlay.addEventListener("click", closeSheet);

export function confirmAction({ title, message, confirmLabel = "Delete", danger = true, onConfirm }) {
  openSheet({
    title,
    html: `
      <p style="color:var(--ink-soft);font-size:14px;line-height:1.55;margin-bottom:20px;">${message}</p>
      <button class="btn btn-block ${danger ? "" : "btn-primary"}" id="confirm-yes" style="${danger ? "background:#e0637f;color:#fff;margin-bottom:10px;" : "margin-bottom:10px;"}">${confirmLabel}</button>
      <button class="btn btn-secondary btn-block" id="confirm-no">Cancel</button>
    `,
  });
  document.getElementById("confirm-yes").onclick = () => {
    closeSheet();
    onConfirm();
  };
  document.getElementById("confirm-no").onclick = closeSheet;
}

// A handful of original hand-drawn line-art doodles used as a placeholder
// badge on memory/page thumbnails that have no photo cover yet — so an
// undesigned page reads as "a little blank canvas" rather than a dead
// flat rectangle. Picked deterministically per id so the same page always
// shows the same doodle, but different pages naturally get variety.
const THUMB_DOODLES = [
  `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20 8c2 3 2 6-1 8 3-1 6 0 7 3-3-1-6 0-7 3 1-3 0-6-3-7 3 0 5-2 4-5"/><circle cx="20" cy="20" r="2.6" fill="currentColor" stroke="none"/></svg>`,
  `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20 29C11 23 8 17 8 13c0-4 3-6 6-6 3 0 5 2 6 4 1-2 3-4 6-4 3 0 6 2 6 6 0 4-3 10-12 16Z"/></svg>`,
  `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 7l3.4 8.2L32 16l-6.4 5.8L27.4 30 20 25.4 12.6 30l1.8-8.2L8 16l8.6-0.8Z" stroke-linejoin="round"/></svg>`,
  `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20 20 8 14c-2-1-2-5 1-6 4-1 8 2 11 8m0 4 12-6c2-1 2-5-1-6-4-1-8 2-11 8"/><circle cx="20" cy="21" r="2.2" fill="currentColor" stroke="none"/><path d="M18 23c-2 3-2 6 0 8m4-8c2 3 2 6 0 8" stroke-width="1.4"/></svg>`,
];

function hashId(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export function thumbPlaceholder(id) {
  const doodle = THUMB_DOODLES[hashId(String(id)) % THUMB_DOODLES.length];
  return `<div class="thumb-placeholder"><div class="thumb-badge">${doodle}</div></div>`;
}

export function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function formatDate(ts, opts = {}) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", ...opts });
}

export function formatDayLabel(ts) {
  const d = new Date(ts);
  const today = new Date();
  const isSameDay = (a, b) => a.toDateString() === b.toDateString();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(d, today)) return "Today";
  if (isSameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
}

export function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return formatDate(ts);
}

export const MOODS = ["✨", "😊", "🥰", "😌", "🥹", "😢", "😤", "😴"];
