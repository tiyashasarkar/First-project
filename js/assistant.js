// Blossom's built-in redesign assistant — a friendly puppy that lives on
// every screen and can restyle whatever journal page is currently open.
// This is a rule-based command interpreter, not a connected LLM: doing
// real open-ended AI chat safely would mean either shipping a secret API
// key inside this public static site (anyone could steal and abuse it)
// or standing up a paid backend, both of which conflict with the app's
// zero-cost, zero-server architecture. Instead, this understands a wide
// vocabulary of redesign requests — colors, backgrounds, stickers, text,
// "surprise me" — and applies them straight to the open page.
import * as db from "./db.js";
import { openSheet, closeSheet, showToast, escapeHtml } from "./ui.js";
import { openEditor, isEditorOpen, assistantRedesign } from "./screens/editor.js";

const PALETTE_SYNONYMS = [
  ["midnight", ["midnight", "dark mode", "moody", "night", "black background"]],
  ["mono", ["mono", "black and white", "grayscale", "monochrome", "neutral"]],
  ["blush", ["blush", "hot pink", "magenta", "bright pink"]],
  ["rose", ["rose", "pink"]],
  ["gold", ["gold", "golden"]],
  ["sage", ["sage", "green", "olive", "nature"]],
  ["sky", ["sky", "blue"]],
  ["lilac", ["lilac", "lavender", "violet", "purple"]],
  ["butter", ["butter", "yellow", "cream"]],
  ["coral", ["coral", "orange", "peach"]],
];

const BACKGROUND_SYNONYMS = [
  ["dot", ["polka", "dotted", "dots", "dot"]],
  ["ruled", ["lined", "ruled", "notebook", "lines"]],
  ["whimsical", ["whimsical", "playful", "fancy"]],
  ["vintage", ["vintage", "retro", "antique", "aged", "old fashioned"]],
  ["grid", ["grid", "graph paper", "graph"]],
  ["blank", ["blank", "plain", "empty", "clean", "simple", "no pattern"]],
];

const STICKER_SYNONYMS = [
  ["💗", ["heart", "hearts", "love"]],
  ["⭐", ["star", "stars"]],
  ["🌸", ["flower", "flowers", "floral", "bloom", "blossom"]],
  ["🎀", ["bow", "ribbon", "bows"]],
  ["👑", ["crown", "princess", "queen"]],
  ["🦋", ["butterfly", "butterflies"]],
  ["✨", ["sparkle", "sparkles", "glitter", "shine", "shimmer"]],
  ["🍒", ["cherry", "cherries"]],
  ["🍓", ["strawberry", "strawberries"]],
  ["🌷", ["tulip", "tulips"]],
  ["🧁", ["cupcake", "cupcakes"]],
  ["🦢", ["swan", "swans"]],
];

const GREETING_RE = /^\s*(hi|hello|hey|yo|hiya|howdy)\b/i;
const THANKS_RE = /\b(thanks|thank you|thx|ty)\b/i;
const HELP_RE = /\b(help|what can you do|how does this work)\b/i;
const SURPRISE_RE = /\b(surprise me|redesign|restyle|shuffle|randomize|make it better|glow ?up)\b/i;
const TEXT_RE = /(?:saying|that says|write)\s+["“]?(.+?)["”]?[.!]?\s*$/i;

function findMatch(text, table) {
  const hits = [];
  for (const [id, words] of table) {
    if (words.some((w) => text.includes(w))) hits.push(id);
  }
  return hits;
}

