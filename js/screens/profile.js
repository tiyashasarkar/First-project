import * as db from "../db.js";
import { auth } from "../firebase.js";
import { showToast, confirmAction, openSheet, closeSheet, escapeHtml } from "../ui.js";
import { THEMES, getTheme, setTheme } from "../theme.js";
import { mountMascot } from "../mascot.js";

async function getProfileSettings() {
  return (await db.get("settings", "profile")) || { id: "profile" };
}

function pickImage() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";
    document.body.appendChild(input);
    input.addEventListener("change", () => {
      const file = input.files?.[0] || null;
      document.body.removeChild(input);
      resolve(file);
    });
    input.click();
  });
}

export async function renderProfile(container) {
  const [journals, pages, profile, soundOn] = await Promise.all([
    db.getAll("journals"),
    db.getAll("pages"),
    getProfileSettings(),
    db.isSoundEnabled(),
  ]);
  const email = auth.currentUser?.email || "";
  const currentThemeId = (await getTheme()) || "blossom";
  const currentTheme = THEMES.find((t) => t.id === currentThemeId) || THEMES[0];
  const avatarUrl = profile.avatarMediaId ? await db.getMediaURL(profile.avatarMediaId) : null;

  container.innerHTML = `
    <div class="topbar">
      <div class="eyebrow">Your space</div>
      <h1>Profile</h1>
    </div>
    <div class="section">
      <div class="profile-head">
        <div class="profile-avatar-wrap">
          <button class="profile-avatar" id="pf-avatar" aria-label="Change profile picture">
            ${avatarUrl ? `<img src="${avatarUrl}" alt="" />` : "🌸"}
          </button>
          <div class="profile-avatar-badge"><svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13.5" r="3.2"/></svg></div>
        </div>
        <div>
          <div class="profile-name">${escapeHtml(email) || "Blossom Journal"}</div>
          <div class="profile-stats">${journals.length} journals · ${pages.length} pages · synced to your account</div>
        </div>
      </div>

      <div class="settings-group-label">Appearance</div>
      <div class="settings-group">
        <button class="settings-row" id="pf-theme" style="width:100%;background:none;border:none;text-align:left;">
          <div class="si">${currentTheme.image ? `<img src="${currentTheme.image}" alt="" />` : currentTheme.emoji}</div>
          <div><div class="label">Theme</div><div class="sub">${currentTheme.label} — tap to change</div></div>
          <div class="chev">›</div>
        </button>
        <div class="settings-row" id="pf-sound-row">
          <div class="si"><svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 5V4L8 9H4z"/><path d="M17 8a5 5 0 0 1 0 8"/></svg></div>
          <div><div class="label">Sound &amp; haptics</div><div class="sub">Page-turn sounds and vibration on this device</div></div>
          <button class="pf-toggle${soundOn ? " on" : ""}" id="pf-sound-toggle" aria-label="Toggle sound and haptics"></button>
        </div>
      </div>

      <div class="settings-group-label">Your data</div>
      <div class="settings-group">
        <button class="settings-row" id="pf-backup" style="width:100%;background:none;border:none;text-align:left;">
          <div class="si"><svg viewBox="0 0 24 24"><path d="M12 3v13M7 11l5 5 5-5"/><path d="M5 21h14"/></svg></div>
          <div><div class="label">Backup my memories</div><div class="sub">Save everything to a file you keep safe</div></div>
          <div class="chev">›</div>
        </button>
        <button class="settings-row" id="pf-restore" style="width:100%;background:none;border:none;text-align:left;">
          <div class="si"><svg viewBox="0 0 24 24"><path d="M12 21V8M7 13l5-5 5 5"/><path d="M5 3h14"/></svg></div>
          <div><div class="label">Restore from backup</div><div class="sub">Bring back memories from a backup file</div></div>
          <div class="chev">›</div>
        </button>
        <div class="settings-row">
          <div class="si"><svg viewBox="0 0 24 24"><path d="M12 2 3 6.5V12c0 5.4 3.8 9.4 9 10 5.2-.6 9-4.6 9-10V6.5z"/></svg></div>
          <div><div class="label">Privacy</div><div class="sub">Your memories are private to your account — never shared or public</div></div>
        </div>
      </div>

      <div class="settings-group-label">Account</div>
      <div class="settings-group">
        <button class="settings-row" id="pf-signout" style="width:100%;background:none;border:none;text-align:left;">
          <div class="si"><svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg></div>
          <div><div class="label">Sign out</div><div class="sub">You can sign back in anytime on any device</div></div>
        </button>
        <button class="settings-row" id="pf-erase" style="width:100%;background:none;border:none;text-align:left;">
          <div class="si" style="background:#f6d3da;"><svg viewBox="0 0 24 24" style="stroke:#c94f6a;"><path d="M4 7h16M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3m-9 0 1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></svg></div>
          <div><div class="label" style="color:#c94f6a;">Erase all data</div><div class="sub">Permanently delete everything in your account</div></div>
        </button>
      </div>

      <div class="section" style="padding:26px 0;text-align:center;">
        <div style="font-family:var(--font-script);color:var(--dusty-rose);font-size:22px;">where memories become pages</div>
        <div style="font-size:11.5px;color:var(--ink-soft);margin-top:4px;">Blossom v1.0 · made with 🎀</div>
      </div>
    </div>
  `;

  container.querySelector("#pf-avatar").addEventListener("click", () => changeAvatar(container));
  container.querySelector("#pf-theme").addEventListener("click", () => openThemeSheet(container));
  container.querySelector("#pf-sound-toggle").addEventListener("click", async (e) => {
    const next = !soundOn;
    await db.setSoundEnabled(next);
    e.currentTarget.classList.toggle("on", next);
    if (next) db.hapticFeedback(10);
  });
  container.querySelector("#pf-backup").addEventListener("click", doBackup);
  container.querySelector("#pf-restore").addEventListener("click", doRestore);
  container.querySelector("#pf-signout").addEventListener("click", () => {
    confirmAction({
      title: "Sign out?",
      message: "You'll need your email and password to sign back in. Your memories stay safely in your account.",
      confirmLabel: "Sign out",
      danger: false,
      onConfirm: () => window.blossomSignOut(),
    });
  });
  container.querySelector("#pf-erase").addEventListener("click", () => {
    confirmAction({
      title: "Erase everything?",
      message: "This permanently deletes every journal, page and photo in your account. We recommend making a backup first. This can't be undone.",
      confirmLabel: "Erase everything",
      onConfirm: async () => {
        await db.wipeAllData();
        showToast("All data erased");
        window.blossomNavigate("home");
      },
    });
  });
}

