// Cloud data layer: journals/pages/media metadata live in Firestore, photo
// bytes live in Firebase Storage — both scoped under the signed-in user's
// own users/{uid} subtree. Every function here keeps the exact same name
// and shape as the old local-only IndexedDB version, so none of the screen
// files needed to change when this was swapped in.

import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL, deleteObject, listAll,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";
import { auth, firestore, storage } from "./firebase.js";

export const idgen = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

function uid() {
  const u = auth.currentUser;
  if (!u) throw new Error("Not signed in.");
  return u.uid;
}

function colFor(storeName) {
  return collection(firestore, "users", uid(), storeName);
}

export async function put(storeName, value) {
  await setDoc(doc(colFor(storeName), value.id), value);
  return value;
}

export async function get(storeName, id) {
  if (!id) return null;
  const snap = await getDoc(doc(colFor(storeName), id));
  return snap.exists() ? snap.data() : null;
}

export async function getAll(storeName) {
  const snap = await getDocs(colFor(storeName));
  return snap.docs.map((d) => d.data());
}

export async function del(storeName, id) {
  await deleteDoc(doc(colFor(storeName), id));
}

export async function getByIndex(storeName, indexName, value) {
  const snap = await getDocs(query(colFor(storeName), where(indexName, "==", value)));
  return snap.docs.map((d) => d.data());
}

// ---- small key/value settings store (onboarding flag, theme, etc.) ----
// Kept in localStorage on purpose: per-device UI niceties, not memories,
// so they don't need to round-trip to the cloud.
export async function kvGet(key, fallback) {
  try {
    const raw = localStorage.getItem("blossom_kv_" + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}
export async function kvSet(key, value) {
  try {
    localStorage.setItem("blossom_kv_" + key, JSON.stringify(value));
  } catch {
    // storage unavailable (private browsing etc.) — safe to ignore
  }
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

function mediaStoragePath(mediaId) {
  return `users/${uid()}/media/${mediaId}`;
}

export async function saveMediaBlob(blob) {
  const id = idgen();
  await uploadBytes(ref(storage, mediaStoragePath(id)), blob);
  await setDoc(doc(colFor("media"), id), { id, createdAt: Date.now() });
  return id;
}

export async function getMediaURL(mediaId, cache) {
  if (!mediaId) return null;
  if (cache && cache.has(mediaId)) return cache.get(mediaId);
  try {
    const url = await getDownloadURL(ref(storage, mediaStoragePath(mediaId)));
    if (cache) cache.set(mediaId, url);
    return url;
  } catch {
    return null;
  }
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
  const [journals, pages, mediaMeta] = await Promise.all([
    getAll("journals"),
    getAll("pages"),
    getAll("media"),
  ]);
  const mediaEncoded = [];
  for (const m of mediaMeta) {
    try {
      const url = await getDownloadURL(ref(storage, mediaStoragePath(m.id)));
      const blob = await (await fetch(url)).blob();
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      mediaEncoded.push({ id: m.id, dataUrl, createdAt: m.createdAt });
    } catch {
      // skip any media that failed to download rather than fail the whole backup
    }
  }
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
    await uploadBytes(ref(storage, mediaStoragePath(m.id)), blob);
    await setDoc(doc(colFor("media"), m.id), { id: m.id, createdAt: m.createdAt || Date.now() });
  }
  for (const j of data.journals || []) await put("journals", j);
  for (const p of data.pages || []) await put("pages", p);
}

export async function wipeAllData() {
  const [journals, pages, mediaMeta] = await Promise.all([
    getAll("journals"),
    getAll("pages"),
    getAll("media"),
  ]);
  await Promise.all(journals.map((j) => del("journals", j.id)));
  await Promise.all(pages.map((p) => del("pages", p.id)));
  await Promise.all(
    mediaMeta.map(async (m) => {
      await del("media", m.id);
      try {
        await deleteObject(ref(storage, mediaStoragePath(m.id)));
      } catch {
        // already gone / never uploaded — fine
      }
    })
  );
  // catch any storage objects not tracked in Firestore for some reason
  try {
    const folder = await listAll(ref(storage, `users/${uid()}/media`));
    await Promise.all(folder.items.map((item) => deleteObject(item).catch(() => {})));
  } catch {
    // no media folder yet — fine
  }
}
