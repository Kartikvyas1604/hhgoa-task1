import { renderToStaticMarkup } from "react-dom/server";
import { CardArt, CARD_MUSTARD } from "@/components/frame/CardArt";
import { LAYOUT } from "@/components/frame/layout";
import { builderNumber } from "@/components/frame/barcode";
import { fontFamilies } from "@/components/frame/fonts";
import { fitFontSize } from "@/components/frame/fit-text";
import type { Orientation, Side, SocialLinks } from "@/components/frame/types";

const ASSET_PATHS = [
  "/assets/cards/card-landscape-front.svg",
  "/assets/cards/card-landscape-back.svg",
  "/assets/cards/card-portrait-front.svg",
  "/assets/cards/card-portrait-back.svg",
];

const assetCache = new Map<string, Promise<string>>();

async function toDataUrl(path: string): Promise<string> {
  const res = await fetch(path);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function resolveAsset(path: string): Promise<string> {
  let p = assetCache.get(path);
  if (!p) {
    p = toDataUrl(path);
    assetCache.set(path, p);
  }
  return p;
}

export async function ensureCardFonts() {
  const fams = fontFamilies();
  await Promise.all([
    document.fonts.load(`800 64px ${fams.display}`),
    document.fonts.load(`700 32px ${fams.mono}`),
    document.fonts.load(`400 32px ${fams.mono}`),
    document.fonts.ready.catch(() => {}),
  ]);
}

function setLetterSpacing(ctx: CanvasRenderingContext2D, spacing: string) {
  // Canvas letterSpacing isn't universally supported yet; degrade quietly.
  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = spacing;
  } catch {
    /* unsupported */
  }
}

export interface RenderCardOptions {
  orientation: Orientation;
  side: Side;
  name: string;
  role: string;
  socials: SocialLinks;
  photoDataUrl: string;
  qrDataUrl: string | null;
  builderSeed: string;
  scale?: number;
}

const SOCIAL_LABELS: { key: keyof SocialLinks; format: (v: string) => string }[] = [
  { key: "website", format: (v) => v.replace(/^https?:\/\//, "") },
  { key: "x", format: (v) => `X.COM/${v.replace(/^@/, "")}` },
  { key: "instagram", format: (v) => `INSTAGRAM.COM/${v.replace(/^@/, "")}` },
  { key: "github", format: (v) => `GITHUB.COM/${v.replace(/^@/, "")}` },
  { key: "linkedin", format: (v) => `LINKEDIN.COM/IN/${v.replace(/^@/, "")}` },
];

export async function renderCardToPng(opts: RenderCardOptions): Promise<Blob> {
  const { orientation, side, name, role, socials, photoDataUrl, qrDataUrl, builderSeed, scale = 2.5 } = opts;
  const layout = LAYOUT[orientation][side];
  const { w, h } = layout.size;

  await ensureCardFonts();

  const resolved = await Promise.all(ASSET_PATHS.map((p) => resolveAsset(p)));
  const assetMap = new Map(ASSET_PATHS.map((p, i) => [p, resolved[i]]));

  let markup = renderToStaticMarkup(
    CardArt({
      orientation,
      side,
      name,
      role,
      socials,
      photoUrl: photoDataUrl,
      qrDataUrl,
      builderSeed,
      textless: true,
    }),
  );
  markup = markup.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
  for (const [path, dataUrl] of assetMap) {
    markup = markup.split(path).join(dataUrl);
  }

  const svgBlob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  const chromeImg = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("card chrome failed to rasterize"));
    img.src = svgUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d", { alpha: false })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(chromeImg, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(svgUrl);

  const fams = fontFamilies();
  const S = scale;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = CARD_MUSTARD;

  const displayName = (name.trim() || "YOUR NAME").toUpperCase();
  const displayRole = (role.trim() || "YOUR ROLE").toUpperCase();

  const nameSize = fitFontSize({
    text: displayName,
    startSize: layout.name.size,
    maxWidth: layout.name.maxWidth,
    fontFamily: fams.display,
    weight: 800,
    letterSpacingEm: 0.01,
  });
  ctx.font = `800 ${nameSize * S}px ${fams.display}`;
  ctx.textAlign = layout.name.anchor === "middle" ? "center" : "left";
  setLetterSpacing(ctx, `${0.01 * nameSize * S}px`);
  ctx.fillText(displayName, layout.name.x * S, layout.name.y * S);

  const roleSize = fitFontSize({
    text: displayRole,
    startSize: layout.role.size,
    maxWidth: layout.role.maxWidth,
    fontFamily: fams.mono,
    weight: 500,
    letterSpacingEm: 0.1,
  });
  ctx.font = `500 ${roleSize * S}px ${fams.mono}`;
  ctx.textAlign = layout.role.anchor === "middle" ? "center" : "left";
  setLetterSpacing(ctx, `${0.1 * roleSize * S}px`);
  ctx.fillText(displayRole, layout.role.x * S, layout.role.y * S);

  if (layout.barcode) {
    ctx.font = `700 ${20 * S}px ${fams.mono}`;
    ctx.textAlign = "left";
    setLetterSpacing(ctx, `${0.06 * 20 * S}px`);
    ctx.fillText(`BUILDER ${builderNumber(builderSeed)}`, layout.barcode.x * S, layout.barcode.labelY * S);
  }

  if (layout.qr) {
    ctx.font = `400 ${16 * S}px ${fams.mono}`;
    ctx.textAlign = "center";
    setLetterSpacing(ctx, `${0.06 * 16 * S}px`);
    ctx.fillText("#SCAN TO CREATE", layout.qr.labelX * S, layout.qr.labelY * S);
    ctx.fillText("YOUR OWN", layout.qr.labelX * S, (layout.qr.labelY + 16 * 1.3) * S);
  }

  if (layout.socials) {
    ctx.textAlign = "left";
    const allSocialRows = SOCIAL_LABELS.map((row) => ({ row, value: socials[row.key]?.trim() }));
    const filledSocialRows = allSocialRows.filter((r) => r.value);
    const visibleSocialRows = filledSocialRows.length > 0 ? filledSocialRows : allSocialRows;
    visibleSocialRows.forEach(({ row: { key, format }, value }, i) => {
      const label = value ? format(value) : `YOUR ${key.toUpperCase()}`;
      const y = layout.socials!.yStart + i * layout.socials!.rowHeight;
      ctx.globalAlpha = value ? 1 : 0.4;
      ctx.font = `400 ${layout.socials!.fontSize * S}px ${fams.mono}`;
      setLetterSpacing(ctx, `${0.03 * layout.socials!.fontSize * S}px`);
      ctx.fillText(label, (layout.socials!.x + layout.socials!.iconSize + 16) * S, y * S);
      ctx.globalAlpha = 1;
    });
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("png encode failed"))), "image/png");
  });
}
