import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import * as db from "./db.js";
import * as legacyDb from "./legacy-local-db.js";
import { auth, isFirebaseConfigured } from "./firebase.js";
import { showToast, openSheet, closeSheet } from "./ui.js";
import { getTheme, applyTheme, resetThemeColorMeta } from "./theme.js";
import { renderAuth } from "./screens/auth.js";
import { renderCover } from "./screens/cover.js";
import { renderModePicker } from "./screens/mode-picker.js";
import { renderHome } from "./screens/home.js";
import { renderJournals, renderJournalDetail } from "./screens/journals.js";
import { renderMemories } from "./screens/memories.js";
import { renderProfile } from "./screens/profile.js";
import { openCreateFlow } from "./screens/create.js";
import { closeEditor } from "./screens/editor.js";
import { mountMascot, unmountMascot, setMascotVisible } from "./mascot.js";
import { mountAssistant, unmountAssistant } from "./assistant.js";

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

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// journal-detail is the one real "drill down" in this app's flat nav, so
// it gets a directional slide; everything else (tab switches) gets a
// gentle cross-fade instead of an arbitrary sideways slide.
function transitionKind(fromName, toName) {
  if (toName === "journal-detail") return "forward";
  if (fromName === "journal-detail" && toName !== "journal-detail") return "back";
  return "fade";
}

function animateScreenTransition(fromEl, toEl, kind) {
  if (kind === "forward" || kind === "back") {
    const inClass = kind === "forward" ? "screen-enter-from-right" : "screen-enter-from-left";
    const outClass = kind === "forward" ? "screen-exit-to-left" : "screen-exit-to-right";
    toEl.classList.add("active", inClass);
    void toEl.offsetWidth;
    fromEl.classList.add(outClass);
    toEl.classList.remove(inClass);
    const cleanup = () => { fromEl.classList.remove("active", outClass); fromEl.removeEventListener("transitionend", cleanup); };
    fromEl.addEventListener("transitionend", cleanup);
    setTimeout(cleanup, 400);
  } else {
    toEl.classList.add("active", "screen-fade-enter");
    void toEl.offsetWidth;
    fromEl.classList.add("screen-fade-exit");
    toEl.classList.remove("screen-fade-enter");
    const cleanup = () => { fromEl.classList.remove("active", "screen-fade-exit"); fromEl.removeEventListener("transitionend", cleanup); };
    fromEl.addEventListener("transitionend", cleanup);
    setTimeout(cleanup, 350);
  }
}

export async function navigate(name, params = {}) {
  if (state.currentScreen === "editor" && name !== "editor") {
    closeEditor();
  }
  // Editor and reader bypass this router while open (their own full-screen
  // takeover), so make sure they're always cleanly hidden regardless of
  // which transition (if any) runs below.
  document.getElementById("screen-editor").classList.remove("active");
  document.getElementById("screen-reader").classList.remove("active");

  const prevName = state.currentScreen;
  const prevScreen = screens[prevName];
  const prevEl = prevScreen ? document.getElementById(prevScreen.el) : null;
  state.currentScreen = name;
  const target = screens[name];
  const targetEl = document.getElementById(target.el);

  const nav = document.getElementById("bottom-nav");
  nav.style.display = name === "editor" ? "none" : "flex";
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.nav === target.nav));
  setMascotVisible(name !== "editor");

  if (name === "home") await renderHome(document.getElementById("home-scroll"));
  else if (name === "journals") await renderJournals(document.getElementById("journals-scroll"));
  else if (name === "journal-detail") {
    state.currentJournalId = params.journalId;
    await renderJournalDetail(document.getElementById("journal-detail-scroll"), params.journalId);
  } else if (name === "memories") await renderMemories(document.getElementById("memories-scroll"));
  else if (name === "profile") await renderProfile(document.getElementById("profile-scroll"));

  if (prevEl && prevEl !== targetEl && !prefersReducedMotion()) {
    animateScreenTransition(prevEl, targetEl, transitionKind(prevName, name));
  } else {
    Object.values(screens).forEach((s) => document.getElementById(s.el).classList.remove("active"));
    targetEl.classList.add("active");
  }
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

async function pickModeIfNeeded() {
  // Shows every time the app is opened, not just the first time ever —
  // picking today's theme is meant to be a little daily ritual, not a
  // one-time setup step.
  const chosen = await getTheme();
  const picker = document.getElementById("mode-picker");
  await new Promise((resolve) => {
    renderModePicker(picker, chosen, () => {
      picker.classList.remove("active");
      resolve();
    });
    picker.classList.add("active");
  });
}

async function showSignedInApp() {
  document.getElementById("auth-screen").classList.remove("active");
  // Mode picker first, before anything that waits on the network (the
  // local-data migration check queries Firestore) -- otherwise there's a
  // gap with nothing shown yet but the raw page background, which flashes
  // whatever color the last-chosen theme left behind instead of staying
  // on the fixed baby-yellow look this pre-Home moment is supposed to have.
  await pickModeIfNeeded();
  await offerLocalDataMigrationIfNeeded();
  await seedIfEmpty();
  await runOnboardingIfNeeded();
  await navigate("home");
  mountMascot();
  mountAssistant();
}

async function showSignedOut() {
  unmountMascot();
  unmountAssistant();
  resetThemeColorMeta();
  document.getElementById("onboarding").classList.remove("active");
  const authScreen = document.getElementById("auth-screen");
  renderAuth(authScreen);
  authScreen.classList.add("active");
}

// The journal cover is the true landing screen: it's shown immediately and
// stays up until the visitor physically "opens" it. What appears once it
// opens (sign-in, or straight to the theme page for a returning visitor)
// depends on the auth check, which runs in the background at the same
// time — so opening the cover never has to wait on a slow connection, and
// a slow cover-open never blocks the auth check either. Whichever finishes
// second is the one that actually reveals the next screen.
let authUser = undefined; // undefined = not resolved yet
let coverOpened = false;
let revealed = false;

function tryReveal() {
  if (revealed || authUser === undefined || !coverOpened) return;
  revealed = true;
  document.getElementById("cover-screen").classList.add("hidden");
  if (authUser) showSignedInApp();
  else showSignedOut();
}

async function init() {
  // Apply any previously-chosen theme immediately, before anything else
  // renders, so there's no flash of the default palette.
  const savedTheme = await getTheme();
  if (savedTheme) applyTheme(savedTheme);

  if (!isFirebaseConfigured) {
    document.getElementById("cover-screen").classList.add("hidden");
    document.getElementById("setup-needed").classList.add("active");
    return;
  }

  wireNav();
  registerServiceWorker();

  renderCover(document.getElementById("cover-screen"), () => {
    coverOpened = true;
    tryReveal();
  });

  onAuthStateChanged(auth, async (user) => {
    await waitAtLeast(150);
    authUser = user;
    tryReveal();
  });
}

init();
