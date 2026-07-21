# Blossom 🌸 — a photo journal

*Where memories become pages.*

A soft-pink, coquette-core scrapbook photo journal built as a Progressive Web App (PWA). It installs straight from Safari onto your iPhone home screen and works like a native app — and now signs you in with your own free, private account so your memories sync across any browser or device.

## What's in the app so far

- Soft pink, coquette-core scrapbook design (script accents, lace trim, hand-drawn stickers), onboarding, splash screen
- **Sign in / create account** — your memories are private to your account and sync everywhere you sign in
- **Home** — recent memories, "On This Day", continue editing, quick create
- **Journals** — create/rename/favorite/archive journals, each with its own cover and pages
- **Create Memory** flow — Blank Page, Photo Dump, Daily Journal, Travel Journal, Letter to Future Self
- **Freeform scrapbook canvas** — import photos from your library, drag/resize/rotate/layer them, add handwritten-style text, "Signature" hand-drawn stickers (bow, ribbon, pearls, and more) plus a big emoji sticker set, washi tape, and a movable/resizable calendar; undo/redo; pinch-to-zoom and pan; "Messy Mode" for playful scattered layouts
- **Memories** — chronological timeline, grouped by mood or place
- **Profile** — sign out, backup your memories to a file, restore from a backup, erase data
- Installable PWA with offline support, tuned for iPhone (safe areas, standalone mode, touch gestures)

Not built yet (planned for later, per the original spec): audio/voice notes, time capsules, the memory map, PDF/slideshow export, and AI suggestions. Intentionally deferred so the core experience is solid first.

---

## Before anything else: set up your free account (Firebase)

Blossom uses **Firebase**, a free service from Google, to handle sign-in and to store your journals/photos so they sync across devices and browsers (not just Safari on one iPhone). You need to do this once. It's entirely free for personal use, no credit card required, and nobody but you can see your data.

**I can't create this account for you** — it needs your own Google sign-in in a browser — but everything below is just clicking through simple forms, no coding.

### A. Create the project

