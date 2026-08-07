import { promises as fs } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

export const dynamic = "force-dynamic";

const BUILDERS = [
  "BEACH MODE DEVELOPER",
  "TERMINAL DWELLER",
  "RUST WRANGLER",
  "ZERO-KNOWLEDGE DREAMER",
  "CHAI-POWERED HACKER",
  "PROTOCOL PILGRIM",
  "SHIPPER OF SHIPPERS",
];

function titleFor(name: string | null): string {
  if (name && name.trim()) {
    const t = name.trim().toUpperCase();
    return t.length > 18 ? `${t.slice(0, 17)}…` : t;
  }
  let hash = 0;
  const key = name ?? "builder";
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return BUILDERS[hash % BUILDERS.length];
}

const VARIANT_THEMES: Record<
  string,
  { bg: string; panel: string; accent: string; accentAlt: string; terminal: string }
> = {
  sunset: { bg: "#0a110c", panel: "#101b13", accent: "#f9e24c", accentAlt: "#ea3380", terminal: "#7fff9e" },
  jade: { bg: "#07130e", panel: "#0d1f17", accent: "#7fff9e", accentAlt: "#2c663e", terminal: "#f9e24c" },
  monsoon: { bg: "#120a10", panel: "#1c1118", accent: "#ea3380", accentAlt: "#f9e24c", terminal: "#7fff9e" },
};

type FontSpec = { name: string; data: ArrayBuffer; weight: 400 | 700; style: "normal" };

function rgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

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
    const format = searchParams.get("format") === "card" ? "card" : "pfp";
    const variant = searchParams.get("variant");
    const theme = VARIANT_THEMES[variant ?? "sunset"] ?? VARIANT_THEMES.sunset;
    const name = searchParams.get("name");
    const role = searchParams.get("role");
    const title = titleFor(name);
    const roleText = role?.trim() ? role.trim().toUpperCase() : "FULL-STACK FUTURIST";

    const base = await fallbackFont();
    let extras: FontSpec[] = [];
    try {
      extras = (await Promise.allSettled([
        loadFont("Fraunces:opsz,wght@9..144,700", "Fraunces"),
        loadFont("JetBrains+Mono:wght@700", "JetBrains Mono"),
      ]))
        .filter((r): r is PromiseFulfilledResult<FontSpec> => r.status === "fulfilled")
        .map((r) => r.value);
    } catch {
      extras = [];
    }
    const fonts = [...extras, base];

    const previewH = format === "card" ? 480 : 400;

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            background: theme.bg,
            color: "#eef1e7",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: -220,
              left: "50%",
              width: 700,
              height: 700,
              borderRadius: "50%",
              transform: "translateX(-50%)",
              background: `radial-gradient(circle, ${rgba(theme.accent, 0.45)} 0%, ${rgba(theme.accentAlt, 0.16)} 42%, transparent 70%)`,
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 64,
              padding: "56px 64px",
            }}
          >
            <div
              style={{
                width: 400,
                height: previewH,
                background: "#101b13",
                borderRadius: 24,
                border: "3px solid rgba(238,241,231,0.08)",
                padding: 22,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 14,
                  border: `30px solid ${theme.accent}`,
                  background: `linear-gradient(180deg, ${theme.bg} 0%, ${theme.panel} 62%, ${theme.accent} 135%)`,
                  display: "flex",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    bottom: -70,
                    left: 6,
                    width: 230,
                    height: 230,
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${rgba(theme.accent, 0.95)} 0%, ${rgba(theme.accent, 0.35)} 50%, transparent 72%)`,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 4,
                    right: 44,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 112,
                      height: 112,
                      borderRadius: "50%",
                      background: "rgba(238,241,231,0.9)",
                    }}
                  />
                  <div
                    style={{
                      width: 200,
                      height: 96,
                      borderTopLeftRadius: 90,
                      borderTopRightRadius: 90,
                      background: "rgba(238,241,231,0.9)",
                    }}
                  />
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    left: 18,
                    fontFamily: "'JetBrains Mono'",
                    fontSize: 17,
                    letterSpacing: 2,
                    color: "#eef1e7",
                  }}
                >
                  HH GOA 2026
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 10,
                    right: 16,
                    fontFamily: "'JetBrains Mono'",
                    fontSize: 16,
                    color: theme.terminal,
                  }}
                >
                  #FrameInGoa
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 18,
                maxWidth: 560,
              }}
            >
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono'",
                    fontSize: 17,
                    color: theme.accent,
                    letterSpacing: 1,
                  }}
                >
                  {format === "pfp" ? "PFP FRAME" : "BUILDER ID"}
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono'",
                    fontSize: 15,
                    color: "rgba(238,241,231,0.5)",
                  }}
                >
                  HH GOA 2026 · GOA, INDIA · 28–31 OCT
                </span>
              </div>
              <div
                style={{
                  fontSize: 62,
                  lineHeight: 1.02,
                  fontWeight: 700,
                  fontFamily: "'Fraunces'",
                }}
              >
                {title}
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono'",
                  fontSize: 24,
                  color: "#93a39a",
                }}
              >
                {`>_ ${roleText}`}
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontFamily: "'JetBrains Mono'",
                  fontSize: 19,
                  color: "#eef1e7",
                }}
              >
                Ready for HH Goa 2026 — framed in the terminal, shared from the beach.
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono'",
                  fontSize: 21,
                  color: theme.terminal,
                }}
              >
                #FrameInGoa
              </div>
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
