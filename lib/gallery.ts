import type { FrameFormat, FrameVariant } from "@/components/frame/compose";

export interface GalleryEntry {
  id: string;
  format: FrameFormat;
  variant: FrameVariant;
  name: string;
  role: string;
  fileName: string;
  createdAt: number;
  photo: string;
  thumb: string;
  linkImg: string;
}

const KEY = "frameingoas:gallery:v1";
export const GALLERY_MAX = 10;

export function loadGallery(): GalleryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GalleryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistGallery(entries: GalleryEntry[]): GalleryEntry[] {
  if (typeof window === "undefined") return entries;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries));
    return entries;
  } catch {
    const trimmed = entries.slice(0, Math.max(1, entries.length - 1));
    if (trimmed.length !== entries.length) return persistGallery(trimmed);
    return entries;
  }
}

export function pushGallery(entry: GalleryEntry): GalleryEntry[] {
  const next = [entry, ...loadGallery()].slice(0, GALLERY_MAX);
  return persistGallery(next);
}

export function removeGalleryEntry(id: string): GalleryEntry[] {
  return persistGallery(loadGallery().filter((e) => e.id !== id));
}
