/** Simple deterministic string hash — stable across renders for the same input. */
export function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const BUILDER_TOTAL = 321;

/** `#123/321` — stable per name+role, matches the card's builder-number stamp. */
export function builderNumber(seed: string): string {
  const n = (hashString(seed || "builder") % BUILDER_TOTAL) + 1;
  return `#${n}/${BUILDER_TOTAL}`;
}

interface BarcodeProps {
  seed: string;
  width: number;
  height: number;
  color?: string;
  x?: number;
  y?: number;
}

/**
 * Decorative bar-code stripe — a deterministic sequence of bar widths seeded
 * from the builder string. Purely visual, matching the card's "BUILDER #"
 * stripe; it was never meant to scan.
 */
export function Barcode({
  seed,
  width,
  height,
  color = "#F4D03F",
  x = 0,
  y = 0,
}: BarcodeProps) {
  let h = hashString(seed);
  const bars: { bx: number; bw: number }[] = [];
  let cursor = 0;
  while (cursor < width) {
    h = (h * 1103515245 + 12345) >>> 0;
    const bw = 2 + (h % 5);
    h = (h * 1103515245 + 12345) >>> 0;
    const gap = 1 + (h % 4);
    if (h % 3 !== 0) {
      bars.push({ bx: cursor, bw });
    }
    cursor += bw + gap;
  }
  return (
    <g>
      {bars.map((b, i) => (
        <rect
          key={i}
          x={x + b.bx}
          y={y}
          width={b.bw}
          height={height}
          fill={color}
        />
      ))}
    </g>
  );
}
