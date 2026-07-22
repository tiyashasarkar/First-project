// Cloud data layer: journals, pages, and media all live in Firestore,
// scoped under the signed-in user's own users/{uid} subtree. Photos are
// compressed client-side and stored as data URLs directly in Firestore
// documents (rather than Firebase Storage), so this works entirely on
// Firebase's free Spark plan — no billing setup, no paid Blaze plan
// required. Every function here keeps the exact same name and shape as
// the original local-only IndexedDB version, so none of the screen files
// needed to change when this was swapped in.

import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { auth, firestore } from "./firebase.js";

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

// ---- photo storage: compressed, embedded directly in Firestore ----
// Firestore documents cap out at 1MiB, so images are resized/compressed
// to comfortably fit (with room to spare) before being saved as a data URL.

function loadImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

async function compressImageToDataURL(blob, { maxDim = 1280, maxBytes = 650000 } = {}) {
  const img = await loadImageFromBlob(blob);
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  let quality = 0.78;
  let dataUrl;
  for (let attempt = 0; attempt < 6; attempt++) {
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    dataUrl = canvas.toDataURL("image/jpeg", quality);
    const approxBytes = dataUrl.length * 0.75;
    if (approxBytes <= maxBytes) break;
    if (quality > 0.4) {
      quality -= 0.15;
    } else {
      width = Math.round(width * 0.8);
      height = Math.round(height * 0.8);
    }
  }
  return dataUrl;
}

export async function saveMediaBlob(blob) {
  const id = idgen();
  const dataUrl = await compressImageToDataURL(blob);
  await setDoc(doc(colFor("media"), id), { id, dataUrl, createdAt: Date.now() });
  return id;
}

export async function getMediaURL(mediaId, cache) {
  if (!mediaId) return null;
  if (cache && cache.has(mediaId)) return cache.get(mediaId);
  const row = await get("media", mediaId);
  const url = row?.dataUrl || null;
  if (url && cache) cache.set(mediaId, url);
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
  return {
    app: "blossom-journal",
    exportedAt: new Date().toISOString(),
    version: 1,
    journals,
    pages,
    media: media.map((m) => ({ id: m.id, dataUrl: m.dataUrl, createdAt: m.createdAt })),
  };
}

export async function importAllData(data) {
  if (!data || data.app !== "blossom-journal") throw new Error("This doesn't look like a Blossom backup file.");
  for (const m of data.media || []) {
    await put("media", { id: m.id, dataUrl: m.dataUrl, createdAt: m.createdAt || Date.now() });
  }
  for (const j of data.journals || []) await put("journals", j);
  for (const p of data.pages || []) await put("pages", p);
}

export async function wipeAllData() {
  const [journals, pages, media] = await Promise.all([
    getAll("journals"),
    getAll("pages"),
    getAll("media"),
  ]);
  await Promise.all(journals.map((j) => del("journals", j.id)));
  await Promise.all(pages.map((p) => del("pages", p.id)));
  await Promise.all(media.map((m) => del("media", m.id)));
}
