"use client";

import { Download, Link2, RotateCcw, Share2, Trash2 } from "lucide-react";
import type { GalleryEntry } from "@/lib/gallery";

interface SessionGalleryProps {
  entries: GalleryEntry[];
  onDownload: (entry: GalleryEntry) => void;
  onShare: (entry: GalleryEntry) => void;
  onCopyLink: (entry: GalleryEntry) => void;
  onReuse: (entry: GalleryEntry) => void;
  onDelete: (id: string) => void;
}

export function SessionGallery({
  entries,
  onDownload,
  onShare,
  onCopyLink,
  onReuse,
  onDelete,
}: SessionGalleryProps) {
  if (entries.length === 0) return null;

  return (
    <div className="mt-2 px-3 pb-4 sm:px-4">
      <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-muted">
        <span aria-hidden="true" className="text-sunset">
          ●
        </span>
        session gallery — saved on this device
      </p>
      <ul className="flex gap-3 overflow-x-auto pb-2">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="group relative w-[88px] flex-none shrink-0 overflow-hidden rounded-lg border border-line bg-void"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- stored data URL, not optimisable */}
            <img
              src={entry.thumb}
              alt={`${entry.format === "pfp" ? "PFP frame" : "Builder ID"} for ${entry.name || "unnamed"}`}
              className="aspect-square w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 bg-void/80 p-1 opacity-100 backdrop-blur-sm transition-opacity duration-100 group-hover:opacity-100 sm:opacity-0">
              <button
                type="button"
                onClick={() => onDownload(entry)}
                aria-label="Download"
                className="flex items-center gap-1 rounded-sm px-1 py-1 font-mono text-[9px] text-ink hover:bg-ink/10"
              >
                <Download aria-hidden="true" className="h-3 w-3" />
                dl
              </button>
              <button
                type="button"
                onClick={() => onShare(entry)}
                aria-label="Share to X"
                className="flex items-center gap-1 rounded-sm px-1 py-1 font-mono text-[9px] text-ink hover:bg-ink/10"
              >
                <Share2 aria-hidden="true" className="h-3 w-3" />
                x
              </button>
              <button
                type="button"
                onClick={() => onCopyLink(entry)}
                aria-label="Copy frame link"
                className="flex items-center gap-1 rounded-sm px-1 py-1 font-mono text-[9px] text-ink hover:bg-ink/10"
              >
                <Link2 aria-hidden="true" className="h-3 w-3" />
                link
              </button>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => onReuse(entry)}
                  aria-label="Edit this frame again"
                  className="flex flex-1 items-center gap-1 rounded-sm px-1 py-1 font-mono text-[9px] text-ink hover:bg-ink/10"
                >
                  <RotateCcw aria-hidden="true" className="h-3 w-3" />
                  again
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(entry.id)}
                  aria-label="Remove from gallery"
                  className="rounded-sm p-1 text-muted transition-colors duration-100 hover:text-magenta"
                >
                  <Trash2 aria-hidden="true" className="h-3 w-3" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
