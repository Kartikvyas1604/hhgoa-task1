export type FrameFormat = "pfp" | "card";

export interface FrameInput {
  format: FrameFormat;
  image: ImageBitmap;
  name?: string;
  role?: string;
}

export const BUILDER_TITLES = [
  "BEACH MODE DEVELOPER",
  "TERMINAL DWELLER",
  "RUST WRANGLER",
  "ZERO-KNOWLEDGE DREAMER",
  "CHAI-POWERED HACKER",
  "PROTOCOL PILGRIM",
  "SHIPPER OF SHIPPERS",
];

export const PALETTE = {
  void: "#0b0e0c",
  panel: "#141815",
  sunset: "#ff6b35",
  magenta: "#e8437a",
  terminal: "#7fff9e",
  ink: "#f4efe6",
  muted: "#aab0a6",
  hairline: "rgba(244,239,230,0.28)",
};

let familyCache: { display: string; mono: string } | null = null;

export function fontFamilies() {
  if (familyCache) return familyCache;
  const probe = (cls: string, fallback: string) => {
    const el = document.createElement("span");
    el.className = cls;
    el.style.cssText = "position:absolute;left:-9999px;opacity:0;pointer-events:none;";
    document.body.appendChild(el);
    const fam = getComputedStyle(el).fontFamily;
    el.remove();
    return fam || fallback;
  };
  familyCache = {
    display: probe("font-display", "Fraunces, serif"),
    mono: probe("font-mono", "JetBrains Mono, monospace"),
  };
  return familyCache;
}

export async function ensureFonts() {
  const fams = fontFamilies();
  await Promise.all([
    document.fonts.load(`900 64px ${fams.display}`),
    document.fonts.load(`700 32px ${fams.mono}`),
    document.fonts.load(`400 32px ${fams.mono}`),
    document.fonts.ready.catch(() => {}),
  ]);
}

function titleForName(name?: string): string {
  if (name && name.trim()) return name.trim().toUpperCase();
  let hash = 0;
  const key = name ?? "builder";
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return BUILDER_TITLES[hash % BUILDER_TITLES.length];
}

function roleFor(role?: string): string {
  const r = role?.trim();
  return r ? r.toUpperCase() : "FULL-STACK FUTURIST";
}

