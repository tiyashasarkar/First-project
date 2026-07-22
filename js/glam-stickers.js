// The Glam Mode sticker dock: a small collapsible cluster of playful,
// interactive stickers that only appears when Glam Mode is the active
// theme. Each sticker has its own lightweight animation + message.
// Purely original hand-built vector artwork/names — no third-party
// branding, logos, or wordmarks.
import { showToast } from "./ui.js";

const STICKERS = [
  {
    id: "boombox", run: runBoombox,
    svg: `<svg viewBox="0 0 100 100"><path d="M26 34 L20 16 M74 34 L80 16" stroke="#ff2f92" stroke-width="5" stroke-linecap="round" fill="none"/><rect x="14" y="34" width="72" height="46" rx="10" fill="#ff2f92"/><rect x="14" y="34" width="72" height="12" rx="6" fill="#ff6fc0"/><circle cx="32" cy="62" r="15" fill="#fff"/><circle cx="32" cy="62" r="7" fill="#ff2f92"/><circle cx="68" cy="62" r="15" fill="#fff"/><circle cx="68" cy="62" r="7" fill="#ff2f92"/></svg>`,
  },
  {
    id: "ticket", run: runTicket,
    svg: `<svg viewBox="0 0 100 100"><rect x="8" y="28" width="84" height="44" rx="10" fill="#ff2f92"/><circle cx="50" cy="28" r="7" fill="#ffe3f0"/><circle cx="50" cy="72" r="7" fill="#ffe3f0"/><line x1="50" y1="40" x2="50" y2="60" stroke="#fff" stroke-width="3" stroke-dasharray="4 5"/><path d="M25 50 l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" fill="#fff"/></svg>`,
  },
  {
    id: "lips", run: runLips,
    svg: `<svg viewBox="0 0 100 100"><path d="M50 35 C40 20 15 25 15 45 C15 55 25 58 35 52 C30 60 30 68 38 72 C42 66 46 62 50 62 C54 62 58 66 62 72 C70 68 70 60 65 52 C75 58 85 55 85 45 C85 25 60 20 50 35 Z" fill="#ff2f92"/></svg>`,
  },
  {
    id: "manicure", run: runManicure,
    svg: `<svg viewBox="0 0 100 100"><rect x="38" y="10" width="24" height="16" rx="4" fill="#ff2f92"/><rect x="44" y="4" width="12" height="10" rx="3" fill="#7a1054"/><path d="M32 30 h36 l-6 55 a6 6 0 0 1-6 5 h-12 a6 6 0 0 1-6-5 z" fill="#fff"/><path d="M36 34 h28 l-5 48 a4 4 0 0 1-4 3.5 h-10 a4 4 0 0 1-4-3.5 z" fill="#ff6fc0"/></svg>`,
  },
  {
    id: "heels", run: runHeels,
    svg: `<svg viewBox="0 0 100 100"><path d="M20 55 C20 45 30 40 45 40 C60 40 70 35 78 28 C82 25 88 27 88 33 C88 40 80 44 80 52 C80 60 85 64 85 70 C85 76 78 80 68 80 L25 80 C18 80 14 76 14 70 C14 62 18 58 20 55 Z" fill="#ff2f92"/><rect x="78" y="52" width="6" height="26" rx="2" fill="#ff2f92"/></svg>`,
  },
  {
    id: "headphones", run: runHeadphones,
    svg: `<svg viewBox="0 0 100 100"><path d="M20 55 v-8 a30 30 0 0 1 60 0 v8" stroke="#ff2f92" stroke-width="7" fill="none" stroke-linecap="round"/><rect x="12" y="52" width="16" height="26" rx="8" fill="#ff2f92"/><rect x="72" y="52" width="16" height="26" rx="8" fill="#ff2f92"/><rect x="16" y="58" width="8" height="14" rx="4" fill="#fff"/><rect x="76" y="58" width="8" height="14" rx="4" fill="#fff"/></svg>`,
  },
  {
    id: "lollipop", run: runLollipop,
    svg: `<svg viewBox="0 0 100 100"><path d="M50 68 v24" stroke="#ff96c5" stroke-width="5" stroke-linecap="round"/><path d="M50 55 C20 35 15 10 35 8 C45 7 50 18 50 18 C50 18 55 7 65 8 C85 10 80 35 50 55 Z" fill="#ff2f92"/><circle cx="38" cy="22" r="4" fill="#fff" opacity=".55"/></svg>`,
  },
  {
    id: "clapper", run: runClapper,
    svg: `<svg viewBox="0 0 100 100"><rect x="14" y="38" width="72" height="48" rx="6" fill="#3a1a40"/><path d="M14 38 L20 20 H86 L80 38 Z" fill="#ff2f92"/><path d="M28 20 L22 38 M46 20 L40 38 M64 20 L58 38 M82 20 L76 38" stroke="#fff" stroke-width="4"/></svg>`,
  },
  {
    id: "phone", run: runPhone,
    svg: `<svg viewBox="0 0 100 100"><rect x="30" y="10" width="40" height="80" rx="14" fill="#ff2f92"/><rect x="36" y="20" width="28" height="42" rx="4" fill="#ffe3f0"/><circle cx="50" cy="74" r="6" fill="#fff"/></svg>`,
  },
  {
    id: "plane", run: runPlane,
    svg: `<svg viewBox="0 0 100 100"><path d="M50 6 L58 40 L92 58 L92 66 L58 56 L54 82 L68 92 L68 98 L50 92 L32 98 L32 92 L46 82 L42 56 L8 66 L8 58 L42 40 Z" fill="#ff2f92"/></svg>`,
  },
  {
    id: "mic", run: runMic,
    svg: `<svg viewBox="0 0 100 100"><rect x="38" y="8" width="24" height="46" rx="12" fill="#ff2f92"/><path d="M26 44 a24 24 0 0 0 48 0" stroke="#ff2f92" stroke-width="6" fill="none" stroke-linecap="round"/><line x1="50" y1="68" x2="50" y2="86" stroke="#ff2f92" stroke-width="6" stroke-linecap="round"/><line x1="34" y1="90" x2="66" y2="90" stroke="#ff2f92" stroke-width="6" stroke-linecap="round"/></svg>`,
  },
];

