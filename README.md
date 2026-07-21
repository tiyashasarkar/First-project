# Blossom 🌸 — a photo journal

*Where memories become pages.*

A soft-pink, scrapbook-style photo journal built as a Progressive Web App (PWA). No app store, no account, no server to configure — it installs straight from Safari onto your iPhone home screen and works like a native app.

## What's in this MVP (Phase 1)

- Soft pink scrapbook design system, onboarding, splash screen
- **Home** — recent memories, "On This Day", continue editing, quick create
- **Journals** — create/rename/favorite/archive journals, each with its own cover and pages
- **Create Memory** flow — Blank Page, Photo Dump, Daily Journal, Travel Journal, Letter to Future Self
- **Freeform scrapbook canvas** — import photos from your library, drag/resize/rotate/layer them, add handwritten-style text, emoji stickers, and washi tape; undo/redo; pinch-to-zoom and pan around the page; "Messy Mode" for playful scattered layouts
- **Memories** — chronological timeline, grouped by mood or place
- **Profile** — backup your memories to a file, restore from a backup, erase data
- Installable PWA with offline support, tuned for iPhone (safe areas, standalone mode, touch gestures)

Everything is stored **only on your device** (in the browser's private storage) — nothing is uploaded anywhere. That also means you should occasionally use **Profile → Backup my memories** to save a copy somewhere safe (e.g. into Files/iCloud Drive), since clearing Safari data or removing the app would otherwise erase it.

Not built yet (planned for later phases, per the original spec): audio/voice notes, time capsules, the memory map, PDF/slideshow export, and AI suggestions. These are intentionally deferred so the core experience is solid first.

---

## 1. Run it on your own computer (optional, for previewing)

You don't need Node, npm, or any build tools — it's plain HTML/CSS/JS. You only need a tiny local web server because Safari requires `http://`, not a plain double-clicked file, for the app to install correctly.

**On a Mac** (Python is already installed):
1. Open the **Terminal** app.
2. Type `cd ` (with a trailing space), drag the `First-project` folder into the Terminal window, and press Enter.
3. Run:
   ```
   python3 -m http.server 8000
   ```
4. Open **http://localhost:8000** in your browser to preview it.
5. Press `Control + C` in Terminal to stop the server when you're done.

**On Windows:** open Command Prompt in the folder and run the same command (`python3` may need to be `python`).

This step is only for previewing on your computer — skip straight to Step 3 below if you just want it on your iPhone.

---

## 2. Put the code online (so it has a real, secure address)

iPhones need the app served over `https://` to install it properly and to remember your data reliably. The easiest, free way, since your code already lives on GitHub, is **GitHub Pages** — no new accounts, no servers to manage.

1. On GitHub, open your repository: `tiyashasarkar/first-project`.
2. This app was built on the branch **`claude/photo-journal-pwa-0vl9i8`**. Open a Pull Request from that branch into `main` and merge it (or ask me to do this for you).
3. Go to the repository's **Settings** tab → **Pages** (left sidebar).
4. Under "Build and deployment" → **Source**, choose **"Deploy from a branch"**.
5. Under **Branch**, select **main** and folder **/ (root)**, then click **Save**.
6. Wait about a minute, then refresh the page — GitHub will show your live URL, something like:
   ```
   https://tiyashasarkar.github.io/first-project/
   ```

That URL is your permanent app address. Anytime you (or I) push more changes to `main`, it updates automatically — no redeploying by hand.

---

## 3. Open it on your iPhone

1. On your iPhone, open **Safari** (must be Safari, not Chrome — only Safari can install home screen apps on iOS).
2. Go to your GitHub Pages URL from Step 2.
3. You'll see the pink Blossom splash screen, then a short welcome walkthrough.

---

## 4. Add it to your Home Screen

1. While the site is open in Safari, tap the **Share icon** (the square with an arrow pointing up) in the bottom toolbar.
2. Scroll down the share sheet and tap **"Add to Home Screen"**.
3. Tap **"Add"** in the top-right corner.
4. A new **Blossom** icon (the little pink flower) appears on your home screen.

From now on, tap that icon to open Blossom full-screen, like any other app — no browser address bar, no Safari chrome, just your journal.

---

## 5. Everyday use

- Tap the **pink + button** in the middle of the bottom bar to create a memory.
- Choose a page type, pick photos from your library (or skip for a Letter/Blank page), and you'll land in the editor.
- Drag photos/text/stickers to move them; use the small corner handle to resize, the handle above to rotate.
- Tap the checkmark (top-right) to save and go back.
- Use two fingers to pinch-zoom and pan around the page itself.
- **Profile → Backup my memories** regularly — this saves a `.json` file with everything (including your photos) that you can keep in Files/iCloud/email to yourself, and restore later on this or any other device via **Profile → Restore from backup**.

---

## 6. Packaging as a native iOS app later (optional, not needed now)

Because Blossom is built with plain, standard web technology, it can be wrapped into a real App Store app later using a tool called **Capacitor** (by Ionic) without rewriting anything — it just wraps this exact website in a thin native shell. That's a separate, optional step for if you ever want to publish to the App Store; it isn't needed for the app to work great on your iPhone today via the Home Screen.

---

## Notes on how it's built (for context, not required reading)

- No frameworks, no build step, no `npm install` — plain HTML/CSS/JavaScript (ES modules).
- Data (journals, pages, photos) is stored in the browser's **IndexedDB**, a real on-device database — nothing is sent to a server.
- A **service worker** caches the app so it opens instantly and works offline after the first visit.
- Icons were generated procedurally (no external image assets needed) via `scripts/make-icons.js`.
