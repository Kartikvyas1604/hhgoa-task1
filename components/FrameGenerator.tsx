"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  Download,
  ImagePlus,
  Link2,
  RefreshCw,
  Share2,
  X,
} from "lucide-react";
import { composeFrame, type FrameFormat, type FrameVariant } from "@/components/frame/compose";
import {
  bitmapFromDataUrl,
  bitmapToDataUrl,
  canvasThumbDataUrl,
  processPhoto,
} from "@/components/frame/image";
import { CameraCapture } from "@/components/CameraCapture";
import { SessionGallery } from "@/components/SessionGallery";
import { loadGallery, pushGallery, removeGalleryEntry, type GalleryEntry } from "@/lib/gallery";
import {
  buildCaption,
  buildFrameLink,
  downloadBlob,
  shareToX,
  type FrameLinkParams,
} from "@/lib/share";

type Status = "idle" | "processing" | "ready" | "error";

const ACCEPT = "image/jpeg,image/png,image/heic,image/heif,.jpg,.jpeg,.png,.heic";

const FORMATS: { value: FrameFormat; label: string; hint: string }[] = [
  { value: "pfp", label: "PFP Frame", hint: "1:1" },
  { value: "card", label: "Builder ID Card", hint: "4:5" },
];

const VARIANTS: { value: FrameVariant; label: string; swatch: string }[] = [
  { value: "sunset", label: "Sunset", swatch: "#f9e24c" },
  { value: "jade", label: "Jade", swatch: "#7fff9e" },
  { value: "monsoon", label: "Monsoon", swatch: "#ea3380" },
];

function toPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("png")), undefined), "image/png"),
  );
}