function interpret(rawText) {
  const text = rawText.toLowerCase().trim();
  if (!text) return { actions: [], reply: "Ruff? Tell me what you'd like your page to look like! 🐾" };

  if (GREETING_RE.test(text) && text.length < 20) {
    return { actions: [], reply: "Ruff ruff! 🐶 I'm your redesign pup — tell me a mood, color, or thing to add and I'll restyle your page!" };
  }
  if (THANKS_RE.test(text)) {
    return { actions: [], reply: "Ruff! Anytime — happy to help make your page cute. 🐾" };
  }
  if (HELP_RE.test(text)) {
    return {
      actions: [],
      reply: "I can restyle whatever page you're editing! Try things like:\n• \"make it pink and dotted\"\n• \"add hearts and a bow\"\n• \"vintage vibes\"\n• \"surprise me\"\n• \"write happy birthday\"",
    };
  }

  const actions = [];
  const said = [];

  if (SURPRISE_RE.test(text)) {
    actions.push({ type: "surprise" });
    said.push("gave it a whole new surprise look");
  }

  const palettes = findMatch(text, PALETTE_SYNONYMS);
  const backgrounds = findMatch(text, BACKGROUND_SYNONYMS);
  if (palettes.length || backgrounds.length) {
    actions.push({ type: "background", paletteId: palettes[0], style: backgrounds[0] });
    const bits = [];
    if (palettes[0]) bits.push(palettes[0] + "-toned");
    if (backgrounds[0]) bits.push(backgrounds[0] + " background");
    said.push("set a " + bits.join(", "));
  }

  const stickers = findMatch(text, STICKER_SYNONYMS);
  stickers.forEach((emoji) => actions.push({ type: "sticker", emoji }));
  if (stickers.length) said.push(`added ${stickers.join(" ")}`);

  const textMatch = rawText.match(TEXT_RE);
  if (textMatch && textMatch[1].trim()) {
    actions.push({ type: "text", text: textMatch[1].trim() });
    said.push(`wrote "${textMatch[1].trim()}" on the page`);
  }

  if (!actions.length) {
    return {
      actions: [],
      reply: "Hmm, I didn't quite catch a style in that — try a color (\"make it lilac\"), a pattern (\"lined paper\"), something to add (\"add a crown\"), or just say \"surprise me\"! 🐾",
    };
  }

  return { actions, reply: "Ruff ruff! I " + said.join(" and ") + ". Take a peek! 🐶" };
}

const PUPPY_SVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 30 C8 22 4 8 12 6 C22 4 28 22 30 32 Z" fill="#e8b88a"/>
  <path d="M80 30 C92 22 96 8 88 6 C78 4 72 22 70 32 Z" fill="#e8b88a"/>
  <ellipse cx="50" cy="55" rx="34" ry="30" fill="#f6d3a8"/>
  <ellipse cx="34" cy="60" rx="8" ry="6" fill="#f7c9b8" opacity="0.8"/>
  <ellipse cx="66" cy="60" rx="8" ry="6" fill="#f7c9b8" opacity="0.8"/>
  <circle cx="38" cy="50" r="4.5" fill="#4a3b42"/>
  <circle cx="62" cy="50" r="4.5" fill="#4a3b42"/>
  <circle cx="39.5" cy="48.5" r="1.4" fill="#fff"/>
  <circle cx="63.5" cy="48.5" r="1.4" fill="#fff"/>
  <ellipse cx="50" cy="62" rx="6" ry="4.5" fill="#4a3b42"/>
  <path d="M50 66 Q50 72 44 73" stroke="#4a3b42" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path d="M50 66 Q50 72 56 73" stroke="#4a3b42" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path d="M40 74 Q50 80 60 74" stroke="#4a3b42" stroke-width="2.2" fill="none" stroke-linecap="round"/>