const TICKET_MESSAGES = ["MAIN CHARACTER MOMENT", "PLOT TWIST INCOMING", "ROMANTICISE YOUR LIFE", "PINK ERA ACTIVATED", "TODAY'S FEATURE: YOU"];
const CLAPPER_MESSAGES = ["AND... ACTION!", "SCENE ONE, TAKE ONE.", "THIS IS THE MOMENT."];
const HEELS_MESSAGES = ["SHE'S BOOKED.", "SHE'S BUSY.", "SHE'S FABULOUS.", "WALKED IN. CHANGED THE VIBE."];
const LOLLIPOP_MESSAGES = ["YOU'RE DOING BETTER THAN YOU THINK.", "MAIN CHARACTER BEHAVIOUR DETECTED.", "A LITTLE MORE PINK NEVER HURT ANYONE.", "YOU FOUND A LITTLE MOMENT OF JOY."];
const CALL_MESSAGES = ["Hey gorgeous — just calling to remind you your life is literally a movie.", "You have main character energy today.", "Your next adventure is waiting for you."];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

let root = null;
let panel = null;
let mainBtn = null;
let open = false;

export function mountGlamDock() {
  unmountGlamDock();

  root = document.createElement("div");
  root.id = "glam-dock";
  root.innerHTML = `
    <div class="glam-dock-panel" id="glam-panel">
      ${STICKERS.map((s) => `<button class="glam-sticker" data-id="${s.id}" aria-label="${s.id}">${s.svg}</button>`).join("")}
    </div>
    <button class="glam-dock-main" id="glam-main" aria-label="Glam stickers — tap to open, tap again for a surprise">
      <svg viewBox="0 0 100 100"><g fill="#fff">
        <circle cx="53" cy="57" r="30"/>
        <circle cx="32" cy="25" r="18"/>
        <path d="M15 26 Q32 18 51 27 Q40 52 28 62 Q18 46 15 26 Z"/>
      </g></svg>
    </button>
  `;
  document.body.appendChild(root);
  panel = document.getElementById("glam-panel");
  mainBtn = document.getElementById("glam-main");

  mainBtn.addEventListener("click", () => {
    if (open) {
      celebrate();
    } else {
      open = true;
      panel.classList.add("open");
    }
  });

  panel.querySelectorAll(".glam-sticker").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sticker = STICKERS.find((s) => s.id === btn.dataset.id);
      sticker.run(btn);
    });
  });

  document.addEventListener("click", onOutsideClick, true);
}

