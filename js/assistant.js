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
const QUESTION_RE = /\?\s*$|^\s*(how|what|why|can|is|does|do|where|when|who|are)\b/i;

// A broad FAQ knowledge base so Pup Cup can answer real questions about
// the app, not just take redesign commands. Matched by keyword (plain
// substrings, like the redesign synonym tables above) rather than exact
// regex sentences, since real questions are phrased a hundred different
// ways — "how do I add a photo" / "add photo" / "add a picture" should
// all land the same answer.
const FAQ = [
  { keywords: ["who are you", "what's your name", "whats your name", "your name"], answer: "I'm Pup Cup! 🐶 I'm Once upon a Tuesday's built-in helper — I can redesign your pages and answer questions about the app." },
  { keywords: ["are you ai", "are you a real ai", "are you chatgpt", "are you claude", "real ai", "are you a robot", "are you a bot"], answer: "Honest answer: I'm not a connected AI model like ChatGPT — I'm a built-in helper that understands a wide range of phrases and app questions. That keeps Once upon a Tuesday completely free with nothing to set up! 🐾" },
  { keywords: ["what is this app", "what is blossom", "what does this app do", "what can this app do", "what does blossom do"], answer: "Once upon a Tuesday is your scrapbook photo journal 🌸 — create journals, fill pages with photos, stickers, text and music, then read them back like a real flip-book, notepad, scrapbook, or diary." },
  { keywords: ["new journal", "create a journal", "make a journal", "start a journal", "add a journal"], answer: "Tap the ➕ in the Journals tab, or the pink ➕ on the bottom nav, to start a new journal!" },
  { keywords: ["add a photo", "add photo", "add a picture", "add picture", "upload a photo", "upload photo", "insert a photo", "put a photo"], answer: "Open a page and tap the 📷 Photo button in the toolbar — you can drag, resize, and rotate it once it's on the page." },
  { keywords: ["add a sticker", "add sticker", "put a sticker", "sticker tab", "signature sticker", "emoji sticker"], answer: "Tap the ⭐ Sticker button on a page — you'll find Signature stickers, Emoji, and a Yours tab for your own uploaded images." },
  { keywords: ["washi tape", "add tape", "tape button"], answer: "Tap the 🎀 Tape button on a page to add washi tape strips in lots of colors — drag them anywhere and rotate to taste." },
  { keywords: ["add a calendar", "calendar item", "insert calendar", "calendar button"], answer: "Tap the 📅 Calendar button on a page — you can pick the month and choose from lots of calendar styles and colors." },
  { keywords: ["add text", "write on the page", "add a caption", "add words", "type on the page"], answer: "Tap the T (Text) button on a page, type what you want, and pick a font and color — or just tell me \"write ...\" and I'll add it for you!" },
  { keywords: ["change font", "different font", "font style", "my font", "the font", "change fonts"], answer: "Tap on any text you've added, then use the font picker that appears — there are 50 fonts to choose from, including handwritten styles." },
  { keywords: ["page style", "background style", "change background", "page background", "change the page color", "page color"], answer: "Open Curate (tap the page title, or find it in the sidebar on tablets/desktop) and look for \"Page style\" — dotted, lined, whimsical, vintage, grid, or a custom color." },
  { keywords: ["mood picker", "add a mood", "page mood"], answer: "In Curate, there's a Mood row with little emoji you can pick to capture how you were feeling that day." },
  { keywords: ["add tags", "add location", "page tags", "page location"], answer: "In Curate you'll find Location and Tags fields — totally optional, but nice for remembering where you were and what the day was about." },
  { keywords: ["change the theme", "glam mode", "midnight mode", "change my vibe", "change vibe", "dark mode", "switch theme"], answer: "Head to Profile → Theme to switch your look any time!" },
  { keywords: ["add music", "add spotify", "add a song", "spotify link", "play music", "background music", "add a spotify"], answer: "Open a page, tap the 🎵 music icon (or the page title on phones), and you can pick a vibe, upload a clip, or paste a Spotify link." },
  { keywords: ["spotify not working", "spotify isn't working", "spotify doesn't work", "spotify link not working"], answer: "If it says \"shortened link,\" open that link once in your browser first, then copy the full open.spotify.com address from the address bar and paste that instead — shortened spotify.link URLs can't be read directly." },
  { keywords: ["how do i read", "flip book", "flipbook", "notepad style", "scrapbook style", "diary style", "reading mode", "reading experience"], answer: "Open any journal and tap 📖 Read — pick between Flip Book, Notepad, Scrapbook, or Diary from the icon in the top right!" },
  { keywords: ["design a cover", "journal cover", "curate cover", "add a cover", "cover for my journal"], answer: "Open a journal and tap the \"🎨 Curate cover\" button on the banner — it opens the same page editor so you can design a cover." },
  { keywords: ["curate mean", "what is curate", "curate sidebar", "curate button", "what does curate do"], answer: "Curate is just what we call the page settings — title, date, mood, background, and music all live there. Tap the page title (or check the sidebar on bigger screens) to open it." },
  { keywords: ["favorite a journal", "favourite a journal", "add to favorites", "add to favourites"], answer: "Tap the heart icon on a journal's cover, or open its ⋯ menu and choose \"Add to favorites.\"" },
  { keywords: ["archive a journal", "archive journal", "how do i archive"], answer: "Open the journal's ⋯ menu and tap \"Archive journal\" — it'll be tucked away but not deleted." },
  { keywords: ["delete a journal", "delete journal", "remove a journal"], answer: "Open the journal's ⋯ menu and tap \"Delete journal\" — this permanently removes it and its pages, so it'll ask you to confirm first." },
  { keywords: ["rename a journal", "edit journal title", "change journal name", "rename journal"], answer: "Open the journal's ⋯ menu and tap \"Rename & edit\" to change its title or description." },
  { keywords: ["is my data private", "who can see my", "is this private", "is this public", "is blossom private"], answer: "Totally private — everything lives in your own account and is never shared or public. 🔒" },
  { keywords: ["what does the name mean", "why once upon a tuesday", "app name", "name of the app"], answer: "\"Once upon a Tuesday\" is just about how ordinary days are still worth keeping — ordinary Tuesdays turned into little story pages." },
  { keywords: ["how do i backup", "how do i back up", "backup my data", "backup my memories", "export my data", "download my data"], answer: "Go to Profile → Backup my memories to download everything as a file you keep safe." },
  { keywords: ["restore from backup", "import my data", "bring back my data", "restore my memories"], answer: "Go to Profile → Restore from backup and choose the backup file you saved earlier." },
  { keywords: ["sync across devices", "another device", "different phone", "same account", "multiple devices"], answer: "Yes! Sign in with the same email on any device and everything syncs automatically through your account." },
  { keywords: ["work offline", "no internet", "offline mode", "without internet"], answer: "Once upon a Tuesday is a PWA, so it opens instantly and works offline once installed — changes sync back up the next time you're online." },
  { keywords: ["add to home screen", "install the app", "install this app", "install blossom", "add to homescreen", "download the app", "get the app"], answer: "On iPhone: open this site in Safari, tap Share, then \"Add to Home Screen.\" On Android/desktop, your browser should offer an \"Install\" option." },
  { keywords: ["erase all data", "delete everything", "wipe my account", "erase my account"], answer: "Profile → Erase all data will permanently delete everything in your account — it'll ask you to confirm since that can't be undone." },
  { keywords: ["sign out", "log out", "logout"], answer: "Go to Profile → Sign out. You can always sign back in with the same email and password." },
  { keywords: ["turn off sound", "disable sound", "mute sound", "sound and haptics", "turn off vibration", "turn off haptics"], answer: "Go to Profile → Sound & haptics and flip the toggle off — that mutes page-turn sounds and vibration on this device." },
  { keywords: ["profile picture", "change my avatar", "add a photo of myself", "change my photo"], answer: "Tap your avatar at the top of the Profile screen and pick a photo from your gallery." },
  { keywords: ["memories tab", "on this day", "memories timeline"], answer: "The Memories tab shows all your pages in one timeline, plus an \"On This Day\" section on Home for pages from past years." },
  { keywords: ["how do i undo", "undo a change", "undo button"], answer: "There's an undo/redo pair of arrows in the top-left of the page editor for stepping back and forward through your changes." },
  { keywords: ["photo frame", "frame shape", "change the frame"], answer: "Tap a photo you've added and you'll see frame shape options in the toolbar that appears." },
];

