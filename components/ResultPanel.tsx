"use client";

import { Boxes, Download, RotateCcw, Share2 } from "lucide-react";
import { FloralBorder } from "@/components/Botanicals";

interface ResultPanelProps {
  onDownload: () => void;
  onShare: () => void;
  onView3D: () => void;
  onReset: () => void;
  busy?: boolean;
  bloom: boolean;
}

export function ResultPanel({ onDownload, onShare, onView3D, onReset, busy, bloom }: ResultPanelProps) {
  return (
    <div className="mx-auto mt-5 flex w-full max-w-[420px] flex-col items-center gap-3">
      <div className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
        <button
          type="button"
          onClick={onDownload}
          disabled={busy}
          className="stamp-press flex h-12 items-center justify-center gap-2 rounded-md bg-[var(--accent-mustard)] px-4 font-mono text-xs font-bold tracking-wide text-[var(--ink-black)] disabled:opacity-50"
        >
          <Download aria-hidden="true" className="h-4 w-4" />
          DOWNLOAD PNG
        </button>
        <button
          type="button"
          onClick={onShare}
          disabled={busy}
          className="stamp-press flex h-12 items-center justify-center gap-2 rounded-md bg-[var(--accent-pink)] px-4 font-mono text-xs font-bold tracking-wide text-[var(--text-cream)] disabled:opacity-50"
        >
          <Share2 aria-hidden="true" className="h-4 w-4" />
          SHARE TO X
        </button>
      </div>

      <button
        type="button"
        onClick={onView3D}
        disabled={busy}
        className="stamp-press flex h-11 w-full items-center justify-center gap-2 rounded-md border-2 border-[var(--accent-mustard)]/50 px-4 font-mono text-xs font-bold tracking-wide text-[var(--accent-mustard)] transition-colors duration-150 hover:border-[var(--accent-mustard)] disabled:opacity-50"
      >
        <Boxes aria-hidden="true" className="h-4 w-4" />
        VIEW IN 3D
      </button>

      <button
        type="button"
        onClick={onReset}
        className="stamp-press flex h-9 items-center gap-1.5 px-2 font-mono text-[11px] tracking-wide text-[var(--text-cream)]/60 transition-colors duration-150 hover:text-[var(--text-cream)]"
      >
        <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
        MAKE ANOTHER
      </button>

      {/* the "delight" beat — fires once when the card first finishes generating */}
      <div className="h-9 w-full max-w-[280px] overflow-hidden">
        <FloralBorder bloom={bloom} className="h-full" />
      </div>
    </div>
  );
}