export function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawCover(
  ctx: CanvasRenderingContext2D,
  img: ImageBitmap,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const iw = img.width;
  const ih = img.height;
  const scale = Math.max(w / iw, h / ih);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (iw - sw) / 2;
  const sy = (ih - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

export function drawSpaced(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
  align: CanvasTextAlign = "left",
) {
  ctx.textAlign = align;
  if (spacing === 0) {
    ctx.fillText(text, x, y);
    return;
  }
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
  let cx = align === "right" ? x - total : align === "center" ? x - total / 2 : x;
  [...text].forEach((ch, i) => {
    ctx.fillText(ch, cx, y);
    cx += widths[i] + spacing;
  });
}

export function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  baseSize: number,
  family: string,
  weight: number,
  minSize = 30,
): number {
  let size = baseSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  return size;
}

function cornerTicks(ctx: CanvasRenderingContext2D, W: number, inset: number, len: number) {
  ctx.save();
  ctx.strokeStyle = "rgba(244,239,230,0.85)";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  const corners: [number, number, number][] = [
    [inset, inset, 0],
    [W - inset, inset, Math.PI / 2],
    [inset, W - inset, -Math.PI / 2],
    [W - inset, W - inset, Math.PI],
  ];
  for (const [cx, cy, rot] of corners) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(0, len);
    ctx.lineTo(0, -len);
    ctx.moveTo(-len, 0);
    ctx.lineTo(len, 0);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawPfp(ctx: CanvasRenderingContext2D, W: number, img: ImageBitmap) {
  const fams = fontFamilies();
  const BORDER = 46;

  ctx.save();
  roundedRectPath(ctx, 0, 0, W, W, 64);
  ctx.clip();

  drawCover(ctx, img, 0, 0, W, W);

  const top = ctx.createLinearGradient(0, 0, 0, W * 0.24);
  top.addColorStop(0, "rgba(11,14,12,0.72)");
  top.addColorStop(1, "rgba(11,14,12,0)");
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, W, W * 0.24);

  const bottom = ctx.createLinearGradient(0, W * 0.62, 0, W);
  bottom.addColorStop(0, "rgba(11,14,12,0)");
  bottom.addColorStop(1, "rgba(11,14,12,0.82)");
  ctx.fillStyle = bottom;
  ctx.fillRect(0, W * 0.58, W, W * 0.42);

  const sun = ctx.createRadialGradient(W * 0.15, W * 1.06, 0, W * 0.15, W * 1.06, W * 0.34);
  sun.addColorStop(0, "rgba(255,107,53,0.9)");
  sun.addColorStop(0.45, "rgba(232,67,122,0.32)");
  sun.addColorStop(1, "rgba(232,67,122,0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, W, W);

  ctx.lineWidth = BORDER;
  ctx.strokeStyle = PALETTE.sunset;
  ctx.strokeRect(0, 0, W, W);

  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(244,239,230,0.35)";
  ctx.strokeRect(BORDER / 2, BORDER / 2, W - BORDER, W - BORDER);

  cornerTicks(ctx, W, 30, 30);

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `800 ${BORDER * 0.78}px ${fams.mono}`;
  drawSpaced(ctx, "HH GOA 2026", 72, 106, 3);

  ctx.fillStyle = "rgba(244,239,230,0.78)";
  ctx.font = `400 ${BORDER * 0.44}px ${fams.mono}`;
  drawSpaced(ctx, "LESS NOISE · MORE SIGNAL", 72, 142, 2);

  ctx.fillStyle = "rgba(244,239,230,0.9)";
  ctx.font = `500 ${BORDER * 0.44}px ${fams.mono}`;
  drawSpaced(ctx, "GOA, INDIA · 28–31 OCT", W - 72, 106, 2, "right");

  ctx.fillStyle = PALETTE.ink;
  ctx.font = `800 ${BORDER * 0.66}px ${fams.mono}`;
  drawSpaced(ctx, "FRAME_IN/GOA", 72, W - 78, 2);

  ctx.fillStyle = PALETTE.terminal;
  ctx.font = `600 ${BORDER * 0.48}px ${fams.mono}`;
  drawSpaced(ctx, "#FrameInGoa", W - 72, W - 78, 1, "right");

  ctx.restore();
}

function drawCard(ctx: CanvasRenderingContext2D, W: number, H: number, img: ImageBitmap, name?: string, role?: string) {
  const fams = fontFamilies();
  const I = 56;
  const bandH = 460;
  const bandY = I;
  const bandR = 40;

  const title = titleForName(name);
  const roleText = roleFor(role);

  ctx.save();
  roundedRectPath(ctx, 0, 0, W, H, 48);
  ctx.clip();
  ctx.fillStyle = PALETTE.panel;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  roundedRectPath(ctx, I, bandY, W - I * 2, bandH, bandR);
  ctx.clip();
  drawCover(ctx, img, I, bandY, W - I * 2, bandH);
  const bandScrim = ctx.createLinearGradient(0, bandY + bandH * 0.5, 0, bandY + bandH);
  bandScrim.addColorStop(0, "rgba(11,14,12,0)");
  bandScrim.addColorStop(1, "rgba(11,14,12,0.55)");
  ctx.fillStyle = bandScrim;
  ctx.fillRect(I, bandY, W - I * 2, bandH);
  ctx.restore();

  ctx.strokeStyle = PALETTE.sunset;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(I + 10, bandY + bandH + 14);
  ctx.lineTo(W - I - 10, bandY + bandH + 14);
  ctx.stroke();

  const sun = ctx.createRadialGradient(W - 120, H * 0.52, 0, W - 120, H * 0.52, 420);
  sun.addColorStop(0, "rgba(255,107,53,0.22)");
  sun.addColorStop(0.5, "rgba(232,67,122,0.08)");
  sun.addColorStop(1, "rgba(232,67,122,0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, bandY + bandH, W, H - bandY - bandH);

  const contentY = bandY + bandH + 96;

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = PALETTE.sunset;
  ctx.font = `700 26px ${fams.mono}`;
  drawSpaced(ctx, "HH GOA 2026", I + 2, contentY, 2);
  ctx.fillStyle = PALETTE.ink;
  ctx.textAlign = "right";
  ctx.font = `500 26px ${fams.mono}`;
  drawSpaced(ctx, "BUILDER ID", W - I - 2, contentY, 2, "right");

  ctx.textAlign = "left";
  ctx.fillStyle = PALETTE.ink;
  const nameSize = fitFont(ctx, title, W - I * 2 - 8, 92, fams.display, 800);
  ctx.font = `800 ${nameSize}px ${fams.display}`;
  drawSpaced(ctx, title, I, contentY + 118, 0);

  ctx.fillStyle = PALETTE.muted;
  ctx.font = `600 30px ${fams.mono}`;
  ctx.fillStyle = PALETTE.sunset;
  ctx.font = `700 30px ${fams.mono}`;
  ctx.fillText(">_", I, contentY + 176);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `500 30px ${fams.mono}`;
  const roleFitted = fitFont(ctx, roleText, W - I * 2 - 120, 30, fams.mono, 500, 20);
  ctx.font = `500 ${roleFitted}px ${fams.mono}`;
  ctx.fillText(roleText, I + 74, contentY + 176);

  ctx.strokeStyle = PALETTE.hairline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(I, contentY + 236);
  ctx.lineTo(W - I, contentY + 236);
  ctx.stroke();

  const stats: [string, string][] = [
    ["EVENT", "HH GOA 2026"],
    ["DATES", "28–31 OCT 2026"],
    ["CITY", "GOA, INDIA"],
  ];
  ctx.font = `500 26px ${fams.mono}`;
  stats.forEach(([label, value], i) => {
    const y = contentY + 316 + i * 62;
    ctx.fillStyle = "rgba(244,239,230,0.5)";
    drawSpaced(ctx, label, I, y, 2);
    ctx.fillStyle = PALETTE.ink;
    ctx.textAlign = "right";
    drawSpaced(ctx, value, W - I, y, 1, "right");
    ctx.textAlign = "left";
  });

  ctx.strokeStyle = PALETTE.hairline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(I, H - I - 96);
  ctx.lineTo(W - I, H - I - 96);
  ctx.stroke();

  ctx.font = `700 28px ${fams.mono}`;
  ctx.fillStyle = PALETTE.terminal;
  drawSpaced(ctx, "#FrameInGoa", I, H - I - 44, 1);
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(244,239,230,0.6)";
  ctx.font = `500 26px ${fams.mono}`;
  drawSpaced(ctx, "FRAME_IN/GOA · 001", W - I, H - I - 44, 1, "right");
  ctx.textAlign = "left";

  ctx.save();
  ctx.translate(34, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "rgba(244,239,230,0.28)";
  ctx.font = `600 22px ${fams.mono}`;
  drawSpaced(ctx, "HHGOA26 // BUILD IN GOA", 0, 0, 3);
  ctx.restore();

  ctx.restore();
}

export async function composeFrame(input: FrameInput): Promise<HTMLCanvasElement> {
  await ensureFonts();
  const canvas = document.createElement("canvas");
  const isPfp = input.format === "pfp";
  canvas.width = 1080;
  canvas.height = isPfp ? 1080 : 1350;
  const ctx = canvas.getContext("2d", { alpha: false })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (isPfp) {
    drawPfp(ctx, 1080, input.image);
  } else {
    drawCard(ctx, 1080, 1350, input.image, input.name, input.role);
  }
  return canvas;
}
