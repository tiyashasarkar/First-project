// The Glam Mode sticker dock: a small collapsible cluster of playful,
// interactive stickers that only appears when Glam Mode is the active
// theme. Each sticker has its own lightweight animation + message.
// Purely original artwork/names — no third-party branding.
import { showToast } from "./ui.js";

const STICKERS = [
  { id: "boombox", emoji: "📻", run: runBoombox },
  { id: "ticket", emoji: "🎫", run: runTicket },
  { id: "lips", emoji: "💋", run: runLips },
  { id: "heels", emoji: "👠", run: runHeels },
  { id: "lollipop", emoji: "🍭", run: runLollipop },
  { id: "phone", emoji: "☎️", run: runPhone },
  { id: "plane", emoji: "✈️", run: runPlane },
  { id: "mic", emoji: "🎤", run: runMic },
];

const TICKET_MESSAGES = ["MAIN CHARACTER MOMENT", "PLOT TWIST INCOMING", "ROMANTICISE YOUR LIFE", "PINK ERA ACTIVATED", "TODAY'S FEATURE: YOU"];
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
      ${STICKERS.map((s) => `<button class="glam-sticker" data-id="${s.id}" aria-label="${s.id}">${s.emoji}</button>`).join("")}
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

function travelDiagonal(emoji) {
  const el = document.createElement("div");
  el.className = "glam-flyover";
  el.textContent = emoji;
  const startX = window.innerWidth * (0.1 + Math.random() * 0.2);
  const startY = window.innerHeight * (0.25 + Math.random() * 0.15);
  el.style.left = startX + "px";
  el.style.top = startY + "px";
  document.body.appendChild(el);
  const dx = window.innerWidth * 0.65;
  const dy = window.innerHeight * 0.45;
  const anim = el.animate(
    [
      { transform: "translate(0,0) rotate(-12deg)", opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) rotate(8deg)`, opacity: 0 },
    ],
    { duration: 1300, easing: "ease-in" }
  );
  const sparkleTimer = setInterval(() => {
    spawnFloating("✨", startX + Math.random() * dx, startY + Math.random() * dy, { count: 1, rise: 10, spread: 10, duration: 500 });
  }, 90);
  anim.onfinish = () => { clearInterval(sparkleTimer); el.remove(); };
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

function runLips(btn) {
  bump(btn);
  travelDiagonal("💋");
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
  setTimeout(() => travelDiagonal("💋"), 700);
}
