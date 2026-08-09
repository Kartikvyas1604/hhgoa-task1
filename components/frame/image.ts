import { ensureCardFonts } from "@/components/frame/export";

/** Downscale cap for the working canvas — the card's photo hole is small, so
 *  there is no reason to ever hold a full-resolution bitmap in memory (which
 *  is what crashed mobile browsers on 5–15MB+ camera photos). */
export const WORK_MAX = 1800;
export const JPEG_QUALITY = 0.92;

/** Raised from 5MB: modern phone photos (and HEIC originals) routinely land
 *  at 5–15MB+. We downscale during decode, so large files are fine — only
 *  nonsense uploads get rejected. */
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

const ALLOWED_MIME = /^image\/(jpe?g|png|webp|avif|heic|heif)$/;
const ALLOWED_EXT = /\.(jpe?g|png|webp|avif|heic|heif)$/i;

export function isHeic(file: File): boolean {
  return /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
}

/** Validate MIME type safely, falling back to the extension when the browser
 *  reports an empty/generic MIME (common on Android and iOS for HEIC). */
export function looksLikeImage(file: File): boolean {
  return ALLOWED_MIME.test((file.type || "").trim()) || ALLOWED_EXT.test(file.name || "");
}

async function loadImageFromObjectUrl(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    return await loadImageFromUrl(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function loadImageFromFileReader(blob: Blob): Promise<HTMLImageElement> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("FileReader failed"));
    reader.readAsDataURL(blob);
  });
  return loadImageFromUrl(dataUrl);
}

function loadImageFromUrl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error(`browser could not decode this image (${src.slice(0, 32)}…)`));
    img.src = src;
  });
}

/**
 * Decode a blob through an <img> element. Unlike createImageBitmap:
 *  - <img> applies EXIF orientation in every modern browser (no rotated
 *    iPhone photos),
 *  - it never throws on decode — it signals via onerror, so we always get
 *    the real reason,
 *  - it works on every Android Chrome / iOS Safari.
 * Object URLs first (cheap); FileReader/data-URL as a fallback for browsers
 * or contexts where object URLs fail.
 */
async function decodeViaImage(blob: Blob): Promise<HTMLImageElement> {
  try {
    return await loadImageFromObjectUrl(blob);
  } catch (err) {
    try {
      return await loadImageFromFileReader(blob);
    } catch {
      throw err;
    }
  }
}

async function convertHeicToJpeg(file: File): Promise<Blob> {
  const { default: heic2any } = await import("heic2any");
  const out = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: JPEG_QUALITY,
  });
  // heic2any returns Blob | Blob[]. Multi-frame HEIC (iPhone Live Photos,
  // bursts) yields an array — pick the first frame instead of handing a
  // non-Blob to createObjectURL/createImageBitmap and crashing.
  if (Array.isArray(out)) return out[0];
  return out;
}

/**
 * Full client-side photo pipeline: HEIC → JPEG (first frame), decode via
 * <img> (EXIF-correct), downscale to a working canvas (memory-safe) and
 * return a browser-friendly JPEG data URL for the card pipeline.
 */
export async function processPhoto(file: File): Promise<string> {
  const start = performance.now();
  console.info("[photo] pick", {
    name: file.name,
    type: file.type || "(empty)",
    size: file.size,
    lastModified: file.lastModified,
    heic: isHeic(file),
  });

  // Fonts are loaded purely as a warm-up for the later card render. They
  // must NEVER be able to fail or slow down photo processing (a webfont
  // network error used to reject this whole promise with a "network error"
  // even though the image was fine). Best-effort, fully swallowed.
  ensureCardFonts().catch((e) =>
    console.warn("[photo] font warm-up failed (ignored):", e),
  );

  let src: Blob = file;
  if (isHeic(file)) {
    try {
      src = await convertHeicToJpeg(file);
      console.info("[photo] heic → jpeg ok", (src as Blob).size, "bytes");
    } catch (e) {
      console.error("[photo] heic convert failed:", e);
      throw e;
    }
  }

  let img: HTMLImageElement;
  try {
    img = await decodeViaImage(src);
    console.info(
      "[photo] decode ok",
      `${img.naturalWidth}×${img.naturalHeight}`,
      `${Math.round(performance.now() - start)}ms`,
    );
  } catch (e) {
    console.error("[photo] decode failed:", e);
    throw e;
  }

  const { naturalWidth: w, naturalHeight: h } = img;
  if (!w || !h) throw new Error("decoded image has no dimensions");

  const scale = Math.min(1, WORK_MAX / Math.max(w, h));
  const dw = Math.max(1, Math.round(w * scale));
  const dh = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement("canvas");
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("canvas 2D context unavailable on this device");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, dw, dh);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  try {
    ctx.drawImage(img, 0, 0, dw, dh);
  } catch (e) {
    console.error("[photo] canvas drawImage failed:", e);
    throw e;
  }

  let dataUrl: string;
  try {
    dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } catch (e) {
    console.error("[photo] toDataURL failed:", e);
    throw e;
  }
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/jpeg")) {
    const err = new Error("JPEG encoding failed on this device");
    console.error("[photo]", err.message, dataUrl?.slice(0, 24));
    throw err;
  }
  console.info(
    "[photo] done",
    `${Math.round(performance.now() - start)}ms`,
    dataUrl.length,
    "chars",
  );
  return dataUrl;
}

export function bitmapToDataUrl(
  bmp: ImageBitmap,
  max: number,
  quality = 0.85,
): string {
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(bmp, 0, 0, w, h);
  return c.toDataURL("image/jpeg", quality);
}

export function canvasThumbDataUrl(
  canvas: HTMLCanvasElement,
  max = 360,
): string {
  const scale = Math.min(1, max / Math.max(canvas.width, canvas.height));
  const w = Math.round(canvas.width * scale);
  const h = Math.round(canvas.height * scale);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(canvas, 0, 0, w, h);
  return c.toDataURL("image/jpeg", 0.85);
}

export async function bitmapFromDataUrl(url: string): Promise<ImageBitmap> {
  const blob = await (await fetch(url)).blob();
  const img = await decodeViaImage(blob);
  const c = document.createElement("canvas");
  c.width = img.naturalWidth || 1;
  c.height = img.naturalHeight || 1;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  ctx.drawImage(img, 0, 0);
  if (typeof createImageBitmap === "function") return createImageBitmap(c);
  throw new Error("createImageBitmap is unavailable");
}
