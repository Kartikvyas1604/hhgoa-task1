/**
 * PalmTrees — the real hhgoa.com palm-tree + floral-border illustration,
 * shown at its natural aspect ratio (never cropped). Sized by height only —
 * pass a height (e.g. "h-[90px]") via className and width follows automatically.
 */
export function PalmTrees({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static vectorized SVG
    <img
      src="/assets/real-footer-trees.svg"
      alt=""
      aria-hidden="true"
      className={`pointer-events-none block w-auto ${className}`}
    />
  );
}
