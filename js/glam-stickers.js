// The Glam Mode sticker dock: a small collapsible cluster of playful,
// interactive stickers that only appears when Glam Mode is the active
// theme. Each sticker has its own lightweight animation and picks from a
// pool of messages (never the same one twice in a row) so it stays fresh
// on repeat taps. Purely original hand-built vector artwork/names — no
// third-party branding, logos, or wordmarks.
import { showToast } from "./ui.js";
import { hapticFeedback } from "./db.js";

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
  {
    id: "sunglasses", run: runSunglasses,
    svg: `<svg viewBox="0 0 100 100"><path d="M28 35 C33 24 45 25 48 38 C51 25 63 24 68 35" stroke="#ff2f92" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M22 40 C10 40 8 55 15 62 C22 69 34 66 36 55 C38 46 30 40 22 40 Z" fill="#ff2f92"/><path d="M74 40 C86 40 88 55 81 62 C74 69 62 66 60 55 C58 46 66 40 74 40 Z" fill="#ff2f92"/></svg>`,
  },
  {
    id: "perfume", run: runPerfume,
    svg: `<svg viewBox="0 0 100 100"><rect x="40" y="8" width="20" height="14" rx="3" fill="#7a1054"/><rect x="46" y="2" width="8" height="8" rx="2" fill="#3a1a40"/><path d="M32 22 h36 l4 14 v50 a6 6 0 0 1-6 6 H34 a6 6 0 0 1-6-6 V36 Z" fill="#fff"/><path d="M36 40 h28 v40 a4 4 0 0 1-4 4 H40 a4 4 0 0 1-4-4 Z" fill="#ff6fc0"/></svg>`,
  },
  {
    id: "purse", run: runPurse,
    svg: `<svg viewBox="0 0 100 100"><path d="M32 40 C32 24 40 14 50 14 C60 14 68 24 68 40" stroke="#ff2f92" stroke-width="6" fill="none" stroke-linecap="round"/><rect x="18" y="40" width="64" height="46" rx="10" fill="#ff2f92"/><circle cx="50" cy="58" r="6" fill="#ffe3f0"/></svg>`,
  },
];

const MESSAGES = {
  boombox: ["The app suddenly has a soundtrack 🎶", "Turn it up, it's your scene.", "Main character playlist: loading.", "Every moment deserves a soundtrack.", "Vibe check: passed."],
  ticket: ["MAIN CHARACTER MOMENT", "PLOT TWIST INCOMING", "ROMANTICISE YOUR LIFE", "PINK ERA ACTIVATED", "TODAY'S FEATURE: YOU", "ADMIT ONE: YOUR OWN STORY"],
  lips: ["Kisses everywhere 💋", "Sealed with a kiss.", "Leaving your mark 💋", "Pucker up, main character.", "A little bit of glam, everywhere."],
  manicure: ["Fresh manicure, don't touch anything for 10 minutes", "Hands looking expensive today.", "Manifesting with these nails 💅", "Fresh set, fresh era.", "Ten out of ten, no notes."],
  headphones: ["Now playing: your main character soundtrack 🎧", "Tuning out the noise.", "In your own little world right now.", "Soundtrack: loading your best era.", "Headphones on, world off."],
  lollipop: ["YOU'RE DOING BETTER THAN YOU THINK.", "MAIN CHARACTER BEHAVIOUR DETECTED.", "A LITTLE MORE PINK NEVER HURT ANYONE.", "YOU FOUND A LITTLE MOMENT OF JOY.", "SWEET TREAT, SWEETER YOU."],
  clapper: ["AND... ACTION!", "SCENE ONE, TAKE ONE.", "THIS IS THE MOMENT.", "LIGHTS. CAMERA. YOU.", "CUT TO: SOMETHING GOOD."],
  call: ["Hey gorgeous — just calling to remind you your life is literally a movie.", "You have main character energy today.", "Your next adventure is waiting for you.", "Calling to say: you're doing amazing.", "Just checking in — you're glowing today."],
  plane: ["WISH YOU WERE HERE 💌", "NEXT STOP: SOMEWHERE MAGICAL.", "PACK LIGHT, DREAM BIG.", "JETTING OFF INTO A NEW CHAPTER.", "ADVENTURE MODE: ACTIVATED ✈️"],
  mic: ["YOUR TURN 🎤 — write today's caption", "Spotlight's on you.", "Say something worth remembering.", "Mic drop moment incoming.", "This page is your stage."],
  sunglasses: ["TOO ICONIC TO EXPLAIN 😎", "Too cool to care.", "Main character sunglasses, activated.", "Certified icon behavior.", "Shady, in the best way."],
  perfume: ["SMELLS LIKE MAIN CHARACTER ENERGY", "A little spritz of confidence.", "Signature scent, signature era.", "Smells like a good decision.", "One spray, whole new mood."],
  purse: ["EVERYTHING SHE NEEDS, NOTHING SHE DOESN'T.", "IT MATCHES THE VIBE.", "GRAB IT AND GO.", "PACKED FOR WHATEVER TODAY BRINGS.", "ESSENTIALS ONLY, DARLING."],
  celebrate: ["GLAM WORLD: ACTIVATED 🎀"],
};

