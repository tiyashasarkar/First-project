// Applies/persists the app's color theme. A device-level preference (not
// synced to the account) — same pattern as the onboarding-seen flag.
import * as db from "./db.js";

export const THEMES = [
  { id: "blossom", label: "Blossom", tagline: "soft & sweet", emoji: "🌸", swatches: ["#f6c9d8", "#fbe4ec", "#d98fac"] },
  { id: "glam", label: "Glam Mode", tagline: "bright & bold", emoji: "💗", swatches: ["#ff4fa3", "#ffd9ea", "#ffcf6b"] },
  { id: "midnight", label: "Midnight Mode", tagline: "dark & dramatic", emoji: "🦇", swatches: ["#0f1226", "#232a4d", "#d9a54e"] },
];

export function applyTheme(themeId) {
  if (themeId === "blossom") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", themeId);
  }
}

export async function getTheme() {
  return db.kvGet("theme", null);
}

export async function setTheme(themeId) {
  await db.kvSet("theme", themeId);
  applyTheme(themeId);
}
