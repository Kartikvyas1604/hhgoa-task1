import { getCard } from "@/lib/cards";

export const dynamic = "force-dynamic";
export const contentType = "image/png";
export const size = { width: 1200, height: 675 };

export default async function OpengraphImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const card = await getCard(id);

  if (!card) {
    return new Response("Not found", { status: 404 });
  }

  // the landscape PNG is already the exact, final, composited graphic —
  // serve it straight through instead of re-rendering anything.
  const res = await fetch(card.landscape_url);
  const bytes = await res.arrayBuffer();
  return new Response(bytes, { headers: { "content-type": "image/png" } });
}
