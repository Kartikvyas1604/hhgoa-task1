import type { Metadata } from "next";
import { Timer, Upload, WandSparkles } from "lucide-react";
import { HomeHero } from "@/components/HomeHero";

export const metadata: Metadata = {
  title: "Builder Card Generator",
  description:
    "Upload a photo, get your own HH Goa 2026 Builder card — front, back, portrait or landscape. Download or share to X.",
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
    title: "Fill it in",
    body: "Name, role, socials — the same fields as the real card, nothing more.",
  },
  {
    icon: Timer,
    n: "03",
    title: "Share",
    body: "Download the PNG or share straight to X — front, back, portrait or landscape.",
  },
];

export default function Home() {
  return (
    <>
      <HomeHero />

      <section className="mx-auto w-full max-w-6xl px-4 pt-4 pb-16 sm:px-6 sm:pt-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="rounded-lg border-2 border-[var(--accent-mustard)]/35 bg-[var(--bg-jungle-deep)] p-5 sm:p-6"
            >
              <div className="flex items-center justify-between">
                <s.icon aria-hidden="true" className="h-5 w-5 text-[var(--accent-mustard)]" />
                <span className="font-mono text-xs text-[var(--text-cream)]/50">{s.n}</span>
              </div>
              <h2 className="mt-4 font-display text-xl font-black tracking-tight text-[var(--accent-mustard)]">
                {s.title}
              </h2>
              <p className="mt-2 font-mono text-[12.5px] leading-relaxed text-[var(--text-cream)]/70">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
