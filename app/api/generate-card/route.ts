import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getSupabase } from "@/lib/supabase";
import { imageKitConfigured, uploadCardImage } from "@/lib/imagekit";

export const runtime = "nodejs";

// generous ceiling on the base64 payload itself — the *source photo* is
    // capped at 25MB client-side; a composited PNG data URL (render scale) lands around
    // 6–15MB. Increase this if needed but test carefully.
    const MAX_DATA_URL_LENGTH = 40 * 1024 * 1024;

interface Body {
  name?: string;
  role?: string;
  socials?: Record<string, string | undefined>;
  portraitDataUrl?: string;
  portraitBackDataUrl?: string;
  landscapeDataUrl?: string;
}

function isPngDataUrl(v: unknown): v is string {
  return typeof v === "string" && v.startsWith("data:image/png;base64,") && v.length <= MAX_DATA_URL_LENGTH;
}

export async function POST(request: Request) {
  const supabase = getSupabase();
  if (!supabase || !imageKitConfigured()) {
    return NextResponse.json(
      { error: "Backend not configured — set the Supabase and ImageKit env vars to enable this." },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isPngDataUrl(body.portraitDataUrl) || !isPngDataUrl(body.landscapeDataUrl)) {
    return NextResponse.json({ error: "portraitDataUrl and landscapeDataUrl must be PNG data URLs" }, { status: 400 });
  }
  const hasBack = isPngDataUrl(body.portraitBackDataUrl);

  const name = (body.name ?? "").slice(0, 30);
  const role = (body.role ?? "").slice(0, 30);
  const socials = typeof body.socials === "object" && body.socials !== null ? body.socials : {};
  const id = nanoid(10);

  try {
    const [portraitUrl, portraitBackUrl, landscapeUrl] = await Promise.all([
      uploadCardImage({ cardId: id, name: "portrait", dataUrl: body.portraitDataUrl }),
      hasBack
        ? uploadCardImage({ cardId: id, name: "portrait-back", dataUrl: body.portraitBackDataUrl! })
        : Promise.resolve(null),
      uploadCardImage({ cardId: id, name: "landscape", dataUrl: body.landscapeDataUrl }),
    ]);

    const { data, error } = await supabase
      .from("cards")
      .insert({
        id,
        name,
        role,
        socials,
        portrait_url: portraitUrl,
        portrait_back_url: portraitBackUrl,
        landscape_url: landscapeUrl,
      })
      .select("id, builder_number")
      .single();
    const row = data as { id: string; builder_number: number } | null;

    if (error || !row) {
      console.error("[generate-card] insert failed:", error);
      return NextResponse.json({ error: "Could not save the card" }, { status: 500 });
    }

    return NextResponse.json({ id: row.id, builderNumber: row.builder_number });
  } catch (err) {
    console.error("[generate-card] failed:", err);
    return NextResponse.json({ error: "Could not generate the card" }, { status: 500 });
  }
}
