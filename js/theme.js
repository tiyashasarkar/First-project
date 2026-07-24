// Applies/persists the app's color theme. A device-level preference (not
// synced to the account) — same pattern as the onboarding-seen flag.
import * as db from "./db.js";

// Each theme's `image` is what shows in its round icon everywhere a theme
// is listed (the post-login picker, Profile's "Theme" row, and Profile's
// theme-switcher sheet). Leave it null to fall back to `emoji`, or set it
// to any image path/URL (e.g. "icons/themes/glam.jpg") to use a picture
// instead — no other code needs to change.
export const THEMES = [
  { id: "blossom", label: "MINION", tagline: "soft & sweet", emoji: "🌸", image:"icons/bob.png", swatches: ["#f6c9d8", "#fbe4ec", "#d98fac"] },
  { id: "glam", label: "BARBIE", tagline: "bright & bold", emoji: "💗", image:"icons/barbie.png", swatches: ["#f70071", "#ff5aa4", "#ffc0dc"] },
  { id: "midnight", label: "BATMAN", tagline: "dark & dramatic", emoji: "🦇", image:"icons/batman.jpg", swatches: ["#0f1226", "#232a4d", "#d9a54e"] },
];

export function applyTheme(themeId, { animate = false } = {}) {
  if (animate) playThemeTransition(themeId);
  if (themeId === "blossom") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", themeId);
  }
}

// The browser's own chrome (Safari's address bar / bottom toolbar) is
// tinted from the <meta name="theme-color"> tag, not from any CSS on the
// page. It's fixed to a cream color everywhere before the app proper is
// showing (cover, sign-in, the theme picker itself) so it never clashes --
// but once a theme is actually chosen and Home appears, that same fixed
// cream reads as a mismatched gold bar sitting above a pink/dark page. Only
// here, at the moment a theme is committed to, do we hand the chrome color
// over to match it.
const CREAM_CHROME = "#fdf3da";
const THEME_CHROME = {
  blossom: "#fdf1f4",
  glam: "#fff0f8",
  midnight: "#14172c",
};

// iOS Safari is unreliable about re-reading a theme-color meta tag whose
// `content` attribute was just mutated in place -- it can keep tinting the
// chrome with whatever value it parsed at page load. Removing the old tag
// and inserting a brand-new one forces it to notice.
function setThemeColorMeta(color) {
  document.querySelectorAll('meta[name="theme-color"]').forEach((el) => el.remove());
  const meta = document.createElement("meta");
  meta.setAttribute("name", "theme-color");
  meta.setAttribute("content", color);
  document.head.appendChild(meta);
}

export function syncThemeColorMeta(themeId) {
  setThemeColorMeta(THEME_CHROME[themeId] || CREAM_CHROME);
}

export function resetThemeColorMeta() {
  setThemeColorMeta(CREAM_CHROME);
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
  syncThemeColorMeta(themeId);
}
