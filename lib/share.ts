import type { SocialLinks } from "@/components/frame/types";

export const HASHTAG = "#FrameInGoa";

/**
 * Builds the X caption for a generated card. Always includes the person's
 * own card link (so the timeline preview shows the landscape OG graphic and
 * clicking it lands on their 3D card page) and always ends with the
 * mandatory #FrameInGoa hashtag.
 */
export function buildShareCaption(opts: { name?: string; role?: string; cardUrl: string }): string {
  const name = opts.name?.trim();
  const role = opts.role?.trim();
  const lead = name
    ? `${name} built their Builder ID for @247pmstudio's Hacker House Goa 2026 🌴`
    : "Just built my Builder ID for @247pmstudio's Hacker House Goa 2026 🌴";
  const lines = [lead, role ? `— ${role}` : "", "Made with FrameInGoa — upload a pic, get your card in seconds."];
  return `${lines.filter(Boolean).join("\n")}\n${opts.cardUrl}\n${HASHTAG}`;
}

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

  // The link must live in the post text itself — that way the shared
  // landscape card's link preview (OG image) renders in the timeline AND the
  // link survives even when sharing via a native share sheet (which strips
  // any separate URL field).
  const url = ogPath ? buildShareUrl(ogPath) : window.location.href;
  const text = caption.includes(url) ? caption : `${caption}\n${url}`;

  if (file && typeof navigator !== "undefined" && "share" in navigator) {
    const shareData: ShareData = { text };
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

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
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
    // sequential, not Promise.all — big PNG blobs read into base64 strings
    // hit peak memory on mobile when done concurrently
    const portraitDataUrl = await blobToDataUrl(opts.portraitBlob);
    const portraitBackDataUrl = opts.portraitBackBlob
      ? await blobToDataUrl(opts.portraitBackBlob)
      : undefined;
    const landscapeDataUrl = await blobToDataUrl(opts.landscapeBlob);
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