function onOutsideClick(e) {
  if (!open || !root) return;
  if (!root.contains(e.target)) closePanel();
}

function closePanel() {
  open = false;
  if (panel) panel.classList.remove("open");
}

export function unmountGlamDock() {
  document.removeEventListener("click", onOutsideClick, true);
  if (root) {
    root.remove();
    root = null;
    panel = null;
    mainBtn = null;
  }
  open = false;
}

export function setGlamDockVisible(visible) {
  if (root) root.style.display = visible ? "block" : "none";
  if (!visible) closePanel();
}

// ---------------------------------------------------------------------
// Shared animation helpers
// ---------------------------------------------------------------------

function bump(el) {
  el.classList.remove("glam-bump");
  void el.offsetWidth;
  el.classList.add("glam-bump");
}

function spawnFloating(emoji, x, y, { count = 1, spread = 60, rise = 90, duration = 1100 } = {}) {
  for (let i = 0; i < count; i++) {
    const span = document.createElement("span");
    span.className = "glam-particle";
    span.textContent = emoji;
    span.style.left = x + "px";
    span.style.top = y + "px";
    document.body.appendChild(span);
    const dx = (Math.random() - 0.5) * spread;
    const dy = -rise - Math.random() * 40;
    const rot = (Math.random() - 0.5) * 60;
    span.animate(
      [
        { transform: "translate(-50%,-50%) translate(0,0) rotate(0deg)", opacity: 1 },
        { transform: `translate(-50%,-50%) translate(${dx}px, ${dy}px) rotate(${rot}deg)`, opacity: 0 },
      ],
      { duration: duration + Math.random() * 400, easing: "ease-out" }
    ).onfinish = () => span.remove();
  }
}

function flyAcrossScreen(emoji, { message, fromRight = false, duration = 2200, y } = {}) {
  const el = document.createElement("div");
  el.className = "glam-flyover";
  el.textContent = emoji;
  const startY = y ?? window.innerHeight * (0.25 + Math.random() * 0.4);
  el.style.top = startY + "px";
  document.body.appendChild(el);
  const startX = fromRight ? window.innerWidth + 40 : -40;
  const endX = fromRight ? -40 : window.innerWidth + 40;
  el.animate(
    [
      { transform: `translateX(${startX}px) translateY(-50%)` },
      { transform: `translateX(${endX}px) translateY(-50%)` },
    ],
    { duration, easing: "linear" }
  ).onfinish = () => el.remove();
  if (message) setTimeout(() => showToast(message), duration * 0.35);
}

function walkAcrossBottom(emoji, message) {
  const el = document.createElement("div");
  el.className = "glam-flyover glam-walker";
  el.textContent = emoji;
  const y = window.innerHeight - 70;
  el.style.top = y + "px";
  document.body.appendChild(el);
  const steps = 6;
  const totalDuration = 1800;
  let step = 0;
  const stepTimer = setInterval(() => {
    step++;
    const x = (window.innerWidth / (steps + 1)) * step;
    spawnFloating("✨", x, y + 30, { count: 1, rise: 6, spread: 6, duration: 400 });
    if (step >= steps) clearInterval(stepTimer);
  }, totalDuration / steps);
  const anim = el.animate(
    [{ transform: "translateX(-10vw)" }, { transform: "translateX(110vw)" }],
    { duration: totalDuration, easing: "ease-in-out" }
  );
  anim.onfinish = () => el.remove();
  setTimeout(() => showToast(message), totalDuration * 0.4);
}

// ---------------------------------------------------------------------
// Individual sticker behaviors
// ---------------------------------------------------------------------

function runBoombox(btn) {
  bump(btn);
  const r = btn.getBoundingClientRect();
  spawnFloating("🎵", r.left + r.width / 2, r.top, { count: 3, spread: 70, rise: 80 });
  showToast("The app suddenly has a soundtrack 🎶");
}

function runTicket(btn) {
  bump(btn);
  showToast(pick(TICKET_MESSAGES));
}

