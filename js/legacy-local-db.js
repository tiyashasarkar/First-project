// Legacy local-only IndexedDB data layer, kept around solely so memories
// created before login/cloud-sync was added can be migrated into a user's
// new account. Not used for normal app operation anymore — see db.js.

const DB_NAME = "blossom-journal";
const DB_VERSION = 1;
let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("journals")) {
        db.createObjectStore("journals", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("pages")) {
        const pages = db.createObjectStore("pages", { keyPath: "id" });
        pages.createIndex("journalId", "journalId");
        pages.createIndex("dateISO", "dateISO");
      }
      if (!db.objectStoreNames.contains("media")) {
        db.createObjectStore("media", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("kv")) {
        db.createObjectStore("kv", { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(storeName, mode) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(storeName, mode);
        const store = t.objectStore(storeName);
        resolve({ t, store });
      })
  );
}

function wrapReq(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const idgen = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

export async function put(storeName, value) {
  const { store, t } = await tx(storeName, "readwrite");
  store.put(value);
  return new Promise((resolve, reject) => {
    t.oncomplete = () => resolve(value);
    t.onerror = () => reject(t.error);
  });
}

export async function get(storeName, id) {
  const { store } = await tx(storeName, "readonly");
  return wrapReq(store.get(id));
}

export async function getAll(storeName) {
  const { store } = await tx(storeName, "readonly");
  return wrapReq(store.getAll());
}

export async function del(storeName, id) {
  const { store, t } = await tx(storeName, "readwrite");
  store.delete(id);
  return new Promise((resolve, reject) => {
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

export async function getByIndex(storeName, indexName, value) {
  const { store } = await tx(storeName, "readonly");
  return wrapReq(store.index(indexName).getAll(value));
}

// ---- small key/value settings store (onboarding flag, theme, etc.) ----
export async function kvGet(key, fallback) {
  const row = await get("kv", key);
  return row ? row.value : fallback;
}
export async function kvSet(key, value) {
  return put("kv", { key, value });
}

// ---- domain helpers ----

export async function createJournal(journal) {
  const now = Date.now();
  const rec = {
    id: idgen(),
    title: journal.title || "Untitled Journal",
    description: journal.description || "",
    coverMediaId: journal.coverMediaId || null,
    coverColor: journal.coverColor || pickCoverColor(),
    template: journal.template || "blank",
    favorite: false,
    archived: false,
    pageCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  await put("journals", rec);
  return rec;
}

export function pickCoverColor() {
  const palette = [
    "linear-gradient(145deg,#f6c9d8,#d98fac)",
    "linear-gradient(145deg,#fce4d8,#f0bd82)",
    "linear-gradient(145deg,#f9dfe7,#c98ca7)",
    "linear-gradient(145deg,#fbe4ec,#9c6b84)",
    "linear-gradient(145deg,#ffe9d6,#e3a08c)",
  ];
  return palette[Math.floor(Math.random() * palette.length)];
}

export async function saveMediaBlob(blob) {
  const id = idgen();
  await put("media", { id, blob, createdAt: Date.now() });
  return id;
}

export async function getMediaURL(mediaId, cache) {
  if (!mediaId) return null;
  if (cache && cache.has(mediaId)) return cache.get(mediaId);
  const row = await get("media", mediaId);
  if (!row) return null;
  const url = URL.createObjectURL(row.blob);
  if (cache) cache.set(mediaId, url);
  return url;
}

export async function savePage(page) {
  const now = Date.now();
  const rec = { ...page, updatedAt: now };
  if (!rec.id) rec.id = idgen();
  if (!rec.createdAt) rec.createdAt = now;
  await put("pages", rec);
  // keep journal page count / updatedAt fresh
  const journal = await get("journals", rec.journalId);
  if (journal) {
    const pages = await getByIndex("pages", "journalId", rec.journalId);
    journal.pageCount = pages.length;
    journal.updatedAt = now;
    await put("journals", journal);
  }
  return rec;
}

export async function deletePage(id) {
  const page = await get("pages", id);
  await del("pages", id);
  if (page) {
    const journal = await get("journals", page.journalId);
    if (journal) {
      const pages = await getByIndex("pages", "journalId", page.journalId);
      journal.pageCount = pages.length;
      journal.updatedAt = Date.now();
      await put("journals", journal);
    }
  }
}

export async function duplicatePage(id) {
  const page = await get("pages", id);
  if (!page) return null;
  const copy = {
    ...page,
    id: idgen(),
    title: page.title + " (copy)",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  return savePage(copy);
}

export async function getAllPagesSorted() {
  const pages = await getAll("pages");
  return pages.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function exportAllData() {
  const [journals, pages, media] = await Promise.all([
    getAll("journals"),
    getAll("pages"),
    getAll("media"),
  ]);
  const mediaEncoded = await Promise.all(
    media.map(
      (m) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ id: m.id, dataUrl: reader.result, createdAt: m.createdAt });
          reader.readAsDataURL(m.blob);
        })
    )
  );
  return {
    app: "blossom-journal",
    exportedAt: new Date().toISOString(),
    version: 1,
    journals,
    pages,
    media: mediaEncoded,
  };
}

export async function importAllData(data) {
  if (!data || data.app !== "blossom-journal") throw new Error("This doesn't look like a Blossom backup file.");
  for (const m of data.media || []) {
    const blob = await (await fetch(m.dataUrl)).blob();
    await put("media", { id: m.id, blob, createdAt: m.createdAt });
  }
  for (const j of data.journals || []) await put("journals", j);
  for (const p of data.pages || []) await put("pages", p);
}

export async function wipeAllData() {
  const db = await openDB();
  await Promise.all(
    ["journals", "pages", "media"].map(
      (name) =>
        new Promise((resolve, reject) => {
          const t = db.transaction(name, "readwrite");
          t.objectStore(name).clear();
          t.oncomplete = resolve;
          t.onerror = () => reject(t.error);
        })
    )
  );
}

export async function hasAnyData() {
  try {
    const journals = await getAll("journals");
    return journals.length > 0;
  } catch {
    return false;
  }
}