const FOLLOWUPS = [
  "Want me to redesign your page while we're at it? 🎨",
  "Anything else you're curious about?",
  "Should I go ahead and jazz up your current page?",
  "Anything else I can help with?",
];

function pickFollowUp() {
  return FOLLOWUPS[Math.floor(Math.random() * FOLLOWUPS.length)];
}

function findMatch(text, table) {
  const hits = [];
  for (const [id, words] of table) {
    if (words.some((w) => text.includes(w))) hits.push(id);
  }
  return hits;
}

function matchFaq(text) {
  for (const item of FAQ) {
    if (item.keywords.some((k) => text.includes(k))) return item;
  }
  return null;
}

function interpret(rawText) {
  const text = rawText.toLowerCase().trim();
  if (!text) return { actions: [], reply: "Ruff? Tell me what you'd like your page to look like! 🐾" };

  if (GREETING_RE.test(text) && text.length < 20) {
    return { actions: [], reply: "Ruff ruff! 🐶 I'm Pup Cup. What are you up to today — need a redesign, or have a question about the app?" };
  }
  if (THANKS_RE.test(text)) {
    return { actions: [], reply: "Ruff! Anytime — happy to help make your page cute. 🐾" };
  }
  if (HELP_RE.test(text)) {
    return {
      actions: [],
      reply: "I can redesign your pages or answer questions about Once upon a Tuesday! Try:\n• \"make it pink and dotted\"\n• \"add hearts and a bow\"\n• \"surprise me\"\n• \"how do I add music\"\n• \"how do I create a journal\"",
    };
  }

  const faqHit = matchFaq(text);
  if (faqHit) {
    return { actions: [], reply: faqHit.answer + "\n\n" + pickFollowUp() };
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
    if (QUESTION_RE.test(text)) {
      return {
        actions: [],
        reply: "Hmm, I don't have a specific answer for that one yet — but ask me about creating journals, adding photos/stickers/music, changing themes, backups, or reading modes, and I can help! 🐾",
      };
    }
    return {
      actions: [],
      reply: "Hmm, I didn't quite catch that — try a color (\"make it lilac\"), a pattern (\"lined paper\"), something to add (\"add a crown\"), \"surprise me\", or ask me a question about the app! 🐾",
    };
  }

  const reply = "Ruff ruff! I " + said.join(" and ") + ". Take a peek! 🐶" + (Math.random() < 0.35 ? "\n\n" + pickFollowUp() : "");
  return { actions, reply };
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
    <button class="pup-btn" id="pup-btn" aria-label="Pup Cup assistant">${PUPPY_SVG}</button>
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
    history.push({ from: "pup", text: "Ruff! I'm Pup Cup 🐶 I can redesign this page or answer questions about Once upon a Tuesday. What would you like to do?" });
  }

  openSheet({
    title: "🐾 Pup Cup",
    html: `
      <div class="pup-chat" id="pup-chat">${history.map(bubbleHtml).join("")}</div>
      <div class="pup-suggestions" id="pup-suggestions">
        <button data-q="surprise me">🎲 Surprise me</button>
        <button data-q="make it pink and dotted">🌸 Make it pink</button>
        <button data-q="add hearts and a bow">💗 Add hearts</button>
        <button data-q="how do I add music?">❓ How do I add music?</button>
      </div>
      <div class="pup-input-row">
        <input type="text" id="pup-input" placeholder="Ask me anything or tell me what to change..." maxlength="140" />
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