export function FrameGenerator() {
  const [format, setFormat] = useState<FrameFormat>("pfp");
  const [variant, setVariant] = useState<FrameVariant>("sunset");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [image, setImage] = useState<ImageBitmap | null>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [photoKey, setPhotoKey] = useState(0);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [entries, setEntries] = useState<GalleryEntry[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<ImageBitmap | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setEntries(loadGallery()), 0);
    return () => clearTimeout(t);
  }, []);

  const stageRef = useCallback(
    (node: HTMLCanvasElement | null) => {
      if (node && canvas) {
        node.width = canvas.width;
        node.height = canvas.height;
        node.getContext("2d")?.drawImage(canvas, 0, 0);
      }
    },
    [canvas],
  );

  useEffect(() => {
    imageRef.current = image;
  }, [image]);

  useEffect(() => {
    if (!image) return;
    let alive = true;
    const c = document.createElement("canvas");
    const scale = Math.min(1, 480 / Math.max(image.width, image.height));
    c.width = Math.round(image.width * scale);
    c.height = Math.round(image.height * scale);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(image, 0, 0, c.width, c.height);
    c.toBlob((b) => {
      if (alive && b) setThumbUrl(URL.createObjectURL(b));
    });
    return () => {
      alive = false;
    };
  }, [image]);

  useEffect(() => {
    return () => {
      if (thumbUrl) URL.revokeObjectURL(thumbUrl);
    };
  }, [thumbUrl]);

  const runCompose = useCallback(
    async (
      bmp: ImageBitmap,
      fmt: FrameFormat,
      v: FrameVariant,
      n: string,
      r: string,
      showProcessing: boolean,
    ): Promise<HTMLCanvasElement> => {
      const id = ++seq.current;
      if (showProcessing) setStatus("processing");
      const t0 = performance.now();
      const c = await composeFrame({ format: fmt, variant: v, image: bmp, name: n, role: r });
      const wait = showProcessing ? Math.max(0, 340 - (performance.now() - t0)) : 0;
      if (wait > 0) await new Promise((res) => setTimeout(res, wait));
      if (seq.current !== id) return c;
      setCanvas(c);
      setStatus("ready");
      return c;
    },
    [],
  );

  const onPickFile = useCallback(
    async (file: File) => {
      if (!/image/i.test(file.type) && !/\.(heic|heif)$/i.test(file.name)) {
        setStatus("error");
        setError("That file doesn't look like an image. Try JPG, PNG, or HEIC.");
        return;
      }
      setStatus("processing");
      setError(null);
      setBusy(true);
      try {
        const bmp = await processPhoto(file);
        setImage(bmp);
        setFileName(file.name);
        setPhotoKey((k) => k + 1);
        const c = await runCompose(bmp, format, variant, name, role, true);
        pushGallery({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          format,
          variant,
          name,
          role,
          fileName: file.name,
          createdAt: Date.now(),
          photo: bitmapToDataUrl(bmp, 1024, 0.8),
          thumb: canvasThumbDataUrl(c),
          linkImg: bitmapToDataUrl(bmp, 128, 0.72),
        });
        setEntries(loadGallery());
      } catch {
        setStatus("error");
        setError(
          "Couldn't read that image. It might be corrupted — try another one.",
        );
      } finally {
        setBusy(false);
      }
    },
    [format, variant, name, role, runCompose],
  );

  useEffect(() => {
    const bmp = imageRef.current;
    if (!bmp) return;
    const id = ++seq.current;
    const t = setTimeout(async () => {
      const c = await composeFrame({ format, variant, image: bmp, name, role });
      if (seq.current === id) setCanvas(c);
    }, 160);
    return () => clearTimeout(t);
  }, [format, variant, name, role]);

  const reset = useCallback(() => {
    setImage(null);
    setThumbUrl(null);
    setCanvas(null);
    setStatus("idle");
    setError(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const onDownload = useCallback(() => {
    if (!canvas) return;
    const stem = format === "pfp" ? "frameingoas-pfp" : "frameingoas-builder-id";
    toPng(canvas).then((blob) => downloadBlob(blob, `${stem}-${Date.now()}.png`));
  }, [canvas, format]);

  const onShare = useCallback(async () => {
    if (!canvas) return;
    const text =
      format === "pfp"
        ? "Sun's up. My HH Goa 2026 PFP frame is ready."
        : "All set for HH Goa 2026 — my Builder ID is locked in.";
    const caption = buildCaption(text);
    const stem = format === "pfp" ? "frameingoas-pfp" : "frameingoas-builder-id";
    const ogPath = `/og?format=${format}&variant=${variant}&name=${encodeURIComponent(
      name,
    )}&role=${encodeURIComponent(role)}`;
    const png = await toPng(canvas);
    await shareToX({
      caption,
      file: png,
      fileName: `${stem}-${Date.now()}.png`,
      ogPath,
    });
  }, [canvas, format, variant, name, role]);

  const composeFromEntry = useCallback(async (entry: GalleryEntry) => {
    const bmp = await bitmapFromDataUrl(entry.photo);
    return composeFrame({
      format: entry.format,
      variant: entry.variant,
      image: bmp,
      name: entry.name,
      role: entry.role,
    });
  }, []);

  const onGalleryDownload = useCallback(
    async (entry: GalleryEntry) => {
      const c = await composeFromEntry(entry);
      const stem =
        entry.format === "pfp" ? "frameingoas-pfp" : "frameingoas-builder-id";
      const png = await toPng(c);
      downloadBlob(png, `${stem}-${entry.createdAt}.png`);
    },
    [composeFromEntry],
  );

  const onGalleryShare = useCallback(
    async (entry: GalleryEntry) => {
      const text =
        entry.format === "pfp"
          ? "Sun's up. My HH Goa 2026 PFP frame is ready."
          : "All set for HH Goa 2026 — my Builder ID is locked in.";
      const caption = buildCaption(text);
      const stem =
        entry.format === "pfp" ? "frameingoas-pfp" : "frameingoas-builder-id";
      const ogPath = `/og?format=${entry.format}&variant=${entry.variant}&name=${encodeURIComponent(
        entry.name,
      )}&role=${encodeURIComponent(entry.role)}`;
      const c = await composeFromEntry(entry);
      const png = await toPng(c);
      await shareToX({
        caption,
        file: png,
        fileName: `${stem}-${entry.createdAt}.png`,
        ogPath,
      });
    },
    [composeFromEntry],
  );

  const onCopyLink = useCallback(
    async (id: string, params: FrameLinkParams) => {
      const link = buildFrameLink(params);
      try {
        await navigator.clipboard.writeText(link);
      } catch {
        window.prompt("Copy your frame link:", link);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    },
    [],
  );

  const onGalleryCopyLink = useCallback(
    (entry: GalleryEntry) =>
      onCopyLink(entry.id, {
        format: entry.format,
        variant: entry.variant,
        name: entry.name,
        role: entry.role,
        img: entry.linkImg,
      }),
    [onCopyLink],
  );

  const onGalleryReuse = useCallback(
    async (entry: GalleryEntry) => {
      setBusy(true);
      setError(null);
      try {
        const bmp = await bitmapFromDataUrl(entry.photo);
        setImage(bmp);
        setFileName(entry.fileName);
        setFormat(entry.format);
        setVariant(entry.variant);
        setName(entry.name);
        setRole(entry.role);
        setPhotoKey((k) => k + 1);
        await runCompose(bmp, entry.format, entry.variant, entry.name, entry.role, true);
      } catch {
        setStatus("error");
        setError("Couldn't reload that frame — try a fresh photo.");
      } finally {
        setBusy(false);
      }
    },
    [runCompose],
  );

  const onGalleryDelete = useCallback((id: string) => {
    setEntries(removeGalleryEntry(id));
  }, []);

  const onCopyFrameLink = useCallback(() => {
    const bmp = imageRef.current;
    const img = bmp ? bitmapToDataUrl(bmp, 128, 0.72) : undefined;
    onCopyLink("__current__", { format, variant, name, role, img });
  }, [format, variant, name, role, onCopyLink]);

  const aspect = format === "pfp" ? "aspect-square" : "aspect-[4/5]";

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel">
      {/* terminal chrome */}
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-sunset" />
          <span className="h-2.5 w-2.5 rounded-full bg-magenta/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted/40" />
        </div>
        <p className="font-mono text-[10px] tracking-tight text-muted">
          {fileName ? `~/uploads/${fileName}` : "~/frameingoas — generator"}
        </p>
        {status === "ready" && (
          <button
            type="button"
            onClick={reset}
            className="flex min-h-9 items-center gap-1 rounded-sm px-2.5 py-1.5 font-mono text-[10px] text-muted transition-colors duration-150 hover:text-ink"
          >
            <RefreshCw aria-hidden="true" className="h-3 w-3" />
            New photo
          </button>
        )}
      </div>

      <div className="p-3 sm:p-4">
        {/* format toggle */}
        <div
          aria-label="Frame format"
          className="grid grid-cols-2 gap-1 rounded-lg border border-line bg-void/60 p-1"
        >
          {FORMATS.map((f) => {
            const active = format === f.value;
            return (
              <button
                key={f.value}
                type="button"
                aria-pressed={active}
                onClick={() => setFormat(f.value)}
                className={`flex items-center justify-between gap-2 rounded-md px-3 py-2.5 transition-colors duration-100 ${
                  active
                    ? f.value === "pfp"
                      ? "bg-sunset text-void"
                      : "bg-magenta text-void"
                    : "text-muted hover:text-ink"
                }`}
              >
                <span className="font-mono text-[11px] font-bold tracking-wide sm:text-xs">
                  {f.label}
                </span>
                <span
                  className={`font-mono text-[10px] ${
                    active ? "text-void/70" : "text-muted/70"
                  }`}
                >
                  {f.hint}
                </span>
              </button>
            );
          })}
        </div>

        {/* variant picker */}
        <div
          aria-label="Design variant"
          className="mt-2 grid grid-cols-3 gap-1 rounded-lg border border-line bg-void/60 p-1"
        >
          {VARIANTS.map((v) => {
            const active = variant === v.value;
            return (
              <button
                key={v.value}
                type="button"
                aria-pressed={active}
                onClick={() => setVariant(v.value)}
                className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-2 font-mono text-[10px] transition-colors duration-100 sm:text-[11px] ${
                  active
                    ? "bg-ink/10 text-ink"
                    : "text-muted hover:text-ink"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: v.swatch }}
                />
                {v.label}
              </button>
            );
          })}
        </div>

        {/* ID fields — format B only, inline */}
        {format === "card" && (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] tracking-wide text-muted">
                name<span className="text-muted/60"> · optional</span>
              </span>
              <input
                type="text"
                value={name}
                maxLength={26}
                autoComplete="off"
                placeholder="Priya Sharma"
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-line bg-void/60 px-3 py-2.5 font-mono text-sm text-ink placeholder:text-muted/50 focus:border-terminal/60 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] tracking-wide text-muted">
                stack / role<span className="text-muted/60"> · optional</span>
              </span>
              <input
                type="text"
                value={role}
                maxLength={32}
                autoComplete="off"
                placeholder="Rust · @0xkartik"
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-md border border-line bg-void/60 px-3 py-2.5 font-mono text-sm text-ink placeholder:text-muted/50 focus:border-terminal/60 focus:outline-none"
              />
            </label>
          </div>
        )}

        {/* stage */}
        <div className="mt-3">
          {!image && status !== "error" ? (
            <>
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload a photo"
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    inputRef.current?.click();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) onPickFile(file);
                }}
                className={`group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center transition-colors duration-150 sm:min-h-[260px] ${
                  drag
                    ? "border-sunset bg-sunset/10"
                    : "border-muted/30 bg-void/40 hover:border-sunset/60"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPT}
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onPickFile(file);
                  }}
                />
                <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-line bg-panel transition-transform duration-150 group-hover:-translate-y-0.5">
                  <ImagePlus
                    aria-hidden="true"
                    className="h-6 w-6 text-sunset"
                  />
                </span>
                <div>
                  <p className="font-mono text-sm font-bold tracking-wide text-ink">
                    Drop image or tap to browse
                  </p>
                  <p className="mt-1 flex items-center justify-center gap-1.5 font-mono text-[11px] text-muted">
                    <Camera aria-hidden="true" className="h-3.5 w-3.5" />
                    camera roll · JPG / PNG / HEIC
                  </p>
                </div>
                <p className="absolute bottom-3 font-mono text-[10px] tracking-wider text-muted/50">
                  ▸ HEIC converts on-device · nothing leaves your browser
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCameraOpen(true)}
                className="mx-auto mt-2 flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 font-mono text-[10px] text-muted transition-colors duration-150 hover:text-ink"
              >
                <Camera aria-hidden="true" className="h-3.5 w-3.5" />
                or snap one with your camera
              </button>
            </>
          ) : status === "error" ? (
            <div
              role="alert"
              className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border border-magenta/40 bg-void/40 px-6 py-10 text-center"
            >
              <X aria-hidden="true" className="h-6 w-6 text-magenta" />
              <p className="font-mono text-xs text-ink">{error}</p>
              <button
                type="button"
                onClick={reset}
                className="rounded-md border border-line px-3 py-2 font-mono text-xs text-muted transition-colors duration-100 hover:text-ink"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div
                key={`${photoKey}-${format}`}
                className={`relative w-full max-w-[300px] overflow-hidden rounded-lg border border-line bg-void ${aspect} ${
                  status === "ready" && canvas ? "snap-in" : ""
                }`}
              >
                {status === "ready" && canvas ? (
                  <canvas
                    ref={stageRef}
                    role="img"
                    aria-label="Your generated frame preview"
                    className="h-full w-full"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3">
                    {thumbUrl && (
                      // eslint-disable-next-line @next/next/no-img-element -- canvas data URL, not optimisable
                      <img
                        src={thumbUrl}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full scale-105 object-cover opacity-50 blur-[2px]"
                      />
                    )}
                    <p
                      role="status"
                      className="relative font-mono text-xs text-ink"
                    >
                      $ composing_{format === "pfp" ? "pfp" : "builder_id"} ▍
                    </p>
                    <p className="relative font-mono text-[10px] text-muted">
                      smart-cropping… <span className="cursor-blink">▍</span>
                    </p>
                  </div>
                )}
              </div>

              {status === "ready" && canvas && (
                <div className="flex w-full max-w-[300px] flex-col gap-2">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={onDownload}
                      disabled={busy}
                      className="flex h-12 items-center justify-center gap-2 rounded-md border border-line bg-void/60 px-4 font-mono text-xs font-bold tracking-wide text-ink transition-colors duration-100 hover:border-ink/40 active:translate-y-px disabled:opacity-50"
                    >
                      <Download aria-hidden="true" className="h-4 w-4" />
                      Download PNG
                    </button>
                    <button
                      type="button"
                      onClick={onShare}
                      disabled={busy}
                      className="cta-scan flex h-12 items-center justify-center gap-2 rounded-md bg-terminal px-4 font-mono text-xs font-bold tracking-wide text-void transition-colors duration-100 hover:bg-[#9cffba] active:translate-y-px disabled:opacity-50"
                    >
                      <Share2 aria-hidden="true" className="h-4 w-4" />
                      Share to X
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={onCopyFrameLink}
                    disabled={busy}
                    className="flex h-10 items-center justify-center gap-2 rounded-md border border-dashed border-muted/40 px-4 font-mono text-[11px] text-muted transition-colors duration-100 hover:border-terminal/60 hover:text-ink disabled:opacity-50"
                  >
                    <Link2 aria-hidden="true" className="h-3.5 w-3.5" />
                    {copiedId === "__current__"
                      ? "copied — share it anywhere"
                      : "copy hosted link"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <SessionGallery
        entries={entries}
        onDownload={onGalleryDownload}
        onShare={onGalleryShare}
        onCopyLink={onGalleryCopyLink}
        onReuse={onGalleryReuse}
        onDelete={onGalleryDelete}
      />

      {cameraOpen && (
        <CameraCapture
          onCapture={(file) => {
            setCameraOpen(false);
            onPickFile(file);
          }}
          onClose={() => setCameraOpen(false)}
        />
      )}
    </div>
  );
}
