import Link from "next/link";
import { PalmTrees } from "@/components/PalmTrees";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t-2 border-[var(--accent-mustard)]/25 bg-[var(--bg-jungle)]">
      <div className="mx-auto w-full max-w-6xl px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-2xl font-black tracking-tight text-[var(--accent-mustard)]">
              Less Noise. More Signal.
            </p>
            <p className="mt-2 max-w-sm font-mono text-xs leading-relaxed text-[var(--text-cream)]/70">
              HH GOA 2026 · GOA, INDIA · 28–31 OCT 2026
              <br />
              #FRAMEINGOA
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-col gap-2 font-mono text-xs text-[var(--text-cream)]/70">
            <Link href="/" className="transition-colors duration-150 hover:text-[var(--accent-mustard)]">
              /frame-generator
            </Link>
          </nav>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-[var(--accent-mustard)]/20 pt-4">
          <p className="font-mono text-[10px] text-[var(--text-cream)]/50">
            © 2026 FrameInGoa
          </p>
          <p className="font-mono text-[10px] text-[var(--text-cream)]/50">HH Goa 2026</p>
        </div>
      </div>

      <div className="flex justify-center bg-[#08683a] py-2 sm:py-3">
        <PalmTrees className="h-[64px] w-auto sm:h-[86px] lg:h-[100px]" />
      </div>
    </footer>
  );
}
