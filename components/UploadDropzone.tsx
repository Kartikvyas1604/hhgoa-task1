"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { PHOTO_MASK_PATH, PHOTO_MASK_VIEWBOX } from "@/components/frame/photo-mask";

const ACCEPT = "image/jpeg,image/png,image/heic,image/heif,.jpg,.jpeg,.png,.heic";

interface UploadDropzoneProps {
  onPick: (file: File) => void;
  busy?: boolean;
}

/**
 * The upload target — outlined in the exact scalloped-flower photo mask cut
 * into the real card, so dropping a photo here reads as directly filling
 * the card's own hole, not a separate generic rectangle.
 */
export function UploadDropzone({ onPick, busy = false }: UploadDropzoneProps) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const open = useCallback(() => inputRef.current?.click(), []);

  return (
    <div className="mx-auto flex w-full max-w-[340px] flex-col items-center gap-4">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a photo"
        aria-busy={busy}
        onClick={open}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const file = e.dataTransfer.files?.[0];
          if (file) onPick(file);
        }}
        className="group relative aspect-square w-full cursor-pointer touch-manipulation"
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onPick(file);
          }}
        />
        <svg
          viewBox={PHOTO_MASK_VIEWBOX}
          aria-hidden="true"
          className="h-full w-full drop-shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
        >
          <path
            d={PHOTO_MASK_PATH}
            className={`fill-[var(--bg-jungle-deep)] stroke-[var(--accent-mustard)] transition-colors duration-150 ${
              drag ? "fill-[var(--accent-mustard)]/20" : "group-hover:fill-[var(--accent-mustard)]/10"
            }`}
            strokeWidth={6}
            strokeDasharray="18 14"
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 px-10 text-center">
          <ImagePlus aria-hidden="true" className="h-8 w-8 text-[var(--accent-mustard)] sm:h-9 sm:w-9" />
          <p className="font-mono text-[11px] font-bold tracking-wide text-[var(--accent-mustard)] sm:text-xs">
            {busy ? "PROCESSING…" : "DROP PHOTO OR TAP TO BROWSE"}
          </p>
          <p className="font-mono text-[9px] tracking-wide text-[var(--text-cream)]/60 sm:text-[10px]">
            JPG · PNG · HEIC
          </p>
        </div>
      </div>
      <p className="font-mono text-[10px] tracking-wide text-[var(--text-cream)]/50">
        ▸ nothing leaves your browser
      </p>
    </div>
  );
}
