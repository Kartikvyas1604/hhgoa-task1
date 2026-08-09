/**
 * Small outline icon set for the card back's social row. lucide-react (this
 * project's icon dependency) doesn't ship brand glyphs in the installed
 * version, so these are minimal hand-authored outlines matching lucide's
 * own stroke language (round caps/joins, ~2px stroke at 24px) — kept simple
 * since they render small, back-of-card only.
 */

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const commonProps = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
});

export function XIcon({ size = 24, color = "currentColor" }: IconProps) {
  return (
    <svg {...commonProps(size)} fill="none">
      <path
        fill={color}
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      />
    </svg>
  );
}

export function InstagramIcon({ size = 24, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...commonProps(size)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="0.9" fill={color} stroke="none" />
    </svg>
  );
}

export function GithubIcon({ size = 24, color = "currentColor" }: IconProps) {
  return (
    <svg {...commonProps(size)} fill="none">
      <path
        fill={color}
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.833.092-.647.35-1.088.636-1.338-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.747-1.026 2.747-1.026.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.749 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export function LinkedinIcon({ size = 24, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...commonProps(size)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="2.5" width="19" height="19" rx="4" />
      <line x1="7.2" y1="10" x2="7.2" y2="16.5" />
      <circle cx="7.2" cy="7" r="0.35" fill={color} stroke={color} />
      <path d="M11 16.5v-4.2c0-1.4 1-2.3 2.3-2.3 1.3 0 2.2.9 2.2 2.3v4.2" />
      <line x1="11" y1="10" x2="11" y2="16.5" />
    </svg>
  );
}
