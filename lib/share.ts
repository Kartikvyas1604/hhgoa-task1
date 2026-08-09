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
  
  // First try native share (opens X app if available)
  if (file && typeof navigator !== "undefined" && "share" in navigator) {
    try {
      await navigator.share({
        text: caption,
        files: [file ? (file instanceof File ? file : new File([file], fileName, { type: "image/png" })) : new File([], fileName, { type: "image/png" })],
        url: ogPath || window.location.href
      });
      return "shared";
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return "intent";
    }
  }

  // Fallback to deep link for mobile apps
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}&url=${encodeURIComponent(
    ogPath || window.location.href
  )}`;

  // Last resort: open in browser
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
 * path. Throws with the server's own reason when the backend isn't
 * configured or the request fails — callers should show that reason and can
 * fall back to the query-param-based /share path, which needs no backend.
 */
export async function persistCard(opts: {
  name: string;
  role: string;
  socials: SocialLinks;
  portraitBlob: Blob;
  portraitBackBlob?: Blob;
  landscapeBlob: Blob;
}): Promise<PersistedCard> {
  try {
    // sequential, not Promise.all — big PNG blobs read into base64 strings
    // hit peak memory on mobile when done concurrently
    // Compress oversized PNGs to JPEG to reduce payload size and avoid
    // server-side 413 (Payload Too Large) errors when posting JSON.
    async function maybeCompressToJpeg(blob: Blob, targetBytes = 3_500_000): Promise<Blob> {
      if (blob.size <= targetBytes) return blob;
      if (typeof createImageBitmap !== "function") return blob;
      try {
        const img = await createImageBitmap(blob);
        const canvas = new OffscreenCanvas(img.width, img.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) return blob;
        ctx.drawImage(img, 0, 0);
        // try a few quality settings until we hit the target size
        const qualities = [0.9, 0.8, 0.7, 0.6, 0.5];
        for (const q of qualities) {
          const out = await canvas.convertToBlob({ type: "image/jpeg", quality: q });
          if (out.size <= targetBytes) return out;
        }
        // fall back to last attempt
        return await canvas.convertToBlob({ type: "image/jpeg", quality: 0.5 });
      } catch {
        return blob;
      }
    }

    const portraitBlob = await maybeCompressToJpeg(opts.portraitBlob);
    const portraitBackBlob = opts.portraitBackBlob ? await maybeCompressToJpeg(opts.portraitBackBlob) : undefined;
    const landscapeBlob = await maybeCompressToJpeg(opts.landscapeBlob);

    const portraitDataUrl = await blobToDataUrl(portraitBlob);
    const portraitBackDataUrl = portraitBackBlob ? await blobToDataUrl(portraitBackBlob) : undefined;
    const landscapeDataUrl = await blobToDataUrl(landscapeBlob);
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
    if (!res.ok) {
      // surface the server's own reason — a 503 here means the Supabase /
      // ImageKit env vars aren't set, which is nothing to do with the user's
      // connection and shouldn't be reported as if it were.
      const reason = await res
        .json()
        .then((d: { error?: string }) => d.error)
        .catch(() => null);
      console.error("[card] persist failed:", res.status, reason);
      throw new Error(reason || `The server rejected the card (HTTP ${res.status}).`);
    }
    const data = (await res.json()) as { id: string };
    if (!data.id) throw new Error("The server saved no card id.");
    return { id: data.id, path: `/card/${data.id}` };
  } catch (err) {
    console.error("[card] persist failed:", err);
    throw err;
  }
}

export function isIOSDevice(): boolean {
  if (typeof navigator !== "undefined" && navigator.userAgent) {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
  }
  return false;
}

export function isAndroidDevice(): boolean {
  if (typeof navigator !== "undefined" && navigator.userAgent) {
    return /Android/i.test(navigator.userAgent);
  }
  return false;
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
