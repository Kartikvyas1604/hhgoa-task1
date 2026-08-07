import Link from "next/link";
import { PalmTrees } from "@/components/PalmTrees";

export function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-line">
      <div className="mx-auto w-full max-w-6xl px-4 pb-4 pt-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-2xl font-bold tracking-tight">
              Less Noise. More Signal.
            </p>
            <p className="mt-2 max-w-sm font-mono text-xs leading-relaxed text-muted">
              HH Goa 2026 · GOA, INDIA · 28–31 OCT 2026
              <br />
              For the developers who live in their terminals.
            </p>
          </div>
          <nav
            aria-label="Footer"
            className="flex flex-col gap-2 font-mono text-xs text-muted"
          >
            <Link href="/" className="transition-colors duration-150 hover:text-ink">
              /frame-generator
            </Link>
            <Link href="/swag" className="transition-colors duration-150 hover:text-ink">
              /swag-tee
            </Link>
            <span className="text-muted/70">#FrameInGoa</span>
          </nav>
        </div>
        <div className="mt-10 flex items-center justify-between border-t border-line pt-4">
          <p className="font-mono text-[10px] text-muted/70">
            © 2026 FrameInGoa · built on the beach
          </p>
          <p className="font-mono text-[10px] text-muted/70">
            HH Goa 2026
          </p>
        </div>
      </div>
      <PalmTrees className="opacity-90" />
    </footer>
  );
}
