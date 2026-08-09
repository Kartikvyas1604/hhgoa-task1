import type { Orientation, Side } from "@/components/frame/types";
import { CARD_SIZE } from "@/components/frame/types";

/**
 * Every non-mask coordinate the card needs, per orientation × side. Read
 * once here so `CardArt.tsx` (live DOM preview) and `export.ts` (canvas
 * rasterizer) draw from the exact same numbers — no drift between what you
 * see and what you download. Proportions follow the reference card art;
 * the mask box itself lives in `photo-mask.tsx` (extracted verbatim).
 */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CardLayout {
  size: { w: number; h: number };
  /** The real, final card artwork — background, borders, wordmark, palms,
   * everything except the user's photo and data — as one exact asset. The
   * transparent flower cut-out is where the photo shows through. */
  art: string;
  /** Rects painted over the art's baked sample data (name/role/QR/barcode/
   * socials) before the real dynamic content is drawn on top. */
  cover: Box[];
  /** Name / role, centered under the mask on front, left-aligned on back.
   * `maxWidth` is the widest the rendered text can get before auto-shrink
   * kicks in, sized to clear the wordmark/palm/barcode art around the slot. */
  name: { x: number; y: number; anchor: "start" | "middle"; size: number; maxWidth: number };
  role: { x: number; y: number; anchor: "start" | "middle"; size: number; maxWidth: number };
  /** Barcode + builder number (front only). */
  barcode: (Box & { labelY: number }) | null;
  /** QR code + scan label (front only). */
  qr: (Box & { labelX: number; labelY: number }) | null;
  /** Social rows (back only). */
  socials: { x: number; yStart: number; rowHeight: number; iconSize: number; fontSize: number } | null;
}

const LANDSCAPE_FRONT: CardLayout = {
  size: CARD_SIZE.landscape,
  art: "/assets/cards/card-landscape-front.svg",
  cover: [
    { x: 442, y: 437, w: 314, h: 114 }, // name / role
    { x: 876, y: 107, w: 237, h: 444 }, // barcode + builder + QR + caption
  ],
  name: { x: 600, y: 462, anchor: "middle", size: 40, maxWidth: 420 },
  role: { x: 600, y: 494, anchor: "middle", size: 19, maxWidth: 420 },
  barcode: { x: 980, y: 108, w: 156, h: 34, labelY: 158 },
  qr: { x: 980, y: 178, w: 130, h: 130, labelX: 980, labelY: 330 },
  socials: null,
};

const LANDSCAPE_BACK: CardLayout = {
  size: CARD_SIZE.landscape,
  art: "/assets/cards/card-landscape-back.svg",
  cover: [
    { x: 47, y: 437, w: 315, h: 114 }, // name / role
    { x: 532, y: 172, w: 528, h: 333 }, // socials
  ],
  name: { x: 205.333, y: 462, anchor: "middle", size: 36, maxWidth: 330 },
  role: { x: 205.333, y: 492, anchor: "middle", size: 18, maxWidth: 330 },
  barcode: null,
  qr: null,
  socials: { x: 660, yStart: 140, rowHeight: 58, iconSize: 26, fontSize: 21 },
};

const PORTRAIT_FRONT: CardLayout = {
  size: CARD_SIZE.portrait,
  art: "/assets/cards/card-portrait-front.svg",
  cover: [
    { x: 347, y: 676, w: 504, h: 166 }, // name / role
    { x: 653, y: 870, w: 327, h: 612 }, // barcode + builder + QR + caption
  ],
  name: { x: 600, y: 706, anchor: "middle", size: 58, maxWidth: 720 },
  role: { x: 600, y: 748, anchor: "middle", size: 26, maxWidth: 720 },
  barcode: { x: 866, y: 954, w: 244, h: 46, labelY: 1030 },
  qr: { x: 950, y: 1058, w: 160, h: 160, labelX: 1030, labelY: 1252 },
  socials: null,
};

const PORTRAIT_BACK: CardLayout = {
  size: CARD_SIZE.portrait,
  art: "/assets/cards/card-portrait-back.svg",
  cover: [
    { x: 347, y: 733, w: 504, h: 166 }, // name / role
    { x: 294, y: 978, w: 608, h: 405 }, // socials
  ],
  name: { x: 600, y: 762, anchor: "middle", size: 58, maxWidth: 720 },
  role: { x: 600, y: 804, anchor: "middle", size: 26, maxWidth: 720 },
  barcode: null,
  qr: null,
  socials: { x: 386, yStart: 900, rowHeight: 64, iconSize: 30, fontSize: 25 },
};

export const LAYOUT: Record<Orientation, Record<Side, CardLayout>> = {
  landscape: { front: LANDSCAPE_FRONT, back: LANDSCAPE_BACK },
  portrait: { front: PORTRAIT_FRONT, back: PORTRAIT_BACK },
};
