const PETALS = [-144, -72, 0, 72, 144];

export function Flower({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={`h-4 w-4 ${className}`}
    >
      {PETALS.map((a) => (
        <ellipse
          key={a}
          cx="16"
          cy="7"
          rx="6.5"
          ry="8"
          transform={`rotate(${a} 16 16)`}
          fill="#e8348e"
          stroke="#14150f"
          strokeWidth="1.6"
        />
      ))}
      <circle
        cx="16"
        cy="16"
        r="4.2"
        fill="#f4d03f"
        stroke="#14150f"
        strokeWidth="1.6"
      />
    </svg>
  );
}
