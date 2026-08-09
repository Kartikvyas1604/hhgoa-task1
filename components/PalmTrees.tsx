/**
 * PalmTrees — the real hhgoa.com palm-tree + floral-border illustration.
 * The source art is a wide 1440×887 banner with palms on both edges and a
 * floral border only along the very bottom, so it's rendered full-width and
 * cropped (object-cover, anchored bottom) to read as a proper border strip —
 * sizing by height alone would shrink the whole banner, dead space included.
 */
export function PalmTrees({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static vectorized SVG
    <img
      src="/assets/real-footer-trees.svg"
      alt=""
      aria-hidden="true"
      className={`pointer-events-none block h-full w-full object-cover object-bottom ${className}`}
    />
  );
}
