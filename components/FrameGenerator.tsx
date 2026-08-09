"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { CardArt } from "@/components/frame/CardArt";
import { renderCardToPng } from "@/components/frame/export";
import { generateQrDataUrl } from "@/components/frame/qr";
import { MAX_FILE_BYTES, looksLikeImage, processPhoto } from "@/components/frame/image";
import type { Orientation, Side, SocialLinks } from "@/components/frame/types";
import { UploadDropzone } from "@/components/UploadDropzone";
import { CardForm } from "@/components/CardForm";
import { SegmentToggle } from "@/components/OrientationToggle";
import { ResultPanel } from "@/components/ResultPanel";
import { Card3DModal } from "@/components/Card3DModal";
import { downloadBlob, persistCard } from "@/lib/share";

type Status = "idle" | "processing" | "ready" | "error";

/** No orientation toggle any more — every card downloads/shares as the
 * portrait, interactive artifact; the X/timeline preview is always
 * generated as landscape separately (see /share's OG image). */
const [orientation, setOrientation] = useState<Orientation>("portrait");

export function FrameGenerator() {
  const [side, setSide] = useState<Side>("front");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [socials, setSocials] = useState<SocialLinks>({});
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [bloom, setBloom] = useState(false);
  const [photoPulse, setPhotoPulse] = useState(0);
  const [textPulse, setTextPulse] = useState(0);
  const [view3DUrl, setView3DUrl] = useState<string | null>(null);
  const [view3DBackUrl, setView3DBackUrl] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  // a fresh random seed per photo upload — the builder number/barcode are
  // randomized per card, not derived from name/role
  const [builderSeed, setBuilderSeed] = useState("");
  const hasCelebrated = useRef(false);
  const view3DUrlRef = useRef<string | null>(null);
  const view3DBackUrlRef = useRef<string | null>(null);

  const buildSharePath = useCallback(
    () => `/share?side=${side}&name=${encodeURIComponent(name)}&role=${encodeURIComponent(role)}`,
    [side, name, role],
  );

  useEffect(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://frameingoa.com";
    const timer = setTimeout(() => {
      generateQrDataUrl(`${origin}${buildSharePath()}`).then(setQrDataUrl);
    }, 350);
    return () => clearTimeout(timer);
  }, [buildSharePath]);

  const onPickFile = useCallback(async (file: File) => {
    console.info("[photo] selected:", {
      name: file.name,
      type: file.type || "(empty)",
      size: file.size,
      lastModified: file.lastModified,
    });
    if (!looksLikeImage(file)) {
      setStatus("error");
      setError("That file doesn't look like an image. Try JPG, PNG, WebP, or HEIC.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setStatus("error");
      setError("That photo is over 25MB. Pick a smaller one, or a compressed export.");
      return;
    }
    setStatus("processing");
    setError(null);
    setBusy(true);
    try {
      const dataUrl = await processPhoto(file);
      const t0 = performance.now();
      const wait = Math.max(0, 360 - (performance.now() - t0));
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      setPhotoDataUrl(dataUrl);
      setPhotoPulse((k) => k + 1);
      setBuilderSeed(`${Date.now()}-${Math.random()}`);
      setStatus("ready");
      if (!hasCelebrated.current) {
        hasCelebrated.current = true;
        setBloom(true);
      }
    } catch (err) {
      console.error("[photo] decode failed:", err);
      const reason = err instanceof Error && err.message ? err.message : String(err);
      setStatus("error");
      setError(`Couldn't read that image on this device (${reason}). Try another, or convert to JPG/PNG first.`);
    } finally {
      setBusy(false);
    }
  }, []);

  const reset = useCallback(() => {
    setPhotoDataUrl(null);
    setStatus("idle");
    setError(null);
    setGenError(null);
    setBloom(false);
    hasCelebrated.current = false;
  }, []);

  const buildFileName = useCallback((ext: string) => `frameingoa-${side}-${Date.now()}.${ext}`, [side]);

  const onDownload = useCallback(async () => {
    if (!photoDataUrl) return;
    setBusy(true);
    try {
      const blob = await renderCardToPng({ orientation, side, name, role, socials, photoDataUrl, qrDataUrl, builderSeed });
      downloadBlob(blob, buildFileName("png"));
    } finally {
      setBusy(false);
    }
  }, [photoDataUrl, side, name, role, socials, qrDataUrl, builderSeed, buildFileName]);

  const onGenerate = useCallback(async () => {
    if (!photoDataUrl) return;
    setBusy(true);
    setGenError(null);
    try {
      // persist all three real outputs to the backend (Supabase record +
      // ImageKit-hosted PNGs) so the generated card gets its own unique
      // /card/[id] page with the interactive 3D badge and a proper
      // landscape OG image. Then send the user straight there.
      // Renders are sequential at scale 2 — three concurrent 3000px PNG
      // encodes blow through mobile memory and freeze the tab, which reads
      // as a dead GENERATE button. Scale 2 (2400px) is still far more than
      // the 3D page (~440px) or OG card (1200px) ever displays.
      const SCALE = 2;
      const render = (over: { orientation?: typeof orientation; side?: Side }) =>
        renderCardToPng({
          orientation,
          side: "front",
          name,
          role,
          socials,
          photoDataUrl,
          qrDataUrl,
          builderSeed,
          scale: SCALE,
          ...over,
        });
      const portraitFront = await render({ side: "front" });
      const portraitBack = await render({ side: "back" });
      const landscapeFront = await render({ orientation: "landscape" });
      const persisted = await persistCard({
        name,
        role,
        socials,
        portraitBlob: portraitFront,
        portraitBackBlob: portraitBack,
        landscapeBlob: landscapeFront,
      });
      if (persisted) {
        // full navigation — the 3D page is server-rendered from the DB record
        window.location.assign(persisted.path);
      } else {
        setGenError("Couldn't save your card right now — check your connection and try again.");
      }
    } catch (err) {
      console.error("[card] generate failed:", err);
      setGenError("Couldn't generate your card right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [photoDataUrl, name, role, socials, qrDataUrl, builderSeed]);

  const onView3D = useCallback(async () => {
    if (!photoDataUrl) return;
    setBusy(true);
    try {
      // the interactive 3D badge shows both real sides — front by default,
      // flips to the real back design (not a blank plane) when spun around
      // sequential + scale 2 keeps mobile memory in check (see onGenerate)
      const frontBlob = await renderCardToPng({ orientation, side: "front", name, role, socials, photoDataUrl, qrDataUrl, builderSeed, scale: 2 });
      const backBlob = await renderCardToPng({ orientation, side: "back", name, role, socials, photoDataUrl, qrDataUrl, builderSeed, scale: 2 });
      const url = URL.createObjectURL(frontBlob);
      const backUrl = URL.createObjectURL(backBlob);
      view3DUrlRef.current = url;
      view3DBackUrlRef.current = backUrl;
      setView3DUrl(url);
      setView3DBackUrl(backUrl);
    } finally {
      setBusy(false);
    }
  }, [photoDataUrl, name, role, socials, qrDataUrl, builderSeed]);

  const closeView3D = useCallback(() => {
    if (view3DUrlRef.current) URL.revokeObjectURL(view3DUrlRef.current);
    if (view3DBackUrlRef.current) URL.revokeObjectURL(view3DBackUrlRef.current);
    view3DUrlRef.current = null;
    view3DBackUrlRef.current = null;
    setView3DUrl(null);
    setView3DBackUrl(null);
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border-2 border-[var(--accent-mustard)]/40 bg-[var(--bg-jungle-deep)]">
      <div className="p-4 sm:p-6">
        {!photoDataUrl && status !== "error" && (
          <UploadDropzone onPick={onPickFile} busy={status === "processing"} />
        )}

        {status === "error" && (
          <div role="alert" className="flex min-h-[220px] flex-col items-center justify-center gap-3 px-6 text-center">
            <X aria-hidden="true" className="h-6 w-6 text-[var(--accent-pink)]" />
            <p className="font-mono text-xs text-[var(--text-cream)]">{error}</p>
            <button
              type="button"
              onClick={reset}
              className="rounded-md border-2 border-[var(--accent-mustard)]/50 px-3 py-2 font-mono text-xs text-[var(--text-cream)]/80 transition-colors duration-100 hover:text-[var(--text-cream)]"
            >
              Try again
            </button>
          </div>
        )}

        {photoDataUrl && status === "ready" && (
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
            <div className="flex flex-col gap-4 lg:w-[300px] lg:flex-none">
              <SegmentToggle
                label="SIDE"
                value={side}
                onChange={setSide}
                options={[
                  { value: "front", label: "FRONT" },
                  { value: "back", label: "BACK" },
                ]}
              />
              <CardForm
                name={name}
                role={role}
                onName={(v) => {
                  setName(v);
                  setTextPulse((k) => k + 1);
                }}
                onRole={(v) => {
                  setRole(v);
                  setTextPulse((k) => k + 1);
                }}
                socials={socials}
                onSocials={(next) => {
                  setSocials(next);
                  setTextPulse((k) => k + 1);
                }}
              />
            </div>

            <div className="flex-1">
              <div
                key={side}
                className="mx-auto w-full max-w-[300px] overflow-hidden rounded-lg border-2 border-[var(--accent-mustard)]/30 shadow-[0_10px_30px_rgba(0,0,0,0.3)] card-flip-in"
              >
                <CardArt
                  orientation={orientation}
                  side={side}
                  name={name}
                  role={role}
                  socials={socials}
                  photoUrl={photoDataUrl}
                  qrDataUrl={qrDataUrl}
                  builderSeed={builderSeed}
                  photoPulseKey={photoPulse}
                  textPulseKey={textPulse}
                  className="h-auto w-full"
                />
              </div>
              <ResultPanel
                onDownload={onDownload}
                onGenerate={onGenerate}
                onView3D={onView3D}
                onReset={reset}
                busy={busy}
                bloom={bloom}
              />
              {genError && (
                <p role="alert" className="mx-auto mt-3 max-w-[420px] text-center font-mono text-[11px] text-[var(--accent-pink)]">
                  {genError}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {view3DUrl && (
        <Card3DModal
          imageUrl={view3DUrl}
          backImageUrl={view3DBackUrl ?? undefined}
          name={name}
          role={role}
          onClose={closeView3D}
        />
      )}
    </div>
  );
}
