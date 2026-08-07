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
