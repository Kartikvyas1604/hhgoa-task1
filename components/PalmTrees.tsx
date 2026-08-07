const FROND =
  "M0,0 C16,-12 40,-38 76,-42 C46,-29 22,-11 0,0 Z";

export function PalmTrees({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      className={`pointer-events-none block h-[60px] w-full sm:h-[90px] ${className}`}
    >
      {/* left tree */}
      <g transform="translate(180 118)" opacity="0.5">
        <path
          d="M0,0 C-8,-28 -2,-52 14,-70"
          fill="none"
          stroke="#f4efe6"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path d={FROND} fill="#f4efe6" transform="translate(14 -74) rotate(-28)" />
        <path d={FROND} fill="#f4efe6" transform="translate(14 -74) rotate(8)" />
        <path d={FROND} fill="#f4efe6" transform="translate(14 -74) rotate(44)" />
        <path d={FROND} fill="#f4efe6" transform="translate(14 -74) rotate(-62)" />
        <path d={FROND} fill="#f4efe6" transform="translate(14 -74) scale(0.8) rotate(-96)" />
      </g>

      {/* center-low tree */}
      <g transform="translate(760 120)" opacity="0.32">
        <path
          d="M0,0 C-12,-24 -4,-46 10,-62"
          fill="none"
          stroke="#f4efe6"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path d={FROND} fill="#f4efe6" transform="translate(10 -66) scale(0.9) rotate(-24)" />
        <path d={FROND} fill="#f4efe6" transform="translate(10 -66) scale(0.9) rotate(12)" />
        <path d={FROND} fill="#f4efe6" transform="translate(10 -66) scale(0.9) rotate(48)" />
        <path d={FROND} fill="#f4efe6" transform="translate(10 -66) scale(0.9) rotate(-60)" />
        <path d={FROND} fill="#f4efe6" transform="translate(10 -66) scale(0.72) rotate(-94)" />
      </g>

      {/* right tree */}
      <g transform="translate(1190 120)" opacity="0.42">
        <path
          d="M0,0 C6,-30 -2,-54 -18,-72"
          fill="none"
          stroke="#f4efe6"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path d={FROND} fill="#f4efe6" transform="translate(-18 -76) rotate(30)" />
        <path d={FROND} fill="#f4efe6" transform="translate(-18 -76) rotate(-6)" />
        <path d={FROND} fill="#f4efe6" transform="translate(-18 -76) rotate(-42)" />
        <path d={FROND} fill="#f4efe6" transform="translate(-18 -76) rotate(64)" />
        <path d={FROND} fill="#f4efe6" transform="translate(-18 -76) scale(0.8) rotate(98)" />
      </g>
    </svg>
  );
}
