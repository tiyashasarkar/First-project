import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import * as db from "./db.js";
import * as legacyDb from "./legacy-local-db.js";
import { auth, isFirebaseConfigured } from "./firebase.js";
import { showToast, openSheet, closeSheet } from "./ui.js";
import { renderAuth } from "./screens/auth.js";
import { renderHome } from "./screens/home.js";
import { renderJournals, renderJournalDetail } from "./screens/journals.js";
import { renderMemories } from "./screens/memories.js";
import { renderProfile } from "./screens/profile.js";
import { openCreateFlow } from "./screens/create.js";
import { closeEditor } from "./screens/editor.js";

// This module loading at all means every import above (including the
// Firebase SDK) resolved successfully — cancel the connection-trouble
// watchdog set in index.html.
clearTimeout(window.__blossomWatchdog);

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
window.blossomSignOut = () => signOut(auth);

function wireNav() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => navigate(btn.dataset.nav));
  });
  document.getElementById("nav-create").addEventListener("click", () => openCreateFlow());
}

async function runOnboardingIfNeeded() {
  const seen = await db.kvGet("onboarded", false);
  const onboarding = document.getElementById("onboarding");
  if (seen) return;

  return new Promise((resolve) => {
    const dotsWrap = document.getElementById("ob-dots");
    const slidesWrap = document.getElementById("ob-slides");
    const slideCount = document.querySelectorAll(".ob-slide").length;
    dotsWrap.innerHTML = Array.from({ length: slideCount }, (_, i) => `<span class="${i === 0 ? "on" : ""}"></span>`).join("");

    slidesWrap.addEventListener("scroll", () => {
      const idx = Math.round(slidesWrap.scrollLeft / slidesWrap.clientWidth);
      dotsWrap.querySelectorAll("span").forEach((d, i) => d.classList.toggle("on", i === idx));
      document.getElementById("ob-continue").textContent = idx === slideCount - 1 ? "Get started" : "Skip";
    });

    document.getElementById("ob-continue").onclick = async () => {
      const idx = Math.round(slidesWrap.scrollLeft / slidesWrap.clientWidth);
      if (idx < slideCount - 1) {
        slidesWrap.scrollTo({ left: slidesWrap.clientWidth * (slideCount - 1), behavior: "smooth" });
        return;
      }
      await db.kvSet("onboarded", true);
      onboarding.classList.remove("active");
      resolve();
    };

    onboarding.classList.add("active");
  });
}

async function offerLocalDataMigrationIfNeeded() {
  try {
    const [cloudJournals, hasLegacy] = await Promise.all([db.getAll("journals"), legacyDb.hasAnyData()]);
    if (cloudJournals.length > 0 || !hasLegacy) return;

    await new Promise((resolve) => {
      openSheet({
        title: "Bring your memories along?",
        html: `
          <p style="color:var(--ink-soft);font-size:14px;line-height:1.6;margin-bottom:20px;">
            We found journals saved on this device from before you signed in. Want to move them into your account so they sync everywhere?
          </p>
          <button class="btn btn-primary btn-block" id="mig-yes" style="margin-bottom:10px;">Yes, bring them along</button>
          <button class="btn btn-secondary btn-block" id="mig-no">Skip</button>
        `,
        onClose: resolve,
      });
      document.getElementById("mig-yes").addEventListener("click", async () => {
        closeSheet();
        showToast("Moving your memories in… 🌸");
        try {
          const data = await legacyDb.exportAllData();
          await db.importAllData(data);
          showToast("Your memories are safely in your account 💗");
        } catch {
          showToast("That didn't quite work — you can back up and restore manually from Profile.");
        }
        resolve();
      });
      document.getElementById("mig-no").addEventListener("click", () => {
        closeSheet();
        resolve();
      });
    });
  } catch {
    // no legacy database in this browser — nothing to offer
  }
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

function waitAtLeast(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function showSignedInApp() {
  document.getElementById("auth-screen").classList.remove("active");
  document.getElementById("splash").classList.add("hidden");
  await offerLocalDataMigrationIfNeeded();
  await seedIfEmpty();
  await runOnboardingIfNeeded();
  await navigate("home");
}

async function showSignedOut() {
  document.getElementById("splash").classList.add("hidden");
  document.getElementById("onboarding").classList.remove("active");
  const authScreen = document.getElementById("auth-screen");
  renderAuth(authScreen);
  authScreen.classList.add("active");
}

async function init() {
  if (!isFirebaseConfigured) {
    document.getElementById("splash").classList.add("hidden");
    document.getElementById("setup-needed").classList.add("active");
    return;
  }

  wireNav();
  registerServiceWorker();

  onAuthStateChanged(auth, async (user) => {
    await waitAtLeast(600);
    if (user) await showSignedInApp();
    else await showSignedOut();
  });
}

init();
