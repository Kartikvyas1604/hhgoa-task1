import { ensureFonts } from "@/components/frame/compose";

export function isHeic(file: File): boolean {
  return /heic|heif/i.test(file.type) || /\.heic$/i.test(file.name);
}

async function decodeToBitmap(src: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(src);
  } catch {
    // Older Safari / edge cases: fall back to an <img> → canvas decode,
    // which also applies EXIF orientation before rasterising.
    const url = URL.createObjectURL(src);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("image decode failed"));
        img.src = url;
      });
      const c = document.createElement("canvas");
      c.width = img.naturalWidth || 1;
      c.height = img.naturalHeight || 1;
      const ctx = c.getContext("2d");
      if (!ctx) throw new Error("no 2d context");
      ctx.drawImage(img, 0, 0);
      return await createImageBitmap(c);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

export async function fileToBitmap(file: File): Promise<ImageBitmap> {
  let src: Blob = file;
  if (isHeic(file)) {
    const { default: heic2any } = await import("heic2any");
    const out = (await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.92,
    })) as Blob;
    src = out;
  }
  return decodeToBitmap(src);
}

export function processPhoto(file: File): Promise<ImageBitmap> {
  return Promise.all([ensureFonts(), fileToBitmap(file)]).then(([, bmp]) => bmp);
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
  return createImageBitmap(blob);
}
