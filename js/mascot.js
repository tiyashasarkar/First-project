// A small floating, tappable mascot that matches the current theme —
// tap for a fun animation, double-tap to pick a different one.
import { getTheme } from "./theme.js";
import * as db from "./db.js";
import { openSheet, closeSheet } from "./ui.js";

const MASCOTS = {
  butterfly: { emoji: "🦋", anim: "flutter", label: "Butterfly" },
  flower: { emoji: "🌷", anim: "spin", label: "Tulip" },
  "bow-b": { emoji: "🎀", anim: "spin", label: "Bow" },
  sparkle: { emoji: "✨", anim: "pulse", label: "Sparkle" },
  "car-glam": { emoji: "🚘", anim: "zoom", label: "Convertible" },
  lipstick: { emoji: "💄", anim: "heart", label: "Lipstick" },
  purse: { emoji: "👛", anim: "pulse", label: "Purse" },
  "bow-g": { emoji: "🎀", anim: "spin", label: "Bow" },
  bat: { emoji: "🦇", anim: "flutter", label: "Bat" },
  "car-midnight": { emoji: "🚗", anim: "zoom", label: "Sports car" },
  moon: { emoji: "🌙", anim: "pulse", label: "Moon" },
  bolt: { emoji: "⚡", anim: "pulse", label: "Bolt" },
};

const SETS = {
  blossom: { default: "butterfly", options: ["butterfly", "flower", "bow-b", "sparkle"] },
  glam: { default: "car-glam", options: ["car-glam", "lipstick", "purse", "bow-g", "sparkle"] },
  midnight: { default: "bat", options: ["bat", "car-midnight", "moon", "bolt"] },
};

const ANIM_CLASSES = ["mascot-zoom", "mascot-flutter", "mascot-spin", "mascot-pulse", "mascot-heart"];
const ANIM_CLASS_BY_TYPE = { zoom: "mascot-zoom", flutter: "mascot-flutter", spin: "mascot-spin", pulse: "mascot-pulse", heart: "mascot-heart" };

let el = null;
let currentId = null;
let currentTheme = "blossom";
let lastTap = 0;
let tapTimer = null;

export async function mountMascot() {
  unmountMascot();
  currentTheme = (await getTheme()) || "blossom";
  const set = SETS[currentTheme] || SETS.blossom;
  currentId = (await db.kvGet(`mascot_${currentTheme}`, null)) || set.default;

  el = document.createElement("button");
  el.id = "mascot-widget";
  el.setAttribute("aria-label", "Mascot — tap for fun, double-tap to change");
  document.body.appendChild(el);
  paint();

  el.addEventListener("pointerup", handleTap);
}

export function unmountMascot() {
  clearTimeout(tapTimer);
  tapTimer = null;
  if (el) {
    el.removeEventListener("pointerup", handleTap);
    el.remove();
    el = null;
  }
}

export function setMascotVisible(visible) {
  if (el) el.style.display = visible ? "flex" : "none";
}

function handleTap() {
  const now = Date.now();
  if (now - lastTap < 350) {
    // second tap of a double-tap: cancel the pending single-tap animation
    // (fixed a bug where it used to fire anyway right after the picker opened)
    clearTimeout(tapTimer);
    tapTimer = null;
    lastTap = 0;
    openPicker();
  } else {
    lastTap = now;
    tapTimer = setTimeout(() => {
      tapTimer = null;
      playAnimation();
    }, 320);
  }
}

function paint() {
  el.textContent = MASCOTS[currentId].emoji;
}

function playAnimation() {
  const anim = MASCOTS[currentId].anim;
  el.classList.remove(...ANIM_CLASSES);
  void el.offsetWidth; // restart animation if tapped again mid-animation
  el.classList.add(ANIM_CLASS_BY_TYPE[anim]);
  if (anim === "heart") spawnHeart();
}

function spawnHeart() {
  const heart = document.createElement("div");
  heart.className = "mascot-heart-particle";
  heart.textContent = "💗";
  el.appendChild(heart);
  setTimeout(() => heart.remove(), 900);
}

function openPicker() {
  const set = SETS[currentTheme] || SETS.blossom;
  openSheet({
    title: "Pick your mascot",
    html: `<div class="signature-grid" id="mascot-grid"></div>`,
  });
  const grid = document.getElementById("mascot-grid");
  set.options.forEach((id) => {
    const b = document.createElement("button");
    b.style.fontSize = "30px";
    b.textContent = MASCOTS[id].emoji;
    b.addEventListener("click", async () => {
      currentId = id;
      await db.kvSet(`mascot_${currentTheme}`, id);
      paint();
      closeSheet();
    });
    grid.appendChild(b);
  });
}
