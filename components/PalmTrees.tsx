const FILL = "#f4d03f";
const STROKE = "#14150f";
const SW = 4;

/* Droopy leaf, base length 350 (scaled per frond). Body arches above origin,
   tip hangs below — tips of the steepest fronds stay inside the viewBox. */
const FROND = "M0,0 C40,-58 210,-92 350,-40 C230,40 90,34 0,0 Z";

/* Steep fronds are shorter so the crown fits the band without clipping. */
const FRONDS = [
  { a: -75, l: 142 },
  { a: -60, l: 147 },
  { a: -45, l: 168 },
  { a: -30, l: 220 },
  { a: -15, l: 260 },
  { a: 0, l: 260 },
  { a: 15, l: 260 },
  { a: 30, l: 220 },
  { a: 45, l: 168 },
  { a: 60, l: 147 },
  { a: 75, l: 142 },
];

function Palm({
  cx,
  cy = 150,
  s = 1,
  flip = false,
}: {
  cx: number;
  cy?: number;
  s?: number;
  flip?: boolean;
}) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${flip ? -s : s} ${s})`}>
      <path
        d="M0,0 C18,90 4,180 0,300"
        fill="none"
        stroke={STROKE}
        strokeWidth={30}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M0,0 C18,90 4,180 0,300"
        fill="none"
        stroke={FILL}
        strokeWidth={22}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {FRONDS.map((f) => (
        <path
          key={f.a}
          d={FROND}
          fill={FILL}
          stroke={STROKE}
          strokeWidth={SW}
          strokeLinejoin="round"
          transform={`rotate(${f.a}) scale(${f.l / 350})`}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <circle
        cx="0"
        cy="-6"
        r="9"
        fill={FILL}
        stroke={STROKE}
        strokeWidth={SW}
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx="-15"
        cy="8"
        r="7"
        fill={FILL}
        stroke={STROKE}
        strokeWidth={SW}
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx="15"
        cy="8"
        r="7"
        fill={FILL}
        stroke={STROKE}
        strokeWidth={SW}
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}

function Bush({ x, s = 1 }: { x: number; s?: number }) {
  return (
    <path
      d={`M${x},300 C${x - 42 * s},270 ${x + 42 * s},270 ${x},300 Z`}
      fill={FILL}
      stroke={STROKE}
      strokeWidth={SW}
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
    />
  );
}

export function PalmTrees({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 300"
      preserveAspectRatio="none"
      className={`pointer-events-none block h-[150px] w-full sm:h-[210px] ${className}`}
    >
      <Palm cx={60} />
      <Palm cx={1380} flip />
      <Palm cx={730} cy={170} s={0.6} />
      <Bush x={312} />
      <Bush x={640} s={0.75} />
      <Bush x={884} s={0.85} />
      <Bush x={1204} />
    </svg>
  );
}
