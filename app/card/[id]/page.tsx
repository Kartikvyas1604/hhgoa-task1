import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getCard } from "@/lib/cards";
import { Card3D } from "@/components/Card3D";
import { CardPageActions } from "@/components/CardPageActions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const card = await getCard(id);
  if (!card) return { title: "Card not found — FrameInGoa" };

  const title = `${card.name || "A builder"}'s HH Goa 2026 card`;
  const description = `Made with FrameInGoa for HACKER गोवा HOUSE — #FrameInGoa`;
  return {
    title,
    description,
    openGraph: { title, description, siteName: "FrameInGoa", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CardPage({ params }: PageProps) {
  const { id } = await params;
  const card = await getCard(id);
  if (!card) notFound();

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-14 text-center sm:px-6 sm:py-20">
      <p className="font-mono text-[11px] tracking-[0.25em] text-[var(--text-cream)]/60">
        HH GOA 2026 · BUILDER #{card.builder_number}
      </p>
      <h1 className="text-stamp mt-3 font-display text-3xl font-black tracking-tight sm:text-4xl">
        {card.name ? `${card.name}'s Builder card.` : "A Builder card."}
      </h1>
      {card.role && (
        <p className="mt-1 font-mono text-sm text-[var(--text-cream)]/70">{card.role}</p>
      )}

      <Card3D
        imageUrl={card.portrait_url}
        backImageUrl={card.portrait_back_url ?? undefined}
        className="mt-8 h-[55vh] w-full max-w-[440px]"
      />
      <p className="mt-1 font-mono text-[11px] tracking-wide text-[var(--text-cream)]/50">drag to spin</p>

      <div className="mt-8">
        <CardPageActions
          portraitUrl={card.portrait_url}
          landscapeUrl={card.landscape_url}
          cardPath={`/card/${id}`}
          name={card.name}
          role={card.role}
          fileName={`frameingoa-${id}.png`}
        />
      </div>

      <Link
        href="/"
        className="stamp-press mt-6 flex h-11 items-center gap-2 rounded-md border-2 border-[var(--accent-mustard)]/50 px-5 font-mono text-xs font-bold tracking-wide text-[var(--accent-mustard)] transition-colors duration-150 hover:border-[var(--accent-mustard)]"
      >
        make your own card
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </section>
  );
}
