import { promises as fs } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

export const dynamic = "force-dynamic";

const BG = "#046835";
const MUSTARD = "#F4D03F";
const PINK = "#E8348E";
const CREAM = "#FBF6E8";

type FontSpec = { name: string; data: ArrayBuffer; weight: 400 | 700; style: "normal" };

let geistFont: FontSpec | null = null;

async function fallbackFont(): Promise<FontSpec> {
  if (geistFont) return geistFont;
  const file = await fs.readFile(path.join(process.cwd(), "assets", "og", "Geist-Regular.ttf"));
  const buffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
  geistFont = { name: "Geist", data: buffer, weight: 400, style: "normal" };
  return geistFont;
}

async function loadFont(family: string, displayName: string): Promise<FontSpec> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&display=swap`,
    {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; en-US) AppleWebKit/533.21.1 (KHTML, like Gecko)",
      },
    },
  ).then((r) => r.text());
  const urls = [...css.matchAll(/url\((https?:\/\/[^)]+)\)/g)].map((m) => m[1]);
  const url = urls.find((u) => u.includes(".ttf")) ?? urls[0];
  if (!url) throw new Error("no font url");
  const data = await fetch(url).then((r) => r.arrayBuffer());
  return { name: displayName, data, weight: 700 as const, style: "normal" as const };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orientation = searchParams.get("orientation") === "landscape" ? "landscape" : "portrait";
    const side = searchParams.get("side") === "back" ? "back" : "front";
    const name = searchParams.get("name")?.trim();
    const role = searchParams.get("role")?.trim();
    const title = name ? name.toUpperCase() : "YOUR NAME HERE";
    const roleText = role ? role.toUpperCase() : "BUILDER";

    const base = await fallbackFont();
    let extras: FontSpec[] = [];
    try {
      extras = (await Promise.allSettled([
        loadFont("Fraunces:opsz,wght@9..144,800", "Fraunces"),
        loadFont("JetBrains+Mono:wght@700", "JetBrains Mono"),
      ]))
        .filter((r): r is PromiseFulfilledResult<FontSpec> => r.status === "fulfilled")
        .map((r) => r.value);
    } catch {
      extras = [];
    }
    const fonts = [...extras, base];

    const cardW = orientation === "landscape" ? 420 : 300;
    const cardH = orientation === "landscape" ? 236 : 406;

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            background: BG,
            color: CREAM,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 56,
              padding: "56px 64px",
            }}
          >
            <div
              style={{
                width: cardW,
                height: cardH,
                borderRadius: 20,
                border: `8px solid ${MUSTARD}`,
                background: "#0e3b26",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                padding: 20,
                position: "relative",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 20,
                  left: 20,
                  width: cardW * 0.42,
                  height: cardW * 0.42,
                  borderRadius: "50%",
                  border: `4px dashed ${MUSTARD}`,
                  opacity: 0.6,
                }}
              />
              <div style={{ fontFamily: "'Fraunces'", fontWeight: 800, fontSize: 26, color: MUSTARD }}>
                {title.length > 16 ? `${title.slice(0, 15)}…` : title}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 14, color: CREAM, opacity: 0.8 }}>
                {roleText}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 520 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 16, color: MUSTARD, letterSpacing: 1 }}>
                  {side === "front" ? "BUILDER CARD" : "BUILDER CARD · BACK"}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 14, color: "rgba(251,246,232,0.55)" }}>
                  HH GOA 2026 · 28–31 OCT
                </span>
              </div>
              <div style={{ fontSize: 58, lineHeight: 1.02, fontWeight: 800, fontFamily: "'Fraunces'", color: MUSTARD }}>
                {title}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 22, color: CREAM, opacity: 0.85 }}>
                {roleText}
              </div>
              <div style={{ marginTop: 6, fontFamily: "'JetBrains Mono'", fontSize: 18, color: CREAM, opacity: 0.75 }}>
                I&apos;m participating in HACKER HOUSE GOA.
              </div>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 20, color: PINK }}>#FrameInGoa</div>
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630, fonts },
    );
  } catch (err) {
    console.error("[og] render failed:", err);
    return new Response("OG image unavailable", { status: 500 });
  }
}