async function changeAvatar(container) {
  const file = await pickImage();
  if (!file) return;
  showToast("Updating your photo…");
  try {
    const mediaId = await db.saveMediaBlob(file);
    const profile = await getProfileSettings();
    profile.avatarMediaId = mediaId;
    await db.put("settings", profile);
    showToast("Profile picture updated 🌸");
    renderProfile(container);
  } catch {
    showToast("That photo couldn't be used — try a different one");
  }
}

function openThemeSheet(container) {
  openSheet({
    title: "Choose your vibe",
    html: `<div class="mode-list" id="theme-sheet-list" style="padding-bottom:6px;"></div>`,
  });
  (async () => {
    const list = document.getElementById("theme-sheet-list");
    const current = (await getTheme()) || "blossom";
    THEMES.forEach((t) => {
      const card = document.createElement("button");
      card.className = "mode-card" + (t.id === current ? " selected" : "");
      card.innerHTML = `
        <div class="mc-emoji">${t.image ? `<img src="${t.image}" alt="${t.label}" />` : t.emoji}</div>
        <div>
          <div class="mc-title">${t.label}</div>
          <div class="mc-tag">${t.tagline}</div>
          <div class="mc-swatches">${t.swatches.map((c) => `<span style="background:${c}"></span>`).join("")}</div>
        </div>
        <div class="mc-check"></div>
      `;
      card.addEventListener("click", async () => {
        await setTheme(t.id);
        closeSheet();
        mountMascot();
        renderProfile(container);
      });
      list.appendChild(card);
    });
  })();
}

async function doBackup() {
  showToast("Preparing your backup…");
  try {
    const data = await db.exportAllData();
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `blossom-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    showToast("Backup saved 💾");
  } catch (err) {
    showToast("Backup failed — please try again");
  }
}

function doRestore() {
  openSheet({
    title: "Restore from backup",
    html: `
      <p style="color:var(--ink-soft);font-size:14px;line-height:1.55;margin-bottom:18px;">Choose a Blossom backup file (.json). New journals and pages will be added alongside what you already have.</p>
      <input type="file" accept="application/json,.json" id="rs-file" style="margin-bottom:18px;" />
      <button class="btn btn-primary btn-block" id="rs-go">Restore</button>
    `,
  });
  document.getElementById("rs-go").addEventListener("click", async () => {
    const input = document.getElementById("rs-file");
    const file = input.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await db.importAllData(data);
      closeSheet();
      showToast("Memories restored 🌸");
      window.blossomNavigate("home");
    } catch (err) {
      showToast("That file couldn't be read");
    }
  });
}
