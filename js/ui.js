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
