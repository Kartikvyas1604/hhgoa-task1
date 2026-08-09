import type { Orientation, Side } from "@/components/frame/types";

/**
 * The exact 8-lobe scalloped-flower photo mask, extracted verbatim from the
 * real card art (Card.svg / Portrait.svg / their back variants). Same shape
 * in all four layouts, just scaled + translated — so one path is reused via
 * a group transform instead of four near-duplicate path strings.
 *
 * Reference (canonical) box: viewBox "350 154 500 500", the Portrait front
 * mask, straight from the source file.
 */
export const PHOTO_MASK_PATH =
  "M600 154C559.959 154 527.5 186.459 527.5 226.5V228.969L525.754 227.223C497.441 198.91 451.536 198.91 423.223 227.223C394.91 255.536 394.91 301.441 423.223 329.754L424.97 331.5H422.5C382.459 331.5 350 363.959 350 404C350 444.041 382.459 476.5 422.5 476.5H424.969L423.223 478.246C394.91 506.559 394.91 552.464 423.223 580.777C451.536 609.09 497.441 609.09 525.754 580.777L527.5 579.03V581.5C527.5 621.541 559.959 654 600 654C640.041 654 672.5 621.541 672.5 581.5V579.03L674.246 580.777C702.559 609.09 748.464 609.09 776.777 580.777C805.09 552.464 805.09 506.559 776.777 478.246L775.031 476.5H777.5C817.541 476.5 850 444.041 850 404C850 363.959 817.541 331.5 777.5 331.5H775.03L776.777 329.754C805.09 301.441 805.09 255.536 776.777 227.223C748.464 198.91 702.559 198.91 674.246 227.223L672.5 228.969V226.5C672.5 186.459 640.041 154 600 154Z";

/** Canonical reference: centre + radius (tip-to-tip) of PHOTO_MASK_PATH. */
export const PHOTO_MASK_REF = { cx: 600, cy: 404, size: 500 };

/** viewBox that frames PHOTO_MASK_PATH tightly — for standalone use (e.g. the upload dropzone). */
export const PHOTO_MASK_VIEWBOX = "350 154 500 500";

export interface MaskBox {
  cx: number;
  cy: number;
  size: number;
}

/**
 * Exact mask center + size per orientation/side, read directly off the
 * source SVGs (Card.svg, Card = Back.svg, Portrait.svg, Portrait = Back.svg)
 * — not eyeballed. Card viewBoxes: landscape 1200x675, portrait 1200x1623.
 */
export const MASK_BOX: Record<Orientation, Record<Side, MaskBox>> = {
  landscape: {
    front: { cx: 600, cy: 265, size: 320 },
    back: { cx: 205.333, cy: 265, size: 320 },
  },
  portrait: {
    front: { cx: 600, cy: 404, size: 500 },
    back: { cx: 600, cy: 460.975, size: 500 },
  },
};

/** Group transform mapping the canonical path onto a given mask box. */
export function maskTransform(box: MaskBox): string {
  const scale = box.size / PHOTO_MASK_REF.size;
  return `translate(${box.cx} ${box.cy}) scale(${scale}) translate(${-PHOTO_MASK_REF.cx} ${-PHOTO_MASK_REF.cy})`;
}

/** Declares the reusable clipPath once; pair with `clipPath: url(#${id})`. */
export function PhotoMaskDefs({ id, box }: { id: string; box: MaskBox }) {
  return (
    <defs>
      <clipPath id={id} clipPathUnits="userSpaceOnUse">
        <path d={PHOTO_MASK_PATH} transform={maskTransform(box)} />
      </clipPath>
    </defs>
  );
}
