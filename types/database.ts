export type JournalType =
  | 'daily'
  | 'travel'
  | 'school'
  | 'letter'
  | 'music'
  | 'mood'
  | 'custom';

export type PageElementType =
  | 'photo'
  | 'video'
  | 'sticker'
  | 'text'
  | 'doodle'
  | 'tape'
  | 'stamp';

export type MediaAssetType = 'photo' | 'video' | 'audio';

export type StickerPackSource = 'custom' | 'built-in';

export interface Journal {
  id: string;
  user_id: string;
  title: string;
  type: JournalType;
  theme: Record<string, unknown>;
  cover_page_id: string | null;
  is_private: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PageLocation {
  lat: number;
  lng: number;
  label?: string;
}

export interface Page {
  id: string;
  journal_id: string;
  title: string | null;
  date: string;
  location: PageLocation | null;
  mood: string | null;
  people: string[];
  weather: Record<string, unknown> | null;
  song: Record<string, unknown> | null;
  unlock_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ElementTransform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
}

export interface PageElement {
  id: string;
  page_id: string;
  type: PageElementType;
  transform: ElementTransform;
  content_ref: string | null;
  style: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MediaAsset {
  id: string;
  user_id: string;
  storage_path: string;
  type: MediaAssetType;
  duration: number | null;
  created_at: string;
}

export interface StickerPack {
  id: string;
  user_id: string;
  name: string;
  source: StickerPackSource;
  created_at: string;
}