1. Go to **[console.firebase.google.com](https://console.firebase.google.com)** and sign in with any Google account (create one first if you don't have one — it's free).
2. Click **"Add project"** (or **"Create a project"**).
3. Name it anything, e.g. `blossom-journal`, then click **Continue**.
4. When asked about Google Analytics, you can turn it **off** (simpler, and Blossom doesn't need it). Click **Create project**, then **Continue** once it's ready.

### B. Turn on email/password sign-in

5. In the left sidebar, click **Build → Authentication**, then **"Get started"**.
6. Click **"Email/Password"** in the list of sign-in methods.
7. Toggle it **Enable**, then click **Save**.

### C. Create your database

8. In the left sidebar, click **Build → Firestore Database**, then **"Create database"**.
9. Pick any location close to you, then choose **"Start in production mode"**. Click **Create**.

### D. Create photo storage

10. In the left sidebar, click **Build → Storage**, then **"Get started"**.
11. Choose **production mode** again (same as before). Click **Done**.
    - If Storage asks you to upgrade to a paid ("Blaze") plan first: this only happens on some newer Firebase projects and Google's free storage allowance still applies — you won't be charged unless your usage is enormous (far beyond personal photo journaling). If you'd rather avoid this entirely, it's fine to skip Storage setup for now; the app will still work for text/journals, photos just won't upload until Storage is enabled.

### E. Lock the security rules down to just you

This is the important privacy step — it makes sure only *you*, signed into *your* account, can ever read or write your data.

12. Still in **Firestore Database**, click the **"Rules"** tab. Delete everything there and paste in exactly this:

    ```
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /users/{uid}/{document=**} {
          allow read, write: if request.auth != null && request.auth.uid == uid;
        }
      }
    }
    ```

    Click **Publish**.

13. Go to **Storage → Rules** tab. Delete everything there and paste in exactly this:

    ```
    rules_version = '2';
    service firebase.storage {
      match /b/{bucket}/o {
        match /users/{uid}/{allPaths=**} {
          allow read, write: if request.auth != null && request.auth.uid == uid;
        }
      }
    }
    ```

    Click **Publish**.

### F. Get your config values

14. Click the **⚙️ gear icon** (top-left, next to "Project Overview") → **Project settings**.
15. Scroll down to **"Your apps"**. Click the **`</>`** (web) icon to register a new web app.
16. Give it a nickname like `Blossom` and click **"Register app"** (skip Firebase Hosting — leave it unchecked).
17. You'll see a code block called `firebaseConfig` with values like `apiKey`, `authDomain`, etc. Keep this page open.

### G. Paste your config into the app

18. Open `js/firebase-config.js` in this project.
19. Replace the placeholder values with the real ones from step 17, so it looks like:
    ```js
    export const firebaseConfig = {
      apiKey: "AIzaSy...",
      authDomain: "blossom-journal-xxxxx.firebaseapp.com",
      projectId: "blossom-journal-xxxxx",
      storageBucket: "blossom-journal-xxxxx.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:abcdef123456",
    };
    ```
20. Save the file. (You can paste your values to me in chat instead and I'll make this edit and push it for you.)

That's it — once this file has your real values and is deployed (see below), the sign-in screen will work and your memories will sync to your account.

**If you skip this step**, the app will show a friendly "One quick setup step" screen instead of the sign-in form, so nothing looks broken — it just won't work until you finish this.

---

## 1. Run it on your own computer (optional, for previewing)

You don't need Node, npm, or any build tools — it's plain HTML/CSS/JS. You only need a tiny local web server.

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

iPhones need the app served over `https://` to install it properly. The easiest, free way, since your code already lives on GitHub, is **GitHub Pages** — no new accounts, no servers to manage.

1. On GitHub, open your repository: `tiyashasarkar/first-project`.
2. Make sure your Firebase changes (Step "Before anything else" above) are committed to the `main` branch — ask me to do this if you're not sure.
3. Go to the repository's **Settings** tab → **Pages** (left sidebar).
4. Under "Build and deployment" → **Source**, choose **"Deploy from a branch"**.
5. Under **Branch**, select **main** and folder **/ (root)**, then click **Save**.
6. Wait about a minute, then refresh the page — GitHub will show your live URL, something like:
   ```
   https://tiyashasarkar.github.io/first-project/
   ```

That URL is your permanent app address. Anytime you (or I) push more changes to `main`, it updates automatically — no redeploying by hand.

---

## 3. Open it — on your iPhone, or anywhere else

1. On your iPhone, open **Safari** (needed specifically for the "Add to Home Screen" step below — only Safari can do that on iOS). On a computer or Android, any modern browser works.
2. Go to your GitHub Pages URL from Step 2.
3. You'll see the pink Blossom splash screen, then a sign-in screen. Tap **"Create account"**, enter any email and a password (6+ characters), and you're in.
4. Because this is a real account, you can now also open the same link in Chrome, on a different phone, or on a computer, sign in with the same email/password, and see all the same memories.

---

## 4. Add it to your iPhone Home Screen

1. While the site is open in Safari, tap the **Share icon** (the square with an arrow pointing up) in the bottom toolbar.
2. Scroll down the share sheet and tap **"Add to Home Screen"**.
3. Tap **"Add"** in the top-right corner.
4. A new **Blossom** icon (the little pink flower) appears on your home screen.

From now on, tap that icon to open Blossom full-screen, like any other app — no browser address bar, no Safari chrome, just your journal. You'll stay signed in.

---

## 5. Everyday use

- Tap the **pink + button** in the middle of the bottom bar to create a memory.
- Choose a page type, pick photos from your library (or skip for a Letter/Blank page), and you'll land in the editor.
- Drag photos/text/stickers/tape/calendar to move them; use the small corner handle to resize, the handle above to rotate.
- Tap the checkmark (top-right) to save and go back.
- Use two fingers to pinch-zoom and pan around the page itself.
- **Profile → Backup my memories** occasionally — this saves a `.json` file with everything (including your photos) as an extra safety copy you can keep in Files/iCloud, separate from your account.
- **Profile → Sign out** if you ever hand your phone to someone else; sign back in anytime with your email and password.

---

## 6. Packaging as a native iOS app later (optional, not needed now)

Because Blossom is built with plain, standard web technology, it can be wrapped into a real App Store app later using a tool called **Capacitor** (by Ionic) without rewriting anything — it just wraps this exact website in a thin native shell. That's a separate, optional step for if you ever want to publish to the App Store; it isn't needed for the app to work great on your iPhone today via the Home Screen.

---

## Notes on how it's built (for context, not required reading)

- No frameworks, no build step, no `npm install` — plain HTML/CSS/JavaScript (ES modules), including the Firebase SDK, which loads directly from Google's CDN.
- **Firebase Authentication** handles sign-in; **Firestore** stores journals/pages (with offline caching built in, so the app still feels instant and works offline); **Firebase Storage** stores your photos. All scoped privately per account via the security rules you set up above.
- Memories created before this update (back when everything was local-only) are automatically offered for import into your new account the first time you sign in on the device where you made them.
- A **service worker** caches the app shell so it opens instantly and works offline after the first visit.
- Icons were generated procedurally (no external image assets needed) via `scripts/make-icons.js`.
