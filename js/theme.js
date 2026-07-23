// Applies/persists the app's color theme. A device-level preference (not
// synced to the account) — same pattern as the onboarding-seen flag.
import * as db from "./db.js";

// Each theme's `image` is what shows in its round icon everywhere a theme
// is listed (the post-login picker, Profile's "Theme" row, and Profile's
// theme-switcher sheet). Leave it null to fall back to `emoji`, or set it
// to any image path/URL (e.g. "icons/themes/glam.jpg") to use a picture
// instead — no other code needs to change.
export const THEMES = [
  { id: "blossom", label: "MINIONS", tagline: "soft & sweet", emoji: "🌸", image: "https://share.google/YAvoTW4g6jkiZ7VUO, swatches: ["#f6c9d8", "#fbe4ec", "#d98fac"]" },
  { id: "glam", label: "BARBIE", tagline: "bright & bold", emoji: "💗", image: "https://share.google/vDCYTcUoiZV0LXuuc, swatches: ["#f70071", "#ff5aa4", "#ffc0dc"]" },
  { id: "midnight", label: "BATMAN", tagline: "dark & dramatic", emoji: "🦇", image:'https://share.google/wVvS4QeOZ0v6MiEe5 , swatches: ["#0f1226", "#232a4d", "#d9a54e"]' },
];

export function applyTheme(themeId, { animate = false } = {}) {
  if (animate) playThemeTransition(themeId);
  if (themeId === "blossom") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", themeId);
  }
}

function playThemeTransition(themeId) {
  const root = document.documentElement;
  root.classList.add("theme-transitioning");
  setTimeout(() => root.classList.remove("theme-transitioning"), 450);

  if (themeId === "glam") {
    const flash = document.createElement("div");
    flash.className = "glam-transition-flash";
    flash.innerHTML = `
      <svg viewBox="0 0 100 100"><g fill="#fff">
        <circle cx="53" cy="57" r="30"/>
        <circle cx="32" cy="25" r="18"/>
        <path d="M15 26 Q32 18 51 27 Q40 52 28 62 Q18 46 15 26 Z"/>
      </g></svg>
    `;
    document.body.appendChild(flash);
    requestAnimationFrame(() => flash.classList.add("show"));
    setTimeout(() => flash.classList.remove("show"), 500);
    setTimeout(() => flash.remove(), 850);
  }
}

export async function getTheme() {
  return db.kvGet("theme", null);
}

export async function setTheme(themeId) {
  await db.kvSet("theme", themeId);
  applyTheme(themeId, { animate: true });
}
