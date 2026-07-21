import * as db from "./db.js";
import { showToast } from "./ui.js";
import { renderHome } from "./screens/home.js";
import { renderJournals, renderJournalDetail } from "./screens/journals.js";
import { renderMemories } from "./screens/memories.js";
import { renderProfile } from "./screens/profile.js";
import { openCreateFlow } from "./screens/create.js";
import { closeEditor } from "./screens/editor.js";

export const state = {
  currentScreen: "home",
  currentJournalId: null,
  mediaUrlCache: new Map(),
};

const screens = {
  home: { el: "screen-home", nav: "home" },
  journals: { el: "screen-journals", nav: "journals" },
  "journal-detail": { el: "screen-journal-detail", nav: "journals" },
  memories: { el: "screen-memories", nav: "memories" },
  profile: { el: "screen-profile", nav: "profile" },
  editor: { el: "screen-editor", nav: null },
};

export async function navigate(name, params = {}) {
  if (state.currentScreen === "editor" && name !== "editor") {
    closeEditor();
  }
  state.currentScreen = name;
  Object.values(screens).forEach((s) => document.getElementById(s.el).classList.remove("active"));
  const target = screens[name];
  document.getElementById(target.el).classList.add("active");

  const nav = document.getElementById("bottom-nav");
  nav.style.display = name === "editor" ? "none" : "flex";
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.nav === target.nav));

  if (name === "home") await renderHome(document.getElementById("home-scroll"));
  else if (name === "journals") await renderJournals(document.getElementById("journals-scroll"));
  else if (name === "journal-detail") {
    state.currentJournalId = params.journalId;
    await renderJournalDetail(document.getElementById("journal-detail-scroll"), params.journalId);
  } else if (name === "memories") await renderMemories(document.getElementById("memories-scroll"));
  else if (name === "profile") await renderProfile(document.getElementById("profile-scroll"));
}
window.blossomNavigate = navigate;

function wireNav() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => navigate(btn.dataset.nav));
  });
  document.getElementById("nav-create").addEventListener("click", () => openCreateFlow());
}

async function runOnboardingIfNeeded() {
  const seen = await db.kvGet("onboarded", false);
  const splash = document.getElementById("splash");
  const onboarding = document.getElementById("onboarding");

  if (seen) {
    setTimeout(() => splash.classList.add("hidden"), 650);
    return;
  }

  const dotsWrap = document.getElementById("ob-dots");
  const slidesWrap = document.getElementById("ob-slides");
  const slideCount = document.querySelectorAll(".ob-slide").length;
  dotsWrap.innerHTML = Array.from({ length: slideCount }, (_, i) => `<span class="${i === 0 ? "on" : ""}"></span>`).join("");

  slidesWrap.addEventListener("scroll", () => {
    const idx = Math.round(slidesWrap.scrollLeft / slidesWrap.clientWidth);
    dotsWrap.querySelectorAll("span").forEach((d, i) => d.classList.toggle("on", i === idx));
    document.getElementById("ob-continue").textContent = idx === slideCount - 1 ? "Get started" : "Skip";
  });

  document.getElementById("ob-continue").addEventListener("click", async () => {
    const idx = Math.round(slidesWrap.scrollLeft / slidesWrap.clientWidth);
    if (idx < slideCount - 1) {
      slidesWrap.scrollTo({ left: slidesWrap.clientWidth * (slideCount - 1), behavior: "smooth" });
      return;
    }
    await db.kvSet("onboarded", true);
    onboarding.classList.remove("active");
    splash.classList.add("hidden");
  });

  setTimeout(() => {
    splash.classList.add("hidden");
    onboarding.classList.add("active");
  }, 900);
}

async function seedIfEmpty() {
  const journals = await db.getAll("journals");
  if (journals.length > 0) return;
  await db.createJournal({ title: "Random Memories", description: "Little moments worth keeping.", template: "blank" });
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    });
  }
}

async function init() {
  wireNav();
  registerServiceWorker();
  await seedIfEmpty();
  await runOnboardingIfNeeded();
  await navigate("home");
}

init();
