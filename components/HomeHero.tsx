"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { FrameGenerator } from "@/components/FrameGenerator";

export function HomeHero() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.matchMedia();
    ctx.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from("[data-hero-kicker]", { y: 16, opacity: 0, duration: 0.5 })
        .from(
          "[data-hero-headline]",
          { scale: 1.08, opacity: 0, duration: 0.55, ease: "back.out(1.8)" },
          "-=0.2",
        )
        .from("[data-hero-sub]", { y: 20, opacity: 0, duration: 0.5 }, "-=0.25")
        .from("[data-hero-gen]", { y: 26, opacity: 0, duration: 0.6 }, "-=0.25");
    });
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      className="relative overflow-hidden bg-[var(--bg-jungle)] bg-[url('/assets/sunrise.svg')] bg-cover bg-bottom bg-no-repeat"
    >
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14 sm:pb-32 lg:pb-40">
        <div className="mx-auto max-w-2xl text-center">
          <p
            data-hero-kicker
            className="font-mono text-[10px] tracking-[0.1em] text-[var(--accent-mustard)] sm:text-xs sm:tracking-[0.22em]"
          >
            HH GOA 2026 · GOA, INDIA · 28–31 OCT 2026
          </p>

          <h1
            data-hero-headline
            className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-display text-[13vw] font-black leading-[0.95] tracking-tight text-[var(--accent-mustard)] sm:text-6xl lg:text-7xl"
          >
            <span>Frame your</span>
            {/* eslint-disable-next-line @next/next/no-img-element -- static SVG asset, the card's own गोवा badge */}
            <img src="/assets/goa-hindi.svg" alt="गोवा" className="h-[0.85em] w-auto" />
            <span>era.</span>
          </h1>

          <p
            data-hero-sub
            className="mx-auto mt-5 max-w-lg text-balance text-[15px] leading-relaxed text-[var(--text-cream)]/85 sm:text-lg"
          >
            Upload a photo, fill in your details, get your own HH Goa 2026
            Builder card — front, back, portrait or landscape. Nothing
            leaves your browser.
          </p>
        </div>

        <div data-hero-gen className="mx-auto mt-10 w-full max-w-2xl sm:mt-12">
          <FrameGenerator />
        </div>
      </div>
    </section>
  );
}