const lastMessage = {};
function pick(id) {
  const arr = MESSAGES[id];
  if (!arr || !arr.length) return "";
  if (arr.length === 1) return arr[0];
  let choice;
  do {
    choice = arr[Math.floor(Math.random() * arr.length)];
  } while (choice === lastMessage[id]);
  lastMessage[id] = choice;
  return choice;
}

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
  hapticFeedback(6);
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

// ---------------------------------------------------------------------
// Plane sticker: a hand-drawn jet gliding through drifting hand-drawn
// clouds on a gentle banked arc, instead of a flat emoji sliding by.
// ---------------------------------------------------------------------

const PLANE_SVG = `<svg viewBox="0 0 140 70" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 40 C 6 34 14 30 26 30 L58 30 L86 8 C 89 6 95 6 97 9 C 98.5 11 97.5 13.5 95 16 L76 32 L112 32 L124 22 C126 20 130 20 131 23 C 131.6 24.6 130.6 26.6 128 29 L118 38 L128 47 C 130.6 49.4 131.6 51.4 131 53 C 130 56 126 56 124 54 L112 44 L76 44 L95 60 C 97.5 62.5 98.5 65 97 67 C 95 70 89 70 86 68 L58 46 L26 46 C 14 46 6 42 6 40 Z" fill="#ff2f92"/>
  <path d="M26 30 L58 30 L76 44 L26 46 C18 45 12 42.5 8 40 C12 37.5 18 31 26 30 Z" fill="#ff6fc0" opacity="0.55"/>
  <circle cx="40" cy="38" r="3.4" fill="#fff" opacity="0.85"/>
  <circle cx="52" cy="38" r="3.4" fill="#fff" opacity="0.85"/>
</svg>`;

const CLOUD_SVG = `<svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 46 C6 46 2 32 14 27 C13 15 30 8 40 16 C46 6 66 6 70 18 C86 15 96 28 88 38 C96 40 96 50 86 50 L24 50 C21 50 20 48 20 46 Z" fill="#fff" opacity="0.9"/>
</svg>`;

