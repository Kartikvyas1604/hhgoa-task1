"use client";

import { useCallback, useState } from "react";
import { Download, Share2 } from "lucide-react";
import { buildShareCaption, downloadBlob, shareToX } from "@/lib/share";

interface CardPageActionsProps {
  /** Portrait PNG for download (the interactive/portrait artifact). */
  portraitUrl: string;
  /** Landscape PNG for sharing — the X-timeline version of the card. */
  landscapeUrl: string;
  /** Relative path to this card, e.g. "/card/abc123". */
  cardPath: string;
  name: string;
  role: string;
  fileName: string;
}

export function CardPageActions({
  portraitUrl,
  landscapeUrl,
  cardPath,
  name,
  role,
  fileName,
}: CardPageActionsProps) {
  const [busy, setBusy] = useState(false);

  const onDownload = useCallback(async () => {
    setBusy(true);
    try {
      const blob = await (await fetch(portraitUrl)).blob();
      downloadBlob(blob, fileName);
    } finally {
      setBusy(false);
    }
  }, [portraitUrl, fileName]);

  const onShare = useCallback(async () => {
    setBusy(true);
    try {
      const blob = await (await fetch(landscapeUrl)).blob();
      const absUrl = new URL(cardPath, window.location.origin).toString();
      const caption = buildShareCaption({ name, role, cardUrl: absUrl });
      await shareToX({ caption, file: blob, fileName, ogPath: cardPath });
    } finally {
      setBusy(false);
    }
  }, [landscapeUrl, cardPath, name, role, fileName]);

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onClick={onDownload}
        disabled={busy}
        className="stamp-press flex h-11 items-center gap-2 rounded-md bg-[var(--accent-mustard)] px-5 font-mono text-xs font-bold tracking-wide text-[var(--ink-black)] disabled:opacity-50"
      >
        <Download aria-hidden="true" className="h-4 w-4" />
        DOWNLOAD PNG
      </button>
      <button
        type="button"
        onClick={onShare}
        disabled={busy}
        className="stamp-press flex h-11 items-center gap-2 rounded-md bg-[var(--accent-pink)] px-5 font-mono text-xs font-bold tracking-wide text-[var(--text-cream)] disabled:opacity-50"
      >
        <Share2 aria-hidden="true" className="h-4 w-4" />
        SHARE TO X
      </button>
    </div>
  );
}