</svg>`;

let root = null;
let barkTimer = null;
let open = false;
const history = [];

export function mountAssistant() {
  if (root) return;
  root = document.createElement("div");
  root.id = "pup-widget";
  root.innerHTML = `
    <div class="pup-bubble" id="pup-bubble">Ruff ruff! 🐾</div>
    <button class="pup-btn" id="pup-btn" aria-label="Redesign assistant">${PUPPY_SVG}</button>
  `;
  document.body.appendChild(root);
  document.getElementById("pup-btn").addEventListener("click", openAssistantChat);
  scheduleBark();
}

export function unmountAssistant() {
  clearTimeout(barkTimer);
  if (root) {
    root.remove();
    root = null;
  }
}

function scheduleBark() {
  clearTimeout(barkTimer);
  barkTimer = setTimeout(() => {
    if (root && !open) {
      const btn = document.getElementById("pup-btn");
      const bubble = document.getElementById("pup-bubble");
      btn?.classList.remove("pup-wiggle");
      void btn?.offsetWidth;
      btn?.classList.add("pup-wiggle");
      bubble?.classList.add("show");
      setTimeout(() => bubble?.classList.remove("show"), 2200);
    }
    scheduleBark();
  }, 9000 + Math.random() * 6000);
}

function bubbleHtml(entry) {
  const cls = entry.from === "user" ? "pup-msg pup-msg-user" : "pup-msg pup-msg-pup";
  return `<div class="${cls}">${escapeHtml(entry.text).replace(/\n/g, "<br>")}</div>`;
}

function openAssistantChat() {
  open = true;
  document.getElementById("pup-bubble")?.classList.remove("show");

  if (!history.length) {
    history.push({ from: "pup", text: "Ruff! I'm your redesign pup 🐶 Tell me how you want this page to look — colors, patterns, stickers, whatever you're feeling!" });
  }

  openSheet({
    title: "🐾 Redesign Pup",
    html: `
      <div class="pup-chat" id="pup-chat">${history.map(bubbleHtml).join("")}</div>
      <div class="pup-suggestions" id="pup-suggestions">
        <button data-q="surprise me">🎲 Surprise me</button>
        <button data-q="make it pink and dotted">🌸 Make it pink</button>
        <button data-q="add hearts and a bow">💗 Add hearts</button>
        <button data-q="vintage vibes">🕰️ Vintage vibes</button>
      </div>
      <div class="pup-input-row">
        <input type="text" id="pup-input" placeholder="Tell me what you want..." maxlength="140" />
        <button class="pup-send" id="pup-send" aria-label="Send"><svg viewBox="0 0 24 24"><path d="M4 12l16-8-6 8 6 8z"/></svg></button>
      </div>
    `,
    onClose: () => { open = false; scheduleBark(); },
  });

  const chatEl = document.getElementById("pup-chat");
  chatEl.scrollTop = chatEl.scrollHeight;

  const input = document.getElementById("pup-input");
  const send = () => handleSend(input.value);
  document.getElementById("pup-send").addEventListener("click", send);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
  document.querySelectorAll("#pup-suggestions button").forEach((btn) => {
    btn.addEventListener("click", () => handleSend(btn.dataset.q));
  });
  setTimeout(() => input.focus(), 300);
}

function appendMessage(entry) {
  history.push(entry);
  const chatEl = document.getElementById("pup-chat");
  if (!chatEl) return;
  chatEl.insertAdjacentHTML("beforeend", bubbleHtml(entry));
  chatEl.scrollTop = chatEl.scrollHeight;
}

async function handleSend(rawText) {
  const text = (rawText || "").trim();
  if (!text) return;
  const input = document.getElementById("pup-input");
  if (input) input.value = "";
  appendMessage({ from: "user", text });

  const { actions, reply } = interpret(text);
  appendMessage({ from: "pup", text: reply });
  db.hapticFeedback(6);

  if (!actions.length) return;

  if (isEditorOpen()) {
    actions.forEach((a) => assistantRedesign(a));
    return;
  }

  appendMessage({ from: "pup", text: "Let me pull up your latest page… 🐾" });
  const pages = await db.getAllPagesSorted();
  if (!pages.length) {
    appendMessage({ from: "pup", text: "Looks like you don't have a page yet — create one first, then come find me! 🐶" });
    return;
  }
  closeSheet();
  await openEditor({ pageId: pages[0].id });
  setTimeout(() => {
    actions.forEach((a) => assistantRedesign(a));
    showToast("Ruff! Your page got a makeover 🐾");
  }, 350);
}
