import type { Metadata } from "next";
import { Timer, Upload, WandSparkles } from "lucide-react";
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

      {/* footer margin trees */}
      <div className="mt-20">
        <PalmTrees className="mx-auto w-full max-w-6xl" />
      </div>
    </>
  );
}
