"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";
import type { RootState } from "@react-three/fiber";
import gsap from "gsap";
import {
  Camera as CameraIcon,
  Download,
  ImagePlus,
  Share2,
  Shuffle,
  SprayCan,
  Undo2,
  X,
} from "lucide-react";
import { PATTERNS, PATTERN_MAP, drawPattern, type PatternId } from "./patterns";
import { bakeTeeTexture, drawFlatTee } from "./tee";
import type { ShirtSceneProps, ShirtView } from "./ShirtScene";
import { ensureFonts } from "@/components/frame/compose";
import { processPhoto } from "@/components/frame/image";
import { buildCaption, downloadBlob, shareToX } from "@/lib/share";

const ShirtScene = dynamic<ShirtSceneProps>(
  () => import("./ShirtScene").then((m) => m.ShirtScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <p className="font-mono text-xs text-ink">
          &gt; mounting 3d scene <span className="cursor-blink">▍</span>
        </p>
      </div>
    ),
  },
);

const SPRAY_COLORS = [
  { c: "#ff6b35", n: "sunset" },
  { c: "#e8437a", n: "magenta" },
  { c: "#7fff9e", n: "terminal" },
  { c: "#f4efe6", n: "sand" },
  { c: "#1e9ea8", n: "lagoon" },
  { c: "#0b0e0c", n: "void" },
];

function dataUrlToBlob(url: string): Promise<Blob> {
  return fetch(url).then((r) => r.blob());
}

function PatternSwatch({
  id,
  active,
  onClick,
}: {
  id: PatternId;
  active: boolean;
  onClick: () => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 64, 64);
    ctx.fillStyle = "#f4efe6";
    ctx.fillRect(0, 0, 64, 64);
    drawPattern(ctx, id, "#0b0e0c");
  }, [id]);
  const meta = PATTERN_MAP[id];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={meta.blurb}
      className={`flex flex-col items-center gap-1.5 rounded-md p-1.5 transition-colors duration-100 ${
        active ? "bg-raise ring-1 ring-sunset" : "hover:bg-raise"
      }`}
    >
      <canvas
        ref={ref}
        width={64}
        height={64}
        className="h-12 w-12 rounded border border-line"
      />
      <span
        className={`font-mono text-[9px] ${
          active ? "text-sunset" : "text-muted"
        }`}
      >
        {meta.name}
      </span>
    </button>
  );
}

