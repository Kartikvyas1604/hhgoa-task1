import type { Metadata } from "next";
import Link from "next/link";
import { Shirt, Timer, Upload, WandSparkles } from "lucide-react";
import { HomeHero } from "@/components/HomeHero";
import { PalmTrees } from "@/components/PalmTrees";

export const metadata: Metadata = {
  title: "Frame & ID Card Generator",
  description:
    "Upload a photo, get a branded HH Goa 2026 PFP frame or Builder ID card in seconds. Download or share to X with #FrameInGoa.",
};

const steps = [
  {
    icon: Upload,
    n: "01",
    title: "Upload",
    body: "Drop a JPG, PNG or HEIC. iPhones convert automatically, on-device.",
  },
  {
    icon: WandSparkles,
    n: "02",
    title: "Frame",
    body: "We smart-crop to the frame — never stretch. PFP or Builder ID, your call.",
  },
  {
    icon: Timer,
    n: "03",
    title: "Share",
    body: "Download the PNG or share straight to X with #FrameInGoa pre-filled.",
  },
];

export default function Home() {
  return (
    <>
      <HomeHero />

      {/* how it works */}
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="bg-panel p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <s.icon aria-hidden="true" className="h-5 w-5 text-sunset" />
                <span className="font-mono text-xs text-muted">{s.n}</span>
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold tracking-tight">
                {s.title}
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* swag callout */}
      <section className="mx-auto mt-16 w-full max-w-6xl px-4 sm:px-6">
        <Link
          href="/swag"
          className="group relative block overflow-hidden rounded-xl border border-line bg-panel p-8 sm:p-12"
        >
          <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-magenta/10 blur-3xl transition-colors duration-300 group-hover:bg-magenta/20" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <p className="font-mono text-[11px] tracking-[0.2em] text-magenta">
                SWAG LAB
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Spray-paint your own HH Goa tee.
              </h2>
              <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted">
                Pick a Goa pattern, spray a colour, stamp your name — then
                capture a flat shot and share it. No cart, no checkout. It&apos;s
                a social artifact, not merch.
              </p>
            </div>
            <span className="inline-flex h-12 w-fit items-center gap-2 rounded-md border border-line bg-void/60 px-5 font-mono text-xs font-bold tracking-wide text-ink transition-all duration-150 group-hover:border-magenta/50 group-hover:text-magenta">
              <Shirt aria-hidden="true" className="h-4 w-4" />
              Open the customizer
            </span>
          </div>
        </Link>
      </section>

      {/* footer margin trees */}
      <div className="mt-20">
        <PalmTrees className="mx-auto w-full max-w-6xl" />
      </div>
    </>
  );
}
