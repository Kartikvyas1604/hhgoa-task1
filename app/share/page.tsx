import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

const VARIANT_LABELS: Record<string, string> = {
  sunset: "Sunset",
  jade: "Jade",
  monsoon: "Monsoon",
};

interface ShareParams {
  format: "pfp" | "card";
  variant: string;
  name: string;
  role: string;
  img: string;
}

function clean(value: string | string[] | undefined, max: number): string {
  const v = Array.isArray(value) ? value[0] : value;
  return (v ?? "").slice(0, max);
}

async function readParams(searchParams: {
  [key: string]: string | string[] | undefined;
}): Promise<ShareParams> {
  return {
    format: searchParams.format === "card" ? "card" : "pfp",
    variant: clean(searchParams.variant, 16) || "sunset",
    name: clean(searchParams.name, 26),
    role: clean(searchParams.role, 32),
    img: clean(searchParams.img, 12_000),
  };
}

function ogQuery(p: ShareParams, withImg: boolean): string {
  const sp = new URLSearchParams();
  sp.set("format", p.format);
  sp.set("variant", p.variant);
  if (p.name) sp.set("name", p.name);
  if (p.role) sp.set("role", p.role);
  if (withImg && p.img.startsWith("data:image/")) sp.set("img", p.img);
  return sp.toString();
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const p = await readParams(await searchParams);
  const label = p.format === "pfp" ? "PFP frame" : "Builder ID card";
  const title = `${p.name ? `${p.name} — ` : ""}HH Goa 2026 ${label}`;
  const description = `A ${VARIANT_LABELS[p.variant] ?? "Sunset"} HH Goa 2026 ${label.toLowerCase()} made with #FrameInGoa.`;
  const imgUrl = `/og?${ogQuery(p, false)}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "FrameInGoa",
      type: "website",
      images: [{ url: imgUrl, width: 1200, height: 630, alt: description }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imgUrl],
    },
  };
}

export default async function SharePage({ searchParams }: PageProps) {
  const p = await readParams(await searchParams);
  const variantLabel = VARIANT_LABELS[p.variant] ?? "Sunset";
  const frameLabel = p.format === "pfp" ? "PFP FRAME" : "BUILDER ID";

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-12 text-center sm:px-6 sm:py-20">
      <p className="font-mono text-[11px] tracking-[0.25em] text-muted">
        HH GOA 2026 · {frameLabel} · {variantLabel.toUpperCase()}
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {p.name ? `${p.name}'s frame is ready.` : "Your frame is ready."}
      </h1>
      <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted">
        Framed in the terminal, shared from the beach — pull the PNG or make
        your own.
      </p>

      {/* eslint-disable-next-line @next/next/no-img-element -- OG-rendered frame, not optimisable */}
      <img
        src={`/og?${ogQuery(p, true)}`}
        alt={`${frameLabel.toLowerCase()} for ${p.name || "a builder"}`}
        className="mt-8 w-full max-w-[340px] overflow-hidden rounded-xl border border-line"
      />

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <a
          href={`/og?${ogQuery(p, true)}`}
          download={`frameingoas-${p.format}.png`}
          className="flex h-11 items-center gap-2 rounded-md border border-line bg-void/60 px-5 font-mono text-xs font-bold tracking-wide text-ink transition-colors duration-100 hover:border-ink/40"
        >
          download png
        </a>
        <Link
          href="/"
          className="cta-scan flex h-11 items-center gap-2 rounded-md bg-terminal px-5 font-mono text-xs font-bold tracking-wide text-void transition-colors duration-100 hover:bg-[#9cffba]"
        >
          make yours
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