function flyPlaneThroughClouds() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const fromRight = Math.random() < 0.5;
  const baseY = h * (0.16 + Math.random() * 0.32);

  const sky = document.createElement("div");
  sky.className = "glam-sky";
  document.body.appendChild(sky);

  // Drifting cloud backdrop, moving slower than the plane for parallax depth.
  const cloudCount = 4;
  for (let i = 0; i < cloudCount; i++) {
    const cloud = document.createElement("div");
    cloud.className = "glam-cloud";
    cloud.innerHTML = CLOUD_SVG;
    const cy = baseY + (Math.random() - 0.5) * h * 0.28;
    const scale = 0.6 + Math.random() * 0.9;
    cloud.style.top = cy + "px";
    cloud.style.opacity = 0.35 + Math.random() * 0.35;
    sky.appendChild(cloud);
    const startX = fromRight ? w + 80 : -140;
    const endX = fromRight ? -140 : w + 80;
    cloud.animate(
      [
        { transform: `translateX(${startX}px) scale(${scale})` },
        { transform: `translateX(${endX}px) scale(${scale})` },
      ],
      { duration: 3200 + Math.random() * 1400, easing: "linear", delay: i * 120 }
    ).onfinish = () => cloud.remove();
  }

  const plane = document.createElement("div");
  plane.className = "glam-plane";
  plane.innerHTML = PLANE_SVG;
  plane.style.top = baseY + "px";
  sky.appendChild(plane);

  // The artwork's nose points left by default, so flying rightward (not
  // fromRight) is the case that needs mirroring — not the other way round.
  const flip = fromRight ? "" : " scaleX(-1)";
  const startX = fromRight ? w + 60 : -100;
  const endX = fromRight ? -100 : w + 60;
  const p1 = fromRight ? w * 0.72 : w * 0.28;
  const p2 = w * 0.5;
  const p3 = fromRight ? w * 0.28 : w * 0.72;
  const bank = fromRight ? -1 : 1;
  const duration = 3000;

  const trailTimer = setInterval(() => {
    const r = plane.getBoundingClientRect();
    spawnFloating("✨", r.left + r.width / 2, r.top + r.height / 2, { count: 1, spread: 20, rise: 20, duration: 500 });
  }, 220);

  plane.animate(
    [
      { transform: `translate(${startX}px, 0px) rotate(0deg)${flip}`, offset: 0 },
      { transform: `translate(${p1}px, -34px) rotate(${5 * bank}deg)${flip}`, offset: 0.28 },
      { transform: `translate(${p2}px, 8px) rotate(${-4 * bank}deg)${flip}`, offset: 0.52 },
      { transform: `translate(${p3}px, -26px) rotate(${5 * bank}deg)${flip}`, offset: 0.76 },
      { transform: `translate(${endX}px, 0px) rotate(0deg)${flip}`, offset: 1 },
    ],
    { duration, easing: "ease-in-out" }
  ).onfinish = () => {
    clearInterval(trailTimer);
    sky.remove();
  };

  setTimeout(() => showToast(pick("plane")), duration * 0.35);
}

// ---------------------------------------------------------------------
// Individual sticker behaviors
// ---------------------------------------------------------------------

function runBoombox(btn) {
  bump(btn);
  const r = btn.getBoundingClientRect();
  spawnFloating("🎵", r.left + r.width / 2, r.top, { count: 3, spread: 70, rise: 80 });
  showToast(pick("boombox"));
}

function runTicket(btn) {
  bump(btn);
  showToast(pick("ticket"));
}

function runLips(btn) {
  bump(btn);
  scatterKisses();
  showToast(pick("lips"));
}

function runManicure(btn) {
  bump(btn);
  const r = btn.getBoundingClientRect();
  spawnFloating("💅", r.left + r.width / 2, r.top, { count: 4, spread: 60, rise: 70 });
  showToast(pick("manicure"));
}

function runHeadphones(btn) {
  bump(btn);
  showToast(pick("headphones"));
}

function runClapper(btn) {
  bump(btn);
  showToast(pick("clapper"));
}

function runLollipop(btn) {
  btn.classList.remove("glam-spin");
  void btn.offsetWidth;
  btn.classList.add("glam-spin");
  showToast(pick("lollipop"));
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
    showToast(pick("call"));
  });
  setTimeout(cleanup, 4500);
}

function runPlane(btn) {
  bump(btn);
  flyPlaneThroughClouds();
}

function runMic(btn) {
  bump(btn);
  showToast(pick("mic"));
}

function runSunglasses(btn) {
  bump(btn);
  showToast(pick("sunglasses"));
}

function runPerfume(btn) {
  bump(btn);
  const r = btn.getBoundingClientRect();
  spawnFloating("✨", r.left + r.width / 2, r.top, { count: 5, spread: 50, rise: 60 });
  showToast(pick("perfume"));
}

function runPurse(btn) {
  bump(btn);
  showToast(pick("purse"));
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
  showToast(pick("celebrate"));
  setTimeout(() => flyPlaneThroughClouds(), 300);
  setTimeout(() => scatterKisses(6), 700);
}
