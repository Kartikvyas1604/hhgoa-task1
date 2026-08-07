import { ensureFonts } from "@/components/frame/compose";

export function isHeic(file: File): boolean {
  return /heic|heif/i.test(file.type) || /\.heic$/i.test(file.name);
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
  return createImageBitmap(src);
}

export function processPhoto(file: File): Promise<ImageBitmap> {
  return Promise.all([ensureFonts(), fileToBitmap(file)]).then(([, bmp]) => bmp);
}
