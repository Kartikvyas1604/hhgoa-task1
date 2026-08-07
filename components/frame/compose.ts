export type FrameFormat = "pfp" | "card";
export type FrameVariant = "sunset" | "jade" | "monsoon";

export interface FrameInput {
  format: FrameFormat;
  image: ImageBitmap;
  variant?: FrameVariant;
  name?: string;
  role?: string;
}

export interface FrameTheme {
  bg: string;
  panel: string;
  ink: string;
  muted: string;
  accent: string;
  accentAlt: string;
  terminal: string;
  sunHigh: string;
  sunLow: string;
  pfpTagline: string;
}

export const FRAME_VARIANTS: Record<FrameVariant, FrameTheme> = {
  sunset: {
    bg: "#0a110c",
    panel: "#101b13",
    ink: "#eef1e7",
    muted: "#a9b7ac",
    accent: "#f9e24c",
    accentAlt: "#ea3380",
    terminal: "#7fff9e",
    sunHigh: "#f9e24c",
    sunLow: "#ea3380",
    pfpTagline: "LESS NOISE · MORE SIGNAL",
  },
  jade: {
    bg: "#07130e",
    panel: "#0d1f17",
    ink: "#e8f5ec",
    muted: "#9fc3ac",
    accent: "#7fff9e",
    accentAlt: "#2c663e",
    terminal: "#f9e24c",
    sunHigh: "#7fff9e",
    sunLow: "#0e5a33",
    pfpTagline: "SHIP SLOW · BUIDL STEADY",
  },
  monsoon: {
    bg: "#120a10",
    panel: "#1c1118",
    ink: "#f6edf0",
    muted: "#b49aa5",
    accent: "#ea3380",
    accentAlt: "#f9e24c",
    terminal: "#7fff9e",
    sunHigh: "#f9e24c",
    sunLow: "#ea3380",
    pfpTagline: "SUNSET MODE · 4AM BUILDS",
  },
};

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
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

