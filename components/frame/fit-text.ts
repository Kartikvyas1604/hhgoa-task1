let sharedCtx: CanvasRenderingContext2D | null = null;

function measureCtx(): CanvasRenderingContext2D {
  if (!sharedCtx) {
    sharedCtx = document.createElement("canvas").getContext("2d")!;
  }
  return sharedCtx;
}

/** Overestimates letter-spacing's contribution to width — canvas ignores CSS
 * letter-spacing entirely, so we add it back in per character, one extra
 * time, as a safety margin against undershooting the real rendered width. */
function measureWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
  fontFamily: string,
  weight: number,
  letterSpacingEm: number,
): number {
  ctx.font = `${weight} ${fontSize}px ${fontFamily}`;
  return ctx.measureText(text).width + letterSpacingEm * fontSize * text.length;
}

/**
 * Steps font-size down in `step`px increments from `startSize` until `text`
 * fits within `maxWidth`, or `minSize` is reached. Used to keep name/role
 * inside their template slot instead of overflowing into the wordmark,
 * barcode, or QR art around them.
 */
export function fitFontSize(opts: {
  text: string;
  startSize: number;
  maxWidth: number;
  fontFamily: string;
  weight: number;
  letterSpacingEm: number;
  minSize?: number;
  step?: number;
}): number {
  const { text, startSize, maxWidth, fontFamily, weight, letterSpacingEm, minSize = 14, step = 2 } = opts;
  if (!text) return startSize;
  const ctx = measureCtx();
  let size = startSize;
  while (size > minSize) {
    const w = measureWidth(ctx, text, size, fontFamily, weight, letterSpacingEm);
    if (w <= maxWidth) return size;
    size -= step;
  }
  return minSize;
}
