import * as db from "../db.js";
import { showToast, confirmAction, openSheet, closeSheet } from "../ui.js";

export async function renderProfile(container) {
  const journals = await db.getAll("journals");
  const pages = await db.getAll("pages");
  const media = await db.getAll("media");
  const approxMB = (media.reduce((sum, m) => sum + (m.blob?.size || 0), 0) / (1024 * 1024)).toFixed(1);

  container.innerHTML = `
    <div class="topbar">
      <div class="eyebrow">Your space</div>
      <h1>Profile</h1>
    </div>
    <div class="section">
      <div class="profile-head">
        <div class="profile-avatar">🌸</div>
        <div>
          <div style="font-family:var(--font-display);font-weight:600;font-size:17px;color:var(--mauve-dark);">Blossom Journal</div>
          <div style="font-size:12.5px;color:var(--ink-soft);margin-top:2px;">${journals.length} journals · ${pages.length} pages · ${approxMB} MB on this device</div>
        </div>
      </div>

      <div class="settings-list">
        <div class="settings-row">
          <div class="si">🎨</div>
          <div><div class="label">Theme</div><div class="sub">Soft Pink — more themes coming soon</div></div>
        </div>
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
          <div><div class="label">Privacy</div><div class="sub">Everything stays on this device — nothing is uploaded</div></div>
        </div>
        <button class="settings-row" id="pf-erase" style="width:100%;background:none;border:none;text-align:left;">
          <div class="si" style="background:#f6d3da;"><svg viewBox="0 0 24 24" style="stroke:#c94f6a;"><path d="M4 7h16M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3m-9 0 1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></svg></div>
          <div><div class="label" style="color:#c94f6a;">Erase all data</div><div class="sub">Start completely fresh on this device</div></div>
        </button>
      </div>

      <div class="section" style="padding:26px 0;text-align:center;">
        <div style="font-family:var(--font-display);font-style:italic;color:var(--dusty-rose);font-size:14px;">"where memories become pages"</div>
        <div style="font-size:11.5px;color:var(--ink-soft);margin-top:6px;">Blossom v1.0 · made with 🩷</div>
      </div>
    </div>
  `;

  container.querySelector("#pf-backup").addEventListener("click", doBackup);
  container.querySelector("#pf-restore").addEventListener("click", doRestore);
  container.querySelector("#pf-erase").addEventListener("click", () => {
    confirmAction({
      title: "Erase everything?",
      message: "This deletes every journal, page and photo stored on this device. We recommend making a backup first. This can't be undone.",
      confirmLabel: "Erase everything",
      onConfirm: async () => {
        await db.wipeAllData();
        showToast("All data erased");
        location.reload();
      },
    });
  });
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
