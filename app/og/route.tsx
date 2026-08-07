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
    const format = searchParams.get("format") === "card" ? "card" : "pfp";
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
            background: "#0a110c",
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
              background:
                "radial-gradient(circle, rgba(249,226,76,0.45) 0%, rgba(232,67,122,0.16) 42%, transparent 70%)",
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
                  border: "30px solid #f9e24c",
                  background:
                    "linear-gradient(180deg, #0a110c 0%, #102415 62%, #f9e24c 135%)",
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
                    background:
                      "radial-gradient(circle, rgba(255,238,150,0.95) 0%, rgba(249,226,76,0.35) 50%, transparent 72%)",
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
                    color: "#7fff9e",
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
                    color: "#f9e24c",
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
                  color: "#7fff9e",
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
