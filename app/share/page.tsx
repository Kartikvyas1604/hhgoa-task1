import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

interface ShareParams {
  orientation: "portrait" | "landscape";
  side: "front" | "back";
  name: string;
  role: string;
}

function clean(value: string | string[] | undefined, max: number): string {
  const v = Array.isArray(value) ? value[0] : value;
  return (v ?? "").slice(0, max);
}

async function readParams(searchParams: {
  [key: string]: string | string[] | undefined;
}): Promise<ShareParams> {
  return {
    orientation: searchParams.orientation === "landscape" ? "landscape" : "portrait",
    side: searchParams.side === "back" ? "back" : "front",
    name: clean(searchParams.name, 30),
    role: clean(searchParams.role, 30),
  };
}

function ogQuery(p: ShareParams): string {
  const sp = new URLSearchParams();
  sp.set("orientation", p.orientation);
  sp.set("side", p.side);
  if (p.name) sp.set("name", p.name);
  if (p.role) sp.set("role", p.role);
  return sp.toString();
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const p = await readParams(await searchParams);
  const title = `${p.name ? `${p.name} — ` : ""}HH Goa 2026 Builder Card`;
  const description = `A HH Goa 2026 Builder card (${p.orientation}, ${p.side}) made with #FrameInGoa.`;
  const imgUrl = `/og?${ogQuery(p)}`;
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

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-14 text-center sm:px-6 sm:py-20">
      <p className="font-mono text-[11px] tracking-[0.25em] text-[var(--text-cream)]/60">
        HH GOA 2026 · BUILDER CARD · {p.orientation.toUpperCase()}
      </p>
      <h1 className="text-stamp mt-3 font-display text-3xl font-black tracking-tight sm:text-4xl">
        {p.name ? `${p.name}'s card is ready.` : "A Builder card is ready."}
      </h1>
      <p className="mt-2 max-w-md font-mono text-[13px] leading-relaxed text-[var(--text-cream)]/70">
        Made with FrameInGoa for HACKER गोवा HOUSE — pull the PNG or make your own.
      </p>

      {/* eslint-disable-next-line @next/next/no-img-element -- OG-rendered preview, not optimisable */}
      <img
        src={`/og?${ogQuery(p)}`}
        alt={`Builder card preview for ${p.name || "a builder"}`}
        className="mt-8 w-full max-w-[420px] overflow-hidden rounded-xl border-2 border-[var(--accent-mustard)]/40"
      />

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="stamp-press flex h-11 items-center gap-2 rounded-md bg-[var(--accent-mustard)] px-5 font-mono text-xs font-bold tracking-wide text-[var(--ink-black)]"
        >
          make yours
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
