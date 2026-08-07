import { fontFamilies } from "@/components/frame/compose";

export type PatternId = "palm" | "wave" | "sunset" | "terminal" | "batik" | "circuit";

export interface PatternDef {
  id: PatternId;
  name: string;
  blurb: string;
}

export const PATTERNS: PatternDef[] = [
  { id: "palm", name: "Palm Leaf", blurb: "hand-drawn fronds" },
  { id: "wave", name: "Tide Lines", blurb: "Goa shoreline" },
  { id: "sunset", name: "Sunset Block", blurb: "the 6pm moment" },
  { id: "terminal", name: "Terminal Glyphs", blurb: ">_ hacker scatter" },
  { id: "batik", name: "Batik Rings", blurb: "tropical print" },
  { id: "circuit", name: "Circuit Traces", blurb: "PCB tide" },
];

export const PATTERN_MAP: Record<PatternId, PatternDef> = Object.fromEntries(
  PATTERNS.map((p) => [p.id, p]),
) as Record<PatternId, PatternDef>;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function leafPath(size: number): Path2D {
  const p = new Path2D();
  p.moveTo(0, 0);
  p.bezierCurveTo(size * 0.2, -size * 0.16, size * 0.55, -size * 0.45, size, -size * 0.55);
  p.bezierCurveTo(size * 0.6, -size * 0.32, size * 0.3, -size * 0.12, 0, 0);
  return p;
}

function drawPalm(ctx: CanvasRenderingContext2D, accent: string) {
  const rng = mulberry32(1337);
  ctx.fillStyle = accent;
  for (let i = 0; i < 7; i++) {
    const x = rng() * 1024;
    const y = 130 + rng() * 800;
    const rot = rng() * Math.PI * 2;
    const sc = 0.55 + rng() * 0.95;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(sc, sc);
    ctx.globalAlpha = 0.28 + rng() * 0.3;
    ctx.fill(leafPath(110));
    ctx.restore();
  }
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(rng() * 1024, rng() * 1024, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawWave(ctx: CanvasRenderingContext2D, accent: string) {
  ctx.strokeStyle = accent;
  ctx.lineCap = "round";
  for (let i = 0; i < 11; i++) {
    const y = 46 + i * 96;
    ctx.globalAlpha = 0.4 + (i % 4) * 0.14;
    ctx.lineWidth = 2 + (i % 3);
    ctx.beginPath();
    const freq = 2 + (i % 3);
    for (let x = 0; x <= 1024; x += 4) {
      const yy = y + Math.sin((x / 1024) * Math.PI * 2 * freq + i * 0.9) * 18;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawSunset(ctx: CanvasRenderingContext2D, accent: string) {
  const g = ctx.createLinearGradient(0, 0, 0, 1024);
  g.addColorStop(0, "rgba(255,107,53,0)");
  g.addColorStop(0.42, "rgba(255,107,53,0.5)");
  g.addColorStop(0.58, "rgba(232,67,122,0.42)");
  g.addColorStop(1, "rgba(255,107,53,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 1024);

  ctx.globalAlpha = 0.9;
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(512, 570, 150, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.55;
  ctx.fillStyle = "#0b0e0c";
  for (let i = 0; i < 4; i++) {
    const x = 80 + i * 260;
    ctx.save();
    ctx.translate(x, 950);
    ctx.scale(1.4, 1.4);
    ctx.rotate(-0.08 + i * 0.04);
    ctx.fill(leafPath(80));
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawTerminal(ctx: CanvasRenderingContext2D, accent: string) {
  const fam = fontFamilies().mono;
  const glyphs = [">_", "0x01", "{}", "//", "▍", "~", "git", "ok?", "exit", "#!"];
  const rng = mulberry32(42);
  ctx.fillStyle = accent;

  for (let i = 0; i < 46; i++) {
    const x = rng() * 1024;
    const y = rng() * 1024;
    ctx.globalAlpha = 0.08 + rng() * 0.16;
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 0.62;
  for (let i = 0; i < 16; i++) {
    const glyph = glyphs[Math.floor(rng() * glyphs.length)];
    const x = rng() * 960;
    const y = 90 + rng() * 880;
    const rot = (rng() - 0.5) * 0.3;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.font = `700 ${58 + rng() * 46}px ${fam}`;
    ctx.fillText(glyph, 0, 0);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawBatik(ctx: CanvasRenderingContext2D, accent: string) {
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.5;
  const cell = 256;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const cx = col * cell + 128;
      const cy = row * cell + 128;
      for (let ring = 0; ring < 3; ring++) {
        ctx.lineWidth = 3 + ring;
        ctx.beginPath();
        ctx.arc(cx, cy, 96 - ring * 26, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 16);
      ctx.lineTo(cx + 16, cy);
      ctx.lineTo(cx, cy + 16);
      ctx.lineTo(cx - 16, cy);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawCircuit(ctx: CanvasRenderingContext2D, accent: string) {
  const rng = mulberry32(2026);
  ctx.strokeStyle = accent;
  ctx.lineCap = "round";
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 18; i++) {
    let x = rng() * 1024;
    let y = rng() * 1024;
    ctx.lineWidth = 2 + rng() * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const steps = 4 + Math.floor(rng() * 5);
    for (let s = 0; s < steps; s++) {
      if (rng() > 0.5) x += (rng() > 0.5 ? 1 : -1) * (80 + rng() * 180);
      else y += (rng() > 0.5 ? 1 : -1) * (80 + rng() * 180);
      ctx.lineTo(Math.max(0, Math.min(1024, x)), Math.max(0, Math.min(1024, y)));
    }
    ctx.stroke();
  }
  ctx.fillStyle = accent;
  for (let i = 0; i < 26; i++) {
    ctx.globalAlpha = 0.4 + rng() * 0.4;
    ctx.beginPath();
    ctx.arc(rng() * 1024, rng() * 1024, 6 + rng() * 8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawPattern(
  ctx: CanvasRenderingContext2D,
  id: PatternId,
  accent: string,
) {
  switch (id) {
    case "palm":
      drawPalm(ctx, accent);
      break;
    case "wave":
      drawWave(ctx, accent);
      break;
    case "sunset":
      drawSunset(ctx, accent);
      break;
    case "terminal":
      drawTerminal(ctx, accent);
      break;
    case "batik":
      drawBatik(ctx, accent);
      break;
    case "circuit":
      drawCircuit(ctx, accent);
      break;
  }
}

export function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}
