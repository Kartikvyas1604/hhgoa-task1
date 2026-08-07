"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { FrameGenerator } from "@/components/FrameGenerator";
import { DuskBackdrop } from "@/components/DuskBackdrop";

export function HomeHero() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.matchMedia();
    ctx.add("(prefers-reduced-motion: no-preference)", () => {
      const els = gsap.utils.toArray<HTMLElement>("[data-hero]");
      gsap.timeline({ defaults: { duration: 0.7, ease: "power3.out" } }).from(
        els,
        {
          y: 26,
          opacity: 0,
          stagger: 0.08,
        },
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative overflow-hidden">
      <DuskBackdrop />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-14 lg:pb-28">
        <div className="max-w-2xl">
          <p
            data-hero
            className="font-mono text-[11px] tracking-[0.22em] text-sunset sm:text-xs"
          >
            HH GOA 2026 · GOA, INDIA · 28–31 OCT 2026
          </p>
          <h1
            data-hero
            className="mt-4 font-display text-5xl font-bold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl"
          >
            Frame your
            <br />
            Goa era.
          </h1>
          <p
            data-hero
            className="mt-5 max-w-lg text-lg leading-relaxed text-ink/85 sm:text-xl"
          >
            Upload a photo, get a branded HH Goa 2026 PFP frame or Builder ID
            card in seconds. No sign-up, no servers — it happens in your
            browser, before your chai gets cold.
          </p>
        </div>
        <div data-hero className="mx-auto mt-8 w-full max-w-xl sm:mt-10">
          <FrameGenerator />
        </div>
      </div>
    </section>
  );
}