function cornerTicks(
  ctx: CanvasRenderingContext2D,
  W: number,
  inset: number,
  len: number,
  color: string,
) {
  ctx.save();
  ctx.strokeStyle = color;
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

function drawPfp(
  ctx: CanvasRenderingContext2D,
  W: number,
  img: ImageBitmap,
  t: FrameTheme,
) {
  const fams = fontFamilies();
  const BORDER = 46;

  ctx.save();
  roundedRectPath(ctx, 0, 0, W, W, 64);
  ctx.clip();

  drawCover(ctx, img, 0, 0, W, W);

  const top = ctx.createLinearGradient(0, 0, 0, W * 0.24);
  top.addColorStop(0, hexToRgba(t.bg, 0.72));
  top.addColorStop(1, hexToRgba(t.bg, 0));
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, W, W * 0.24);

  const bottom = ctx.createLinearGradient(0, W * 0.62, 0, W);
  bottom.addColorStop(0, hexToRgba(t.bg, 0));
  bottom.addColorStop(1, hexToRgba(t.bg, 0.82));
  ctx.fillStyle = bottom;
  ctx.fillRect(0, W * 0.58, W, W * 0.42);

  const sun = ctx.createRadialGradient(W * 0.15, W * 1.06, 0, W * 0.15, W * 1.06, W * 0.34);
  sun.addColorStop(0, hexToRgba(t.sunHigh, 0.9));
  sun.addColorStop(0.45, hexToRgba(t.sunLow, 0.32));
  sun.addColorStop(1, hexToRgba(t.sunLow, 0));
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, W, W);

  ctx.lineWidth = BORDER;
  ctx.strokeStyle = t.accent;
  ctx.strokeRect(0, 0, W, W);

  ctx.lineWidth = 2;
  ctx.strokeStyle = hexToRgba(t.ink, 0.35);
  ctx.strokeRect(BORDER / 2, BORDER / 2, W - BORDER, W - BORDER);

  cornerTicks(ctx, W, 30, 30, hexToRgba(t.ink, 0.85));

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = t.ink;
  ctx.font = `800 ${BORDER * 0.78}px ${fams.mono}`;
  drawSpaced(ctx, "HH GOA 2026", 72, 106, 3);

  ctx.fillStyle = hexToRgba(t.ink, 0.78);
  ctx.font = `400 ${BORDER * 0.44}px ${fams.mono}`;
  drawSpaced(ctx, t.pfpTagline, 72, 142, 2);

  ctx.fillStyle = hexToRgba(t.ink, 0.9);
  ctx.font = `500 ${BORDER * 0.44}px ${fams.mono}`;
  drawSpaced(ctx, "GOA, INDIA · 28–31 OCT", W - 72, 106, 2, "right");

  ctx.fillStyle = t.ink;
  ctx.font = `800 ${BORDER * 0.66}px ${fams.mono}`;
  drawSpaced(ctx, "FRAME_IN/GOA", 72, W - 78, 2);

  ctx.fillStyle = t.terminal;
  ctx.font = `600 ${BORDER * 0.48}px ${fams.mono}`;
  drawSpaced(ctx, "#FrameInGoa", W - 72, W - 78, 1, "right");

  ctx.restore();
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  img: ImageBitmap,
  t: FrameTheme,
  name?: string,
  role?: string,
) {
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
  ctx.fillStyle = t.panel;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  roundedRectPath(ctx, I, bandY, W - I * 2, bandH, bandR);
  ctx.clip();
  drawCover(ctx, img, I, bandY, W - I * 2, bandH);
  const bandScrim = ctx.createLinearGradient(0, bandY + bandH * 0.5, 0, bandY + bandH);
  bandScrim.addColorStop(0, hexToRgba(t.bg, 0));
  bandScrim.addColorStop(1, hexToRgba(t.bg, 0.55));
  ctx.fillStyle = bandScrim;
  ctx.fillRect(I, bandY, W - I * 2, bandH);
  ctx.restore();

  ctx.strokeStyle = t.accent;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(I + 10, bandY + bandH + 14);
  ctx.lineTo(W - I - 10, bandY + bandH + 14);
  ctx.stroke();

  const sun = ctx.createRadialGradient(W - 120, H * 0.52, 0, W - 120, H * 0.52, 420);
  sun.addColorStop(0, hexToRgba(t.sunHigh, 0.22));
  sun.addColorStop(0.5, hexToRgba(t.sunLow, 0.08));
  sun.addColorStop(1, hexToRgba(t.sunLow, 0));
  ctx.fillStyle = sun;
  ctx.fillRect(0, bandY + bandH, W, H - bandY - bandH);

  const contentY = bandY + bandH + 96;

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = t.accent;
  ctx.font = `700 26px ${fams.mono}`;
  drawSpaced(ctx, "HH GOA 2026", I + 2, contentY, 2);
  ctx.fillStyle = t.ink;
  ctx.textAlign = "right";
  ctx.font = `500 26px ${fams.mono}`;
  drawSpaced(ctx, "BUILDER ID", W - I - 2, contentY, 2, "right");

  ctx.textAlign = "left";
  ctx.fillStyle = t.ink;
  const nameSize = fitFont(ctx, title, W - I * 2 - 8, 92, fams.display, 800);
  ctx.font = `800 ${nameSize}px ${fams.display}`;
  drawSpaced(ctx, title, I, contentY + 118, 0);

  ctx.fillStyle = t.muted;
  ctx.font = `600 30px ${fams.mono}`;
  ctx.fillStyle = t.accent;
  ctx.font = `700 30px ${fams.mono}`;
  ctx.fillText(">_", I, contentY + 176);
  ctx.fillStyle = t.muted;
  ctx.font = `500 30px ${fams.mono}`;
  const roleFitted = fitFont(ctx, roleText, W - I * 2 - 120, 30, fams.mono, 500, 20);
  ctx.font = `500 ${roleFitted}px ${fams.mono}`;
  ctx.fillText(roleText, I + 74, contentY + 176);

  const hairline = hexToRgba(t.ink, 0.28);
  ctx.strokeStyle = hairline;
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
    ctx.fillStyle = hexToRgba(t.ink, 0.5);
    drawSpaced(ctx, label, I, y, 2);
    ctx.fillStyle = t.ink;
    ctx.textAlign = "right";
    drawSpaced(ctx, value, W - I, y, 1, "right");
    ctx.textAlign = "left";
  });

  ctx.strokeStyle = hairline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(I, H - I - 96);
  ctx.lineTo(W - I, H - I - 96);
  ctx.stroke();

  ctx.font = `700 28px ${fams.mono}`;
  ctx.fillStyle = t.terminal;
  drawSpaced(ctx, "#FrameInGoa", I, H - I - 44, 1);
  ctx.textAlign = "right";
  ctx.fillStyle = hexToRgba(t.ink, 0.6);
  ctx.font = `500 26px ${fams.mono}`;
  drawSpaced(ctx, "FRAME_IN/GOA · 001", W - I, H - I - 44, 1, "right");
  ctx.textAlign = "left";

  ctx.save();
  ctx.translate(34, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = hexToRgba(t.ink, 0.28);
  ctx.font = `600 22px ${fams.mono}`;
  drawSpaced(ctx, "HHGOA26 // BUILD IN GOA", 0, 0, 3);
  ctx.restore();

  ctx.restore();
}

export async function composeFrame(input: FrameInput): Promise<HTMLCanvasElement> {
  await ensureFonts();
  const canvas = document.createElement("canvas");
  const isPfp = input.format === "pfp";
  const t = FRAME_VARIANTS[input.variant ?? "sunset"];
  canvas.width = 1080;
  canvas.height = isPfp ? 1080 : 1350;
  const ctx = canvas.getContext("2d", { alpha: false })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (isPfp) {
    drawPfp(ctx, 1080, input.image, t);
  } else {
    drawCard(ctx, 1080, 1350, input.image, t, input.name, input.role);
  }
  return canvas;
}
