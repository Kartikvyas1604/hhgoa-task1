import type { SocialLinks } from "@/components/frame/types";

export const HASHTAG = "#FrameInGoa";

/**
 * The fixed launch-post caption — every Share to X click uses this exact
 * wording for now. A shorter, non-"I built this tool" caption for people
 * sharing cards *other* than their own is a separate follow-up.
 */
export const DEFAULT_SHARE_CAPTION = `Just built my Builder ID for @247pmstudio's Hacker House Goa 2026 🌴
Made it with a frame/ID generator I shipped this week — upload a pic, get your card in seconds.
#FrameInGoa`;

export function buildShareUrl(ogPath: string): string {
  const base = window.location.origin;
  return `${base}${ogPath}`;
}

export async function shareToX(opts: {
  caption: string;
  file?: Blob | null;
  fileName?: string;
  ogPath?: string;
}): Promise<"shared" | "intent"> {
  const { caption, file, fileName = "frame.png", ogPath } = opts;

  if (file && typeof navigator !== "undefined" && "share" in navigator) {
    const shareData: ShareData = { text: caption };
    const hasFiles = typeof navigator.canShare === "function";
    if (hasFiles) {
      const fileObj =
        file instanceof File ? file : new File([file], fileName, { type: "image/png" });
      if (navigator.canShare({ files: [fileObj] })) {
        shareData.files = [fileObj];
      }
    }
    try {
      await navigator.share(shareData);
      return "shared";
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return "intent";
    }
  }

  const url = ogPath ? buildShareUrl(ogPath) : window.location.href;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    caption,
  )}&url=${encodeURIComponent(url)}`;
  window.open(tweetUrl, "_blank", "noopener,noreferrer");
  return "intent";
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export interface PersistedCard {
  id: string;
  path: string;
}

/**
 * Persists the two rendered PNGs (portrait for the 3D page, landscape for
 * the X-timeline OG image) to the backend and returns the real /card/[id]
 * path. Returns null if the backend isn't configured or the request fails
 * — callers should fall back to the query-param-based /share path, which
 * needs no backend.
 */
export async function persistCard(opts: {
  name: string;
  role: string;
  socials: SocialLinks;
  portraitBlob: Blob;
  portraitBackBlob?: Blob;
  landscapeBlob: Blob;
}): Promise<PersistedCard | null> {
  try {
    const [portraitDataUrl, portraitBackDataUrl, landscapeDataUrl] = await Promise.all([
      blobToDataUrl(opts.portraitBlob),
      opts.portraitBackBlob ? blobToDataUrl(opts.portraitBackBlob) : Promise.resolve(undefined),
      blobToDataUrl(opts.landscapeBlob),
    ]);
    const res = await fetch("/api/generate-card", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: opts.name,
        role: opts.role,
        socials: opts.socials,
        portraitDataUrl,
        portraitBackDataUrl,
        landscapeDataUrl,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { id: string };
    if (!data.id) return null;
    return { id: data.id, path: `/card/${data.id}` };
  } catch {
    return null;
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
