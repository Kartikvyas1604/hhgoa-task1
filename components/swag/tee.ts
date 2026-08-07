import * as THREE from "three";
import {
  ensureFonts,
  fontFamilies,
  roundedRectPath,
  drawCover,
} from "@/components/frame/compose";
import { drawPattern, luminance, type PatternId } from "./patterns";

export const TEE_TEXTURE_SIZE = 1024;

export function createTeeSilhouette(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0.17, 1.02);
  s.quadraticCurveTo(0, 1.16, -0.17, 1.02);
  s.lineTo(-0.52, 0.9);
  s.lineTo(-1.02, 0.86);
  s.quadraticCurveTo(-1.12, 0.72, -0.94, 0.6);
  s.lineTo(-0.54, 0.46);
  s.lineTo(-0.72, -0.86);
  s.lineTo(-0.66, -1.1);
  s.lineTo(0.66, -1.1);
  s.lineTo(0.72, -0.86);
  s.lineTo(0.54, 0.46);
  s.lineTo(0.94, 0.6);
  s.quadraticCurveTo(1.12, 0.72, 1.02, 0.86);
  s.lineTo(0.52, 0.9);
  s.closePath();
  return s;
}

export function createTeeBodyGeometry(): THREE.ExtrudeGeometry {
  const shape = createTeeSilhouette();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.015,
    bevelSegments: 3,
    curveSegments: 24,
  });
  geo.center();
  return geo;
}

export function createTeeDecalGeometry(): THREE.ShapeGeometry {
  return new THREE.ShapeGeometry(createTeeSilhouette());
}

export interface TeeBakeOptions {
  color: string;
  patternId: PatternId;
  name: string;
  team: string;
  photo: ImageBitmap | null;
  textVisible: boolean;
  mirror: boolean;
}

export async function bakeTeeTexture(opts: TeeBakeOptions): Promise<HTMLCanvasElement> {
  await ensureFonts();
  const size = TEE_TEXTURE_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";

  ctx.fillStyle = opts.color;
  ctx.fillRect(0, 0, size, size);

  const dark = luminance(opts.color) > 0.52;
  const patternInk = dark ? "#0b0e0c" : "#f4efe6";
  drawPattern(ctx, opts.patternId, patternInk);

  drawCollar(ctx, opts.color, patternInk);

  if (opts.textVisible) {
    drawText(ctx, opts.name, opts.team, patternInk);
    if (opts.photo) drawPhotoPatch(ctx, opts.photo);
  }

  if (opts.mirror) {
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
  }
  return canvas;
}

function shade(hex: string, amt: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  r = Math.max(0, Math.min(255, r + amt));
  g = Math.max(0, Math.min(255, g + amt));
  b = Math.max(0, Math.min(255, b + amt));
  return `rgb(${r},${g},${b})`;
}

function drawCollar(ctx: CanvasRenderingContext2D, color: string, ink: string) {
  ctx.save();
  roundedRectPath(ctx, 300, 14, 424, 92, 46);
  ctx.fillStyle = shade(color, luminance(color) > 0.5 ? -36 : 28);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = ink;
  ctx.globalAlpha = 0.28;
  ctx.stroke();
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  for (let x = 330; x < 700; x += 26) {
    ctx.moveTo(x, 24);
    ctx.lineTo(x, 96);
  }
  ctx.stroke();
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawText(
  ctx: CanvasRenderingContext2D,
  name: string,
  team: string,
  ink: string,
) {
  const fam = fontFamilies().mono;
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = ink;
  const label = (name || team || "").trim();

  if (label) {
    let size = 88;
    ctx.font = `800 ${size}px ${fam}`;
    while (size > 34 && ctx.measureText(label).width > 640) {
      size -= 4;
      ctx.font = `800 ${size}px ${fam}`;
    }
    ctx.fillText(label, 512, 280);
  }

  if (name && team) {
    ctx.fillStyle = ink;
    ctx.globalAlpha = 0.72;
    ctx.font = `500 40px ${fam}`;
    ctx.fillText(team, 512, 348);
  }

  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawPhotoPatch(
  ctx: CanvasRenderingContext2D,
  photo: ImageBitmap,
) {
  const cx = 512;
  const cy = 492;
  const p = 210;
  ctx.save();
  roundedRectPath(ctx, cx - p / 2, cy - p / 2, p, p, 28);
  ctx.fillStyle = "#f4efe6";
  ctx.fill();
  roundedRectPath(ctx, cx - p / 2 + 10, cy - p / 2 + 10, p - 20, p - 20, 22);
  ctx.clip();
  drawCover(ctx, photo, cx - p / 2 + 10, cy - p / 2 + 10, p - 20, p - 20);
  ctx.restore();
}

export function drawFlatTee(
  ctx: CanvasRenderingContext2D,
  size: number,
  texture: CanvasImageSource,
  baseColor: string,
) {
  const shape = createTeeSilhouette();
  const pts = shape.getPoints(64);
  const minX = -1.12;
  const minY = -1.16;
  const w = 2.24;
  const h = 2.32;
  const toX = (x: number) => ((x - minX) / w) * size;
  const toY = (y: number) => size - ((y - minY) / h) * size;

  const path = new Path2D();
  pts.forEach((p, i) => {
    const x = toX(p.x);
    const y = toY(p.y);
    if (i === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  });
  path.closePath();

  ctx.save();
  ctx.clip(path);
  ctx.drawImage(texture, 0, 0, size, size);
  ctx.restore();
  ctx.save();
  ctx.fillStyle = baseColor;
  ctx.globalAlpha = 0.16;
  ctx.fill(path);
  ctx.restore();
}