function scatterKisses(count = 14) {
  for (let i = 0; i < count; i++) {
    const delay = Math.random() * 450;
    setTimeout(() => {
      const el = document.createElement("div");
      el.className = "glam-kiss-mark";
      el.textContent = "💋";
      const x = 20 + Math.random() * (window.innerWidth - 40);
      const y = 20 + Math.random() * (window.innerHeight - 40);
      el.style.left = x + "px";
      el.style.top = y + "px";
      const rot = (Math.random() - 0.5) * 50;
      const scale = 0.7 + Math.random() * 0.6;
      document.body.appendChild(el);
      el.animate(
        [
          { transform: `translate(-50%,-50%) scale(0) rotate(${rot}deg)`, opacity: 0, offset: 0 },
          { transform: `translate(-50%,-50%) scale(${scale}) rotate(${rot}deg)`, opacity: 1, offset: 0.22 },
          { transform: `translate(-50%,-50%) scale(${scale}) rotate(${rot}deg)`, opacity: 1, offset: 0.7 },
          { transform: `translate(-50%,-50%) scale(${scale * 0.8}) rotate(${rot}deg)`, opacity: 0, offset: 1 },
        ],
        { duration: 1300 + Math.random() * 500, easing: "ease-out" }
      ).onfinish = () => el.remove();
    }, delay);
  }
}

function runLips(btn) {
  bump(btn);
  scatterKisses();
  showToast("Kisses everywhere 💋");
}

function runManicure(btn) {
  bump(btn);
  const r = btn.getBoundingClientRect();
  spawnFloating("💅", r.left + r.width / 2, r.top, { count: 4, spread: 60, rise: 70 });
  showToast("Fresh manicure, don't touch anything for 10 minutes");
}

function runHeadphones(btn) {
  bump(btn);
  showToast("Now playing: your main character soundtrack 🎧");
}

function runClapper(btn) {
  bump(btn);
  showToast(pick(CLAPPER_MESSAGES));
}

function runHeels(btn) {
  bump(btn);
  walkAcrossBottom("👠", pick(HEELS_MESSAGES));
}

function runLollipop(btn) {
  btn.classList.remove("glam-spin");
  void btn.offsetWidth;
  btn.classList.add("glam-spin");
  showToast(pick(LOLLIPOP_MESSAGES));
}

function runPhone(btn) {
  btn.classList.add("glam-ring");
  openSheetLikeCall(btn);
}

function openSheetLikeCall(btn) {
  const card = document.createElement("div");
  card.className = "glam-call-card";
  card.innerHTML = `
    <div class="glam-call-emoji">☎️</div>
    <div class="glam-call-title">INCOMING CALL 💌</div>
    <button class="glam-call-answer">Answer</button>
  `;
  document.body.appendChild(card);
  requestAnimationFrame(() => card.classList.add("show"));
  const cleanup = () => {
    btn.classList.remove("glam-ring");
    card.classList.remove("show");
    setTimeout(() => card.remove(), 300);
  };
  card.querySelector(".glam-call-answer").addEventListener("click", () => {
    cleanup();
    showToast(pick(CALL_MESSAGES));
  });
  setTimeout(cleanup, 4500);
}

function runPlane(btn) {
  bump(btn);
  flyAcrossScreen("✈️", { message: "WISH YOU WERE HERE 💌", fromRight: Math.random() < 0.5 });
}

function runMic(btn) {
  bump(btn);
  showToast("YOUR TURN 🎤 — write today's caption");
}

function celebrate() {
  closePanel();
  if (mainBtn) {
    mainBtn.classList.remove("glam-celebrate");
    void mainBtn.offsetWidth;
    mainBtn.classList.add("glam-celebrate");
    const r = mainBtn.getBoundingClientRect();
    spawnFloating("💗", r.left + r.width / 2, r.top + r.height / 2, { count: 5, spread: 120, rise: 110, duration: 1200 });
    spawnFloating("✨", r.left + r.width / 2, r.top + r.height / 2, { count: 4, spread: 100, rise: 90, duration: 1000 });
  }
  showToast("GLAM WORLD: ACTIVATED 🎀");
  setTimeout(() => flyAcrossScreen("✈️", { fromRight: false, duration: 1800 }), 300);
  setTimeout(() => walkAcrossBottom("👠", "SHE'S FABULOUS."), 500);
  setTimeout(() => scatterKisses(6), 700);
}
