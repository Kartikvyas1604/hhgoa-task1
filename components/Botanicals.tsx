interface FloralBorderProps {
  className?: string;
  bloom?: boolean;
}

/**
 * FloralBorder — the real card's bottom border (bougainvillea + marigold +
 * monstera), cropped straight from the source illustration. Closes out the
 * homepage and the result screen, mirroring the card's own bottom edge.
 */
export function FloralBorder({ className = "", bloom = false }: FloralBorderProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static raster crop
    <img
      src="/assets/floral-border.png"
      alt=""
      aria-hidden="true"
      loading="lazy"
      className={`pointer-events-none block w-full object-cover ${bloom ? "floral-bloom" : ""} ${className}`}
    />
  );
}