export function ShirtCustomizer() {
  const [patternId, setPatternId] = useState<PatternId>("wave");
  const [color, setColor] = useState("#ff6b35");
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [textSide, setTextSide] = useState<"front" | "back">("front");
  const [photo, setPhoto] = useState<ImageBitmap | null>(null);
  const [view, setView] = useState<ShirtView>("front");
  const [punch, setPunch] = useState(0);
  const [baking, setBaking] = useState(true);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [lowPower, setLowPower] = useState(false);
  const [flatUrl, setFlatUrl] = useState<string | null>(null);

  const [tex, setTex] = useState<{
    front: THREE.Texture | null;
    back: THREE.Texture | null;
  }>({ front: null, back: null });

  const bakeSeq = useRef(0);
  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = ++bakeSeq.current;
    const t = setTimeout(async () => {
      try {
        setBaking(true);
        await ensureFonts();
        const front = await bakeTeeTexture({
          color,
          patternId,
          name,
          team,
          photo,
          textVisible: textSide === "front",
          mirror: false,
        });
        const back = await bakeTeeTexture({
          color,
          patternId,
          name,
          team,
          photo,
          textVisible: textSide === "back",
          mirror: true,
        });
        if (bakeSeq.current !== id) return;
        const mk = (c: HTMLCanvasElement) => {
          const t = new THREE.CanvasTexture(c);
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = 4;
          return t;
        };
        setTex({ front: mk(front), back: mk(back) });
      } catch {
        /* texture bake failed — keep previous */
      } finally {
        if (bakeSeq.current === id) setBaking(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [color, patternId, name, team, photo, textSide]);

  useEffect(() => {
    if (!lowPower) return;
    const t = setTimeout(() => {
      const img = tex.front?.image as CanvasImageSource | undefined;
      if (!img) return;
      const c = document.createElement("canvas");
      c.width = c.height = 560;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      drawFlatTee(ctx, 560, img, color);
      setFlatUrl(c.toDataURL("image/png"));
    }, 0);
    return () => clearTimeout(t);
  }, [lowPower, tex, color]);

  const onSceneCreated = useCallback((state: RootState) => {
    glRef.current = state.gl;
    sceneRef.current = state.scene;
    cameraRef.current = state.camera;
  }, []);

  const onCapture = useCallback(() => {
    const gl = glRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!gl || !scene || !camera) return;
    gl.render(scene, camera);
    const url = gl.domElement.toDataURL("image/png");
    if (flashRef.current) {
      const el = flashRef.current;
      gsap.fromTo(el, { opacity: 0.9 }, { opacity: 0, duration: 0.5, ease: "power2.out" });
    }
    setCapturedUrl(url);
  }, []);

  const onRandomize = useCallback(() => {
    const pid = PATTERNS[Math.floor(Math.random() * PATTERNS.length)].id;
    const col = SPRAY_COLORS[Math.floor(Math.random() * SPRAY_COLORS.length)].c;
    setPatternId(pid);
    setColor(col);
    setPunch((p) => p + 1);
  }, []);

  const onDownload = useCallback(() => {
    if (!capturedUrl) return;
    dataUrlToBlob(capturedUrl).then((b) =>
      downloadBlob(b, `frameingoas-tee-${Date.now()}.png`),
    );
  }, [capturedUrl]);

  const onShare = useCallback(async () => {
    if (!capturedUrl) return;
    const caption = buildCaption(
      "Sprayed my HH Goa 2026 tee — built in Goa, shared from the beach.",
    );
    const blob = await dataUrlToBlob(capturedUrl);
    const ogPath = `/og?format=card&name=${encodeURIComponent(
      name || "TEE",
    )}&role=${encodeURIComponent(team || "SPRAYED IN GOA")}`;
    await shareToX({ caption, file: blob, ogPath });
  }, [capturedUrl, name, team]);

  const onPhoto = useCallback(async (file: File) => {
    try {
      const bmp = await processPhoto(file);
      setPhoto(bmp);
    } catch {
      /* bad photo */
    }
  }, []);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-1">
        <p className="font-mono text-[11px] tracking-[0.22em] text-magenta">
          SWAG LAB · 3D TEE CUSTOMIZER
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Spray your HH Goa tee.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-muted">
          Pick a pattern, spray a colour, stamp your name. Then capture a flat
          shot and share it — no cart, no checkout, no walls.
        </p>
      </header>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* stage */}
        <div className="relative h-[52dvh] min-h-[340px] overflow-hidden rounded-xl border border-line bg-panel lg:h-[70vh]">
          {lowPower ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3">
              {flatUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- canvas data URL, not optimisable
                <img
                  src={flatUrl}
                  alt="Flat preview of your shirt design"
                  className="max-h-[70%] rounded-lg border border-line"
                />
              ) : (
                <p className="font-mono text-xs text-muted">
                  &gt; preparing preview <span className="cursor-blink">▍</span>
                </p>
              )}
              <span className="rounded border border-terminal/50 px-2 py-1 font-mono text-[10px] text-terminal">
                LOW-POWER MODE
              </span>
              <button
                type="button"
                onClick={() => setLowPower(false)}
                className="rounded-md border border-line px-3 py-2 font-mono text-xs text-muted transition-colors duration-100 hover:text-ink"
              >
                Try 3D again
              </button>
            </div>
          ) : (
            <ShirtScene
              texFront={tex.front}
              texBack={tex.back}
              baseColor={color}
              view={view}
              punch={punch}
              onLowFps={() => setLowPower(true)}
              onCreated={onSceneCreated}
            />
          )}

          {/* view toggle */}
          <div className="absolute left-3 top-3 z-10 flex gap-1 rounded-lg border border-line bg-void/70 p-1 backdrop-blur-sm">
            {(["front", "back"] as ShirtView[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`rounded-md px-2.5 py-1.5 font-mono text-[10px] font-bold tracking-wide transition-colors duration-100 ${
                  view === v ? "bg-sunset text-void" : "text-muted hover:text-ink"
                }`}
              >
                {v === "front" ? "FRONT" : "BACK"}
              </button>
            ))}
          </div>

          {/* baking cursor */}
          {baking && !lowPower && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-void/40 backdrop-blur-[1px]">
              <p role="status" className="font-mono text-xs text-ink">
                &gt; baking texture <span className="cursor-blink">▍</span>
              </p>
            </div>
          )}

          {/* capture button */}
          {!capturedUrl && !lowPower && (
            <button
              type="button"
              onClick={onCapture}
              className="cta-scan absolute bottom-3 left-1/2 z-10 flex h-11 -translate-x-1/2 items-center gap-2 rounded-md border border-sunset/70 bg-panel px-5 font-mono text-xs font-bold tracking-wide text-sunset transition-colors duration-100 hover:bg-sunset hover:text-void active:translate-y-px"
            >
              <CameraIcon aria-hidden="true" className="h-4 w-4" />
              Capture shot
            </button>
          )}

          {/* captured panel */}
          {capturedUrl && (
            <div className="snap-in absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-panel/95 p-4 backdrop-blur-sm">
              {/* eslint-disable-next-line @next/next/no-img-element -- canvas data URL, not optimisable */}
              <img
                src={capturedUrl}
                alt="Captured flat shot of your customized tee"
                className="max-h-[52%] rounded-lg border border-line object-contain"
              />
              <p className="font-mono text-xs text-terminal">
                captured ✓ <span className="text-muted">— flat 1080p mockup</span>
              </p>
              <div className="grid w-full max-w-xs grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={onDownload}
                  className="flex h-12 items-center justify-center gap-2 rounded-md border border-line bg-void/60 px-4 font-mono text-xs font-bold text-ink transition-colors duration-100 hover:border-ink/40 active:translate-y-px"
                >
                  <Download aria-hidden="true" className="h-4 w-4" />
                  Download PNG
                </button>
                <button
                  type="button"
                  onClick={onShare}
                  className="share-glow cta-scan flex h-12 items-center justify-center gap-2 rounded-md bg-terminal px-4 font-mono text-xs font-bold text-void transition-colors duration-100 hover:bg-[#9cffba] active:translate-y-px"
                >
                  <Share2 aria-hidden="true" className="h-4 w-4" />
                  Share to X
                </button>
              </div>
              <button
                type="button"
                onClick={() => setCapturedUrl(null)}
                className="flex items-center gap-1.5 font-mono text-[11px] text-muted transition-colors duration-100 hover:text-ink"
              >
                <Undo2 aria-hidden="true" className="h-3.5 w-3.5" />
                Back to editor
              </button>
            </div>
          )}

          <div
            ref={flashRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-30 bg-ink opacity-0"
          />
        </div>

        {/* controls sheet */}
        <aside
          data-lenis-prevent
          className="max-h-[44dvh] overflow-y-auto rounded-xl border border-line bg-panel p-4 lg:max-h-none lg:overflow-visible"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-[11px] font-bold tracking-[0.2em] text-muted">
              controls
            </h2>
            <button
              type="button"
              onClick={onRandomize}
              className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 font-mono text-[10px] font-bold text-ink transition-colors duration-100 hover:border-magenta/50 hover:text-magenta"
            >
              <Shuffle aria-hidden="true" className="h-3.5 w-3.5" />
              Randomize fit
            </button>
          </div>

          {/* pattern */}
          <div className="mt-4">
            <p className="font-mono text-[10px] tracking-wide text-muted">
              pattern
            </p>
            <div className="mt-2 grid grid-cols-3 gap-1">
              {PATTERNS.map((p) => (
                <PatternSwatch
                  key={p.id}
                  id={p.id}
                  active={patternId === p.id}
                  onClick={() => {
                    setPatternId(p.id);
                    setPunch((x) => x + 1);
                  }}
                />
              ))}
            </div>
          </div>

          {/* spray color */}
          <div className="mt-5">
            <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-wide text-muted">
              <SprayCan aria-hidden="true" className="h-3.5 w-3.5" />
              spray — <span className="text-ink">{color.toUpperCase()}</span>
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {SPRAY_COLORS.map((sc) => (
                <button
                  key={sc.c}
                  type="button"
                  aria-label={`spray ${sc.n}`}
                  aria-pressed={color.toLowerCase() === sc.c}
                  onClick={() => {
                    setColor(sc.c);
                    setPunch((x) => x + 1);
                  }}
                  className={`h-9 w-9 rounded-full border transition-transform duration-100 active:scale-95 ${
                    color.toLowerCase() === sc.c
                      ? "border-terminal shadow-[0_0_0_3px_rgba(127,255,158,0.25)]"
                      : "border-line hover:border-ink/40"
                  }`}
                  style={{ backgroundColor: sc.c }}
                />
              ))}
              <label className="relative flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-line transition-colors duration-100 hover:border-ink/40">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => {
                    setColor(e.target.value);
                    setPunch((x) => x + 1);
                  }}
                  aria-label="custom spray colour"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <span
                  aria-hidden="true"
                  className="h-3 w-3 rounded-full"
                  style={{
                    background:
                      "conic-gradient(#ff6b35,#e8437a,#7fff9e,#f4efe6,#1e9ea8,#ff6b35)",
                  }}
                />
              </label>
            </div>
          </div>

          {/* text layer */}
          <div className="mt-5">
            <p className="font-mono text-[10px] tracking-wide text-muted">
              stamp a name
            </p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="block">
                <span className="sr-only">stamp name</span>
                <input
                  type="text"
                  value={name}
                  maxLength={20}
                  autoComplete="off"
                  placeholder="name"
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-line bg-void/60 px-3 py-2 font-mono text-sm text-ink placeholder:text-muted/50 focus:border-terminal/60 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="sr-only">stamp team</span>
                <input
                  type="text"
                  value={team}
                  maxLength={20}
                  autoComplete="off"
                  placeholder="team"
                  onChange={(e) => setTeam(e.target.value)}
                  className="w-full rounded-md border border-line bg-void/60 px-3 py-2 font-mono text-sm text-ink placeholder:text-muted/50 focus:border-terminal/60 focus:outline-none"
                />
              </label>
            </div>
            <div className="mt-2 flex gap-1 rounded-lg border border-line bg-void/60 p-1">
              {(["front", "back"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTextSide(s)}
                  aria-pressed={textSide === s}
                  className={`flex-1 rounded-md px-3 py-2 font-mono text-[10px] font-bold tracking-wide transition-colors duration-100 ${
                    textSide === s ? "bg-sunset text-void" : "text-muted hover:text-ink"
                  }`}
                >
                  {s === "front" ? "CHEST" : "BACK"}
                </button>
              ))}
            </div>
          </div>

          {/* photo patch */}
          <div className="mt-5">
            <p className="font-mono text-[10px] tracking-wide text-muted">
              photo badge
            </p>
            <div className="mt-2 flex items-center gap-2">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/heic,image/heif,.jpg,.jpeg,.png,.heic"
                aria-label="Upload a photo for the badge"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onPhoto(f);
                }}
              />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="flex h-10 items-center gap-2 rounded-md border border-line bg-void/60 px-3 font-mono text-[11px] font-bold text-ink transition-colors duration-100 hover:border-ink/40"
              >
                <ImagePlus aria-hidden="true" className="h-4 w-4" />
                {photo ? "Swap photo" : "Add photo"}
              </button>
              {photo && (
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  aria-label="Remove photo badge"
                  className="flex h-10 w-10 items-center justify-center rounded-md border border-line bg-void/60 text-muted transition-colors duration-100 hover:text-magenta"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              )}
              <span className="font-mono text-[10px] text-muted/70">
                stamps on {textSide === "front" ? "chest" : "back"}
              </span>
            </div>
          </div>

          <p className="mt-5 border-t border-line pt-3 font-mono text-[10px] leading-relaxed text-muted/60">
            everything bakes on-device · drag to orbit the shirt · nothing is
            compulsory
          </p>
        </aside>
      </div>
    </section>
  );
}
