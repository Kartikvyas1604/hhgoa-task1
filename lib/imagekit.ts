import "server-only";
import ImageKit from "@imagekit/nodejs";

let client: ImageKit | null = null;

/** Null when ImageKit env vars aren't set yet — callers should degrade
 * gracefully (client-side share flow keeps working without a backend). */
function getImageKit(): ImageKit | null {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) return null;
  if (!client) client = new ImageKit({ privateKey });
  return client;
}

export function imageKitConfigured(): boolean {
  return Boolean(process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_URL_ENDPOINT);
}

/** Uploads a data-URL PNG under /frameingoa/cards/{cardId}/{name}.png,
 * returns the public CDN URL. Throws if ImageKit isn't configured — check
 * `imageKitConfigured()` first. */
export async function uploadCardImage(opts: {
  cardId: string;
  name: "portrait" | "portrait-back" | "landscape";
  dataUrl: string;
}): Promise<string> {
  const ik = getImageKit();
  if (!ik) throw new Error("ImageKit is not configured");
  const res = await ik.files.upload({
    file: opts.dataUrl,
    fileName: `${opts.name}.png`,
    folder: `/frameingoa/cards/${opts.cardId}`,
    useUniqueFileName: false,
  });
  if (!res.url) throw new Error("ImageKit upload returned no URL");
  return res.url;
}
